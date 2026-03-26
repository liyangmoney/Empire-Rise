// server/src/core/systems/TrainingSystem.js
import { UNIT_TYPES, getUnitType } from '../../../../shared/unitTypes.js';

/**
 * 训练系统 v2.0 - 适配9种资源，20+建筑
 * 支持多建筑训练、建筑加成、资源多样化
 */
export class TrainingSystem {
  constructor(gameWorld) {
    this.gameWorld = gameWorld;
  }

  /**
   * 验证是否可以训练
   */
  canTrain(empire, unitTypeId, count) {
    const unitType = getUnitType(unitTypeId);
    if (!unitType) {
      return { success: false, error: '未知的兵种类型' };
    }

    // 检查解锁条件
    const unlockCheck = this.checkUnlockRequirements(empire, unitType);
    if (!unlockCheck.success) {
      return unlockCheck;
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
    const totalCost = this.calculateTrainingCost(empire, unitType, count);
    if (!empire.resources.hasAll(totalCost)) {
      const missing = [];
      for (const [res, amount] of Object.entries(totalCost)) {
        const current = empire.resources.get(res)?.current || 0;
        if (current < amount) {
          missing.push(`${res}: 需要${amount}, 现有${Math.floor(current)}`);
        }
      }
      return { success: false, error: '资源不足', missing };
    }

    return { success: true, cost: totalCost, unitType };
  }

  /**
   * 检查解锁条件
   */
  checkUnlockRequirements(empire, unitType) {
    const unlock = unitType.unlock;
    if (!unlock) return { success: true };

    // 检查主建筑等级
    const mainBuildingLevel = empire.buildings?.getLevel(unlock.building) || 0;
    if (mainBuildingLevel < unlock.level) {
      return { 
        success: false, 
        error: `需要${unlock.building}等级${unlock.level}（当前${mainBuildingLevel}）` 
      };
    }

    // 检查额外建筑要求
    if (unlock.stables) {
      const stablesLevel = empire.buildings?.getLevel('stables') || 0;
      if (stablesLevel < unlock.stables) {
        return { success: false, error: `需要马厩等级${unlock.stables}` };
      }
    }

    if (unlock.tech_institute) {
      const techLevel = empire.buildings?.getLevel('tech_institute') || 0;
      if (techLevel < unlock.tech_institute) {
        return { success: false, error: `需要研究院等级${unlock.tech_institute}` };
      }
    }

    if (unlock.imperial_palace) {
      const palaceLevel = empire.buildings?.getLevel('imperial_palace') || 0;
      if (palaceLevel < unlock.imperial_palace) {
        return { success: false, error: `需要皇宫等级${unlock.imperial_palace}` };
      }
    }

    return { success: true };
  }

  /**
   * 计算训练消耗（考虑建筑加成）
   */
  calculateTrainingCost(empire, unitType, count) {
    const baseCost = { ...unitType.training.cost };
    const totalCost = {};

    // 应用资源消耗减免
    const reduction = this.getCostReduction(empire, unitType);

    for (const [resourceId, amount] of Object.entries(baseCost)) {
      totalCost[resourceId] = Math.ceil(amount * count * (1 - reduction));
    }

    return totalCost;
  }

  /**
   * 获取资源消耗减免
   */
  getCostReduction(empire, unitType) {
    let reduction = 0;

    // 兵营等级减免（最高20%）
    const barracksLevel = empire.buildings?.getLevel('barracks') || 1;
    reduction += Math.min(0.2, (barracksLevel - 1) * 0.02);

    // 铁匠铺对需要铁矿的兵种减免
    if (unitType.training.cost.iron) {
      const blacksmithLevel = empire.buildings?.getLevel('blacksmith') || 0;
      reduction += Math.min(0.1, blacksmithLevel * 0.01);
    }

    // 研究院对精英兵种减免
    if (unitType.category === 'elite') {
      const techLevel = empire.buildings?.getLevel('tech_institute') || 0;
      reduction += Math.min(0.15, techLevel * 0.015);
    }

    return Math.min(0.5, reduction); // 最高50%减免
  }

  /**
   * 执行训练
   */
  train(empire, unitTypeId, count) {
    const validation = this.canTrain(empire, unitTypeId, count);
    if (!validation.success) {
      return validation;
    }

    // 扣除资源
    for (const [resourceId, amount] of Object.entries(validation.cost)) {
      empire.resources.consume(resourceId, amount);
    }

    // 计算训练时间（考虑建筑加速）
    const timeMultiplier = this.getTrainingSpeedMultiplier(empire, validation.unitType);
    const barracksLevel = empire.buildings?.getLevel('barracks') || 1;

    // 添加到训练队列
    const task = empire.army.enqueueTraining(unitTypeId, count, barracksLevel, timeMultiplier);
    
    // 更新任务进度
    empire.tasks?.updateProgress('train', { [unitTypeId]: count });

    return { 
      success: true, 
      task, 
      cost: validation.cost,
      timeMultiplier 
    };
  }

  /**
   * 获取训练速度加成
   */
  getTrainingSpeedMultiplier(empire, unitType) {
    let speedBonus = 0;

    // 兵营等级加速（每级+10%，最高50%）
    const barracksLevel = empire.buildings?.getLevel('barracks') || 1;
    speedBonus += Math.min(0.5, (barracksLevel - 1) * 0.1);

    // 马厩对骑兵加速
    if (['cavalry', 'heavy_cavalry'].includes(unitType.id)) {
      const stablesLevel = empire.buildings?.getLevel('stables') || 0;
      speedBonus += Math.min(0.3, stablesLevel * 0.06);
    }

    // 军械库对攻城器械加速
    if (unitType.id === 'siege') {
      const arsenalLevel = empire.buildings?.getLevel('arsenal') || 0;
      speedBonus += Math.min(0.4, arsenalLevel * 0.08);
    }

    // 酒馆士气加成
    const tavernLevel = empire.buildings?.getLevel('tavern') || 0;
    if (tavernLevel > 0) {
      speedBonus += Math.min(0.1, tavernLevel * 0.02);
    }

    return Math.max(0.3, 1 - speedBonus); // 最少30%时间
  }

  /**
   * 计算最大军队数量（增强版）
   */
  calculateMaxArmySize(empire) {
    let max = 50; // 基础上限

    // 皇宫等级加成
    const palaceLevel = empire.buildings?.getLevel('imperial_palace') || 1;
    max += (palaceLevel - 1) * 30;

    // 兵营等级加成
    const barracksLevel = empire.buildings?.getLevel('barracks') || 0;
    max += barracksLevel * 40;

    // 民居数量加成
    const houseLevel = empire.buildings?.getLevel('house') || 0;
    max += houseLevel * 15;

    // 军营加成
    const militaryCamps = ['barracks', 'stables', 'arsenal'];
    for (const camp of militaryCamps) {
      const level = empire.buildings?.getLevel(camp) || 0;
      max += level * 10;
    }

    // 城墙加成
    const wallLevel = empire.buildings?.getLevel('wall') || 0;
    max += wallLevel * 20;

    return max;
  }

  /**
   * 获取训练预览
   */
  getTrainingPreview(empire, unitTypeId, count) {
    const unitType = getUnitType(unitTypeId);
    if (!unitType) return null;

    const cost = this.calculateTrainingCost(empire, unitType, count);
    const timeMultiplier = this.getTrainingSpeedMultiplier(empire, unitType);
    const baseDuration = unitType.training.time * count;
    const finalDuration = baseDuration * timeMultiplier;

    // 检查解锁状态
    const unlockCheck = this.checkUnlockRequirements(empire, unitType);

    return {
      unitTypeId,
      unitName: unitType.name,
      category: unitType.category,
      count,
      cost,
      baseDuration,
      finalDuration,
      durationFormatted: this.formatDuration(finalDuration),
      timeMultiplier: Math.round((1 - timeMultiplier) * 100), // 显示为加速百分比
      unlocked: unlockCheck.success,
      unlockRequirement: unlockCheck.success ? null : unlockCheck.error,
    };
  }

  /**
   * 获取所有可训练兵种
   */
  getTrainableUnits(empire) {
    const result = [];
    for (const unitType of Object.values(UNIT_TYPES)) {
      const preview = this.getTrainingPreview(empire, unitType.id, 1);
      if (preview) {
        result.push(preview);
      }
    }
    return result.sort((a, b) => {
      // 已解锁的排在前面
      if (a.unlocked !== b.unlocked) return b.unlocked ? 1 : -1;
      // 按类别排序
      const categoryOrder = { basic: 0, advanced: 1, elite: 2, special: 3 };
      return categoryOrder[a.category] - categoryOrder[b.category];
    });
  }

  /**
   * 取消训练
   */
  cancelTraining(empire, taskId) {
    const task = empire.army.trainingQueue.find(t => t.id === taskId);
    if (!task || task.completed) {
      return { success: false, error: '训练任务不存在或已完成' };
    }

    const unitType = getUnitType(task.unitTypeId);
    if (!unitType) {
      return { success: false, error: '兵种类型无效' };
    }

    // 计算已进行的时间比例
    const elapsed = Date.now() - task.startTime;
    const progress = Math.min(1, elapsed / task.duration);

    // 返还资源（已开始的不返还，最多返还70%）
    const refundRatio = Math.max(0, 0.7 - progress * 0.7);
    const refund = {};
    
    for (const [resourceId, amount] of Object.entries(unitType.training.cost)) {
      const totalAmount = amount * task.count;
      const refundAmount = Math.floor(totalAmount * refundRatio);
      if (refundAmount > 0) {
        empire.resources.add(resourceId, refundAmount);
        refund[resourceId] = refundAmount;
      }
    }

    // 从队列移除
    empire.army.trainingQueue = empire.army.trainingQueue.filter(t => t.id !== taskId);

    return { success: true, refund, refundRatio: Math.round(refundRatio * 100) };
  }

  /**
   * 格式化时间
   */
  formatDuration(seconds) {
    if (seconds < 60) return `${Math.ceil(seconds)}秒`;
    if (seconds < 3600) return `${Math.ceil(seconds / 60)}分钟`;
    const hours = Math.floor(seconds / 3600);
    const mins = Math.ceil((seconds % 3600) / 60);
    return mins > 0 ? `${hours}小时${mins}分钟` : `${hours}小时`;
  }
}
