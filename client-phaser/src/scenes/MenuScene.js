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
    this.add.text(640, 80, '🏰 帝国崛起', {
      fontSize: '56px',
      fontFamily: 'Arial',
      color: '#ffd700',
      stroke: '#000',
      strokeThickness: 6
    }).setOrigin(0.5);
    
    // 副标题
    this.add.text(640, 150, '蛮荒争霸', {
      fontSize: '28px',
      fontFamily: 'Arial',
      color: '#aaaaaa'
    }).setOrigin(0.5);
    
    // 创建连接面板
    this.createPanel();
    
    // 版本
    this.add.text(1260, 700, 'v1.0.0', { fontSize: '14px', color: '#555' }).setOrigin(1, 0.5);
    
    // 监听事件
    this.setupSocketListeners();
    
    // 设置键盘
    this.setupKeyboard();
  }
  
  setupSocketListeners() {
    // 清除旧监听器
    window.socketManager.off('empire:init');
    window.socketManager.off('connect_error');
    
    window.socketManager.on('empire:init', (data) => {
      console.log('empire:init received:', data);
      if (data?.playerId) {
        this.showStatus('连接成功！进入游戏...', 'success');
        this.time.delayedCall(500, () => {
          this.scene.start('GameScene', { empireData: data });
        });
      }
    });
    
    window.socketManager.on('connect_error', (err) => {
      console.error('Connect error:', err);
      this.showStatus('连接失败: ' + err.message, 'error');
    });
  }

  createPanel() {
    const cx = 640;
    const top = 200;
    
    // 面板背景
    const g = this.add.graphics();
    g.fillStyle(0x000000, 0.85);
    g.fillRoundedRect(cx - 260, top, 520, 360, 10);
    g.lineStyle(2, 0xffd700, 0.5);
    g.strokeRoundedRect(cx - 260, top, 520, 360, 10);
    
    // 标题
    this.add.text(cx, top + 30, '连接服务器', {
      fontSize: '26px', fontFamily: 'Arial', color: '#ffd700'
    }).setOrigin(0.5);
    
    // 服务器标签
    this.add.text(cx - 110, top + 90, '服务器:', {
      fontSize: '16px', fontFamily: 'Arial', color: '#ccc'
    }).setOrigin(1, 0.5);
    
    // 服务器输入
    this.serverInput = this.createInput(cx + 30, top + 90, 260, 36, 'http://localhost:3000');
    
    // 玩家名标签
    this.add.text(cx - 110, top + 150, '玩家名称:', {
      fontSize: '16px', fontFamily: 'Arial', color: '#ccc'
    }).setOrigin(1, 0.5);
    
    // 玩家名输入
    this.nameInput = this.createInput(cx + 30, top + 150, 260, 36, `领主${Math.floor(Math.random() * 1000)}`);
    
    // 按钮
    this.createButton(cx, top + 230, '连接并创建帝国', () => this.connect());
    
    // 状态
    this.statusText = this.add.text(cx, top + 290, '', {
      fontSize: '14px', fontFamily: 'Arial'
    }).setOrigin(0.5);
    
    // 说明
    this.add.text(cx, 600, '游戏指南: 收集资源 → 训练军队 → 攻打NPC → 扩张帝国', {
      fontSize: '13px', color: '#666'
    }).setOrigin(0.5);
  }
  
  createInput(x, y, w, h, defaultVal) {
    // 背景
    const bg = this.add.rectangle(x, y, w, h, 0x1a1a2e).setStrokeStyle(1, 0x666);
    bg.setOrigin(0, 0.5);
    
    // 文字 - 使用 WebFont 加载确保清晰
    const txt = this.add.text(x + 10, y, defaultVal, {
      fontSize: '15px', fontFamily: 'monospace', color: '#fff'
    }).setOrigin(0, 0.5);
    
    // 光标
    const cursor = this.add.text(x + 10, y, '|', {
      fontSize: '15px', color: '#4CAF50'
    }).setOrigin(0, 0.5).setVisible(false);
    
    let val = defaultVal;
    let idx = val.length;
    let focused = false;
    let blink = null;
    
    const updateCursor = () => {
      const w = val.substring(0, idx).length * 9;
      cursor.x = x + 10 + w;
    };
    
    const obj = {
      getValue: () => val,
      focus: () => {
        if (this.activeInput && this.activeInput !== obj) this.activeInput.blur();
        focused = true;
        this.activeInput = obj;
        bg.setStrokeStyle(2, 0x4CAF50);
        cursor.setVisible(true);
        if (blink) blink.remove();
        blink = this.time.addEvent({ delay: 500, loop: true, callback: () => cursor.setVisible(!cursor.visible) });
        updateCursor();
      },
      blur: () => {
        focused = false;
        if (this.activeInput === obj) this.activeInput = null;
        bg.setStrokeStyle(1, 0x666);
        cursor.setVisible(false);
        if (blink) { blink.remove(); blink = null; }
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
    bg.on('pointerdown', (p, lx, ly, e) => {
      if (e) e.stopPropagation();
      obj.focus();
      const clickW = lx + w/2 - 10;
      idx = Math.round(clickW / 9);
      idx = Math.max(0, Math.min(val.length, idx));
      updateCursor();
    });
    
    updateCursor();
    return obj;
  }
  
  createButton(x, y, label, cb) {
    const g = this.add.graphics();
    g.fillStyle(0x4a5568);
    g.fillRoundedRect(x - 100, y - 20, 200, 40, 6);
    
    const txt = this.add.text(x, y, label, {
      fontSize: '16px', fontFamily: 'Arial', color: '#fff'
    }).setOrigin(0.5);
    
    const zone = this.add.zone(x, y, 200, 40).setInteractive({ useHandCursor: true });
    
    zone.on('pointerover', () => {
      g.clear();
      g.fillStyle(0x5a6578);
      g.fillRoundedRect(x - 100, y - 20, 200, 40, 6);
    });
    zone.on('pointerout', () => {
      g.clear();
      g.fillStyle(0x4a5568);
      g.fillRoundedRect(x - 100, y - 20, 200, 40, 6);
    });
    zone.on('pointerdown', () => zone.setScale(0.95));
    zone.on('pointerup', () => { zone.setScale(1); cb(); });
  }
  
  setupKeyboard() {
    this.input.keyboard.on('keydown', (e) => {
      if (!this.activeInput) return;
      e.preventDefault();
      
      if (e.key === 'Backspace') this.activeInput.backspace();
      else if (e.key === 'ArrowLeft') this.activeInput.move(-1);
      else if (e.key === 'ArrowRight') this.activeInput.move(1);
      else if (e.key === 'Home') this.activeInput.move(-999);
      else if (e.key === 'End') this.activeInput.move(999);
      else if (e.key === 'Tab') {
        if (this.activeInput === this.serverInput) this.nameInput.focus();
        else this.serverInput.focus();
      }
      else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey) {
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
    
    this.showStatus('正在连接...', 'info');
    
    try {
      await window.socketManager.connect(url, name);
      this.showStatus('已连接，等待数据...', 'success');
    } catch (err) {
      this.showStatus('连接失败', 'error');
    }
  }
  
  showStatus(msg, type) {
    const colors = { info: '#409EFF', success: '#4CAF50', error: '#f44336' };
    this.statusText.setText(msg).setColor(colors[type] || '#888');
  }
}
