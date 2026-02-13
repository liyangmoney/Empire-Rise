// server/src/core/components/ArmyComponent.js
import { UNIT_TYPES, getCounterMultiplier } from '../../../../shared/unitTypes.js';

/**
 * 军队组件 - 管理实体的所有军队
 * 可附加到：玩家帝国、NPC势力
 */
export class ArmyComponent {
  constructor() {
    // 军队编队：key = formationId, value = { name, units: { unitId: count }, generalId? }
    this.formations = new Map();
    
    // 士兵总数统计（用于快速计算上限）
    this.totalUnits = 0;
    
    // 士兵等级经验（全局平均或按兵种）
    this.unitLevels = {};
    for (const unitType of Object.values(UNIT_TYPES)) {
      this.unitLevels[unitType.id] = { level: 1, exp: 0 };
    }
    
    // 士气 (0-100)
    this.morale = 100;
    
    // 当前状态：idle(空闲), training(训练中), marching(行军), fighting(战斗中), recovering(恢复中)
    this.status = 'idle';
    
    // 训练队列
    this.trainingQueue = [];
    
    // 伤病士兵（在医院中恢复）
    this.woundedUnits = {};
    for (const unitType of Object.values(UNIT_TYPES)) {
      this.woundedUnits[unitType.id] = 0;
    }
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
   * 添加士兵（训练完成或招募）
   * @param {string} unitTypeId 兵种类型
   * @param {number} count 数量
   * @param {string} formationId 编队ID（默认'default'）
   */
  addUnits(unitTypeId, count, formationId = 'default') {
    const unitType = Object.values(UNIT_TYPES).find(u => u.id === unitTypeId);
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
   * 移除士兵（战斗死亡或遣散）
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
   * 添加伤病（战斗后）
   */
  addWounded(unitTypeId, count) {
    this.woundedUnits[unitTypeId] = (this.woundedUnits[unitTypeId] || 0) + count;
  }

  /**
   * 救治伤病（医院功能）
   * @returns {number} 成功救治数量
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
   * 计算粮食消耗（每小时）
   */
  calculateFoodConsumption() {
    let consumption = 0;
    for (const unitType of Object.values(UNIT_TYPES)) {
      const count = this.getUnitCount(unitType.id);
      const upkeep = unitType.upkeep?.food || 0;
      consumption += count * upkeep;
    }
    return consumption;
  }

  /**
   * 更新士气
   * @param {number} delta 变化量（可正可负）
   */
  updateMorale(delta) {
    this.morale = Math.max(0, Math.min(100, this.morale + delta));
  }

  /**
   * 获取士气对战斗力的影响系数
   */
  getMoraleMultiplier() {
    // GDD: 士气满值时+20%，低于50时开始惩罚
    if (this.morale >= 100) return 1.2;
    if (this.morale >= 80) return 1.1;
    if (this.morale >= 50) return 1.0;
    if (this.morale >= 30) return 0.8;
    return 0.6;
  }

  /**
   * 添加训练任务到队列
   */
  enqueueTraining(unitTypeId, count, barracksLevel = 1) {
    const unitType = Object.values(UNIT_TYPES).find(u => u.id === unitTypeId);
    if (!unitType) return null;

    // 计算训练时间（军营等级可加速）
    const timeReduction = (barracksLevel - 1) * 0.1; // 每级-10%
    const finalTime = unitType.training.time * count * (1 - timeReduction);

    const task = {
      id: `train_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      unitTypeId,
      count,
      startTime: Date.now(),
      duration: finalTime * 1000, // 转毫秒
      completed: false,
    };

    this.trainingQueue.push(task);
    return task;
  }

  /**
   * 检查训练队列（由GameLoop调用）
   * @returns {Array} 已完成的任务
   */
  processTrainingQueue() {
    const completed = [];
    const now = Date.now();

    for (const task of this.trainingQueue) {
      if (!task.completed && now >= task.startTime + task.duration) {
        task.completed = true;
        this.addUnits(task.unitTypeId, task.count);
        completed.push(task);
      }
    }

    // 清理已完成的任务
    this.trainingQueue = this.trainingQueue.filter(t => !t.completed);
    
    return completed;
  }

  /**
   * 获取军队快照（用于发送给客户端）
   */
  getSnapshot() {
    const formations = {};
    for (const [id, formation] of this.formations) {
      formations[id] = {
        name: formation.name,
        units: formation.units,
        total: Object.values(formation.units).reduce((a, b) => a + b, 0),
      };
    }

    return {
      formations,
      totalUnits: this.getTotalCount(),
      morale: this.morale,
      moraleMultiplier: this.getMoraleMultiplier(),
      foodConsumption: this.calculateFoodConsumption(),
      trainingQueue: this.trainingQueue.map(t => ({
        id: t.id,
        unitTypeId: t.unitTypeId,
        count: t.count,
        duration: t.duration,
        _progress: t._progress || 0,
        startTime: t.startTime,
        completed: t.completed
      })),
      woundedUnits: this.woundedUnits,
      status: this.status,
    };
  }

  /**
   * 计算编队战斗力（用于战力评估）
   */
  calculateFormationPower(formationId = 'default') {
    const formation = this.formations.get(formationId);
    if (!formation) return 0;

    let power = 0;
    for (const [unitTypeId, count] of Object.entries(formation.units)) {
      const unitType = Object.values(UNIT_TYPES).find(u => u.id === unitTypeId);
      if (unitType) {
        // 简单战力公式：攻击+防御+HP/10
        const unitPower = unitType.stats.attack + unitType.stats.defense + unitType.stats.hp / 10;
        power += unitPower * count;
      }
    }

    // 应用士气加成
    return Math.floor(power * this.getMoraleMultiplier());
  }
}