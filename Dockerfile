# 使用 Node.js 20 轻量版
FROM node:20-alpine

# 设置工作目录
WORKDIR /app

# 先复制并安装依赖（利用 Docker 缓存层）
COPY server/package.json ./
RUN npm install --production

# 复制服务端代码
COPY server/src/ ./src/

# 复制共享常量
COPY shared/ ./shared/

# 暴露端口
EXPOSE 3000

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000', (r) => r.statusCode === 200 ? process.exit(0) : process.exit(1))"

# 启动命令
CMD ["node", "src/index.js"]