# Windows 完整修复步骤

## 1. 确保在 server 目录
cd D:\liyang\learn\Empire-Rise\server

## 2. 彻底删除 node_modules
# 方法1：使用 PowerShell（推荐）
Remove-Item -Recurse -Force node_modules
Remove-Item -Force package-lock.json

# 方法2：使用 CMD
cd D:\liyang\learn\Empire-Rise\server
rmdir /s /q node_modules
del /f package-lock.json

## 3. 清理 npm 缓存
npm cache clean --force

## 4. 重新安装依赖
npm install

## 5. 运行服务端
node src/index.js
