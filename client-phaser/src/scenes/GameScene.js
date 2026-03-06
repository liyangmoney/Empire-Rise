import Phaser from 'phaser';
import { ResourcePanel } from '../ui/ResourcePanel.js';
import { ResourceWarehousePanel } from '../ui/ResourceWarehousePanel.js';
import { BuildingPanel } from '../ui/BuildingPanel.js';
import { ArmyPanel } from '../ui/ArmyPanel.js';
import { BattlePanel } from '../ui/BattlePanel.js';
import { GeneralPanel } from '../ui/GeneralPanel.js';
import { TaskPanel } from '../ui/TaskPanel.js';
import { MapPanel } from '../ui/MapPanel.js';
import { TimeDisplay } from '../ui/TimeDisplay.js';

/**
 * 游戏主场景 - 美化版
 */
export class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' });
  }

  init(data) {
    this.empireData = data.empireData || {};
    this.currentTab = 'buildings';
    this.panels = {};
  }

  create() {
    // 背景
    this.add.image(640, 360, 'bg-gradient');
    
    // 创建顶部栏
    this.createHeader();
    
    // 创建标签栏
    this.createTabBar();
    
    // 创建内容区域
    this.createContentArea();
    
    // 初始化面板
    this.initPanels();
    
    // 显示默认面板
    this.switchTab('buildings');
    
    // 注册事件
    this.registerEvents();
    
    // 更新数据
    this.updateAllData();
  }

  createHeader() {
    // 顶部背景 - 深色带边框
    const headerBg = this.add.graphics();
    headerBg.fillStyle(0x0a0a14, 0.95);
    headerBg.fillRect(0, 0, 1280, 70);
    headerBg.lineStyle(2, 0xffd700, 0.3);
    headerBg.lineBetween(0, 70, 1280, 70);
    
    // 时间显示（左侧）
    this.timeDisplay = new TimeDisplay(this, 120, 35);
    
    // 资源面板（中间）
    this.resourcePanel = new ResourcePanel(this, 680, 35);
    
    // 玩家信息（右侧）
    const playerBg = this.add.graphics();
    playerBg.fillStyle(0x1a1a2e, 0.8);
    playerBg.fillRoundedRect(1050, 10, 140, 50, 8);
    playerBg.lineStyle(1, 0xffd700, 0.3);
    playerBg.strokeRoundedRect(1050, 10, 140, 50, 8);
    
    this.add.text(1120, 25, this.empireData.playerName || '领主', {
      fontSize: '16px',
      fontFamily: 'Arial',
      color: '#ffd700'
    }).setOrigin(0.5);
    
    this.add.text(1120, 45, '在线', {
      fontSize: '12px',
      color: '#4CAF50'
    }).setOrigin(0.5);
    
    // 断开按钮
    const disconnectBtn = this.add.text(1220, 35, '退出', {
      fontSize: '14px',
      color: '#ff6666',
      backgroundColor: 'rgba(255,100,100,0.15)',
      padding: { x: 15, y: 8 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    
    disconnectBtn.on('pointerover', () => {
      disconnectBtn.setBackgroundColor('rgba(255,100,100,0.3)');
    });
    disconnectBtn.on('pointerout', () => {
      disconnectBtn.setBackgroundColor('rgba(255,100,100,0.15)');
    });
    disconnectBtn.on('pointerup', () => {
      window.socketManager.disconnect();
      this.scene.start('MenuScene');
    });
  }

  createTabBar() {
    const tabs = [
      { key: 'resources', label: '📦 资源', icon: '📦' },
      { key: 'buildings', label: '🏗️ 建筑', icon: '🏗️' },
      { key: 'army', label: '⚔️ 军队', icon: '⚔️' },
      { key: 'generals', label: '🎖️ 将领', icon: '🎖️' },
      { key: 'map', label: '🗺️ 地图', icon: '🗺️' },
      { key: 'battle', label: '🎯 战斗', icon: '🎯' },
      { key: 'tasks', label: '📋 任务', icon: '📋' }
    ];
    
    this.tabButtons = {};
    const startX = 140;
    const spacing = 170;
    
    tabs.forEach((tab, index) => {
      const x = startX + index * spacing;
      const y = 95;
      
      // 按钮背景
      const btnBg = this.add.graphics();
      
      // 按钮容器
      const container = this.add.container(x, y);
      
      // 文字
      const text = this.add.text(0, 0, tab.label, {
        fontSize: '18px',
        fontFamily: 'Arial',
        color: '#aaaaaa'
      }).setOrigin(0.5);
      container.add(text);
      
      // 交互区域
      const zone = this.add.zone(0, 0, 120, 40).setInteractive({ useHandCursor: true });
      container.add(zone);
      
      zone.on('pointerover', () => {
        if (this.currentTab !== tab.key) {
          text.setColor('#cccccc');
        }
      });
      
      zone.on('pointerout', () => {
        if (this.currentTab !== tab.key) {
          text.setColor('#aaaaaa');
        }
      });
      
      zone.on('pointerup', () => {
        this.switchTab(tab.key);
      });
      
      this.tabButtons[tab.key] = { container, text, bg: btnBg };
    });
  }

  createContentArea() {
    // 内容区域背景
    const bg = this.add.graphics();
    bg.fillStyle(0x0a0a14, 0.7);
    bg.fillRoundedRect(30, 125, 1220, 570, 12);
    bg.lineStyle(2, 0xffd700, 0.4);
    bg.strokeRoundedRect(30, 125, 1220, 570, 12);
    
    // 内发光效果
    const glow = this.add.graphics();
    glow.fillStyle(0xffd700, 0.03);
    glow.fillRoundedRect(35, 130, 1210, 560, 10);
  }

  initPanels() {
    this.panels.resources = new ResourceWarehousePanel(this, 640, 400);
    this.panels.buildings = new BuildingPanel(this, 640, 400);
    this.panels.army = new ArmyPanel(this, 640, 400);
    this.panels.generals = new GeneralPanel(this, 640, 400);
    this.panels.map = new MapPanel(this, 640, 400);
    this.panels.battle = new BattlePanel(this, 640, 400);
    this.panels.tasks = new TaskPanel(this, 640, 400);
    
    Object.values(this.panels).forEach(panel => {
      panel.setVisible(false);
    });
  }

  switchTab(tabKey) {
    // 更新按钮样式
    Object.keys(this.tabButtons).forEach(key => {
      const { text, bg } = this.tabButtons[key];
      bg.clear();
      
      if (key === tabKey) {
        text.setColor('#4CAF50');
        // 选中背景
        bg.fillStyle(0x4CAF50, 0.15);
        bg.fillRoundedRect(-60, -20, 120, 40, 8);
        bg.lineStyle(2, 0x4CAF50, 0.5);
        bg.strokeRoundedRect(-60, -20, 120, 40, 8);
      } else {
        text.setColor('#aaaaaa');
      }
    });
    
    // 切换面板
    if (this.panels[this.currentTab]) {
      this.panels[this.currentTab].setVisible(false);
    }
    
    this.currentTab = tabKey;
    if (this.panels[tabKey]) {
      this.panels[tabKey].setVisible(true);
      this.panels[tabKey].onShow?.();
    }
  }

  updateAllData() {
    if (this.empireData.resources) {
      this.resourcePanel.updateData(this.empireData.resources);
      this.panels.resources.updateData(this.empireData.resources);
    }
    if (this.empireData.stamina) {
      this.resourcePanel.updateStamina(this.empireData.stamina);
    }
    if (this.empireData.population) {
      this.resourcePanel.updatePopulation(this.empireData.population);
    }
    if (this.empireData.buildings) {
      this.panels.buildings.updateData(
        this.empireData.buildings,
        this.empireData.upgradeQueue || []
      );
    }
    if (this.empireData.army) {
      this.panels.army.updateData({
        units: this.empireData.army,
        currentSize: this.empireData.currentArmySize,
        maxSize: this.empireData.maxArmySize,
        trainingQueue: this.empireData.trainingQueue
      });
    }
    if (this.empireData.map) {
      this.panels.map.updateData({ map: this.empireData.map });
    }
    if (this.empireData.time) {
      this.timeDisplay.updateTime(this.empireData.time);
    }
  }

  registerEvents() {
    window.socketManager.on('resource:update', (data) => {
      if (data.allResources) {
        this.resourcePanel.updateData(data.allResources);
        this.panels.resources.updateData(data.allResources);
      }
    });
    
    window.socketManager.on('building:update', (data) => {
      if (data.buildings) {
        this.panels.buildings.updateData(data.buildings, data.upgradeQueue || []);
      }
    });
    
    window.socketManager.on('building:upgradeCompleted', (data) => {
      if (data.buildings) {
        this.panels.buildings.updateData(data.buildings, data.upgradeQueue || []);
      }
      this.showToast('建筑升级完成！');
    });
    
    window.socketManager.on('time:update', (data) => {
      this.timeDisplay.updateTime(data);
    });
    
    window.socketManager.on('map:view', (data) => {
      this.panels.map.updateData({ map: data });
    });
    
    window.socketManager.on('map:fullMap', (data) => {
      this.panels.map.updateData({ fullMap: data });
    });
    
    window.socketManager.on('error', (data) => {
      this.showToast(data.message || '操作失败', '#f44336');
    });
  }

  showToast(message, color = '#4CAF50') {
    const toast = this.add.container(640, 600);
    
    const bg = this.add.graphics();
    bg.fillStyle(color === '#4CAF50' ? 0x4CAF50 : 0xf44336, 0.95);
    bg.fillRoundedRect(-150, -22, 300, 44, 22);
    
    const text = this.add.text(0, 0, message, {
      fontSize: '16px',
      fontFamily: 'Arial',
      color: '#ffffff'
    }).setOrigin(0.5);
    
    toast.add([bg, text]);
    
    this.tweens.add({
      targets: toast,
      y: 560,
      alpha: 0,
      duration: 2000,
      ease: 'Power2',
      onComplete: () => toast.destroy()
    });
  }
}
