// client/src/main.js
/**
 * 《帝国崛起》H5 客户端 v0.3
 * 支持：资源、建筑、军队、战斗系统
 */

let socket = null;
let playerId = null;
let playerName = null;
let empireData = null;
let unitTypesData = null;
let lastBattleResult = null;

// 生成唯一玩家ID
function generateId() {
  return 'player_' + Math.random().toString(36).substr(2, 9);
}

// 连接服务器
function connect() {
  const serverUrl = document.getElementById('serverUrl').value || window.location.origin;
  playerName = document.getElementById('playerName').value || '无名玩家';
  playerId = generateId();

  updateStatus('connecting', '正在连接...');

  socket = io(serverUrl);

  socket.on('connect', () => {
    console.log('✅ Connected to server');
    updateStatus('connected', '已连接');
    
    socket.emit('empire:connect', { playerId, playerName });
    socket.emit('army:getUnitTypes');
  });

  socket.on('disconnect', () => {
    console.log('❌ Disconnected from server');
    updateStatus('disconnected', '连接断开');
  });

  socket.on('error', (err) => {
    console.error('Server error:', err);
    alert('错误: ' + err.message);
  });

  // 接收帝国初始数据
  socket.on('empire:init', (data) => {
    console.log('Empire initialized:', data);
    empireData = data;
    showGameUI();
    renderResources(data.resources);
    renderBuildings(data.buildings);
    renderArmy(data.army, data.maxArmySize);
    updateMyBattleInfo(data.army);
  });

  // 资源更新
  socket.on('resource:update', (data) => {
    if (data.allResources) {
      renderResources(data.allResources);
    }
  });

  // 建筑更新
  socket.on('building:update', (data) => {
    if (data.buildings) {
      renderBuildings(data.buildings);
    }
    if (data.resources) {
      renderResources(data.resources);
    }
  });

  // ==================== 军队系统事件 ====================
  
  socket.on('army:unitTypes', (data) => {
    unitTypesData = data;
    console.log('Unit types loaded:', data);
  });

  socket.on('army:trainingPreview', (data) => {
    renderTrainingPreview(data);
  });

  socket.on('army:trainStarted', (data) => {
    console.log('Training started:', data);
    renderResources(data.resources);
    updateTrainingQueue(data.queue);
    alert(`开始训练! 预计${Math.ceil(data.task.duration / 1000)}秒完成`);
  });

  socket.on('army:trainingCompleted', (data) => {
    console.log('Training completed:', data);
    renderArmy(data.army);
    alert(`${data.task.count}名士兵训练完成!`);
  });

  socket.on('army:update', (data) => {
    renderArmy(data);
    updateMyBattleInfo(data);
  });

  socket.on('army:moraleWarning', (data) => {
    console.warn('Morale warning:', data);
    document.getElementById('moraleValue').style.color = '#f44336';
  });

  socket.on('army:status', (data) => {
    renderArmy(data.army, data.maxArmySize);
    renderFormations(data.formations);
    updateMyBattleInfo(data.army);
  });

  // ==================== 战斗系统事件 ====================
  
  socket.on('battle:availableNpcs', (data) => {
    console.log('Available NPCs:', data);
    renderNpcList(data);
  });

  socket.on('battle:started', (data) => {
    console.log('Battle started:', data);
    alert(`战斗开始！对阵 ${data.npc.name} (战力:${data.npc.power})`);
  });

  socket.on('battle:finished', (data) => {
    console.log('Battle finished:', data);
    lastBattleResult = data;
    showBattleResult(data);
  });

  socket.on('battle:status', (data) => {
    console.log('Battle status:', data);
  });
}

// 更新连接状态
function updateStatus(status, text) {
  const el = document.getElementById('connectionStatus');
  el.className = 'status ' + status;
  el.textContent = text;
}

// 显示游戏界面
function showGameUI() {
  document.getElementById('connectPanel').style.display = 'none';
  document.getElementById('gameUI').style.display = 'block';
}

