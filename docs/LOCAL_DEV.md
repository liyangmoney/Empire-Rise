# 本地开发环境搭建指南

## 前置要求

- Node.js 20+ (推荐 v20.11.1)
- npm 或 yarn
- Git

---

## 1. 克隆项目

```bash
git clone https://github.com/liyangmoney/Empire-Rise.git
cd Empire-Rise
```

---

## 2. 安装依赖

### 服务端依赖
```bash
cd server
npm install
```

### 客户端（可选，本地测试用）
客户端是静态 HTML/JS，无需安装依赖，直接用浏览器打开即可。

---

## 3. 本地运行服务端

```bash
# 在 server 目录下
node src/index.js
```

看到以下输出说明启动成功：
```
✅ GameLoop started via index.js
🎮 GameLoop started
🚀 Empire Rise Server running on http://localhost:3000
```

---

## 4. 访问客户端

### 方式1：直接用浏览器打开（推荐开发调试）
```bash
# 在项目根目录下
open client/index.html        # macOS
start client/index.html       # Windows
xdg-open client/index.html    # Linux
```

### 方式2：通过服务端访问（模拟生产环境）
浏览器访问：`http://localhost:3000`

---

## 5. 开发调试技巧

### 5.1 实时查看日志
服务端日志会直接输出到终端，方便查看：
```
[GameLoop] Tick 1, empires: 0
[GameLoop] Empire xxx: socketId=yes, time=yes
[GameLoop] Sending time:update...
```

### 5.2 修改代码自动重启
使用 nodemon 实现热重载：

```bash
# 安装 nodemon（全局或本地）
npm install -g nodemon

# 使用 nodemon 运行
cd server
nodemon src/index.js
```

### 5.3 浏览器调试
1. 打开 `client/index.html`
2. 按 `F12` 打开控制台
3. 查看 Console 标签页的日志输出

### 5.4 清除玩家数据（重置）
由于是内存存储，重启服务器即可清空所有数据：
```bash
# Ctrl+C 停止服务器
# 重新启动
node src/index.js
```

---

## 6. 目录结构

```
Empire-Rise/
├── client/              # 前端代码
│   ├── index.html       # 主页面
│   └── src/
│       ├── main.js      # 主逻辑
│       └── toast.js     # 提示组件
├── server/              # 后端代码
│   ├── src/
│   │   ├── index.js          # 入口
│   │   ├── core/
│   │   │   ├── components/   # ECS组件
│   │   │   └── systems/      # 游戏系统
│   │   └── network/
│   │       └── socket/
│   │           └── handlers.js
│   └── package.json
└── shared/              # 前后端共用代码
    ├── constants.js
    ├── unitTypes.js
    ├── npcTypes.js
    ├── generalTypes.js
    └── buildingConfig.js
```

---

## 7. 常见问题

### Q1: 端口被占用
```bash
# 修改端口
PORT=3001 node src/index.js
```

### Q2: 跨域问题
如果直接用浏览器打开 client/index.html 有跨域问题：
```bash
# 安装 http-server
npm install -g http-server

# 在 client 目录下启动
http-server -p 8080

# 然后访问 http://localhost:8080
```

### Q3: Socket.io 连接失败
确保服务端已启动，且客户端连接的是正确地址：
```javascript
// client/src/main.js 中默认连接当前 host
const socket = io();

// 如需指定地址
const socket = io('http://localhost:3000');
```

---

## 8. 调试时间系统

如果要看时间系统是否正常工作：

1. **服务端**：查看是否有 `[GameLoop] Sending time:update` 日志
2. **客户端**：浏览器控制台查看 `[Client] Time update received` 日志
3. **两者对比**：确认服务端发送的时间和客户端收到的一致

---

## 9. 添加调试日志

临时添加日志帮助排查问题：

```javascript
// 服务端 (server/src/xxx.js)
console.log('[Debug]', 变量名);

// 客户端 (client/src/main.js)
console.log('[Client Debug]', 变量名);
```

修改后重启服务端或刷新浏览器即可看到日志。

---

## 10. 一键启动脚本

在项目根目录创建 `dev.sh`：

```bash
#!/bin/bash
echo "🎮 Starting Empire Rise in development mode..."

# 启动服务端（后台）
cd server && node src/index.js &
SERVER_PID=$!

# 等待服务端启动
sleep 2

# 打开客户端（macOS）
open client/index.html

echo "✅ Server running at http://localhost:3000"
echo "✅ Client opened"
echo "Press Ctrl+C to stop"

# 捕获 Ctrl+C 停止服务端
trap "kill $SERVER_PID; exit" INT
wait
```

使用：
```bash
chmod +x dev.sh
./dev.sh
```
