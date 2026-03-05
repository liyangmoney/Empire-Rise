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
let currentResources = null; // 当前资源数据（用于本地刷新）
let resourceUpdateInterval = null; // 资源本地刷新定时器
let currentBuildingQueue = []; // 当前建筑升级队列
let buildingUpdateInterval = null; // 建筑升级刷新定时器

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
    renderBuildings(data.buildings, data.upgradeQueue || []);
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
    
    // 体力数据
    if (data.stamina) {
      updateStaminaDisplay(data.stamina);
    }
    
    // 人口数据
    if (data.population) {
      updatePopulationDisplay(data.population);
    }
  });

  // 资源更新
  socket.on('resource:update', (data) => {
    if (data.allResources) {
      renderResources(data.allResources);
    }
    // 更新体力
    if (data.stamina) {
      updateStaminaDisplay(data.stamina);
    }
  });

  // 建筑更新
  socket.on('building:update', (data) => {
    if (data.buildings) {
      renderBuildings(data.buildings, data.upgradeQueue || []);
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
      warehouse_special: '特殊仓库',
      farm: '农场',
      lumber_mill: '伐木场',
      quarry: '采石场',
      iron_mine: '铁矿场',
      crystal_mine: '水晶矿',
      fishery: '鱼塘',
      orchard: '果园',
      mine_shaft: '矿井',
      barracks: '兵营',
      hospital: '医院',
      wall: '城墙',
      tower: '箭塔',
      watchtower: '瞭望塔',
      moat: '护城河',
      stables: '马厩',
      arsenal: '军械库',
      house: '民居',
      market: '市场',
      tavern: '酒馆',
      port: '港口',
      blacksmith: '铁匠铺',
      tech_institute: '研究院',
      imperial_palace: '皇宫',
      general_camp: '将领营'
    };

    const durationText = preview.duration < 60
      ? `${preview.duration}秒`
      : preview.duration < 3600
        ? `${Math.floor(preview.duration / 60)}分${Math.ceil(preview.duration % 60)}秒`
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
    updateBuildingQueue(data.upgradeQueue || []);
    showSuccess(`开始升级建筑！预计${data.task.durationFormatted}完成`);
  });

  // 监听升级完成
  socket.on('building:upgradeCompleted', (data) => {
    console.log('Building upgrade completed:', data);
    renderBuildings(data.buildings, data.upgradeQueue || []);
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
  
  // 保存资源数据用于本地刷新（深拷贝）
  currentResources = JSON.parse(JSON.stringify(resources));
  
  // 启动本地资源刷新（如果还没启动）
  if (!resourceUpdateInterval) {
    startResourceLocalUpdate();
  }
  
  const container = document.getElementById('resources');
  container.innerHTML = '';

  const resourceNames = {
    wood: '木材 🌲', stone: '石材 ⛰️', food: '粮食 🌾',
    iron: '铁矿 ⚙️', crystal: '水晶 💎', gold: '金币 💰',
    fish_product: '鱼产品 🐟', fruit: '水果 🍎', premium_food: '精品食材 🍖'
  };

  for (const [id, data] of Object.entries(resources)) {
    // 确保数据格式正确
    const amount = typeof data === 'object' ? (data.amount || 0) : (data || 0);
    const max = typeof data === 'object' ? (data.max || 1000) : 1000;
    const rate = typeof data === 'object' ? (data.rate || 0) : 0; // 每小时产出
    
    // 计算每秒产出（保留1位小数）
    const ratePerSecond = (rate / 3600).toFixed(1);
    
    const card = document.createElement('div');
    card.className = 'resource-card';
    card.innerHTML = `
      <div class="resource-name">${resourceNames[id] || id}</div>
      <div class="resource-value" id="res-${id}">${Math.floor(amount)}</div>
      <div class="resource-max">上限: ${Math.floor(max)}</div>
      <div class="resource-rate" style="color: #4CAF50; font-size: 12px; margin-top: 5px;">+${ratePerSecond}/秒</div>
    `;
    container.appendChild(card);
  }
  
  // 同时更新全局资源栏
  updateGlobalResources(resources);
}

// 启动资源本地刷新（每秒更新显示）
function startResourceLocalUpdate() {
  if (resourceUpdateInterval) return; // 已经启动了
  
  resourceUpdateInterval = setInterval(() => {
    if (!currentResources) return;
    
    // 每秒根据产出速率增加资源（本地显示）
    for (const [id, data] of Object.entries(currentResources)) {
      const rate = data.rate || 0; // 每小时产出（固定值，服务器决定）
      const perSecond = rate / 3600; // 每秒产出
      const max = data.max || 1000;
      
      // 增加资源（不超过上限）
      data.amount = Math.min(max, (data.amount || 0) + perSecond);
      
      // 更新显示
      const el = document.getElementById(`res-${id}`);
      if (el) {
        el.textContent = Math.floor(data.amount);
      }
      
      // 更新全局资源栏
      const globalEl = document.getElementById(`global${id.charAt(0).toUpperCase() + id.slice(1)}`);
      if (globalEl) {
        globalEl.textContent = Math.floor(data.amount);
      }
    }
  }, 1000);
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
function renderBuildings(buildings, upgradeQueue = []) {
  const container = document.getElementById('buildings');
  if (Object.keys(buildings).length === 0) {
    container.innerHTML = '<p style="text-align:center;color:#888;">暂无建筑</p>';
    return;
  }

  container.innerHTML = '';
  
  // 建筑分类
  const categories = {
    production: '🌾 资源生产',
    storage: '📦 仓库',
    military: '⚔️ 军事',
    economy: '💰 经济',
    technology: '🔬 科技',
    special: '👑 特殊',
    other: '🏛️ 其他'
  };

  // 按分类组织建筑
  const buildingsByCategory = {};
  for (const [id, data] of Object.entries(buildings)) {
    const cat = data.category || 'other';
    if (!buildingsByCategory[cat]) buildingsByCategory[cat] = [];
    buildingsByCategory[cat].push({ id, ...data });
  }

  // 保存升级队列
  currentBuildingQueue = upgradeQueue;
  startBuildingUpdateInterval();

  // 按分类渲染
  for (const [catKey, catName] of Object.entries(categories)) {
    const catBuildings = buildingsByCategory[catKey];
    if (!catBuildings || catBuildings.length === 0) continue;

    // 分类标题
    const catTitle = document.createElement('h3');
    catTitle.style.cssText = 'color: #ffd700; margin: 15px 0 10px 0; border-bottom: 1px solid rgba(255,215,0,0.3); padding-bottom: 5px;';
    catTitle.textContent = catName;
    container.appendChild(catTitle);

    // 建筑列表
    const listDiv = document.createElement('div');
    listDiv.style.cssText = 'display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 15px;';
    
    for (const building of catBuildings) {
      const item = document.createElement('div');
      item.className = 'unit-card';
      item.id = `building-${building.id}`;
      
      const canUpgrade = building.level < building.maxLevel;
      
      // 检查是否正在升级
      const upgradingTask = upgradeQueue.find(t => t.buildingTypeId === building.id && !t.completed);
      
      let upgradeHtml = '';
      if (upgradingTask) {
        const progress = Math.min(100, (upgradingTask._progress / upgradingTask.duration) * 100);
        const remaining = Math.ceil((upgradingTask.duration - upgradingTask._progress) / 1000);
        upgradeHtml = `
          <div style="margin-top:10px;">
            <div style="background:rgba(0,0,0,0.3);height:20px;border-radius:10px;overflow:hidden;">
              <div id="building-progress-${building.id}" style="background:linear-gradient(90deg,#4CAF50,#8BC34A);height:100%;width:${progress}%;transition:width 0.3s;"></div>
            </div>
            <p style="color:#4CAF50;font-size:12px;margin-top:5px;" id="building-time-${building.id}">升级中... ${remaining}秒</p>
          </div>
        `;
      } else if (canUpgrade) {
        upgradeHtml = `<button class="btn-primary" onclick="upgradeBuilding('${building.id}')" style="margin-top:10px;">升级</button>`;
      } else {
        upgradeHtml = '<p style="color:#666;margin-top:10px;">已满级</p>';
      }
      
      item.innerHTML = `
        <h4>${getBuildingName(building.id)} - Lv.${building.level}</h4>
        <p style="color:#888;font-size:12px;">最高等级: ${building.maxLevel}</p>
        <p style="color:#aaa;font-size:13px;margin-top:8px;line-height:1.4;">${building.description || '暂无介绍'}</p>
        ${upgradeHtml}
      `;
      
      // 点击显示详细信息
      item.style.cursor = 'pointer';
      item.onclick = (e) => {
        if (e.target.tagName === 'BUTTON') return; // 点击按钮时不弹出
        showBuildingDetail(building);
      };
      
      listDiv.appendChild(item);
    }
    
    container.appendChild(listDiv);
  }
}

// 获取建筑显示名称
function getBuildingName(buildingId) {
  const names = {
    warehouse_basic: '📦 基础仓库',
    warehouse_special: '📦 特殊仓库',
    lumber_mill: '🌲 伐木场',
    farm: '🌾 农场',
    quarry: '⛰️ 采石场',
    iron_mine: '⚙️ 铁矿场',
    crystal_mine: '💎 水晶矿',
    fishery: '🐟 鱼塘',
    orchard: '🍎 果园',
    mine_shaft: '⛏️ 矿井',
    barracks: '⚔️ 兵营',
    hospital: '🏥 医院',
    wall: '🛡️ 城墙',
    tower: '🏹 箭塔',
    watchtower: '👁️ 瞭望塔',
    moat: '🌊 护城河',
    stables: '🐴 马厩',
    arsenal: '⚒️ 军械库',
    house: '🏠 民居',
    market: '🏪 市场',
    tavern: '🍺 酒馆',
    port: '⚓ 港口',
    blacksmith: '🔨 铁匠铺',
    tech_institute: '🔬 研究院',
    imperial_palace: '👑 皇宫',
    general_camp: '🎖️ 将领营'
  };
  return names[buildingId] || buildingId;
}

// 显示建筑详细信息
function showBuildingDetail(building) {
  const BUILDING_DETAILS = {
    lumber_mill: {
      title: '🌲 伐木场',
      detail: '伐木场是帝国木材的主要来源。升级伐木场可以提高木材产量，每升一级产量增加20%。',
      effect: '每小时产出木材',
      levelBonus: '每级 +20% 产量'
    },
    farm: {
      title: '🌾 农场',
      detail: '农场生产粮食，用于训练军队和维持士兵士气。粮食不足会导致军队士气下降。',
      effect: '每小时产出粮食',
      levelBonus: '每级 +20% 产量'
    },
    quarry: {
      title: '⛰️ 采石场',
      detail: '采石场开采石材，用于建造防御建筑和加固城墙。',
      effect: '每小时产出石材',
      levelBonus: '每级 +20% 产量'
    },
    iron_mine: {
      title: '⚙️ 铁矿场',
      detail: '铁矿场开采铁矿，用于打造高级装备和训练进阶兵种。',
      effect: '每小时产出铁矿',
      levelBonus: '每级 +20% 产量'
    },
    crystal_mine: {
      title: '💎 水晶矿',
      detail: '水晶矿开采稀有水晶，用于研究高级科技和召唤稀有兵种。',
      effect: '每小时产出水晶',
      levelBonus: '每级 +20% 产量'
    },
    warehouse_basic: {
      title: '📦 基础仓库',
      detail: '基础仓库用于储存木材、石材、粮食等基础资源。升级可以提升仓库容量。',
      effect: '增加基础资源存储上限',
      levelBonus: '每级 +50% 容量'
    },
    warehouse_special: {
      title: '📦 特殊仓库',
      detail: '特殊仓库用于储存铁矿、水晶等稀有资源。升级可以提升仓库容量。',
      effect: '增加稀有资源存储上限',
      levelBonus: '每级 +50% 容量'
    },
    barracks: {
      title: '⚔️ 兵营',
      detail: '兵营是训练士兵的地方。升级兵营可以解锁更高级的兵种，并加快训练速度。',
      effect: '训练士兵、解锁新兵种',
      levelBonus: '每级提升训练速度10%'
    },
    hospital: {
      title: '🏥 医院',
      detail: '医院治疗战斗中的伤兵。每级医院每小时可以恢复一定数量的伤病单位。',
      effect: '恢复伤兵',
      levelBonus: '每级每小时恢复+5单位'
    },
    wall: {
      title: '🛡️ 城墙',
      detail: '城墙是城市的防御工事，可以抵御敌人的进攻。升级城墙提升城防耐久。',
      effect: '增加城防耐久',
      levelBonus: '每级 +5% 耐久'
    },
    tower: {
      title: '🏹 箭塔',
      detail: '箭塔是防御建筑，可以在守城战中攻击敌人。',
      effect: '守城战增加攻击力',
      levelBonus: '每级 +10% 攻击力'
    },
    house: {
      title: '🏠 民居',
      detail: '民居增加帝国的人口上限和金币税收。人口是训练军队的基础。',
      effect: '增加人口上限和金币产出',
      levelBonus: '每级 +50人口、+5金币/小时'
    },
    market: {
      title: '🏪 市场',
      detail: '市场用于资源交易。升级市场可以降低交易损耗。',
      effect: '资源交易',
      levelBonus: '每级 -2% 交易损耗'
    },
    blacksmith: {
      title: '🔨 铁匠铺',
      detail: '铁匠铺打造士兵装备。升级可以解锁更高级的装备配方。',
      effect: '锻造装备',
      levelBonus: '解锁高级装备、提升属性'
    },
    tech_institute: {
      title: '🔬 研究院',
      detail: '研究院研究各种科技，提升帝国的整体实力。',
      effect: '研究科技',
      levelBonus: '解锁新科技、提升加成效果'
    },
    imperial_palace: {
      title: '👑 皇宫',
      detail: '皇宫是帝国的核心建筑，象征着帝国的荣耀。升级皇宫可以提升所有资源产量和军队上限。',
      effect: '提升全局产量和军队上限',
      levelBonus: '每级 +5% 全局加成'
    },
    general_camp: {
      title: '🎖️ 将领营',
      detail: '将领营是招募和培养将领的地方。升级可以增加将领上限和培养速度。',
      effect: '招募将领、提升将领能力',
      levelBonus: '增加将领上限、加快培养'
    }
  };

  const info = BUILDING_DETAILS[building.id] || {
    title: getBuildingName(building.id),
    detail: building.description || '暂无详细介绍',
    effect: '未知',
    levelBonus: '未知'
  };

  const nextLevel = building.level + 1;
  
  showModal({
    title: info.title,
    content: `
      <div style="text-align:left;line-height:1.6;">
        <p style="color:#aaa;margin-bottom:15px;">${info.detail}</p>
        <hr style="border-color:rgba(255,215,0,0.3);margin:15px 0;">
        <p><strong style="color:#ffd700;">当前等级:</strong> Lv.${building.level} / ${building.maxLevel}</p>
        <p><strong style="color:#ffd700;">建筑功能:</strong> ${info.effect}</p>
        <p><strong style="color:#ffd700;">升级效果:</strong> ${info.levelBonus}</p>
        ${building.level < building.maxLevel ? `
          <hr style="border-color:rgba(255,215,0,0.3);margin:15px 0;">
          <p style="color:#4CAF50;">下一级 (Lv.${nextLevel}) 将提升效果</p>
        ` : '<p style="color:#888;margin-top:15px;">🏆 已满级</p>'}
      </div>
    `,
    showCancel: false,
    confirmText: '关闭'
  });
}

// 启动建筑升级进度刷新
function startBuildingUpdateInterval() {
  if (buildingUpdateInterval) {
    clearInterval(buildingUpdateInterval);
  }
  
  buildingUpdateInterval = setInterval(() => {
    if (!currentBuildingQueue || currentBuildingQueue.length === 0) return;
    
    const now = Date.now();
    
    for (const task of currentBuildingQueue) {
      if (task.completed) continue;
      
      // 计算进度
      const progress = Math.min(100, (task._progress / task.duration) * 100);
      const remaining = Math.max(0, Math.ceil((task.duration - task._progress) / 1000));
      
      // 更新进度条
      const progressEl = document.getElementById(`building-progress-${task.buildingTypeId}`);
      const timeEl = document.getElementById(`building-time-${task.buildingTypeId}`);
      
      if (progressEl) {
        progressEl.style.width = `${progress}%`;
      }
      
      if (timeEl) {
        if (remaining > 0) {
          timeEl.textContent = `升级中... ${remaining}秒`;
        } else {
          timeEl.textContent = '即将完成...';
        }
      }
      
      // 本地模拟进度增长（实际由服务器同步）
      task._progress += 1000; // 每秒增加1000ms
    }
  }, 1000);
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
  
  const resourceNames = { wood: '木材', stone: '石材', food: '粮食', iron: '铁矿', crystal: '水晶', gold: '金币', fish_product: '鱼产品', fruit: '水果', premium_food: '精品食材' };
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
  const resourceNames = { wood: '木材', stone: '石材', food: '粮食', iron: '铁矿', crystal: '水晶', gold: '金币', fish_product: '鱼产品', fruit: '水果', premium_food: '精品食材' };
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
  currentBuildingQueue = queue || [];
  console.log('Building upgrade queue:', queue);
  
  // 触发重新渲染建筑（显示进度）
  if (empireData && empireData.buildings) {
    renderBuildings(empireData.buildings, currentBuildingQueue);
  }
}

// 停止所有定时器
function stopAllIntervals() {
  if (timeUpdateInterval) {
    clearInterval(timeUpdateInterval);
    timeUpdateInterval = null;
  }
  if (resourceUpdateInterval) {
    clearInterval(resourceUpdateInterval);
    resourceUpdateInterval = null;
  }
  if (buildingUpdateInterval) {
    clearInterval(buildingUpdateInterval);
    buildingUpdateInterval = null;
  }
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

// 更新体力显示
function updateStaminaDisplay(staminaData) {
  const currentEl = document.getElementById('globalStamina');
  const maxEl = document.getElementById('maxStamina');
  
  if (currentEl) {
    currentEl.textContent = staminaData.current || 0;
    // 体力低时变红色
    if (staminaData.current < 20) {
      currentEl.style.color = '#f44336';
    } else {
      currentEl.style.color = '';
    }
  }
  
  if (maxEl) {
    maxEl.textContent = staminaData.max || 100;
  }
}

// 更新人口显示
function updatePopulationDisplay(popData) {
  const currentEl = document.getElementById('globalPopulation');
  const maxEl = document.getElementById('maxPopulation');
  
  if (currentEl) {
    currentEl.textContent = popData.current || 0;
    // 人口不足时变红色
    if (popData.current < 10) {
      currentEl.style.color = '#f44336';
    } else {
      currentEl.style.color = '';
    }
  }
  
  if (maxEl) {
    maxEl.textContent = popData.max || 0;
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
  stopAllIntervals();
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
