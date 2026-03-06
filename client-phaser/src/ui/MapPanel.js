import Phaser from 'phaser';

/**
 * 地图面板 - 世界地图显示
 */
export class MapPanel extends Phaser.GameObjects.Container {
  constructor(scene, x, y) {
    super(scene, x, y);
    
    this.mapData = null;
    this.castlePosition = null;
    this.currentMode = 'view'; // 'view' 或 'world'
    this.zoom = 1;
    
    this.scene = scene;
    
    this.createUI();
    scene.add.existing(this);
  }
  
  createUI() {
    // 标题
    this.scene.add.text(0, -260, '🗺️ 世界地图', {
      fontSize: '24px',
      fontFamily: 'Microsoft YaHei, Arial',
      color: '#ffd700',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    
    // 地图容器
    this.mapContainer = this.scene.add.container(0, 0);
    this.add(this.mapContainer);
    
    // 遮罩
    const maskGraphics = this.scene.make.graphics();
    maskGraphics.fillRect(-560, -220, 1120, 440);
    const mask = maskGraphics.createGeometryMask();
    this.mapContainer.setMask(mask);
    
    // 控制按钮
    this.createControls();
    
    // 提示文字
    this.hintText = this.scene.add.text(0, 240, '点击地块查看详情 | 鼠标滚轮缩放', {
      fontSize: '12px',
      color: '#888888'
    }).setOrigin(0.5);
    this.add(this.hintText);
  }
  
  createControls() {
    // 模式切换按钮
    const viewBtn = this.createButton(-80, -230, '视野模式', () => this.switchMode('view'));
    const worldBtn = this.createButton(80, -230, '世界地图', () => this.switchMode('world'));
    
    this.modeButtons = { view: viewBtn, world: worldBtn };
  }
  
  createButton(x, y, label, callback) {
    const container = this.scene.add.container(x, y);
    
    const bg = this.scene.add.graphics();
    bg.fillStyle(0x2a2a3e, 1);
    bg.fillRoundedRect(-50, -15, 100, 30, 6);
    bg.lineStyle(1, 0x666666, 1);
    bg.strokeRoundedRect(-50, -15, 100, 30, 6);
    container.add(bg);
    
    const text = this.scene.add.text(0, 0, label, {
      fontSize: '13px',
      color: '#aaaaaa'
    }).setOrigin(0.5);
    container.add(text);
    
    const zone = this.scene.add.zone(0, 0, 100, 30).setInteractive({ useHandCursor: true });
    container.add(zone);
    
    zone.on('pointerover', () => text.setColor('#ffffff'));
    zone.on('pointerout', () => text.setColor('#aaaaaa'));
    zone.on('pointerup', callback);
    
    return { container, bg, text };
  }
  
  switchMode(mode) {
    this.currentMode = mode;
    
    // 更新按钮样式
    Object.entries(this.modeButtons).forEach(([key, btn]) => {
      if (key === mode) {
        btn.bg.clear();
        btn.bg.fillStyle(0x4CAF50, 0.3);
        btn.bg.fillRoundedRect(-50, -15, 100, 30, 6);
        btn.bg.lineStyle(1, 0x4CAF50, 1);
        btn.bg.strokeRoundedRect(-50, -15, 100, 30, 6);
        btn.text.setColor('#4CAF50');
      } else {
        btn.bg.clear();
        btn.bg.fillStyle(0x2a2a3e, 1);
        btn.bg.fillRoundedRect(-50, -15, 100, 30, 6);
        btn.bg.lineStyle(1, 0x666666, 1);
        btn.bg.strokeRoundedRect(-50, -15, 100, 30, 6);
        btn.text.setColor('#aaaaaa');
      }
    });
    
    this.renderMap();
  }
  
  updateData(data) {
    if (data.map) {
      this.mapData = data.map;
      this.castlePosition = data.map.castle;
      this.renderMap();
    }
  }
  
  renderMap() {
    // 清除旧地图
    this.mapContainer.removeAll(true);
    
    if (!this.mapData) {
      // 显示提示
      const hint = this.scene.add.text(0, 0, '暂无地图数据', {
        fontSize: '16px',
        color: '#888888'
      }).setOrigin(0.5);
      this.mapContainer.add(hint);
      return;
    }
    
    if (this.currentMode === 'view') {
      this.renderViewMode();
    } else {
      this.renderWorldMode();
    }
  }
  
  renderViewMode() {
    // 视野模式 - 显示21x21区域
    const viewSize = 21;
    const tileSize = 24;
    const halfSize = Math.floor(viewSize / 2);
    
    const cx = this.castlePosition?.x || 50;
    const cy = this.castlePosition?.y || 50;
    
    // 背景
    const bg = this.scene.add.graphics();
    bg.fillStyle(0x000000, 0.5);
    bg.fillRect(-halfSize * tileSize - 10, -halfSize * tileSize - 10, 
                viewSize * tileSize + 20, viewSize * tileSize + 20);
    this.mapContainer.add(bg);
    
    // 渲染地块
    for (let dy = -halfSize; dy <= halfSize; dy++) {
      for (let dx = -halfSize; dx <= halfSize; dx++) {
        const x = cx + dx;
        const y = cy + dy;
        
        if (x >= 0 && x < 100 && y >= 0 && y < 100) {
          this.renderTile(x, y, dx * tileSize, dy * tileSize, tileSize);
        }
      }
    }
    
    // 渲染城堡
    if (this.castlePosition) {
      const castleX = 0;
      const castleY = 0;
      this.renderCastle(castleX, castleY, tileSize);
    }
  }
  
  renderWorldMode() {
    // 世界模式 - 缩略图
    const mapSize = 100;
    const tileSize = 4;
    
    // 背景
    const bg = this.scene.add.graphics();
    bg.fillStyle(0x000000, 0.5);
    bg.fillRect(-mapSize * tileSize / 2 - 5, -mapSize * tileSize / 2 - 5,
                mapSize * tileSize + 10, mapSize * tileSize + 10);
    this.mapContainer.add(bg);
    
    // 简化渲染 - 只显示地形颜色
    // 实际实现中应该根据地图数据渲染
    const terrainColors = {
      plains: 0x4CAF50,
      forest: 0x2E7D32,
      hills: 0x8D6E63,
      mountains: 0x757575,
      river: 0x2196F3,
      desert: 0xFFC107,
      swamp: 0x795548
    };
    
    // 这里简化处理，实际应该从mapData获取
    for (let y = 0; y < mapSize; y += 2) {
      for (let x = 0; x < mapSize; x += 2) {
        const color = terrainColors.plains;
        const px = (x - mapSize / 2) * tileSize;
        const py = (y - mapSize / 2) * tileSize;
        
        const tile = this.scene.add.rectangle(px, py, tileSize * 2, tileSize * 2, color);
        tile.setAlpha(0.6);
        this.mapContainer.add(tile);
      }
    }
    
    // 城堡位置
    if (this.castlePosition) {
      const px = (this.castlePosition.x - mapSize / 2) * tileSize;
      const py = (this.castlePosition.y - mapSize / 2) * tileSize;
      
      const castle = this.scene.add.text(px, py, '🏰', {
        fontSize: '16px'
      }).setOrigin(0.5);
      this.mapContainer.add(castle);
    }
  }
  
  renderTile(x, y, px, py, size) {
    // 简化地形渲染
    const colors = {
      plains: 0x4CAF50,
      forest: 0x2E7D32,
      hills: 0x8D6E63,
      mountains: 0x757575,
      river: 0x2196F3
    };
    
    // 默认平原
    const color = colors.plains;
    
    const tile = this.scene.add.rectangle(px, py, size - 1, size - 1, color);
    tile.setAlpha(0.8);
    tile.setInteractive();
    tile.on('pointerup', () => this.onTileClick(x, y));
    this.mapContainer.add(tile);
  }
  
  renderCastle(x, y, size) {
    const castle = this.scene.add.text(x, y, '🏰', {
      fontSize: `${size}px`
    }).setOrigin(0.5);
    
    // 发光效果
    const glow = this.scene.add.graphics();
    glow.fillStyle(0xffd700, 0.3);
    glow.fillCircle(x, y, size * 0.8);
    
    this.mapContainer.add([glow, castle]);
  }
  
  onTileClick(x, y) {
    console.log('Clicked tile:', x, y);
    // 可以显示地块详情弹窗
  }
  
  onShow() {
    // 获取地图数据
    if (!this.mapData) {
      // 触发获取地图数据
    }
  }
}
