import Phaser from 'phaser';
import { TERRAIN_TYPES } from '../shared/constants.js';

/**
 * 地图面板
 */
export class MapPanel extends Phaser.GameObjects.Container {
  constructor(scene, x, y) {
    super(scene, x, y);
    
    this.mapData = null;
    this.fullMapData = null;
    this.currentMode = 'view'; // 'view' 或 'world'
    this.mapZoom = 1;
    
    this.scene = scene;
    
    this.createUI();
    scene.add.existing(this);
  }
  
  createUI() {
    // 标题
    this.scene.add.text(0, -240, '🗺️ 世界地图', {
      fontSize: '24px',
      fontFamily: 'Arial',
      color: '#ffd700',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    
    // 地图容器
    this.mapContainer = this.scene.add.container(0, 0);
    this.add(this.mapContainer);
    
    // 控制按钮
    this.createControls();
    
    // 城堡信息
    this.castleInfo = this.scene.add.text(-550, 220, '🏰 城堡位置: 加载中...', {
      fontSize: '14px',
      color: '#ffd700'
    });
    this.add(this.castleInfo);
  }
  
  createControls() {
    const btnY = 240;
    
    // 视野模式按钮
    this.viewBtn = this.createButton(-200, btnY, '👁️ 视野模式', () => {
      this.switchMode('view');
    });
    
    // 世界地图按钮
    this.worldBtn = this.createButton(-50, btnY, '🌍 世界地图', () => {
      this.switchMode('world');
    });
    
    // 缩放控制
    this.createButton(100, btnY, '🔍+', () => this.zoomIn());
    this.createButton(180, btnY, '🔍-', () => this.zoomOut());
    
    // 刷新按钮
    this.createButton(280, btnY, '🔄 刷新', () => {
      window.socketManager.emit('map:getView', { playerId: window.socketManager.playerId });
    });
  }
  
  createButton(x, y, label, callback) {
    const container = this.scene.add.container(x, y);
    
    const bg = this.scene.add.graphics();
    bg.fillStyle(0x4a5568, 1);
    bg.fillRoundedRect(-50, -18, 100, 36, 6);
    
    const text = this.scene.add.text(0, 0, label, {
      fontSize: '13px',
      color: '#ffffff'
    }).setOrigin(0.5);
    
    container.add([bg, text]);
    
    const zone = this.scene.add.zone(0, 0, 100, 36).setInteractive({ useHandCursor: true });
    container.add(zone);
    
    zone.on('pointerover', () => {
      bg.clear();
      bg.fillStyle(0x5a6578, 1);
      bg.fillRoundedRect(-50, -18, 100, 36, 6);
    });
    
    zone.on('pointerout', () => {
      bg.clear();
      bg.fillStyle(0x4a5568, 1);
      bg.fillRoundedRect(-50, -18, 100, 36, 6);
    });
    
    zone.on('pointerup', callback);
    
    return container;
  }
  
  switchMode(mode) {
    this.currentMode = mode;
    
    // 更新按钮状态
    this.viewBtn.getAt(0).clear();
    this.worldBtn.getAt(0).clear();
    
    if (mode === 'view') {
      this.viewBtn.getAt(0).fillStyle(0x4CAF50, 1);
      this.worldBtn.getAt(0).fillStyle(0x4a5568, 1);
      if (this.mapData) this.renderViewMap();
    } else {
      this.viewBtn.getAt(0).fillStyle(0x4a5568, 1);
      this.worldBtn.getAt(0).fillStyle(0x4CAF50, 1);
      if (this.fullMapData) this.renderFullMap();
    }
    
    this.viewBtn.getAt(0).fillRoundedRect(-50, -18, 100, 36, 6);
    this.worldBtn.getAt(0).fillRoundedRect(-50, -18, 100, 36, 6);
  }
  
  updateData(data) {
    if (data.map) {
      this.mapData = data.map;
      if (this.currentMode === 'view') {
        this.renderViewMap();
      }
    }
    if (data.fullMap) {
      this.fullMapData = data.fullMap;
      if (this.currentMode === 'world') {
        this.renderFullMap();
      }
    }
  }
  
  renderViewMap() {
    const map = this.mapData;
    if (!map || !map.area) return;
    
    this.mapContainer.removeAll(true);
    
    // 更新城堡位置
    if (map.castle) {
      this.castleInfo.setText(`🏰 城堡位置: (${map.castle.x}, ${map.castle.y})`);
    }
    
    const cellSize = 24;
    const cols = 21;
    
    // 排序确保正确渲染
    const sorted = [...map.area].sort((a, b) => {
      if (a.y !== b.y) return a.y - b.y;
      return a.x - b.x;
    });
    
    const terrainColors = {
      plains: 0x7CFC00,
      forest: 0x228B22,
      hills: 0xDAA520,
      mountains: 0x696969,
      river: 0x1E90FF,
      lake: 0x00BFFF,
      desert: 0xF4A460,
      swamp: 0x556B2F
    };
    
    const terrainIcons = {
      forest: '🌲',
      hills: '⛰️',
      mountains: '🏔️',
      river: '💧',
      lake: '🌊',
      desert: '🏜️',
      swamp: '🌿'
    };
    
    sorted.forEach(tile => {
      const col = tile.x;
      const row = tile.y;
      const x = (col - 10) * cellSize;
      const y = (row - 10) * cellSize;
      
      // 地形背景
      const bg = this.scene.add.graphics();
      const color = terrainColors[tile.terrain?.id] || 0xcccccc;
      bg.fillStyle(color, 0.9);
      bg.fillRoundedRect(x - cellSize/2, y - cellSize/2, cellSize - 2, cellSize - 2, 4);
      this.mapContainer.add(bg);
      
      // 图标
      if (tile.hasCastle) {
        // 城堡
        const castle = this.scene.add.text(x, y, '🏰', {
          fontSize: '18px'
        }).setOrigin(0.5);
        castle.setScale(1.2);
        this.mapContainer.add(castle);
        
        // 金色发光效果
        const glow = this.scene.add.graphics();
        glow.lineStyle(2, 0xFFD700, 0.8);
        glow.strokeRoundedRect(x - cellSize/2 - 2, y - cellSize/2 - 2, cellSize + 2, cellSize + 2, 4);
        this.mapContainer.add(glow);
      } else if (tile.npcs && tile.npcs.length > 0) {
        // NPC
        const npc = tile.npcs[0];
        const icon = npc.isNeutral ? '🏪' : '⚔️';
        const color = npc.isNeutral ? 0x9370DB : 0xFF4500;
        
        const npcIcon = this.scene.add.text(x, y, icon, {
          fontSize: '16px'
        }).setOrigin(0.5);
        this.mapContainer.add(npcIcon);
        
        // NPC发光
        const glow = this.scene.add.graphics();
        glow.lineStyle(2, color, 0.6);
        glow.strokeRoundedRect(x - cellSize/2, y - cellSize/2, cellSize - 2, cellSize - 2, 4);
        this.mapContainer.add(glow);
      } else {
        // 地形图标
        const icon = terrainIcons[tile.terrain?.id];
        if (icon) {
          const text = this.scene.add.text(x, y, icon, {
            fontSize: '14px'
          }).setOrigin(0.5);
          this.mapContainer.add(text);
        }
      }
      
      // 点击区域
      const zone = this.scene.add.zone(x, y, cellSize, cellSize).setInteractive();
      this.mapContainer.add(zone);
      
      zone.on('pointerover', () => {
        bg.clear();
        bg.fillStyle(0xffffff, 0.3);
        bg.fillRoundedRect(x - cellSize/2, y - cellSize/2, cellSize - 2, cellSize - 2, 4);
      });
      
      zone.on('pointerout', () => {
        const color2 = terrainColors[tile.terrain?.id] || 0xcccccc;
        bg.clear();
        bg.fillStyle(color2, 0.9);
        bg.fillRoundedRect(x - cellSize/2, y - cellSize/2, cellSize - 2, cellSize - 2, 4);
      });
      
      zone.on('pointerup', () => {
        this.showTileInfo(tile);
      });
    });
  }
  
  renderFullMap() {
    const map = this.fullMapData;
    if (!map) return;
    
    this.mapContainer.removeAll(true);
    
    // 简化显示，使用小格子
    const cellSize = 6;
    const size = map.size;
    
    const terrainColors = {
      plains: 0x7CFC00,
      forest: 0x228B22,
      hills: 0xDAA520,
      mountains: 0x696969,
      river: 0x1E90FF,
      lake: 0x00BFFF,
      desert: 0xF4A460,
      swamp: 0x556B2F
    };
    
    // 创建NPC和城堡查找表
    const npcLookup = {};
    if (map.npcs) {
      map.npcs.forEach(npc => {
        npcLookup[`${npc.x},${npc.y}`] = npc;
      });
    }
    
    const castleLookup = {};
    if (map.castles) {
      map.castles.forEach(castle => {
        castleLookup[`${castle.x},${castle.y}`] = castle;
      });
    }
    
    // 渲染地形
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const terrainId = map.terrain?.[y]?.[x] || 'plains';
        const npc = npcLookup[`${x},${y}`];
        const castle = castleLookup[`${x},${y}`];
        
        const px = (x - size/2) * cellSize;
        const py = (y - size/2) * cellSize;
        
        const cell = this.scene.add.graphics();
        
        if (castle) {
          cell.fillStyle(castle.isOwn ? 0x8B4513 : 0x4a4a4a, 1);
        } else if (npc) {
          cell.fillStyle(npc.hasMerchant ? 0x9370DB : 0xFF4500, 1);
        } else {
          cell.fillStyle(terrainColors[terrainId] || 0xcccccc, 1);
        }
        
        cell.fillRect(px, py, cellSize - 1, cellSize - 1);
        this.mapContainer.add(cell);
      }
    }
    
    // 应用缩放
    this.mapContainer.setScale(this.mapZoom);
  }
  
