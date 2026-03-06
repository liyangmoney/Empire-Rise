import Phaser from 'phaser';

/**
 * 菜单场景 - 连接服务器
 */
export class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MenuScene' });
    this.activeInput = null;
  }

  create() {
    console.log('MenuScene created');
    
    // 背景
    this.add.image(640, 360, 'bg-gradient');
    
    // 标题
    this.add.text(640, 60, '🏰 帝国崛起', {
      fontSize: '64px',
      fontFamily: 'Arial',
      color: '#ffd700',
      stroke: '#000',
      strokeThickness: 6
    }).setOrigin(0.5);
    
    // 副标题
    this.add.text(640, 130, '蛮荒争霸', {
      fontSize: '28px',
      fontFamily: 'Arial',
      color: '#ffffff'
    }).setOrigin(0.5);
    
    // 创建连接面板
    this.createPanel();
    
    // 版本
    this.add.text(1260, 700, 'v1.0.0', { 
      fontSize: '14px', 
      color: '#ffffff' 
    }).setOrigin(1, 0.5);
    
    // 设置监听
    this.setupListeners();
    this.setupKeyboard();
  }
  
  setupListeners() {
    // 移除旧监听器
    window.socketManager.off('empire:init');
    window.socketManager.off('connect_error');
    window.socketManager.off('error');
    
    window.socketManager.on('empire:init', (data) => {
      console.log('empire:init received:', data);
      if (data && data.playerId) {
        this.showStatus('连接成功！进入游戏...', 'success');
        this.time.delayedCall(600, () => {
          this.scene.start('GameScene', { empireData: data });
        });
      } else {
        this.showStatus('数据错误，请重试', 'error');
      }
    });
    
    window.socketManager.on('connect_error', (err) => {
      console.error('Connect error:', err);
      this.showStatus('连接失败: ' + (err.message || '无法连接服务器'), 'error');
    });
    
    window.socketManager.on('error', (err) => {
      console.error('Socket error:', err);
      this.showStatus('错误: ' + (err.message || '未知错误'), 'error');
    });
  }

  createPanel() {
    const cx = 640;
    const py = 360;
    
    // 面板背景
    const bg = this.add.graphics();
    bg.fillStyle(0x000000, 0.9);
    bg.fillRoundedRect(cx - 300, py - 180, 600, 360, 12);
    bg.lineStyle(3, 0xffd700, 0.8);
    bg.strokeRoundedRect(cx - 300, py - 180, 600, 360, 12);
    
    // 面板标题
    this.add.text(cx, py - 140, '连接服务器', {
      fontSize: '32px', 
      fontFamily: 'Arial', 
      color: '#ffd700'
    }).setOrigin(0.5);
    
    // 服务器
    this.add.text(cx - 140, py - 60, '服务器:', {
      fontSize: '18px', 
      fontFamily: 'Arial', 
      color: '#ffffff'
    }).setOrigin(1, 0.5);
    
    this.serverInput = this.createInput(cx - 120, py - 60, 320, 40, 'http://localhost:3000');
    
    // 玩家名称
    this.add.text(cx - 140, py + 10, '玩家名称:', {
      fontSize: '18px', 
      fontFamily: 'Arial', 
      color: '#ffffff'
    }).setOrigin(1, 0.5);
    
    this.nameInput = this.createInput(cx - 120, py + 10, 320, 40, `领主${Math.floor(Math.random() * 1000)}`);
    
    // 按钮
    this.createButton(cx, py + 100, '连接并创建帝国', () => this.connect());
    
    // 状态
    this.statusText = this.add.text(cx, py + 160, '', {
      fontSize: '16px', 
      fontFamily: 'Arial'
    }).setOrigin(0.5);
    
    // 说明 - 白色
    this.add.text(cx, 620, '游戏指南: 收集资源 → 训练军队 → 攻打NPC → 扩张帝国', {
      fontSize: '14px', 
      color: '#ffffff'
    }).setOrigin(0.5);
  }
  
  createInput(x, y, w, h, defaultVal) {
    // 背景框
    const bg = this.add.rectangle(x, y, w, h, 0x2a2a3e);
    bg.setStrokeStyle(2, 0x666666);
    bg.setOrigin(0, 0.5);
    
    // 文字 - 白色
    const txt = this.add.text(x + 12, y, defaultVal, {
      fontSize: '16px', 
      fontFamily: 'Arial', 
      color: '#ffffff'
    }).setOrigin(0, 0.5);
    
    // 光标
    const cursor = this.add.text(x + 12, y, '|', {
      fontSize: '18px', 
      color: '#4CAF50'
    }).setOrigin(0, 0.5).setVisible(false);
    
    let val = defaultVal;
    let idx = val.length;
    let blink = null;
    
    // 创建一个隐藏的文本对象用于测量宽度
    const measureText = this.add.text(0, 0, '', {
      fontSize: '16px',
      fontFamily: 'Arial'
    }).setVisible(false);
    
    const updateCursor = () => {
      // 使用隐藏的文本对象测量实际宽度
      measureText.setText(val.substring(0, idx));
      const textWidth = measureText.width;
      cursor.x = x + 12 + textWidth;
    };
    
    const obj = {
      getValue: () => val,
      focus: () => {
        if (this.activeInput && this.activeInput !== obj) {
          this.activeInput.blur();
        }
        this.activeInput = obj;
        bg.setStrokeStyle(2, 0x4CAF50);
        cursor.setVisible(true);
        if (blink) blink.remove();
        blink = this.time.addEvent({ 
          delay: 500, 
          loop: true, 
          callback: () => cursor.setVisible(!cursor.visible) 
        });
        updateCursor();
      },
      blur: () => {
        if (this.activeInput === obj) {
          this.activeInput = null;
        }
        bg.setStrokeStyle(2, 0x666666);
        cursor.setVisible(false);
        if (blink) {
          blink.remove();
          blink = null;
        }
      },
      type: (c) => {
        val = val.slice(0, idx) + c + val.slice(idx);
        idx++;
        txt.setText(val);
        updateCursor();
      },
      backspace: () => {
        if (idx > 0) {
          val = val.slice(0, idx - 1) + val.slice(idx);
          idx--;
          txt.setText(val);
          updateCursor();
        }
      },
      move: (d) => {
        idx = Math.max(0, Math.min(val.length, idx + d));
        updateCursor();
      }
    };
    
    bg.setInteractive({ useHandCursor: true });
    bg.on('pointerdown', (pointer, localX) => {
      obj.focus();
      // 根据点击位置计算光标索引
      const clickX = localX + w/2 - 12;
      let bestIdx = 0;
      let bestDiff = Math.abs(clickX);
      
      // 逐个字符测试找到最接近的位置
      for (let i = 0; i <= val.length; i++) {
        measureText.setText(val.substring(0, i));
        const charX = measureText.width;
        const diff = Math.abs(charX - clickX);
        if (diff < bestDiff) {
          bestDiff = diff;
          bestIdx = i;
        }
      }
      idx = bestIdx;
      updateCursor();
    });
    
    updateCursor();
    return obj;
  }
  
  createButton(x, y, label, cb) {
    // 按钮背景
    const bg = this.add.graphics();
    const drawBtn = (hover) => {
      bg.clear();
      bg.fillStyle(hover ? 0x5a7a5a : 0x4a6a4a);
      bg.fillRoundedRect(x - 120, y - 22, 240, 44, 8);
      bg.lineStyle(2, 0x4CAF50);
      bg.strokeRoundedRect(x - 120, y - 22, 240, 44, 8);
    };
    drawBtn(false);
    
    // 按钮文字
    this.add.text(x, y, label, {
      fontSize: '18px', 
      fontFamily: 'Arial', 
      color: '#ffffff'
    }).setOrigin(0.5);
    
    // 点击区域
    const zone = this.add.zone(x, y, 240, 44).setInteractive({ useHandCursor: true });
    
    zone.on('pointerover', () => drawBtn(true));
    zone.on('pointerout', () => drawBtn(false));
    zone.on('pointerdown', () => zone.setScale(0.95));
    zone.on('pointerup', () => { 
      zone.setScale(1); 
      cb(); 
    });
  }
  
  setupKeyboard() {
    this.input.keyboard.on('keydown', (e) => {
      if (!this.activeInput) return;
      
      if (e.key === 'Backspace') {
        e.preventDefault();
        this.activeInput.backspace();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        this.activeInput.move(-1);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        this.activeInput.move(1);
      } else if (e.key === 'Home') {
        e.preventDefault();
        this.activeInput.move(-999);
      } else if (e.key === 'End') {
        e.preventDefault();
        this.activeInput.move(999);
      } else if (e.key === 'Tab') {
        e.preventDefault();
        if (this.activeInput === this.serverInput) {
          this.nameInput.focus();
        } else {
          this.serverInput.focus();
        }
      } else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey) {
        this.activeInput.type(e.key);
      }
    });
  }
  
  async connect() {
    const url = this.serverInput.getValue();
    const name = this.nameInput.getValue();
    
    if (!name.trim()) {
      this.showStatus('请输入玩家名称', 'error');
      return;
    }
    
    this.showStatus('正在连接服务器...', 'info');
    
    try {
      console.log('Connecting to:', url);
      await window.socketManager.connect(url, name);
      // 连接成功后会收到 empire:init 事件
    } catch (err) {
      console.error('Connection error:', err);
      this.showStatus('连接失败: ' + (err.message || '请检查服务器地址'), 'error');
    }
  }
  
  showStatus(msg, type) {
    const colors = { 
      info: '#409EFF', 
      success: '#4CAF50', 
      error: '#f44336' 
    };
    this.statusText.setText(msg).setColor(colors[type] || '#ffffff');
  }
}
