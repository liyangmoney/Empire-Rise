// shared/generalTypes.js
/**
 * 将领类型定义
 * 前后端共用
 */

export const GENERAL_RARITIES = {
  COMMON: { id: 'common', name: '普通', color: '#9e9e9e', multiplier: 1.0 },
  RARE: { id: 'rare', name: '稀有', color: '#2196F3', multiplier: 1.2 },
  EPIC: { id: 'epic', name: '史诗', color: '#9c27b0', multiplier: 1.5 },
  LEGENDARY: { id: 'legendary', name: '传说', color: '#ffd700', multiplier: 2.0 },
};

export const SKILL_TYPES = {
  AOE_DAMAGE: 'aoe_damage',     // 群体伤害
  HEAL: 'heal',                 // 治疗
  BUFF_ATTACK: 'buff_attack',   // 攻击增益
  BUFF_DEFENSE: 'buff_defense', // 防御增益
  MORALE_BOOST: 'morale_boost', // 士气提升
};

// 将领模板库
export const GENERAL_TEMPLATES = {
  // 传说将领
  ZHAO_YUN: {
    id: 'zhao_yun',
    name: '赵云',
    rarity: 'legendary',
    description: '常山赵子龙，一身是胆',
    baseStats: { attack: 95, defense: 80, intelligence: 70 },
    growth: { attack: 5, defense: 4, intelligence: 3 },
    skills: [
      {
        id: 'long_dan',
        name: '龙胆',
        type: SKILL_TYPES.AOE_DAMAGE,
        description: '对敌方全体造成150%攻击力的伤害',
        power: 1.5,
        cooldown: 3, // 回合
        triggerRate: 0.3, // 每回合30%概率触发
      },
      {
        id: 'qiang_tu',
        name: '枪突',
        type: SKILL_TYPES.BUFF_ATTACK,
        description: '提升己方全体20%攻击力，持续3回合',
        power: 0.2,
        duration: 3,
        cooldown: 5,
        triggerRate: 0.2,
      },
    ],
  },
  
  GUAN_YU: {
    id: 'guan_yu',
    name: '关羽',
    rarity: 'legendary',
    description: '武圣关云长',
    baseStats: { attack: 100, defense: 75, intelligence: 60 },
    growth: { attack: 6, defense: 3, intelligence: 2 },
    skills: [
      {
        id: 'qing_long',
        name: '青龙偃月',
        type: SKILL_TYPES.AOE_DAMAGE,
        description: '对敌方全体造成180%攻击力的伤害',
        power: 1.8,
        cooldown: 4,
        triggerRate: 0.25,
      },
    ],
  },
  
  ZHUGE_LIANG: {
    id: 'zhuge_liang',
    name: '诸葛亮',
    rarity: 'legendary',
    description: '卧龙先生，智计无双',
    baseStats: { attack: 50, defense: 60, intelligence: 100 },
    growth: { attack: 2, defense: 3, intelligence: 6 },
    skills: [
      {
        id: 'ba_gua',
        name: '八卦阵',
        type: SKILL_TYPES.BUFF_DEFENSE,
        description: '提升己方全体30%防御力，持续3回合',
        power: 0.3,
        duration: 3,
        cooldown: 4,
        triggerRate: 0.3,
      },
      {
        id: 'kong_cheng',
        name: '空城计',
        type: SKILL_TYPES.MORALE_BOOST,
        description: '提升己方全体士气至100',
        power: 1.0,
        cooldown: 6,
        triggerRate: 0.15,
      },
    ],
  },
  
  // 史诗将领
  ZHANG_FEI: {
    id: 'zhang_fei',
    name: '张飞',
    rarity: 'epic',
    description: '燕人张翼德',
    baseStats: { attack: 90, defense: 70, intelligence: 40 },
    growth: { attack: 5, defense: 4, intelligence: 1 },
    skills: [
      {
        id: 'xu_hei',
        name: '当阳怒吼',
        type: SKILL_TYPES.AOE_DAMAGE,
        description: '对敌方全体造成130%攻击力的伤害',
        power: 1.3,
        cooldown: 3,
        triggerRate: 0.25,
      },
    ],
  },
  
  HUA_TUO: {
    id: 'hua_tuo',
    name: '华佗',
    rarity: 'epic',
    description: '神医华佗',
    baseStats: { attack: 30, defense: 50, intelligence: 90 },
    growth: { attack: 1, defense: 2, intelligence: 5 },
    skills: [
      {
        id: 'qing_nang',
        name: '青囊术',
        type: SKILL_TYPES.HEAL,
        description: '恢复己方全体20%生命值',
        power: 0.2,
        cooldown: 3,
        triggerRate: 0.3,
      },
    ],
  },
  
  // 稀有将领
  HUANG_ZHONG: {
    id: 'huang_zhong',
    name: '黄忠',
    rarity: 'rare',
    description: '老当益壮',
    baseStats: { attack: 85, defense: 60, intelligence: 50 },
    growth: { attack: 4, defense: 3, intelligence: 2 },
    skills: [
      {
        id: 'shen_jian',
        name: '神箭',
        type: SKILL_TYPES.AOE_DAMAGE,
        description: '对敌方全体造成110%攻击力的伤害',
        power: 1.1,
        cooldown: 3,
        triggerRate: 0.2,
      },
    ],
  },
  
  // 普通将领
  LI_BING: {
    id: 'li_bing',
    name: '李兵',
    rarity: 'common',
    description: '普通武将',
    baseStats: { attack: 60, defense: 50, intelligence: 40 },
    growth: { attack: 3, defense: 2, intelligence: 2 },
    skills: [],
  },
};

/**
 * 生成将领实例
 */
export function createGeneral(templateId, level = 1) {
  const template = GENERAL_TEMPLATES[templateId.toUpperCase()];
  if (!template) return null;
  
  const rarity = GENERAL_RARITIES[template.rarity.toUpperCase()];
  
  // 计算当前等级属性
  const stats = {};
  for (const [stat, baseValue] of Object.entries(template.baseStats)) {
    const growth = template.growth[stat] || 0;
    stats[stat] = Math.floor((baseValue + growth * (level - 1)) * rarity.multiplier);
  }
  
  return {
    id: `${templateId}_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    templateId: template.id,
    name: template.name,
    rarity: template.rarity,
    level,
    exp: 0,
    stats,
    skills: template.skills.map(s => ({ ...s, currentCooldown: 0 })),
    equipped: {
      weapon: null,
      armor: null,
      horse: null,
    },
  };
}

/**
 * 计算升级所需经验
 */
export function getExpToLevel(level) {
  return Math.floor(100 * Math.pow(1.5, level - 1));
}

/**
 * 添加经验并检查升级
 */
export function addExp(general, exp) {
  general.exp += exp;
  const required = getExpToLevel(general.level);
  
  let leveledUp = false;
  while (general.exp >= required) {
    general.exp -= required;
    general.level++;
    leveledUp = true;
    
    // 重新计算属性
    const template = GENERAL_TEMPLATES[general.templateId.toUpperCase()];
    const rarity = GENERAL_RARITIES[template.rarity.toUpperCase()];
    
    for (const [stat, baseValue] of Object.entries(template.baseStats)) {
      const growth = template.growth[stat] || 0;
      general.stats[stat] = Math.floor((baseValue + growth * (general.level - 1)) * rarity.multiplier);
    }
  }
  
  return { leveledUp, newLevel: general.level };
}