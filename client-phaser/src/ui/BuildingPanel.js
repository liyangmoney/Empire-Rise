import Phaser from 'phaser';
import { BUILDING_TYPES } from '../shared/constants.js';

/**
 * 建筑面板 - 参考原HTML客户端设计
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
    // 滚动容器
    this.scrollY = 0;
    this.contentHeight = 0;
    
    // 内容容器
    this.content = this.scene.add.container(0, 0);
    this.add(this.content);
    
    // 遮罩（限制显示区域）
    const maskGraphics = this.scene.make.graphics();
    maskGraphics.fillRect(-600, -280, 1200, 560);
    const mask = maskGraphics.createGeometryMask();
    this.content.setMask(mask);
    
    // 滚动事件
    this.scene.input.on('wheel', (pointer, gameObjects, deltaX, deltaY) => {
      if (this.visible && pointer.y > 120 && pointer.y < 680) {
        this.scrollY -= deltaY;
        this.scrollY = Math.max(-this.contentHeight + 500, Math.min(0, this.scrollY));
        this.content.y = this.scrollY;
      }
    });
  }
  
  updateData(buildings, upgradeQueue = []) {
    this.buildings = buildings;
    this.upgradeQueue = upgradeQueue;
    
    // 清除旧内容
    this.content.removeAll(true);
    this.buildingCards = {};
    
    let currentY = -250;
    
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
      
      // 分类标题
      const titleBg = this.scene.add.graphics();
      titleBg.fillStyle(0xffd700, 0.1);
      titleBg.fillRect(-580, currentY - 5, 1160, 35);
      this.content.add(titleBg);
      
      const title = this.scene.add.text(-570, currentY, catName, {
        fontSize: '20px',
        fontFamily: 'Microsoft YaHei, Arial',
        color: '#ffd700',
        fontStyle: 'bold'
      });
      this.content.add(title);
      
      // 底部分隔线
      const line = this.scene.add.graphics();
      line.lineStyle(1, 0xffd700, 0.3);
      line.lineBetween(-580, currentY + 25, 580, currentY + 25);
      this.content.add(line);
      
      currentY += 45;
      
      // 建筑网格 - 每行3个
      let col = 0;
      catBuildings.forEach((building, index) => {
        const x = -380 + col * 390;
        this.createBuildingCard(building, x, currentY);
        
        col++;
        if (col >= 3) {
          col = 0;
          currentY += 160;
        }
      });
      
      if (col > 0) {
        currentY += 160;
      }
      
      currentY += 20;
    }
    
    this.contentHeight = Math.abs(currentY);
  }
  
  createBuildingCard(building, x, y) {
    const cardW = 360;
    const cardH = 140;
    
    const card = this.scene.add.container(x, y);
    
    // 卡片背景
    const bg = this.scene.add.graphics();
    bg.fillStyle(0x000000, 0.4);
    bg.fillRoundedRect(-cardW/2, -cardH/2, cardW, cardH, 10);
    bg.lineStyle(1, 0x666666, 0.5);
    bg.strokeRoundedRect(-cardW/2, -cardH/2, cardW, cardH, 10);
    card.add(bg);
    
    // 图标背景
    const iconBg = this.scene.add.graphics();
    iconBg.fillStyle(0x000000, 0.3);
    iconBg.fillRoundedRect(-cardW/2 + 15, -cardH/2 + 15, 60, 60, 8);
    card.add(iconBg);
    
    // 图标（使用emoji代替）
    const iconMap = {
      lumber_mill: '🌲',
      farm: '🌾',
      quarry: '⛰️',
      iron_mine: '⚙️',
      crystal_mine: '💎',
      fishery: '🐟',
      orchard: '🍎',
      barracks: '⚔️',
      hospital: '🏥',
      wall: '🛡️',
      tower: '🏹',
      watchtower: '👁️',
      moat: '🌊',
      stables: '🐴',
      arsenal: '⚒️',
      house: '🏠',
      market: '🏪',
      tavern: '🍺',
      port: '⚓',
      blacksmith: '🔨',
      tech_institute: '🔬',
      imperial_palace: '👑',
      general_camp: '🎖️',
      warehouse_basic: '📦',
      warehouse_special: '📦'
    };
    
    const icon = this.scene.add.text(-cardW/2 + 45, -cardH/2 + 45, iconMap[building.id] || '🏛️', {
      fontSize: '36px'
    }).setOrigin(0.5);
    card.add(icon);
    
    // 建筑名称
    const nameText = this.scene.add.text(-cardW/2 + 90, -cardH/2 + 25, this.getBuildingName(building.id), {
      fontSize: '18px',
      fontFamily: 'Microsoft YaHei, Arial',
      color: '#ffffff',
      fontStyle: 'bold'
    });
    card.add(nameText);
    
    // 等级
    const levelText = this.scene.add.text(cardW/2 - 20, -cardH/2 + 25, `Lv.${building.level}`, {
      fontSize: '16px',
      fontFamily: 'Arial',
      color: '#ffd700'
    }).setOrigin(1, 0);
    card.add(levelText);
    
    // 最高等级提示
    const maxLevelText = this.scene.add.text(-cardW/2 + 90, -cardH/2 + 48, `最高等级: ${building.maxLevel}`, {
      fontSize: '12px',
      color: '#888888'
    });
    card.add(maxLevelText);
    
    // 描述
    const descText = this.scene.add.text(-cardW/2 + 20, -cardH/2 + 70, building.description || '暂无介绍', {
      fontSize: '13px',
      fontFamily: 'Microsoft YaHei, Arial',
      color: '#aaaaaa',
      wordWrap: { width: cardW - 40 }
    });
    card.add(descText);
    
    // 检查是否正在升级
    const upgradingTask = this.upgradeQueue.find(t => t.buildingTypeId === building.id && !t.completed);
    
    if (upgradingTask) {
      // 进度条背景
      const progressBg = this.scene.add.graphics();
      progressBg.fillStyle(0x333333, 1);
      progressBg.fillRoundedRect(-cardW/2 + 20, cardH/2 - 35, cardW - 40, 20, 10);
      card.add(progressBg);
      
      // 进度条
      const progress = Math.min(100, (upgradingTask._progress / upgradingTask.duration) * 100);
      const progressBar = this.scene.add.graphics();
      progressBar.fillGradientStyle(0x4CAF50, 0x4CAF50, 0x8BC34A, 0x8BC34A, 1);
      progressBar.fillRoundedRect(-cardW/2 + 20, cardH/2 - 35, (cardW - 40) * progress / 100, 20, 10);
      card.add(progressBar);
      
      // 时间文字
      const remaining = Math.ceil((upgradingTask.duration - upgradingTask._progress) / 1000);
      const timeText = this.scene.add.text(0, cardH/2 - 25, `升级中... ${remaining}秒`, {
        fontSize: '12px',
        color: '#ffffff'
      }).setOrigin(0.5);
      card.add(timeText);
      
      // 保存引用以便更新
      this.buildingCards[building.id] = { progressBar, timeText, bg, upgrading: true };
    } else if (building.level < building.maxLevel) {
      // 升级按钮
      const btnBg = this.scene.add.graphics();
      btnBg.fillStyle(0x4CAF50, 1);
      btnBg.fillRoundedRect(-50, cardH/2 - 40, 100, 32, 6);
      card.add(btnBg);
      
      const btnText = this.scene.add.text(0, cardH/2 - 24, '升级', {
        fontSize: '14px',
        fontFamily: 'Arial',
        color: '#ffffff',
        fontStyle: 'bold'
      }).setOrigin(0.5);
      card.add(btnText);
      
      // 按钮交互区
      const btnZone = this.scene.add.zone(0, cardH/2 - 24, 100, 32).setInteractive({ useHandCursor: true });
      card.add(btnZone);
      
      btnZone.on('pointerover', () => {
        btnBg.clear();
        btnBg.fillStyle(0x5CBF60, 1);
        btnBg.fillRoundedRect(-50, cardH/2 - 40, 100, 32, 6);
      });
      
      btnZone.on('pointerout', () => {
        btnBg.clear();
        btnBg.fillStyle(0x4CAF50, 1);
        btnBg.fillRoundedRect(-50, cardH/2 - 40, 100, 32, 6);
      });
      
      btnZone.on('pointerup', () => {
        window.socketManager.upgradeBuilding(building.id);
      });
      
      // 点击卡片显示详情
      const cardZone = this.scene.add.zone(0, 0, cardW - 100, cardH - 50).setInteractive({ useHandCursor: true });
      cardZone.on('pointerup', () => this.showBuildingDetail(building));
      card.add(cardZone);
      
      this.buildingCards[building.id] = { btnBg, btnText, btnZone, cardZone, bg, upgrading: false };
    } else {
      // 已满级
      const maxText = this.scene.add.text(0, cardH/2 - 24, '已满级', {
        fontSize: '14px',
        color: '#666666'
      }).setOrigin(0.5);
      card.add(maxText);
    }
    
    this.content.add(card);
  }
  
  getBuildingName(buildingId) {
    const names = {
      warehouse_basic: '📦 基础仓库',
      warehouse_special: '📦 特殊仓库',
      lumber_mill: '🌲 伐木场',
      farm: '🌾 农场',
      quarry: '⛰️ 采石场',
      iron_mine: '⚙️ 铁矿场',
      crystal_mine: '💎 水晶矿',
      fishery: '🐟 鱼塘',
      orchard: '🍎 果园',
      barracks: '⚔️ 兵营',
      hospital: '🏥 医院',
      wall: '🛡️ 城墙',
      tower: '🏹 箭塔',
      watchtower: '👁️ 瞭望塔',
      moat: '🌊 护城河',
      stables: '🐴 马厩',
      arsenal: '⚒️ 军械库',
      house: '🏠 民居',
      market: '🏪 市场',
      tavern: '🍺 酒馆',
      port: '⚓ 港口',
      blacksmith: '🔨 铁匠铺',
      tech_institute: '🔬 研究院',
      imperial_palace: '👑 皇宫',
      general_camp: '🎖️ 将领营'
    };
    return names[buildingId] || buildingId;
  }
  
  showBuildingDetail(building) {
    // 简单的详情弹窗
    const modal = this.scene.add.container(640, 360);
    modal.setDepth(1000);
    
    // 半透明背景
    const overlay = this.scene.add.graphics();
    overlay.fillStyle(0x000000, 0.8);
    overlay.fillRect(-640, -360, 1280, 720);
    overlay.setInteractive();
    overlay.on('pointerup', () => modal.destroy());
    modal.add(overlay);
    
    // 弹窗背景
    const bg = this.scene.add.graphics();
    bg.fillStyle(0x1a1a2e, 1);
    bg.fillRoundedRect(-250, -180, 500, 360, 12);
    bg.lineStyle(2, 0xffd700, 1);
    bg.strokeRoundedRect(-250, -180, 500, 360, 12);
    modal.add(bg);
    
    // 标题
    const title = this.scene.add.text(0, -150, this.getBuildingName(building.id), {
      fontSize: '24px',
      fontFamily: 'Microsoft YaHei, Arial',
      color: '#ffd700',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    modal.add(title);
    
    // 信息
    const info = this.scene.add.text(0, -50, 
      `当前等级: Lv.${building.level} / ${building.maxLevel}\n\n${building.description || '暂无详细介绍'}`, {
      fontSize: '14px',
      fontFamily: 'Microsoft YaHei, Arial',
      color: '#ffffff',
      align: 'center',
      lineSpacing: 10
    }).setOrigin(0.5);
    modal.add(info);
    
    // 关闭按钮
    const closeBtn = this.scene.add.text(0, 100, '关闭', {
      fontSize: '16px',
      color: '#ffffff',
      backgroundColor: '#666666',
      padding: { x: 30, y: 10 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    
    closeBtn.on('pointerup', () => modal.destroy());
    modal.add(closeBtn);
    
    this.scene.add.existing(modal);
  }
}
