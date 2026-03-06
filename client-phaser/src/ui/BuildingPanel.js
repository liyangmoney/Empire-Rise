import Phaser from 'phaser';
import { BUILDING_TYPES } from '../shared/constants.js';

/**
 * 建筑面板
 */
export class BuildingPanel extends Phaser.GameObjects.Container {
  constructor(scene, x, y) {
    super(scene, x, y);
    
    this.buildings = {};
    this.upgradeQueue = [];
    this.buildingCards = {};
    this.categoryContainers = {};
    
    this.scene = scene;
    
    // 建筑分类名称
    this.categoryNames = {
      production: '⛏️ 生产建筑',
      military: '⚔️ 军事建筑',
      economy: '💰 经济建筑',
      storage: '📦 仓储建筑',
      technology: '🔬 科技建筑',
      special: '👑 特殊建筑'
    };
    
    this.createUI();
    
    scene.add.existing(this);
  }
  
  createUI() {
    // 标题
    this.scene.add.text(0, -250, '🏗️ 建筑系统', {
      fontSize: '28px',
      fontFamily: 'Microsoft YaHei',
      color: '#ffd700',
      fontStyle: 'bold'
    }).setOrigin(0.5).setScrollFactor(0);
    
    // 创建分类容器
    const categories = ['production', 'military', 'economy', 'storage', 'technology', 'special'];
    let startY = -200;
    
    categories.forEach((cat, index) => {
      const container = this.scene.add.container(0, startY + index * 80);
      this.categoryContainers[cat] = container;
      this.add(container);
      
      // 分类标题
      const title = this.scene.add.text(-500, 0, this.categoryNames[cat], {
        fontSize: '16px',
        color: '#ffd700',
        fontStyle: 'bold'
      });
      container.add(title);
      
      // 建筑列表区域
      this.createBuildingList(cat, container);
    });
  }
  
  createBuildingList(category, container) {
    // 获取该分类的建筑类型
    const buildingTypes = Object.values(BUILDING_TYPES).filter(b => b.category === category);
    
    let offsetX = -400;
    buildingTypes.forEach((type, index) => {
      if (index > 0 && index % 4 === 0) {
        offsetX = -400;
      }
      
      this.createBuildingCard(type, offsetX, 40, container);
      offsetX += 200;
    });
  }
  
