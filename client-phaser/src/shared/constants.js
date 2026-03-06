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
  // 新增：渔业和农业特殊资源
  FISH_PRODUCT:   { id: 'fish_product',   name: '鱼产品',   category: 'special', description: '高质量蛋白质，提升士兵体力恢复' },
  FRUIT:          { id: 'fruit',          name: '水果',     category: 'special', description: '提升士气，可用于酿造果酒' },
  PREMIUM_FOOD:   { id: 'premium_food',   name: '精品食材', category: 'rare',    description: '高级食材，用于宴会和招募高级兵种' },
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
    outputBase: 1000,  
    outputGrowth: 1.3,
    description: '生产木材，升级提高产量（+20%/级）',
    category: 'production',
    populationCost: 10  // 升级需要10人口
  },
  FARM:             { 
    id: 'farm',             
    name: '农场',     
    maxLevel: 999, 
    outputBase: 800,   
    outputGrowth: 1.3,
    description: '生产粮食，升级提高产量（+20%/级）',
    category: 'production',
    populationCost: 10
  },
  QUARRY:           { 
    id: 'quarry',           
    name: '采石场',   
    maxLevel: 999, 
    outputBase: 600,   
    outputGrowth: 1.3,
    description: '开采石材，升级提高产量（+20%/级）',
    category: 'production',
    populationCost: 15
  },
  IRON_MINE:        { 
    id: 'iron_mine',        
    name: '铁矿场',   
    maxLevel: 999, 
    outputBase: 400,   
    outputGrowth: 1.3,
    description: '开采铁矿，升级提高产量（+20%/级）',
    category: 'production',
    populationCost: 20
  },
  CRYSTAL_MINE:     { 
    id: 'crystal_mine',     
    name: '水晶矿',   
    maxLevel: 999, 
    outputBase: 200,   
    outputGrowth: 1.2,
    description: '开采稀有水晶，用于高级科技和兵种，升级提高产量',
    category: 'production',
    populationCost: 30
  },
  // 资源生产类 - 更多资源建筑
  FISHERY:          { 
    id: 'fishery',          
    name: '鱼塘',     
    maxLevel: 999, 
    outputBase: 600,   
    outputGrowth: 1.3,
    description: '养鱼生产食物，适合靠近水源的城镇',
    category: 'production',
    populationCost: 12
  },
  ORCHARD:          { 
    id: 'orchard',          
    name: '果园',     
    maxLevel: 999, 
    outputBase: 500,   
    outputGrowth: 1.3,
    description: '种植果树，产出稳定的食物来源',
    category: 'production',
    populationCost: 12
  },
  
  // 军事类
  BARRACKS:         { 
    id: 'barracks',         
    name: '兵营',     
    maxLevel: 20,
    description: '训练士兵，升级解锁高级兵种、提升训练速度',
    category: 'military',
    populationCost: 50
  },
  HOSPITAL:         { 
    id: 'hospital',         
    name: '医院',     
    maxLevel: 20,
    description: '治疗伤兵，每级每小时恢复5点伤病单位',
    category: 'military',
    populationCost: 30
  },
  WALL:             { 
    id: 'wall',             
    name: '城墙',     
    maxLevel: 30,
    description: '防御工事，每级提升5%城防耐久',
    category: 'military',
    populationCost: 100
  },
  TOWER:            { 
    id: 'tower',            
    name: '箭塔',     
    maxLevel: 20,
    description: '防御建筑，每级增加守军10%攻击力',
    category: 'military',
    populationCost: 40
  },
  WATCHTOWER:       { 
    id: 'watchtower',       
    name: '瞭望塔',   
    maxLevel: 20,
    description: '增加视野范围，提前发现敌军入侵',
    category: 'military',
    populationCost: 35
  },
  MOAT:             { 
    id: 'moat',             
    name: '护城河',   
    maxLevel: 15,
    description: '环绕城市的防御工事，延缓敌军进攻',
    category: 'military',
    populationCost: 80
  },
  STABLES:          { 
    id: 'stables',          
    name: '马厩',     
    maxLevel: 20,
    description: '训练骑兵和战马，提升骑兵训练速度',
    category: 'military',
    populationCost: 45
  },
  ARSENAL:          { 
    id: 'arsenal',          
    name: '军械库',   
    maxLevel: 20,
    description: '储存武器装备，解锁高级兵种和攻城器械',
    category: 'military',
    populationCost: 60
  },
  
  // 经济类
  HOUSE:            { 
    id: 'house',            
    name: '民居',     
    maxLevel: 20,
    description: '增加人口上限和金币税收，每级+50人口、+5金币/小时',
    category: 'economy',
    populationCost: 0,  // 民居不消耗人口，而是增加人口上限
    populationBonus: 50 // 每级增加50人口上限
  },
  MARKET:           { 
    id: 'market',           
    name: '市场',     
    maxLevel: 15,
    description: '资源交易，每级降低2%交易损耗',
    category: 'economy',
    populationCost: 25
  },
  TAVERN:           { 
    id: 'tavern',           
    name: '酒馆',     
    maxLevel: 15,
    description: '提升士兵士气，增加金币收入，可招募雇佣兵',
    category: 'economy',
    populationCost: 20
  },
  PORT:             { 
    id: 'port',             
    name: '港口',     
    maxLevel: 20,
    description: '海上贸易，获取稀有资源和大量金币',
    category: 'economy',
    populationCost: 50
  },
  MINE_SHAFT:       { 
    id: 'mine_shaft',       
    name: '矿井',     
    maxLevel: 999,
    outputBase: 30,
    outputGrowth: 1.2,
    description: '深层开采，产出少量铁矿和水晶',
    category: 'production',
    populationCost: 25
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

// 渔业和农业科技研究
export const AGRICULTURE_TECHS = {
  // 渔业科技
  FISH_BREEDING: {
    id: 'fish_breeding',
    name: '良种繁育',
    description: '培育优良鱼种，提升鱼塘产量15%',
    category: 'fishery',
    cost: { wood: 200, food: 100, gold: 50 },
    effect: { fisheryOutputBonus: 0.15 },
    requireLevel: 3,
  },
  FISH_NET_TECH: {
    id: 'fish_net_tech',
    name: '渔网技术',
    description: '改进渔网，提升鱼塘产量20%，并有10%几率产出鱼产品',
    category: 'fishery',
    cost: { wood: 300, iron: 50, gold: 80 },
    effect: { fisheryOutputBonus: 0.20, fishProductChance: 0.10 },
    requireLevel: 5,
  },
  AQUACULTURE: {
    id: 'aquaculture',
    name: '水产养殖',
    description: '现代化水产养殖技术，鱼塘产量+25%，鱼产品产出+15%',
    category: 'fishery',
    cost: { wood: 500, stone: 200, iron: 100, crystal: 5 },
    effect: { fisheryOutputBonus: 0.25, fishProductBonus: 0.15 },
    requireLevel: 8,
  },
  
  // 农业科技  
  CROP_ROTATION: {
    id: 'crop_rotation',
    name: '轮作制度',
    description: '科学轮作，农场产量+15%，果园产量+10%',
    category: 'agriculture',
    cost: { wood: 150, food: 100, gold: 40 },
    effect: { farmOutputBonus: 0.15, orchardOutputBonus: 0.10 },
    requireLevel: 3,
  },
  IRRIGATION: {
    id: 'irrigation',
    name: '水利灌溉',
    description: '建设灌溉系统，农场和果园产量+20%',
    category: 'agriculture',
    cost: { wood: 300, stone: 150, gold: 60 },
    effect: { farmOutputBonus: 0.20, orchardOutputBonus: 0.20 },
    requireLevel: 5,
  },
  GRAFTING_TECH: {
    id: 'grafting_tech',
    name: '嫁接技术',
    description: '果树嫁接改良，果园产量+25%，10%几率产出水果',
    category: 'agriculture',
    cost: { wood: 400, food: 200, gold: 100 },
    effect: { orchardOutputBonus: 0.25, fruitChance: 0.10 },
    requireLevel: 6,
  },
  PREMIUM_CUISINE: {
    id: 'premium_cuisine',
    name: '精品美食',
    description: '研发高级食谱，鱼产品和水果可合成为精品食材',
    category: 'agriculture',
    cost: { wood: 600, stone: 300, iron: 100, crystal: 10 },
    effect: { enablePremiumFood: true },
    requireLevel: 10,
  },
};

// 渔业/农业贸易加成
export const TRADE_BONUSES = {
  FISH_EXPORT: {
    id: 'fish_export',
    name: '鱼类出口',
    description: '将鱼产品出口，换取双倍金币收益',
    multiplier: 2.0,
    requireResource: 'fish_product',
  },
  FRUIT_WINE: {
    id: 'fruit_wine',
    name: '果酒酿造',
    description: '用水果酿造果酒，市场价值+50%',
    multiplier: 1.5,
    requireResource: 'fruit',
  },
  GOURMET_TRADE: {
    id: 'gourmet_trade',
    name: '美食贸易',
    description: '精品食材高价出售，金币收益+200%',
    multiplier: 3.0,
    requireResource: 'premium_food',
  },
};
