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

    // 更新所有帝国（资源产出）
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

    // 计算产出加成
    const production = {};
    for (const [resId, rate] of Object.entries(empire.resources.productionRates)) {
      const bonus = empire.buildings.calculateProductionBonus(resId);
      production[resId] = rate * bonus;
    }

    // 更新产出速率并执行产出
    for (const [resId, finalRate] of Object.entries(production)) {
      empire.resources.setProductionRate(resId, finalRate);
    }
    
    // 执行产出（deltaTime 转换为小时）
    empire.resources.produce(deltaTime / 3600);

    // 触发资源更新事件（每5秒通知一次客户端，避免过于频繁）
    if (this.gameWorld.tick % 5 === 0 && empire.socketId) {
      const io = empire._io; // 通过闭包或全局获取 io 实例
      if (io) {
        io.to(empire.socketId).emit('resource:update', empire.resources.getSnapshot());
      }
    }
  }

  /**
   * 更新NPC（简单逻辑）
   */
  updateNpc(npc, deltaTime) {
    // NPC 资源再生、反击逻辑等
    if (npc.resources) {
      npc.resources.produce(deltaTime / 3600);
    }
  }
}