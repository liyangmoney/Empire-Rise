import Phaser from 'phaser';

/**
 * 菜单场景 - 连接服务器
 */
export class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MenuScene' });
    this.activeInput = null;
    this.inputBuffer = [];
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
    
    // 监听事件
    this.setupSocketListeners();
    
    // 键盘输入监听
    this.setupKeyboardInput();
  }
  
  setupKeyboardInput() {
    // 监听所有按键
    this.input.keyboard.on('keydown', (event) => {
      if (!this.activeInput) return;
      
      event.preventDefault();
      
      if (event.key === 'Backspace') {
        this.activeInput.backspace();
      } else if (event.key === 'Delete') {
        this.activeInput.delete();
      } else if (event.key === 'ArrowLeft') {
        this.activeInput.moveCursor(-1);
      } else if (event.key === 'ArrowRight') {
        this.activeInput.moveCursor(1);
      } else if (event.key === 'Home') {
        this.activeInput.moveCursor(-9999);
      } else if (event.key === 'End') {
        this.activeInput.moveCursor(9999);
      } else if (event.key.length === 1 && !event.ctrlKey && !event.metaKey) {
        // 普通字符
        this.activeInput.insertChar(event.key);
      }
    });
  }
  
  setupSocketListeners() {
    console.log('Setting up socket listeners');
    
    window.socketManager.on('empire:init', (data) => {
      console.log('Received empire:init', data);
      if (data && data.playerId) {
        this.showStatus('帝国数据加载成功！', 'success');
        console.log('Starting GameScene...');
        
        this.time.delayedCall(300, () => {
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
    
    // 服务器输入
    const serverY = startY + 60;
    this.add.text(centerX - 120, serverY, '服务器:', {
      fontSize: '16px',
      color: '#aaa'
    }).setOrigin(1, 0.5);
    
    this.serverInput = this.createInputField(centerX + 20, serverY, 220, 35, 'http://localhost:3000');
    
    // 玩家名称输入
    const nameY = startY + 120;
    this.add.text(centerX - 120, nameY, '玩家名称:', {
      fontSize: '16px',
      color: '#aaa'
    }).setOrigin(1, 0.5);
    
    this.nameInput = this.createInputField(centerX + 20, nameY, 220, 35, `领主${Math.floor(Math.random() * 1000)}`);
    
    // 连接按钮
    this.createButton(centerX, startY + 200, '连接并创建帝国', () => {
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
    const bg = this.add.rectangle(x, y, width, height, 0x000000, 0.6);
    bg.setStrokeStyle(1, 0x666666);
    bg.setOrigin(0, 0.5);
    
    const text = this.add.text(x + 10, y, defaultValue, {
      fontSize: '14px',
      color: '#fff',
      fontFamily: 'Microsoft YaHei'
    }).setOrigin(0, 0.5);
    
    const cursor = this.add.text(x + 10, y, '|', {
      fontSize: '14px',
      color: '#4CAF50'
    }).setOrigin(0, 0.5).setVisible(false);
    
    let value = defaultValue;
    let cursorIndex = value.length;
    let blinkEvent = null;
    
    const self = this;
    
    const inputObj = {
      getValue: () => value,
      
      focus: () => {
        // 先取消其他输入框的聚焦
        if (self.activeInput && self.activeInput !== inputObj) {
          self.activeInput.blur();
        }
        
        self.activeInput = inputObj;
        bg.setStrokeStyle(2, 0x4CAF50);
        cursor.setVisible(true);
        
        // 光标闪烁
        if (blinkEvent) blinkEvent.remove();
        blinkEvent = self.time.addEvent({
          delay: 500,
          loop: true,
          callback: () => {
            cursor.setVisible(!cursor.visible);
          }
        });
        
        updateCursor();
      },
      
      blur: () => {
        bg.setStrokeStyle(1, 0x666666);
        cursor.setVisible(false);
        if (blinkEvent) {
          blinkEvent.remove();
          blinkEvent = null;
        }
        if (self.activeInput === inputObj) {
          self.activeInput = null;
        }
      },
      
      insertChar: (char) => {
        value = value.substring(0, cursorIndex) + char + value.substring(cursorIndex);
        cursorIndex++;
        text.setText(value);
        updateCursor();
      },
      
      backspace: () => {
        if (cursorIndex > 0) {
          value = value.substring(0, cursorIndex - 1) + value.substring(cursorIndex);
          cursorIndex--;
          text.setText(value);
          updateCursor();
        }
      },
      
      delete: () => {
        if (cursorIndex < value.length) {
          value = value.substring(0, cursorIndex) + value.substring(cursorIndex + 1);
          text.setText(value);
          updateCursor();
        }
      },
      
      moveCursor: (delta) => {
        cursorIndex = Math.max(0, Math.min(value.length, cursorIndex + delta));
        updateCursor();
      }
    };
    
    const updateCursor = () => {
      // 计算光标位置
      const tempText = value.substring(0, cursorIndex);
      // 使用简单估算，每个字符约8-10px
      const charWidth = 9;
      const textWidth = tempText.length * charWidth;
      cursor.x = x + 10 + textWidth;
    };
    
    // 点击聚焦
    bg.setInteractive({ useHandCursor: true });
    bg.on('pointerdown', (pointer, localX, localY, event) => {
      if (event) event.stopPropagation();
      inputObj.focus();
    });
    
    // 点击外部取消聚焦
    this.input.on('pointerdown', (pointer, gameObjects) => {
      if (!gameObjects.includes(bg)) {
        inputObj.blur();
      }
    });
    
    // 初始化
    updateCursor();
    
    return inputObj;
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
