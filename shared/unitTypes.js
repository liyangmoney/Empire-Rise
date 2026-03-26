// shared/unitTypes.js
/**
 * 兵种类型定义 v2.0 - 适配9种资源，20+建筑
 * 前后端共用
 */

export const UNIT_CATEGORIES = {
  BASIC: 'basic',       // 基础兵种（前期）
  ADVANCED: 'advanced', // 进阶兵种（中期）
  ELITE: 'elite',       // 精英兵种（后期）
  SPECIAL: 'special',   // 特殊兵种（活动/限定）
};

// 兵种克制关系扩展: attacker -> { target: multiplier }
export const COUNTER_RELATIONS = {
  // 基础兵种三角克制
  infantry: { infantry: 1.0, archer: 1.5, cavalry: 0.7, pikeman: 0.8, mage: 1.0, crossbow: 1.2, heavy_cavalry: 0.6 },
  archer: { infantry: 0.7, archer: 1.0, cavalry: 1.5, pikeman: 1.3, mage: 0.8, crossbow: 1.0, heavy_cavalry: 0.5 },
  cavalry: { infantry: 1.5, archer: 0.7, cavalry: 1.0, pikeman: 0.6, mage: 1.2, crossbow: 1.5, heavy_cavalry: 0.8 },
  
  // 进阶兵种
  pikeman: { infantry: 1.2, archer: 0.7, cavalry: 1.5, pikeman: 1.0, mage: 1.0, crossbow: 0.8, heavy_cavalry: 1.3 },
  crossbow: { infantry: 0.8, archer: 1.0, cavalry: 0.5, pikeman: 1.2, mage: 1.3, crossbow: 1.0, heavy_cavalry: 1.5 },
  heavy_cavalry: { infantry: 1.4, archer: 1.5, cavalry: 1.2, pikeman: 0.7, mage: 1.0, crossbow: 0.7, heavy_cavalry: 1.0 },
  
  // 精英兵种
  mage: { infantry: 1.0, archer: 1.2, cavalry: 0.8, pikeman: 1.0, mage: 1.0, crossbow: 0.7, heavy_cavalry: 1.5, siege: 1.5 },
  siege: { infantry: 1.5, archer: 1.0, cavalry: 0.5, pikeman: 1.5, mage: 0.7, crossbow: 1.0, heavy_cavalry: 0.3, siege: 1.0 },
  paladin: { infantry: 1.3, archer: 1.0, cavalry: 1.3, pikeman: 1.2, mage: 0.8, crossbow: 1.0, heavy_cavalry: 1.2, siege: 1.5 },
};

/**
 * 兵种定义
 * 消耗资源：wood, stone, food, iron, crystal, gold, fish_product, fruit, premium_food
 */
