// server/src/index.js
import express from 'express';
import { createServer } from 'http';
import { Server as SocketServer } from 'socket.io';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { registerSocketHandlers } from './network/socket/handlers.js';
import { GameLoop } from './core/systems/GameLoop.js';
import { WorldMapComponent } from './core/components/WorldMapComponent.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 3000;

// 创建 Express 应用
const app = express();
const httpServer = createServer(app);

// 启用 CORS
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST']
}));

// 静态文件服务（托管 H5 客户端）
app.use(express.static(path.join(__dirname, '../../client')));

// 创建 Socket.io 实例
const io = new SocketServer(httpServer, {
  cors: { origin: '*' }
});

// 游戏世界状态（内存存储，生产环境用 Redis）
const gameWorld = {
  players: new Map(),
  empires: new Map(),
  npcs: new Map(),
  tick: 0,
  worldMap: new WorldMapComponent() // 初始化世界地图
};

// 注册 Socket 事件处理器
registerSocketHandlers(io, gameWorld);

// 启动游戏循环
const gameLoop = new GameLoop(gameWorld);
gameLoop.start();
console.log('✅ GameLoop started via index.js');

// 定期广播时间更新（每秒）
setInterval(() => {
  // 向所有连接的客户端广播第一个帝国的时间（如果没有帝国，使用默认时间）
  const empires = gameWorld.empires;
  if (empires.size > 0) {
    const firstEmpire = empires.values().next().value;
    if (firstEmpire && firstEmpire.time) {
      const timeData = firstEmpire.time.getSnapshot();
      io.emit('time:update', timeData);
    }
  }
}, 1000);
console.log('⏰ Time broadcast started (every 1s)');

// 启动服务器
httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Empire Rise Server running on http://localhost:${PORT}`);
});

// 优雅关闭
process.on('SIGTERM', () => {
  console.log('SIGTERM received, closing server...');
  gameLoop.stop();
  httpServer.close(() => {
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('\n🛑 Server stopped by user');
  gameLoop.stop();
  httpServer.close(() => {
    process.exit(0);
  });
});
