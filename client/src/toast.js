// client/src/toast.js
/**
 * 全局提示组件 - 错误/成功/警告消息
 */

// 创建提示容器
function createToastContainer() {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }
  return container;
}

/**
 * 显示提示
 * @param {string} message 提示内容
 * @param {string} type 类型: error|success|warning|info
 * @param {number} duration 显示时长(毫秒), 0表示不自动关闭
 */
function showToast(message, type = 'info', duration = 5000) {
  const container = createToastContainer();
  
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  
  // 图标
  const icons = {
    error: '❌',
    success: '✅',
    warning: '⚠️',
    info: 'ℹ️'
  };
  
  toast.innerHTML = `
    <span class="toast-icon">${icons[type] || icons.info}</span>
    <span class="toast-message">${message}</span>
    <button class="toast-close" onclick="this.parentElement.remove()">×</button>
  `;
  
  container.appendChild(toast);
  
  // 自动关闭
  if (duration > 0) {
    setTimeout(() => {
      if (toast.parentElement) {
        toast.classList.add('hiding');
        setTimeout(() => toast.remove(), 300);
      }
    }, duration);
  }
  
  return toast;
}

// 快捷方法
function showError(message, duration = 5000) {
  return showToast(message, 'error', duration);
}

function showSuccess(message, duration = 3000) {
  return showToast(message, 'success', duration);
}

function showWarning(message, duration = 4000) {
  return showToast(message, 'warning', duration);
}

function showInfo(message, duration = 3000) {
  return showToast(message, 'info', duration);
}

// 导出到全局
window.showToast = showToast;
window.showError = showError;
window.showSuccess = showSuccess;
window.showWarning = showWarning;
window.showInfo = showInfo;