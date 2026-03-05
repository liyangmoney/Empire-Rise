// server/src/core/components/WorldMapComponent.js
/**
 * 世界地图组件 - 管理整个游戏世界的地图
 */
import { generateTerrain, spawnNPCs, MAP_SIZE, CASTLE_MIGRATION } from '../../../../shared/mapConfig.js';
import { BUILDING_TYPES } from '../../../../shared/constants.js';

export class WorldMapComponent {
  constructor(seed = Date.now()) {
    this.seed = seed;
    this.map = generateTerrain(seed);
    this.castles = new Map(); // playerId -> { x, y, name }
    this.npcs = new Map(); // "x,y" -> [npcs]
    this.lastMigrationTime = new Map(); // playerId -> timestamp
    
    // 生成初始NPC
    this.generateInitialNPCs();
  }

  /**
   * 生成初始NPC分布
   */
  generateInitialNPCs() {
    const rng = () => Math.random();
    
    for (let y = 0; y < MAP_SIZE; y++) {
      for (let x = 0; x < MAP_SIZE; x++) {
        const terrain = this.map[y][x].terrain;
        const npcs = spawnNPCs(terrain, rng);
        if (npcs.length > 0) {
          this.npcs.set(`${x},${y}`, npcs);
        }
      }
    }
  }

  /**
   * 放置城堡
   */
  placeCastle(playerId, name, preferredX = null, preferredY = null) {
    let x, y;
    
    // 如果有偏好位置，尝试在附近找平地
    if (preferredX !== null && preferredY !== null) {
      const pos = this.findNearbyFlatLand(preferredX, preferredY);
      x = pos.x;
      y = pos.y;
    } else {
      // 随机找一个平原
      const pos = this.findRandomFlatLand();
      x = pos.x;
      y = pos.y;
    }
    
    this.castles.set(playerId, {
      x,
      y,
      name,
      placedAt: Date.now(),
    });
    
    return { x, y };
  }

  /**
   * 查找附近的平地
   */
  findNearbyFlatLand(cx, cy, radius = 10) {
    for (let r = 0; r <= radius; r++) {
      for (let dy = -r; dy <= r; dy++) {
        for (let dx = -r; dx <= r; dx++) {
          const x = cx + dx;
          const y = cy + dy;
          if (this.isValidCastlePosition(x, y)) {
            return { x, y };
          }
        }
      }
    }
    // 如果没找到，返回随机平地
    return this.findRandomFlatLand();
  }

  /**
   * 查找随机平地
   */
  findRandomFlatLand() {
    let attempts = 0;
    while (attempts < 1000) {
      const x = Math.floor(Math.random() * MAP_SIZE);
      const y = Math.floor(Math.random() * MAP_SIZE);
      if (this.isValidCastlePosition(x, y)) {
        return { x, y };
      }
      attempts++;
    }
    // 兜底：返回中心点
    return { x: Math.floor(MAP_SIZE / 2), y: Math.floor(MAP_SIZE / 2) };
  }

  /**
   * 检查是否是有效的城堡位置
   */
  isValidCastlePosition(x, y) {
    if (x < 0 || x >= MAP_SIZE || y < 0 || y >= MAP_SIZE) return false;
    const terrain = this.map[y][x].terrain;
    // 城堡只能建在平原、森林、丘陵上
    return ['plains', 'forest', 'hills'].includes(terrain);
  }

  /**
   * 迁移城堡
   */
  migrateCastle(playerId, targetX, targetY, empire) {
    const castle = this.castles.get(playerId);
    if (!castle) return { success: false, error: '没有城堡' };
    
    // 检查冷却时间
    const lastMigration = this.lastMigrationTime.get(playerId) || 0;
    const hoursSinceLastMigration = (Date.now() - lastMigration) / (1000 * 60 * 60);
    if (hoursSinceLastMigration < CASTLE_MIGRATION.cooldownHours) {
      const remainingHours = Math.ceil(CASTLE_MIGRATION.cooldownHours - hoursSinceLastMigration);
      return { success: false, error: `迁移冷却中，还需 ${remainingHours} 小时` };
    }
    
    // 检查距离
    const distance = Math.sqrt(Math.pow(targetX - castle.x, 2) + Math.pow(targetY - castle.y, 2));
    if (distance > CASTLE_MIGRATION.maxDistance) {
      return { success: false, error: `距离太远，最大迁移距离为 ${CASTLE_MIGRATION.maxDistance} 格` };
    }
    
    // 检查目标位置
    if (!this.isValidCastlePosition(targetX, targetY)) {
      return { success: false, error: '该位置不能建造城堡' };
    }
    
    // 检查是否已有其他玩家城堡
    for (const [otherPlayerId, otherCastle] of this.castles) {
      if (otherPlayerId !== playerId && otherCastle.x === targetX && otherCastle.y === targetY) {
        return { success: false, error: '该位置已有其他玩家的城堡' };
      }
    }
    
    // 计算消耗
    const palaceLevel = empire.buildings?.getLevel('imperial_palace') || 1;
    const costMultiplier = Math.pow(1 + CASTLE_MIGRATION.costIncreasePerLevel, palaceLevel - 1);
    const cost = {};
    for (const [res, amount] of Object.entries(CASTLE_MIGRATION.costBase)) {
      cost[res] = Math.floor(amount * costMultiplier);
    }
    
    // 检查资源
    if (!empire.resources.hasAll(cost)) {
      return { success: false, error: '资源不足' };
    }
    
    // 扣除资源
    for (const [res, amount] of Object.entries(cost)) {
      empire.resources.consume(res, amount);
    }
    
    // 执行迁移
    castle.x = targetX;
    castle.y = targetY;
    this.lastMigrationTime.set(playerId, Date.now());
    
    return {
      success: true,
      newPosition: { x: targetX, y: targetY },
      cost,
    };
  }

