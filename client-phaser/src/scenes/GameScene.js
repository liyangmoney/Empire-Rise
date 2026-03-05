import Phaser from 'phaser';
import { ResourcePanel } from '../ui/ResourcePanel.js';
import { BuildingPanel } from '../ui/BuildingPanel.js';
import { ArmyPanel } from '../ui/ArmyPanel.js';
import { BattlePanel } from '../ui/BattlePanel.js';
import { GeneralPanel } from '../ui/GeneralPanel.js';
import { TaskPanel } from '../ui/TaskPanel.js';
import { TimeDisplay } from '../ui/TimeDisplay.js';

/**
 * 游戏主场景
 */
export class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' });
  }

  init(data) {
    this.empireData = data.empireData || {};
    this.currentTab = 'resources';
    this.panels = {};
  }

  create() {
    // 背景
    this.add.image(640, 360, 'bg-gradient');
    
    // 创建全局资源栏（顶部）
    this.createTopBar();
    
    // 创建标签栏
    this.createTabBar();
    
    // 创建内容区域
    this.createContentArea();
    
    // 初始化各个面板
    this.initPanels();
    
    // 显示默认面板
    this.switchTab('resources');
    
    // 注册 Socket 事件
    this.registerSocketEvents();
    
    // 启动定时更新
    this.startAutoUpdate();
  }

  createTopBar() {
    // 顶部资源栏背景
    const topBar = this.add.graphics();
    topBar.fillStyle(0x000000, 0.8);
    topBar.fillRect(0, 0, 1280, 60);
    
    // 时间显示
    this.timeDisplay = new TimeDisplay(this, 150, 30);
    
    // 资源显示
    this.resourcePanel = new ResourcePanel(this, 640, 30);
    
    // 玩家信息
    this.add.text(1100, 20, this.empireData.playerName || '未知玩家', {
      fontSize: '16px',
      color: '#ffd700'
    });
    
    // 断开连接按钮
    const disconnectBtn = this.add.text(1200, 20, '断开', {
      fontSize: '14px',
      color: '#f44336',
      backgroundColor: 'rgba(244,67,54,0.2)',
      padding: { x: 10, y: 5 }
    }).setInteractive({ useHandCursor: true });
    
    disconnectBtn.on('pointerup', () => {
      window.socketManager.disconnect();
      this.scene.start('MenuScene');
    });
  }

  createTabBar() {
    const tabs = [
      { key: 'resources', label: '📦 资源', x: 150 },
      { key: 'buildings', label: '🏗️ 建筑', x: 300 },
      { key: 'army', label: '⚔️ 军队', x: 450 },
      { key: 'generals', label: '🎖️ 将领', x: 600 },
      { key: 'battle', label: '🎯 战斗', x: 750 },
      { key: 'tasks', label: '📋 任务', x: 900 }
    ];
    
    this.tabButtons = {};
    
    tabs.forEach(tab => {
      const btn = this.add.text(tab.x, 90, tab.label, {
        fontSize: '18px',
        fontFamily: 'Microsoft YaHei',
        color: '#aaa',
        padding: { x: 20, y: 10 }
      }).setOrigin(0.5).setInteractive({ useHandCursor: true });
      
      btn.on('pointerover', () => {
        if (this.currentTab !== tab.key) {
          btn.setColor('#ccc');
        }
      });
      
      btn.on('pointerout', () => {
        if (this.currentTab !== tab.key) {
          btn.setColor('#aaa');
        }
      });
      
      btn.on('pointerup', () => {
        this.switchTab(tab.key);
      });
      
      this.tabButtons[tab.key] = btn;
    });
    
    // 选中指示器
    this.tabIndicator = this.add.graphics();
  }

  createContentArea() {
    // 内容区域背景
    const bg = this.add.graphics();
    bg.fillStyle(0x000000, 0.5);
    bg.fillRoundedRect(40, 120, 1200, 560, 10);
    bg.lineStyle(2, 0xffd700, 0.3);
    bg.strokeRoundedRect(40, 120, 1200, 560, 10);
    
    // 内容容器
    this.contentContainer = this.add.container(0, 0);
  }

  initPanels() {
    this.panels.resources = new ResourcePanel(this, 640, 400);
    this.panels.buildings = new BuildingPanel(this, 640, 400);
    this.panels.army = new ArmyPanel(this, 640, 400);
    this.panels.generals = new GeneralPanel(this, 640, 400);
    this.panels.battle = new BattlePanel(this, 640, 400);
    this.panels.tasks = new TaskPanel(this, 640, 400);
    
    // 初始都隐藏
    Object.values(this.panels).forEach(panel => {
      panel.setVisible(false);
    });
  }

  switchTab(tabKey) {
    // 更新按钮样式
    Object.keys(this.tabButtons).forEach(key => {
      const btn = this.tabButtons[key];
      if (key === tabKey) {
        btn.setColor('#4CAF50');
        btn.setBackgroundColor('rgba(76,175,80,0.2)');
      } else {
        btn.setColor('#aaa');
        btn.setBackgroundColor(null);
      }
    });
    
    // 隐藏当前面板
    if (this.panels[this.currentTab]) {
      this.panels[this.currentTab].setVisible(false);
    }
    
    // 显示新面板
    this.currentTab = tabKey;
    if (this.panels[tabKey]) {
      this.panels[tabKey].setVisible(true);
      this.panels[tabKey].onShow();
    }
    
    // 更新指示器
    const btn = this.tabButtons[tabKey];
    this.tabIndicator.clear();
    this.tabIndicator.fillStyle(0x4CAF50);
    this.tabIndicator.fillRect(btn.x - 40, 115, 80, 4);
  }

  registerSocketEvents() {
    // 资源更新
    window.socketManager.on('resource:update', (data) => {
      if (data.allResources) {
        this.empireData.resources = data.allResources;
        this.panels.resources?.updateData(data.allResources);
      }
    });
    
    // 建筑更新
    window.socketManager.on('building:update', (data) => {
      if (data.buildings) {
        this.empireData.buildings = data.buildings;
        this.panels.buildings?.updateData(data.buildings);
      }
    });
    
    // 军队更新
    window.socketManager.on('army:update', (data) => {
      if (data.units) {
        this.empireData.army = data.units;
        this.panels.army?.updateData(data);
      }
    });
    
    // 时间更新
    window.socketManager.on('time:update', (data) => {
      this.timeDisplay?.updateTime(data);
    });
    
    // 战斗结果
    window.socketManager.on('battle:finished', (data) => {
      this.panels.battle?.showBattleResult(data);
    });
    
    // 将领更新
    window.socketManager.on('general:update', (data) => {
      this.panels.generals?.updateData(data);
    });
  }

  startAutoUpdate() {
    // 每秒更新一次资源显示
    this.time.addEvent({
      delay: 1000,
      callback: () => {
        // 可以在这里更新资源产量显示
      },
      loop: true
    });
  }
}