// 切换标签页
function switchTab(tabName) {
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
  
  event.target.classList.add('active');
  document.getElementById(tabName + 'Tab').classList.add('active');
  
  if (tabName === 'army' && socket && playerId) {
    socket.emit('army:getStatus', { playerId });
  }
  
  if (tabName === 'battle' && socket && playerId) {
    loadNpcList();
    socket.emit('army:getStatus', { playerId });
  }
}

// 渲染资源
function renderResources(resources) {
  const container = document.getElementById('resources');
  container.innerHTML = '';

  const resourceNames = {
    wood: '木材 🌲', stone: '石材 🪨', food: '粮食 🌾',
    iron: '铁矿 ⛏️', crystal: '水晶 💎', gold: '金币 🪙'
  };

  for (const [id, data] of Object.entries(resources)) {
    const card = document.createElement('div');
    card.className = 'resource-card';
    card.innerHTML = `
      <div class="resource-name">${resourceNames[id] || id}</div>
      <div class="resource-value">${Math.floor(data.amount)}</div>
      <div class="resource-max">上限: ${Math.floor(data.max)}</div>
    `;
    container.appendChild(card);
  }
}

// 渲染建筑
function renderBuildings(buildings) {
  const container = document.getElementById('buildings');
  if (Object.keys(buildings).length === 0) {
    container.innerHTML = '<p style="text-align:center;color:#888;">暂无建筑</p>';
    return;
  }

  container.innerHTML = '';
  const names = {
    warehouse_basic: '基础仓库', warehouse_special: '特殊仓库',
    lumber_mill: '伐木场', farm: '农场', barracks: '兵营'
  };

  for (const [id, data] of Object.entries(buildings)) {
    const item = document.createElement('div');
    item.className = 'unit-card';
    item.innerHTML = `
      <h4>${names[id] || id} - Lv.${data.level}</h4>
      <p style="color:#888;">最高等级: ${data.maxLevel}</p>
    `;
    container.appendChild(item);
  }
}

// ==================== 军队系统渲染 ====================

function renderArmy(army, maxSize) {
  if (!army) return;
  
  document.getElementById('totalUnits').textContent = army.totalUnits || 0;
  document.getElementById('maxUnits').textContent = maxSize || 50;
  document.getElementById('foodConsumption').textContent = army.foodConsumption || 0;
  
  const morale = army.morale || 100;
  document.getElementById('moraleValue').textContent = morale;
  
  const moraleBar = document.getElementById('moraleBar');
  moraleBar.style.width = morale + '%';
  moraleBar.className = 'morale-fill ' + (morale >= 80 ? 'morale-high' : morale >= 50 ? 'morale-medium' : 'morale-low');
  
  const effect = army.moraleMultiplier >= 1.2 ? '+20%' : army.moraleMultiplier >= 1.1 ? '+10%' : army.moraleMultiplier >= 1.0 ? '正常' : army.moraleMultiplier >= 0.8 ? '-20%' : '-40%';
  document.getElementById('moraleEffect').textContent = effect;
  
  if (army.trainingQueue > 0) {
    document.getElementById('trainingQueue').style.display = 'block';
  }
}

function renderFormations(formations) {
  const container = document.getElementById('formations');
  if (!formations || formations.length === 0) {
    container.innerHTML = '<p style="text-align:center;color:#888;">暂无编队信息</p>';
    return;
  }
  
  container.innerHTML = '';
  for (const f of formations) {
    const div = document.createElement('div');
    div.className = 'formation-card';
    
    let unitsText = '';
    for (const [unitId, count] of Object.entries(f.units)) {
      const unitName = unitTypesData?.[unitId.toUpperCase()]?.name || unitId;
      unitsText += `${unitName}: ${count} `;
    }
    
    div.innerHTML = `
      <h4>${f.name} (战力: ${f.power})</h4>
      <p>${unitsText || '无士兵'}</p>
    `;
    container.appendChild(div);
  }
}

