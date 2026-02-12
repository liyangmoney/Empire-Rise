// server/src/core/components/BuildingComponent.js
import { BUILDING_TYPES } from '../../../../shared/constants.js';

/**
 * 建筑组件 - 管理实体拥有的所有建筑
 */
export class BuildingComponent {
  constructor() {
    this.buildings = new Map(); // buildingId -> buildingData
  }

  /**
   * 添加/升级建筑
   */
  add(buildingTypeId, level = 1) {
    const type = Object.values(BUILDING_TYPES).find(b => b.id === buildingTypeId);
    if (!type) throw new Error(`Unknown building type: ${buildingTypeId}`);
    
    const building = {
      typeId: buildingTypeId,
      level: Math.min(level, type.maxLevel),
      maxLevel: type.maxLevel,
      lastUpgradedAt: Date.now()
    };
    
    this.buildings.set(buildingTypeId, building);
    return building;
  }

  /**
   * 升级建筑
   */
  upgrade(buildingTypeId) {
    const building = this.buildings.get(buildingTypeId);
    if (!building) return null;
    if (building.level >= building.maxLevel) return null;
    
    building.level++;
    building.lastUpgradedAt = Date.now();
    return building;
  }

  /**
   * 获取建筑等级
   */
  getLevel(buildingTypeId) {
    return this.buildings.get(buildingTypeId)?.level || 0;
  }

  /**
   * 获取所有建筑快照
   */
  getSnapshot() {
    const snapshot = {};
    for (const [id, data] of this.buildings) {
      snapshot[id] = {
        level: data.level,
        maxLevel: data.maxLevel
      };
    }
    return snapshot;
  }

  /**
   * 计算总产出加成
   */
  calculateProductionBonus(resourceId) {
    let bonus = 1.0;
    
    // 根据建筑类型计算加成
    for (const [typeId, building] of this.buildings) {
      const type = Object.values(BUILDING_TYPES).find(b => b.id === typeId);
      if (type?.outputBase) {
        // 伐木场增加木材产出
        if (resourceId === 'wood' && typeId === 'lumber_mill') {
          bonus += (building.level * 0.2); // 每级+20%
        }
        // 农场增加粮食产出
        if (resourceId === 'food' && typeId === 'farm') {
          bonus += (building.level * 0.2);
        }
      }
    }
    
    return bonus;
  }
}