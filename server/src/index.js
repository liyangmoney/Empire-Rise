// server/src/index.js
import Fastify from 'fastify';
import { Server as SocketServer } from 'socket.io';
import fastifyCors from '@fastify/cors';
import fastifyStatic from '@fastify/static';
import path from 'path';
import { fileURLToPath } from 'url';
import { registerSocketHandlers } from './network/socket/handlers.js';
import { GameLoop } from './core/systems/GameLoop.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 3000;

// 禁用 diagnostics tracing（避免 Node.js 20 兼容性问题）
process.env.NODE_OPTIONS = '--no-warnings';

// 创建 Fastify 实例
const fastify = Fastify({
  logger: false  // 禁用 logger 避免 diagnostics 问题
});

// 注册插件
await fastify.register(fastifyCors, {
  origin: '*',
  methods: ['GET', 'POST']
});

// 静态文件服务（托管 H5 客户端）
await fastify.register(fastifyStatic, {
  root: path.join(__dirname, '../../client'),
  prefix: '/'
});

// 创建 Socket.io 实例
const io = new SocketServer(fastify.server, {
  cors: { origin: '*' }
});

// 游戏世界状态（内存存储，生产环境用 Redis）
const gameWorld = {
  players: new Map(),      // playerId -> playerData
  empires: new Map(),      // empireId -> empireData
  npcs: new Map(),         // npcId -> npcData
  tick: 0
};

// 注册 Socket 事件处理器
registerSocketHandlers(io, gameWorld);

// 启动游戏循环
const gameLoop = new GameLoop(gameWorld);
gameLoop.start();
console.log('✅ GameLoop started via index.js');

// 启动服务器
fastify.listen({ port: PORT, host: '0.0.0.0' }, (err) => {
  if (err) {
    fastify.log.error(err);
    process.exit(1);
  }
  fastify.log.info(`🚀 Empire Rise Server running on http://localhost:${PORT}`);
});

// 优雅关闭
process.on('SIGTERM', async () => {
  fastify.log.info('SIGTERM received, closing server...');
  gameLoop.stop();
  await fastify.close();
  process.exit(0);
});