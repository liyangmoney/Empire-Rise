// server/src/core/components/ResourceComponent.js
import { RESOURCE_TYPES } from '../../../../shared/constants.js';

/**
 * 资源组件 - 管理实体的所有资源
 * 可附加到：玩家、帝国、NPC据点、城邦
 */
export class ResourceComponent {
  constructor() {
    // 初始化所有资源为0
    this.storage = {};
    Object.values(RESOURCE_TYPES).forEach(type => {
      this.storage[type.id] = {
        amount: 0,
        maxCapacity: type.category === 'basic' ? 1000 : 500
      };
    });
    
    // 产出速率（每小时）
    this.productionRates = {
      wood: 0,
      food: 0,
      stone: 0,
      iron: 0,
      crystal: 0
    };
    
    // 防护系数（0-1，越小保护越好）
    this.protectionFactor = 0.1;
  }

  /**
   * 添加资源
   * @returns {Object} { success, added, overflow }
   */
  add(resourceId, amount) {
    if (amount <= 0) return { success: false, added: 0, overflow: 0 };
    
    const slot = this.storage[resourceId];
    if (!slot) throw new Error(`Unknown resource: ${resourceId}`);
    
    const spaceAvailable = slot.maxCapacity - slot.amount;
    const toAdd = Math.min(amount, spaceAvailable);
    const overflow = amount - toAdd;
    
    slot.amount += toAdd;
    
    return {
      success: toAdd > 0,
      added: toAdd,
      overflow: overflow,
      current: slot.amount
    };
  }

  /**
   * 消耗资源
   * @returns {boolean}
   */
  consume(resourceId, amount) {
    if (amount <= 0) return true;
    const slot = this.storage[resourceId];
    if (!slot || slot.amount < amount) return false;
    
    slot.amount -= amount;
    return true;
  }

  /**
   * 检查是否足够
   */
  has(resourceId, amount) {
    return (this.storage[resourceId]?.amount || 0) >= amount;
  }

  /**
   * 批量检查
   */
  hasAll(requirements) {
    for (const [id, amount] of Object.entries(requirements)) {
      if (!this.has(id, amount)) return false;
    }
    return true;
  }

  /**
   * 模拟NPC掠夺
   */
  raid(resourceId, amountRequested) {
    const slot = this.storage[resourceId];
    if (!slot) return 0;
    
    const loss = Math.floor(Math.min(amountRequested, slot.amount) * this.protectionFactor);
    slot.amount -= loss;
    return loss;
  }

  /**
   * 获取资源状态（用于发送给客户端）
   */
  getSnapshot() {
    const snapshot = {};
    for (const [id, data] of Object.entries(this.storage)) {
      snapshot[id] = {
        amount: data.amount,
        max: data.maxCapacity
      };
    }
    return snapshot;
  }

  /**
   * 设置产出速率
   */
  setProductionRate(resourceId, ratePerHour) {
    this.productionRates[resourceId] = Math.max(0, ratePerHour);
  }

  /**
   * 执行一次产出（由 GameLoop 调用）
   */
  produce(deltaHours = 1/3600) { // 默认1秒
    for (const [id, rate] of Object.entries(this.productionRates)) {
      if (rate > 0) {
        this.add(id, rate * deltaHours);
      }
    }
  }
}