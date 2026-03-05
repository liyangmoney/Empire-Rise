import Phaser from 'phaser';

/**
 * 菜单场景 - 连接服务器
 */
export class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MenuScene' });
  }

  create() {
    // 背景
    this.add.image(640, 360, 'bg-gradient');
    
    // 标题
    this.add.text(640, 120, '🏰 帝国崛起', {
      fontSize: '64px',
      fontFamily: 'Microsoft YaHei',
      color: '#ffd700',
      stroke: '#000',
      strokeThickness: 6
    }).setOrigin(0.5);
    
    // 副标题
    this.add.text(640, 200, '蛮荒争霸', {
      fontSize: '32px',
      fontFamily: 'Microsoft YaHei',
      color: '#aaa'
    }).setOrigin(0.5);
    
    // 创建连接面板
    this.createConnectPanel();
    
    // 版本号
    this.add.text(1240, 700, 'v1.0.0 Phaser 3', {
      fontSize: '14px',
      color: '#666'
    }).setOrigin(1, 0.5);
  }

  createConnectPanel() {
    // 面板背景
    const panel = this.add.image(640, 400, 'panel');
    
    // 面板标题
    this.add.text(640, 280, '连接服务器', {
      fontSize: '24px',
      fontFamily: 'Microsoft YaHei',
      color: '#fff'
    }).setOrigin(0.5);
    
    // 服务器地址输入
    this.add.text(500, 340, '服务器:', {
      fontSize: '16px',
      color: '#aaa'
    }).setOrigin(1, 0.5);
    
    // 服务器输入框（使用 DOM 元素）
    const serverInput = this.add.dom(700, 340).createFromHTML(`
      <input type="text" id="serverUrl" placeholder="默认: 当前服务器" 
        style="width: 240px; padding: 10px; border-radius: 6px; border: 1px solid #444; 
               background: rgba(0,0,0,0.5); color: #fff; font-size: 14px;"
        value="">
    `);
    
    // 玩家名称输入
    this.add.text(500, 400, '玩家名称:', {
      fontSize: '16px',
      color: '#aaa'
    }).setOrigin(1, 0.5);
    
    const nameInput = this.add.dom(700, 400).createFromHTML(`
      <input type="text" id="playerName" placeholder="输入你的名字" 
        style="width: 240px; padding: 10px; border-radius: 6px; border: 1px solid #444; 
               background: rgba(0,0,0,0.5); color: #fff; font-size: 14px;"
        value="领主${Math.floor(Math.random() * 1000)}">
    `);
    
    // 连接按钮
    const connectBtn = this.createButton(640, 480, '连接并创建帝国', () => {
      this.handleConnect();
    });
    
    // 状态文本
    this.statusText = this.add.text(640, 540, '', {
      fontSize: '14px',
      color: '#888'
    }).setOrigin(0.5);
    
    // 操作说明
    this.add.text(640, 600, '游戏指南: 收集资源 → 训练军队 → 攻打NPC → 扩张帝国', {
      fontSize: '14px',
      color: '#666'
    }).setOrigin(0.5);
  }

  createButton(x, y, text, callback) {
    const container = this.add.container(x, y);
    
    const bg = this.add.image(0, 0, 'btn-normal');
    const label = this.add.text(0, 0, text, {
      fontSize: '18px',
      fontFamily: 'Microsoft YaHei',
      color: '#fff'
    }).setOrigin(0.5);
    
    container.add([bg, label]);
    
    // 交互
    bg.setInteractive({ useHandCursor: true });
    
    bg.on('pointerover', () => {
      bg.setTexture('btn-hover');
    });
    
    bg.on('pointerout', () => {
      bg.setTexture('btn-normal');
    });
    
    bg.on('pointerdown', () => {
      bg.setScale(0.95);
    });
    
    bg.on('pointerup', () => {
      bg.setScale(1);
      callback();
    });
    
    return container;
  }

  async handleConnect() {
    const serverUrl = document.getElementById('serverUrl')?.value || '';
    const playerName = document.getElementById('playerName')?.value || '无名玩家';
    
    if (!playerName.trim()) {
      this.showStatus('请输入玩家名称', 'error');
      return;
    }
    
    this.showStatus('正在连接...', 'info');
    
    try {
      await window.socketManager.connect(serverUrl, playerName);
      this.showStatus('连接成功！', 'success');
      
      // 等待帝国数据初始化
      window.socketManager.on('empire:init', (data) => {
        this.scene.start('GameScene', { empireData: data });
      });
      
    } catch (err) {
      this.showStatus('连接失败: ' + (err.message || '未知错误'), 'error');
    }
  }

  showStatus(message, type) {
    const colors = {
      info: '#409EFF',
      success: '#4CAF50',
      error: '#f44336'
    };
    
    this.statusText.setText(message);
    this.statusText.setColor(colors[type] || '#888');
  }
}
