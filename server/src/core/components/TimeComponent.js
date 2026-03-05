// server/src/core/components/TimeComponent.js
import { 
  TIME_SCALE, 
  GAME_TIME, 
  realToGameTime,
  formatGameDate,
  formatGameDateTime,
  getTimeOfDay
} from '../../../../shared/timeConfig.js';

/**
 * 时间组件 - 管理游戏内时间流逝
 */
export class TimeComponent {
  constructor() {
    // 设置起始时间为 2026-02-13 00:00:00 的时间戳
    const startDate = new Date(2026, 1, 13, 0, 0, 0); // 月份从0开始，1=2月
    this.startTime = startDate.getTime();
    
    this.totalPausedTime = 0;
    this.lastPauseTime = null;
    this.speed = TIME_SCALE.NORMAL;
    this.isPaused = false;
    
    this.gameDaysPassed = 0;
    this.lastDayChecked = 0;
    
    this.dayCallbacks = [];
    this.hourCallbacks = [];
  }

  /**
   * 获取当前游戏时间（总秒数）
   */
  getCurrentGameTime() {
    if (this.isPaused) {
      const pausedDuration = Date.now() - this.lastPauseTime;
      return realToGameTime(
        this.lastPauseTime - this.startTime - this.totalPausedTime,
        this.speed
      );
    }
    
    const elapsedRealTime = Date.now() - this.startTime - this.totalPausedTime;
    return realToGameTime(elapsedRealTime, this.speed);
  }

  /**
   * 获取游戏时间快照（时分秒与现实时间同步）
   */
  getSnapshot() {
    // 使用现实时间的时分秒，但日期从游戏起始日开始
    const now = new Date();
    const realHours = now.getHours();
    const realMinutes = now.getMinutes();
    const realSeconds = now.getSeconds();
    
    // 计算从起始日期到现在的天数（只取整天）
    const currentGameTime = this.getCurrentGameTime();
    const daysPassed = Math.floor(currentGameTime / GAME_TIME.DAY);
    
    // 游戏内总秒数 = 天数 + 今天的时间（使用现实时间）
    const todaySeconds = realHours * 3600 + realMinutes * 60 + realSeconds;
    const gameTime = daysPassed * GAME_TIME.DAY + todaySeconds;
    
    const timeOfDay = getTimeOfDay(todaySeconds); // 基于现实时间判断时间段
    
    return {
      gameTime,
      gameDate: formatGameDate(gameTime),
      gameDateTime: formatGameDateTime(gameTime),
      timeOfDay,
      timeOfDayName: this.getTimeOfDayName(timeOfDay),
      speed: this.speed,
      speedName: this.getSpeedName(this.speed),
      isPaused: this.isPaused,
      dayCount: daysPassed,
      // 添加现实时间信息
      realTime: `${realHours.toString().padStart(2, '0')}:${realMinutes.toString().padStart(2, '0')}:${realSeconds.toString().padStart(2, '0')}`
    };
  }

  /**
   * 设置时间速度
   */
  setSpeed(speed) {
    if (Object.values(TIME_SCALE).includes(speed)) {
      // 如果正在暂停状态，先记录当前时间再切换
      if (this.isPaused) {
        this.resume();
      }
      this.speed = speed;
      return true;
    }
    return false;
  }

  /**
   * 暂停时间
   */
  pause() {
    if (!this.isPaused) {
      this.isPaused = true;
      this.lastPauseTime = Date.now();
      return true;
    }
    return false;
  }

  /**
   * 恢复时间
   */
  resume() {
    if (this.isPaused) {
      const pausedDuration = Date.now() - this.lastPauseTime;
      this.totalPausedTime += pausedDuration;
      this.isPaused = false;
      this.lastPauseTime = null;
      return true;
    }
    return false;
  }

  /**
   * 切换暂停状态
   */
  togglePause() {
    if (this.isPaused) {
      return this.resume();
    } else {
      return this.pause();
    }
  }

  /**
   * 检查是否需要触发新的一天事件
   * 由 GameLoop 每帧调用
   */
  checkNewDayEvents() {
    const gameTime = this.getCurrentGameTime();
    const currentDay = Math.floor(gameTime / GAME_TIME.DAY);
    
    if (currentDay > this.lastDayChecked) {
      // 新的一天
      const daysPassed = currentDay - this.lastDayChecked;
      for (let i = 0; i < daysPassed; i++) {
        this.triggerDayEvent(this.lastDayChecked + i + 1);
      }
      this.lastDayChecked = currentDay;
      this.gameDaysPassed = currentDay;
      return true;
    }
    return false;
  }

  /**
   * 触发新的一天事件
   */
  triggerDayEvent(dayNumber) {
    for (const callback of this.dayCallbacks) {
      try {
        callback(dayNumber);
      } catch (err) {
        console.error('Day callback error:', err);
      }
    }
  }

  /**
   * 注册新的一天回调
   */
  onNewDay(callback) {
    this.dayCallbacks.push(callback);
    return () => {
      const index = this.dayCallbacks.indexOf(callback);
      if (index > -1) {
        this.dayCallbacks.splice(index, 1);
      }
    };
  }

  /**
   * 获取速度名称
   */
  getSpeedName(speed) {
    const names = {
      [TIME_SCALE.NORMAL]: '正常',
      [TIME_SCALE.FAST]: '快速(60x)',
      [TIME_SCALE.SUPER_FAST]: '极速(300x)',
    };
    return names[speed] || '正常';
  }

  /**
   * 获取时间段名称
   */
  getTimeOfDayName(timeOfDay) {
    const names = {
      morning: '☀️ 早晨',
      afternoon: '🌤️ 下午',
      evening: '🌅 傍晚',
      night: '🌙 深夜'
    };
    return names[timeOfDay] || '白天';
  }

  /**
   * 快进时间（用于测试或特殊事件）
   * @param {number} gameSeconds 要快进的游戏秒数
   */
  fastForward(gameSeconds) {
    // 通过调整 startTime 来快进
    // 负值表示往前调（实际是让 startTime 更早）
    const realMsToAdjust = -(gameSeconds / this.speed) * 1000;
    this.startTime += realMsToAdjust;
    
    // 触发新的一天检查
    this.checkNewDayEvents();
    
    return this.getSnapshot();
  }

  /**
   * 获取距离下次每日刷新还有多少游戏时间
   */
  getTimeUntilNextDay() {
    const gameTime = this.getCurrentGameTime();
    const currentDayStart = Math.floor(gameTime / GAME_TIME.DAY) * GAME_TIME.DAY;
    const nextDayStart = currentDayStart + GAME_TIME.DAY;
    return nextDayStart - gameTime;
  }

  /**
   * 格式化剩余时间为可读字符串
   */
  formatTimeRemaining(seconds) {
    const hours = Math.floor(seconds / GAME_TIME.HOUR);
    const minutes = Math.floor((seconds % GAME_TIME.HOUR) / GAME_TIME.MINUTE);
    
    if (hours > 0) {
      return `${hours}小时${minutes}分钟`;
    }
    return `${minutes}分钟`;
  }
}