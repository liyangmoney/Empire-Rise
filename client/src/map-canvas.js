// ============================================
// 地图渲染函数 - Canvas 版本 (简化版)
// ============================================

const TERRAIN_COLORS = {
  plains: '#90EE90',
  forest: '#228B22', 
  hills: '#DAA520',
  mountains: '#808080',
  river: '#4169E1',
  lake: '#1E90FF',
  desert: '#F4A460',
  swamp: '#556B2F'
};

let viewMapCanvas = null;
let worldMapCanvas = null;
let currentViewMapData = null;

function initMapCanvases() {
  const container = document.getElementById('worldMap');
  if (!container) return;
  if (viewMapCanvas) return;
  
  container.innerHTML = '';
  container.style.display = 'flex';
  container.style.justifyContent = 'center';
  container.style.alignItems = 'center';
  container.style.overflow = 'auto';
  
  // 视野地图
  viewMapCanvas = document.createElement('canvas');
  viewMapCanvas.width = 588;
  viewMapCanvas.height = 588;
  viewMapCanvas.style.display = 'none';
  viewMapCanvas.style.cursor = 'pointer';
  container.appendChild(viewMapCanvas);
  
  viewMapCanvas.onclick = function(e) {
    const rect = viewMapCanvas.getBoundingClientRect();
    const scaleX = 588 / rect.width;
    const x = Math.floor(((e.clientX - rect.left) * scaleX) / 28);
    const y = Math.floor(((e.clientY - rect.top) * scaleX) / 28);
    
    if (currentViewMapData && currentViewMapData.area) {
      const tile = currentViewMapData.area.find(function(t) {
        const relX = t.x - currentViewMapData.castle.x + 10;
        const relY = t.y - currentViewMapData.castle.y + 10;
        return relX === x && relY === y;
      });
      if (tile) showTileModal(tile);
    }
  };
  
  // 世界地图
  worldMapCanvas = document.createElement('canvas');
  worldMapCanvas.width = 800;
  worldMapCanvas.height = 800;
  worldMapCanvas.style.display = 'none';
  worldMapCanvas.style.cursor = 'pointer';
  container.appendChild(worldMapCanvas);
  
  worldMapCanvas.onclick = function(e) {
    const rect = worldMapCanvas.getBoundingClientRect();
    const scale = 800 / rect.width;
    const x = Math.floor(((e.clientX - rect.left) * scale) / 8);
    const y = Math.floor(((e.clientY - rect.top) * scale) / 8);
    
    if (fullMapData && x >= 0 && x < 100 && y >= 0 && y < 100) {
      const terrainId = fullMapData.terrain[y][x];
      const npc = fullMapData.npcs.find(function(n) { return n.x === x && n.y === y; });
      const castle = fullMapData.castles.find(function(c) { return c.x === x && c.y === y; });
      
      showTileModal({
        x: x, y: y,
        terrain: { id: terrainId, name: TERRAIN_NAMES[terrainId] || terrainId },
        npcs: npc ? [{ name: npc.hasMerchant ? '商人' : '敌人', isNeutral: npc.hasMerchant }] : [],
        hasCastle: !!castle
      });
    }
  };
}

function renderMap(map) {
  if (!viewMapCanvas) initMapCanvases();
  if (currentMapMode === 'world' && fullMapData) {
    renderFullMap(fullMapData);
  } else {
    renderViewMap(map);
  }
}

function renderViewMap(map) {
  if (!viewMapCanvas || !map) return;
  currentViewMapData = map;
  
  viewMapCanvas.style.display = 'block';
  if (worldMapCanvas) worldMapCanvas.style.display = 'none';
  
  const ctx = viewMapCanvas.getContext('2d');
  ctx.fillStyle = '#1a1a2e';
  ctx.fillRect(0, 0, 588, 588);
  
  if (!map.area || !map.area.length) {
    ctx.fillStyle = '#888';
    ctx.font = '16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('加载中...', 294, 294);
    return;
  }
  
  // 更新城堡信息
  const castleInfo = document.getElementById('castleInfo');
  const castlePos = document.getElementById('castlePos');
  if (castleInfo && castlePos && map.castle) {
    castleInfo.style.display = 'block';
    castlePos.textContent = '(' + map.castle.x + ', ' + map.castle.y + ')';
  }
  
  // 绘制每个格子
  map.area.forEach(function(tile) {
    const relX = tile.x - map.castle.x + 10;
    const relY = tile.y - map.castle.y + 10;
    const px = relX * 28;
    const py = relY * 28;
    
    ctx.fillStyle = TERRAIN_COLORS[tile.terrain.id] || '#ccc';
    ctx.fillRect(px, py, 27, 27);
    
    if (tile.hasCastle) {
      ctx.fillStyle = '#8B4513';
      ctx.fillRect(px + 2, py + 2, 23, 23);
      ctx.font = '20px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('🏰', px + 14, py + 20);
    } else if (tile.npcs && tile.npcs.length) {
      ctx.font = '18px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(tile.npcs[0].isNeutral ? '🏪' : '⚔️', px + 14, py + 20);
    }
  });
  
  applyMapZoom();
}

