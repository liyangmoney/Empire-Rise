// server/src/core/systems/GameLoop.js
import { TICK_RATE, AGRICULTURE_TECHS } from '../../../../shared/constants.js';
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

    // 更新所有帝国（资源产出 + 军队系统 + 科技研究）
    for (const empire of this.gameWorld.empires.values()) {
      this.updateEmpire(empire, deltaTime);
      // 更新科技研究进度
      if (empire.tech) {
        const result = empire.tech.update(deltaTime * 1000); // 转换为毫秒
        if (result?.completed && empire.socketId && empire._io) {
          const tech = AGRICULTURE_TECHS[result.completed];
          empire._io.to(empire.socketId).emit('tech:researchCompleted', {
            techId: result.completed,
            tech: tech ? { name: tech.name, effect: tech.effect } : null
          });
        }
      }
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

    // 执行产出（直接根据建筑等级计算）
    const productionRates = {
      wood: empire.buildings.getProductionRate('wood'),
      food: empire.buildings.getProductionRate('food'),
      stone: empire.buildings.getProductionRate('stone'),
      iron: empire.buildings.getProductionRate('iron'),
      crystal: empire.buildings.getProductionRate('crystal')
    };

    for (const [resId, rate] of Object.entries(productionRates)) {
      if (rate > 0) {
        const actualRate = rate * timeScale;
        empire.resources.add(resId, actualRate * (adjustedDelta / 3600));
      }
    }

    // ===== 特殊资源产出（鱼塘、果园）=====
    this.updateSpecialResources(empire, adjustedDelta, timeScale);

    // ===== 建筑系统更新 =====
    if (empire.buildings) {
      const completedUpgrades = empire.buildings.processUpgradeQueue(deltaTime, timeScale);
      
      // 通知客户端升级完成
      if (completedUpgrades.length > 0 && empire.socketId && empire._io) {
        for (const task of completedUpgrades) {
          // 释放占用的人口
          if (task.populationCost > 0 && empire.population) {
            empire.population.release(task.populationCost);
          }
          
          // 更新仓库容量
          if (task.buildingTypeId === 'warehouse_basic') {
            const level = empire.buildings.getLevel('warehouse_basic');
            for (const resId of ['wood', 'stone', 'food']) {
              empire.resources.storage[resId].maxCapacity = 10000 * Math.pow(1.5, level - 1);
            }
          }
          
          // 更新任务进度
          if (empire.tasks) {
            empire.tasks.updateProgress('upgradeBuilding', 1);
          }

          empire._io.to(empire.socketId).emit('building:upgradeCompleted', {
            task,
            buildings: empire.buildings.getSnapshot(),
            upgradeQueue: empire.buildings.upgradeQueue || [],
            resources: empire.resources.getSnapshot(empire.buildings),
            population: empire.population?.getSnapshot()
          });
        }
      }
    }

    // ===== 人口系统更新 =====
    if (empire.population) {
      // 自然增长
      const hoursElapsed = deltaTime / 3600;
      empire.population.grow(hoursElapsed * timeScale);
      
      // 每5秒广播人口更新
      if (Math.floor(Date.now() / 5000) % 1 === 0 && empire.socketId && empire._io) {
        empire._io.to(empire.socketId).emit('population:update', empire.population.getSnapshot());
      }
    }

    // ===== 军队系统更新 =====
    if (empire.army) {
      this.updateArmy(empire, adjustedDelta);
    }

    // ===== 检查游戏内新的一天 =====
    if (empire.time) {
      const currentGameDay = Math.floor(empire.time.getCurrentGameTime() / 86400);
      if (empire.tasks && empire.tasks.lastDailyRefresh !== currentGameDay) {
        const refreshed = empire.tasks.refreshDailyTasks(currentGameDay);
        if (refreshed && empire.socketId && empire._io) {
          empire._io.to(empire.socketId).emit('task:dailyRefreshed', {
            dailyTasks: empire.tasks.dailyTasks
          });
        }
      }
    }

    // 触发资源和时间更新事件（每秒）
    if (this.gameWorld.tick % 1 === 0) {
      for (const e of this.gameWorld.empires.values()) {
        if (e.socketId && e.time) {
          const io = e._io;
          if (io) {
            const timeSnapshot = e.time.getSnapshot();
            // 调试：每秒打印一次时间数据
            if (this.gameWorld.tick % 5 === 0) {
              console.log(`[TimeSync] Sending: ${timeSnapshot.gameDate} ${timeSnapshot.realTime}`);
            }
            io.to(e.socketId).emit('time:update', timeSnapshot);

            if (e.army) {
              io.to(e.socketId).emit('army:update', e.army.getSnapshot());
            }
          }
        }
      }
    }

    // 触发资源更新事件（每5秒）
    if (this.gameWorld.tick % 5 === 0) {
      for (const empire of this.gameWorld.empires.values()) {
        if (empire.socketId) {
          const io = empire._io;
          if (io) {
            io.to(empire.socketId).emit('resource:update', empire.resources.getSnapshot(empire.buildings));

            if (empire.army) {
              io.to(empire.socketId).emit('army:update', empire.army.getSnapshot());
            }
          }
        }
      }
    }
  }

  /**
   * 更新军队系统
   */
  updateArmy(empire, deltaTime) {
    const army = empire.army;
    const timeScale = empire.time?.speed || 1;

    // 1. 处理训练队列（考虑时间加速）
    // 时间加速时，训练进度也加快
    if (army.trainingQueue.length > 0) {
      for (const task of army.trainingQueue) {
        if (!task.completed) {
          // 根据时间加速推进训练进度
          // 实际经过的时间 × 时间倍率 = 游戏内经过的时间
          const gameTimeElapsed = deltaTime * timeScale * 1000; // 转换为毫秒
          task._progress = (task._progress || 0) + gameTimeElapsed;

          if (task._progress >= task.duration) {
            task.completed = true;
            army.addUnits(task.unitTypeId, task.count);

            // 通知客户端
            if (empire.socketId && empire._io) {
              empire._io.to(empire.socketId).emit('army:trainingCompleted', {
                task,
                army: army.getSnapshot(),
              });
            }
          }
        }
      }
      // 清理已完成的任务
      army.trainingQueue = army.trainingQueue.filter(t => !t.completed);
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
   * 更新特殊资源产出（鱼塘、果园）
   */
  updateSpecialResources(empire, deltaTime, timeScale) {
    if (!empire.buildings || !empire.resources) return;

    // 获取科技加成
    const techEffects = empire.tech?.getEffects?.() || {};

    // ===== 鱼塘产出 =====
    const fisheryLevel = empire.buildings.getLevel('fishery');
    if (fisheryLevel > 0) {
      // 基础鱼产品产出概率：每级0.5%/小时
      const baseFishChance = 0.005 * fisheryLevel;
      const techBonus = techEffects.fishProductChance || 0;
      const fishChance = (baseFishChance + techBonus) * timeScale;

      // 每小时尝试产出
      const hoursElapsed = deltaTime / 3600;
      if (Math.random() < fishChance * hoursElapsed) {
        const baseAmount = 1;
        const techBonusAmount = techEffects.fishProductBonus || 0;
        const amount = Math.max(1, Math.floor(baseAmount * (1 + techBonusAmount)));
        empire.resources.add('fish_product', amount);
      }
    }

    // ===== 果园产出 =====
    const orchardLevel = empire.buildings.getLevel('orchard');
    if (orchardLevel > 0) {
      // 基础水果产出概率：每级0.5%/小时
      const baseFruitChance = 0.005 * orchardLevel;
      const techBonus = techEffects.fruitChance || 0;
      const fruitChance = (baseFruitChance + techBonus) * timeScale;

      // 每小时尝试产出
      const hoursElapsed = deltaTime / 3600;
      if (Math.random() < fruitChance * hoursElapsed) {
        empire.resources.add('fruit', 1);
      }
    }

    // ===== 精品食材合成 =====
    if (techEffects.enablePremiumFood) {
      const fishProd = empire.resources.get('fish_product');
      const fruit = empire.resources.get('fruit');

      // 每10个鱼产品 + 10个水果 = 1个精品食材
      if (fishProd >= 10 && fruit >= 10) {
        const canCraft = Math.min(Math.floor(fishProd / 10), Math.floor(fruit / 10));
        if (canCraft > 0) {
          empire.resources.consume('fish_product', canCraft * 10);
          empire.resources.consume('fruit', canCraft * 10);
          empire.resources.add('premium_food', canCraft);
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