  createBuildingCard(type, x, y, container) {
    const card = this.scene.add.container(x, y);
    
    // 卡片背景
    const bg = this.scene.add.graphics();
    bg.fillStyle(0x000000, 0.5);
    bg.fillRoundedRect(-90, -35, 180, 70, 8);
    bg.lineStyle(1, 0xffd700, 0.3);
    bg.strokeRoundedRect(-90, -35, 180, 70, 8);
    card.add(bg);
    
    // 建筑名称
    const nameText = this.scene.add.text(-80, -25, type.name, {
      fontSize: '14px',
      color: '#fff',
      fontStyle: 'bold'
    });
    card.add(nameText);
    
    // 等级显示
    const levelText = this.scene.add.text(80, -25, 'Lv.1', {
      fontSize: '12px',
      color: '#4CAF50'
    }).setOrigin(1, 0);
    card.add(levelText);
    
    // 人口消耗
    const popText = this.scene.add.text(-80, -5, `👥 ${type.populationCost || 0}`, {
      fontSize: '11px',
      color: '#aaa'
    });
    card.add(popText);
    
    // 升级按钮
    const upgradeBtn = this.scene.add.text(0, 20, '🔨 升级', {
      fontSize: '12px',
      color: '#4CAF50',
      backgroundColor: 'rgba(76,175,80,0.2)',
      padding: { x: 15, y: 5 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    
    upgradeBtn.on('pointerover', () => {
      upgradeBtn.setBackgroundColor('rgba(76,175,80,0.4)');
    });
    
    upgradeBtn.on('pointerout', () => {
      upgradeBtn.setBackgroundColor('rgba(76,175,80,0.2)');
    });
    
    upgradeBtn.on('pointerup', () => {
      this.onUpgradeClick(type.id);
    });
    
    card.add(upgradeBtn);
    
    // 进度条（初始隐藏）
    const progressBg = this.scene.add.graphics();
    progressBg.fillStyle(0x333333, 1);
    progressBg.fillRoundedRect(-80, 15, 160, 8, 4);
    progressBg.setVisible(false);
    card.add(progressBg);
    
    const progressBar = this.scene.add.graphics();
    progressBar.fillStyle(0x4CAF50, 1);
    progressBar.fillRoundedRect(-80, 15, 0, 8, 4);
    progressBar.setVisible(false);
    card.add(progressBar);
    
    const progressText = this.scene.add.text(0, 32, '', {
      fontSize: '10px',
      color: '#4CAF50'
    }).setOrigin(0.5);
    progressText.setVisible(false);
    card.add(progressText);
    
    container.add(card);
    
    // 保存引用
    this.buildingCards[type.id] = {
      card,
      bg,
      nameText,
      levelText,
      upgradeBtn,
      progressBg,
      progressBar,
      progressText
    };
  }
  
  onUpgradeClick(buildingId) {
    // 请求升级预览
    window.socketManager.previewUpgrade(buildingId);
    
    // 监听预览结果
    const unlisten = window.socketManager.on('building:upgradePreview', (preview) => {
      if (preview.buildingTypeId === buildingId) {
        unlisten();
        this.showUpgradeConfirm(preview);
      }
    });
  }
  
  showUpgradeConfirm(preview) {
    // 创建确认弹窗
    const modal = this.scene.add.container(640, 360);
    modal.setDepth(1000);
    
    // 半透明背景
    const overlay = this.scene.add.graphics();
    overlay.fillStyle(0x000000, 0.8);
    overlay.fillRect(-640, -360, 1280, 720);
    modal.add(overlay);
    
    // 弹窗背景
    const bg = this.scene.add.graphics();
    bg.fillStyle(0x1a1a2e, 1);
    bg.fillRoundedRect(-200, -150, 400, 300, 12);
    bg.lineStyle(2, 0xffd700, 1);
    bg.strokeRoundedRect(-200, -150, 400, 300, 12);
    modal.add(bg);
    
    // 标题
    const title = this.scene.add.text(0, -120, `升级 ${this.getBuildingName(preview.buildingTypeId)}`, {
      fontSize: '20px',
      color: '#ffd700',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    modal.add(title);
    
    // 等级信息
    const levelInfo = this.scene.add.text(0, -85, `Lv.${preview.currentLevel} → Lv.${preview.nextLevel}`, {
      fontSize: '16px',
      color: '#4CAF50'
    }).setOrigin(0.5);
    modal.add(levelInfo);
    
    // 资源消耗
    let yOffset = -50;
    Object.entries(preview.cost).forEach(([res, amount]) => {
      const costText = this.scene.add.text(0, yOffset, `${this.getResourceName(res)}: -${amount}`, {
        fontSize: '14px',
        color: '#f44336'
      }).setOrigin(0.5);
      modal.add(costText);
      yOffset += 25;
    });
    
    // 人口消耗
    if (preview.populationCost > 0) {
      const popText = this.scene.add.text(0, yOffset, `👥 人口: -${preview.populationCost}`, {
        fontSize: '14px',
        color: '#2196F3'
      }).setOrigin(0.5);
      modal.add(popText);
      yOffset += 25;
    }
    
    // 时间
    const timeText = this.scene.add.text(0, yOffset, `⏱️ ${this.formatDuration(preview.duration)}`, {
      fontSize: '14px',
      color: '#aaa'
    }).setOrigin(0.5);
    modal.add(timeText);
    
    // 确认按钮
    const confirmBtn = this.scene.add.text(-60, 100, '确认', {
      fontSize: '16px',
      color: '#fff',
      backgroundColor: '#4CAF50',
      padding: { x: 30, y: 10 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    
    confirmBtn.on('pointerup', () => {
      window.socketManager.upgradeBuilding(preview.buildingTypeId);
      modal.destroy();
    });
    modal.add(confirmBtn);
    
    // 取消按钮
    const cancelBtn = this.scene.add.text(60, 100, '取消', {
      fontSize: '16px',
      color: '#fff',
      backgroundColor: '#666',
      padding: { x: 30, y: 10 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    
    cancelBtn.on('pointerup', () => {
      modal.destroy();
    });
    modal.add(cancelBtn);
    
    this.scene.add.existing(modal);
  }
  
  getBuildingName(id) {
    return BUILDING_TYPES[id.toUpperCase()]?.name || id;
  }
  
  getResourceName(id) {
    const names = {
      wood: '🌲 木材',
      stone: '⛰️ 石材',
      food: '🌾 粮食',
      iron: '⚙️ 铁矿',
      crystal: '💎 水晶',
      gold: '💰 金币'
    };
    return names[id] || id;
  }
  
  formatDuration(seconds) {
    if (seconds < 60) return `${seconds}秒`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}分${seconds % 60}秒`;
    return `${Math.floor(seconds / 3600)}小时${Math.floor((seconds % 3600) / 60)}分`;
  }

  updateData(buildings, upgradeQueue = []) {
    this.buildings = buildings || {};
    this.upgradeQueue = upgradeQueue || [];
    
    // 更新每个建筑卡片
    Object.entries(this.buildings).forEach(([id, building]) => {
      const card = this.buildingCards[id];
      if (card) {
        // 更新等级
        card.levelText.setText(`Lv.${building.level}`);
        
        // 检查是否在升级中
        const upgradingTask = this.upgradeQueue.find(t => t.buildingTypeId === id && !t.completed);
        
        if (upgradingTask) {
          // 显示进度条，隐藏升级按钮
          card.upgradeBtn.setVisible(false);
          card.progressBg.setVisible(true);
          card.progressBar.setVisible(true);
          card.progressText.setVisible(true);
          
          // 更新进度
          const progress = upgradingTask._progress / upgradingTask.duration;
          const width = 160 * progress;
          card.progressBar.clear();
          card.progressBar.fillStyle(0x4CAF50, 1);
          card.progressBar.fillRoundedRect(-80, 15, width, 8, 4);
          
          const remaining = Math.ceil((upgradingTask.duration - upgradingTask._progress) / 1000);
          card.progressText.setText(`升级中... ${remaining}秒`);
        } else {
          // 隐藏进度条，显示升级按钮
          card.upgradeBtn.setVisible(true);
          card.progressBg.setVisible(false);
          card.progressBar.setVisible(false);
          card.progressText.setVisible(false);
        }
      }
    });
  }

  onShow() {
    // 面板显示时刷新数据
  }
}
