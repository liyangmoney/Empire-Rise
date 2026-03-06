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
    this.allResources = null;
    this.population = null;
    this.stamina = null;
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
    this.switchTab('buildings');
    
    // 注册 Socket 事件
    this.registerSocketEvents();
    
    // 启动定时更新
    this.startAutoUpdate();
    
    // 立即更新数据
    this.updateAllData();
  }

  createTopBar() {
    // 顶部资源栏背景
    const topBar = this.add.graphics();
    topBar.fillStyle(0x000000, 0.8);
    topBar.fillRect(0, 0, 1280, 60);
    
    // 时间显示
    this.timeDisplay = new TimeDisplay(this, 150, 30);
    
    // 资源显示（包含体力和人口）
    this.resourcePanel = new ResourcePanel(this, 600, 30);
    
    // 玩家信息
    this.add.text(1050, 20, this.empireData.playerName || '未知玩家', {
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
      { key: 'buildings', label: '🏗️ 建筑', x: 200 },
      { key: 'army', label: '⚔️ 军队', x: 350 },
      { key: 'generals', label: '🎖️ 将领', x: 500 },
      { key: 'battle', label: '🎯 战斗', x: 650 },
      { key: 'tasks', label: '📋 任务', x: 800 }
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
  
  updateAllData() {
    // 更新资源显示
    if (this.empireData.resources) {
      this.allResources = this.empireData.resources;
      this.resourcePanel.updateData(this.allResources);
    }
    
    // 更新体力
    if (this.empireData.stamina) {
      this.stamina = this.empireData.stamina;
      this.resourcePanel.updateStamina(this.stamina);
    }
    
    // 更新人口
    if (this.empireData.population) {
      this.population = this.empireData.population;
      this.resourcePanel.updatePopulation(this.population);
    }
    
    // 更新建筑
    if (this.empireData.buildings) {
      this.panels.buildings.updateData(
        this.empireData.buildings,
        this.empireData.upgradeQueue || []
      );
    }
    
    // 更新军队
    if (this.empireData.army) {
      this.panels.army.updateData({
        units: this.empireData.army,
        currentSize: this.empireData.currentArmySize,
        maxSize: this.empireData.maxArmySize,
        trainingQueue: this.empireData.trainingQueue
      });
    }
    
    // 更新将领
    if (this.empireData.generals) {
      this.panels.generals.updateData(this.empireData.generals);
    }
    
    // 更新时间
    if (this.empireData.time) {
      this.timeDisplay.updateTime(this.empireData.time);
    }
  }

  registerSocketEvents() {
    // 资源更新
    window.socketManager.on('resource:update', (data) => {
      if (data.allResources) {
        this.allResources = data.allResources;
        this.resourcePanel.updateData(this.allResources);
      }
    });
    
    // 建筑更新
    window.socketManager.on('building:update', (data) => {
      if (data.buildings) {
        this.panels.buildings.updateData(data.buildings, data.upgradeQueue || []);
      }
    });
    
    // 建筑升级开始
    window.socketManager.on('building:upgradeStarted', (data) => {
      if (data.buildings) {
        this.panels.buildings.updateData(data.buildings, data.upgradeQueue || []);
      }
      if (data.population) {
        this.population = data.population;
        this.resourcePanel.updatePopulation(this.population);
      }
      if (data.resources) {
        this.allResources = data.resources;
        this.resourcePanel.updateData(this.allResources);
      }
    });
    
    // 建筑升级完成
    window.socketManager.on('building:upgradeCompleted', (data) => {
      if (data.buildings) {
        this.panels.buildings.updateData(data.buildings, data.upgradeQueue || []);
      }
      if (data.population) {
        this.population = data.population;
        this.resourcePanel.updatePopulation(this.population);
      }
      if (data.resources) {
        this.allResources = data.resources;
        this.resourcePanel.updateData(this.allResources);
      }
      this.showToast(`建筑升级完成！`);
    });
    
    // 军队更新
    window.socketManager.on('army:update', (data) => {
      this.panels.army.updateData(data);
    });
    
    // 训练更新
    window.socketManager.on('training:update', (data) => {
      this.panels.army.updateData({
        ...data,
        trainingQueue: data.queue
      });
    });
    
    // 时间更新
    window.socketManager.on('time:update', (data) => {
      this.timeDisplay.updateTime(data);
    });
    
    // 战斗结果
    window.socketManager.on('battle:finished', (data) => {
      this.panels.battle.showBattleResult(data);
    });
    
    // 将领更新
    window.socketManager.on('general:update', (data) => {
      this.panels.generals.updateData(data);
    });
    
    // 人口更新
    window.socketManager.on('population:update', (data) => {
      this.population = data;
      this.resourcePanel.updatePopulation(this.population);
    });
    
    // 体力更新
    window.socketManager.on('stamina:update', (data) => {
      this.stamina = data;
      this.resourcePanel.updateStamina(this.stamina);
    });
    
    // 成功提示
    window.socketManager.on('success', (data) => {
      this.showToast(data.message);
    });
    
    // 错误提示
    window.socketManager.on('error', (data) => {
      this.showToast(data.message || '操作失败', '#f44336');
    });
  }
  
  showToast(message, color = '#4CAF50') {
    // 创建提示
    const toast = this.add.container(640, 600);
    
    const bg = this.add.graphics();
    bg.fillStyle(color === '#4CAF50' ? 0x4CAF50 : 0xf44336, 0.9);
    bg.fillRoundedRect(-150, -20, 300, 40, 20);
    toast.add(bg);
    
    const text = this.add.text(0, 0, message, {
      fontSize: '16px',
      color: '#fff',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    toast.add(text);
    
    // 动画
    this.tweens.add({
      targets: toast,
      y: 580,
      alpha: 0,
      duration: 2000,
      ease: 'Power2',
      onComplete: () => {
        toast.destroy();
      }
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
