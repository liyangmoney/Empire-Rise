// server/src/network/socket/handlers.js
import { SOCKET_EVENTS } from '../../../../shared/constants.js';
import { ResourceComponent } from '../../core/components/ResourceComponent.js';
import { BuildingComponent } from '../../core/components/BuildingComponent.js';
import { ArmyComponent } from '../../core/components/ArmyComponent.js';
import { GeneralComponent } from '../../core/components/GeneralComponent.js';
import { TaskComponent } from '../../core/components/TaskComponent.js';
import { TimeComponent } from '../../core/components/TimeComponent.js';
import { TrainingSystem } from '../../core/systems/TrainingSystem.js';
import { BattleSystem } from '../../core/systems/BattleSystem.js';
import { RecruitSystem } from '../../core/systems/RecruitSystem.js';
import { UNIT_TYPES } from '../../../../shared/unitTypes.js';
import { NPC_TYPES } from '../../../../shared/npcTypes.js';
import { GENERAL_TEMPLATES } from '../../../../shared/generalTypes.js';

/**
 * 注册所有 Socket.io 事件处理器
 */
export function registerSocketHandlers(io, gameWorld) {
  const trainingSystem = new TrainingSystem(gameWorld);
  const battleSystem = new BattleSystem(gameWorld);
  const recruitSystem = new RecruitSystem(gameWorld);

  io.on('connection', (socket) => {
    console.log(`👤 Client connected: ${socket.id}`);

    // 玩家连接
    socket.on(SOCKET_EVENTS.C_EMPIRE_CONNECT, (data) => {
      const { playerId, playerName } = data;
      
      let empire = gameWorld.empires.get(playerId);
      if (!empire) {
        empire = createNewEmpire(playerId, playerName, socket.id, io);
        gameWorld.empires.set(playerId, empire);
        console.log(`🏰 New empire created for ${playerName} (${playerId})`);
      } else {
        empire.socketId = socket.id;
        empire._io = io;
        
        // 兼容旧玩家：补充 time 组件
        if (!empire.time) {
          empire.time = new TimeComponent();
        }
      }

      // 刷新日常任务（基于游戏内时间）
      const gameDay = Math.floor(empire.time?.getCurrentGameTime() / 86400) || 0;
      empire.tasks.refreshDailyTasks(gameDay);

      socket.emit('empire:init', {
        playerId,
        resources: empire.resources.getSnapshot(),
        buildings: empire.buildings.getSnapshot(),
        army: empire.army.getSnapshot(),
        generals: empire.generals.getSnapshot(),
        tasks: empire.tasks.getSnapshot(empire),
        time: empire.time?.getSnapshot() || { 
          gameDate: '第1年 1月 1日', 
          timeOfDayName: '☀️ 早晨',
          speed: 1,
          isPaused: false 
        },
        maxArmySize: trainingSystem.calculateMaxArmySize(empire),
      });
    });

    // 资源、建筑、军队事件...
    socket.on(SOCKET_EVENTS.C_RESOURCE_COLLECT, (data) => {
      const { playerId, resourceType, amount } = data;
      const empire = gameWorld.empires.get(playerId);
      if (!empire) {
        socket.emit(SOCKET_EVENTS.S_ERROR, { message: '帝国不存在' });
        return;
      }
      const result = empire.resources.add(resourceType, amount);
      
      // 如果溢出，提示用户
      if (result.overflow > 0) {
        socket.emit(SOCKET_EVENTS.S_ERROR, { 
          message: `仓库已满，${result.overflow}单位资源无法存储` 
        });
      }
      
      // 更新任务进度
      if (result.added > 0) {
        empire.tasks.updateProgress('collect', { [resourceType]: result.added });
      }
      
      socket.emit(SOCKET_EVENTS.S_RESOURCE_UPDATE, {
        resourceId: resourceType,
        result,
        allResources: empire.resources.getSnapshot()
      });
    });

    socket.on(SOCKET_EVENTS.C_BUILDING_UPGRADE, (data) => {
      const { playerId, buildingTypeId, cost } = data;
      const empire = gameWorld.empires.get(playerId);
      if (!empire) {
        socket.emit(SOCKET_EVENTS.S_ERROR, { message: '帝国不存在' });
        return;
      }
      if (!empire.resources.hasAll(cost)) {
        socket.emit(SOCKET_EVENTS.S_ERROR, { message: '资源不足' });
        return;
      }
      for (const [resId, amount] of Object.entries(cost)) {
        empire.resources.consume(resId, amount);
      }
      const building = empire.buildings.upgrade(buildingTypeId);
      if (!building) empire.buildings.add(buildingTypeId);
      
      // 更新任务进度
      empire.tasks.updateProgress('upgradeBuilding', 1);
      
      if (buildingTypeId === 'warehouse_basic') {
        const level = empire.buildings.getLevel('warehouse_basic');
        for (const resId of ['wood', 'stone', 'food']) {
          empire.resources.storage[resId].maxCapacity = 1000 * Math.pow(1.5, level - 1);
        }
      }
      socket.emit(SOCKET_EVENTS.S_BUILDING_UPDATE, {
        buildingId: buildingTypeId,
        buildings: empire.buildings.getSnapshot(),
        resources: empire.resources.getSnapshot()
      });
    });

    // 军队系统事件
    socket.on('army:getUnitTypes', () => socket.emit('army:unitTypes', UNIT_TYPES));

    socket.on('army:trainingPreview', (data) => {
      const { playerId, unitTypeId, count } = data;
      const empire = gameWorld.empires.get(playerId);
      if (!empire) return socket.emit(SOCKET_EVENTS.S_ERROR, { message: '帝国不存在' });
      const barracksLevel = empire.buildings?.getLevel('barracks') || 1;
      const preview = trainingSystem.getTrainingPreview(unitTypeId, count, barracksLevel);
      const maxSize = trainingSystem.calculateMaxArmySize(empire);
      const currentSize = empire.army.getTotalCount();
      socket.emit('army:trainingPreview', {
        preview,
        currentArmySize: currentSize,
        maxArmySize: maxSize,
        canTrain: currentSize + count <= maxSize
      });
    });

    socket.on('army:train', (data) => {
      const { playerId, unitTypeId, count } = data;
      const empire = gameWorld.empires.get(playerId);
      if (!empire) return socket.emit(SOCKET_EVENTS.S_ERROR, { message: '帝国不存在' });
      const result = trainingSystem.train(empire, unitTypeId, count);
      if (result.success) {
        socket.emit('army:trainStarted', {
          task: result.task,
          cost: result.cost,
          resources: empire.resources.getSnapshot(),
          queue: empire.army.trainingQueue,
        });
      } else {
        socket.emit(SOCKET_EVENTS.S_ERROR, { message: result.error });
      }
    });

    socket.on('army:getStatus', (data) => {
      const { playerId } = data;
      const empire = gameWorld.empires.get(playerId);
      if (!empire) return socket.emit(SOCKET_EVENTS.S_ERROR, { message: '帝国不存在' });
      socket.emit('army:status', {
        army: empire.army.getSnapshot(),
        maxArmySize: trainingSystem.calculateMaxArmySize(empire),
        formations: Array.from(empire.army.formations.entries()).map(([id, f]) => ({
          id,
          name: f.name,
          units: f.units,
          power: empire.army.calculateFormationPower(id)
        }))
      });
    });

    // ==================== 任务系统事件 ====================

    // 获取任务列表
    socket.on('task:getList', (data) => {
      const { playerId } = data;
      const empire = gameWorld.empires.get(playerId);
      if (!empire) return socket.emit(SOCKET_EVENTS.S_ERROR, { message: '帝国不存在' });
      
      // 刷新日常任务（基于游戏内时间）
      const gameDay = Math.floor(empire.time?.getCurrentGameTime() / 86400) || 0;
      empire.tasks.refreshDailyTasks(gameDay);
      
      socket.emit('task:list', empire.tasks.getSnapshot(empire));
    });

    // 领取任务奖励
    socket.on('task:claimReward', (data) => {
      const { playerId, taskId } = data;
      const empire = gameWorld.empires.get(playerId);
      if (!empire) return socket.emit(SOCKET_EVENTS.S_ERROR, { message: '帝国不存在' });
      
      const result = empire.tasks.claimReward(taskId, empire);
      
      if (result.success) {
        socket.emit('task:rewardClaimed', {
          taskId,
          rewards: result.rewards,
          resources: empire.resources.getSnapshot(),
          tasks: empire.tasks.getSnapshot(empire)
        });
        showSuccess(`领取奖励成功！`);
      } else {
        socket.emit(SOCKET_EVENTS.S_ERROR, { message: result.error });
      }
    });

    // ==================== 时间系统事件 ====================

    // 获取时间信息
    socket.on('time:get', (data) => {
      const { playerId } = data;
      const empire = gameWorld.empires.get(playerId);
      if (!empire) return socket.emit(SOCKET_EVENTS.S_ERROR, { message: '帝国不存在' });
      
      socket.emit('time:update', empire.time.getSnapshot());
    });

    // 设置时间速度
    socket.on('time:setSpeed', (data) => {
      const { playerId, speed } = data;
      const empire = gameWorld.empires.get(playerId);
      if (!empire) return socket.emit(SOCKET_EVENTS.S_ERROR, { message: '帝国不存在' });
      
      const success = empire.time.setSpeed(speed);
      if (success) {
        socket.emit('time:update', empire.time.getSnapshot());
      } else {
        socket.emit(SOCKET_EVENTS.S_ERROR, { message: '无效的时间速度' });
      }
    });

    // 暂停/恢复时间
    socket.on('time:togglePause', (data) => {
      const { playerId } = data;
      const empire = gameWorld.empires.get(playerId);
      if (!empire) return socket.emit(SOCKET_EVENTS.S_ERROR, { message: '帝国不存在' });
      
      empire.time.togglePause();
      socket.emit('time:update', empire.time.getSnapshot());
    });

    // 快进时间（测试用）
    socket.on('time:fastForward', (data) => {
      const { playerId, seconds } = data;
      const empire = gameWorld.empires.get(playerId);
      if (!empire) return socket.emit(SOCKET_EVENTS.S_ERROR, { message: '帝国不存在' });
      
      const snapshot = empire.time.fastForward(seconds);
      socket.emit('time:update', snapshot);
    });

    // ==================== 将领系统事件 ====================

    // 获取将领列表
    socket.on('general:getList', (data) => {
      const { playerId } = data;
      const empire = gameWorld.empires.get(playerId);
      if (!empire) return socket.emit(SOCKET_EVENTS.S_ERROR, { message: '帝国不存在' });
      
      socket.emit('general:list', {
        generals: empire.generals.getSnapshot(),
        templates: Object.values(GENERAL_TEMPLATES).map(t => ({
          id: t.id,
          name: t.name,
          rarity: t.rarity,
          description: t.description,
        })),
      });
    });

    // 招募将领
    socket.on('general:recruit', (data) => {
      const { playerId, recruitType } = data;
      const result = recruitSystem.recruit(playerId, recruitType);
      
      if (result.success) {
        socket.emit('general:recruited', {
          general: result.general,
          rarity: result.rarity,
          cost: result.cost,
          resources: result.remainingResources,
        });
      } else {
        socket.emit(SOCKET_EVENTS.S_ERROR, { message: result.error });
      }
    });

    // 分配将领到编队
    socket.on('general:assign', (data) => {
      const { playerId, generalId, formationId } = data;
      const empire = gameWorld.empires.get(playerId);
      if (!empire) return socket.emit(SOCKET_EVENTS.S_ERROR, { message: '帝国不存在' });
      
      const success = empire.generals.assignToFormation(generalId, formationId);
      if (success) {
        socket.emit('general:assigned', {
          generalId,
          formationId,
          generals: empire.generals.getSnapshot(),
        });
      } else {
        socket.emit(SOCKET_EVENTS.S_ERROR, { message: '分配失败' });
      }
    });

    // 获取招募配置
    socket.on('general:getRecruitConfig', () => {
      socket.emit('general:recruitConfig', recruitSystem.getRecruitConfig());
    });

    // ==================== 战斗系统事件 ====================

    socket.on('battle:getAvailableNpcs', (data) => {
      const { playerId } = data;
      const npcs = battleSystem.getAvailableNpcs(playerId);
      socket.emit('battle:availableNpcs', npcs);
    });

    socket.on('battle:start', (data) => {
      const { playerId, npcTypeId, formationId = 'default' } = data;
      const empire = gameWorld.empires.get(playerId);
      
      if (!empire) return socket.emit(SOCKET_EVENTS.S_ERROR, { message: '帝国不存在' });
      
      // 获取编队将领
      const general = empire.generals.getFormationGeneral(formationId);
      
      const result = battleSystem.startBattleWithGeneral(playerId, npcTypeId, formationId, general);
      
      if (result.success) {
        socket.emit('battle:started', {
          battleId: result.battleId,
          npc: result.npc,
          general: general ? { name: general.name, rarity: general.rarity } : null,
        });
      } else {
        socket.emit(SOCKET_EVENTS.S_ERROR, { message: result.error });
      }
    });

    socket.on('battle:getStatus', (data) => {
      const { battleId } = data;
      const battle = battleSystem.activeBattles.get(battleId);
      if (!battle) return socket.emit(SOCKET_EVENTS.S_ERROR, { message: '战斗不存在' });
      socket.emit('battle:status', battle.getSnapshot());
    });

    socket.on('battle:getResult', (data) => {
      const { playerId } = data;
      const battle = battleSystem.getPlayerBattle(playerId);
      if (!battle || !battle.result) return socket.emit(SOCKET_EVENTS.S_ERROR, { message: '没有已结束的战斗' });
      socket.emit('battle:result', battle.getResult());
    });

    socket.on('disconnect', () => {
      console.log(`👋 Client disconnected: ${socket.id}`);
    });
  });
}

function createNewEmpire(playerId, playerName, socketId, io) {
  const empire = {
    id: playerId,
    name: `${playerName}的帝国`,
    playerName,
    socketId,
    _io: io,
    createdAt: Date.now(),
    resources: new ResourceComponent(),
    buildings: new BuildingComponent(),
    army: new ArmyComponent(),
    generals: new GeneralComponent(),
    tasks: new TaskComponent(),
    time: new TimeComponent(), // 新增时间组件
  };

  empire.buildings.add('warehouse_basic');
  empire.resources.add('wood', 500);
  empire.resources.add('food', 300);
  empire.resources.add('gold', 100);
  empire.resources.setProductionRate('wood', 50);
  empire.resources.setProductionRate('food', 30);

  return empire;
}