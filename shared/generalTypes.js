// shared/generalTypes.js
/**
 * 将领类型定义 v2.0 - 20+将领，丰富技能系统
 * 前后端共用
 */

// ==================== 稀有度定义 ====================
export const GENERAL_RARITIES = {
  COMMON: { id: 'common', name: '普通', color: '#9e9e9e', multiplier: 1.0, recruitChance: 0.60 },
  RARE: { id: 'rare', name: '稀有', color: '#2196F3', multiplier: 1.3, recruitChance: 0.25 },
  EPIC: { id: 'epic', name: '史诗', color: '#9c27b0', multiplier: 1.6, recruitChance: 0.12 },
  LEGENDARY: { id: 'legendary', name: '传说', color: '#ffd700', multiplier: 2.0, recruitChance: 0.03 },
};

// ==================== 将领职能分类 ====================
export const GENERAL_ROLES = {
  ATTACKER: 'attacker',     // 攻击型 - 高攻击，适合带兵冲锋
  DEFENDER: 'defender',     // 防御型 - 高防御，适合守城
  TACTICIAN: 'tactician',   // 智谋型 - 高智力，技能效果强
  COMMANDER: 'commander',   // 统帅型 - 均衡发展，全军加成
  SUPPORT: 'support',       // 辅助型 - 治疗、增益
};

// ==================== 技能类型 ====================
export const SKILL_TYPES = {
  // 主动技能
  AOE_DAMAGE: 'aoe_damage',         // 群体伤害
  SINGLE_DAMAGE: 'single_damage',   // 单体伤害
  HEAL: 'heal',                     // 治疗
  BUFF_ATTACK: 'buff_attack',       // 攻击增益
  BUFF_DEFENSE: 'buff_defense',     // 防御增益
  BUFF_SPEED: 'buff_speed',         // 速度增益
  DEBUFF: 'debuff',                 // 减益敌人
  MORALE_BOOST: 'morale_boost',     // 士气提升
  
  // 被动技能
  PASSIVE_ATTACK: 'passive_attack',     // 常驻攻击加成
  PASSIVE_DEFENSE: 'passive_defense',   // 常驻防御加成
  PASSIVE_CRIT: 'passive_crit',         // 暴击率加成
  PASSIVE_LIFESTEAL: 'passive_lifesteal', // 吸血
  PASSIVE_COUNTER: 'passive_counter',   // 反击
  
  // 统帅技能
  COMMANDER_ATTACK: 'commander_attack',   // 全军攻击加成
  COMMANDER_DEFENSE: 'commander_defense', // 全军防御加成
  COMMANDER_SPEED: 'commander_speed',     // 全军速度加成
  COMMANDER_MORALE: 'commander_morale',   // 全军士气加成
};

