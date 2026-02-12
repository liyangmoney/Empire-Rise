// shared/npcTypes.js
/**
 * NPC 类型定义（依据 GDD v1.0）
 * 前后端共用
 */

export const NPC_CATEGORIES = {
  WILD: 'wild',       // 野生NPC（狼、野猪、山贼）
  OUTPOST: 'outpost', // NPC据点（山贼窝、矿场守卫）
  CITY: 'city',       // NPC城邦（小型、中型、大型）
};

// NPC等级范围：1-10（据点），城邦单独计算
export const NPC_TYPES = {
  // ========== 野生NPC ==========
  WOLF: {
    id: 'wolf',
    name: '野狼群',
    category: NPC_CATEGORIES.WILD,
    level: 1,
    powerBase: 50,
    army: { infantry: 5 },
    loot: { wood: 50, food: 30 },
    exp: 10,
  },
  BOAR: {
    id: 'boar',
    name: '野猪群',
    category: NPC_CATEGORIES.WILD,
    level: 2,
    powerBase: 80,
    army: { infantry: 8 },
    loot: { wood: 80, food: 50 },
    exp: 15,
  },
  BANDIT: {
    id: 'bandit',
    name: '山贼',
    category: NPC_CATEGORIES.WILD,
    level: 3,
    powerBase: 120,
    army: { infantry: 10, archer: 5 },
    loot: { wood: 100, food: 80, stone: 20 },
    exp: 25,
  },

  // ========== NPC据点（1-10级）==========
  BANDIT_CAMP: {
    id: 'bandit_camp',
    name: '山贼营地',
    category: NPC_CATEGORIES.OUTPOST,
    levelRange: [1, 3],
    powerMultiplier: 100,
    armyRatio: { infantry: 0.6, archer: 0.4 },
    loot: { wood: 200, food: 150, iron: 10 },
    exp: 50,
    dropRate: { general_fragment: 0.1 },
  },
  MINE_GUARD: {
    id: 'mine_guard',
    name: '矿场守卫',
    category: NPC_CATEGORIES.OUTPOST,
    levelRange: [3, 6],
    powerMultiplier: 150,
    armyRatio: { infantry: 0.4, archer: 0.3, cavalry: 0.3 },
    loot: { wood: 150, food: 200, iron: 50 },
    exp: 80,
    dropRate: { general_fragment: 0.2, equipment: 0.1 },
  },
  BORDER_POST: {
    id: 'border_post',
    name: '边防哨所',
    category: NPC_CATEGORIES.OUTPOST,
    levelRange: [6, 10],
    powerMultiplier: 250,
    armyRatio: { infantry: 0.3, archer: 0.4, cavalry: 0.3 },
    loot: { wood: 300, stone: 200, iron: 100 },
    exp: 120,
    dropRate: { general_fragment: 0.3, equipment: 0.2, rare_unit: 0.05 },
  },

  // ========== NPC城邦 ==========
  CITY_SMALL: {
    id: 'city_small',
    name: '小型城邦',
    category: NPC_CATEGORIES.CITY,
    level: 12,
    powerBase: 2000,
    defense: { wall: 3, tower: 2 },
    army: { infantry: 100, archer: 80, cavalry: 50 },
    loot: { wood: 1000, food: 800, iron: 300, crystal: 50 },
    exp: 500,
    territory: true, // 可占领为疆域
    dropRate: { general_fragment: 0.5, equipment: 0.3, rare_unit: 0.1 },
  },
  CITY_MEDIUM: {
    id: 'city_medium',
    name: '中型城邦',
    category: NPC_CATEGORIES.CITY,
    level: 15,
    powerBase: 5000,
    defense: { wall: 5, tower: 4 },
    army: { infantry: 250, archer: 200, cavalry: 150, mage: 50 },
    loot: { wood: 3000, food: 2500, iron: 1000, crystal: 200, gold: 500 },
    exp: 1000,
    territory: true,
    dropRate: { general_fragment: 0.7, equipment: 0.5, rare_unit: 0.2 },
  },
  CITY_LARGE: {
    id: 'city_large',
    name: '大型城邦',
    category: NPC_CATEGORIES.CITY,
    level: 20,
    powerBase: 12000,
    defense: { wall: 8, tower: 6 },
    army: { infantry: 600, archer: 500, cavalry: 400, mage: 200 },
    loot: { wood: 10000, food: 8000, iron: 5000, crystal: 1000, gold: 2000 },
    exp: 3000,
    territory: true,
    dropRate: { general_fragment: 1.0, equipment: 0.8, rare_unit: 0.5, ultimate_tech: 0.1 },
  },
};

/**
 * 生成动态NPC
 * @param {string} npcTypeId NPC类型
 * @param {number} playerPower 玩家战力（用于动态难度）
 * @returns {Object} 生成的NPC数据
 */
export function generateNpc(npcTypeId, playerPower) {
  const template = NPC_TYPES[npcTypeId.toUpperCase()];
  if (!template) return null;

  const npc = {
    id: `${npcTypeId}_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    typeId: npcTypeId,
    name: template.name,
    category: template.category,
    level: template.level || template.levelRange[0],
    maxHp: 100,
    currentHp: 100,
  };

  // 根据玩家战力计算NPC军队
  if (template.category === NPC_CATEGORIES.WILD) {
    // 固定数量
    npc.army = { ...template.army };
    npc.power = template.powerBase;
  } else if (template.category === NPC_CATEGORIES.OUTPOST) {
    // 动态难度：据点战力 = 玩家战力 × (0.3 + 等级×0.1)
    const difficultyMultiplier = 0.3 + npc.level * 0.1;
    const targetPower = playerPower * difficultyMultiplier;
    npc.power = Math.max(template.powerMultiplier, targetPower);
    
    // 按比例分配兵种
    npc.army = calculateArmyFromPower(npc.power, template.armyRatio);
  } else if (template.category === NPC_CATEGORIES.CITY) {
    // 城邦固定战力（高难度挑战）
    npc.power = template.powerBase;
    npc.army = { ...template.army };
    npc.defense = { ...template.defense };
  }

  npc.loot = { ...template.loot };
  npc.exp = template.exp;
  npc.dropRate = template.dropRate ? { ...template.dropRate } : {};

  return npc;
}

/**
 * 根据战力计算军队数量
 */
function calculateArmyFromPower(power, ratio) {
  const army = {};
  // 简化计算：每个士兵平均战力 = 20
  const totalUnits = Math.floor(power / 20);
  
  for (const [unitType, r] of Object.entries(ratio)) {
    army[unitType] = Math.floor(totalUnits * r);
  }
  
  return army;
}

/**
 * 计算NPC总战力
 */
export function calculateNpcPower(npc) {
  // 简化计算，实际应基于兵种属性
  return npc.power || 100;
}