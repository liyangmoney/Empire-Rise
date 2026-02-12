// shared/timeConfig.js
/**
 * 游戏时间配置
 * 前后端共用
 */

// 游戏时间比例：1现实秒 = X游戏秒
export const TIME_SCALE = {
  NORMAL: 1,      // 正常速度：1秒=1秒
  FAST: 60,       // 快速：1秒=1分钟（60倍）
  SUPER_FAST: 300, // 超快：1秒=5分钟（300倍）
};

// 游戏内时间单位（秒）
export const GAME_TIME = {
  MINUTE: 60,
  HOUR: 3600,
  DAY: 86400,
  WEEK: 604800,
  MONTH: 2592000, // 30天
  YEAR: 31536000, // 365天
};

// 游戏起始日期（可设定为游戏世界观起始时间）
export const GAME_START_YEAR = 1;
export const GAME_START_MONTH = 1;
export const GAME_START_DAY = 1;

/**
 * 将现实毫秒转换为游戏秒
 * @param {number} realMs 现实毫秒
 * @param {number} speed 时间加速倍率
 * @returns {number} 游戏秒数
 */
export function realToGameTime(realMs, speed = TIME_SCALE.NORMAL) {
  return (realMs / 1000) * speed;
}

/**
 * 将游戏秒转换为现实毫秒
 * @param {number} gameSeconds 游戏秒
 * @param {number} speed 时间加速倍率
 * @returns {number} 现实毫秒
 */
export function gameToRealTime(gameSeconds, speed = TIME_SCALE.NORMAL) {
  return (gameSeconds / speed) * 1000;
}

/**
 * 格式化游戏时间为日期字符串
 * @param {number} totalGameSeconds 总游戏秒数
 * @returns {string} 格式化日期 "第X年 Y月 Z日"
 */
export function formatGameDate(totalGameSeconds) {
  const totalDays = Math.floor(totalGameSeconds / GAME_TIME.DAY);
  
  let year = GAME_START_YEAR;
  let month = GAME_START_MONTH;
  let day = GAME_START_DAY + totalDays;
  
  // 处理月份和年份进位
  while (day > 30) {
    day -= 30;
    month++;
    if (month > 12) {
      month = 1;
      year++;
    }
  }
  
  return `第${year}年 ${month}月 ${day}日`;
}

/**
 * 格式化游戏时间为详细字符串
 * @param {number} totalGameSeconds 总游戏秒数
 * @returns {string} 格式化时间 "X年Y月Z日 HH:MM"
 */
export function formatGameDateTime(totalGameSeconds) {
  const dateStr = formatGameDate(totalGameSeconds);
  
  const remainingSeconds = totalGameSeconds % GAME_TIME.DAY;
  const hours = Math.floor(remainingSeconds / GAME_TIME.HOUR);
  const minutes = Math.floor((remainingSeconds % GAME_TIME.HOUR) / GAME_TIME.MINUTE);
  
  const timeStr = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  
  return `${dateStr} ${timeStr}`;
}

/**
 * 获取时间段（用于显示问候语等）
 * @param {number} totalGameSeconds 总游戏秒数
 * @returns {string} 'morning' | 'afternoon' | 'evening' | 'night'
 */
export function getTimeOfDay(totalGameSeconds) {
  const remainingSeconds = totalGameSeconds % GAME_TIME.DAY;
  const hour = Math.floor(remainingSeconds / GAME_TIME.HOUR);
  
  if (hour >= 6 && hour < 12) return 'morning';    // 早晨 6-12
  if (hour >= 12 && hour < 18) return 'afternoon'; // 下午 12-18
  if (hour >= 18 && hour < 22) return 'evening';   // 傍晚 18-22
  return 'night';                                       // 夜晚 22-6
}

/**
 * 获取时间段的中文名称
 */
export function getTimeOfDayName(timeOfDay) {
  const names = {
    morning: '早晨',
    afternoon: '下午',
    evening: '傍晚',
    night: '深夜'
  };
  return names[timeOfDay] || '白天';
}