function renderTrainingPreview(data) {
  const preview = data.preview;
  if (!preview) return;
  
  const div = document.getElementById('trainingPreview');
  
  let costText = '';
  for (const [res, amount] of Object.entries(preview.cost)) {
    costText += `${res}: ${amount} `;
  }
  
  div.innerHTML = `
    <div class="unit-card">
      <h4>训练预览: ${preview.unitName} × ${preview.count}</h4>
      <p>消耗: ${costText}</p>
      <p>时间: ${preview.durationFormatted}</p>
      <p>当前兵力: ${data.currentArmySize}/${data.maxArmySize}</p>
      ${!data.canTrain ? '<p style="color:#f44336;">⚠️ 超过军队上限!</p>' : ''}
    </div>
  `;
}

function updateTrainingQueue(queue) {
  const div = document.getElementById('trainingQueue');
  const list = document.getElementById('queueList');
  
  if (!queue || queue.length === 0) {
    div.style.display = 'none';
    return;
  }
  
  div.style.display = 'block';
  list.innerHTML = '';
  
  for (const task of queue) {
    const unitName = unitTypesData?.[task.unitTypeId.toUpperCase()]?.name || task.unitTypeId;
    const remaining = Math.max(0, Math.ceil((task.startTime + task.duration - Date.now()) / 1000));
    
    const item = document.createElement('div');
    item.innerHTML = `${unitName} × ${task.count} - 剩余${remaining}秒`;
    list.appendChild(item);
  }
}

// ==================== 战斗系统 ====================

function updateMyBattleInfo(army) {
  if (!army) return;
  
  // 计算总战力
  let power = 0;
  if (army.formations && army.formations.default) {
    const formation = army.formations.default;
    for (const [unitId, count] of Object.entries(formation.units || {})) {
      // 简化战力计算
      power += count * 20;
    }
  }
  
  document.getElementById('myPower').textContent = power;
  
  // 军队状态
  const statusMap = {
    idle: '空闲',
    fighting: '战斗中',
    marching: '行军中',
    recovering: '恢复中'
  };
  document.getElementById('armyStatus').textContent = statusMap[army.status] || army.status;
}

function loadNpcList() {
  if (!socket || !playerId) {
    alert('请先连接服务器');
    return;
  }
  
  socket.emit('battle:getAvailableNpcs', { playerId });
}

function renderNpcList(npcs) {
  const container = document.getElementById('npcList');
  container.innerHTML = '';
  
  const categoryNames = {
    wild: '野生怪物',
    outpost: 'NPC据点',
    city: 'NPC城邦'
  };
  
  const difficultyNames = {
    easy: '简单',
    medium: '中等',
    hard: '困难',
    extreme: '极难'
  };
  
  for (const npc of npcs) {
    const card = document.createElement('div');
    card.className = `npc-card ${npc.difficulty} ${npc.recommended ? 'recommended' : ''}`;
    
    card.innerHTML = `
      <h4>
        ${npc.name} (Lv.${npc.level})
        <span class="difficulty-badge difficulty-${npc.difficulty}">${difficultyNames[npc.difficulty]}</span>
        ${npc.recommended ? '<span class="difficulty-badge" style="background:#4CAF50;">推荐</span>' : ''}
      </h4>
      <p>类型: ${categoryNames[npc.category]}</p>
      <p>战力: ${npc.power}</p>
      <button class="btn-danger" onclick="startBattle('${npc.id}')" ${!npc.recommended ? 'disabled' : ''}>
        发起攻击
      </button>
    `;
    
    container.appendChild(card);
  }
}

function startBattle(npcTypeId) {
  if (!socket || !playerId) {
    alert('请先连接服务器');
    return;
  }
  
  if (!confirm('确定要发起攻击吗？战斗中可能有士兵伤亡！')) {
    return;
  }
  
  socket.emit('battle:start', { playerId, npcTypeId, formationId: 'default' });
}

