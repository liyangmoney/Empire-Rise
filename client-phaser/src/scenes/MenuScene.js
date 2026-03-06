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
    
    // 提前监听帝国初始化事件（避免错过）
    window.socketManager.on('empire:init', (data) => {
      console.log('Empire init received:', data);
      this.scene.start('GameScene', { empireData: data });
    });
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
    
    // 使用纯 Phaser 文本输入替代 DOM 元素
    // 服务器输入
    this.add.text(450, 340, '服务器:', {
      fontSize: '16px',
      color: '#aaa'
    }).setOrigin(1, 0.5);
    
    this.serverInput = this.createInputField(580, 340, 200, 30, '');
    
    // 玩家名称输入
    this.add.text(450, 390, '玩家名称:', {
      fontSize: '16px',
      color: '#aaa'
    }).setOrigin(1, 0.5);
    
    this.nameInput = this.createInputField(580, 390, 200, 30, `领主${Math.floor(Math.random() * 1000)}`);
    
    // 连接按钮
    const connectBtn = this.createButton(640, 460, '连接并创建帝国', () => {
      this.handleConnect();
    });
    
    // 状态文本
    this.statusText = this.add.text(640, 520, '', {
      fontSize: '14px',
      color: '#888'
    }).setOrigin(0.5);
    
    // 操作说明
    this.add.text(640, 600, '游戏指南: 收集资源 → 训练军队 → 攻打NPC → 扩张帝国', {
      fontSize: '14px',
      color: '#666'
    }).setOrigin(0.5);
  }
  
  createInputField(x, y, width, height, defaultValue) {
    // 背景
    const bg = this.add.rectangle(x, y, width, height, 0x000000, 0.5);
    bg.setStrokeStyle(1, 0x444444);
    bg.setOrigin(0, 0.5);
    
    // 文本
    const text = this.add.text(x + 10, y, defaultValue, {
      fontSize: '14px',
      color: '#fff',
      fontFamily: 'Microsoft YaHei'
    }).setOrigin(0, 0.5);
    
    // 提示文本
    const placeholder = this.add.text(x + 10, y, defaultValue ? '' : '输入...', {
      fontSize: '14px',
      color: '#666'
    }).setOrigin(0, 0.5);
    
    // 交互
    bg.setInteractive({ useHandCursor: true });
    
    bg.on('pointerdown', () => {
      // 使用浏览器 prompt 简单实现输入
      const newValue = prompt(defaultValue.includes('领主') ? '请输入玩家名称' : '请输入服务器地址', text.text);
      if (newValue !== null) {
        text.setText(newValue);
        placeholder.setVisible(false);
      }
    });
    
    return {
      getValue: () => text.text,
      setValue: (val) => {
        text.setText(val);
        placeholder.setVisible(!!val);
      }
    };
  }

  createButton(x, y, label, callback) {
    const container = this.add.container(x, y);
    
    const bg = this.add.image(0, 0, 'btn-normal');
    const text = this.add.text(0, 0, label, {
      fontSize: '18px',
      fontFamily: 'Microsoft YaHei',
      color: '#fff'
    }).setOrigin(0.5);
    
    container.add([bg, text]);
    
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
    const serverUrl = this.serverInput.getValue() || '';
    const playerName = this.nameInput.getValue() || '无名玩家';
    
    if (!playerName.trim() || playerName === '输入...') {
      this.showStatus('请输入玩家名称', 'error');
      return;
    }
    
    this.showStatus('正在连接...', 'info');
    
    try {
      await window.socketManager.connect(serverUrl, playerName);
      this.showStatus('连接成功！等待帝国数据...', 'success');
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
