// server/src/core/systems/GameLoop.js
import { TICK_RATE } from '../../../../shared/constants.js';

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

    // ===== 资源产出系统 =====
    const production = {};
    for (const [resId, rate] of Object.entries(empire.resources.productionRates)) {
      const bonus = empire.buildings.calculateProductionBonus(resId);
      production[resId] = rate * bonus;
    }

    for (const [resId, finalRate] of Object.entries(production)) {
      empire.resources.setProductionRate(resId, finalRate);
    }
    
    empire.resources.produce(deltaTime / 3600);

    // ===== 军队系统更新 =====
    if (empire.army) {
      this.updateArmy(empire, deltaTime);
    }

    // 触发资源更新事件（每5秒通知一次客户端）
    if (this.gameWorld.tick % 5 === 0 && empire.socketId) {
      const io = empire._io;
      if (io) {
        io.to(empire.socketId).emit('resource:update', empire.resources.getSnapshot());
        
        // 同时发送军队更新
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
      // 通知客户端训练完成
      for (const task of completedTasks) {
        empire._io.to(empire.socketId).emit('army:trainingCompleted', {
          task,
          army: army.getSnapshot(),
        });
      }
    }

    // 2. 计算军队粮食消耗
    const foodConsumption = army.calculateFoodConsumption(); // 每小时消耗
    const foodConsumed = foodConsumption * (deltaTime / 3600);
    
    if (foodConsumed > 0) {
      const hasEnoughFood = empire.resources.consume('food', foodConsumed);
      
      if (!hasEnoughFood) {
        // 粮食不足，降低士气
        const moralePenalty = (foodConsumed / Math.max(1, empire.resources.get('food'))) * 10;
        army.updateMorale(-moralePenalty);
        
        // 如果士气过低，通知客户端
        if (army.morale < 30 && empire.socketId && empire._io) {
          empire._io.to(empire.socketId).emit('army:moraleWarning', {
            morale: army.morale,
            message: '粮食不足，军队士气低落！'
          });
        }
      } else {
        // 粮食充足，缓慢恢复士气
        if (army.morale < 100) {
          army.updateMorale(deltaTime / 60); // 每分钟恢复1点
        }
      }
    }

    // 3. 处理伤病恢复（如果有医院建筑）
    const hospitalLevel = empire.buildings?.getLevel('hospital') || 0;
    if (hospitalLevel > 0) {
      const healRate = hospitalLevel * 5; // 每小时恢复5个/级
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
   * 更新NPC（简单逻辑）
   */
  updateNpc(npc, deltaTime) {
    if (npc.resources) {
      npc.resources.produce(deltaTime / 3600);
    }
    
    // NPC军队简单恢复（如果是NPC势力）
    if (npc.army && npc.army.morale < 100) {
      npc.army.updateMorale(deltaTime / 120); // NPC士气恢复更慢
    }
  }
}