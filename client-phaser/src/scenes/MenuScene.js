import Phaser from 'phaser';

/**
 * 菜单场景 - 连接服务器
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
      fontFamily: 'Microsoft YaHei',
      color: '#ffd700',
      stroke: '#000',
      strokeThickness: 4
    }).setOrigin(0.5);
    
    // 副标题
    this.add.text(640, 170, '蛮荒争霸', {
      fontSize: '28px',
      fontFamily: 'Microsoft YaHei',
      color: '#aaa'
    }).setOrigin(0.5);
    
    // 创建连接面板
    this.createConnectPanel();
    
    // 版本号
    this.add.text(1260, 700, 'v1.0.0', {
      fontSize: '12px',
      color: '#444'
    }).setOrigin(1, 0.5);
    
    // 重要：提前监听所有可能的事件
    this.setupSocketListeners();
  }
  
  setupSocketListeners() {
    console.log('Setting up socket listeners');
    
    // 监听帝国初始化
    window.socketManager.on('empire:init', (data) => {
      console.log('Received empire:init', data);
      if (data && data.playerId) {
        this.showStatus('帝国数据加载成功，进入游戏...', 'success');
        setTimeout(() => {
          this.scene.start('GameScene', { empireData: data });
        }, 500);
      }
    });
    
    // 监听连接成功
    window.socketManager.on('connect', () => {
      console.log('Socket connected');
    });
    
    // 监听错误
    window.socketManager.on('error', (err) => {
      console.error('Socket error:', err);
      this.showStatus('错误: ' + (err.message || '连接异常'), 'error');
    });
  }

  createConnectPanel() {
    const centerX = 640;
    const startY = 250;
    
    // 面板背景
    const panel = this.add.image(centerX, 400, 'panel');
    panel.setDisplaySize(500, 350);
    
    // 面板标题
    this.add.text(centerX, startY, '连接服务器', {
      fontSize: '24px',
      fontFamily: 'Microsoft YaHei',
      color: '#ffd700'
    }).setOrigin(0.5);
    
    // 服务器输入行
    const serverY = startY + 60;
    this.add.text(centerX - 120, serverY, '服务器:', {
      fontSize: '16px',
      color: '#aaa'
    }).setOrigin(1, 0.5);
    
    this.serverInput = this.createInputField(centerX + 20, serverY, 220, 35, 'http://localhost:3000');
    
    // 玩家名称输入行
    const nameY = startY + 120;
    this.add.text(centerX - 120, nameY, '玩家名称:', {
      fontSize: '16px',
      color: '#aaa'
    }).setOrigin(1, 0.5);
    
    this.nameInput = this.createInputField(centerX + 20, nameY, 220, 35, `领主${Math.floor(Math.random() * 1000)}`);
    
    // 连接按钮
    const connectBtn = this.createButton(centerX, startY + 200, '连接并创建帝国', () => {
      this.handleConnect();
    });
    
    // 状态文本
    this.statusText = this.add.text(centerX, startY + 260, '', {
      fontSize: '14px',
      color: '#888'
    }).setOrigin(0.5);
    
    // 操作说明
    this.add.text(centerX, 620, '游戏指南: 收集资源 → 训练军队 → 攻打NPC → 扩张帝国', {
      fontSize: '13px',
      color: '#555'
    }).setOrigin(0.5);
  }
  
  createInputField(x, y, width, height, defaultValue) {
    const container = this.add.container(x, y);
    
    // 背景
    const bg = this.add.rectangle(0, 0, width, height, 0x000000, 0.6);
    bg.setStrokeStyle(1, 0x666666);
    
    // 光标
    const cursor = this.add.text(0, 0, '|', {
      fontSize: '14px',
      color: '#fff'
    }).setOrigin(0, 0.5).setVisible(false);
    
    // 文本
    const text = this.add.text(-width/2 + 10, 0, defaultValue, {
      fontSize: '14px',
      color: '#fff',
      fontFamily: 'Microsoft YaHei'
    }).setOrigin(0, 0.5);
    
    container.add([bg, text, cursor]);
    
    let value = defaultValue;
    let isFocused = false;
    let cursorIndex = value.length;
    
    // 更新光标位置
    const updateCursor = () => {
      const textBeforeCursor = value.substring(0, cursorIndex);
      const textWidth = this.game.context.measureText(textBeforeCursor).width;
      cursor.x = -width/2 + 10 + Math.min(textWidth, width - 20);
      cursor.y = 0;
    };
    
    // 光标闪烁动画
    this.time.addEvent({
      delay: 500,
      loop: true,
      callback: () => {
        if (isFocused) {
          cursor.setVisible(!cursor.visible);
        }
      }
    });
    
    // 交互
    const hitArea = new Phaser.Geom.Rectangle(-width/2, -height/2, width, height);
    bg.setInteractive(hitArea, Phaser.Geom.Rectangle.Contains, { useHandCursor: true });
    
    bg.on('pointerdown', () => {
      isFocused = true;
      cursor.setVisible(true);
      bg.setStrokeStyle(2, 0x4CAF50);
      updateCursor();
    });
    
    // 点击外部取消聚焦
    this.input.on('pointerdown', (pointer, gameObjects) => {
      if (!gameObjects.includes(bg)) {
        isFocused = false;
        cursor.setVisible(false);
        bg.setStrokeStyle(1, 0x666666);
      }
    });
    
    // 键盘输入
    this.input.keyboard.on('keydown', (event) => {
      if (!isFocused) return;
      
      if (event.key.length === 1 && !event.ctrlKey && !event.metaKey) {
        // 普通字符
        value = value.substring(0, cursorIndex) + event.key + value.substring(cursorIndex);
        cursorIndex++;
        text.setText(value);
        updateCursor();
      } else if (event.key === 'Backspace') {
        // 退格
        if (cursorIndex > 0) {
          value = value.substring(0, cursorIndex - 1) + value.substring(cursorIndex);
          cursorIndex--;
          text.setText(value);
          updateCursor();
        }
      } else if (event.key === 'Delete') {
        // 删除
        if (cursorIndex < value.length) {
          value = value.substring(0, cursorIndex) + value.substring(cursorIndex + 1);
          text.setText(value);
          updateCursor();
        }
      } else if (event.key === 'ArrowLeft') {
        // 左箭头
        if (cursorIndex > 0) {
          cursorIndex--;
          updateCursor();
        }
      } else if (event.key === 'ArrowRight') {
        // 右箭头
        if (cursorIndex < value.length) {
          cursorIndex++;
          updateCursor();
        }
      } else if (event.key === 'Home') {
        cursorIndex = 0;
        updateCursor();
      } else if (event.key === 'End') {
        cursorIndex = value.length;
        updateCursor();
      }
    });
    
    return {
      getValue: () => value,
      setValue: (val) => {
        value = val;
        cursorIndex = val.length;
        text.setText(val);
        updateCursor();
      }
    };
  }

  createButton(x, y, label, callback) {
    const container = this.add.container(x, y);
    
    const bg = this.add.image(0, 0, 'btn-normal');
    const text = this.add.text(0, 0, label, {
      fontSize: '16px',
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
    const serverUrl = this.serverInput.getValue() || 'http://localhost:3000';
    const playerName = this.nameInput.getValue() || '无名玩家';
    
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
    this.statusText.setColor(colors[type] || '#888');
  }
}