function showBattleResult(data) {
  const panel = document.getElementById('battleResultPanel');
  const resultDiv = document.getElementById('battleResult');
  const logDiv = document.getElementById('battleLog');
  
  panel.style.display = 'block';
  
  const result = data.result;
  const isVictory = result.winner === 'attacker';
  
  // 战斗结果摘要
  let lootText = '';
  if (result.loot) {
    lootText = '<h4>战利品:</h4><ul>';
    for (const [res, amount] of Object.entries(result.loot)) {
      lootText += `<li>${res}: +${amount}</li>`;
    }
    lootText += '</ul>';
  }
  
  let casualtiesText = '<h4>伤亡情况:</h4><ul>';
  for (const [unit, count] of Object.entries(result.casualties.attacker)) {
    if (count > 0) {
      casualtiesText += `<li>${unit}: ${count}人阵亡</li>`;
    }
  }
  casualtiesText += '</ul>';
  
  resultDiv.innerHTML = `
    <div class="${isVictory ? 'victory' : 'defeat'}">
      ${isVictory ? '🎉 胜利！' : '💀 战败...'}
    </div>
    <p>战斗回合: ${result.totalRounds}</p>
    <p>剩余HP: ${result.attackerHp.current}/${result.attackerHp.total}</p>
    ${isVictory ? `<p>获得经验: ${result.exp || 0}</p>` : ''}
    ${isVictory && result.drops && result.drops.length > 0 ? `<p>掉落物品: ${result.drops.join(', ')}</p>` : ''}
    ${isVictory ? lootText : ''}
    ${casualtiesText}
  `;
  
  // 战斗日志
  logDiv.innerHTML = '';
  if (result.battleLog) {
    for (const log of result.battleLog) {
      const entry = document.createElement('div');
      entry.className = 'log-entry ' + log.type;
      entry.textContent = `[${new Date(log.timestamp).toLocaleTimeString()}] ${log.message}`;
      logDiv.appendChild(entry);
    }
  }
  
  // 更新资源和军队显示
  if (data.resources) {
    renderResources(data.resources);
  }
  if (data.army) {
    renderArmy(data.army);
    updateMyBattleInfo(data.army);
  }
  
  // 滚动到结果面板
  panel.scrollIntoView({ behavior: 'smooth' });
}

function closeBattleResult() {
  document.getElementById('battleResultPanel').style.display = 'none';
}

function viewLastBattleDetail() {
  if (!lastBattleResult) {
    alert('暂无战斗记录');
    return;
  }
  showBattleResult(lastBattleResult);
}

// ==================== 交互功能 ====================

function collect(resourceType, amount) {
  if (!socket || !playerId) {
    alert('请先连接服务器');
    return;
  }
  socket.emit('resource:collect', { playerId, resourceType, amount });
}

function upgradeBuilding(buildingTypeId) {
  if (!socket || !playerId) {
    alert('请先连接服务器');
    return;
  }

  const costs = {
    warehouse_basic: { wood: 200, stone: 100 },
    farm: { wood: 150, food: 50 },
    lumber_mill: { wood: 100, stone: 50 },
    barracks: { wood: 300, stone: 150, food: 100 }
  };

  const cost = costs[buildingTypeId];
  if (!cost) {
    alert('未知的建筑类型');
    return;
  }

  socket.emit('building:upgrade', { playerId, buildingTypeId, cost });
}

function previewTraining() {
  if (!socket || !playerId) {
    alert('请先连接服务器');
    return;
  }
  
  const unitTypeId = document.getElementById('trainUnitType').value;
  const count = parseInt(document.getElementById('trainCount').value);
  
  socket.emit('army:trainingPreview', { playerId, unitTypeId, count });
}

function startTraining() {
  if (!socket || !playerId) {
    alert('请先连接服务器');
    return;
  }
  
  const unitTypeId = document.getElementById('trainUnitType').value;
  const count = parseInt(document.getElementById('trainCount').value);
  
  socket.emit('army:train', { playerId, unitTypeId, count });
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
  console.log('🎮 Empire Rise Client v0.3 initialized');
});