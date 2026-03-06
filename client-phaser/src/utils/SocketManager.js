import { io } from 'socket.io-client';

/**
 * Socket 连接管理器
 * 管理与服务器的通信
 */
export class SocketManager {
  constructor() {
    this.socket = null;
    this.connected = false;
    this.playerId = null;
    this.playerName = null;
    this.callbacks = new Map();
  }

  connect(serverUrl, playerName) {
    return new Promise((resolve, reject) => {
      this.playerName = playerName;
      this.playerId = 'player_' + Math.random().toString(36).substr(2, 9);
      
      this.socket = io(serverUrl || 'http://localhost:3000');
      
      this.socket.on('connect', () => {
        console.log('✅ 已连接到服务器');
        this.connected = true;
        
        // 发送连接信息
        this.socket.emit('empire:connect', {
          playerId: this.playerId,
          playerName: this.playerName
        });
        
        resolve();
      });
      
      this.socket.on('disconnect', () => {
        console.log('❌ 与服务器断开连接');
        this.connected = false;
        this.trigger('disconnect');
      });
      
      this.socket.on('error', (err) => {
        console.error('服务器错误:', err);
        this.trigger('error', err);
      });
      
      // 通用成功/失败响应
      this.socket.on('success', (data) => {
        this.trigger('success', data);
      });
      
      this.socket.on('error', (data) => {
        this.trigger('error', data);
      });
      
      // 帝国初始化数据
      this.socket.on('empire:init', (data) => {
        this.trigger('empire:init', data);
      });
      
      // 资源更新
      this.socket.on('resource:update', (data) => {
        this.trigger('resource:update', data);
      });
      
      // 建筑更新
      this.socket.on('building:update', (data) => {
        this.trigger('building:update', data);
      });
      
      // 建筑升级预览
      this.socket.on('building:upgradePreview', (data) => {
        this.trigger('building:upgradePreview', data);
      });
      
      // 建筑升级开始
      this.socket.on('building:upgradeStarted', (data) => {
        this.trigger('building:upgradeStarted', data);
      });
      
      // 建筑升级完成
      this.socket.on('building:upgradeCompleted', (data) => {
        this.trigger('building:upgradeCompleted', data);
      });
      
      // 军队更新
      this.socket.on('army:update', (data) => {
        this.trigger('army:update', data);
      });
      
      // 兵种类型
      this.socket.on('army:unitTypes', (data) => {
        this.trigger('army:unitTypes', data);
      });
      
      // 训练更新
      this.socket.on('training:update', (data) => {
        this.trigger('training:update', data);
      });
      
      // 训练预览
      this.socket.on('training:preview', (data) => {
        this.trigger('training:preview', data);
      });
      
      // 战斗结果
      this.socket.on('battle:finished', (data) => {
        this.trigger('battle:finished', data);
      });
      
      // 时间更新
      this.socket.on('time:update', (data) => {
        this.trigger('time:update', data);
      });
      
      // 将领更新
      this.socket.on('general:update', (data) => {
        this.trigger('general:update', data);
      });
      
      // 将领招募结果
      this.socket.on('general:recruitResult', (data) => {
        this.trigger('general:recruitResult', data);
      });
      
      // 任务列表
      this.socket.on('task:list', (data) => {
        this.trigger('task:list', data);
      });
      
      // 任务奖励领取
      this.socket.on('task:rewardClaimed', (data) => {
        this.trigger('task:rewardClaimed', data);
      });
      
      // 人口更新
      this.socket.on('population:update', (data) => {
        this.trigger('population:update', data);
      });
      
      // 体力更新
      this.socket.on('stamina:update', (data) => {
        this.trigger('stamina:update', data);
      });
      
      // 可攻击NPC列表
      this.socket.on('battle:availableNpcs', (data) => {
        this.trigger('battle:availableNpcs', data);
      });
    });
  }

  // 发送事件
  emit(event, data) {
    if (this.socket) {
      this.socket.emit(event, data);
    }
  }

  // 注册回调
  on(event, callback) {
    if (!this.callbacks.has(event)) {
      this.callbacks.set(event, []);
    }
    this.callbacks.get(event).push(callback);
    
    // 返回取消订阅函数
    return () => {
      const callbacks = this.callbacks.get(event);
      if (callbacks) {
        const index = callbacks.indexOf(callback);
        if (index > -1) {
          callbacks.splice(index, 1);
        }
      }
    };
  }

  // 触发回调
  trigger(event, data) {
    const callbacks = this.callbacks.get(event);
    if (callbacks) {
      callbacks.forEach(cb => {
        try {
          cb(data);
        } catch (err) {
          console.error(`回调执行错误 [${event}]:`, err);
        }
      });
    }
  }

  // 断开连接
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.connected = false;
    }
  }

  // ========== API 方法 ==========
  
  // 建筑
  upgradeBuilding(buildingTypeId) {
    this.emit('building:upgrade', { playerId: this.playerId, buildingTypeId });
  }
  
  previewUpgrade(buildingTypeId) {
    this.emit('building:upgradePreview', { playerId: this.playerId, buildingTypeId });
  }

  // 资源采集
  collect(resourceType, amount) {
    this.emit('resource:collect', { playerId: this.playerId, resourceType, amount });
  }

  // 训练军队
  startTraining(unitTypeId, count) {
    this.emit('army:train', { playerId: this.playerId, unitTypeId, count });
  }
  
  previewTraining(unitTypeId, count) {
    this.emit('army:trainingPreview', { playerId: this.playerId, unitTypeId, count });
  }

  // 开始战斗
  startBattle(npcTypeId) {
    this.emit('battle:start', {
      playerId: this.playerId,
      npcTypeId
    });
  }

  // 招募将领
  recruitGeneral(recruitType) {
    this.emit('general:recruit', { playerId: this.playerId, recruitType });
  }

  // 获取NPC列表
  getNpcList() {
    this.emit('battle:getAvailableNpcs', { playerId: this.playerId });
  }

  // 获取任务列表
  getTasks() {
    this.emit('task:list', { playerId: this.playerId });
  }

  // 领取任务奖励
  claimTaskReward(taskId) {
    this.emit('task:claimReward', { playerId: this.playerId, taskId });
  }
  
  // 获取单位类型
  getUnitTypes() {
    this.emit('army:getUnitTypes', { playerId: this.playerId });
  }
}
