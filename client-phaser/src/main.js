import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene.js';
import { MenuScene } from './scenes/MenuScene.js';
import { GameScene } from './scenes/GameScene.js';
import { BattleScene } from './scenes/BattleScene.js';
import { SocketManager } from './utils/SocketManager.js';

// 游戏配置
const config = {
  type: Phaser.AUTO,
  width: 1280,
  height: 720,
  parent: 'game-container',
  backgroundColor: '#1a1a2e',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 0 },
      debug: false
    }
  },
  dom: {
    createContainer: true
  },
  scene: [BootScene, MenuScene, GameScene, BattleScene],
  pixelArt: false,
  antialias: true
};

// 初始化 Socket 管理器
window.socketManager = new SocketManager();

// 创建游戏实例
const game = new Phaser.Game(config);

// 隐藏加载画面
window.hideLoading = () => {
  const loading = document.getElementById('loading');
  if (loading) {
    loading.classList.add('hidden');
  }
};

// 更新加载进度
window.updateProgress = (progress, text) => {
  const bar = document.getElementById('progressBar');
  const textEl = document.getElementById('progressText');
  if (bar) bar.style.width = progress + '%';
  if (textEl) textEl.textContent = text;
};

export default game;