// ==================== 将领模板库（20+） ====================
export const GENERAL_TEMPLATES = {
  
  // ========== 传说将领 ==========
  
  ZHAO_YUN: {
    id: 'zhao_yun',
    name: '赵云',
    rarity: 'legendary',
    role: GENERAL_ROLES.ATTACKER,
    description: '常山赵子龙，一身是胆',
    baseStats: { attack: 95, defense: 80, intelligence: 70, speed: 90 },
    growth: { attack: 5, defense: 4, intelligence: 3, speed: 4 },
    skills: [
      {
        id: 'long_dan',
        name: '龙胆',
        type: SKILL_TYPES.AOE_DAMAGE,
        description: '对敌方全体造成150%攻击力的伤害',
        power: 1.5,
        cooldown: 3,
        triggerRate: 0.3,
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
      {
        id: 'yong_guan',
        name: '勇冠三军',
        type: SKILL_TYPES.PASSIVE_CRIT,
        description: '被动：暴击率+15%',
        power: 0.15,
      },
    ],
  },
  
  GUAN_YU: {
    id: 'guan_yu',
    name: '关羽',
    rarity: 'legendary',
    role: GENERAL_ROLES.ATTACKER,
    description: '武圣关云长',
    baseStats: { attack: 100, defense: 75, intelligence: 60, speed: 70 },
    growth: { attack: 6, defense: 3, intelligence: 2, speed: 3 },
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
      {
        id: 'wu_sheng',
        name: '武圣之威',
        type: SKILL_TYPES.COMMANDER_ATTACK,
        description: '统帅：全军攻击力+10%',
        power: 0.10,
      },
    ],
  },
  
  ZHUGE_LIANG: {
    id: 'zhuge_liang',
    name: '诸葛亮',
    rarity: 'legendary',
    role: GENERAL_ROLES.TACTICIAN,
    description: '卧龙先生，智计无双',
    baseStats: { attack: 50, defense: 60, intelligence: 100, speed: 60 },
    growth: { attack: 2, defense: 3, intelligence: 6, speed: 3 },
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
      {
        id: 'zhi_zhe',
        name: '智者千虑',
        type: SKILL_TYPES.PASSIVE_DEFENSE,
        description: '被动：受到的伤害-10%',
        power: 0.10,
      },
    ],
  },
  
  CAO_CAO: {
    id: 'cao_cao',
    name: '曹操',
    rarity: 'legendary',
    role: GENERAL_ROLES.COMMANDER,
    description: '乱世之枭雄',
    baseStats: { attack: 75, defense: 75, intelligence: 85, speed: 80 },
    growth: { attack: 4, defense: 4, intelligence: 4, speed: 4 },
    skills: [
      {
        id: 'tian_xia',
        name: '挟天子令诸侯',
        type: SKILL_TYPES.COMMANDER_MORALE,
        description: '统帅：全军士气+15，士气下限+10',
        power: 0.15,
      },
      {
        id: 'ying_xiong',
        name: '乱世枭雄',
        type: SKILL_TYPES.BUFF_ATTACK,
        description: '提升己方全体25%攻击力，持续3回合',
        power: 0.25,
        duration: 3,
        cooldown: 5,
        triggerRate: 0.25,
      },
    ],
  },
  
  // ========== 史诗将领 ==========
  
  ZHANG_FEI: {
    id: 'zhang_fei',
    name: '张飞',
    rarity: 'epic',
    role: GENERAL_ROLES.ATTACKER,
    description: '燕人张翼德',
    baseStats: { attack: 90, defense: 70, intelligence: 40, speed: 75 },
    growth: { attack: 5, defense: 4, intelligence: 1, speed: 3 },
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
      {
        id: 'bao_he',
        name: '暴喝',
        type: SKILL_TYPES.DEBUFF,
        description: '降低敌方全体15%防御，持续2回合',
        power: 0.15,
        duration: 2,
        cooldown: 4,
        triggerRate: 0.2,
      },
    ],
  },
  
  HUA_TUO: {
    id: 'hua_tuo',
    name: '华佗',
    rarity: 'epic',
    role: GENERAL_ROLES.SUPPORT,
    description: '神医华佗',
    baseStats: { attack: 30, defense: 50, intelligence: 90, speed: 65 },
    growth: { attack: 1, defense: 2, intelligence: 5, speed: 2 },
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
      {
        id: 'wu_gu',
        name: '五禽戏',
        type: SKILL_TYPES.PASSIVE_LIFESTEAL,
        description: '被动：造成伤害的10%转化为治疗',
        power: 0.10,
      },
    ],
  },
  
  SUN_CE: {
    id: 'sun_ce',
    name: '孙策',
    rarity: 'epic',
    role: GENERAL_ROLES.ATTACKER,
    description: '江东小霸王',
    baseStats: { attack: 88, defense: 65, intelligence: 60, speed: 95 },
    growth: { attack: 5, defense: 3, intelligence: 2, speed: 5 },
    skills: [
      {
        id: 'ba_wang',
        name: '霸王之击',
        type: SKILL_TYPES.SINGLE_DAMAGE,
        description: '对敌方单体造成200%攻击力的伤害',
        power: 2.0,
        cooldown: 3,
        triggerRate: 0.25,
      },
      {
        id: 'ji_feng',
        name: '疾风迅雷',
        type: SKILL_TYPES.BUFF_SPEED,
        description: '提升己方全体20%速度，持续2回合',
        power: 0.2,
        duration: 2,
        cooldown: 4,
        triggerRate: 0.2,
      },
    ],
  },
  
  DIAN_WEI: {
    id: 'dian_wei',
    name: '典韦',
    rarity: 'epic',
    role: GENERAL_ROLES.DEFENDER,
    description: '古之恶来',
    baseStats: { attack: 75, defense: 95, intelligence: 45, speed: 60 },
    growth: { attack: 3, defense: 6, intelligence: 1, speed: 2 },
    skills: [
      {
        id: 'tie_bi',
        name: '铁壁',
        type: SKILL_TYPES.PASSIVE_DEFENSE,
        description: '被动：防御力+20%',
        power: 0.20,
      },
      {
        id: 'hu_ti',
        name: '护主',
        type: SKILL_TYPES.PASSIVE_COUNTER,
        description: '被动：受到伤害时30%概率反击',
        power: 0.30,
      },
    ],
  },
  
  // ========== 稀有将领 ==========
  
  HUANG_ZHONG: {
    id: 'huang_zhong',
    name: '黄忠',
    rarity: 'rare',
    role: GENERAL_ROLES.ATTACKER,
    description: '老当益壮',
    baseStats: { attack: 85, defense: 60, intelligence: 50, speed: 55 },
    growth: { attack: 4, defense: 3, intelligence: 2, speed: 2 },
    skills: [
      {
        id: 'shen_jian',
        name: '神箭',
        type: SKILL_TYPES.SINGLE_DAMAGE,
        description: '对敌方单体造成150%攻击力的伤害',
        power: 1.5,
        cooldown: 3,
        triggerRate: 0.2,
      },
    ],
  },
  
  ZHOU_YU: {
    id: 'zhou_yu',
    name: '周瑜',
    rarity: 'rare',
    role: GENERAL_ROLES.TACTICIAN,
    description: '美周郎',
    baseStats: { attack: 60, defense: 55, intelligence: 85, speed: 70 },
    growth: { attack: 3, defense: 2, intelligence: 4, speed: 3 },
    skills: [
      {
        id: 'fen_gong',
        name: '火攻',
        type: SKILL_TYPES.AOE_DAMAGE,
        description: '对敌方全体造成120%攻击力的伤害',
        power: 1.2,
        cooldown: 4,
        triggerRate: 0.15,
      },
    ],
  },
  
  LV_MENG: {
    id: 'lv_meng',
    name: '吕蒙',
    rarity: 'rare',
    role: GENERAL_ROLES.COMMANDER,
    description: '士别三日当刮目相看',
    baseStats: { attack: 70, defense: 70, intelligence: 75, speed: 65 },
    growth: { attack: 3, defense: 3, intelligence: 3, speed: 3 },
    skills: [
      {
        id: 'bai_yi',
        name: '白衣渡江',
        type: SKILL_TYPES.BUFF_SPEED,
        description: '提升己方全体15%速度，持续2回合',
        power: 0.15,
        duration: 2,
        cooldown: 4,
        triggerRate: 0.2,
      },
    ],
  },
  
  XIA_HOU_DUN: {
    id: 'xia_hou_dun',
    name: '夏侯惇',
    rarity: 'rare',
    role: GENERAL_ROLES.DEFENDER,
    description: '独眼将军',
    baseStats: { attack: 70, defense: 85, intelligence: 50, speed: 60 },
    growth: { attack: 3, defense: 4, intelligence: 2, speed: 2 },
    skills: [
      {
        id: 'gang_bi',
        name: '刚壁',
        type: SKILL_TYPES.PASSIVE_DEFENSE,
        description: '被动：防御力+12%',
        power: 0.12,
      },
    ],
  },
  
  // ========== 普通将领 ==========
  
  LI_BING: {
    id: 'li_bing',
    name: '李兵',
    rarity: 'common',
    role: GENERAL_ROLES.COMMANDER,
    description: '普通武将',
    baseStats: { attack: 60, defense: 50, intelligence: 40, speed: 50 },
    growth: { attack: 3, defense: 2, intelligence: 2, speed: 2 },
    skills: [],
  },
  
  WANG_JIANG: {
    id: 'wang_jiang',
    name: '王将',
    rarity: 'common',
    role: GENERAL_ROLES.ATTACKER,
    description: '普通将领',
    baseStats: { attack: 65, defense: 45, intelligence: 35, speed: 55 },
    growth: { attack: 3, defense: 2, intelligence: 1, speed: 2 },
    skills: [],
  },
  
  ZHANG_WEI: {
    id: 'zhang_wei',
    name: '张伟',
    rarity: 'common',
    role: GENERAL_ROLES.DEFENDER,
    description: '普通守将',
    baseStats: { attack: 50, defense: 60, intelligence: 40, speed: 45 },
    growth: { attack: 2, defense: 3, intelligence: 2, speed: 2 },
    skills: [],
  },
  
  ZHAO_QIANG: {
    id: 'zhao_qiang',
    name: '赵强',
    rarity: 'common',
    role: GENERAL_ROLES.TACTICIAN,
    description: '普通谋士',
    baseStats: { attack: 40, defense: 45, intelligence: 60, speed: 50 },
    growth: { attack: 2, defense: 2, intelligence: 3, speed: 2 },
    skills: [],
  },
  
  LIU_XIU: {
    id: 'liu_xiu',
    name: '刘秀',
    rarity: 'common',
    role: GENERAL_ROLES.SUPPORT,
    description: '普通军医',
    baseStats: { attack: 35, defense: 50, intelligence: 55, speed: 45 },
    growth: { attack: 1, defense: 2, intelligence: 3, speed: 2 },
    skills: [
      {
        id: 'jiu_ji',
        name: '急救',
        type: SKILL_TYPES.HEAL,
        description: '恢复己方单体10%生命值',
        power: 0.1,
        cooldown: 3,
        triggerRate: 0.2,
      },
    ],
  },
  
  // ========== 特殊/活动将领 ==========
  
  DIAO_CHAN: {
    id: 'diao_chan',
    name: '貂蝉',
    rarity: 'epic',
    role: GENERAL_ROLES.SUPPORT,
    description: '闭月羞花',
    baseStats: { attack: 45, defense: 50, intelligence: 80, speed: 85 },
    growth: { attack: 2, defense: 2, intelligence: 4, speed: 4 },
    skills: [
      {
        id: 'mei_ren',
        name: '美人计',
        type: SKILL_TYPES.DEBUFF,
        description: '降低敌方全体20%攻击，持续2回合',
        power: 0.20,
        duration: 2,
        cooldown: 4,
        triggerRate: 0.25,
      },
      {
        id: 'li_jian',
        name: '离间',
        type: SKILL_TYPES.MORALE_BOOST,
        description: '转移敌方10%士气给己方',
        power: 0.1,
        cooldown: 5,
        triggerRate: 0.15,
      },
    ],
  },
  
  LV_BU: {
    id: 'lv_bu',
    name: '吕布',
    rarity: 'legendary',
    role: GENERAL_ROLES.ATTACKER,
    description: '人中吕布，马中赤兔',
    baseStats: { attack: 105, defense: 70, intelligence: 40, speed: 85 },
    growth: { attack: 6, defense: 3, intelligence: 1, speed: 4 },
    skills: [
      {
        id: 'tian_xia_wu_di',
        name: '天下无敌',
        type: SKILL_TYPES.AOE_DAMAGE,
        description: '对敌方全体造成200%攻击力的伤害',
        power: 2.0,
        cooldown: 5,
        triggerRate: 0.2,
      },
      {
        id: 'fei_jiang',
        name: '飞将',
        type: SKILL_TYPES.PASSIVE_ATTACK,
        description: '被动：攻击力+20%',
        power: 0.20,
      },
    ],
  },
};

