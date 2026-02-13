// shared/buildingConfig.js
/**
 * 建筑升级配置
 */

// 升级时间（秒）- 随等级增加
export function getBuildingUpgradeTime(buildingTypeId, level) {
  const baseTimes = {
    warehouse_basic: 30,   // 仓库：30秒基础
    farm: 60,              // 农场：1分钟基础
    lumber_mill: 60,       // 伐木场：1分钟基础
    quarry: 90,            // 采石场：1.5分钟基础
    iron_mine: 120,        // 铁矿场：2分钟基础
    crystal_mine: 180,     // 水晶矿：3分钟基础
    barracks: 120,         // 兵营：2分钟基础
    hospital: 90,          // 医院：1.5分钟基础
    wall: 150,             // 城墙：2.5分钟基础
    tower: 180,            // 箭塔：3分钟基础
    house: 45,             // 民居：45秒基础
    imperial_palace: 300,  // 皇宫：5分钟基础
    general_camp: 120,     // 将领营：2分钟基础
    tech_institute: 240,   // 科技院：4分钟基础
  };
  
  const baseTime = baseTimes[buildingTypeId] || 60;
  // 每级增加20%时间
  return Math.floor(baseTime * Math.pow(1.2, level - 1));
}

// 升级消耗 - 随等级增加
export function getBuildingUpgradeCost(buildingTypeId, level) {
  const baseCosts = {
    warehouse_basic: { wood: 200, stone: 100 },
    farm: { wood: 150, food: 50 },
    lumber_mill: { wood: 100, stone: 50 },
    quarry: { wood: 100, stone: 100 },
    iron_mine: { wood: 200, stone: 150, food: 100 },
    crystal_mine: { wood: 300, stone: 200, iron: 50 },
    barracks: { wood: 300, stone: 150, food: 100 },
    hospital: { wood: 200, stone: 100, food: 50 },
    wall: { wood: 150, stone: 200 },
    tower: { wood: 200, stone: 300 },
    house: { wood: 100, food: 20 },
    imperial_palace: { wood: 500, stone: 500, iron: 100, crystal: 10 },
    general_camp: { wood: 300, stone: 200, gold: 50 },
    tech_institute: { wood: 400, stone: 300, iron: 100, crystal: 20 },
  };
  
  const baseCost = baseCosts[buildingTypeId] || { wood: 100 };
  const cost = {};
  
  // 每级增加50%消耗
  const multiplier = Math.pow(1.5, level - 1);
  for (const [res, amount] of Object.entries(baseCost)) {
    cost[res] = Math.floor(amount * multiplier);
  }
  
  return cost;
}
