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

/**
 * 显示模态错误弹窗（类似资源消耗确认弹窗样式）
 * @param {string} title 标题
 * @param {string} message 错误内容
 */
function showErrorModal(title, message) {
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
      border: 2px solid #f44336;
      border-radius: 12px;
      padding: 30px;
      max-width: 400px;
      width: 90%;
      text-align: center;
    ">
      <h3 style="color: #f44336; margin-bottom: 15px;">❌ ${title}</h3>
      
      <div style="margin: 15px 0; padding: 15px; background: rgba(244,67,54,0.1); border-radius: 8px;">
        <p style="color: #fff; font-size: 16px;">${message}</p>
      </div>
      
      <div style="margin-top: 20px;">
        <button onclick="this.closest('.error-modal').remove()" 
                style="background: #f44336; padding: 12px 40px; font-size: 16px;">确定</button>
      </div>
    </div>
  `;
  
  modal.className = 'error-modal';
  document.body.appendChild(modal);
  
  // 点击背景关闭
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.remove();
    }
  });
}

window.showErrorModal = showErrorModal;