// ==================== 招募配置 ====================

export const RECRUIT_OPTIONS = {
  BASIC: {
    id: 'basic',
    name: '普通招募',
    description: '消耗粮食招募普通将领',
    cost: { food: 500 },
    guaranteedRare: false,
    guaranteedEpic: false,
    pityCounter: 0, // 无保底
  },
  ADVANCED: {
    id: 'advanced',
    name: '高级招募',
    description: '消耗金币招募高品质将领',
    cost: { gold: 100 },
    guaranteedRare: true, // 保底稀有
    guaranteedEpic: 10, // 10连保底史诗
    pityCounter: 0,
  },
  PREMIUM: {
    id: 'premium',
    name: '至尊招募',
    description: '消耗水晶招募传说将领',
    cost: { crystal: 5, gold: 500 },
    guaranteedRare: true,
    guaranteedEpic: true, // 保底史诗
    guaranteedLegendary: 100, // 100抽保底传说
    pityCounter: 0,
  },
};

// ==================== 缘分组合（羁绊） ====================

export const GENERAL_BONDS = {
  SHU_JIANG: {
    id: 'shu_jiang',
    name: '蜀汉五虎',
    description: '关羽、张飞、赵云、黄忠、马超同场时，全体攻击+15%',
    generals: ['guan_yu', 'zhang_fei', 'zhao_yun', 'huang_zhong'],
    bonus: { attack: 0.15 },
    minCount: 2, // 至少2人激活
  },
  WU_JIANG: {
    id: 'wu_jiang',
    name: '江东英才',
    description: '孙策、周瑜、吕蒙同场时，全体智力+20%',
    generals: ['sun_ce', 'zhou_yu', 'lv_meng'],
    bonus: { intelligence: 0.20 },
    minCount: 2,
  },
  WEI_JIANG: {
    id: 'wei_jiang',
    name: '曹魏虎臣',
    description: '曹操、典韦、夏侯惇同场时，全体防御+15%',
    generals: ['cao_cao', 'dian_wei', 'xia_hou_dun'],
    bonus: { defense: 0.15 },
    minCount: 2,
  },
  LIU_BEI_GUAN_YU_ZHANG_FEI: {
    id: 'tao_yuan',
    name: '桃园结义',
    description: '刘备（待添加）、关羽、张飞同场时，全体士气+20',
    generals: ['guan_yu', 'zhang_fei'],
    bonus: { morale: 20 },
    minCount: 2,
  },
};

