

// ==================== 完整世界地图功能 ====================

// 设置地图模式
function setMapMode(mode) {
  currentMapMode = mode;
  
  // 更新按钮样式
  const viewBtn = document.getElementById('viewModeBtn');
  const worldBtn = document.getElementById('worldModeBtn');
  const zoomControls = document.getElementById('mapZoomControls');
  const miniMapContainer = document.getElementById('miniMapContainer');
  
  if (mode === 'view') {
    if (viewBtn) viewBtn.className = 'btn-primary';
    if (worldBtn) worldBtn.className = 'btn-secondary';
    if (zoomControls) zoomControls.style.display = 'none';
    if (miniMapContainer) miniMapContainer.style.display = 'none';
    if (socket && playerId) {
      socket.emit('map:getView', { playerId });
    }
  } else {
    if (viewBtn) viewBtn.className = 'btn-secondary';
    if (worldBtn) worldBtn.className = 'btn-primary';
    if (zoomControls) zoomControls.style.display = 'flex';
    if (miniMapContainer) miniMapContainer.style.display = 'flex';
    if (socket && playerId) {
      socket.emit('map:getFullMap', { playerId });
    }
  }
}

// 缩放地图
function zoomMap(factor) {
  mapZoom *= factor;
  mapZoom = Math.max(0.25, Math.min(2, mapZoom));
  
  const zoomLevel = document.getElementById('zoomLevel');
  if (zoomLevel) zoomLevel.textContent = Math.round(mapZoom * 100) + '%';
  
  const mapContainer = document.getElementById('worldMap');
  if (mapContainer) {
    mapContainer.style.transform = `scale(${mapZoom})`;
  }
}

// 重置地图视图
function resetMapView() {
  mapZoom = 1;
  const zoomLevel = document.getElementById('zoomLevel');
  if (zoomLevel) zoomLevel.textContent = '100%';
  const mapContainer = document.getElementById('worldMap');
  if (mapContainer) {
    mapContainer.style.transform = 'scale(1)';
  }
}

// 渲染地图入口
function renderMap(map) {
  if (currentMapMode === 'world' && fullMapData) {
    renderFullMap(fullMapData);
  } else {
    renderViewMap(map);
  }
}

// 渲染视野地图 (21x21)
function renderViewMap(map) {
  const container = document.getElementById('worldMap');
  if (!container || !map) return;
  
  container.style.gridTemplateColumns = 'repeat(21, 24px)';
  
  // 显示城堡信息
  const castleInfo = document.getElementById('castleInfo');
  const castlePos = document.getElementById('castlePos');
  if (castleInfo && castlePos && map.castle) {
    castleInfo.style.display = 'block';
    castlePos.textContent = `(${map.castle.x}, ${map.castle.y})`;
  }

  if (!map.area || map.area.length === 0) {
    container.innerHTML = '<p style="grid-column: 1 / -1; text-align: center; color: #888;">加载中...</p>';
    return;
  }

  container.innerHTML = '';
  map.area.sort((a, b) => { if (a.y !== b.y) return a.y - b.y; return a.x - b.x; });

  const terrainColors = { plains: '#90EE90', forest: '#228B22', hills: '#DAA520', mountains: '#808080', river: '#4169E1', lake: '#1E90FF', desert: '#FFD700', swamp: '#556B2F' };

  map.area.forEach(tile => {
    const cell = document.createElement('div');
    cell.style.cssText = 'width: 24px; height: 24px; border-radius: 3px; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 14px;';
    cell.style.background = terrainColors[tile.terrain.id] || '#ccc';
    if (tile.hasCastle) { cell.style.background = '#8B4513'; cell.textContent = '🏰'; cell.style.fontSize = '16px'; }
    else if (tile.npcs && tile.npcs.length > 0) { cell.textContent = tile.npcs[0].isNeutral ? '🏪' : '⚔️'; }
    cell.onclick = () => showTileInfo(tile);
    container.appendChild(cell);
  });
}

