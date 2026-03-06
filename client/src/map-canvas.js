// ============================================
// 地图渲染函数 - Canvas 版本
// ============================================

// 地形颜色配置
const TERRAIN_COLORS = {
  plains: '#7CFC00',
  forest: '#228B22', 
  hills: '#DAA520',
  mountains: '#696969',
  river: '#1E90FF',
  lake: '#00BFFF',
  desert: '#F4A460',
  swamp: '#556B2F'
};

const TERRAIN_NAMES = {
  plains: '平原',
  forest: '森林',
  hills: '丘陵', 
  mountains: '山地',
  river: '河流',
  lake: '湖泊',
  desert: '沙漠',
  swamp: '沼泽'
};

// 视野地图 Canvas
let viewMapCanvas = null;
let viewMapCtx = null;

// 世界地图 Canvas
let worldMapCanvas = null;
let worldMapCtx = null;

// 初始化 Canvas
function initMapCanvases() {
  const container = document.getElementById('worldMap');
  if (!container) return;
  
  // 清空容器
  container.innerHTML = '';
  container.style.display = 'flex';
  container.style.justifyContent = 'center';
  container.style.alignItems = 'center';
  container.style.overflow = 'auto';
  container.style.position = 'relative';
  container.style.width = '100%';
  container.style.height = '100%';
  
  // 创建视野地图 Canvas - 居中
  viewMapCanvas = document.createElement('canvas');
  viewMapCanvas.id = 'viewMapCanvas';
  viewMapCanvas.width = 21 * 28; // 21格 x 28像素
  viewMapCanvas.height = 21 * 28;
  viewMapCanvas.style.display = 'none';
  viewMapCanvas.style.cursor = 'pointer';
  viewMapCanvas.style.margin = 'auto';
  viewMapCanvas.style.position = 'absolute';
  viewMapCanvas.style.left = '50%';
  viewMapCanvas.style.top = '50%';
  viewMapCanvas.style.transform = 'translate(-50%, -50%)';
  viewMapCanvas.style.transformOrigin = 'center center';
  container.appendChild(viewMapCanvas);
  viewMapCtx = viewMapCanvas.getContext('2d');
  
  // 点击事件
  viewMapCanvas.onclick = (e) => {
    const rect = viewMapCanvas.getBoundingClientRect();
    const scaleX = viewMapCanvas.width / rect.width;
    const scaleY = viewMapCanvas.height / rect.height;
    const x = Math.floor(((e.clientX - rect.left) * scaleX) / 28);
    const y = Math.floor(((e.clientY - rect.top) * scaleY) / 28);
    
    // 找到对应的 tile
    if (currentViewMapData && currentViewMapData.area) {
      const tile = currentViewMapData.area.find(t => {
        const centerX = 10;
        const centerY = 10;
        const relX = t.x - currentViewMapData.castle.x + centerX;
        const relY = t.y - currentViewMapData.castle.y + centerY;
        return relX === x && relY === y;
      });
      if (tile) {
        showTileModal(tile);
        // 重绘选中效果
        renderViewMap(currentViewMapData, x, y);
      }
    }
  };
  
  // 创建世界地图 Canvas - 居中
  worldMapCanvas = document.createElement('canvas');
  worldMapCanvas.id = 'worldMapCanvas';
  worldMapCanvas.width = 100 * 8; // 100格 x 8像素
  worldMapCanvas.height = 100 * 8;
  worldMapCanvas.style.display = 'none';
  worldMapCanvas.style.cursor = 'pointer';
  worldMapCanvas.style.margin = 'auto';
  worldMapCanvas.style.position = 'absolute';
  worldMapCanvas.style.left = '50%';
  worldMapCanvas.style.top = '50%';
  worldMapCanvas.style.transform = 'translate(-50%, -50%)';
  worldMapCanvas.style.transformOrigin = 'center center';
  container.appendChild(worldMapCanvas);
  worldMapCtx = worldMapCanvas.getContext('2d');
  
  // 点击事件
  worldMapCanvas.onclick = (e) => {
    const rect = worldMapCanvas.getBoundingClientRect();
    const scaleX = worldMapCanvas.width / rect.width;
    const scaleY = worldMapCanvas.height / rect.height;
    const x = Math.floor(((e.clientX - rect.left) * scaleX) / 8);
    const y = Math.floor(((e.clientY - rect.top) * scaleY) / 8);
    
    if (fullMapData && x >= 0 && x < 100 && y >= 0 && y < 100) {
      const terrainId = fullMapData.terrain[y][x];
      const npc = fullMapData.npcs.find(n => n.x === x && n.y === y);
      const castle = fullMapData.castles.find(c => c.x === x && c.y === y);
      
      const tileData = {
        x, y,
        terrain: {
          id: terrainId,
          name: TERRAIN_NAMES[terrainId] || terrainId,
          defenseBonus: terrainId === 'mountains' ? 25 : terrainId === 'hills' ? 15 : terrainId === 'forest' ? 10 : 0
        },
        npcs: npc ? [{
          name: npc.hasMerchant ? '商人商队' : '敌对势力',
          isNeutral: npc.hasMerchant,
          power: '???'
        }] : [],
        hasCastle: !!castle
      };
      showTileModal(tileData);
      renderFullMap(fullMapData, x, y);
    }
  };
}

