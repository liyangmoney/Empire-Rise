import Phaser from 'phaser';
import { BUILDING_TYPES } from '../shared/constants.js';

/**
 * 建筑面板 - 修正版
 */
export class BuildingPanel extends Phaser.GameObjects.Container {
  constructor(scene, x, y) {
    super(scene, x, y);
    
    this.buildings = {};
    this.upgradeQueue = [];
    this.buildingCards = {};
    
    this.scene = scene;
    
    this.categoryNames = {
      production: '🌾 资源生产',
      storage: '📦 仓库',
      military: '⚔️ 军事',
      economy: '💰 经济',
      technology: '🔬 科技',
      special: '👑 特殊',
      other: '🏛️ 其他'
    };
    
    this.createUI();
    scene.add.existing(this);
  }
  
  createUI() {
    // 内容容器 - 相对于面板中心
    this.content = this.scene.add.container(0, -200);
    this.add(this.content);
    
    // 遮罩（限制显示区域）
    const maskGraphics = this.scene.make.graphics();
    maskGraphics.fillRect(-580, -250, 1160, 500);
    const mask = maskGraphics.createGeometryMask();
    this.content.setMask(mask);
    
    // 滚动
    this.scrollY = 0;
    this.scene.input.on('wheel', (pointer, gameObjects, deltaX, deltaY) => {
      if (this.visible && pointer.y > 120 && pointer.y < 680) {
        this.scrollY = Math.max(-this.maxScroll, Math.min(0, this.scrollY - deltaY * 0.5));
        this.content.y = -200 + this.scrollY;
      }
    });
  }
  
  updateData(buildings, upgradeQueue = []) {
    this.buildings = buildings;
    this.upgradeQueue = upgradeQueue;
    
    // 清除旧内容
    this.content.removeAll(true);
    this.buildingCards = {};
    
    let currentY = 0;
    
    // 按分类组织建筑
    const buildingsByCategory = {};
    for (const [id, data] of Object.entries(buildings)) {
      const cat = data.category || 'other';
      if (!buildingsByCategory[cat]) buildingsByCategory[cat] = [];
      buildingsByCategory[cat].push({ id, ...data });
    }
    
    // 按分类渲染
    for (const [catKey, catName] of Object.entries(this.categoryNames)) {
      const catBuildings = buildingsByCategory[catKey];
      if (!catBuildings || catBuildings.length === 0) continue;
      
      // 分类标题背景
      const titleBg = this.scene.add.graphics();
      titleBg.fillStyle(0xffd700, 0.1);
      titleBg.fillRect(-560, currentY, 1120, 36);
      this.content.add(titleBg);
      
      // 分类标题
      const title = this.scene.add.text(-550, currentY + 8, catName, {
        fontSize: '18px',
        fontFamily: 'Microsoft YaHei, Arial',
        color: '#ffd700',
        fontStyle: 'bold'
      });
      this.content.add(title);
      
      // 下划线
      const line = this.scene.add.graphics();
      line.lineStyle(1, 0xffd700, 0.3);
      line.lineBetween(-550, currentY + 32, 550, currentY + 32);
      this.content.add(line);
      
      currentY += 45;
      
      // 建筑网格 - 每行3个
      let col = 0;
      const startY = currentY;
      catBuildings.forEach((building, index) => {
        const x = -370 + col * 370;
        const y = startY + Math.floor(index / 3) * 150;
        this.createBuildingCard(building, x, y);
        
        col++;
        if (col >= 3) {
          col = 0;
        }
        
        if (col === 0 || index === catBuildings.length - 1) {
          currentY = y + 150;
        }
      });
      
      currentY += 20;
    }
    
    this.maxScroll = Math.max(0, currentY - 450);
  }
  
