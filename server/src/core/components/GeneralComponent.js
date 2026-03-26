// server/src/core/components/GeneralComponent.js
import { 
  createGeneral, 
  addExp, 
  GENERAL_TEMPLATES, 
  GENERAL_RARITIES,
  calculateBondBonus,
  getRandomGeneral,
  RECRUIT_OPTIONS,
} from '../../../../shared/generalTypes.js';

/**
 * 将领组件 v2.0 - 20+将领，缘分系统，招募系统
 */
export class GeneralComponent {
  constructor() {
    this.generals = new Map(); // generalId -> generalData
    this.formationAssignments = new Map(); // formationId -> generalId
    this.recruitHistory = []; // 招募记录
    this.pityCounters = { // 保底计数器
      advanced: 0,
      premium: 0,
    };
  }

  /**
   * 招募将领（新系统）
   * @param {string} recruitType 招募类型: BASIC/ADVANCED/PREMIUM
   * @returns {Object} 招募结果
   */
  recruit(recruitType = 'BASIC') {
    const config = RECRUIT_OPTIONS[recruitType];
    if (!config) return { success: false, error: '无效的招募类型' };

    // 检查并扣除资源
    // 注意：资源扣除在 handlers.js 中处理

    // 更新保底计数
    if (recruitType === 'ADVANCED') this.pityCounters.advanced++;
    if (recruitType === 'PREMIUM') this.pityCounters.premium++;

    // 获取随机将领
    const general = getRandomGeneral(recruitType);
    if (!general) {
      return { success: false, error: '招募失败' };
    }

    // 检查是否触发保底
    let isPity = false;
    if (recruitType === 'ADVANCED' && general.rarity === 'epic' && this.pityCounters.advanced >= 10) {
      isPity = true;
      this.pityCounters.advanced = 0;
    }
    if (recruitType === 'PREMIUM' && general.rarity === 'legendary' && this.pityCounters.premium >= 100) {
      isPity = true;
      this.pityCounters.premium = 0;
    }
    if (general.rarity === 'rare' || general.rarity === 'epic' || general.rarity === 'legendary') {
      // 重置对应计数器
      if (recruitType === 'ADVANCED') this.pityCounters.advanced = 0;
      if (recruitType === 'PREMIUM') this.pityCounters.premium = 0;
    }

    // 保存将领
    this.generals.set(general.id, general);

    // 记录招募历史
    this.recruitHistory.push({
      generalId: general.id,
      name: general.name,
      rarity: general.rarity,
      recruitType,
      isPity,
      timestamp: Date.now(),
    });

    return { 
      success: true, 
      general,
      isPity,
      pityCounters: { ...this.pityCounters },
    };
  }

  /**
   * 批量招募（10连抽）
   */
  recruitBatch(recruitType = 'ADVANCED', count = 10) {
    const results = [];
    let guaranteedIndex = -1;

    // 确定保底位置
    if (recruitType === 'ADVANCED' && this.pityCounters.advanced + count >= 10) {
      guaranteedIndex = 9 - (this.pityCounters.advanced % 10);
    }

    for (let i = 0; i < count; i++) {
      // 保底位置强制史诗
      if (i === guaranteedIndex) {
        // 手动创建史诗将领
        const epicGenerals = Object.values(GENERAL_TEMPLATES).filter(t => t.rarity === 'epic');
        const template = epicGenerals[Math.floor(Math.random() * epicGenerals.length)];
        const general = createGeneral(template.id, 1);
        this.generals.set(general.id, general);
        
        this.recruitHistory.push({
          generalId: general.id,
          name: general.name,
          rarity: general.rarity,
          recruitType,
          isPity: true,
          timestamp: Date.now(),
        });
        
        results.push({ general, isPity: true });
        this.pityCounters.advanced = 0;
      } else {
        const result = this.recruit(recruitType);
        if (result.success) {
          results.push({ general: result.general, isPity: result.isPity });
        }
      }
    }

    return {
      success: true,
      results,
      pityCounters: { ...this.pityCounters },
    };
  }

  /**
   * 获取所有将领
   */
  getAll() {
    return Array.from(this.generals.values());
  }

  /**
   * 获取单个将领
   */
  get(generalId) {
    return this.generals.get(generalId);
  }

  /**
   * 分配将领到编队
   */
  assignToFormation(generalId, formationId) {
    const general = this.generals.get(generalId);
    if (!general) return false;
    
    // 解除之前的分配
    for (const [fid, gid] of this.formationAssignments) {
      if (gid === generalId) {
        this.formationAssignments.delete(fid);
      }
    }
    
    this.formationAssignments.set(formationId, generalId);
    return true;
  }

