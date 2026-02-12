// server/src/core/systems/RecruitSystem.js
import { GENERAL_TEMPLATES, GENERAL_RARITIES, createGeneral } from '../../../../shared/generalTypes.js';

/**
 * 将领招募系统
 */
export class RecruitSystem {
  constructor(gameWorld) {
    this.gameWorld = gameWorld;

    // 招募配置
    this.recruitConfig = {
      basic: {
        name: '普通招募',
        cost: { gold: 100 },
        probabilities: {
          common: 0.7,
          rare: 0.25,
          epic: 0.05,
          legendary: 0,
        },
      },
      advanced: {
        name: '高级招募',
        cost: { gold: 500, crystal: 10 },
        probabilities: {
          common: 0.3,
          rare: 0.45,
          epic: 0.2,
          legendary: 0.05,
        },
      },
      legendary: {
        name: '传说招募',
        cost: { gold: 2000, crystal: 100 },
        probabilities: {
          common: 0,
          rare: 0.2,
          epic: 0.5,
          legendary: 0.3,
        },
      },
    };
  }

  /**
   * 执行招募
   * @param {string} playerId 玩家ID
   * @param {string} recruitType 招募类型: basic|advanced|legendary
   * @returns {Object} 招募结果
   */
  recruit(playerId, recruitType) {
    const empire = this.gameWorld.empires.get(playerId);
    if (!empire) {
      return { success: false, error: '帝国不存在' };
    }

    const config = this.recruitConfig[recruitType];
    if (!config) {
      return { success: false, error: '无效的招募类型' };
    }

    // 检查资源
    if (!empire.resources.hasAll(config.cost)) {
      return { success: false, error: '资源不足' };
    }

    // 扣除资源
    for (const [resourceId, amount] of Object.entries(config.cost)) {
      empire.resources.consume(resourceId, amount);
    }

    // 随机品质
    const rarity = this.randomRarity(config.probabilities);

    // 从该品质中随机选择一个将领
    const availableGenerals = Object.values(GENERAL_TEMPLATES).filter(
      g => g.rarity === rarity
    );

    if (availableGenerals.length === 0) {
      return { success: false, error: '招募失败，请重试' };
    }

    const template = availableGenerals[Math.floor(Math.random() * availableGenerals.length)];

    // 创建将领实例
    const general = createGeneral(template.id);

    // 添加到玩家
    empire.generals.recruit(template.id);
    
    // 更新任务进度
    empire.tasks.updateProgress('recruitGeneral', 1);

    return {
      success: true,
      general: {
        id: general.id,
        name: general.name,
        rarity: general.rarity,
        stats: general.stats,
        skills: general.skills,
      },
      rarity: GENERAL_RARITIES[rarity.toUpperCase()],
      cost: config.cost,
      remainingResources: empire.resources.getSnapshot(),
    };
  }

  /**
   * 随机品质
   */
  randomRarity(probabilities) {
    const rand = Math.random();
    let cumulative = 0;

    for (const [rarity, prob] of Object.entries(probabilities)) {
      cumulative += prob;
      if (rand < cumulative) {
        return rarity;
      }
    }

    return 'common';
  }

  /**
   * 获取招募配置
   */
  getRecruitConfig() {
    return this.recruitConfig;
  }

  /**
   * 使用碎片合成将领（特定将领）
   */
  composeGeneral(playerId, templateId) {
    // 预留功能，需要背包系统支持
    return { success: false, error: '功能开发中' };
  }
}