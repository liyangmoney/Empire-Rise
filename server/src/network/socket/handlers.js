// server/src/network/socket/handlers.js
import { SOCKET_EVENTS } from '../../../../shared/constants.js';
import { ResourceComponent } from '../../core/components/ResourceComponent.js';
import { BuildingComponent } from '../../core/components/BuildingComponent.js';

/**
 * 注册所有 Socket.io 事件处理器
 */
export function registerSocketHandlers(io, gameWorld) {
  io.on('connection', (socket) => {
    console.log(`👤 Client connected: ${socket.id}`);

    // 玩家连接 - 创建/加载帝国
    socket.on(SOCKET_EVENTS.C_EMPIRE_CONNECT, (data) => {
      const { playerId, playerName } = data;
      
      // 创建新帝国或加载现有
      let empire = gameWorld.empires.get(playerId);
      if (!empire) {
        empire = createNewEmpire(playerId, playerName, socket.id, io);
        gameWorld.empires.set(playerId, empire);
        console.log(`🏰 New empire created for ${playerName} (${playerId})`);
      } else {
        empire.socketId = socket.id;
        empire._io = io;
      }

      // 发送初始数据
      socket.emit('empire:init', {
        playerId,
        resources: empire.resources.getSnapshot(),
        buildings: empire.buildings.getSnapshot()
      });
    });

    // 采集资源（手动采集地图资源点）
    socket.on(SOCKET_EVENTS.C_RESOURCE_COLLECT, (data) => {
      const { playerId, resourceType, amount } = data;
      const empire = gameWorld.empires.get(playerId);
      
      if (!empire) {
        socket.emit(SOCKET_EVENTS.S_ERROR, { message: 'Empire not found' });
        return;
      }

      const result = empire.resources.add(resourceType, amount);
      socket.emit(SOCKET_EVENTS.S_RESOURCE_UPDATE, {
        resourceId: resourceType,
        result,
        allResources: empire.resources.getSnapshot()
      });
    });

    // 升级建筑
    socket.on(SOCKET_EVENTS.C_BUILDING_UPGRADE, (data) => {
      const { playerId, buildingTypeId, cost } = data;
      const empire = gameWorld.empires.get(playerId);
      
      if (!empire) {
        socket.emit(SOCKET_EVENTS.S_ERROR, { message: 'Empire not found' });
        return;
      }

      // 检查资源是否足够
      if (!empire.resources.hasAll(cost)) {
        socket.emit(SOCKET_EVENTS.S_ERROR, { message: 'Insufficient resources' });
        return;
      }

      // 扣除资源
      for (const [resId, amount] of Object.entries(cost)) {
        empire.resources.consume(resId, amount);
      }

      // 执行升级
      const building = empire.buildings.upgrade(buildingTypeId);
      if (!building) {
        empire.buildings.add(buildingTypeId); // 新建
      }

      // 如果是仓库，更新容量
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

    socket.on('disconnect', () => {
      console.log(`👋 Client disconnected: ${socket.id}`);
      // 可选：标记玩家离线，保留数据
    });
  });
}

/**
 * 创建新帝国
 */
function createNewEmpire(playerId, playerName, socketId, io) {
  const empire = {
    id: playerId,
    name: `${playerName}的帝国`,
    playerName,
    socketId,
    _io: io,
    createdAt: Date.now(),
    resources: new ResourceComponent(),
    buildings: new BuildingComponent()
  };

  // 初始建筑：基础仓库 Lv1
  empire.buildings.add('warehouse_basic');
  
  // 初始资源
  empire.resources.add('wood', 500);
  empire.resources.add('food', 300);
  empire.resources.add('gold', 100);

  // 初始产出（基础采集速度）
  empire.resources.setProductionRate('wood', 50);   // 每小时50
  empire.resources.setProductionRate('food', 30);   // 每小时30

  return empire;
}