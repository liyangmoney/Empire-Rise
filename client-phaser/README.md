# 帝国崛起 - Phaser 3 客户端

## 技术栈
- **Phaser 3.70** - 游戏引擎
- **Vite 5** - 构建工具
- **Socket.IO** - 实时通信

## 快速开始

### 1. 安装依赖
```bash
cd client-phaser
npm install
```

### 2. 开发模式
```bash
npm run dev
# 访问 http://localhost:13001
```

### 3. 生产构建
```bash
npm run build
```

## 项目结构

```
client-phaser/
├── index.html              # 入口 HTML
├── package.json            # 依赖配置
├── vite.config.js          # Vite 配置
└── src/
    ├── main.js             # 游戏入口
    ├── scenes/             # 游戏场景
    │   ├── BootScene.js    # 启动加载
    │   ├── MenuScene.js    # 登录菜单
    │   ├── GameScene.js    # 游戏主界面
    │   └── BattleScene.js  # 战斗场景
    └── ui/                 # UI 组件
        ├── ResourcePanel.js
        ├── BuildingPanel.js
        ├── ArmyPanel.js
        ├── GeneralPanel.js
        ├── BattlePanel.js
        ├── TaskPanel.js
        └── TimeDisplay.js
```

## 迁移进度

### Phase 1 - 基础框架 ✅
- [x] Phaser 3 项目初始化
- [x] Socket.IO 集成
- [x] 场景管理（Boot/Menu/Game/Battle）
- [x] 基础 UI 组件

### Phase 2 - 核心功能 ⏳
- [ ] 资源系统完整实现
- [ ] 建筑系统完整实现
- [ ] 军队系统完整实现
- [ ] 将领系统完整实现
- [ ] 战斗系统完整实现
- [ ] 任务系统完整实现

### Phase 3 - 优化 ⏳
- [ ] 动画效果优化
- [ ] 移动端适配
- [ ] 性能优化
- [ ] 音效系统

## 与原客户端对比

| 特性 | 原客户端 | Phaser 3 |
|------|----------|----------|
| 渲染方式 | DOM + CSS | Canvas/WebGL |
| 性能 | 一般 | 优秀 |
| 动画系统 | 简单 | 完整时间线 |
| 移动端 | 需要手动适配 | 内置支持 |
| 游戏循环 | 手动实现 | 内置优化 |
| 学习曲线 | 低 | 中等 |

## 下一步

1. 完成各个系统的 UI 实现
2. 添加战斗动画
3. 优化移动端体验
4. 添加音效系统

## 参考资源

- [Phaser 3 文档](https://photonstorm.github.io/phaser3-docs/)
- [Phaser 3 示例](https://phaser.io/examples)
- [Phaser 3 中文教程](https://phaser.tips/)