// 渲染完整世界地图
function renderFullMap(fullMap) {
  const container = document.getElementById('worldMap');
  if (!container || !fullMap) return;
  
  fullMapData = fullMap;
  
  const cellSize = 6;
  container.style.gridTemplateColumns = `repeat(${fullMap.size}, ${cellSize}px)`;
  
  const castleInfo = document.getElementById('castleInfo');
  const castlePos = document.getElementById('castlePos');
  const myCastle = fullMap.castles.find(c => c.isOwn);
  if (castleInfo && castlePos && myCastle) {
    castleInfo.style.display = 'block';
    castlePos.textContent = `(${myCastle.x}, ${myCastle.y})`;
  }

  container.innerHTML = '';

  const npcLookup = {};
  fullMap.npcs.forEach(npc => { npcLookup[`${npc.x},${npc.y}`] = npc; });
  
  const castleLookup = {};
  fullMap.castles.forEach(castle => { castleLookup[`${castle.x},${castle.y}`] = castle; });

  const terrainColors = { plains: '#90EE90', forest: '#228B22', hills: '#DAA520', mountains: '#808080', river: '#4169E1', lake: '#1E90FF', desert: '#FFD700', swamp: '#556B2F' };

  for (let y = 0; y < fullMap.size; y++) {
    for (let x = 0; x < fullMap.size; x++) {
      const terrainId = fullMap.terrain[y][x];
      const npc = npcLookup[`${x},${y}`];
      const castle = castleLookup[`${x},${y}`];
      
      const cell = document.createElement('div');
      cell.style.width = cellSize + 'px';
      cell.style.height = cellSize + 'px';
      cell.style.cursor = 'pointer';
      
      if (castle) {
        cell.style.background = castle.isOwn ? '#8B4513' : '#4a4a4a';
      } else if (npc) {
        cell.style.background = npc.hasMerchant ? '#9370DB' : '#FF4500';
      } else {
        cell.style.background = terrainColors[terrainId] || '#ccc';
      }
      
      cell.onclick = () => {
        const tileData = {
          x, y,
          terrain: { id: terrainId, name: getTerrainName(terrainId) },
          npcs: npc ? [{ name: npc.hasMerchant ? '商人商队' : '敌对势力', isNeutral: npc.hasMerchant }] : [],
          hasCastle: !!castle
        };
        showTileInfo(tileData);
      };
      
      container.appendChild(cell);
    }
  }
  
  renderMiniMap(fullMap);
}

// 获取地形中文名
function getTerrainName(terrainId) {
  const names = { plains: '平原', forest: '森林', hills: '丘陵', mountains: '山地', river: '河流', lake: '湖泊', desert: '沙漠', swamp: '沼泽' };
  return names[terrainId] || terrainId;
}

// 渲染小地图
function renderMiniMap(fullMap) {
  const canvas = document.getElementById('miniMap');
  if (!canvas) return;
  
  const ctx = canvas.getContext('2d');
  const size = 100;
  const scale = size / fullMap.size;
  
  ctx.fillStyle = '#1a1a2e';
  ctx.fillRect(0, 0, size, size);
  
  const terrainColors = { plains: '#90EE90', forest: '#228B22', hills: '#DAA520', mountains: '#808080', river: '#4169E1', lake: '#1E90FF', desert: '#FFD700', swamp: '#556B2F' };
  
  for (let y = 0; y < fullMap.size; y++) {
    for (let x = 0; x < fullMap.size; x++) {
      ctx.fillStyle = terrainColors[fullMap.terrain[y][x]] || '#ccc';
      ctx.fillRect(x * scale, y * scale, scale + 0.5, scale + 0.5);
    }
  }
  
  ctx.fillStyle = '#FF4500';
  fullMap.npcs.forEach(npc => {
    ctx.fillRect(npc.x * scale, npc.y * scale, scale * 2, scale * 2);
  });
  
  fullMap.castles.forEach(castle => {
    ctx.fillStyle = castle.isOwn ? '#8B4513' : '#4a4a4a';
    ctx.fillRect(castle.x * scale - 1, castle.y * scale - 1, scale * 3, scale * 3);
  });
  
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

// 地图相关socket事件
socket.on('map:fullMap', (data) => {
  console.log('Full map received:', data);
  fullMapData = data;
  if (currentMapMode === 'world') {
    renderFullMap(data);
  }
});

socket.on('map:miniMap', (data) => {
  console.log('Mini map received:', data);
});

socket.on('map:migrated', (data) => {
  showSuccess(`城堡迁移成功！新位置: (${data.newPosition.x}, ${data.newPosition.y})`);
  renderResources(data.resources);
});
