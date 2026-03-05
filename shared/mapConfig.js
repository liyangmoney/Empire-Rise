// shared/mapConfig.js
/**
 * 世界地图配置
 */

// 地图大小
export const MAP_SIZE = 100; // 100x100 网格

// 地形类型
export const TERRAIN_TYPES = {
  PLAINS:      { id: 'plains',      name: '平原',     moveCost: 1,  resourceBonus: {}, defenseBonus: 0 },
  FOREST:      { id: 'forest',      name: '森林',     moveCost: 2,  resourceBonus: { wood: 0.2 }, defenseBonus: 10 },
  HILLS:       { id: 'hills',       name: '丘陵',     moveCost: 2,  resourceBonus: { stone: 0.2 }, defenseBonus: 15 },
  MOUNTAINS:   { id: 'mountains',   name: '山地',     moveCost: 3,  resourceBonus: { iron: 0.3, stone: 0.3 }, defenseBonus: 25 },
  RIVER:       { id: 'river',       name: '河流',     moveCost: 2,  resourceBonus: { food: 0.2 }, defenseBonus: -10 },
  LAKE:        { id: 'lake',        name: '湖泊',     moveCost: 0,  resourceBonus: { food: 0.3 }, defenseBonus: 0 }, // 不可通行
  DESERT:      { id: 'desert',      name: '沙漠',     moveCost: 2,  resourceBonus: { gold: 0.2 }, defenseBonus: -5 },
  SWAMP:       { id: 'swamp',       name: '沼泽',     moveCost: 3,  resourceBonus: {}, defenseBonus: -15 },
};

// NPC类型（分布在地图上的敌人）
export const MAP_NPC_TYPES = {
  BANDIT_CAMP: {
    id: 'bandit_camp',
    name: '强盗营地',
    power: { min: 500, max: 1500 },
    loot: { gold: { min: 50, max: 200 }, food: { min: 20, max: 100 } },
    terrain: ['plains', 'forest', 'hills'],
    spawnChance: 0.15,
  },
  ORC_STRONGHOLD: {
    id: 'orc_stronghold',
    name: '兽人据点',
    power: { min: 1000, max: 3000 },
    loot: { gold: { min: 100, max: 400 }, iron: { min: 20, max: 80 } },
    terrain: ['mountains', 'hills'],
    spawnChance: 0.1,
  },
  ANCIENT_RUINS: {
    id: 'ancient_ruins',
    name: '古代遗迹',
    power: { min: 800, max: 2500 },
    loot: { crystal: { min: 5, max: 20 }, gold: { min: 150, max: 500 } },
    terrain: ['desert', 'mountains', 'plains'],
    spawnChance: 0.08,
  },
  DRAGON_LAIR: {
    id: 'dragon_lair',
    name: '龙巢',
    power: { min: 5000, max: 10000 },
    loot: { crystal: { min: 50, max: 200 }, gold: { min: 1000, max: 5000 }, premium_food: { min: 10, max: 30 } },
    terrain: ['mountains'],
    spawnChance: 0.02,
  },
  MERCHANT_CARAVAN: {
    id: 'merchant_caravan',
    name: '商人商队',
    power: { min: 200, max: 500 },
    loot: { gold: { min: 300, max: 800 } },
    terrain: ['plains', 'desert'],
    spawnChance: 0.12,
    isNeutral: true, // 中立，可以交易
  },
  ABANDONED_MINE: {
    id: 'abandoned_mine',
    name: '废弃矿坑',
    power: { min: 600, max: 1800 },
    loot: { iron: { min: 50, max: 200 }, crystal: { min: 5, max: 15 } },
    terrain: ['mountains', 'hills'],
    spawnChance: 0.1,
  },
  PIRATE_COVE: {
    id: 'pirate_cove',
    name: '海盗湾',
    power: { min: 700, max: 2000 },
    loot: { gold: { min: 200, max: 600 }, fish_product: { min: 30, max: 100 } },
    terrain: ['river', 'lake'],
    spawnChance: 0.08,
  },
};

// 城堡迁移配置
export const CASTLE_MIGRATION = {
  costBase: { gold: 1000, food: 500, wood: 300 }, // 基础消耗
  costIncreasePerLevel: 0.5, // 每升一级城堡，消耗增加50%
  cooldownHours: 24, // 迁移冷却时间（小时）
  maxDistance: 20, // 最大迁移距离（格）
};