  createBuildingCard(building, x, y) {
    const cardW = 340;
    const cardH = 130;
    
    const card = this.scene.add.container(x, y);
    
    // 卡片背景
    const bg = this.scene.add.graphics();
    bg.fillStyle(0x1a1a2e, 0.8);
    bg.fillRoundedRect(-cardW/2, -cardH/2, cardW, cardH, 8);
    bg.lineStyle(1, 0x444444, 0.5);
    bg.strokeRoundedRect(-cardW/2, -cardH/2, cardW, cardH, 8);
    card.add(bg);
    
    // 图标背景
    const iconBg = this.scene.add.graphics();
    iconBg.fillStyle(0x000000, 0.4);
    iconBg.fillRoundedRect(-cardW/2 + 12, -cardH/2 + 12, 50, 50, 6);
    card.add(iconBg);
    
    // 图标
    const iconMap = {
      lumber_mill: '🌲', farm: '🌾', quarry: '⛰️', iron_mine: '⚙️',
      crystal_mine: '💎', fishery: '🐟', orchard: '🍎',
      barracks: '⚔️', hospital: '🏥', wall: '🛡️', tower: '🏹',
      house: '🏠', market: '🏪', tavern: '🍺', port: '⚓',
      blacksmith: '🔨', tech_institute: '🔬', imperial_palace: '👑',
      general_camp: '🎖️', warehouse_basic: '📦', warehouse_special: '📦'
    };
    
    const icon = this.scene.add.text(-cardW/2 + 37, -cardH/2 + 37, iconMap[building.id] || '🏛️', {
      fontSize: '28px'
    }).setOrigin(0.5);
    card.add(icon);
    
    // 建筑名称
    const nameText = this.scene.add.text(-cardW/2 + 75, -cardH/2 + 20, this.getBuildingName(building.id), {
      fontSize: '16px',
      fontFamily: 'Microsoft YaHei, Arial',
      color: '#ffffff',
      fontStyle: 'bold'
    });
    card.add(nameText);
    
    // 等级
    const levelText = this.scene.add.text(cardW/2 - 15, -cardH/2 + 20, `Lv.${building.level}`, {
      fontSize: '14px',
      color: '#ffd700'
    }).setOrigin(1, 0);
    card.add(levelText);
    
    // 描述
    const descText = this.scene.add.text(-cardW/2 + 75, -cardH/2 + 42, building.description || '暂无介绍', {
      fontSize: '12px',
      color: '#888888',
      wordWrap: { width: cardW - 100 }
    });
    card.add(descText);
    
    // 检查是否正在升级
    const upgradingTask = this.upgradeQueue.find(t => t.buildingTypeId === building.id && !t.completed);
    
    if (upgradingTask) {
      // 进度条背景
      const progressBg = this.scene.add.graphics();
      progressBg.fillStyle(0x333333, 1);
      progressBg.fillRoundedRect(-cardW/2 + 15, cardH/2 - 30, cardW - 30, 18, 9);
      card.add(progressBg);
      
      // 进度条
      const progress = Math.min(100, (upgradingTask._progress / upgradingTask.duration) * 100);
      const progressBar = this.scene.add.graphics();
      progressBar.fillGradientStyle(0x4CAF50, 0x4CAF50, 0x8BC34A, 0x8BC34A, 1);
      progressBar.fillRoundedRect(-cardW/2 + 15, cardH/2 - 30, (cardW - 30) * progress / 100, 18, 9);
      card.add(progressBar);
      
      // 时间文字
      const remaining = Math.ceil((upgradingTask.duration - upgradingTask._progress) / 1000);
      const timeText = this.scene.add.text(0, cardH/2 - 21, `升级中... ${remaining}秒`, {
        fontSize: '11px',
        color: '#ffffff'
      }).setOrigin(0.5);
      card.add(timeText);
      
      this.buildingCards[building.id] = { progressBar, timeText, bg };
    } else if (building.level < building.maxLevel) {
      // 升级按钮
      const btnBg = this.scene.add.graphics();
      btnBg.fillStyle(0x4CAF50, 1);
      btnBg.fillRoundedRect(-45, cardH/2 - 35, 90, 28, 6);
      card.add(btnBg);
      
      const btnText = this.scene.add.text(0, cardH/2 - 21, '升级', {
        fontSize: '13px',
        color: '#ffffff',
        fontStyle: 'bold'
      }).setOrigin(0.5);
      card.add(btnText);
      
      // 按钮交互
      const btnZone = this.scene.add.zone(0, cardH/2 - 21, 90, 28).setInteractive({ useHandCursor: true });
      card.add(btnZone);
      
      btnZone.on('pointerover', () => {
        btnBg.clear();
        btnBg.fillStyle(0x5CBF60, 1);
        btnBg.fillRoundedRect(-45, cardH/2 - 35, 90, 28, 6);
      });
      
      btnZone.on('pointerout', () => {
        btnBg.clear();
        btnBg.fillStyle(0x4CAF50, 1);
        btnBg.fillRoundedRect(-45, cardH/2 - 35, 90, 28, 6);
      });
      
      btnZone.on('pointerup', () => {
        window.socketManager.upgradeBuilding(building.id);
      });
      
      this.buildingCards[building.id] = { btnBg, btnText, btnZone, bg };
    } else {
      // 已满级
      const maxText = this.scene.add.text(0, cardH/2 - 21, '已满级', {
        fontSize: '13px',
        color: '#666666'
      }).setOrigin(0.5);
      card.add(maxText);
    }
    
    this.content.add(card);
  }
  
  getBuildingName(buildingId) {
    const names = {
      warehouse_basic: '📦 基础仓库', warehouse_special: '📦 特殊仓库',
      lumber_mill: '🌲 伐木场', farm: '🌾 农场', quarry: '⛰️ 采石场',
      iron_mine: '⚙️ 铁矿场', crystal_mine: '💎 水晶矿',
      fishery: '🐟 鱼塘', orchard: '🍎 果园',
      barracks: '⚔️ 兵营', hospital: '🏥 医院', wall: '🛡️ 城墙',
      tower: '🏹 箭塔', stables: '🐴 马厩', arsenal: '⚒️ 军械库',
      house: '🏠 民居', market: '🏪 市场', tavern: '🍺 酒馆',
      port: '⚓ 港口', blacksmith: '🔨 铁匠铺', tech_institute: '🔬 研究院',
      imperial_palace: '👑 皇宫', general_camp: '🎖️ 将领营'
    };
    return names[buildingId] || buildingId;
  }
}
