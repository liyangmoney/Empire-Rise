import Phaser from 'phaser';

/**
 * 启动场景 - 加载资源
 */
export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload() {
    // 更新加载进度
    window.updateProgress(10, '正在初始化...');
    
    // 创建临时图形资源（后续可以替换为真实图片）
    this.createPlaceholderGraphics();
    
    // 加载进度事件
    this.load.on('progress', (value) => {
      window.updateProgress(10 + value * 80, `加载资源 ${Math.floor(value * 100)}%`);
    });
    
    this.load.on('complete', () => {
      window.updateProgress(100, '加载完成!');
      setTimeout(() => {
        window.hideLoading();
        this.scene.start('MenuScene');
      }, 500);
    });
  }

  createPlaceholderGraphics() {
    // 创建程序生成的纹理
    
    // 背景纹理
    const bgGraphics = this.make.graphics({ x: 0, y: 0, add: false });
    bgGraphics.fillGradientStyle(0x1a1a2e, 0x1a1a2e, 0x16213e, 0x16213e, 1);
    bgGraphics.fillRect(0, 0, 1280, 720);
    bgGraphics.generateTexture('bg-gradient', 1280, 720);
    
    // 按钮纹理
    const btnGraphics = this.make.graphics({ x: 0, y: 0, add: false });
    btnGraphics.fillStyle(0x4a5568);
    btnGraphics.fillRoundedRect(0, 0, 200, 50, 10);
    btnGraphics.generateTexture('btn-normal', 200, 50);
    
    const btnHover = this.make.graphics({ x: 0, y: 0, add: false });
    btnHover.fillStyle(0x5a6578);
    btnHover.fillRoundedRect(0, 0, 200, 50, 10);
    btnHover.generateTexture('btn-hover', 200, 50);
    
    // 面板纹理
    const panelGraphics = this.make.graphics({ x: 0, y: 0, add: false });
    panelGraphics.fillStyle(0x000000, 0.7);
    panelGraphics.fillRoundedRect(0, 0, 400, 300, 15);
    panelGraphics.lineStyle(2, 0xffd700, 0.5);
    panelGraphics.strokeRoundedRect(0, 0, 400, 300, 15);
    panelGraphics.generateTexture('panel', 400, 300);
    
    // 资源图标
    const resources = [
      { key: 'icon-wood', color: 0x8B4513, emoji: '🌲' },
      { key: 'icon-stone', color: 0x808080, emoji: '🪨' },
      { key: 'icon-food', color: 0xFFD700, emoji: '🌾' },
      { key: 'icon-iron', color: 0x4a5568, emoji: '⛏️' },
      { key: 'icon-crystal', color: 0x00CED1, emoji: '💎' },
      { key: 'icon-gold', color: 0xFFD700, emoji: '🪙' }
    ];
    
    resources.forEach(res => {
      const g = this.make.graphics({ x: 0, y: 0, add: false });
      g.fillStyle(res.color);
      g.fillCircle(20, 20, 18);
      g.generateTexture(res.key, 40, 40);
    });
    
    // 兵种图标
    const units = [
      { key: 'unit-infantry', color: 0x4CAF50 },
      { key: 'unit-archer', color: 0x2196F3 },
      { key: 'unit-cavalry', color: 0xFF9800 }
    ];
    
    units.forEach(unit => {
      const g = this.make.graphics({ x: 0, y: 0, add: false });
      g.fillStyle(unit.color);
      g.fillRect(0, 0, 64, 64);
      g.generateTexture(unit.key, 64, 64);
    });
  }

  create() {
    // 可以在这里预加载一些数据
  }
}
