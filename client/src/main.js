

// 切换标签页
function switchTab(tabName) {
  // 更新标签按钮样式
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  event.target.classList.add('active');
  
  // 隐藏所有标签内容
  document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
  
  // 显示当前标签内容
  const tabContent = document.getElementById(tabName + 'Tab');
  if (tabContent) tabContent.classList.add('active');
  
  // 特定标签的初始化
  if (tabName === 'map' && socket && playerId) {
    socket.emit('map:getView', { playerId });
  }
}
