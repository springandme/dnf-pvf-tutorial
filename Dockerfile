# ---- 构建阶段 (builder) ----
# 使用 node:18-alpine 作为基础镜像，它是一个轻量级的 Node.js 环境
FROM node:18-alpine AS builder

# 设置工作目录
WORKDIR /app

# 拷贝 package.json 和 package-lock.json
# 分离这一步可以更好地利用 Docker 的层缓存机制
COPY package*.json ./

# 安装所有依赖，包括开发依赖
RUN npm install

# 拷贝项目源代码
COPY . .

# ---- 生产阶段 (production) ----
# 同样使用 node:18-alpine 作为基础镜像
FROM node:18-alpine AS production

# 安装 curl 用于健康检查
RUN apk add --no-cache curl

# 设置工作目录
WORKDIR /app

# 从构建阶段拷贝优化过的 node_modules
# --production 标志确保只拷贝生产环境所需的依赖
COPY --from=builder /app/node_modules ./node_modules

# 从构建阶段拷贝应用源代码
COPY --from=builder /app ./

# 创建一个低权限的用户来运行应用，增强安全性
RUN addgroup -S nodeuser && adduser -S nodeuser -G nodeuser
USER nodeuser

# 设置环境变量为生产环境
ENV NODE_ENV=production

# 暴露应用运行的端口
EXPOSE 3000

# 添加健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/ || exit 1

# 定义容器启动时执行的命令
CMD ["node", "server.js"]