// shared/constants.js
/**
 * 《帝国崛起》共享常量定义
 * 前后端共用，确保数据一致性
 */

export const RESOURCE_TYPES = {
  WOOD:   { id: 'wood',   name: '木材', category: 'basic',    description: '建造基础建筑、制作武器' },
  STONE:  { id: 'stone',  name: '石材', category: 'basic',    description: '建造防御建筑、加固军营' },
  FOOD:   { id: 'food',   name: '粮食', category: 'basic',    description: '训练军队、维持士气' },
  IRON:   { id: 'iron',   name: '铁矿', category: 'special',  description: '高阶科技、进阶兵种' },
  CRYSTAL:{ id: 'crystal',name: '水晶', category: 'special',  description: '稀有兵种、终极科技' },
  GOLD:   { id: 'gold',   name: '金币', category: 'currency', description: '通用货币' },
};

export const BUILDING_TYPES = {
  WAREHOUSE_BASIC:  { id: 'warehouse_basic',  name: '基础仓库', maxLevel: 20, capacityBase: 1000, capacityGrowth: 1.5 },
  WAREHOUSE_SPECIAL:{ id: 'warehouse_special',name: '特殊仓库', maxLevel: 20, capacityBase: 500,  capacityGrowth: 1.5 },
  LUMBER_MILL:      { id: 'lumber_mill',      name: '伐木场',   maxLevel: 20, outputBase: 100,  outputGrowth: 1.3 },
  FARM:             { id: 'farm',             name: '农场',     maxLevel: 20, outputBase: 80,   outputGrowth: 1.3 },
  BARRACKS:         { id: 'barracks',         name: '兵营',     maxLevel: 20 },
};

export const SOCKET_EVENTS = {
  // 客户端 → 服务端
  C_EMPIRE_CONNECT:   'empire:connect',
  C_RESOURCE_COLLECT: 'resource:collect',
  C_BUILDING_UPGRADE: 'building:upgrade',
  C_ARMY_TRAIN:       'army:train',
  
  // 服务端 → 客户端
  S_RESOURCE_UPDATE:  'resource:update',
  S_BUILDING_UPDATE:  'building:update',
  S_ERROR:            'error',
};

export const TICK_RATE = 1000; // 游戏心跳 1秒