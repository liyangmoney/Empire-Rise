import Phaser from 'phaser';

/**
 * 菜单场景 - 连接服务器
 * 使用 HTML 输入框确保文字清晰
 */
export class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MenuScene' });
  }

  create() {
    console.log('MenuScene created');
    
    // 背景
    this.add.image(640, 360, 'bg-gradient');
    
    // 标题
    this.add.text(640, 100, '🏰 帝国崛起', {
      fontSize: '56px',
      fontFamily: 'Microsoft YaHei, sans-serif',
      color: '#ffd700',
      stroke: '#000',
      strokeThickness: 4
    }).setOrigin(0.5);
    
    // 副标题
    this.add.text(640, 170, '蛮荒争霸', {
      fontSize: '28px',
      fontFamily: 'Microsoft YaHei, sans-serif',
      color: '#aaaaaa'
    }).setOrigin(0.5);
    
    // 创建连接面板
    this.createConnectPanel();
    
    // 版本号
    this.add.text(1240, 700, 'v1.0.0', {
      fontSize: '12px',
      color: '#444444'
    }).setOrigin(1, 0.5);
    
    // 监听事件
    this.setupSocketListeners();
  }
  
  setupSocketListeners() {
    console.log('Setting up socket listeners');
    
    window.socketManager.on('empire:init', (data) => {
      console.log('Received empire:init', data);
      if (data && data.playerId) {
        this.showStatus('帝国数据加载成功！', 'success');
        
        // 移除 HTML 元素
        this.removeHtmlElements();
        
        this.time.delayedCall(500, () => {
          this.scene.start('GameScene', { empireData: data });
        });
      }
    });
    
    window.socketManager.on('connect', () => {
      console.log('Socket connected');
    });
    
    window.socketManager.on('error', (err) => {
      console.error('Socket error:', err);
      this.showStatus('错误: ' + (err.message || '连接异常'), 'error');
    });
  }

  createConnectPanel() {
    const centerX = 640;
    const panelY = 380;
    
    // 面板背景
    const panel = this.add.rectangle(centerX, panelY, 520, 320, 0x000000, 0.7);
    panel.setStrokeStyle(2, 0xffd700, 0.5);
    
    // 面板标题
    this.add.text(centerX, panelY - 120, '连接服务器', {
      fontSize: '24px',
      fontFamily: 'Microsoft YaHei, sans-serif',
      color: '#ffd700'
    }).setOrigin(0.5);
    
    // 使用 Phaser DOM 元素创建输入框
    this.createDomInput(centerX - 60, panelY - 40, 'serverUrl', 'http://localhost:3000', '服务器地址');
    this.createDomInput(centerX - 60, panelY + 30, 'playerName', `领主${Math.floor(Math.random() * 1000)}`, '玩家名称');
    
    // 标签
    this.add.text(centerX - 170, panelY - 40, '服务器:', {
      fontSize: '16px',
      color: '#aaaaaa'
    }).setOrigin(1, 0.5);
    
    this.add.text(centerX - 170, panelY + 30, '玩家名称:', {
      fontSize: '16px',
      color: '#aaaaaa'
    }).setOrigin(1, 0.5);
    
    // 连接按钮
    this.createButton(centerX, panelY + 100, '连接并创建帝国', () => {
      this.handleConnect();
    });
    
    // 状态文本
    this.statusText = this.add.text(centerX, panelY + 150, '', {
      fontSize: '14px',
      fontFamily: 'Microsoft YaHei, sans-serif'
    }).setOrigin(0.5);
    
    // 操作说明
    this.add.text(centerX, 620, '游戏指南: 收集资源 → 训练军队 → 攻打NPC → 扩张帝国', {
      fontSize: '13px',
      color: '#555555'
    }).setOrigin(0.5);
  }
  
  createDomInput(x, y, id, defaultValue, placeholder) {
    const input = this.add.dom(x, y).createFromHTML(`
      <input type="text" id="${id}" 
        style="
          width: 220px;
          height: 36px;
          padding: 0 12px;
          border: 1px solid #666666;
          border-radius: 4px;
          background: rgba(0,0,0,0.6);
          color: #ffffff;
          font-size: 14px;
          font-family: Microsoft YaHei, sans-serif;
          outline: none;
          box-sizing: border-box;
        "
        value="${defaultValue}"
        placeholder="${placeholder}"
      >
    `);
    
    // 添加聚焦效果
    const element = input.getChildByID(id);
    if (element) {
      element.addEventListener('focus', () => {
        element.style.borderColor = '#4CAF50';
      });
      element.addEventListener('blur', () => {
        element.style.borderColor = '#666666';
      });
    }
    
    return input;
  }

  createButton(x, y, label, callback) {
    const container = this.add.container(x, y);
    
    const bg = this.add.image(0, 0, 'btn-normal').setDisplaySize(180, 45);
    const text = this.add.text(0, 0, label, {
      fontSize: '16px',
      fontFamily: 'Microsoft YaHei, sans-serif',
      color: '#ffffff'
    }).setOrigin(0.5);
    
    container.add([bg, text]);
    
    bg.setInteractive({ useHandCursor: true });
    bg.on('pointerover', () => bg.setTexture('btn-hover'));
    bg.on('pointerout', () => bg.setTexture('btn-normal'));
    bg.on('pointerdown', () => bg.setScale(0.95));
    bg.on('pointerup', () => {
      bg.setScale(1);
      callback();
    });
    
    return container;
  }

  async handleConnect() {
    const serverEl = document.getElementById('serverUrl');
    const nameEl = document.getElementById('playerName');
    
    const serverUrl = serverEl ? serverEl.value : 'http://localhost:3000';
    const playerName = nameEl ? nameEl.value : '无名玩家';
    
    if (!playerName.trim()) {
      this.showStatus('请输入玩家名称', 'error');
      return;
    }
    
    this.showStatus('正在连接...', 'info');
    
    try {
      await window.socketManager.connect(serverUrl, playerName);
      this.showStatus('连接成功！等待帝国数据...', 'success');
    } catch (err) {
      console.error('Connection error:', err);
      this.showStatus('连接失败: ' + (err.message || '请检查服务器地址'), 'error');
    }
  }

  showStatus(message, type) {
    const colors = {
      info: '#409EFF',
      success: '#4CAF50',
      error: '#f44336'
    };
    this.statusText.setText(message);
    this.statusText.setColor(colors[type] || '#888888');
  }
  
  removeHtmlElements() {
    // 移除 DOM 输入框
    const ids = ['serverUrl', 'playerName'];
    ids.forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        el.parentElement?.remove();
      }
    });
  }
}
