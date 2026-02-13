// server/src/core/components/TaskComponent.js
import { 
  TASK_TYPES, 
  TASK_STATUS, 
  MAIN_TASKS, 
  DAILY_TASKS_POOL, 
  ACHIEVEMENT_TASKS 
} from '../../../../shared/taskTypes.js';

/**
 * 任务组件 - 管理玩家的所有任务
 */
export class TaskComponent {
  constructor() {
    this.tasks = new Map(); // taskId -> taskData
    this.currentMainTaskId = null; // 当前进行中的主线任务
    this.dailyTasks = []; // 今日日常任务
    this.lastDailyRefresh = null; // 上次刷新时间
    
    // 任务进度统计
    this.progress = {
      train: {}, // { infantry: 5, ... }
      collect: {}, // { wood: 100, ... }
      battle: 0,
      battleWin: 0,
      occupyOutpost: 0,
    };
    
    this.initMainTasks();
  }

  /**
   * 初始化主线任务
   */
  initMainTasks() {
    // 从主线任务链的第一个开始
    if (MAIN_TASKS.length > 0) {
      const firstTask = MAIN_TASKS[0];
      this.tasks.set(firstTask.id, {
        ...firstTask,
        status: TASK_STATUS.PENDING,
        progress: this.initTaskProgress(firstTask.requirements),
        createdAt: Date.now()
      });
      this.currentMainTaskId = firstTask.id;
    }
    
    // 初始化成就任务
    for (const task of ACHIEVEMENT_TASKS) {
      this.tasks.set(task.id, {
        ...task,
        status: TASK_STATUS.PENDING,
        progress: this.initTaskProgress(task.requirements),
        createdAt: Date.now()
      });
    }
  }

  /**
   * 初始化任务进度
   */
  initTaskProgress(requirements) {
    const progress = {};
    for (const [key, value] of Object.entries(requirements)) {
      if (typeof value === 'object') {
        progress[key] = {};
        for (const subKey of Object.keys(value)) {
          progress[key][subKey] = 0;
        }
      } else {
        progress[key] = 0;
      }
    }
    return progress;
  }

  /**
   * 刷新日常任务（基于游戏内时间）
   * @param {number} gameDay 游戏内第几天
   */
  refreshDailyTasks(gameDay) {
    // 如果这一天已经刷新过，不重复刷新
    if (this.lastDailyRefresh === gameDay) {
      return false;
    }
    
    this.lastDailyRefresh = gameDay;
    this.dailyTasks = [];
    
    // 随机选择3个日常任务
    const shuffled = [...DAILY_TASKS_POOL].sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, 3);
    
    for (const task of selected) {
      const taskData = {
        ...task,
        status: TASK_STATUS.PENDING,
        progress: this.initTaskProgress(task.requirements),
        createdAt: Date.now()
      };
      this.dailyTasks.push(taskData);
      this.tasks.set(task.id, taskData);
    }
    