  /**
   * 获取指定位置的地形信息
   */
  getTerrain(x, y) {
    if (x < 0 || x >= MAP_SIZE || y < 0 || y >= MAP_SIZE) return null;
    return this.map[y][x];
  }

  /**
   * 获取指定位置的NPC
   */
  getNPCs(x, y) {
    return this.npcs.get(`${x},${y}`) || [];
  }

  /**
   * 移除NPC
   */
  removeNPC(x, y, npcIndex) {
    const key = `${x},${y}`;
    const npcs = this.npcs.get(key);
    if (npcs && npcs[npcIndex]) {
      npcs.splice(npcIndex, 1);
      if (npcs.length === 0) {
        this.npcs.delete(key);
      }
    }
  }

  /**
   * 刷新NPC（每日）
   */
  refreshNPCs() {
    this.npcs.clear();
    this.generateInitialNPCs();
  }

  /**
   * 获取玩家城堡位置
   */
  getCastle(playerId) {
    return this.castles.get(playerId);
  }

  /**
   * 获取周围区域的地形和NPC
   */
  getSurroundingArea(x, y, radius = 5) {
    const area = [];
    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        const tx = x + dx;
        const ty = y + dy;
        if (tx >= 0 && tx < MAP_SIZE && ty >= 0 && ty < MAP_SIZE) {
          area.push({
            x: tx,
            y: ty,
            terrain: this.map[ty][tx],
            npcs: this.getNPCs(tx, ty),
            hasCastle: this.hasCastleAt(tx, ty),
          });
        }
      }
    }
    return area;
  }

  /**
   * 检查指定位置是否有城堡
   */
  hasCastleAt(x, y) {
    for (const castle of this.castles.values()) {
      if (castle.x === x && castle.y === y) return true;
    }
    return false;
  }

  /**
   * 获取完整地图（用于客户端生成）
   */
  getFullMap() {
    // 只返回地形ID，减少数据传输
    const terrain = [];
    for (let y = 0; y < MAP_SIZE; y++) {
      const row = [];
      for (let x = 0; x < MAP_SIZE; x++) {
        row.push(this.map[y][x].terrain);
      }
      terrain.push(row);
    }
    
    // 收集所有NPC位置
    const npcs = [];
    for (const [key, npcList] of this.npcs) {
      const [x, y] = key.split(',').map(Number);
      npcs.push({
        x, y,
        count: npcList.length,
        hasEnemy: npcList.some(n => !n.isNeutral),
        hasMerchant: npcList.some(n => n.isNeutral)
      });
    }
    
    // 收集所有城堡位置
    const castles = [];
    for (const [playerId, castle] of this.castles) {
      castles.push({
        x: castle.x,
        y: castle.y,
        name: castle.name,
        isOwn: false // 客户端需要判断
      });
    }
    
    return {
      size: MAP_SIZE,
      seed: this.seed,
      terrain,
      npcs,
      castles
    };
  }

  /**
   * 获取玩家视角的完整地图
   */
  getPlayerFullMap(playerId) {
    const fullMap = this.getFullMap();
    const myCastle = this.castles.get(playerId);
    
    // 标记自己的城堡
    fullMap.castles = fullMap.castles.map(c => ({
      ...c,
      isOwn: myCastle && c.x === myCastle.x && c.y === myCastle.y
    }));
    
    // 添加我的城堡（如果还没有）
    if (myCastle && !fullMap.castles.find(c => c.x === myCastle.x && c.y === myCastle.y)) {
      fullMap.castles.push({
        x: myCastle.x,
        y: myCastle.y,
        name: myCastle.name,
        isOwn: true
      });
    }
    
    return fullMap;
  }

  /**
   * 生成地图缩略图数据（用于小地图显示）
   */
  getMiniMapData(scale = 0.1) {
    const miniSize = Math.max(1, Math.floor(MAP_SIZE * scale));
    const pixels = [];
    
    const terrainColors = {
      plains: '#90EE90',
      forest: '#228B22',
      hills: '#DAA520',
      mountains: '#808080',
      river: '#4169E1',
      lake: '#1E90FF',
      desert: '#FFD700',
      swamp: '#556B2F'
    };
    
    const blockSize = Math.floor(MAP_SIZE / miniSize);
    
    for (let my = 0; my < miniSize; my++) {
      for (let mx = 0; mx < miniSize; mx++) {
        // 取区块中最常见的地形
        const y = my * blockSize;
        const x = mx * blockSize;
        const terrain = this.map[y]?.[x]?.terrain || 'plains';
        pixels.push(terrainColors[terrain] || '#ccc');
      }
    }
    
    return {
      size: miniSize,
      pixels,
      castles: Array.from(this.castles.values()).map(c => ({
        x: Math.floor(c.x / blockSize),
        y: Math.floor(c.y / blockSize)
      }))
    };
  }

  /**
   * 获取地图快照（用于客户端显示）
   */
  getMapSnapshot() {
    return {
      size: MAP_SIZE,
      seed: this.seed,
    };
  }

  /**
   * 获取玩家视野内的地图
   */
  getPlayerView(playerId, viewRadius = 10) {
    const castle = this.castles.get(playerId);
    if (!castle) return null;
    
    return {
      castle: { ...castle },
      area: this.getSurroundingArea(castle.x, castle.y, viewRadius),
    };
  }
}