// ==================== 辅助函数 ====================

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
    role: template.role,
    level,
    exp: 0,
    expToNext: getExpToLevel(level),
    stats,
    skills: template.skills?.map(s => ({ ...s, currentCooldown: 0 })) || [],
    equipped: {
      weapon: null,
      armor: null,
      horse: null,
      accessory: null,
    },
    bondBonus: {}, // 缘分加成
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
  let levelsGained = 0;
  
  while (general.exp >= getExpToLevel(general.level)) {
    const req = getExpToLevel(general.level);
    if (general.exp < req) break;
    
    general.exp -= req;
    general.level++;
    levelsGained++;
    leveledUp = true;
  }
  
  if (leveledUp) {
    // 重新计算属性
    const template = GENERAL_TEMPLATES[general.templateId.toUpperCase()];
    const rarity = GENERAL_RARITIES[template.rarity.toUpperCase()];
    
    for (const [stat, baseValue] of Object.entries(template.baseStats)) {
      const growth = template.growth[stat] || 0;
      general.stats[stat] = Math.floor((baseValue + growth * (general.level - 1)) * rarity.multiplier);
    }
    
    general.expToNext = getExpToLevel(general.level);
  }
  
  return { leveledUp, levelsGained, newLevel: general.level };
}

/**
 * 计算缘分加成
 */
