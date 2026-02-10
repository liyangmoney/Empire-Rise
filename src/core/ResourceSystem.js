// src/core/ResourceSystem.js
import { RESOURCE_TYPES, RESOURCE_CATEGORIES } from './ResourceTypes.js';

/**
 * 资源系统核心类
 * 模拟：资源存储、产出、消耗、仓库防护
 */
export class ResourceSystem {
  constructor() {
    // 初始化资源库存（默认为0）
    this.resources = {};
    Object.values(RESOURCE_TYPES).forEach(r => {
      this.resources[r.id] = { amount: 0, maxStorage: 0 };
    });

    // 仓库配置
    this.warehouses = {
      basic: { level: 1, maxCapacity: 1000 },   // 基础资源仓库
      special: { level: 1, maxCapacity: 500 },  // 特殊资源仓库
    };

    // 防护系数（0.0 ~ 1.0），影响被掠夺时的损失比例
    this.protectionFactor = 0.1; // 默认10%损失（90%保护）
  }

  /**
   * 设置仓库等级（影响容量）
   * @param {string} type 'basic' | 'special'
   * @param {number} level
   */
  upgradeWarehouse(type, level) {
    if (type === 'basic') {
      this.warehouses.basic.level = Math.max(1, level);
      this.warehouses.basic.maxCapacity = 1000 * Math.pow(1.5, level - 1); // 每级+50%
    } else if (type === 'special') {
      this.warehouses.special.level = Math.max(1, level);
      this.warehouses.special.maxCapacity = 500 * Math.pow(1.5, level - 1);
    }
  }

  /**
   * 设置防护系数（通过科技升级）
   * @param {number} factor 0.0 ~ 1.0（越小，保护越好）
   */
  setProtection(factor) {
    this.protectionFactor = Math.max(0.0, Math.min(1.0, factor));
  }

  /**
   * 添加资源（用于采集、任务奖励等）
   * @param {string} resourceId
   * @param {number} amount
   * @returns {boolean} 是否成功（受仓库容量限制）
   */
  add(resourceId, amount) {
    if (amount <= 0) return false;
    const res = this.resources[resourceId];
    if (!res) throw new Error(`Unknown resource: ${resourceId}`);

    const isBasic = RESOURCE_TYPES[resourceId].category === RESOURCE_CATEGORIES.BASIC;
    const warehouse = isBasic ? this.warehouses.basic : this.warehouses.special;
    const newAmount = res.amount + amount;

    // 检查是否超仓
    if (newAmount > warehouse.maxCapacity) {
      // 只添加可容纳部分
      const added = warehouse.maxCapacity - res.amount;
      if (added > 0) {
        res.amount = warehouse.maxCapacity;
        return true;
      }
      return false; // 完全溢出
    }

    res.amount = newAmount;
    return true;
  }

  /**
   * 消耗资源（用于建造、训练等）
   * @param {string} resourceId
   * @param {number} amount
   * @returns {boolean} 是否成功
   */
  consume(resourceId, amount) {
    if (amount <= 0) return false;
    const res = this.resources[resourceId];
    if (!res) throw new Error(`Unknown resource: ${resourceId}`);
    if (res.amount < amount) return false;

    res.amount -= amount;
    return true;
  }

  /**
   * 模拟NPC掠夺（按防护系数损失）
   * @param {string} resourceId
   * @param {number} amountRequested
   * @returns {number} 实际损失量
   */
  raid(resourceId, amountRequested) {
    const res = this.resources[resourceId];
    if (!res) return 0;

    const actualLoss = Math.min(amountRequested, res.amount) * this.protectionFactor;
    const lossInt = Math.floor(actualLoss);
    res.amount = Math.max(0, res.amount - lossInt);
    return lossInt;
  }

  /**
   * 获取当前资源量
   * @param {string} resourceId
   * @returns {number}
   */
  get(resourceId) {
    return this.resources[resourceId]?.amount || 0;
  }

  /**
   * 获取所有资源状态
   * @returns {Object}
   */
  getAll() {
    return Object.fromEntries(
      Object.entries(this.resources).map(([id, data]) => [id, data.amount])
    );
  }

  /**
   * 模拟周期性产出（如建筑自动产出）
   * @param {Object} productionRates { wood: 10, food: 5, ... }
   */
  produce(productionRates) {
    for (const [id, rate] of Object.entries(productionRates)) {
      if (rate > 0) this.add(id, rate);
    }
  }
}