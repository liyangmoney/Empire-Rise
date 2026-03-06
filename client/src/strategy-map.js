// ============================================
// 战略地图系统 - 英雄无敌风格
// ============================================

class StrategyMap {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    if (!this.container) return;
    
    // 地图配置
    this.mapSize = 100;
    this.tileSize = 64;
    this.minTileSize = 32;
    this.maxTileSize = 128;
    
    // 视口相机
    this.camera = {
      x: 0,
      y: 0,
      zoom: 1
    };
    
    // 拖拽状态
    this.isDragging = false;
    this.lastMouseX = 0;
    this.lastMouseY = 0;
    
    // 地图数据
    this.terrain = null;
    this.castles = [];
    this.npcs = [];
    this.myCastle = null;
    this.fogOfWar = null; // 战争迷雾
    
    // 动画
    this.animations = [];
    this.lastTime = 0;
    
    // 势力颜色
    this.factionColors = {
      player: '#FFD700',    // 金色 - 玩家
      enemy: '#DC143C',     // 深红 - 敌人
      neutral: '#9370DB',   // 紫色 - 中立
      ally: '#4169E1'       // 蓝色 - 盟友
    };
    
    // 地形颜色（写实风格）
    this.terrainColors = {
      plains: { base: '#7CBA3D', dark: '#5A8A2A', name: '平原' },
      forest: { base: '#228B22', dark: '#1A6B1A', name: '森林' },
      hills: { base: '#DAA520', dark: '#B8860B', name: '丘陵' },
      mountains: { base: '#808080', dark: '#696969', name: '山地' },
      river: { base: '#4682B4', dark: '#2F5F8F', name: '河流' },
      lake: { base: '#87CEEB', dark: '#5F9EA0', name: '湖泊' },
      desert: { base: '#F4A460', dark: '#D2691E', name: '沙漠' },
      swamp: { base: '#556B2F', dark: '#3D4F1F', name: '沼泽' }
    };
    