// 当前视野地图数据
let currentViewMapData = null;

function renderMap(map) {
  // 确保 Canvas 已初始化
  if (!viewMapCanvas) {
    initMapCanvases();
  }
  
  if (!viewMapCanvas) {
    console.error('Map canvas initialization failed');
    return;
  }
  
  if (currentMapMode === 'world' && fullMapData) {
    renderFullMap(fullMapData);
  } else {
    renderViewMap(map);
  }
}

function renderViewMap(map, selectedX = -1, selectedY = -1) {
  // 确保 Canvas 已创建
  if (!viewMapCanvas) {
    initMapCanvases();
  }
  
  if (!viewMapCanvas || !map) return;
  
  currentViewMapData = map;
  
  // 显示视野地图，隐藏世界地图
  viewMapCanvas.style.display = 'block';
  if (worldMapCanvas) worldMapCanvas.style.display = 'none';
  
  const ctx = viewMapCtx;
  const cellSize = 28;
  const size = 21;
  
  // 清空
  ctx.fillStyle = '#1a1a2e';
  ctx.fillRect(0, 0, viewMapCanvas.width, viewMapCanvas.height);
  
  if (!map.area || map.area.length === 0) {
    ctx.fillStyle = '#888';
    ctx.font = '16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('加载中...', viewMapCanvas.width / 2, viewMapCanvas.height / 2);
    return;
  }
  
  // 绘制每个格子
  const castleInfo = document.getElementById('castleInfo');
  const castlePos = document.getElementById('castlePos');
  if (castleInfo && castlePos && map.castle) {
    castleInfo.style.display = 'block';
    castlePos.textContent = '(' + map.castle.x + ', ' + map.castle.y + ')';
  }
  
  const centerX = 10;
  const centerY = 10;
  
  map.area.forEach(tile => {
    const relX = tile.x - map.castle.x + centerX;
    const relY = tile.y - map.castle.y + centerY;
    
    const px = relX * cellSize;
    const py = relY * cellSize;
    
    // 地形背景
    ctx.fillStyle = TERRAIN_COLORS[tile.terrain.id] || '#ccc';
    ctx.fillRect(px + 1, py + 1, cellSize - 2, cellSize - 2);
    
    // 城堡
    if (tile.hasCastle) {
      ctx.fillStyle = '#8B4513';
      ctx.fillRect(px + 2, py + 2, cellSize - 4, cellSize - 4);
      ctx.font = '18px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('🏰', px + cellSize / 2, py + cellSize / 2);
    }
    // NPC
    else if (tile.npcs && tile.npcs.length > 0) {
      const npc = tile.npcs[0];
      ctx.font = '16px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(npc.isNeutral ? '🏪' : '⚔️', px + cellSize / 2, py + cellSize / 2);
    }
    // 地形图标
    else {
      const icons = { forest: '🌲', hills: '⛰️', mountains: '🏔️', river: '💧', lake: '🌊', desert: '🏜️', swamp: '🌿' };
      if (icons[tile.terrain.id]) {
        ctx.font = '14px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(icons[tile.terrain.id], px + cellSize / 2, py + cellSize / 2);
      }
    }
    
    // 选中效果
    if (relX === selectedX && relY === selectedY) {
      ctx.strokeStyle = '#FFD700';
      ctx.lineWidth = 3;
      ctx.strokeRect(px, py, cellSize, cellSize);
    }
  });
  
  // 应用缩放
  applyMapZoom();
}

