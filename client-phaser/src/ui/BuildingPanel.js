import Phaser from 'phaser';
import { BUILDING_TYPES } from '../shared/constants.js';

/**
 * 建筑面板 - 美化版
 */
export class BuildingPanel extends Phaser.GameObjects.Container {
  constructor(scene, x, y) {
    super(scene, x, y);
    
    this.buildings = {};
    this.upgradeQueue = [];
    this.buildingCards = {};
    this.categoryContainers = {};
    
    this.scene = scene;
    
    this.categoryNames = {
      production: '⛏️ 生产建筑',
      military: '⚔️ 军事建筑', 
      economy: '💰 经济建筑',
      storage: '📦 仓储建筑',
      technology: '🔬 科技建筑',
      special: '👑 特殊建筑'
    };
    
    this.categoryColors = {
      production: 0x8B4513,
      military: 0x8B0000,
      economy: 0xFFD700,
      storage: 0x4a5568,
      technology: 0x4169E1,
      special: 0x9370DB
    };
    
    this.createUI();
    scene.add.existing(this);
  }
  
  createUI() {
    // 标题
    this.scene.add.text(0, -240, '🏗️ 建筑管理', {
      fontSize: '28px',
      fontFamily: 'Arial',
      color: '#ffd700',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    
    // 创建分类
    const categories = ['production', 'military', 'economy', 'storage', 'technology', 'special'];
    let currentY = -180;
    
    categories.forEach((cat, index) => {
      // 分类标题区域
      const catHeader = this.scene.add.container(-580, currentY);
      
      // 分类图标背景
      const iconBg = this.scene.add.graphics();
      iconBg.fillStyle(this.categoryColors[cat], 0.3);
      iconBg.fillCircle(0, 0, 18);
      catHeader.add(iconBg);
      
      // 分类名称
      const name = this.scene.add.text(30, 0, this.categoryNames[cat], {
        fontSize: '18px',
        fontFamily: 'Arial',
        color: '#ffffff',
        fontStyle: 'bold'
      }).setOrigin(0, 0.5);
      catHeader.add(name);
      
      this.add(catHeader);
      
      // 建筑卡片区域
      const cardContainer = this.scene.add.container(0, currentY + 50);
      this.categoryContainers[cat] = cardContainer;
      this.add(cardContainer);
      
      // 创建该分类的建筑卡片
      this.createCategoryBuildings(cat, cardContainer);
      
      currentY += 110;
    });
  }
  
  createCategoryBuildings(category, container) {
    const buildingTypes = Object.values(BUILDING_TYPES).filter(b => b.category === category);
    
    let offsetX = -520;
    buildingTypes.forEach((type, index) => {
      this.createBuildingCard(type, offsetX, 0, container);
      offsetX += 290;
    });
  }
  
  createBuildingCard(type, x, y, container) {
    const card = this.scene.add.container(x, y);
    
    const cardW = 270;
    const cardH = 80;
    
    // 卡片背景
    const bg = this.scene.add.graphics();
    bg.fillStyle(0x1a1a2e, 0.95);
    bg.fillRoundedRect(-cardW/2, -cardH/2, cardW, cardH, 10);
    bg.lineStyle(1, 0xffd700, 0.2);
    bg.strokeRoundedRect(-cardW/2, -cardH/2, cardW, cardH, 10);
    card.add(bg);
    
    // 左侧彩色条
    const colorBar = this.scene.add.graphics();
    colorBar.fillStyle(this.categoryColors[type.category] || 0x666666, 1);
    colorBar.fillRoundedRect(-cardW/2 + 2, -cardH/2 + 2, 6, cardH - 4, 3);
    card.add(colorBar);
    
    // 建筑名称 - 使用更大区域
    const name = this.scene.add.text(-cardW/2 + 20, -cardH/2 + 18, type.name, {
      fontSize: '15px',
      fontFamily: 'Microsoft YaHei, Arial',
      color: '#ffffff',
      fontStyle: 'bold'
    });
    card.add(name);
    
    // 等级 - 放在右侧
    const level = this.scene.add.text(cardW/2 - 10, -cardH/2 + 18, 'Lv.1', {
      fontSize: '13px',
      fontFamily: 'Arial',
      color: '#4CAF50'
    }).setOrigin(1, 0);
    card.add(level);
    
    // 人口消耗
    const pop = this.scene.add.text(-cardW/2 + 20, 5, `👥 ${type.populationCost || 0}`, {
      fontSize: '12px',
      color: '#aaaaaa'
    });
    card.add(pop);
    
    // 升级按钮
    const btnW = 90;
    const btnH = 26;
    const btnBg = this.scene.add.graphics();
    btnBg.fillStyle(0x2d5a3d, 1);
    btnBg.fillRoundedRect(-btnW/2, 20, btnW, btnH, 6);
    card.add(btnBg);
    
    const btnText = this.scene.add.text(0, 33, '🔨 升级', {
      fontSize: '12px',
      fontFamily: 'Arial',
      color: '#ffffff'
    }).setOrigin(0.5);
    card.add(btnText);
    
    // 按钮交互
    const btnZone = this.scene.add.zone(0, 33, btnW, btnH).setInteractive({ useHandCursor: true });
    card.add(btnZone);
    
    btnZone.on('pointerover', () => {
      btnBg.clear();
      btnBg.fillStyle(0x3d7a4d, 1);
      btnBg.fillRoundedRect(-btnW/2, 20, btnW, btnH, 6);
    });
    
    btnZone.on('pointerout', () => {
      btnBg.clear();
      btnBg.fillStyle(0x2d5a3d, 1);
      btnBg.fillRoundedRect(-btnW/2, 20, btnW, btnH, 6);
    });
    
    btnZone.on('pointerup', () => {
      this.onUpgradeClick(type.id);
    });
    
    // 进度条（初始隐藏）
    const progressBg = this.scene.add.graphics();
    progressBg.fillStyle(0x333333, 1);
    progressBg.fillRoundedRect(-cardW/2 + 15, 22, cardW - 30, 6, 3);
    progressBg.setVisible(false);
    card.add(progressBg);
    
    const progressBar = this.scene.add.graphics();
    progressBar.fillStyle(0x4CAF50, 1);
    progressBar.fillRoundedRect(-cardW/2 + 15, 22, 0, 6, 3);
    progressBar.setVisible(false);
    card.add(progressBar);
    
    const progressText = this.scene.add.text(0, 36, '', {
      fontSize: '10px',
      color: '#4CAF50'
    }).setOrigin(0.5);
    progressText.setVisible(false);
    card.add(progressText);
    
    container.add(card);
    
    // 保存引用
    this.buildingCards[type.id] = {
      card, bg, name, level, pop, btnBg, btnText, btnZone,
      progressBg, progressBar, progressText
    };
  }
  
  onUpgradeClick(buildingTypeId) {
    window.socketManager.upgradeBuilding(buildingTypeId);
  }
  
  updateData(buildings, upgradeQueue) {
    this.buildings = buildings;
    this.upgradeQueue = upgradeQueue || [];
    
    Object.entries(buildings).forEach(([id, building]) => {
      const card = this.buildingCards[id];
      if (card) {
        // 更新等级
        card.level.setText(`Lv.${building.level || 1}`);
        
        // 更新人口
        const type = BUILDING_TYPES[id];
        if (type) {
          const popCost = Math.floor((type.populationCost || 0) * Math.pow(1.2, building.level - 1));
          card.pop.setText(`👥 ${popCost}`);
        }
        
        // 检查是否在升级队列中
        const upgradeTask = this.upgradeQueue.find(t => t.buildingTypeId === id);
        if (upgradeTask) {
          // 显示进度条，隐藏按钮
          card.btnBg.setVisible(false);
          card.btnText.setVisible(false);
          card.btnZone.disableInteractive();
          card.progressBg.setVisible(true);
          card.progressBar.setVisible(true);
          card.progressText.setVisible(true);
          
          // 更新进度
          const progress = upgradeTask._progress / upgradeTask.duration;
          card.progressBar.clear();
          card.progressBar.fillStyle(0x4CAF50, 1);
          card.progressBar.fillRoundedRect(-120, 10, 240 * progress, 8, 4);
          
          const remaining = Math.ceil(upgradeTask.duration - upgradeTask._progress);
          const minutes = Math.floor(remaining / 60);
          const seconds = remaining % 60;
          card.progressText.setText(`升级中 ${minutes}:${seconds.toString().padStart(2, '0')}`);
        } else {
          // 显示按钮，隐藏进度条
          card.btnBg.setVisible(true);
          card.btnText.setVisible(true);
          card.btnZone.setInteractive({ useHandCursor: true });
          card.progressBg.setVisible(false);
          card.progressBar.setVisible(false);
          card.progressText.setVisible(false);
        }
      }
    });
  }
}