  zoomIn() {
    this.mapZoom = Math.min(2, this.mapZoom + 0.2);
    this.mapContainer.setScale(this.mapZoom);
  }
  
  zoomOut() {
    this.mapZoom = Math.max(0.5, this.mapZoom - 0.2);
    this.mapContainer.setScale(this.mapZoom);
  }
  
  showTileInfo(tile) {
    const terrainNames = {
      plains: '平原', forest: '森林', hills: '丘陵',
      mountains: '山地', river: '河流', lake: '湖泊',
      desert: '沙漠', swamp: '沼泽'
    };
    
    const modal = this.scene.add.container(640, 360);
    modal.setDepth(1000);
    
    // 背景
    const overlay = this.scene.add.graphics();
    overlay.fillStyle(0x000000, 0.7);
    overlay.fillRect(-640, -360, 1280, 720);
    overlay.setInteractive();
    overlay.on('pointerup', () => modal.destroy());
    modal.add(overlay);
    
    // 弹窗
    const bg = this.scene.add.graphics();
    bg.fillStyle(0x1a1a2e, 1);
    bg.fillRoundedRect(-200, -150, 400, 300, 12);
    bg.lineStyle(2, 0xffd700, 1);
    bg.strokeRoundedRect(-200, -150, 400, 300, 12);
    modal.add(bg);
    
    // 标题
    const title = this.scene.add.text(0, -120, `位置 (${tile.x}, ${tile.y})`, {
      fontSize: '20px',
      color: '#ffd700',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    modal.add(title);
    
    // 地形
    const terrainName = terrainNames[tile.terrain?.id] || tile.terrain?.id || '未知';
    const terrain = this.scene.add.text(0, -80, `地形: ${terrainName}`, {
      fontSize: '16px',
      color: '#ffffff'
    }).setOrigin(0.5);
    modal.add(terrain);
    
    // 防御加成
    let defenseBonus = 0;
    if (tile.terrain?.id === 'mountains') defenseBonus = 25;
    else if (tile.terrain?.id === 'hills') defenseBonus = 15;
    else if (tile.terrain?.id === 'forest') defenseBonus = 10;
    
    if (defenseBonus > 0) {
      const defense = this.scene.add.text(0, -50, `防御加成: +${defenseBonus}%`, {
        fontSize: '14px',
        color: '#4CAF50'
      }).setOrigin(0.5);
      modal.add(defense);
    }
    
    // NPC信息
    if (tile.npcs && tile.npcs.length > 0) {
      const npc = tile.npcs[0];
      const npcType = npc.isNeutral ? '商人商队 🏪' : '敌对势力 ⚔️';
      const npcText = this.scene.add.text(0, -10, npcType, {
        fontSize: '16px',
        color: npc.isNeutral ? '#9370DB' : '#FF4500'
      }).setOrigin(0.5);
      modal.add(npcText);
      
      if (!npc.isNeutral) {
        const attackBtn = this.scene.add.text(0, 50, '⚔️ 攻击', {
          fontSize: '16px',
          color: '#ffffff',
          backgroundColor: '#f44336',
          padding: { x: 30, y: 10 }
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });
        
        attackBtn.on('pointerup', () => {
          window.socketManager.emit('battle:start', {
            playerId: window.socketManager.playerId,
            npcTypeId: npc.type
          });
          modal.destroy();
        });
        modal.add(attackBtn);
      }
    }
    
    // 城堡信息
    if (tile.hasCastle) {
      const castleText = this.scene.add.text(0, 20, '🏰 我的城堡', {
        fontSize: '18px',
        color: '#ffd700'
      }).setOrigin(0.5);
      modal.add(castleText);
    }
    
    // 关闭按钮
    const closeBtn = this.scene.add.text(0, 100, '关闭', {
      fontSize: '14px',
      color: '#ffffff',
      backgroundColor: '#666666',
      padding: { x: 40, y: 8 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    
    closeBtn.on('pointerup', () => modal.destroy());
    modal.add(closeBtn);
    
    this.scene.add.existing(modal);
  }
  
  onShow() {
    // 请求地图数据
    window.socketManager.emit('map:getView', {
      playerId: window.socketManager.playerId
    });
  }
}