function renderFullMap(fullMap, selectedX = -1, selectedY = -1) {
  // 确保 Canvas 已创建
  if (!worldMapCanvas) {
    initMapCanvases();
  }
  
  if (!worldMapCanvas || !fullMap) return;
  
  fullMapData = fullMap;
  
  // 显示世界地图，隐藏视野地图
  worldMapCanvas.style.display = 'block';
  if (viewMapCanvas) viewMapCanvas.style.display = 'none';
  
  const ctx = worldMapCtx;
  const cellSize = 8;
  const mapSize = fullMap.size;
  
  // 清空
  ctx.fillStyle = '#1a1a2e';
  ctx.fillRect(0, 0, worldMapCanvas.width, worldMapCanvas.height);
  
  // 更新城堡信息
  const castleInfo = document.getElementById('castleInfo');
  const castlePos = document.getElementById('castlePos');
  const myCastle = fullMap.castles.find(c => c.isOwn);
  if (castleInfo && castlePos && myCastle) {
    castleInfo.style.display = 'block';
    castlePos.textContent = '(' + myCastle.x + ', ' + myCastle.y + ')';
  }
  
  // 绘制地形
  for (let y = 0; y < mapSize; y++) {
    for (let x = 0; x < mapSize; x++) {
      const terrainId = fullMap.terrain[y][x];
      ctx.fillStyle = TERRAIN_COLORS[terrainId] || '#ccc';
      ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
    }
  }
  
  // 绘制 NPC
  fullMap.npcs.forEach(npc => {
    ctx.fillStyle = npc.hasMerchant ? '#9370DB' : '#FF4500';
    ctx.fillRect(npc.x * cellSize, npc.y * cellSize, cellSize * 2, cellSize * 2);
  });
  
  // 绘制城堡
  fullMap.castles.forEach(castle => {
    ctx.fillStyle = castle.isOwn ? '#8B4513' : '#4a4a4a';
    ctx.fillRect(castle.x * cellSize - 1, castle.y * cellSize - 1, cellSize * 3, cellSize * 3);
    
    // 玩家自己的城堡加金色边框
    if (castle.isOwn) {
      ctx.strokeStyle = '#FFD700';
      ctx.lineWidth = 2;
      ctx.strokeRect(castle.x * cellSize - 2, castle.y * cellSize - 2, cellSize * 3 + 2, cellSize * 3 + 2);
    }
  });
  
  // 选中效果
  if (selectedX >= 0 && selectedY >= 0) {
    ctx.strokeStyle = '#FFD700';
    ctx.lineWidth = 3;
    ctx.strokeRect(selectedX * cellSize, selectedY * cellSize, cellSize * 2, cellSize * 2);
  }
  
  // 应用缩放
  applyMapZoom();
  
  // 绘制小地图
  renderMiniMap(fullMap);
}

// 应用缩放
function applyMapZoom() {
  const activeCanvas = currentMapMode === 'world' ? worldMapCanvas : viewMapCanvas;
  if (!activeCanvas) return;
  
  // 保留居中的transform，只添加缩放
  activeCanvas.style.transform = 'translate(-50%, -50%) scale(' + mapZoom + ')';
  activeCanvas.style.transformOrigin = 'center center';
}

// 修改缩放函数
function zoomMap(factor) {
  mapZoom *= factor;
  mapZoom = Math.max(0.25, Math.min(2, mapZoom));
  
  const zoomLevel = document.getElementById('zoomLevel');
  if (zoomLevel) zoomLevel.textContent = Math.round(mapZoom * 100) + '%';
  
  applyMapZoom();
}

function resetMapZoom() {
  mapZoom = 1;
  const zoomLevel = document.getElementById('zoomLevel');
  if (zoomLevel) zoomLevel.textContent = '100%';
  
  applyMapZoom();
}

