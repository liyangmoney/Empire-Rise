# 🏰 帝国崛起：蛮荒争霸

> 前后端分离的 SLG 游戏 - Node.js + Socket.io + H5客户端

## ✨ 已实现功能

### ✅ 资源系统
- 6种资源：木材/石材/粮食/铁矿/水晶/金币
- 仓库容量与升级
- 自动产出 + 手动采集
- 实时同步

### ✅ 建筑系统
- 伐木场、农场、兵营等基础建筑
- 建筑等级影响产出/容量
- 升级消耗资源

### ✅ 军队系统 (NEW!)
- 3种基础兵种：步兵/弓兵/骑兵
- **兵种克制关系**：步兵→骑兵→弓兵→步兵
- 训练消耗粮食/木材
- 军队上限（由建筑等级决定）
- 士气系统（影响战斗力 ±20%）
- 训练队列（异步完成）
- 粮食消耗与士气惩罚

## 📁 项目结构
```
Empire-Rise/
├── server/
│   ├── src/
│   │   ├── core/
│   │   │   ├── components/
│   │   │   │   ├── ResourceComponent.js
│   │   │   │   ├── BuildingComponent.js
│   │   │   │   └── ArmyComponent.js      # 军队组件
│   │   │   └── systems/
│   │   │       ├── GameLoop.js           # 游戏循环
│   │   │       └── TrainingSystem.js     # 训练系统
│   │   └── network/socket/handlers.js
│   └── package.json
├── client/
│   ├── index.html
│   └── src/main.js
└── shared/
    ├── constants.js
    └── unitTypes.js                      # 兵种配置
```

## 🚀 快速开始

```bash
# 1. 安装依赖
cd server
npm install

# 2. 启动服务端
npm start
# 服务运行在 http://localhost:3000

# 3. 打开客户端
# 浏览器访问 http://localhost:3000
```

## 🎮 游戏指南

### 初始状态
- 基础仓库 Lv1
- 500木材、300粮食、100金币
- 军队上限 50

### 兵种克制
| 兵种 | 克制 | 被克制 | 训练消耗 |
|------|------|--------|----------|
| 步兵 | 骑兵 | 弓兵 | 粮食×20 |
| 弓兵 | 步兵 | 骑兵 | 粮食×25+木材×10 |
| 骑兵 | 弓兵 | 步兵 | 粮食×40+木材×20 |

### 军队上限提升
- 帝国宫殿：每级 +20
- 兵营：每级 +30
- 民居：每级 +10

## 🔌 Socket.io 事件

### 资源/建筑
- `resource:collect` - 手动采集
- `building:upgrade` - 升级建筑

### 军队系统
- `army:train` - 训练士兵
- `army:trainingPreview` - 训练预览
- `army:getStatus` - 获取军队状态
- `army:trainingCompleted` - 训练完成通知

## ⏭️ 开发计划

| 优先级 | 模块 | 状态 |
|--------|------|------|
| P0 | 战斗系统 | 🚧 待开发 |
| P1 | NPC系统 | 🚧 待开发 |
| P2 | 将领系统 | 🚧 待开发 |
| P3 | 科技系统 | 🚧 待开发 |

## 📝 更新日志

### v0.2.0 (2024-02-12)
- ✅ 新增军队系统
- ✅ 兵种克制关系
- ✅ 士气与粮食消耗
- ✅ 训练队列

### v0.1.0
- ✅ 资源系统 MVP
- ✅ 建筑系统 MVP