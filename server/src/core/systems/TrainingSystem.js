// server/src/core/systems/TrainingSystem.js
import { UNIT_TYPES } from '../../../../shared/unitTypes.js';

/**
 * 训练系统 - 处理军队训练相关的业务逻辑
 * 独立于 ArmyComponent，负责验证、消耗、调度
 */
export class TrainingSystem {
  constructor(gameWorld) {
    this.gameWorld = gameWorld;
  }

  /**
   * 验证是否可以训练
   * @param {Object} empire 帝国实体
   * @param {string} unitTypeId 兵种类型
   * @param {number} count 数量
   * @returns {Object} { success, error, maxPossible }
   */
  canTrain(empire, unitTypeId, count) {
    // 通过 id 查找兵种（UNIT_TYPES 键是大写，但传入的是小写 id）
    const unitType = Object.values(UNIT_TYPES).find(u => u.id === unitTypeId);
    if (!unitType) {
      return { success: false, error: '未知的兵种类型' };
    }

    // 检查解锁条件（进阶兵种需要建筑等级）
    if (unitType.unlock) {
      const requiredBuilding = empire.buildings?.getLevel(unitType.unlock.building) || 0;
      if (requiredBuilding < unitType.unlock.level) {
        return { 
          success: false, 
          error: `需要${unitType.unlock.building}等级${unitType.unlock.level}` 
        };
      }
    }

    // 检查军队上限
    const currentArmy = empire.army?.getTotalCount() || 0;
    const maxArmy = this.calculateMaxArmySize(empire);
    if (currentArmy + count > maxArmy) {
      return { 
        success: false, 
        error: `军队数量超过上限(${maxArmy})`,
        maxPossible: maxArmy - currentArmy
      };
    }

    // 检查资源是否足够
    const totalCost = {};
    for (const [resourceId, amount] of Object.entries(unitType.training.cost)) {
      totalCost[resourceId] = amount * count;
    }

    if (!empire.resources.hasAll(totalCost)) {
      return { success: false, error: '资源不足' };
    }

    return { success: true, cost: totalCost };
  }

  /**
   * 执行训练
   * @param {Object} empire 帝国实体
   * @param {string} unitTypeId 兵种类型
   * @param {number} count 数量
   * @returns {Object} { success, task, error }
   */
  train(empire, unitTypeId, count) {
    // 验证
    const validation = this.canTrain(empire, unitTypeId, count);
    if (!validation.success) {
      return validation;
    }

    // 扣除资源
    for (const [resourceId, amount] of Object.entries(validation.cost)) {
      empire.resources.consume(resourceId, amount);
    }

    // 获取军营等级（影响训练速度）
    const barracksLevel = empire.buildings?.getLevel('barracks') || 1;

    // 添加到训练队列
    const task = empire.army.enqueueTraining(unitTypeId, count, barracksLevel);
    
    // 更新任务进度
    empire.tasks.updateProgress('train', { [unitTypeId]: count });

    return { success: true, task, cost: validation.cost };
  }

  /**
   * 计算最大军队数量
   * GDD: 军队总数量根据帝国等级、军营等级、民居数量决定
   */
  calculateMaxArmySize(empire) {
    // 基础上限
    let max = 50;

    // 帝国宫殿等级加成（假设 empire.level 存在）
    const palaceLevel = empire.buildings?.getLevel('imperial_palace') || 1;
    max += (palaceLevel - 1) * 20;

    // 军营等级加成
    const barracksLevel = empire.buildings?.getLevel('barracks') || 0;
    max += barracksLevel * 30;

    // 民居数量加成（假设民居建筑存在）
    const houseCount = empire.buildings?.getLevel('house') || 0;
    max += houseCount * 10;

    return max;
  }

  /**
   * 获取训练预览（前端显示用）
   */
  getTrainingPreview(unitTypeId, count, barracksLevel = 1) {
    const unitType = Object.values(UNIT_TYPES).find(u => u.id === unitTypeId);
    if (!unitType) return null;

    const cost = {};
    for (const [resourceId, amount] of Object.entries(unitType.training.cost)) {
      cost[resourceId] = amount * count;
    }

    const timeReduction = (barracksLevel - 1) * 0.1;
    const duration = unitType.training.time * count * (1 - timeReduction);

    return {
      unitTypeId,
      unitName: unitType.name,
      count,
      cost,
      duration, // 秒
      durationFormatted: this.formatDuration(duration),
    };
  }

  /**
   * 格式化时间显示
   */
  formatDuration(seconds) {
    if (seconds < 60) return `${Math.ceil(seconds)}秒`;
    if (seconds < 3600) return `${Math.ceil(seconds / 60)}分钟`;
    return `${Math.floor(seconds / 3600)}小时${Math.ceil((seconds % 3600) / 60)}分钟`;
  }

  /**
   * 取消训练（返还部分资源）
   */
  cancelTraining(empire, taskId) {
    const task = empire.army.trainingQueue.find(t => t.id === taskId);
    if (!task || task.completed) {
      return { success: false, error: '训练任务不存在或已完成' };
    }

    // 计算已进行的时间比例
    const elapsed = Date.now() - task.startTime;
    const progress = elapsed / task.duration;

    // 返还资源（已开始的不返还，最多返还80%）
    const refundRatio = Math.max(0, 0.8 - progress * 0.8);
    const unitType = Object.values(UNIT_TYPES).find(u => u.id === task.unitTypeId);
    
    for (const [resourceId, amount] of Object.entries(unitType.training.cost)) {
      const refund = Math.floor(amount * task.count * refundRatio);
      if (refund > 0) {
        empire.resources.add(resourceId, refund);
      }
    }

    // 从队列移除
    empire.army.trainingQueue = empire.army.trainingQueue.filter(t => t.id !== taskId);

    return { success: true, refundRatio };
  }
}