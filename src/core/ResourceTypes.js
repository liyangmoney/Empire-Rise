// src/core/ResourceTypes.js
/**
 * 资源类型定义（依据《帝国崛起》GDD v1.0）
 * 基础资源：木材、石材、粮食
 * 特殊资源：铁矿、水晶
 * 通用货币：金币
 */

export const RESOURCE_TYPES = {
  WOOD: { id: 'wood', name: '木材', category: 'basic', description: '用于建造基础建筑、制作基础兵种武器' },
  STONE: { id: 'stone', name: '石材', category: 'basic', description: '用于建造防御建筑、加固军营' },
  FOOD: { id: 'food', name: '粮食', category: 'basic', description: '训练军队、维持士气、恢复伤病' },
  IRON: { id: 'iron', name: '铁矿', category: 'special', description: '研发高阶科技、训练进阶兵种、制作高阶装备' },
  CRYSTAL: { id: 'crystal', name: '水晶', category: 'special', description: '解锁稀有兵种、升级终极科技、修复特殊建筑' },
  GOLD: { id: 'gold', name: '金币', category: 'currency', description: '通用货币，用于快速购买/招募/修复' },
};

export const RESOURCE_CATEGORIES = {
  BASIC: 'basic',
  SPECIAL: 'special',
  CURRENCY: 'currency',
};