export function calculateBondBonus(generals) {
  const activeBonds = [];
  const generalIds = generals.map(g => g.templateId);
  
  for (const bond of Object.values(GENERAL_BONDS)) {
    const matched = bond.generals.filter(id => generalIds.includes(id));
    if (matched.length >= bond.minCount) {
      activeBonds.push({
        ...bond,
        matchedCount: matched.length,
      });
    }
  }
  
  return activeBonds;
}

/**
 * 获取随机招募将领
 */
export function getRandomGeneral(recruitType = 'BASIC') {
  const config = RECRUIT_OPTIONS[recruitType];
  if (!config) return null;
  
  const rand = Math.random();
  let targetRarity;
  
  // 保底检查
  if (config.guaranteedLegendary && config.pityCounter >= config.guaranteedLegendary) {
    targetRarity = 'legendary';
  } else if (config.guaranteedEpic === true || (config.guaranteedEpic && config.pityCounter >= config.guaranteedEpic)) {
    targetRarity = 'epic';
  } else if (config.guaranteedRare && rand < 0.3) {
    targetRarity = 'rare';
  } else {
    // 正常概率
    if (rand < GENERAL_RARITIES.LEGENDARY.recruitChance) targetRarity = 'legendary';
    else if (rand < GENERAL_RARITIES.EPIC.recruitChance + GENERAL_RARITIES.LEGENDARY.recruitChance) targetRarity = 'epic';
    else if (rand < GENERAL_RARITIES.RARE.recruitChance + GENERAL_RARITIES.EPIC.recruitChance + GENERAL_RARITIES.LEGENDARY.recruitChance) targetRarity = 'rare';
    else targetRarity = 'common';
  }
  
  // 从该稀有度中随机选一个
  const candidates = Object.values(GENERAL_TEMPLATES).filter(t => t.rarity === targetRarity);
  if (candidates.length === 0) return null;
  
  const template = candidates[Math.floor(Math.random() * candidates.length)];
  return createGeneral(template.id, 1);
}
