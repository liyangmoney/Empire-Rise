import Phaser from 'phaser';

/**
 * 菜单场景 - 连接服务器
 * 纯 Phaser 画布实现，确保文字清晰和布局正确
 */
export class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MenuScene' });
    this.activeInput = null;
    this.cursorBlinkTimer = null;
  }

  create() {
    console.log('MenuScene created');
    
    // 背景
    this.add.image(640, 360, 'bg-gradient');
    
    // 标题
    this.add.text(640, 80, '🏰 帝国崛起', {
      fontSize: '64px',
      fontFamily: 'Arial, Microsoft YaHei, sans-serif',
      color: '#ffd700',
      stroke: '#000000',
      strokeThickness: 6
    }).setOrigin(0.5);
    
    // 副标题
    this.add.text(640, 150, '蛮荒争霸', {
      fontSize: '32px',
      fontFamily: 'Arial, Microsoft YaHei, sans-serif',
      color: '#aaaaaa'
    }).setOrigin(0.5);
    
    // 创建连接面板
    this.createConnectPanel();
    
    // 版本号
    this.add.text(1260, 700, 'v1.0.0', {
      fontSize: '14px',
      color: '#555555'
    }).setOrigin(1, 0.5);
    
    // 监听 Socket 事件
    this.setupSocketListeners();
    
    // 设置键盘输入
    this.setupKeyboard();
  }
  
  setupSocketListeners() {
    console.log('Setting up socket listeners');
    
    // 确保只监听一次
    window.socketManager.off('empire:init');
    window.socketManager.on('empire:init', (data) => {
      console.log('✅ Received empire:init', data);
      if (data && data.playerId) {
        this.showStatus('帝国数据加载成功！进入游戏...', 'success');
        
        // 停止光标闪烁
        if (this.cursorBlinkTimer) {
          this.cursorBlinkTimer.remove();
        }
        
        // 延迟切换场景
        this.time.delayedCall(800, () => {
          console.log('🎮 Starting GameScene...');
          this.scene.start('GameScene', { empireData: data });
        });
      } else {
        this.showStatus('数据格式错误', 'error');
      }
    });
    
    window.socketManager.on('connect', () => {
      console.log('✅ Socket connected');
    });
    
    window.socketManager.on('connect_error', (err) => {
      console.error('❌ Connection error:', err);
      this.showStatus('连接失败: ' + err.message, 'error');
    });
  }

  createConnectPanel() {
    const centerX = 640;
    const panelTop = 200;
    
    // 面板背景 - 使用图形绘制确保清晰
    const panelBg = this.add.graphics();
    panelBg.fillStyle(0x000000, 0.8);
    panelBg.fillRoundedRect(centerX - 250, panelTop, 500, 350, 12);
    panelBg.lineStyle(2, 0xffd700, 0.6);
    panelBg.strokeRoundedRect(centerX - 250, panelTop, 500, 350, 12);
    
    // 面板标题
    this.add.text(centerX, panelTop + 40, '连接服务器', {
      fontSize: '28px',
      fontFamily: 'Arial, Microsoft YaHei, sans-serif',
      color: '#ffd700'
    }).setOrigin(0.5);
    
    // 服务器输入
    const serverY = panelTop + 110;
    this.add.text(centerX - 100, serverY, '服务器:', {
      fontSize: '18px',
      fontFamily: 'Arial, Microsoft YaHei, sans-serif',
      color: '#cccccc'
    }).setOrigin(1, 0.5);
    
    this.serverInput = this.createInputField(centerX + 60, serverY, 280, 40, 'http://localhost:3000');
    
    // 玩家名称输入
    const nameY = panelTop + 180;
    this.add.text(centerX - 100, nameY, '玩家名称:', {
      fontSize: '18px',
      fontFamily: 'Arial, Microsoft YaHei, sans-serif',
      color: '#cccccc'
    }).setOrigin(1, 0.5);
    
    this.nameInput = this.createInputField(centerX + 60, nameY, 280, 40, `领主${Math.floor(Math.random() * 1000)}`);
    
    // 连接按钮
    this.createButton(centerX, panelTop + 260, '连接并创建帝国', () => {
      this.handleConnect();
    });
    
    // 状态文本
    this.statusText = this.add.text(centerX, panelTop + 315, '', {
      fontSize: '16px',
      fontFamily: 'Arial, Microsoft YaHei, sans-serif'
    }).setOrigin(0.5);
    
    // 操作说明
    this.add.text(centerX, 600, '游戏指南: 收集资源 → 训练军队 → 攻打NPC → 扩张帝国', {
      fontSize: '14px',
      color: '#666666'
    }).setOrigin(0.5);
  }
  
  createInputField(x, y, width, height, defaultValue) {
    // 容器
    const container = this.add.container(x, y);
    
    // 背景
    const bg = this.add.rectangle(0, 0, width, height, 0x1a1a2e, 1);
    bg.setStrokeStyle(2, 0x666666);
    container.add(bg);
    
    // 文本 - 使用较大的字号确保清晰
    const textObj = this.add.text(-width/2 + 15, 0, defaultValue, {
      fontSize: '18px',
      fontFamily: 'Arial, Microsoft YaHei, sans-serif',
      color: '#ffffff'
    }).setOrigin(0, 0.5);
    container.add(textObj);
    
    // 光标
    const cursor = this.add.text(-width/2 + 15, 0, '|', {
      fontSize: '20px',
      color: '#4CAF50'
    }).setOrigin(0, 0.5).setVisible(false);
    container.add(cursor);
    
    // 状态
    let value = defaultValue;
    let cursorIndex = value.length;
    let isFocused = false;
    
    // 输入对象方法
    const inputObj = {
      getValue: () => value,
      focus: () => {
        // 取消其他输入框聚焦
        if (this.activeInput && this.activeInput !== inputObj) {
          this.activeInput.blur();
        }
        
        isFocused = true;
        this.activeInput = inputObj;
        bg.setStrokeStyle(2, 0x4CAF50);
        cursor.setVisible(true);
        
        // 光标闪烁
        if (this.cursorBlinkTimer) {
          this.cursorBlinkTimer.remove();
        }
        this.cursorBlinkTimer = this.time.addEvent({
          delay: 530,
          loop: true,
          callback: () => {
            cursor.setVisible(!cursor.visible);
          }
        });
        
        updateCursor();
      },
      blur: () => {
        isFocused = false;
        if (this.activeInput === inputObj) {
          this.activeInput = null;
        }
        bg.setStrokeStyle(2, 0x666666);
        cursor.setVisible(false);
        if (this.cursorBlinkTimer) {
          this.cursorBlinkTimer.remove();
          this.cursorBlinkTimer = null;
        }
      },
      insertChar: (char) => {
        value = value.substring(0, cursorIndex) + char + value.substring(cursorIndex);
        cursorIndex++;
        textObj.setText(value);
        updateCursor();
      },
      backspace: () => {
        if (cursorIndex > 0) {
          value = value.substring(0, cursorIndex - 1) + value.substring(cursorIndex);
          cursorIndex--;
          textObj.setText(value);
          updateCursor();
        }
      },
      delete: () => {
        if (cursorIndex < value.length) {
          value = value.substring(0, cursorIndex) + value.substring(cursorIndex + 1);
          textObj.setText(value);
          updateCursor();
        }
      },
      moveCursor: (delta) => {
        cursorIndex = Math.max(0, Math.min(value.length, cursorIndex + delta));
        updateCursor();
      }
    };
    
    // 更新光标位置
    const updateCursor = () => {
      const textBefore = value.substring(0, cursorIndex);
      // 估算字符宽度
      const charWidth = 10; // 18px 字体大约每个字符 10px
      const textWidth = textBefore.length * charWidth;
      cursor.x = -width/2 + 15 + textWidth;
    };
    
    // 点击聚焦
    bg.setInteractive({ useHandCursor: true });
    bg.on('pointerdown', (pointer, localX, localY, event) => {
      if (event) event.stopPropagation();
      inputObj.focus();
      
      // 根据点击位置计算光标位置
      const clickX = localX + width/2 - 15;
      let newIndex = Math.round(clickX / 10);
      newIndex = Math.max(0, Math.min(value.length, newIndex));
      cursorIndex = newIndex;
      updateCursor();
    });
    
    // 初始化光标位置
    updateCursor();
    
    return inputObj;
  }

  createButton(x, y, label, callback) {
    const container = this.add.container(x, y);
    
    // 按钮背景
    const bg = this.add.graphics();
    bg.fillStyle(0x4a5568);
    bg.fillRoundedRect(-90, -22, 180, 44, 8);
    container.add(bg);
    
    // 按钮文字
    const text = this.add.text(0, 0, label, {
      fontSize: '18px',
      fontFamily: 'Arial, Microsoft YaHei, sans-serif',
      color: '#ffffff'
    }).setOrigin(0.5);
    container.add(text);
    
    // 交互区域
    const hitArea = this.add.rectangle(0, 0, 180, 44, 0x000000, 0);
    hitArea.setInteractive({ useHandCursor: true });
    container.add(hitArea);
    
    hitArea.on('pointerover', () => {
      bg.clear();
      bg.fillStyle(0x5a6578);
      bg.fillRoundedRect(-90, -22, 180, 44, 8);
    });
    
    hitArea.on('pointerout', () => {
      bg.clear();
      bg.fillStyle(0x4a5568);
      bg.fillRoundedRect(-90, -22, 180, 44, 8);
    });
    
    hitArea.on('pointerdown', () => {
      container.setScale(0.95);
    });
    
    hitArea.on('pointerup', () => {
      container.setScale(1);
      callback();
    });
    
    return container;
  }

  setupKeyboard() {
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
      } else if (event.key === 'Tab') {
        // Tab 切换输入框
        if (this.activeInput === this.serverInput) {
          this.nameInput.focus();
        } else {
          this.serverInput.focus();
        }
      } else if (event.key.length === 1 && !event.ctrlKey && !event.metaKey) {
        // 普通字符
        this.activeInput.insertChar(event.key);
      }
    });
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
      console.log('Connecting to:', serverUrl);
      await window.socketManager.connect(serverUrl, playerName);
      this.showStatus('连接成功！等待服务器数据...', 'success');
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
}
