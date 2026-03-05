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
let generalsData = null; // 将领数据
let generalTemplates = null; // 将领模板
let selectedGeneralId = null; // 当前选择的将领
let currentTimeData = null; // 时间数据
let timeUpdateInterval = null; // 时间更新定时器

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
    updateConnectionStatus(true);
    
    socket.emit('empire:connect', { playerId, playerName });
    socket.emit('army:getUnitTypes');
  });

  // 通用成功提示
  socket.on('success', (data) => {
    showSuccess(data.message);
  });

  // 通用错误提示  
  socket.on('error', (data) => {
    showError(data.message);
  });

  socket.on('disconnect', () => {
    console.log('❌ Disconnected from server');
    updateStatus('disconnected', '连接断开');
    updateConnectionStatus(false);
    // 停止时间更新
    stopTimeUpdateInterval();
  });

  socket.on('error', (err) => {
    console.error('Server error:', err);
    showErrorModal('操作失败', err.message || '服务器错误');
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
    
    // 将领数据
    if (data.generals) {
      generalsData = data.generals;
      renderGenerals(data.generals);
      updateGeneralSelect(data.generals);
    }
    
    // 时间数据
    if (data.time) {
      updateTimeDisplay(data.time);
      // 启动时间自动更新定时器
      startTimeUpdateInterval();
    }
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
    showSuccess(`开始训练! 预计${Math.ceil(data.task.duration / 1000)}秒完成`);
  });

  socket.on('army:trainingCompleted', (data) => {
    console.log('Training completed:', data);
    renderArmy(data.army);
    showSuccess(`${data.task.count}名士兵训练完成!`);
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

  // ==================== 将领系统事件 ====================
  
  socket.on('general:list', (data) => {
    console.log('Generals list:', data);
    generalsData = data.generals;
    generalTemplates = data.templates;
    renderGenerals(data.generals);
    renderGeneralTemplates(data.templates);
    updateGeneralSelect(data.generals);
  });

  socket.on('general:recruited', (data) => {
    console.log('General recruited:', data);
    showRecruitResult(data);
    renderResources(data.resources);
    // 刷新将领列表
    socket.emit('general:getList', { playerId });
  });

  socket.on('general:assigned', (data) => {
    console.log('General assigned:', data);
    showSuccess('将领分配成功！');
    generalsData = data.generals;
    renderGenerals(data.generals);
    updateGeneralSelect(data.generals);
  });

  socket.on('general:recruitConfig', (data) => {
    console.log('Recruit config:', data);
    renderRecruitOptions(data);
  });
  
  socket.on('battle:availableNpcs', (data) => {
    console.log('Available NPCs:', data);
    renderNpcList(data);
  });

  socket.on('battle:started', (data) => {
    console.log('Battle started:', data);
    showInfo(`战斗开始！对阵 ${data.npc.name} (战力:${data.npc.power})`);
  });

  socket.on('battle:finished', (data) => {
    console.log('Battle finished:', data);
    lastBattleResult = data;
    showBattleResult(data);
  });

  socket.on('battle:status', (data) => {
    console.log('Battle status:', data);
  });

  // 任务系统事件监听
  socket.on('task:list', (data) => {
    console.log('Tasks:', data);
    tasksData = data;
    renderTasks(data);
  });

  socket.on('task:rewardClaimed', (data) => {
    showSuccess('任务奖励领取成功！');
    renderResources(data.resources);
    renderTasks(data.tasks);
  });

  // 监听升级预览
  socket.on('building:upgradePreview', (preview) => {
    if (!preview) {
      showError('该建筑无法升级');
      return;
    }

    const buildingNames = {
      warehouse_basic: '基础仓库',
      farm: '农场',
      lumber_mill: '伐木场',
      quarry: '采石场',
      iron_mine: '铁矿场',
      crystal_mine: '水晶矿',
      barracks: '兵营',
      hospital: '医院',
      wall: '城墙',
      tower: '箭塔',
      house: '民居',
      imperial_palace: '皇宫',
      general_camp: '将领营',
      tech_institute: '科技院'
    };

    const durationText = preview.duration < 60
      ? `${preview.duration}秒`
      : preview.duration < 3600
        ? `${Math.ceil(preview.duration / 60)}分钟`
        : `${Math.floor(preview.duration / 3600)}小时${Math.ceil((preview.duration % 3600) / 60)}分钟`;

    showCostConfirm(
      `升级${buildingNames[preview.buildingTypeId] || preview.buildingTypeId} (Lv.${preview.currentLevel} → Lv.${preview.nextLevel})`,
      preview.cost,
      () => {
        socket.emit('building:upgrade', { playerId, buildingTypeId: preview.buildingTypeId });
      },
      `预计升级时间: ${durationText}`
    );
  });

  // 监听升级开始
  socket.on('building:upgradeStarted', (data) => {
    console.log('Building upgrade started:', data);
    renderResources(data.resources);
    updateBuildingQueue([data.task]);
    showSuccess(`开始升级建筑！预计${data.task.durationFormatted}完成`);
  });

  // 监听升级完成
  socket.on('building:upgradeCompleted', (data) => {
    console.log('Building upgrade completed:', data);
    renderBuildings(data.buildings);
    renderResources(data.resources);
    showSuccess(`建筑升级完成！升级至Lv.${data.task.toLevel}`);
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
    // 刷新将领选择列表
    if (generalsData) {
      updateGeneralSelect(generalsData);
    }
  }
  
  if (tabName === 'generals' && socket && playerId) {
    socket.emit('general:getList', { playerId });
    socket.emit('general:getRecruitConfig');
  }
}

// 渲染资源
function renderResources(resources) {
  console.log('渲染资源:', resources); // 调试用
  
  const container = document.getElementById('resources');
  container.innerHTML = '';

  const resourceNames = {
    wood: '木材 🌲', stone: '石材 🪨', food: '粮食 🌾',
    iron: '铁矿 ⛏️', crystal: '水晶 💎', gold: '金币 🪙'
  };

  for (const [id, data] of Object.entries(resources)) {
    // 确保数据格式正确
    const amount = typeof data === 'object' ? (data.amount || 0) : (data || 0);
    const max = typeof data === 'object' ? (data.max || 1000) : 1000;
    
    const card = document.createElement('div');
    card.className = 'resource-card';
    card.innerHTML = `
      <div class="resource-name">${resourceNames[id] || id}</div>
      <div class="resource-value">${Math.floor(amount)}</div>
      <div class="resource-max">上限: ${Math.floor(max)}</div>
    `;
    container.appendChild(card);
  }
  
  // 同时更新全局资源栏
  updateGlobalResources(resources);
}

// 更新全局资源栏
function updateGlobalResources(resources) {
  console.log('更新全局资源栏:', resources); // 调试用
  
  const resourceMap = {
    'wood': 'globalWood',
    'stone': 'globalStone', 
    'food': 'globalFood',
    'iron': 'globalIron',
    'crystal': 'globalCrystal',
    'gold': 'globalGold'
  };
  
  for (const [resId, elementId] of Object.entries(resourceMap)) {
    const element = document.getElementById(elementId);
    if (element && resources[resId]) {
      const amount = typeof resources[resId] === 'object' ? (resources[resId].amount || 0) : (resources[resId] || 0);
      element.textContent = Math.floor(amount);
      console.log(`  ${resId}: ${amount}`); // 调试用
    } else if (element) {
      console.log(`  ${resId}: 无数据`); // 调试用
    } else {
      console.log(`  ${resId}: 元素 ${elementId} 不存在`); // 调试用
    }
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
    lumber_mill: '伐木场', farm: '农场', barracks: '兵营',
    quarry: '采石场', iron_mine: '铁矿场', crystal_mine: '水晶矿',
    hospital: '医院', wall: '城墙', tower: '箭塔',
    house: '民居', imperial_palace: '皇宫', general_camp: '将领营',
    tech_institute: '科技院'
  };

  for (const [id, data] of Object.entries(buildings)) {
    const item = document.createElement('div');
    item.className = 'unit-card';
    
    const canUpgrade = data.level < data.maxLevel;
    
    item.innerHTML = `
      <h4>${names[id] || id} - Lv.${data.level}</h4>
      <p style="color:#888;">最高等级: ${data.maxLevel}</p>
      ${canUpgrade ? `<button class="btn-primary" onclick="upgradeBuilding('${id}')">升级</button>` : '<p style="color:#666;">已满级</p>'}
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
  
  if (army.trainingQueue && army.trainingQueue.length > 0) {
    document.getElementById('trainingQueue').style.display = 'block';
    updateTrainingQueue(army.trainingQueue);
  } else {
    document.getElementById('trainingQueue').style.display = 'none';
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
  
  const resourceNames = { wood: '木材', stone: '石材', food: '粮食', iron: '铁矿', crystal: '水晶', gold: '金币' };
  let costText = '';
  for (const [res, amount] of Object.entries(preview.cost)) {
    costText += `${resourceNames[res] || res}: ${amount} `;
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
    
    // 使用服务器提供的进度计算（考虑时间加速）
    let remaining = 0;
    if (task._progress !== undefined) {
      // 服务器使用 _progress 追踪进度（毫秒）
      const remainingMs = Math.max(0, task.duration - task._progress);
      remaining = Math.ceil(remainingMs / 1000);
    } else {
      // 回退：使用真实时间计算
      remaining = Math.max(0, Math.ceil((task.startTime + task.duration - Date.now()) / 1000));
    }
    
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
    showError('请先连接服务器');
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
    
    const btnText = npc.recommended ? '发起攻击' : '⚠️ 强行攻击';
    const btnClass = npc.recommended ? 'btn-danger' : 'btn-danger';
    const riskBadge = npc.recommended 
      ? '<span class="difficulty-badge" style="background:#4CAF50;">推荐</span>' 
      : '<span class="difficulty-badge" style="background:#f44336;">高风险</span>';
    
    card.innerHTML = `
      <h4>
        ${npc.name} (Lv.${npc.level})
        <span class="difficulty-badge difficulty-${npc.difficulty}">${difficultyNames[npc.difficulty]}</span>
        ${riskBadge}
      </h4>
      <p>类型: ${categoryNames[npc.category]}</p>
      <p>战力: ${npc.power}</p>
      <button class="${btnClass}" onclick="startBattle('${npc.id}', ${npc.recommended})">
        ${btnText}
      </button>
    `;
    
    container.appendChild(card);
  }
}

function showBattleResult(data) {
  const panel = document.getElementById('battleResultPanel');
  const resultDiv = document.getElementById('battleResult');
  const logDiv = document.getElementById('battleLog');
  
  panel.style.display = 'block';
  
  const result = data.result;
  const isVictory = result.winner === 'attacker';
  
  // 战斗结果摘要
  const resourceNames = { wood: '木材', stone: '石材', food: '粮食', iron: '铁矿', crystal: '水晶', gold: '金币' };
  const unitNames = { infantry: '步兵', archer: '弓兵', cavalry: '骑兵', mage: '魔法兵' };
  
  let lootText = '';
  if (result.loot) {
    lootText = '<h4>战利品:</h4><ul>';
    for (const [res, amount] of Object.entries(result.loot)) {
      lootText += `<li>${resourceNames[res] || res}: +${amount}</li>`;
    }
    lootText += '</ul>';
  }
  
  let casualtiesText = '<h4>伤亡情况:</h4><ul>';
  for (const [unit, count] of Object.entries(result.casualties.attacker)) {
    if (count > 0) {
      casualtiesText += `<li>${unitNames[unit] || unit}: ${count}人阵亡</li>`;
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
    showWarning('暂无战斗记录');
    return;
  }
  showBattleResult(lastBattleResult);
}

// ==================== 交互功能 ====================

function collect(resourceType, amount) {
  if (!socket || !playerId) {
    showError('请先连接服务器');
    return;
  }
  socket.emit('resource:collect', { playerId, resourceType, amount });
}

function upgradeBuilding(buildingTypeId) {
  if (!socket || !playerId) {
    showError('请先连接服务器');
    return;
  }

  // 从服务器获取升级预览
  socket.emit('building:upgradePreview', { playerId, buildingTypeId });
}

// 更新建筑升级队列显示
function updateBuildingQueue(queue) {
  // 可以在建筑面板显示升级进度
  // 类似训练队列的显示方式
  console.log('Building upgrade queue:', queue);
}

function previewTraining() {
  if (!socket || !playerId) {
    showError('请先连接服务器');
    return;
  }
  
  const unitTypeId = document.getElementById('trainUnitType').value;
  const count = parseInt(document.getElementById('trainCount').value);
  
  socket.emit('army:trainingPreview', { playerId, unitTypeId, count });
}

function startTraining() {
  if (!socket || !playerId) {
    showError('请先连接服务器');
    return;
  }
  
  const unitTypeId = document.getElementById('trainUnitType').value;
  const count = parseInt(document.getElementById('trainCount').value);
  
  // 获取成本
  const costs = {
    infantry: { food: 20 },
    archer: { food: 25, wood: 10 },
    cavalry: { food: 40, wood: 20 }
  };
  
  const baseCost = costs[unitTypeId];
  const totalCost = {};
  for (const [res, amount] of Object.entries(baseCost)) {
    totalCost[res] = amount * count;
  }
  
  const unitNames = { infantry: '步兵', archer: '弓兵', cavalry: '骑兵' };
  
  showCostConfirm(`训练${unitNames[unitTypeId]} x${count}`, totalCost, () => {
    socket.emit('army:train', { playerId, unitTypeId, count });
  });
}

// ==================== 将领系统功能 ====================

function renderGenerals(data) {
  const container = document.getElementById('myGenerals');
  if (!data || !data.generals || data.generals.length === 0) {
    container.innerHTML = '<p style="text-align:center;color:#888;">暂无将领，请前往招募</p>';
    return;
  }
  
  container.innerHTML = '';
  const rarityNames = {
    common: '普通',
    rare: '稀有', 
    epic: '史诗',
    legendary: '传说'
  };
  
  for (const general of data.generals) {
    const card = document.createElement('div');
    card.className = `general-card ${general.rarity}`;
    
    // 技能信息
    let skillsHtml = '';
    if (general.skills && general.skills.length > 0) {
      skillsHtml = '<div class="general-skills"><strong>技能:</strong>';
      for (const skill of general.skills) {
        skillsHtml += `
          <div class="skill-item">
            <strong>${skill.name}</strong> - ${skill.description}<br/>
            <small>冷却: ${skill.cooldown}回合</small>
          </div>
        `;
      }
      skillsHtml += '</div>';
    }
    
    // 经验条
    const expPercent = (general.exp / general.expToNext) * 100;
    
    card.innerHTML = `
      <div class="general-name">
        ${general.name}
        <span class="general-rarity rarity-${general.rarity}">${rarityNames[general.rarity]}</span>
      </div>
      <p>等级: ${general.level} <span style="color:#888;">(${general.assignedTo ? '已分配至' + general.assignedTo + '编队' : '未分配'})</span></p>
      <div class="exp-bar">
        <div class="exp-fill" style="width: ${expPercent}%"></div>
      </div>
      <p style="font-size:12px; color:#888;">经验: ${general.exp}/${general.expToNext}</p>
      <div class="general-stats">
        <span>⚔️ 攻击: ${general.stats.attack}</span>
        <span>🛡️ 防御: ${general.stats.defense}</span>
        <span>📖 智力: ${general.stats.intelligence}</span>
      </div>
      ${skillsHtml}
      <div style="margin-top: 10px;">
        <button onclick="assignGeneral('${general.id}', 'default')">分配至默认编队</button>
      </div>
    `;
    
    container.appendChild(card);
  }
}

function renderGeneralTemplates(templates) {
  const container = document.getElementById('generalTemplates');
  if (!templates) return;
  
  container.innerHTML = '';
  const rarityNames = { common: '普通', rare: '稀有', epic: '史诗', legendary: '传说' };
  
  for (const template of templates) {
    const div = document.createElement('div');
    div.className = `general-card ${template.rarity}`;
    div.innerHTML = `
      <div class="general-name">
        ${template.name}
        <span class="general-rarity rarity-${template.rarity}">${rarityNames[template.rarity]}</span>
      </div>
      <p style="color:#888; font-size:14px;">${template.description}</p>
    `;
    container.appendChild(div);
  }
}

function renderRecruitOptions(config) {
  const container = document.getElementById('recruitOptions');
  if (!config) return;
  
  container.innerHTML = '';
  const typeNames = { basic: '普通招募', advanced: '高级招募', legendary: '传说招募' };
  
  const resourceNames = {
    wood: '木材',
    stone: '石材',
    food: '粮食',
    iron: '铁矿',
    crystal: '水晶',
    gold: '金币'
  };
  
  for (const [type, cfg] of Object.entries(config)) {
    const div = document.createElement('div');
    div.className = 'recruit-option';
    
    // 消耗显示
    let costHtml = '';
    for (const [res, amount] of Object.entries(cfg.cost)) {
      costHtml += `${resourceNames[res] || res}: ${amount} `;
    }
    
    // 概率显示
    const prob = cfg.probabilities;
    const probHtml = `
      传说: ${(prob.legendary * 100).toFixed(0)}% 
      史诗: ${(prob.epic * 100).toFixed(0)}% 
      稀有: ${(prob.rare * 100).toFixed(0)}% 
      普通: ${(prob.common * 100).toFixed(0)}%
    `;
    
    div.innerHTML = `
      <h4>${typeNames[type]}</h4>
      <div class="recruit-cost">消耗: ${costHtml}</div>
      <button class="btn-secondary" onclick="recruitGeneral('${type}')">立即招募</button>
      <div class="recruit-probability">概率: ${probHtml}</div>
    `;
    
    container.appendChild(div);
  }
}

function recruitGeneral(type) {
  if (!socket || !playerId) {
    showError('请先连接服务器');
    return;
  }
  
  const costs = {
    basic: { gold: 100 },
    advanced: { gold: 500, crystal: 10 },
    legendary: { gold: 2000, crystal: 100 }
  };
  
  const names = {
    basic: '普通招募',
    advanced: '高级招募',
    legendary: '传说招募'
  };
  
  const cost = costs[type];
  showCostConfirm(names[type], cost, () => {
    socket.emit('general:recruit', { playerId, recruitType: type });
  });
}

function showRecruitResult(data) {
  const panel = document.getElementById('recruitResultPanel');
  const resultDiv = document.getElementById('recruitResult');
  
  panel.style.display = 'block';
  
  const rarityNames = { common: '普通', rare: '稀有', epic: '史诗', legendary: '传说' };
  const general = data.general;
  
  resultDiv.innerHTML = `
    <div class="general-card ${general.rarity}" style="text-align:center;">
      <h2 style="color:${data.rarity.color};">🎉 招募成功！</h2>
      <div class="general-name" style="font-size:24px; margin:20px 0;">
        ${general.name}
        <span class="general-rarity rarity-${general.rarity}">${rarityNames[general.rarity]}</span>
      </div>
      <div class="general-stats" style="justify-content:center;">
        <span>⚔️ 攻击: ${general.stats.attack}</span>
        <span>🛡️ 防御: ${general.stats.defense}</span>
        <span>📖 智力: ${general.stats.intelligence}</span>
      </div>
      ${general.skills.length > 0 ? `<p style="margin-top:15px;"><strong>技能: </strong>${general.skills.map(s => s.name).join(', ')}</p>` : ''}
    </div>
  `;
  
  panel.scrollIntoView({ behavior: 'smooth' });
}

function closeRecruitResult() {
  document.getElementById('recruitResultPanel').style.display = 'none';
}

function assignGeneral(generalId, formationId) {
  if (!socket || !playerId) {
    showError('请先连接服务器');
    return;
  }
  
  socket.emit('general:assign', { playerId, generalId, formationId });
}

function updateGeneralSelect(data) {
  const select = document.getElementById('battleGeneralSelect');
  if (!select || !data || !data.generals) return;
  
  // 保存当前选择
  const currentValue = select.value;
  
  // 重新填充选项
  select.innerHTML = '<option value="">不携带将领</option>';
  
  for (const general of data.generals) {
    const option = document.createElement('option');
    option.value = general.id;
    option.textContent = `${general.name} (Lv.${general.level})`;
    select.appendChild(option);
  }
  
  // 恢复选择
  if (currentValue) {
    select.value = currentValue;
  }
}

function onBattleGeneralChange() {
  const select = document.getElementById('battleGeneralSelect');
  selectedGeneralId = select.value || null;
}

// 显示资源消耗确认弹窗
function showCostConfirm(title, cost, onConfirm, extraInfo = null) {
  // 资源名称映射
  const resourceNames = {
    wood: '木材',
    stone: '石材', 
    food: '粮食',
    iron: '铁矿',
    crystal: '水晶',
    gold: '金币'
  };
  
  // 构建资源消耗详情
  let costHtml = '<div style="margin: 15px 0; padding: 15px; background: rgba(0,0,0,0.3); border-radius: 8px;">';
  
  // 如果有额外信息，先显示
  if (extraInfo) {
    costHtml += `<p style="margin-bottom: 10px; color: #4CAF50; font-weight: bold;">${extraInfo}</p>`;
  }
  
  costHtml += '<h4 style="margin-bottom: 10px; color: #ffd700;">资源消耗:</h4><ul style="list-style: none; padding: 0;">';
  
  for (const [resource, amount] of Object.entries(cost)) {
    const resourceName = resourceNames[resource] || resource;
    costHtml += `<li style="padding: 5px 0; display: flex; justify-content: space-between;">
      <span>${resourceName}:</span>
      <span style="color: #f44336; font-weight: bold;">-${amount}</span>
    </li>`;
  }
  costHtml += '</ul></div>';
  
  // 创建弹窗
  const modal = document.createElement('div');
  modal.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0,0,0,0.8);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 10000;
  `;
  
  modal.innerHTML = `
    <div style="
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
      border: 2px solid #ffd700;
      border-radius: 12px;
      padding: 30px;
      max-width: 400px;
      width: 90%;
      text-align: center;
    ">
      <h3 style="color: #ffd700; margin-bottom: 15px;">${title}</h3>
      ${costHtml}
      
      <p style="color: #888; font-size: 14px; margin: 15px 0;">确定要执行此操作吗？</p>
      
      <div style="margin-top: 20px; display: flex; gap: 10px; justify-content: center;">
        <button onclick="this.closest('.cost-confirm-modal').remove()" 
                style="background: #666; padding: 12px 30px;">取消</button>
        <button id="costConfirmBtn" 
                style="background: #4CAF50; padding: 12px 30px;">确定</button>
      </div>
    </div>
  `;
  
  modal.className = 'cost-confirm-modal';
  document.body.appendChild(modal);
  
  // 绑定确认按钮
  document.getElementById('costConfirmBtn').addEventListener('click', () => {
    modal.remove();
    onConfirm();
  });
}

// 修改开始战斗函数，加入将领选择
function startBattle(npcTypeId, isRecommended = true) {
  if (!socket || !playerId) {
    showError('请先连接服务器');
    return;
  }
  
  // 高风险警告 - 使用自定义弹窗
  if (!isRecommended) {
    showConfirmModal(
      '⚠️ 高风险警告',
      '此敌人战力远高于你的军队，强行攻击可能导致严重伤亡！\n\n建议提升军队实力后再来挑战。',
      () => {
        // 确认后继续执行攻击
        proceedBattle(npcTypeId);
      },
      null,
      { confirmText: '强行攻击', cancelText: '取消', isDanger: true }
    );
    return;
  }
  
  // 推荐目标直接执行
  proceedBattle(npcTypeId);
}

/**
 * 继续执行战斗
 */
function proceedBattle(npcTypeId) {
  // 获取选择的将领
  const generalSelect = document.getElementById('battleGeneralSelect');
  const selectedGeneralId = generalSelect ? generalSelect.value : null;
  
  // 查找将领信息
  let generalInfo = null;
  if (selectedGeneralId && generalsData && generalsData.generals) {
    generalInfo = generalsData.generals.find(g => g.id === selectedGeneralId);
  }
  
  // 显示攻击确认
  const confirmMsg = generalInfo 
    ? `确定要让 ${generalInfo.name} 率军攻打吗？战斗中可能有士兵伤亡！`
    : '确定要发起攻击吗？战斗中可能有士兵伤亡！';
  
  showConfirmModal(
    '确认出征',
    confirmMsg,
    () => {
      // 执行攻击
      executeBattleStart(npcTypeId, generalInfo);
    },
    null,
    { confirmText: '出征', cancelText: '取消', isDanger: false }
  );
}

/**
 * 执行战斗开始
 */
function executeBattleStart(npcTypeId, generalInfo) {
  const generalSelect = document.getElementById('battleGeneralSelect');
  const generalId = generalSelect ? generalSelect.value : null;
  
  socket.emit('battle:start', { 
    playerId, 
    npcTypeId, 
    formationId: 'default',
    generalId: generalId 
  });
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
  console.log('🎮 Empire Rise Client v0.3 initialized');
});
// ==================== 任务系统功能 ====================

let tasksData = null;

function renderTasks(data) {
  if (!data) return;
  
  // 主线任务
  const mainContainer = document.getElementById('mainTasks');
  mainContainer.innerHTML = '';
  if (data.main && data.main.length > 0) {
    for (const task of data.main.filter(t => t.status !== 'claimed')) {
      mainContainer.appendChild(createTaskCard(task));
    }
  } else {
    mainContainer.innerHTML = '<p style="text-align:center;color:#888;">暂无主线任务</p>';
  }
  
  // 日常任务
  const dailyContainer = document.getElementById('dailyTasks');
  dailyContainer.innerHTML = '';
  if (data.daily && data.daily.length > 0) {
    for (const task of data.daily) {
      dailyContainer.appendChild(createTaskCard(task));
    }
  } else {
    dailyContainer.innerHTML = '<p style="text-align:center;color:#888;">暂无日常任务</p>';
  }
  
  // 成就任务
  const achievementContainer = document.getElementById('achievementTasks');
  achievementContainer.innerHTML = '';
  if (data.achievements && data.achievements.length > 0) {
    for (const task of data.achievements.filter(t => t.status !== 'claimed')) {
      achievementContainer.appendChild(createTaskCard(task));
    }
  } else {
    achievementContainer.innerHTML = '<p style="text-align:center;color:#888;">暂无成就任务</p>';
  }
}

function createTaskCard(task) {
  const card = document.createElement('div');
  card.className = 'unit-card';
  card.style.borderLeft = task.status === 'completed' ? '4px solid #4CAF50' : '4px solid #ffd700';
  
  const statusText = {
    pending: '进行中',
    completed: '已完成（可领取）',
    claimed: '已领取'
  };
  
  let progressHtml = '';
  if (task.progress) {
    progressHtml = '<div style="margin-top:10px;font-size:13px;color:#888;">';
    for (const [key, value] of Object.entries(task.progress)) {
      if (typeof value === 'object') {
        for (const [subKey, subValue] of Object.entries(value)) {
          const required = task.requirements[key]?.[subKey] || 0;
          progressHtml += `<p>${subKey}: ${subValue}/${required}</p>`;
        }
      } else {
        const required = task.requirements[key] || 0;
        progressHtml += `<p>${key}: ${value}/${required}</p>`;
      }
    }
    progressHtml += '</div>';
  }
  
  let rewardsHtml = '<div style="margin-top:10px;">奖励: ';
  const resourceNames = { wood: '木材', stone: '石材', food: '粮食', iron: '铁矿', crystal: '水晶', gold: '金币', exp: '经验' };
  for (const [res, amount] of Object.entries(task.rewards)) {
    rewardsHtml += `${resourceNames[res] || res}:${amount} `;
  }
  rewardsHtml += '</div>';
  
  card.innerHTML = `
    <h4>${task.title} <span style="font-size:12px;color:#888;">(${statusText[task.status]})</span></h4>
    <p style="color:#aaa;font-size:14px;">${task.description}</p>
    ${progressHtml}
    ${rewardsHtml}
    ${task.status === 'completed' ? `<button onclick="claimTaskReward('${task.id}')" style="margin-top:10px;">领取奖励</button>` : ''}
  `;
  
  return card;
}

function claimTaskReward(taskId) {
  if (!socket || !playerId) {
    showError('请先连接服务器');
    return;
  }
  
  socket.emit('task:claimReward', { playerId, taskId });
}

// 在 switchTab 中添加任务标签
const originalSwitchTab = switchTab;
switchTab = function(tabName) {
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
    if (generalsData) {
      updateGeneralSelect(generalsData);
    }
  }
  
  if (tabName === 'generals' && socket && playerId) {
    socket.emit('general:getList', { playerId });
    socket.emit('general:getRecruitConfig');
  }
  
  if (tabName === 'tasks' && socket && playerId) {
    socket.emit('task:getList', { playerId });
  }
};

// ==================== 时间系统功能 ====================

// 时间更新事件
socket.on('time:update', (data) => {
  console.log('[Client] Received time:', data);
  if (data && data.gameDate) {
    updateTimeDisplay(data);
  }
});

// 自动修复：如果10秒后时间仍显示默认值，请求重新同步
setTimeout(() => {
  const gameDateEl = document.getElementById('gameDate');
  if (gameDateEl && gameDateEl.textContent === '2026年 2月 13日' && socket && playerId) {
    console.log('时间显示异常，请求重新同步...');
    socket.emit('time:get', { playerId });
  }
}, 5000);

function updateTimeDisplay(timeData) {
  currentTimeData = timeData;
  
  const gameDateEl = document.getElementById('gameDate');
  const timeOfDayEl = document.getElementById('timeOfDay');
  
  if (gameDateEl) {
    gameDateEl.textContent = timeData.gameDate || '2026年 2月 13日';
  }
  
  if (timeOfDayEl) {
    // 显示时间段 + 现实时分秒
    const timeOfDay = timeData.timeOfDayName || '☀️ 早晨';
    const realTime = timeData.realTime || '';
    timeOfDayEl.textContent = realTime ? `${timeOfDay} ${realTime}` : timeOfDay;
  }
}

function startTimeUpdateInterval() {
  // 清除已有的定时器
  if (timeUpdateInterval) {
    clearInterval(timeUpdateInterval);
  }
  
  // 每秒更新一次时间显示
  timeUpdateInterval = setInterval(() => {
    if (!currentTimeData) return;
    
    // 使用现实时间的时分秒，但保持游戏日期
    const now = new Date();
    const realTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
    
    // 更新显示
    const timeOfDayEl = document.getElementById('timeOfDay');
    if (timeOfDayEl && currentTimeData.timeOfDayName) {
      timeOfDayEl.textContent = `${currentTimeData.timeOfDayName} ${realTime}`;
    }
    
    // 每10秒向服务器请求同步一次游戏日期
    if (now.getSeconds() % 10 === 0 && socket && playerId) {
      socket.emit('time:get', { playerId });
    }
  }, 1000);
}

// 停止时间更新
function stopTimeUpdateInterval() {
  if (timeUpdateInterval) {
    clearInterval(timeUpdateInterval);
    timeUpdateInterval = null;
  }
}

// 控制时间速度
function setTimeSpeed(speed) {
  if (!socket || !playerId) {
    showError('请先连接服务器');
    return;
  }
  socket.emit('time:setSpeed', { playerId, speed });
}

// 暂停/恢复时间
function toggleTimePause() {
  if (!socket || !playerId) {
    showError('请先连接服务器');
    return;
  }
  socket.emit('time:togglePause', { playerId });
}