// 小地图渲染函数
function renderMiniMap(fullMap) {
  const canvas = document.getElementById('miniMap');
  if (!canvas) return;
  
  const ctx = canvas.getContext('2d');
  const size = 100;
  const scale = size / fullMap.size;
  
  // 清空
  ctx.fillStyle = '#1a1a2e';
  ctx.fillRect(0, 0, canvas.width || size, canvas.height || size);
  
  // 绘制地形
  for (let y = 0; y < fullMap.size; y++) {
    for (let x = 0; x < fullMap.size; x++) {
      const terrainId = fullMap.terrain[y][x];
      ctx.fillStyle = TERRAIN_COLORS[terrainId] || '#ccc';
      ctx.fillRect(x * scale, y * scale, scale + 0.5, scale + 0.5);
    }
  }
  
  // 绘制NPC
  ctx.fillStyle = '#FF4500';
  fullMap.npcs.forEach(npc => {
    ctx.fillRect(npc.x * scale, npc.y * scale, scale * 2, scale * 2);
  });
  
  // 绘制城堡
  fullMap.castles.forEach(castle => {
    ctx.fillStyle = castle.isOwn ? '#8B4513' : '#4a4a4a';
    ctx.fillRect(castle.x * scale - 1, castle.y * scale - 1, scale * 3, scale * 3);
  });
  
  // 视野范围框
  const myCastle = fullMap.castles.find(c => c.isOwn);
  if (myCastle) {
    ctx.strokeStyle = '#FF0000';
    ctx.lineWidth = 1;
    const viewRadius = 10;
    ctx.strokeRect(
      (myCastle.x - viewRadius) * scale,
      (myCastle.y - viewRadius) * scale,
      viewRadius * 2 * scale,
      viewRadius * 2 * scale
    );
  }
}

// 小地图点击跳转
function initMiniMapClick() {
  const miniMap = document.getElementById('miniMap');
  if (!miniMap) return;
  
  miniMap.onclick = (e) => {
    if (!fullMapData) return;
    
    const rect = miniMap.getBoundingClientRect();
    const x = Math.floor(((e.clientX - rect.left) / rect.width) * fullMapData.size);
    const y = Math.floor(((e.clientY - rect.top) / rect.height) * fullMapData.size);
    
    // 切换到世界地图模式
    if (currentMapMode !== 'world') {
      currentMapMode = 'world';
      renderMap();
      
      // 更新按钮状态
      document.querySelectorAll('.map-mode-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.mode === 'world') btn.classList.add('active');
      });
    }
    
    // 滚动到点击位置（模拟居中）
    const mapContainer = document.getElementById('mapContainer');
    if (mapContainer && worldMapCanvas) {
      const cellSize = 8 * mapZoom;
      const scrollX = x * cellSize - mapContainer.clientWidth / 2;
      const scrollY = y * cellSize - mapContainer.clientHeight / 2;
      mapContainer.scrollTo({ left: Math.max(0, scrollX), top: Math.max(0, scrollY), behavior: 'smooth' });
    }
    
    // 显示点击的地块信息
    const terrainId = fullMapData.terrain[y][x];
    const npc = fullMapData.npcs.find(n => n.x === x && n.y === y);
    const castle = fullMapData.castles.find(c => c.x === x && c.y === y);
    
    const tileData = {
      x, y,
      terrain: {
        id: terrainId,
        name: TERRAIN_NAMES[terrainId] || terrainId,
        defenseBonus: terrainId === 'mountains' ? 25 : terrainId === 'hills' ? 15 : terrainId === 'forest' ? 10 : 0
      },
      npcs: npc ? [{
        name: npc.hasMerchant ? '商人商队' : '敌对势力',
        isNeutral: npc.hasMerchant,
        power: '???'
      }] : [],
      hasCastle: !!castle
    };
    showTileModal(tileData);
    renderFullMap(fullMapData, x, y);
  };
  
  miniMap.style.cursor = 'pointer';
}

// 在页面加载完成后初始化
setTimeout(() => {
  initMapCanvases();
  initMiniMapClick();
}, 500);