// 生成地图地形
export function generateTerrain(seed = Date.now()) {
  const map = [];
  const rng = seededRandom(seed);
  
  // 使用简单的柏林噪声模拟地形
  for (let y = 0; y < MAP_SIZE; y++) {
    const row = [];
    for (let x = 0; x < MAP_SIZE; x++) {
      const noise = perlinNoise(x / 20, y / 20, rng);
      const terrain = getTerrainFromNoise(noise);
      row.push({
        x,
        y,
        terrain: terrain.id,
        ...terrain,
      });
    }
    map.push(row);
  }
  
  // 生成河流
  generateRivers(map, rng);
  
  // 生成湖泊
  generateLakes(map, rng);
  
  return map;
}

// 根据噪声值获取地形
function getTerrainFromNoise(noise) {
  if (noise < -0.4) return TERRAIN_TYPES.SWAMP;
  if (noise < -0.2) return TERRAIN_TYPES.RIVER;
  if (noise < 0.0) return TERRAIN_TYPES.PLAINS;
  if (noise < 0.2) return TERRAIN_TYPES.FOREST;
  if (noise < 0.4) return TERRAIN_TYPES.HILLS;
  if (noise < 0.6) return TERRAIN_TYPES.MOUNTAINS;
  return TERRAIN_TYPES.DESERT;
}

// 简单的伪随机数生成器
function seededRandom(seed) {
  return function() {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };
}

// 简化的柏林噪声
function perlinNoise(x, y, rng) {
  const X = Math.floor(x);
  const Y = Math.floor(y);
  const xf = x - X;
  const yf = y - Y;
  
  // 四个角的随机值
  const tl = pseudoRandom(X, Y, rng);
  const tr = pseudoRandom(X + 1, Y, rng);
  const bl = pseudoRandom(X, Y + 1, rng);
  const br = pseudoRandom(X + 1, Y + 1, rng);
  
  // 双线性插值
  const top = tl + (tr - tl) * smoothStep(xf);
  const bottom = bl + (br - bl) * smoothStep(xf);
  return top + (bottom - top) * smoothStep(yf);
}

function pseudoRandom(x, y, rng) {
  return rng() * 2 - 1;
}

function smoothStep(t) {
  return t * t * (3 - 2 * t);
}

// 生成河流
function generateRivers(map, rng) {
  const riverCount = 3 + Math.floor(rng() * 3);
  for (let i = 0; i < riverCount; i++) {
    let x = Math.floor(rng() * MAP_SIZE);
    let y = Math.floor(rng() * MAP_SIZE);
    
    for (let step = 0; step < 50; step++) {
      if (x >= 0 && x < MAP_SIZE && y >= 0 && y < MAP_SIZE) {
        map[y][x].terrain = 'river';
        Object.assign(map[y][x], TERRAIN_TYPES.RIVER);
      }
      // 随机流向
      const dir = Math.floor(rng() * 4);
      if (dir === 0) x++;
      else if (dir === 1) x--;
      else if (dir === 2) y++;
      else y--;
    }
  }
}

// 生成湖泊
function generateLakes(map, rng) {
  const lakeCount = 2 + Math.floor(rng() * 2);
  for (let i = 0; i < lakeCount; i++) {
    const cx = Math.floor(rng() * MAP_SIZE);
    const cy = Math.floor(rng() * MAP_SIZE);
    const radius = 3 + Math.floor(rng() * 5);
    
    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        const x = cx + dx;
        const y = cy + dy;
        if (x >= 0 && x < MAP_SIZE && y >= 0 && y < MAP_SIZE) {
          if (dx * dx + dy * dy <= radius * radius && rng() > 0.3) {
            map[y][x].terrain = 'lake';
            Object.assign(map[y][x], TERRAIN_TYPES.LAKE);
          }
        }
      }
    }
  }
}

// 在地图上生成NPC
export function spawnNPCs(terrain, rng = Math.random) {
  const npcs = [];
  
  for (const [npcType, config] of Object.entries(MAP_NPC_TYPES)) {
    if (config.terrain.includes(terrain)) {
      if (rng() < config.spawnChance) {
        const power = Math.floor(config.power.min + rng() * (config.power.max - config.power.min));
        const loot = {};
        for (const [res, range] of Object.entries(config.loot)) {
          loot[res] = Math.floor(range.min + rng() * (range.max - range.min));
        }
        
        npcs.push({
          type: npcType,
          name: config.name,
          power,
          loot,
          isNeutral: config.isNeutral || false,
        });
      }
    }
  }
  
  return npcs;
}
