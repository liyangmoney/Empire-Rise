// server/src/core/systems/GameLoop.js
import { TICK_RATE } from '../../../../shared/constants.js';
import { GAME_TIME } from '../../../../shared/timeConfig.js';

/**
 * 游戏主循环 - 统一管理所有 ECS 系统的更新
 * 每秒 TICK_RATE 次心跳
 */
export class GameLoop {
  constructor(gameWorld) {
    this.gameWorld = gameWorld;
    this.isRunning = false;
    this.lastTick = Date.now();
    this.intervalId = null;
  }

  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    
    console.log('🎮 GameLoop started');
    
    this.intervalId = setInterval(() => {
      this.tick();
    }, TICK_RATE);
  }

  stop() {
    this.isRunning = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    console.log('🛑 GameLoop stopped');
  }

  tick() {
    const now = Date.now();
    const deltaTime = (now - this.lastTick) / 1000; // 秒
    this.lastTick = now;
    this.gameWorld.tick++;

    // 更新时间系统和检查新的一天
    for (const empire of this.gameWorld.empires.values()) {
      if (empire.time) {
        // 检查新的一天
        const isNewDay = empire.time.checkNewDayEvents();
        if (isNewDay) {
          // 新的一天触发日常任务刷新
          empire.tasks.refreshDailyTasks();
        }
      }
    }

    // 更新所有帝国（资源产出 + 军队系统）
    for (const empire of this.gameWorld.empires.values()) {
      this.updateEmpire(empire, deltaTime);
    }

    // 更新所有NPC（简单AI）
    for (const npc of this.gameWorld.npcs.values()) {
      this.updateNpc(npc, deltaTime);
    }
  }

  /**
   * 更新单个帝国
   */
  updateEmpire(empire, deltaTime) {
    if (!empire.resources || !empire.buildings) return;

    // 考虑时间加速的产出
    const timeScale = empire.time?.speed || 1;
    const adjustedDelta = deltaTime * timeScale;

    // 计算产出加成
    const production = {};
    for (const [resId, rate] of Object.entries(empire.resources.productionRates)) {
      const bonus = empire.buildings.calculateProductionBonus(resId);
      production[resId] = rate * bonus * timeScale;
    }

    // 更新产出速率并执行产出
    for (const [resId, finalRate] of Object.entries(production)) {
      empire.resources.setProductionRate(resId, finalRate);
    }
    
    // 执行产出（考虑时间加速）
    empire.resources.produce(adjustedDelta / 3600);

    // ===== 军队系统更新 =====
    if (empire.army) {
      this.updateArmy(empire, adjustedDelta);
    }

    // 触发资源更新事件（每5秒）
    if (this.gameWorld.tick % 5 === 0 && empire.socketId) {
      const io = empire._io;
      if (io) {
        const timeSnapshot = empire.time?.getSnapshot();
        io.to(empire.socketId).emit('time:update', timeSnapshot);
        io.to(empire.socketId).emit('resource:update', empire.resources.getSnapshot());
        
        if (empire.army) {
          io.to(empire.socketId).emit('army:update', empire.army.getSnapshot());
        }
      }
    }
  }

  /**
   * 更新军队系统
   */
  updateArmy(empire, deltaTime) {
    const army = empire.army;
    
    // 1. 处理训练队列
    const completedTasks = army.processTrainingQueue();
    if (completedTasks.length > 0 && empire.socketId && empire._io) {
      for (const task of completedTasks) {
        empire._io.to(empire.socketId).emit('army:trainingCompleted', {
          task,
          army: army.getSnapshot(),
        });
      }
    }

    // 2. 计算军队粮食消耗
    const foodConsumption = army.calculateFoodConsumption();
    const foodConsumed = foodConsumption * (deltaTime / 3600);
    
    if (foodConsumed > 0) {
      const hasEnoughFood = empire.resources.consume('food', foodConsumed);
      
      if (!hasEnoughFood) {
        const moralePenalty = (foodConsumed / Math.max(1, empire.resources.get('food'))) * 10;
        army.updateMorale(-moralePenalty);
        
        if (army.morale < 30 && empire.socketId && empire._io) {
          empire._io.to(empire.socketId).emit('army:moraleWarning', {
            morale: army.morale,
            message: '粮食不足，军队士气低落！'
          });
        }
      } else {
        if (army.morale < 100) {
          army.updateMorale(deltaTime / 60);
        }
      }
    }

    // 3. 处理伤病恢复
    const hospitalLevel = empire.buildings?.getLevel('hospital') || 0;
    if (hospitalLevel > 0) {
      const healRate = hospitalLevel * 5;
      for (const unitTypeId of Object.keys(army.woundedUnits)) {
        if (army.woundedUnits[unitTypeId] > 0) {
          const toHeal = Math.min(
            army.woundedUnits[unitTypeId],
            Math.ceil(healRate * (deltaTime / 3600))
          );
          if (toHeal > 0) {
            army.healWounded(unitTypeId, toHeal);
          }
        }
      }
    }
  }

  /**
   * 更新NPC
   */
  updateNpc(npc, deltaTime) {
    if (npc.resources) {
      npc.resources.produce(deltaTime / 3600);
    }
    
    if (npc.army && npc.army.morale < 100) {
      npc.army.updateMorale(deltaTime / 120);
    }
  }
}