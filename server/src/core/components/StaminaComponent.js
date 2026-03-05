// server/src/core/components/StaminaComponent.js
/**
 * 体力组件 - 管理玩家体力值
 * 体力用于采集资源等操作
 */
export class StaminaComponent {
  constructor() {
    this.maxStamina = 100;      // 最大体力
    this.currentStamina = 100;  // 当前体力
    this.recoveryRate = 10;     // 每小时恢复10点
    this.lastUpdate = Date.now();
  }

  /**
   * 获取当前体力值（自动计算恢复）
   */
  getCurrentStamina() {
    const now = Date.now();
    const hoursPassed = (now - this.lastUpdate) / (1000 * 3600);
    const recovered = Math.floor(hoursPassed * this.recoveryRate);
    
    if (recovered > 0) {
      this.currentStamina = Math.min(this.maxStamina, this.currentStamina + recovered);
      this.lastUpdate = now;
    }
    
    return this.currentStamina;
  }

  /**
   * 消耗体力
   * @returns {Object} { success, consumed, remaining }
   */
  consume(amount) {
    const current = this.getCurrentStamina();
    
    if (current < amount) {
      return {
        success: false,
        consumed: 0,
        remaining: current,
        need: amount
      };
    }
    
    this.currentStamina -= amount;
    this.lastUpdate = Date.now();
    
    return {
      success: true,
      consumed: amount,
      remaining: this.currentStamina
    };
  }

  /**
   * 恢复体力
   */
  recover(amount) {
    this.currentStamina = Math.min(this.maxStamina, this.currentStamina + amount);
    this.lastUpdate = Date.now();
    return this.currentStamina;
  }

  /**
   * 获取快照
   */
  getSnapshot() {
    return {
      current: this.getCurrentStamina(),
      max: this.maxStamina,
      recoveryRate: this.recoveryRate
    };
  }
}
