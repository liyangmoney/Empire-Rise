# 使用 Node.js 20 轻量版
FROM node:20-alpine

# 设置工作目录
WORKDIR /app

# 复制服务端、客户端、共享代码
COPY server/ ./server/
COPY client/ ./client/
COPY shared/ ./shared/

# 进入 server 目录安装依赖
WORKDIR /app/server
RUN npm install --production

# 暴露端口
EXPOSE 3000

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000', (r) => r.statusCode === 200 ? process.exit(0) : process.exit(1))"

# 启动命令
CMD ["node", "src/index.js"]