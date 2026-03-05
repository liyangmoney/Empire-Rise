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
      
      this.socket = io(serverUrl || window.location.origin);
      
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
        reject(err);
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
      
      // 军队更新
      this.socket.on('army:update', (data) => {
        this.trigger('army:update', data);
      });
      
      // 训练更新
      this.socket.on('training:update', (data) => {
        this.trigger('training:update', data);
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
      
      // 任务更新
      this.socket.on('task:update', (data) => {
        this.trigger('task:update', data);
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

  // API 方法
  // 建筑
  upgradeBuilding(buildingId) {
    this.emit('building:upgrade', { playerId: this.playerId, buildingId });
  }

  // 资源采集
  collect(resourceType, amount) {
    this.emit('resource:collect', { playerId: this.playerId, resourceType, amount });
  }

  // 训练军队
  startTraining(unitType, count) {
    this.emit('training:start', { playerId: this.playerId, unitType, count });
  }

  // 开始战斗
  startBattle(npcId, formation, generalId) {
    this.emit('battle:start', {
      playerId: this.playerId,
      npcId,
      formation,
      generalId
    });
  }

  // 招募将领
  recruitGeneral(type) {
    this.emit('general:recruit', { playerId: this.playerId, type });
  }

  // 获取NPC列表
  getNpcList() {
    this.emit('battle:getAvailableNpcs', { playerId: this.playerId });
  }

  // 获取任务列表
  getTasks() {
    this.emit('task:get', { playerId: this.playerId });
  }

  // 完成任务
  completeTask(taskId) {
    this.emit('task:complete', { playerId: this.playerId, taskId });
  }
}
