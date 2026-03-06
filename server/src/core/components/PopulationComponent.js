// server/src/core/components/PopulationComponent.js
/**
 * 人口组件 - 管理帝国人口
 * 人口用于建筑升级和军队维持
 */
export class PopulationComponent {
  constructor() {
    this.current = 50;     // 初始人口
    this.max = 50;         // 初始人口上限（1级民居）
    this.growthRate = 0;   // 无自然增长
  }

  /**
   * 增加人口上限（建造/升级民居）
   */
  addMax(amount) {
    this.max += amount;
    // 当前人口不能超过上限
    this.current = Math.min(this.current, this.max);
    return this.max;
  }

  /**
   * 增加当前人口
   */
  add(amount) {
    const actualAdd = Math.min(amount, this.max - this.current);
    this.current += actualAdd;
    return actualAdd;
  }

  /**
   * 消耗人口（用于建筑升级）
   */
  consume(amount) {
    if (this.current < amount) {
      return {
        success: false,
        needed: amount,
        available: this.current,
        deficit: amount - this.current
      };
    }
    
    this.current -= amount;
    return {
      success: true,
      consumed: amount,
      remaining: this.current
    };
  }

  /**
   * 释放人口（建筑升级完成或拆除）
   */
  release(amount) {
    this.current = Math.min(this.max, this.current + amount);
    return this.current;
  }

  /**
   * 自然增长（每小时调用）
   */
  grow(deltaHours = 1) {
    if (this.current < this.max) {
      const growth = Math.floor(this.growthRate * deltaHours);
      this.add(growth);
    }
    return this.current;
  }

  /**
   * 获取快照
   */
  getSnapshot() {
    return {
      current: this.current,
      max: this.max,
      growthRate: this.growthRate,
      available: this.current // 可用于消耗的当前人口
    };
  }
}