    this.init();
  }
  
  init() {
    this.createCanvas();
    this.bindEvents();
    this.startAnimationLoop();
  }
  
  createCanvas() {
    // 清空容器
    this.container.innerHTML = '';
    this.container.style.position = 'relative';
    this.container.style.overflow = 'hidden';
    this.container.style.background = '#1a1a2e';
    
    // 创建Canvas
    this.canvas = document.createElement('canvas');
    this.canvas.style.display = 'block';
    this.canvas.style.cursor = 'grab';
    this.container.appendChild(this.canvas);
    
    this.ctx = this.canvas.getContext('2d');
    
    // 设置Canvas大小
    this.resize();
    window.addEventListener('resize', () => this.resize());
  }
  
  resize() {
    const rect = this.container.getBoundingClientRect();
    this.canvas.width = rect.width;
    this.canvas.height = rect.height;
    this.render();
  }
  
  bindEvents() {
    // 鼠标按下 - 开始拖拽
    this.canvas.addEventListener('mousedown', (e) => {
      this.isDragging = true;
      this.lastMouseX = e.clientX;
      this.lastMouseY = e.clientY;
      this.canvas.style.cursor = 'grabbing';
    });
    
    // 鼠标移动 - 拖拽地图
    this.canvas.addEventListener('mousemove', (e) => {
      if (this.isDragging) {
        const dx = e.clientX - this.lastMouseX;
        const dy = e.clientY - this.lastMouseY;
        
        this.camera.x -= dx / this.camera.zoom;
        this.camera.y -= dy / this.camera.zoom;
        
        this.lastMouseX = e.clientX;
        this.lastMouseY = e.clientY;
        
        this.render();
      } else {
        // 悬停效果
        this.handleHover(e);
      }
    });
    
    // 鼠标抬起
    this.canvas.addEventListener('mouseup', () => {
      this.isDragging = false;
      this.canvas.style.cursor = 'grab';
    });
    
    // 鼠标离开
    this.canvas.addEventListener('mouseleave', () => {
      this.isDragging = false;
      this.canvas.style.cursor = 'grab';
    });
    
    // 点击
    this.canvas.addEventListener('click', (e) => {
      if (!this.isDragging) {
        this.handleClick(e);
      }
    });
    
    // 滚轮缩放
    this.canvas.addEventListener('wheel', (e) => {
      e.preventDefault();
      const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
      this.zoom(zoomFactor);
    });
  }
  
  // 加载地图数据
  loadMap(data) {
    this.terrain = data.terrain;
    this.castles = data.castles || [];
    this.npcs = data.npcs || [];
    this.myCastle = data.myCastle || this.castles.find(c => c.isOwn);
    
    // 初始化战争迷雾
    this.initFogOfWar();
    
    // 移动相机到玩家城堡
    if (this.myCastle) {
      this.centerOn(this.myCastle.x, this.myCastle.y);
    }
    
    this.render();
  }
  
  initFogOfWar() {
    this.fogOfWar = [];
    for (let y = 0; y < this.mapSize; y++) {
      this.fogOfWar[y] = [];
      for (let x = 0; x < this.mapSize; x++) {
        // 0 = 未探索(黑色), 1 = 已探索但不在视野(灰色), 2 = 当前视野(完全可见)
        this.fogOfWar[y][x] = 0;
      }
    }
    
    // 初始揭示玩家城堡周围
    if (this.myCastle) {
      this.revealArea(this.myCastle.x, this.myCastle.y, 10);
    }
  }
  
  revealArea(cx, cy, radius) {
    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        const x = cx + dx;
        const y = cy + dy;
        if (x >= 0 && x < this.mapSize && y >= 0 && y < this.mapSize) {
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist <= radius) {
            this.fogOfWar[y][x] = 2; // 当前视野
          }
        }
      }
    }
  }
  
  // 相机控制
  centerOn(x, y) {
    const rect = this.canvas.getBoundingClientRect();
    this.camera.x = x * this.tileSize - rect.width / 2 + this.tileSize / 2;
    this.camera.y = y * this.tileSize - rect.height / 2 + this.tileSize / 2;
    this.render();
  }
  
  zoom(factor) {
    const oldZoom = this.camera.zoom;
    this.camera.zoom *= factor;
    this.camera.zoom = Math.max(0.5, Math.min(2, this.camera.zoom));
    
    // 以屏幕中心为缩放中心
    const rect = this.canvas.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    const worldX = this.camera.x + centerX / oldZoom;
    const worldY = this.camera.y + centerY / oldZoom;
    
    this.camera.x = worldX - centerX / this.camera.zoom;
    this.camera.y = worldY - centerY / this.camera.zoom;
    
    this.render();
  }
  
  resetZoom() {
    this.camera.zoom = 1;
    if (this.myCastle) {
      this.centerOn(this.myCastle.x, this.myCastle.y);
    }
  }
  
  // 坐标转换
  screenToWorld(screenX, screenY) {
    return {
      x: this.camera.x + screenX / this.camera.zoom,
      y: this.camera.y + screenY / this.camera.zoom
    };
  }
  
  worldToTile(worldX, worldY) {
    return {
      x: Math.floor(worldX / this.tileSize),
      y: Math.floor(worldY / this.tileSize)
    };
  }
  
  // 处理悬停
  handleHover(e) {
    const rect = this.canvas.getBoundingClientRect();
    const world = this.screenToWorld(e.clientX - rect.left, e.clientY - rect.top);
    const tile = this.worldToTile(world.x, world.y);
    
    // 可以在这里显示tooltip
    // console.log('Hover:', tile.x, tile.y);
  }
  
  // 处理点击
  handleClick(e) {
    const rect = this.canvas.getBoundingClientRect();
    const world = this.screenToWorld(e.clientX - rect.left, e.clientY - rect.top);
    const tile = this.worldToTile(world.x, world.y);
    
    if (tile.x >= 0 && tile.x < this.mapSize && tile.y >= 0 && tile.y < this.mapSize) {
      // 查找点击位置的对象
      const castle = this.castles.find(c => c.x === tile.x && c.y === tile.y);
      const npc = this.npcs.find(n => n.x === tile.x && n.y === tile.y);
      
      // 触发点击事件
      if (this.onTileClick) {
        this.onTileClick({
          x: tile.x,
          y: tile.y,
          terrain: this.terrain[tile.y][tile.x],
          castle: castle,
          npc: npc
        });
      }
    }
  }
  
  // 渲染循环
  startAnimationLoop() {
    const loop = (timestamp) => {
      const deltaTime = timestamp - this.lastTime;
      this.lastTime = timestamp;
      
      this.updateAnimations(deltaTime);
      this.render();
      
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }
  
  updateAnimations(deltaTime) {
    // 更新动画状态
    this.animations = this.animations.filter(anim => {
      anim.time += deltaTime;
      return anim.time < anim.duration;
    });
  }
  
  // 主渲染函数
  render() {
    if (!this.ctx || !this.terrain) return;
    
    const ctx = this.ctx;
    const width = this.canvas.width;
    const height = this.canvas.height;
    
    // 清空背景
    ctx.fillStyle = '#0a0a14';
    ctx.fillRect(0, 0, width, height);
    
    // 计算可见区域
    const visibleTiles = this.getVisibleTiles();
    
    // 绘制地形
    this.renderTerrain(ctx, visibleTiles);
    
    // 绘制网格
    this.renderGrid(ctx, visibleTiles);
    
    // 绘制对象
    this.renderObjects(ctx, visibleTiles);
    
    // 绘制战争迷雾
    this.renderFogOfWar(ctx, visibleTiles);
    
    // 绘制行军路线
    this.renderPaths(ctx);
    
    // 绘制选中效果
    this.renderSelection(ctx);
  }
  
  getVisibleTiles() {
    const rect = this.canvas.getBoundingClientRect();
    const worldTopLeft = this.screenToWorld(0, 0);
    const worldBottomRight = this.screenToWorld(rect.width, rect.height);
    
    const tileTopLeft = this.worldToTile(worldTopLeft.x, worldTopLeft.y);
    const tileBottomRight = this.worldToTile(worldBottomRight.x, worldBottomRight.y);
    
    return {
      startX: Math.max(0, tileTopLeft.x - 1),
      startY: Math.max(0, tileTopLeft.y - 1),
      endX: Math.min(this.mapSize - 1, tileBottomRight.x + 1),
      endY: Math.min(this.mapSize - 1, tileBottomRight.y + 1)
    };
  }
  
  renderTerrain(ctx, visible) {
    const tileSize = this.tileSize * this.camera.zoom;
    
    for (let y = visible.startY; y <= visible.endY; y++) {
      for (let x = visible.startX; x <= visible.endX; x++) {
        const terrainId = this.terrain[y][x];
        const terrain = this.terrainColors[terrainId];
        
        const screenX = (x * this.tileSize - this.camera.x) * this.camera.zoom;
        const screenY = (y * this.tileSize - this.camera.y) * this.camera.zoom;
        
        // 绘制地形底色
        ctx.fillStyle = terrain.base;
        ctx.fillRect(screenX, screenY, tileSize + 1, tileSize + 1);
        
        // 绘制地形纹理（简单的渐变效果）
        const gradient = ctx.createLinearGradient(screenX, screenY, screenX, screenY + tileSize);
        gradient.addColorStop(0, 'rgba(255,255,255,0.1)');
        gradient.addColorStop(1, 'rgba(0,0,0,0.2)');
        ctx.fillStyle = gradient;
        ctx.fillRect(screenX, screenY, tileSize, tileSize);
      }
    }
  }
  
  renderGrid(ctx, visible) {
    const tileSize = this.tileSize * this.camera.zoom;
    
    ctx.strokeStyle = 'rgba(0,0,0,0.2)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    
    for (let x = visible.startX; x <= visible.endX + 1; x++) {
      const screenX = (x * this.tileSize - this.camera.x) * this.camera.zoom;
      ctx.moveTo(screenX, (visible.startY * this.tileSize - this.camera.y) * this.camera.zoom);
      ctx.lineTo(screenX, (visible.endY * this.tileSize - this.camera.y + this.tileSize) * this.camera.zoom);
    }
    
    for (let y = visible.startY; y <= visible.endY + 1; y++) {
      const screenY = (y * this.tileSize - this.camera.y) * this.camera.zoom;
      ctx.moveTo((visible.startX * this.tileSize - this.camera.x) * this.camera.zoom, screenY);
      ctx.lineTo((visible.endX * this.tileSize - this.camera.x + this.tileSize) * this.camera.zoom, screenY);
    }
    
    ctx.stroke();
  }
  
  renderObjects(ctx, visible) {
    const tileSize = this.tileSize * this.camera.zoom;
    
    // 绘制NPC
    this.npcs.forEach(npc => {
      if (npc.x >= visible.startX && npc.x <= visible.endX &&
          npc.y >= visible.startY && npc.y <= visible.endY) {
        
        const screenX = (npc.x * this.tileSize - this.camera.x) * this.camera.zoom;
        const screenY = (npc.y * this.tileSize - this.camera.y) * this.camera.zoom;
        
        // 势力颜色
        const color = npc.isNeutral ? this.factionColors.neutral : this.factionColors.enemy;
        
        // 绘制NPC圆圈
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(screenX + tileSize/2, screenY + tileSize/2, tileSize/3, 0, Math.PI * 2);
        ctx.fill();
        
        // 光晕效果
        ctx.fillStyle = color + '40'; // 半透明
        ctx.beginPath();
        ctx.arc(screenX + tileSize/2, screenY + tileSize/2, tileSize/2, 0, Math.PI * 2);
        ctx.fill();
        
        // 图标
        ctx.font = Math.floor(tileSize * 0.5) + 'px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(npc.isNeutral ? '🏪' : '⚔️', screenX + tileSize/2, screenY + tileSize/2);
      }
    });
    
    // 绘制城堡
    this.castles.forEach(castle => {
      if (castle.x >= visible.startX && castle.x <= visible.endX &&
          castle.y >= visible.startY && castle.y <= visible.endY) {
        
        const screenX = (castle.x * this.tileSize - this.camera.x) * this.camera.zoom;
        const screenY = (castle.y * this.tileSize - this.camera.y) * this.camera.zoom;
        
        // 势力颜色
        const color = castle.isOwn ? this.factionColors.player : this.factionColors.enemy;
        
        // 绘制城堡方块
        ctx.fillStyle = color;
        ctx.fillRect(screenX + 2, screenY + 2, tileSize - 4, tileSize - 4);
        
        // 金色边框（玩家城堡）
        if (castle.isOwn) {
          ctx.strokeStyle = '#FFD700';
          ctx.lineWidth = 3;
          ctx.strokeRect(screenX, screenY, tileSize, tileSize);
          
          // 闪烁效果
          const pulse = Math.sin(Date.now() / 500) * 0.3 + 0.7;
          ctx.fillStyle = `rgba(255, 215, 0, ${pulse * 0.3})`;
          ctx.fillRect(screenX - 2, screenY - 2, tileSize + 4, tileSize + 4);
        }
        
        // 城堡图标
        ctx.font = Math.floor(tileSize * 0.6) + 'px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🏰', screenX + tileSize/2, screenY + tileSize/2);
      }
    });
  }
  
  renderFogOfWar(ctx, visible) {
    const tileSize = this.tileSize * this.camera.zoom;
    
    for (let y = visible.startY; y <= visible.endY; y++) {
      for (let x = visible.startX; x <= visible.endX; x++) {
        const fog = this.fogOfWar[y][x];
        
        const screenX = (x * this.tileSize - this.camera.x) * this.camera.zoom;
        const screenY = (y * this.tileSize - this.camera.y) * this.camera.zoom;
        
        if (fog === 0) {
          // 未探索 - 完全黑色
          ctx.fillStyle = '#000000';
          ctx.fillRect(screenX, screenY, tileSize + 1, tileSize + 1);
        } else if (fog === 1) {
          // 已探索但不在视野 - 半透明黑色
          ctx.fillStyle = 'rgba(0,0,0,0.6)';
          ctx.fillRect(screenX, screenY, tileSize + 1, tileSize + 1);
        }
      }
    }
  }
  
  renderPaths(ctx) {
    // 绘制行军路线（示例）
    // 这里可以添加实际的路径绘制逻辑
  }
  
  renderSelection(ctx) {
    // 绘制选中效果
  }
}

// ============================================
// 全局地图实例
// ============================================
let strategyMap = null;

// 初始化地图
function initStrategyMap() {
  strategyMap = new StrategyMap('worldMap');
  
  // 设置点击回调
  strategyMap.onTileClick = (tile) => {
    console.log('点击地块:', tile);
    // 调用原有的showTileModal
    if (typeof showTileModal === 'function') {
      showTileModal(tile);
    }
  };
}

// 加载地图数据（供main.js调用）
function loadStrategyMap(data) {
  if (!strategyMap) {
    initStrategyMap();
  }
  strategyMap.loadMap(data);
}

// 缩放控制
function zoomMap(factor) {
  if (strategyMap) strategyMap.zoom(factor);
}

function resetMapView() {
  if (strategyMap) strategyMap.resetZoom();
}

// 页面加载完成后初始化
setTimeout(initStrategyMap, 500);
