// server/src/core/components/TechComponent.js
/**
 * 科技组件 - 管理帝国科技研究
 * 包括渔业、农业科技等
 */
export class TechComponent {
  constructor() {
    this.researched = new Set(); // 已研究的科技ID
    this.researching = null;     // 正在研究的科技
    this.progress = 0;           // 研究进度(毫秒)
  }

  /**
   * 检查科技是否已研究
   */
  has(techId) {
    return this.researched.has(techId);
  }

  /**
   * 开始研究科技
   */
  startResearch(techId, duration) {
    if (this.researched.has(techId)) return { success: false, error: '已研究该科技' };
    if (this.researching) return { success: false, error: '正在研究其他科技' };
    
    this.researching = techId;
    this.progress = 0;
    this.duration = duration;
    
    return { success: true, techId, duration };
  }

  /**
   * 更新研究进度
   */
  update(deltaMs) {
    if (!this.researching) return null;
    
    this.progress += deltaMs;
    
    if (this.progress >= this.duration) {
      const completed = this.researching;
      this.researched.add(completed);
      this.researching = null;
      this.progress = 0;
      return { completed };
    }
    
    return { 
      researching: this.researching, 
      progress: this.progress, 
      duration: this.duration,
      percent: Math.floor((this.progress / this.duration) * 100)
    };
  }

  /**
   * 获取科技加成效果
   */
  getEffects(AGRICULTURE_TECHS) {
    const effects = {
      fisheryOutputBonus: 0,
      farmOutputBonus: 0,
      orchardOutputBonus: 0,
      fishProductChance: 0,
      fishProductBonus: 0,
      fruitChance: 0,
      enablePremiumFood: false,
    };
    
    for (const techId of this.researched) {
      const tech = AGRICULTURE_TECHS[techId];
      if (tech?.effect) {
        Object.entries(tech.effect).forEach(([key, value]) => {
          if (typeof effects[key] === 'number') {
            effects[key] += value;
          } else if (typeof effects[key] === 'boolean') {
            effects[key] = value;
          }
        });
      }
    }
    
    return effects;
  }

  /**
   * 获取快照
   */
  getSnapshot() {
    return {
      researched: Array.from(this.researched),
      researching: this.researching,
      progress: this.progress,
      duration: this.duration || 0,
      percent: this.researching ? Math.floor((this.progress / this.duration) * 100) : 0
    };
  }
}
