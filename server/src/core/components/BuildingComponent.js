// server/src/core/components/BuildingComponent.js
import { BUILDING_TYPES } from '../../../../shared/constants.js';
import { getBuildingUpgradeTime, getBuildingUpgradeCost } from '../../../../shared/buildingConfig.js';

/**
 * 建筑组件 - 管理实体拥有的所有建筑
 * 支持升级队列和时间消耗
 */
export class BuildingComponent {
  constructor() {
    this.buildings = new Map(); // buildingId -> buildingData
    this.upgradeQueue = []; // 升级队列
  }

  /**
   * 添加建筑
   */
  add(buildingTypeId, level = 1) {
    const type = Object.values(BUILDING_TYPES).find(b => b.id === buildingTypeId);
    if (!type) throw new Error(`Unknown building type: ${buildingTypeId}`);
    
    const building = {
      typeId: buildingTypeId,
      level: Math.min(level, type.maxLevel),
      maxLevel: type.maxLevel,
      createdAt: Date.now(),
      lastUpgradedAt: Date.now()
    };
    
    this.buildings.set(buildingTypeId, building);
    return building;
  }

  /**
   * 开始升级建筑（加入队列）
   * @returns {Object|null} 升级任务
   */
  startUpgrade(buildingTypeId) {
    const building = this.buildings.get(buildingTypeId);
    if (!building) return null;
    if (building.level >= building.maxLevel) return null;
    
    // 检查是否已在升级队列中
    const existingTask = this.upgradeQueue.find(t => t.buildingTypeId === buildingTypeId && !t.completed);
    if (existingTask) return null;
    
    const nextLevel = building.level + 1;
    const duration = getBuildingUpgradeTime(buildingTypeId, nextLevel) * 1000; // 转毫秒
    
    const task = {
      id: `upgrade_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      buildingTypeId,
      fromLevel: building.level,
      toLevel: nextLevel,
      duration,
      _progress: 0,
      completed: false
    };
    
    this.upgradeQueue.push(task);
    return task;
  }

  /**
   * 完成升级
   */
  completeUpgrade(task) {
    const building = this.buildings.get(task.buildingTypeId);
    if (!building) return false;
    
    building.level = task.toLevel;
    building.lastUpgradedAt = Date.now();
    return true;
  }

  /**
   * 更新升级队列（由 GameLoop 调用）
   * @param {number} deltaTime 游戏时间（秒）
   * @param {number} timeScale 时间加速倍率
   * @returns {Array} 已完成的任务
   */
  processUpgradeQueue(deltaTime, timeScale = 1) {
    const completed = [];
    
    for (const task of this.upgradeQueue) {
      if (!task.completed) {
        // 根据时间加速推进进度
        const gameTimeElapsed = deltaTime * timeScale * 1000; // 转毫秒
        task._progress = (task._progress || 0) + gameTimeElapsed;
        
        if (task._progress >= task.duration) {
          task.completed = true;
          if (this.completeUpgrade(task)) {
            completed.push(task);
          }
        }
      }
    }
    
    // 清理已完成的任务
    this.upgradeQueue = this.upgradeQueue.filter(t => !t.completed);
    
    return completed;
  }

  /**
   * 取消升级（返还部分资源）
   */
  cancelUpgrade(taskId) {
    const taskIndex = this.upgradeQueue.findIndex(t => t.id === taskId);
    if (taskIndex === -1) return { success: false, error: '升级任务不存在' };
    
    const task = this.upgradeQueue[taskIndex];
    if (task.completed) return { success: false, error: '升级已完成' };
    
    // 计算进度
    const progress = task._progress / task.duration;
    
    // 移除任务
    this.upgradeQueue.splice(taskIndex, 1);
    
    return { 
      success: true, 
      progress,
      refundRatio: Math.max(0, 0.8 - progress * 0.8) // 最高返还80%
    };
  }

  /**
   * 获取升级预览
   */
  getUpgradePreview(buildingTypeId) {
    const building = this.buildings.get(buildingTypeId);
    if (!building) return null;
    if (building.level >= building.maxLevel) return null;
    
    const nextLevel = building.level + 1;
    
    return {
      buildingTypeId,
      currentLevel: building.level,
      nextLevel,
      cost: getBuildingUpgradeCost(buildingTypeId, nextLevel),
      duration: getBuildingUpgradeTime(buildingTypeId, nextLevel),
      maxLevel: building.maxLevel
    };
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
   * 计算总产出加成倍数
   * 返回 1.0 + 所有建筑加成（例如 1级建筑 = 1.2倍）
   */
  calculateProductionBonus(resourceId) {
    let bonus = 1.0; // 基础倍数
    
    for (const [typeId, building] of this.buildings) {
      const type = Object.values(BUILDING_TYPES).find(b => b.id === typeId);
      if (type?.outputBase) {
        // 每级建筑增加 20% 产出
        const levelBonus = building.level * 0.2;
        
        if (resourceId === 'wood' && typeId === 'lumber_mill') {
          bonus += levelBonus;
        }
        if (resourceId === 'food' && typeId === 'farm') {
          bonus += levelBonus;
        }
        if (resourceId === 'stone' && typeId === 'quarry') {
          bonus += levelBonus;
        }
        if (resourceId === 'iron' && typeId === 'iron_mine') {
          bonus += levelBonus;
        }
      }
    }
    
    return bonus;
  }

  /**
   * 获取指定资源的产出速率（每小时）
   * 直接根据建筑等级计算
   */
  getProductionRate(resourceId) {
    let baseRate = 0;
    let level = 0;
    
    // 查找对应的建筑
    for (const [typeId, building] of this.buildings) {
      const type = Object.values(BUILDING_TYPES).find(b => b.id === typeId);
      if (!type?.outputBase) continue;
      
      if (resourceId === 'wood' && typeId === 'lumber_mill') {
        baseRate = type.outputBase;
        level = building.level;
      }
      if (resourceId === 'food' && typeId === 'farm') {
        baseRate = type.outputBase;
        level = building.level;
      }
      if (resourceId === 'stone' && typeId === 'quarry') {
        baseRate = type.outputBase;
        level = building.level;
      }
      if (resourceId === 'iron' && typeId === 'iron_mine') {
        baseRate = type.outputBase;
        level = building.level;
      }
    }
    
    // 产出 = 基础产出 × 等级加成
    // 1级 = 100%, 2级 = 120%, 3级 = 140% ...
    if (baseRate > 0 && level > 0) {
      const bonus = 1 + (level - 1) * 0.2; // 1级=1.0, 2级=1.2, 3级=1.4
      return Math.floor(baseRate * bonus);
    }
    
    return 0;
  }
}