export const UNIT_TYPES = {
  // ==================== 基础兵种 ====================
  
  INFANTRY: {
    id: 'infantry',
    name: '步兵',
    category: UNIT_CATEGORIES.BASIC,
    description: '手持剑盾，防御力强，克制骑兵',
    stats: { attack: 10, defense: 15, hp: 100, speed: 5 },
    training: {
      cost: { food: 20 },
      time: 10,
    },
    upkeep: { food: 1 },
    unlock: { building: 'barracks', level: 1 },
  },
  
  ARCHER: {
    id: 'archer',
    name: '弓兵',
    category: UNIT_CATEGORIES.BASIC,
    description: '远程攻击，克制步兵',
    stats: { attack: 15, defense: 8, hp: 60, speed: 6 },
    training: {
      cost: { food: 25, wood: 10 },
      time: 12,
    },
    upkeep: { food: 1 },
    unlock: { building: 'barracks', level: 1 },
  },
  
  CAVALRY: {
    id: 'cavalry',
    name: '骑兵',
    category: UNIT_CATEGORIES.BASIC,
    description: '高机动性，冲锋能力强，克制弓兵',
    stats: { attack: 18, defense: 10, hp: 80, speed: 10 },
    training: {
      cost: { food: 40, wood: 20 },
      time: 20,
    },
    upkeep: { food: 2 },
    unlock: { building: 'barracks', level: 2 },
  },
  
  // ==================== 进阶兵种 ====================
  
  PIKEMAN: {
    id: 'pikeman',
    name: '长矛兵',
    category: UNIT_CATEGORIES.ADVANCED,
    description: '长矛专精，骑兵克星',
    stats: { attack: 14, defense: 18, hp: 120, speed: 4 },
    training: {
      cost: { food: 30, wood: 15, iron: 5 },
      time: 25,
    },
    upkeep: { food: 1, wood: 0.5 },
    unlock: { building: 'barracks', level: 3 },
    bonus: { vs_cavalry: 1.5 }, // 对骑兵额外50%伤害
  },
  
  CROSSBOW: {
    id: 'crossbow',
    name: '弩兵',
    category: UNIT_CATEGORIES.ADVANCED,
    description: '强力弩箭，破甲能力',
    stats: { attack: 22, defense: 10, hp: 70, speed: 5 },
    training: {
      cost: { food: 35, wood: 20, iron: 10 },
      time: 30,
    },
    upkeep: { food: 1, wood: 0.5 },
    unlock: { building: 'barracks', level: 4 },
    bonus: { vs_armor: 1.3 }, // 对重甲额外30%伤害
  },
  
  HEAVY_CAVALRY: {
    id: 'heavy_cavalry',
    name: '重骑兵',
    category: UNIT_CATEGORIES.ADVANCED,
    description: '重装骑兵，冲击力极强',
    stats: { attack: 28, defense: 20, hp: 150, speed: 7 },
    training: {
      cost: { food: 60, wood: 30, iron: 20 },
      time: 45,
    },
    upkeep: { food: 3, iron: 0.5 },
    unlock: { building: 'barracks', level: 5, stables: 3 },
  },
  
  // ==================== 精英兵种 ====================
  
  MAGE: {
    id: 'mage',
    name: '法师',
    category: UNIT_CATEGORIES.ELITE,
    description: '远程魔法攻击，群体伤害',
    stats: { attack: 35, defense: 8, hp: 60, speed: 4 },
    training: {
      cost: { food: 40, crystal: 3, gold: 50 },
      time: 60,
    },
    upkeep: { food: 2, gold: 1, crystal: 0.1 },
    unlock: { building: 'barracks', level: 6, tech_institute: 3 },
    special: 'area_damage', // 范围伤害
  },
  
  SIEGE: {
    id: 'siege',
    name: '攻城器械',
    category: UNIT_CATEGORIES.ELITE,
    description: '攻城专用，对建筑伤害极高',
    stats: { attack: 50, defense: 15, hp: 200, speed: 2 },
    training: {
      cost: { wood: 100, stone: 50, iron: 30, gold: 30 },
      time: 90,
    },
    upkeep: { food: 5, gold: 2 },
    unlock: { building: 'arsenal', level: 3 },
    special: 'siege_damage', // 攻城伤害加成
  },
  
  PALADIN: {
    id: 'paladin',
    name: '圣骑士',
    category: UNIT_CATEGORIES.ELITE,
    description: '全能精英，高攻防兼备',
    stats: { attack: 40, defense: 35, hp: 200, speed: 6 },
    training: {
      cost: { food: 80, iron: 40, crystal: 5, gold: 100, premium_food: 2 },
      time: 120,
    },
    upkeep: { food: 4, gold: 3, crystal: 0.2 },
    unlock: { building: 'barracks', level: 8, imperial_palace: 5 },
    special: 'healing', // 战斗恢复
  },
  
  // ==================== 特殊兵种 ====================
  
  FISH_WARRIOR: {
    id: 'fish_warrior',
    name: '鱼人战士',
    category: UNIT_CATEGORIES.SPECIAL,
    description: '来自深海的战士，水中作战极强',
    stats: { attack: 25, defense: 20, hp: 130, speed: 6 },
    training: {
      cost: { food: 30, fish_product: 10, gold: 20 },
      time: 35,
    },
    upkeep: { food: 1, fish_product: 0.5 },
    unlock: { building: 'fishery', level: 5 },
    bonus: { water_terrain: 1.5 },
  },
  
  FRUIT_RANGER: {
    id: 'fruit_ranger',
    name: '果林游侠',
    category: UNIT_CATEGORIES.SPECIAL,
    description: '森林守护者，丛林作战专家',
    stats: { attack: 20, defense: 12, hp: 90, speed: 8 },
    training: {
      cost: { food: 25, wood: 30, fruit: 5, gold: 15 },
      time: 30,
    },
    upkeep: { food: 1, fruit: 0.3 },
    unlock: { building: 'orchard', level: 5 },
    bonus: { forest_terrain: 1.5 },
  },
  
  GOURMET_KNIGHT: {
    id: 'gourmet_knight',
    name: '美食骑士',
    category: UNIT_CATEGORIES.SPECIAL,
    description: '享受精品食材的精英，士气永不低落',
    stats: { attack: 32, defense: 28, hp: 180, speed: 7 },
    training: {
      cost: { food: 50, iron: 20, premium_food: 5, gold: 80 },
      time: 80,
    },
    upkeep: { food: 3, premium_food: 0.5, gold: 2 },
    unlock: { building: 'tavern', level: 6 },
    special: 'high_morale', // 士气不会低于80
  },
};

/**
 * 获取兵种信息
 */
export function getUnitType(unitTypeId) {
  return Object.values(UNIT_TYPES).find(u => u.id === unitTypeId);
}

/**
 * 计算克制系数
 */
export function getCounterMultiplier(attackerType, defenderType) {
  return COUNTER_RELATIONS[attackerType]?.[defenderType] || 1.0;
}

/**
 * 获取某建筑等级解锁的兵种
 */
export function getUnlockableUnits(buildingType, buildingLevel) {
  return Object.values(UNIT_TYPES).filter(u => {
    const unlock = u.unlock;
    if (!unlock) return false;
    if (unlock.building === buildingType && unlock.level <= buildingLevel) {
      // 检查其他条件
      if (unlock.stables && buildingType !== 'stables') return false;
      if (unlock.tech_institute && buildingType !== 'tech_institute') return false;
      return true;
    }
    return false;
  });
}

/**
 * 兵种升级路径
 */
export const UNIT_UPGRADE_PATHS = {
  infantry: ['pikeman'],
  archer: ['crossbow'],
  cavalry: ['heavy_cavalry'],
  pikeman: ['paladin'],
  crossbow: ['siege'],
  heavy_cavalry: ['paladin'],
  mage: [],
  siege: [],
  paladin: [],
};
