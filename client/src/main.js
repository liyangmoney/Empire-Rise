// client/src/main.js
/**
 * 《帝国崛起》H5 客户端
 * 连接 Socket.io 服务端，实时显示资源/建筑状态
 */

let socket = null;
let playerId = null;
let playerName = null;
let empireData = null;

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
    
    // 发送连接请求
    socket.emit('empire:connect', { playerId, playerName });
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
  });

  // 资源更新
  socket.on('resource:update', (data) => {
    console.log('Resource update:', data);
    if (data.allResources) {
      renderResources(data.allResources);
    }
  });

  // 建筑更新
  socket.on('building:update', (data) => {
    console.log('Building update:', data);
    if (data.buildings) {
      renderBuildings(data.buildings);
    }
    if (data.resources) {
      renderResources(data.resources);
    }
  });
}

// 更新连接状态显示
function updateStatus(status, text) {
  const el = document.getElementById('connectionStatus');
  el.className = 'status ' + status;
  el.textContent = text;
}

// 显示游戏界面
function showGameUI() {
  document.getElementById('connectPanel').style.display = 'none';
  document.getElementById('resourcePanel').style.display = 'block';
  document.getElementById('buildingPanel').style.display = 'block';
}

// 渲染资源面板
function renderResources(resources) {
  const container = document.getElementById('resources');
  container.innerHTML = '';

  const resourceNames = {
    wood: '木材 🌲',
    stone: '石材 🪨',
    food: '粮食 🌾',
    iron: '铁矿 ⛏️',
    crystal: '水晶 💎',
    gold: '金币 🪙'
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

// 渲染建筑面板
function renderBuildings(buildings) {
  const container = document.getElementById('buildings');
  if (Object.keys(buildings).length === 0) {
    container.innerHTML = '<p style="text-align:center;color:#888;">暂无建筑</p>';
    return;
  }

  container.innerHTML = '';
  const buildingNames = {
    warehouse_basic: '基础仓库',
    warehouse_special: '特殊仓库',
    lumber_mill: '伐木场',
    farm: '农场',
    barracks: '兵营'
  };

  for (const [id, data] of Object.entries(buildings)) {
    const item = document.createElement('div');
    item.className = 'building-item';
    item.innerHTML = `
      <span>${buildingNames[id] || id}</span>
      <span>等级 ${data.level}/${data.maxLevel}</span>
    `;
    container.appendChild(item);
  }
}

// 采集资源
function collect(resourceType, amount) {
  if (!socket || !playerId) {
    alert('请先连接服务器');
    return;
  }
  socket.emit('resource:collect', { playerId, resourceType, amount });
}

// 升级建筑
function upgradeBuilding(buildingTypeId) {
  if (!socket || !playerId) {
    alert('请先连接服务器');
    return;
  }

  // 定义升级成本（简化版）
  const costs = {
    warehouse_basic: { wood: 200, stone: 100 },
    farm: { wood: 150, food: 50 },
    lumber_mill: { wood: 100, stone: 50 }
  };

  const cost = costs[buildingTypeId];
  if (!cost) {
    alert('未知的建筑类型');
    return;
  }

  socket.emit('building:upgrade', { playerId, buildingTypeId, cost });
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
  console.log('🎮 Empire Rise Client initialized');
});