  /**
   * 获取编队的将领
   */
  getFormationGeneral(formationId) {
    const generalId = this.formationAssignments.get(formationId);
    return generalId ? this.generals.get(generalId) : null;
  }

  /**
   * 添加经验
   */
  addExpToGeneral(generalId, exp) {
    const general = this.generals.get(generalId);
    if (!general) return null;
    
    const result = addExp(general, exp);
    
    // 更新属性
    if (result.leveledUp) {
      this.updateGeneralStats(general);
    }
    
    return result;
  }

  /**
   * 更新将领属性（升级后）
   */
  updateGeneralStats(general) {
    const template = GENERAL_TEMPLATES[general.templateId.toUpperCase()];
    const rarity = GENERAL_RARITIES[general.rarity.toUpperCase()];
    
    for (const [stat, baseValue] of Object.entries(template.baseStats)) {
      const growth = template.growth[stat] || 0;
      general.stats[stat] = Math.floor((baseValue + growth * (general.level - 1)) * rarity.multiplier);
    }
  }

  /**
   * 计算编队总战力加成（含缘分）
   */
  calculatePowerBonus(formationId, allGenerals = null) {
    const general = this.getFormationGeneral(formationId);
    if (!general) return { bonus: 0, bondBonus: {} };
    
    // 基础将领战力
    const generalPower = (general.stats.attack + general.stats.defense + general.stats.intelligence) / 3;
    
    // 缘分加成
    const generals = allGenerals || this.getAll();
    const activeBonds = calculateBondBonus(generals);
    
    let bondMultiplier = 1.0;
    const bondBonus = {};
    
    for (const bond of activeBonds) {
      if (bond.bonus.attack) {
        bondMultiplier += bond.bonus.attack;
        bondBonus.attack = (bondBonus.attack || 0) + bond.bonus.attack;
      }
      if (bond.bonus.defense) {
        bondMultiplier += bond.bonus.defense * 0.5;
        bondBonus.defense = (bondBonus.defense || 0) + bond.bonus.defense;
      }
      if (bond.bonus.intelligence) {
        bondMultiplier += bond.bonus.intelligence * 0.3;
        bondBonus.intelligence = (bondBonus.intelligence || 0) + bond.bonus.intelligence;
      }
    }
    
    return {
      bonus: Math.floor(generalPower * bondMultiplier),
      bondBonus,
      activeBonds,
    };
  }

  /**
   * 获取招募预览
   */
  getRecruitPreview(recruitType) {
    const config = RECRUIT_OPTIONS[recruitType];
    if (!config) return null;

    return {
      type: recruitType,
      name: config.name,
      description: config.description,
      cost: config.cost,
      probabilities: {
        common: GENERAL_RARITIES.COMMON.recruitChance * 100,
        rare: GENERAL_RARITIES.RARE.recruitChance * 100,
        epic: GENERAL_RARITIES.EPIC.recruitChance * 100,
        legendary: GENERAL_RARITIES.LEGENDARY.recruitChance * 100,
      },
      guaranteed: {
        rare: config.guaranteedRare,
        epic: config.guaranteedEpic,
        legendary: config.guaranteedLegendary,
      },
      pityCounters: { ...this.pityCounters },
    };
  }

  /**
   * 获取快照
   */
  getSnapshot() {
    const generals = this.getAll();
    const activeBonds = calculateBondBonus(generals);
    
    return {
      generals: generals.map(g => ({
        id: g.id,
        name: g.name,
        rarity: g.rarity,
        role: g.role,
        level: g.level,
        exp: g.exp,
        expToNext: g.expToNext,
        stats: g.stats,
        skills: g.skills.map(s => ({
          name: s.name,
          description: s.description,
          type: s.type,
          cooldown: s.cooldown,
        })),
        assignedTo: this.getAssignedFormation(g.id),
      })),
      totalCount: this.generals.size,
      activeBonds,
      pityCounters: { ...this.pityCounters },
    };
  }

  /**
   * 获取将领被分配到哪个编队
   */
  getAssignedFormation(generalId) {
    for (const [fid, gid] of this.formationAssignments) {
      if (gid === generalId) return fid;
    }
    return null;
  }

  /**
   * 获取招募历史
   */
  getRecruitHistory(limit = 50) {
    return this.recruitHistory.slice(-limit);
  }
}
