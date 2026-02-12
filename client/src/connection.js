
// 更新连接状态指示器
function updateConnectionStatus(isConnected) {
  const dot = document.getElementById('connectionDot');
  const text = document.getElementById('connectionText');
  
  if (dot && text) {
    if (isConnected) {
      dot.style.background = '#4CAF50';
      text.textContent = '在线';
    } else {
      dot.style.background = '#f44336';
      text.textContent = '离线';
    }
  }
}
