// server/src/core/components/ArmyComponent.js
import { UNIT_TYPES, getUnitType, COUNTER_RELATIONS } from '../../../../shared/unitTypes.js';

/**
 * 军队组件 v2.0 - 支持12兵种，特殊能力，多样化维护
 */
export class ArmyComponent {
  constructor() {
    // 军队编队
    this.formations = new Map();
    
    // 士兵等级经验
    this.unitLevels = {};
    for (const unitType of Object.values(UNIT_TYPES)) {
      this.unitLevels[unitType.id] = { level: 1, exp: 0 };
    }
    
    // 士气 (0-100)
    this.morale = 100;
    
    // 军队状态
    this.status = 'idle'; // idle, training, marching, fighting, recovering
    
    // 训练队列
    this.trainingQueue = [];
    
    // 伤病士兵
    this.woundedUnits = {};
    for (const unitType of Object.values(UNIT_TYPES)) {
      this.woundedUnits[unitType.id] = 0;
    }
    
    // 战斗统计
    this.battleStats = {
      totalBattles: 0,
      victories: 0,
      defeats: 0,
      totalKills: 0,
      totalLosses: 0,
    };
  }

  /**
   * 获取士兵总数
   */
  getTotalCount() {
    let count = 0;
    for (const formation of this.formations.values()) {
      for (const unitCount of Object.values(formation.units)) {
        count += unitCount;
      }
    }
    return count;
  }

  /**
   * 获取特定兵种数量
   */
  getUnitCount(unitTypeId) {
    let count = 0;
    for (const formation of this.formations.values()) {
      count += formation.units[unitTypeId] || 0;
    }
    return count;
  }

  /**
   * 按类别获取士兵数量
   */
  getUnitsByCategory(category) {
    let count = 0;
    for (const unitType of Object.values(UNIT_TYPES)) {
      if (unitType.category === category) {
        count += this.getUnitCount(unitType.id);
      }
    }
    return count;
  }

  /**
   * 添加士兵
   */
  addUnits(unitTypeId, count, formationId = 'default') {
    const unitType = getUnitType(unitTypeId);
    if (!unitType) {
      throw new Error(`Unknown unit type: ${unitTypeId}`);
    }
    if (count <= 0) return false;

    if (!this.formations.has(formationId)) {
      this.formations.set(formationId, {
        id: formationId,
        name: formationId === 'default' ? '默认编队' : `编队${formationId}`,
        units: {},
        generalId: null,
      });
    }

    const formation = this.formations.get(formationId);
    formation.units[unitTypeId] = (formation.units[unitTypeId] || 0) + count;
    
    return true;
  }

  /**
   * 移除士兵
   */
  removeUnits(unitTypeId, count, formationId = 'default') {
    const formation = this.formations.get(formationId);
    if (!formation) return 0;

    const current = formation.units[unitTypeId] || 0;
    const toRemove = Math.min(count, current);
    
    if (toRemove > 0) {
      formation.units[unitTypeId] = current - toRemove;
      if (formation.units[unitTypeId] === 0) {
        delete formation.units[unitTypeId];
      }
    }
    
    return toRemove;
  }

  /**
   * 添加伤病
   */
  addWounded(unitTypeId, count) {
    this.woundedUnits[unitTypeId] = (this.woundedUnits[unitTypeId] || 0) + count;
  }

  /**
   * 救治伤病
   */
  healWounded(unitTypeId, maxHealCount) {
    const wounded = this.woundedUnits[unitTypeId] || 0;
    const toHeal = Math.min(wounded, maxHealCount);
    
    if (toHeal > 0) {
      this.woundedUnits[unitTypeId] -= toHeal;
      this.addUnits(unitTypeId, toHeal);
    }
    
    return toHeal;
  }

  /**
   * 计算资源消耗（适配9种资源）
   */
  calculateResourceConsumption() {
    const consumption = {
      food: 0,
      wood: 0,
      iron: 0,
      gold: 0,
      crystal: 0,
      fish_product: 0,
      fruit: 0,
      premium_food: 0,
    };

    for (const unitType of Object.values(UNIT_TYPES)) {
      const count = this.getUnitCount(unitType.id);
      if (count > 0 && unitType.upkeep) {
        for (const [resourceId, amount] of Object.entries(unitType.upkeep)) {
          consumption[resourceId] = (consumption[resourceId] || 0) + count * amount;
        }
      }
    }

    return consumption;
  }

  /**
   * 计算每小时粮食消耗（兼容旧代码）
   */
  calculateFoodConsumption() {
    return this.calculateResourceConsumption().food;
  }

  /**
   * 更新士气
   */
  updateMorale(delta) {
    this.morale = Math.max(0, Math.min(100, this.morale + delta));
  }