    return true;
  }

  /**
   * 更新任务进度
   */
  updateProgress(type, data) {
    // 更新全局进度
    switch (type) {
      case 'train':
        for (const [unitType, count] of Object.entries(data)) {
          this.progress.train[unitType] = (this.progress.train[unitType] || 0) + count;
        }
        break;
      case 'collect':
        for (const [resource, amount] of Object.entries(data)) {
          this.progress.collect[resource] = (this.progress.collect[resource] || 0) + amount;
        }
        break;
      case 'battle':
        this.progress.battle += data;
        break;
      case 'battleWin':
        this.progress.battleWin += data;
        break;
      case 'occupyOutpost':
        this.progress.occupyOutpost += data;
        break;
    }
    
    // 检查所有进行中的任务
    for (const task of this.tasks.values()) {
      if (task.status === TASK_STATUS.PENDING) {
        this.checkTaskCompletion(task);
      }
    }
  }

  /**
   * 检查任务是否完成
   */
  checkTaskCompletion(task) {
    let completed = true;
    
    for (const [reqType, reqValue] of Object.entries(task.requirements)) {
      switch (reqType) {
        case 'train':
          for (const [unitType, required] of Object.entries(reqValue)) {
            const current = unitType === 'any' 
              ? Object.values(this.progress.train).reduce((a, b) => a + b, 0)
              : (this.progress.train[unitType] || 0);
            task.progress.train[unitType] = current;
            if (current < required) completed = false;
          }
          break;
        case 'collect':
          for (const [resource, required] of Object.entries(reqValue)) {
            const current = this.progress.collect[resource] || 0;
            task.progress.collect[resource] = current;
            if (current < required) completed = false;
          }
          break;
        case 'battle':
          task.progress.battle = this.progress.battle;
          if (this.progress.battle < reqValue) completed = false;
          break;
        case 'battleWin':
          if (typeof reqValue === 'number') {
            task.progress.battleWin = this.progress.battleWin;
            if (this.progress.battleWin < reqValue) completed = false;
          } else {
            // 特定NPC胜利
            for (const [npcType, required] of Object.entries(reqValue)) {
              const current = this.progress.battleWinDetails?.[npcType] || 0;
              task.progress.battleWin[npcType] = current;
              if (current < required) completed = false;
            }
          }
          break;
        case 'totalArmy':
          // 在 empire.army 中检查
          break;
        case 'buildingLevel':
          // 在 empire.buildings 中检查
          break;
        case 'recruitGeneral':
          // 在 empire.generals 中检查
          break;
        case 'empireLevel':
          // 在 empire 中检查
          break;
        case 'occupyOutpost':
          task.progress.occupyOutpost = this.progress.occupyOutpost;
          if (this.progress.occupyOutpost < reqValue) completed = false;
          break;
      }
    }
    
    if (completed) {
      task.status = TASK_STATUS.COMPLETED;
      return true;
    }
    return false;
  }

  /**
   * 领取任务奖励
   */
  claimReward(taskId, empire) {
    const task = this.tasks.get(taskId);
    if (!task || task.status !== TASK_STATUS.COMPLETED) {
      return { success: false, error: '任务未完成或不存在' };
    }
    
    // 发放奖励
    for (const [resource, amount] of Object.entries(task.rewards)) {
      if (resource === 'exp') {
        // 经验奖励给将领
        // 这里简化处理
      } else {
        empire.resources.add(resource, amount);
      }
    }
    
    task.status = TASK_STATUS.CLAIMED;
    task.claimedAt = Date.now();
    
    // 如果是主线任务，解锁下一个
    if (task.type === TASK_TYPES.MAIN && task.nextTaskId) {
      const nextTask = MAIN_TASKS.find(t => t.id === task.nextTaskId);
      if (nextTask) {
        this.tasks.set(nextTask.id, {
          ...nextTask,
          status: TASK_STATUS.PENDING,
          progress: this.initTaskProgress(nextTask.requirements),
          createdAt: Date.now()
        });
        this.currentMainTaskId = nextTask.id;
      }
    }
    
    return { success: true, rewards: task.rewards };
  }

  /**
   * 获取所有任务快照
   */
  getSnapshot(empire) {
    // 刷新日常任务
    this.refreshDailyTasks();
    
    // 检查需要 empire 数据的任务
    for (const task of this.tasks.values()) {
      if (task.status === TASK_STATUS.PENDING) {
        this.checkEmpireBasedTasks(task, empire);
      }
    }
    
    return {
      main: Array.from(this.tasks.values()).filter(t => t.type === TASK_TYPES.MAIN),
      daily: this.dailyTasks,
      achievements: Array.from(this.tasks.values()).filter(t => t.type === TASK_TYPES.ACHIEVEMENT),
      progress: this.progress
    };
  }

  /**
   * 检查依赖 empire 数据的任务
   */
  checkEmpireBasedTasks(task, empire) {
    for (const [reqType, reqValue] of Object.entries(task.requirements)) {
      switch (reqType) {
        case 'totalArmy':
          const currentArmy = empire.army?.getTotalCount() || 0;
          task.progress.totalArmy = currentArmy;
          if (currentArmy >= reqValue) {
            task.status = TASK_STATUS.COMPLETED;
          }
          break;
        case 'buildingLevel':
          for (const [building, level] of Object.entries(reqValue)) {
            const currentLevel = empire.buildings?.getLevel(building) || 0;
            task.progress.buildingLevel = task.progress.buildingLevel || {};
            task.progress.buildingLevel[building] = currentLevel;
            if (currentLevel >= level) {
              task.status = TASK_STATUS.COMPLETED;
            }
          }
          break;
        case 'recruitGeneral':
          const generalCount = empire.generals?.getAll().length || 0;
          task.progress.recruitGeneral = generalCount;
          if (generalCount >= reqValue) {
            task.status = TASK_STATUS.COMPLETED;
          }
          break;
        case 'empireLevel':
          // 简化处理，使用建筑等级计算
          const palaceLevel = empire.buildings?.getLevel('imperial_palace') || 1;
          task.progress.empireLevel = palaceLevel;
          if (palaceLevel >= reqValue) {
            task.status = TASK_STATUS.COMPLETED;
          }
          break;
      }
    }
  }
}