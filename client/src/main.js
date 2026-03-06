

// ==================== 世界地图功能 ====================

// 切换标签页
function switchTab(tabName) {
  // 更新标签按钮样式
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  event.target.classList.add('active');
  
  // 隐藏所有标签内容
  document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
  
  // 显示当前标签内容
  const tabContent = document.getElementById(tabName + 'Tab');
  if (tabContent) tabContent.classList.add('active');
  
  // 特定标签的初始化
  if (tabName === 'map' && socket && playerId) {
    socket.emit('map:getView', { playerId });
  }
}

// 设置地图模式
function setMapMode(mode) {
  currentMapMode = mode;
  
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

// 显示地块信息
function showTileInfo(tile) {
  const info = document.getElementById('tileInfo');
  if (!info) return;

  let npcHtml = '';
  if (tile.npcs && tile.npcs.length > 0) {
    npcHtml = '<p><strong>单位:</strong></p><ul style="list-style: none; padding: 0;">';
    tile.npcs.forEach((npc, index) => {
      npcHtml += `
        <li style="margin: 5px 0; padding: 5px; background: rgba(0,0,0,0.3); border-radius: 4px;">
          ${npc.isNeutral ? '🏪' : '⚔️'} ${npc.name} ${npc.power ? `(战力: ${npc.power})` : ''}
          ${!npc.isNeutral ? `<button onclick="attackMapNpc(${tile.x}, ${tile.y}, ${index})" style="margin-left: 10px; padding: 2px 8px; font-size: 12px;">攻击</button>` : ''}
          ${npc.isNeutral ? `<button onclick="tradeWithNpc(${tile.x}, ${tile.y}, ${index})" style="margin-left: 10px; padding: 2px 8px; font-size: 12px;">交易</button>` : ''}
        </li>
      `;
    });
    npcHtml += '</ul>';
  }

  info.innerHTML = `
    <p><strong>位置:</strong> (${tile.x}, ${tile.y})</p>
    <p><strong>地形:</strong> ${tile.terrain.name || tile.terrain.id}</p>
    ${tile.terrain.defenseBonus !== 0 ? `<p><strong>防御加成:</strong> ${tile.terrain.defenseBonus > 0 ? '+' : ''}${tile.terrain.defenseBonus}%</p>` : ''}
    ${tile.hasCastle ? '<p style="color: #ffd700;">🏰 这里有一座城堡</p>' : ''}
    ${npcHtml}
    ${!tile.hasCastle && !tile.npcs?.length ? `<button onclick="migrateCastleTo(${tile.x}, ${tile.y})" style="margin-top: 10px;">迁移城堡至此</button>` : ''}
  `;
}

// 攻击地图上的NPC
function attackMapNpc(x, y, npcIndex) {
  if (!socket || !playerId) {
    showError('请先连接服务器');
    return;
  }
  socket.emit('map:attackNPC', { playerId, x, y, npcIndex });
}

// 与NPC交易
function tradeWithNpc(x, y, npcIndex) {
  if (!socket || !playerId) {
    showError('请先连接服务器');
    return;
  }
  socket.emit('map:trade', { playerId, x, y, npcIndex });
}

// 显示交易选项
function showTradeOptions(data) {
  const info = document.getElementById('tileInfo');
  if (!info) return;

  let offersHtml = '<p><strong>交易选项:</strong></p><ul style="list-style: none; padding: 0;">';
  data.offers.forEach((offer, index) => {
    const giveText = Object.entries(offer.give).map(([res, amount]) => `${getResourceName(res)} x${amount}`).join(', ');
    const getText = Object.entries(offer.get).map(([res, amount]) => `${getResourceName(res)} x${amount}`).join(', ');
    offersHtml += `
      <li style="margin: 10px 0; padding: 10px; background: rgba(0,0,0,0.3); border-radius: 4px; display: flex; justify-content: space-between; align-items: center;">
        <span>给出: ${giveText} → 获得: ${getText}</span>
        <button onclick="executeTrade(${index})" style="padding: 2px 8px; font-size: 12px;">交易</button>
      </li>
    `;
  });
  offersHtml += '</ul>';

  info.innerHTML = `
    <p><strong>🏪 ${data.merchant}</strong></p>
    ${offersHtml}
  `;
}

// 获取资源中文名称
function getResourceName(resId) {
  const names = {
    wood: '木材', stone: '石材', food: '粮食', iron: '铁矿',
    crystal: '水晶', gold: '金币', fish_product: '鱼产品',
    fruit: '水果', premium_food: '精品食材'
  };
  return names[resId] || resId;
}

// 执行交易
function executeTrade(offerIndex) {
  showInfo('交易功能开发中...');
}

// 迁移城堡
function migrateCastleTo(x, y) {
  if (!socket || !playerId) {
    showError('请先连接服务器');
    return;
  }
  if (confirm(`确定要迁移城堡到 (${x}, ${y}) 吗？需要消耗大量资源。`)) {
    socket.emit('map:migrateCastle', { playerId, targetX: x, targetY: y });
  }
}