  /**
   * 获取士气对战斗力的影响
   */
  getMoraleMultiplier() {
    // 美食骑士特性：士气不低于80
    if (this.getUnitCount('gourmet_knight') > 0 && this.morale < 80) {
      return 1.1; // 美食骑士保底+10%
    }
    
    if (this.morale >= 100) return 1.2;
    if (this.morale >= 80) return 1.1;
    if (this.morale >= 50) return 1.0;
    if (this.morale >= 30) return 0.8;
    return 0.6;
  }

  /**
   * 添加训练任务
   */
  enqueueTraining(unitTypeId, count, barracksLevel = 1, timeMultiplier = 1) {
    const unitType = getUnitType(unitTypeId);
    if (!unitType) return null;

    const baseTime = unitType.training.time * count;
    const finalTime = baseTime * timeMultiplier;

    const task = {
      id: `train_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      unitTypeId,
      unitName: unitType.name,
      count,
      startTime: Date.now(),
      duration: finalTime * 1000,
      completed: false,
      category: unitType.category,
    };

    this.trainingQueue.push(task);
    return task;
  }

  /**
   * 处理训练队列
   */
  processTrainingQueue() {
    const completed = [];
    const now = Date.now();

    for (const task of this.trainingQueue) {
      if (!task.completed && now >= task.startTime + task.duration) {
        task.completed = true;
        this.addUnits(task.unitTypeId, task.count);
        
        // 增加经验
        this.addUnitExp(task.unitTypeId, task.count * 10);
        
        completed.push(task);
      }
    }

    this.trainingQueue = this.trainingQueue.filter(t => !t.completed);
    return completed;
  }

  /**
   * 增加兵种经验
   */
  addUnitExp(unitTypeId, exp) {
    if (!this.unitLevels[unitTypeId]) return;
    
    this.unitLevels[unitTypeId].exp += exp;
    
    // 升级检查（每1000经验升1级，最高10级）
    const levelUpExp = 1000 * this.unitLevels[unitTypeId].level;
    if (this.unitLevels[unitTypeId].exp >= levelUpExp && this.unitLevels[unitTypeId].level < 10) {
      this.unitLevels[unitTypeId].level++;
      this.unitLevels[unitTypeId].exp -= levelUpExp;
    }
  }

  /**
   * 计算编队战斗力
   */
  calculateFormationPower(formationId = 'default', empire = null) {
    const formation = this.formations.get(formationId);
    if (!formation) return 0;

    let power = 0;
    for (const [unitTypeId, count] of Object.entries(formation.units)) {
      const unitType = getUnitType(unitTypeId);
      if (unitType) {
        let unitPower = unitType.stats.attack + unitType.stats.defense + unitType.stats.hp / 10;
        
        // 等级加成
        const level = this.unitLevels[unitTypeId]?.level || 1;
        unitPower *= (1 + (level - 1) * 0.05); // 每级+5%
        
        // 将领加成
        if (empire?.generals && formation.generalId) {
          const general = empire.generals.get(formation.generalId);
          if (general) {
            unitPower *= (1 + general.stats.attack / 100);
          }
        }
        
        power += unitPower * count;
      }
    }

    // 应用士气加成
    return Math.floor(power * this.getMoraleMultiplier());
  }

  /**
   * 获取军队快照
   */
  getSnapshot() {
    const formations = {};
    for (const [id, formation] of this.formations) {
      formations[id] = {
        name: formation.name,
        units: formation.units,
        total: Object.values(formation.units).reduce((a, b) => a + b, 0),
        generalId: formation.generalId,
      };
    }

    // 按类别统计
    const categoryCount = {
      basic: this.getUnitsByCategory('basic'),
      advanced: this.getUnitsByCategory('advanced'),
      elite: this.getUnitsByCategory('elite'),
      special: this.getUnitsByCategory('special'),
    };

    return {
      formations,
      totalUnits: this.getTotalCount(),
      categoryCount,
      morale: this.morale,
      moraleMultiplier: this.getMoraleMultiplier(),
      resourceConsumption: this.calculateResourceConsumption(),
      foodConsumption: this.calculateFoodConsumption(), // 兼容旧代码
      trainingQueue: this.trainingQueue.map(t => {
        const elapsed = Date.now() - t.startTime;
        const _progress = Math.min(t.duration, elapsed); // 已进行的毫秒数
        return {
          id: t.id,
          unitTypeId: t.unitTypeId,
          unitName: t.unitName,
          count: t.count,
          category: t.category,
          progress: Math.min(100, Math.round((_progress / t.duration) * 100)), // 百分比
          _progress, // 毫秒进度(供客户端计算)
          duration: t.duration,
          startTime: t.startTime,
          completed: t.completed
        };
      }),
      woundedUnits: this.woundedUnits,
      unitLevels: this.unitLevels,
      status: this.status,
      battleStats: this.battleStats,
    };
  }

  /**
   * 记录战斗结果
   */
  recordBattleResult(victory, kills, losses) {
    this.battleStats.totalBattles++;
    if (victory) {
      this.battleStats.victories++;
    } else {
      this.battleStats.defeats++;
    }
    this.battleStats.totalKills += kills;
    this.battleStats.totalLosses += losses;
  }
}
