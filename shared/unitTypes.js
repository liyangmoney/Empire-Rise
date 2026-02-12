// shared/unitTypes.js
/**
 * 兵种类型定义（依据 GDD v1.0）
 * 前后端共用
 */

export const UNIT_CATEGORIES = {
  BASIC: 'basic',      // 基础兵种
  ADVANCED: 'advanced', // 进阶兵种
  RARE: 'rare',        // 稀有兵种
};

// 兵种克制关系: attacker -> { target: multiplier }
export const COUNTER_RELATIONS = {
  infantry: { infantry: 1.0, archer: 1.5, cavalry: 0.7, mage: 1.0 },
  archer: { infantry: 0.7, archer: 1.0, cavalry: 1.5, mage: 1.2 },
  cavalry: { infantry: 1.5, archer: 0.7, cavalry: 1.0, mage: 0.8 },
  mage: { infantry: 1.0, archer: 0.8, cavalry: 1.2, mage: 1.0 },
};

export const UNIT_TYPES = {
  // 基础兵种 - 前期解锁
  INFANTRY: {
    id: 'infantry',
    name: '步兵',
    category: UNIT_CATEGORIES.BASIC,
    description: '手持剑盾，防御力强，克制骑兵',
    stats: {
      attack: 10,
      defense: 15,
      hp: 100,
      speed: 5,
    },
    training: {
      cost: { food: 20 },
      time: 10, // 秒（简化版，GDD要求是真实时间）
    },
    upkeep: {
      food: 1, // 每小时消耗
    },
  },
  ARCHER: {
    id: 'archer',
    name: '弓兵',
    category: UNIT_CATEGORIES.BASIC,
    description: '远程攻击，克制步兵',
    stats: {
      attack: 15,
      defense: 8,
      hp: 60,
      speed: 6,
    },
    training: {
      cost: { food: 25, wood: 10 },
      time: 12,
    },
    upkeep: {
      food: 1,
    },
  },
  CAVALRY: {
    id: 'cavalry',
    name: '骑兵',
    category: UNIT_CATEGORIES.BASIC,
    description: '高机动性，冲锋能力强，克制弓兵',
    stats: {
      attack: 18,
      defense: 10,
      hp: 80,
      speed: 10,
    },
    training: {
      cost: { food: 40, wood: 20 },
      time: 20,
    },
    upkeep: {
      food: 2,
    },
  },
  // 进阶兵种 - 中期解锁（预留）
  MAGE: {
    id: 'mage',
    name: '魔法兵',
    category: UNIT_CATEGORIES.ADVANCED,
    description: '远程魔法攻击，群体伤害',
    stats: {
      attack: 25,
      defense: 5,
      hp: 50,
      speed: 4,
    },
    training: {
      cost: { food: 30, iron: 15 },
      time: 30,
    },
    upkeep: {
      food: 2,
      gold: 1,
    },
    unlock: {
      building: 'barracks',
      level: 5,
      tech: 'magic_research',
    },
  },
};

/**
 * 计算克制系数
 * @param {string} attackerType 攻击方兵种
 * @param {string} defenderType 防守方兵种
 * @returns {number} 系数
 */
export function getCounterMultiplier(attackerType, defenderType) {
  return COUNTER_RELATIONS[attackerType]?.[defenderType] || 1.0;
}