# 🏰 Empire Rise（帝国崛起）

> 前后端分离的 SLG 策略游戏 | Node.js + Socket.io + H5客户端
> 
> 🐳 **支持 Docker 一键部署** | 🎮 **实时多人对战** | ⚔️ **深度策略战斗**

---

## ✨ 游戏特色

### 🌾 资源经济系统
- **6种核心资源**：木材、石材、粮食、铁矿、水晶、金币
- **动态产出**：建筑等级影响资源产量
- **仓库管理**：容量限制，需要策略性升级
- **实时同步**：Socket.io 实现秒级数据同步

### 🏛️ 建筑发展系统
- **多类型建筑**：伐木场、农场、兵营、医院、仓库等
- **等级体系**：每级提升产出/容量/功能
- **升级队列**：支持多建筑同时升级
- **消耗策略**：平衡资源投入与产出

### ⚔️ 深度战斗系统
- **兵种克制**：步兵 → 骑兵 → 弓兵 → 步兵（三角克制）
- **士气机制**：影响战斗力 ±20%，粮食不足会下降
- **自动战斗**：10回合智能结算，即时反馈
- **伤亡系统**：阵亡+伤病，医院可恢复伤兵
- **动态难度**：NPC根据玩家战力自动调整

### 🎯 丰富的PVE内容
| NPC类型 | 难度 | 主要掉落 |
|---------|------|----------|
| 野狼/野猪 | ⭐ | 木材、粮食 |
| 山贼营地 | ⭐⭐ | 木材、粮食、铁矿 |
| 矿场守卫 | ⭐⭐⭐ | 铁矿、将领碎片 |
| 小型城邦 | ⭐⭐⭐⭐⭐ | 水晶、金币、稀有道具 |

---

## 🚀 快速开始

### 方式一：Docker 一键部署（推荐）

```bash
# 1. 克隆项目
git clone https://github.com/liyangmoney/Empire-Rise.git
cd Empire-Rise

# 2. 启动服务
docker-compose up --build

# 3. 浏览器访问
# http://localhost:3000
```

### 方式二：手动运行

```bash
# 服务端
cd server
npm install
npm run dev

# 客户端（直接打开）
open client/index.html
```

---

## 🎮 游戏指南

### 核心玩法循环
```
收集资源 → 建设建筑 → 训练军队 → 攻打NPC → 获取奖励 → 扩张帝国
```

### 兵种克制关系
| 兵种 | 克制 | 被克制 | 训练消耗 | 特点 |
|------|------|--------|----------|------|
| **步兵** | 骑兵 | 弓兵 | 粮食×20 | 高防御 |
| **弓兵** | 步兵 | 骑兵 | 粮食×25+木材×10 | 高攻击 |
| **骑兵** | 弓兵 | 步兵 | 粮食×40+木材×20 | 高机动 |

**克制系数**：克制方 1.5倍伤害，被克制方 0.7倍

### 战斗流程
1. 点击「🎯 战斗」标签
2. 选择目标NPC（绿色=推荐，红色=危险）
3. 配置出征军队
4. 点击「发起攻击」
5. 查看战报和奖励

---

## 🏗️ 技术架构

### 后端技术栈
- **Node.js** + **Express** - Web服务框架
- **Socket.io** - 实时双向通信
- **ES6 Modules** - 现代模块化
- **Docker** - 容器化部署

### 前端技术栈
- **原生 JavaScript** - 无框架依赖
- **Socket.io Client** - 实时通信
- **CSS3** - 响应式布局

### 核心设计模式
- **ECS架构** - Entity-Component-System
- **事件驱动** - Socket.io 事件系统
- **状态同步** - 服务端权威状态

---

## 📁 项目结构

