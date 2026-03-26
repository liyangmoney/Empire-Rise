// server/src/core/systems/RecruitSystem.js
import { RECRUIT_OPTIONS } from '../../../../shared/generalTypes.js';

/**
 * 招募系统 - 处理将领招募相关的业务逻辑
 */
export class RecruitSystem {
  constructor(gameWorld) {
    this.gameWorld = gameWorld;
  }

  /**
   * 执行招募
   */
  recruit(empire, recruitType) {
    const config = RECRUIT_OPTIONS[recruitType];
    if (!config) {
      return { success: false, error: '无效的招募类型' };
    }

    // 检查资源
    for (const [resourceId, amount] of Object.entries(config.cost)) {
      if (!empire.resources.has(resourceId, amount)) {
        return { success: false, error: `${resourceId}不足` };
      }
    }

    // 扣除资源
    for (const [resourceId, amount] of Object.entries(config.cost)) {
      empire.resources.consume(resourceId, amount);
    }

    // 执行招募
    const result = empire.generals.recruit(recruitType);
    
    if (result.success) {
      // 记录成就
      empire.tasks?.updateProgress('recruit_general', { 
        [result.general.rarity]: 1,
        total: 1,
      });
    }

    return result;
  }

  /**
   * 批量招募（10连抽）
   */
  recruitBatch(empire, recruitType, count = 10) {
    const config = RECRUIT_OPTIONS[recruitType];
    if (!config) {
      return { success: false, error: '无效的招募类型' };
    }

    // 检查资源
    const totalCost = {};
    for (const [resourceId, amount] of Object.entries(config.cost)) {
      totalCost[resourceId] = amount * count * 0.9; // 10连抽9折
    }

    for (const [resourceId, amount] of Object.entries(totalCost)) {
      if (!empire.resources.has(resourceId, Math.ceil(amount))) {
        return { success: false, error: `${resourceId}不足` };
      }
    }

    // 扣除资源
    for (const [resourceId, amount] of Object.entries(totalCost)) {
      empire.resources.consume(resourceId, Math.ceil(amount));
    }

    // 执行批量招募
    const result = empire.generals.recruitBatch(recruitType, count);
    
    if (result.success) {
      // 统计结果
      const rarityCount = {};
      for (const item of result.results) {
        const rarity = item.general.rarity;
        rarityCount[rarity] = (rarityCount[rarity] || 0) + 1;
      }
      
      empire.tasks?.updateProgress('recruit_general', { 
        ...rarityCount,
        total: count,
      });
    }

    return { ...result, totalCost };
  }

  /**
   * 获取招募预览
   */
  getRecruitPreview(recruitType) {
    return {
      type: recruitType,
      ...RECRUIT_OPTIONS[recruitType],
    };
  }

  /**
   * 获取所有招募选项
   */
  getAllRecruitOptions() {
    return Object.entries(RECRUIT_OPTIONS).map(([id, config]) => ({
      id,
      ...config,
    }));
  }
}
