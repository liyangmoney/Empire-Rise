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
  // 仓库类 - 无限升级
  WAREHOUSE_BASIC:  { 
    id: 'warehouse_basic',  
    name: '基础仓库', 
    maxLevel: 999, 
    capacityBase: 1000, 
    capacityGrowth: 1.5,
    description: '储存木材、石材、粮食等基础资源，升级提升容量',
    category: 'storage'
  },
  WAREHOUSE_SPECIAL:{ 
    id: 'warehouse_special',
    name: '特殊仓库', 
    maxLevel: 999, 
    capacityBase: 500,  
    capacityGrowth: 1.5,
    description: '储存铁矿、水晶等稀有资源，升级提升容量',
    category: 'storage'
  },
  
  // 资源生产类 - 无限升级
  LUMBER_MILL:      { 
    id: 'lumber_mill',      
    name: '伐木场',   
    maxLevel: 999, 
    outputBase: 100,  
    outputGrowth: 1.3,
    description: '生产木材，升级提高产量（+20%/级）',
    category: 'production'
  },
  FARM:             { 
    id: 'farm',             
    name: '农场',     
    maxLevel: 999, 
    outputBase: 80,   
    outputGrowth: 1.3,
    description: '生产粮食，升级提高产量（+20%/级）',
    category: 'production'
  },
  QUARRY:           { 
    id: 'quarry',           
    name: '采石场',   
    maxLevel: 999, 
    outputBase: 60,   
    outputGrowth: 1.3,
    description: '开采石材，升级提高产量（+20%/级）',
    category: 'production'
  },
  IRON_MINE:        { 
    id: 'iron_mine',        
    name: '铁矿场',   
    maxLevel: 999, 
    outputBase: 40,   
    outputGrowth: 1.3,
    description: '开采铁矿，升级提高产量（+20%/级）',
    category: 'production'
  },
  CRYSTAL_MINE:     { 
    id: 'crystal_mine',     
    name: '水晶矿',   
    maxLevel: 999, 
    outputBase: 20,   
    outputGrowth: 1.2,
    description: '开采稀有水晶，用于高级科技和兵种，升级提高产量',
    category: 'production'
  },
  
  // 军事类
  BARRACKS:         { 
    id: 'barracks',         
    name: '兵营',     
    maxLevel: 20,
    description: '训练士兵，升级解锁高级兵种、提升训练速度',
    category: 'military'
  },
  HOSPITAL:         { 
    id: 'hospital',         
    name: '医院',     
    maxLevel: 20,
    description: '治疗伤兵，每级每小时恢复5点伤病单位',
    category: 'military'
  },
  WALL:             { 
    id: 'wall',             
    name: '城墙',     
    maxLevel: 30,
    description: '防御工事，每级提升5%城防耐久',
    category: 'military'
  },
  TOWER:            { 
    id: 'tower',            
    name: '箭塔',     
    maxLevel: 20,
    description: '防御建筑，每级增加守军10%攻击力',
    category: 'military'
  },
  
  // 经济类
  HOUSE:            { 
    id: 'house',            
    name: '民居',     
    maxLevel: 20,
    description: '增加人口上限和金币税收，每级+50人口、+5金币/小时',
    category: 'economy'
  },
  MARKET:           { 
    id: 'market',           
    name: '市场',     
    maxLevel: 15,
    description: '资源交易，每级降低2%交易损耗',
    category: 'economy'
  },
  
  // 科技类
  BLACKSMITH:       { 
    id: 'blacksmith',       
    name: '铁匠铺',   
    maxLevel: 15,
    description: '锻造装备，升级解锁高级装备、提升装备属性',
    category: 'technology'
  },
  TECH_INSTITUTE:   { 
    id: 'tech_institute',   
    name: '研究院',   
    maxLevel: 15,
    description: '研究科技，升级解锁新科技、提升各项加成',
    category: 'technology'
  },
  
  // 特殊建筑
  IMPERIAL_PALACE:  { 
    id: 'imperial_palace',  
    name: '皇宫',     
    maxLevel: 10,
    description: '帝国核心，提升所有资源产量和军队上限',
    category: 'special'
  },
  GENERAL_CAMP:     { 
    id: 'general_camp',     
    name: '将领营',   
    maxLevel: 15,
    description: '招募和培养将领，升级增加将领上限和培养速度',
    category: 'special'
  },
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