```
Empire-Rise/
├── 📁 server/                    # 服务端
│   ├── 📁 src/
│   │   ├── 📁 core/
│   │   │   ├── 📁 components/    # ECS组件
│   │   │   │   ├── ResourceComponent.js    # 资源组件
│   │   │   │   ├── BuildingComponent.js    # 建筑组件
│   │   │   │   ├── ArmyComponent.js        # 军队组件
│   │   │   │   └── BattleComponent.js      # 战斗组件
│   │   │   └── 📁 systems/       # ECS系统
│   │   │       ├── GameLoop.js              # 游戏主循环
│   │   │       ├── TrainingSystem.js        # 训练系统
│   │   │       └── BattleSystem.js          # 战斗系统
│   │   ├── 📁 network/
│   │   │   └── socket/handlers.js  # Socket事件处理
│   │   └── index.js
│   ├── 📄 package.json
│   └── 📄 Dockerfile
├── 📁 client/                    # H5客户端
│   ├── 📄 index.html
│   ├── 📁 src/
│   │   └── main.js              # 游戏主逻辑
│   └── 📁 css/
├── 📁 shared/                    # 共享配置
│   ├── constants.js             # 游戏常量
│   ├── unitTypes.js             # 兵种配置
│   └── npcTypes.js              # NPC配置
├── 📄 docker-compose.yml
└── 📄 README.md
```

---

## 🔌 API 事件文档

### 连接与基础
| 事件 | 方向 | 说明 |
|------|------|------|
| `empire:connect` | C→S | 玩家连接 |
| `empire:data` | S→C | 返回玩家数据 |

### 资源系统
| 事件 | 方向 | 说明 |
|------|------|------|
| `resource:collect` | C→S | 采集资源 |
| `resource:upgradeStorage` | C→S | 升级仓库 |

### 建筑系统
| 事件 | 方向 | 说明 |
|------|------|------|
| `building:upgrade` | C→S | 升级建筑 |
| `building:upgrade:progress` | S→C | 升级进度 |
| `building:upgrade:complete` | S→C | 升级完成 |

### 军队系统
| 事件 | 方向 | 说明 |
|------|------|------|
| `army:getUnitTypes` | C→S | 获取兵种信息 |
| `army:train` | C→S | 训练士兵 |
| `army:training:progress` | S→C | 训练进度 |
| `army:training:complete` | S→C | 训练完成 |

### 战斗系统
| 事件 | 方向 | 说明 |
|------|------|------|
| `battle:getAvailableNpcs` | C→S | 获取可挑战NPC |
| `battle:start` | C→S | 发起战斗 |
| `battle:started` | S→C | 战斗开始 |
| `battle:finished` | S→C | 战斗结果+战报 |

---

## 🗺️ 开发路线图

| 版本 | 功能 | 状态 |
|------|------|------|
| v0.1 | 资源系统 MVP | ✅ 已完成 |
| v0.2 | 建筑系统 + 军队系统 | ✅ 已完成 |
| v0.3 | 战斗系统 + NPC | ✅ 已完成 |
| v0.4 | 将领系统 | 🚧 开发中 |
| v0.5 | 装备系统 | 📋 计划中 |
| v0.6 | 科技系统 | 📋 计划中 |
| v1.0 | PVP对战 + 联盟系统 | 📋 计划中 |

---

## 📝 更新日志

### v0.3.0 (2024-02-12)
- ✅ 战斗系统 MVP
- ✅ NPC敌人（野怪/据点/城邦）
- ✅ 自动战斗与战报
- ✅ 资源掠夺与掉落

### v0.2.0
- ✅ 军队系统
- ✅ 兵种克制
- ✅ 士气系统

### v0.1.0
- ✅ 资源系统 MVP
- ✅ 建筑系统 MVP

---

## 🤝 贡献指南

欢迎提交 Issue 和 PR！

1. Fork 项目
2. 创建分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送分支 (`git push origin feature/AmazingFeature`)
5. 创建 Pull Request

---

## 📄 许可证

MIT License

---

## 📮 联系方式

- GitHub Issues: [提交问题](https://github.com/liyangmoney/Empire-Rise/issues)
- 项目主页: https://github.com/liyangmoney/Empire-Rise

---

> 🎮 **开始你的帝国征程吧！**
