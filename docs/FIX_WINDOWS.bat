# 请复制以下命令在 CMD 中执行

cd D:\liyang\learn\Empire-Rise

# 拉取最新代码
git pull origin main

# 进入 server 目录
cd server

# 彻底删除 node_modules 和 package-lock.json
rmdir /s /q node_modules
del /f package-lock.json

# 确认删除成功
dir node_modules 2>nul && echo "删除失败" || echo "删除成功"
dir package-lock.json 2>nul && echo "删除失败" || echo "删除成功"

# 清理 npm 缓存
npm cache clean --force

# 重新安装
npm install

# 运行
node src/index.js