function renderFullMap(fullMap) {
  if (!worldMapCanvas || !fullMap) return;
  fullMapData = fullMap;
  
  worldMapCanvas.style.display = 'block';
  if (viewMapCanvas) viewMapCanvas.style.display = 'none';
  
  const ctx = worldMapCanvas.getContext('2d');
  ctx.fillStyle = '#1a1a2e';
  ctx.fillRect(0, 0, 800, 800);
  
  // 绘制地形
  for (let y = 0; y < 100; y++) {
    for (let x = 0; x < 100; x++) {
      const terrainId = fullMap.terrain[y][x];
      ctx.fillStyle = TERRAIN_COLORS[terrainId] || '#ccc';
      ctx.fillRect(x * 8, y * 8, 8, 8);
    }
  }
  
  // 绘制NPC
  fullMap.npcs.forEach(function(npc) {
    ctx.fillStyle = npc.hasMerchant ? '#9370DB' : '#FF4500';
    ctx.fillRect(npc.x * 8, npc.y * 8, 12, 12);
  });
  
  // 绘制城堡
  fullMap.castles.forEach(function(castle) {
    ctx.fillStyle = castle.isOwn ? '#FFD700' : '#666';
    ctx.fillRect(castle.x * 8 - 2, castle.y * 8 - 2, 16, 16);
  });
  
  // 更新城堡信息
  const myCastle = fullMap.castles.find(function(c) { return c.isOwn; });
  const castleInfo = document.getElementById('castleInfo');
  const castlePos = document.getElementById('castlePos');
  if (castleInfo && castlePos && myCastle) {
    castleInfo.style.display = 'block';
    castlePos.textContent = '(' + myCastle.x + ', ' + myCastle.y + ')';
  }
  
  applyMapZoom();
  renderMiniMap(fullMap);
}

function renderMiniMap(fullMap) {
  const canvas = document.getElementById('miniMap');
  if (!canvas) return;
  
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#1a1a2e';
  ctx.fillRect(0, 0, 100, 100);
  
  for (let y = 0; y < 100; y++) {
    for (let x = 0; x < 100; x++) {
      ctx.fillStyle = TERRAIN_COLORS[fullMap.terrain[y][x]] || '#ccc';
      ctx.fillRect(x, y, 1, 1);
    }
  }
  
  ctx.fillStyle = '#FF4500';
  fullMap.npcs.forEach(function(npc) {
    ctx.fillRect(npc.x, npc.y, 2, 2);
  });
  
  fullMap.castles.forEach(function(castle) {
    ctx.fillStyle = castle.isOwn ? '#FFD700' : '#666';
    ctx.fillRect(castle.x - 1, castle.y - 1, 3, 3);
  });
}

function applyMapZoom() {
  const canvas = currentMapMode === 'world' ? worldMapCanvas : viewMapCanvas;
  if (canvas) {
    canvas.style.transform = 'scale(' + mapZoom + ')';
  }
}

function zoomMap(factor) {
  mapZoom *= factor;
  mapZoom = Math.max(0.25, Math.min(2, mapZoom));
  var el = document.getElementById('zoomLevel');
  if (el) el.textContent = Math.round(mapZoom * 100) + '%';
  applyMapZoom();
}

function resetMapZoom() {
  mapZoom = 1;
  var el = document.getElementById('zoomLevel');
  if (el) el.textContent = '100%';
  applyMapZoom();
}

// 兼容HTML中的函数名
function resetMapView() {
  resetMapZoom();
}

function initMiniMapClick() {
  var miniMap = document.getElementById('miniMap');
  if (!miniMap) return;
  
  miniMap.onclick = function(e) {
    if (!fullMapData) return;
    var rect = miniMap.getBoundingClientRect();
    var x = Math.floor(((e.clientX - rect.left) / rect.width) * 100);
    var y = Math.floor(((e.clientY - rect.top) / rect.height) * 100);
    
    // 切换到世界地图
    if (currentMapMode !== 'world') {
      currentMapMode = 'world';
      renderMap();
    }
    
    // 滚动到位置
    var container = document.getElementById('mapContainer');
    if (container) {
      container.scrollTo({
        left: x * 8 * mapZoom - container.clientWidth / 2,
        top: y * 8 * mapZoom - container.clientHeight / 2
      });
    }
  };
}

setTimeout(function() {
  initMapCanvases();
  initMiniMapClick();
}, 300);
