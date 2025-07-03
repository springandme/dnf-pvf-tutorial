# Docker 部署指南

## 🎯 概述

本文档提供了 DNF PVF 教程阅读器的完整 Docker 部署方案，包括路由优化、数据卷挂载和生产环境部署配置。

## ✨ 新功能特性

### 🔄 自动路由重定向
- 访问 `http://your-domain:7210` 自动重定向到 `/dnf_pvf_tutorial.html`
- 无需手动输入完整路径
- 提升用户体验

### 📁 数据卷挂载
- 支持外部挂载 `pvfCourse` 目录
- 热更新课程数据，无需重新构建镜像
- 数据持久化和备份

### 🚀 多种部署方式
- 简化配置：快速部署
- 完整配置：生产环境
- 自动化脚本：一键部署

## 📋 部署方式对比

| 部署方式 | 适用场景 | 配置文件 | 特性 |
|---------|---------|----------|------|
| 简化部署 | 快速测试、开发环境 | `docker-compose.simple.yml` | 基础功能、最小配置 |
| 完整部署 | 生产环境、长期运行 | `docker-compose.yml` | 健康检查、资源限制、网络配置 |
| 直接 Docker | 单容器部署 | 命令行参数 | 灵活性高、适合集成 |

## 🚀 快速开始

### 方式一：一键部署脚本

**Linux/macOS**:
```bash
# 下载并运行部署脚本
curl -fsSL https://raw.githubusercontent.com/springandme/dnf-pvf-tutorial/master/deploy.sh -o deploy.sh
chmod +x deploy.sh
./deploy.sh --simple
```

**Windows**:
```cmd
# 下载并运行部署脚本
curl -fsSL https://raw.githubusercontent.com/springandme/dnf-pvf-tutorial/master/deploy.bat -o deploy.bat
deploy.bat simple
```

### 方式二：手动部署

1. **准备环境**：
   ```bash
   # 创建部署目录
   mkdir dnf-pvf-tutorial-deploy
   cd dnf-pvf-tutorial-deploy
   
   # 下载配置文件
   curl -O https://raw.githubusercontent.com/springandme/dnf-pvf-tutorial/master/docker-compose.simple.yml
   
   # 下载课程数据
   git clone https://github.com/springandme/dnf-pvf-tutorial.git temp
   cp -r temp/pvfCourse ./
   rm -rf temp
   ```

2. **启动服务**：
   ```bash
   docker-compose -f docker-compose.simple.yml up -d
   ```

3. **访问应用**：
   打开浏览器访问 `http://localhost:7210`

## 📁 目录结构

```
部署目录/
├── docker-compose.yml              # 完整配置文件
├── docker-compose.simple.yml       # 简化配置文件
├── pvfCourse/                      # 课程数据目录（必需）
│   ├── 【01】PVF文件解读/
│   ├── 【02】装备修改/
│   ├── 【03】怪物修改/
│   └── ...
├── logs/                           # 日志目录（可选）
├── deploy.sh                       # Linux/macOS 部署脚本
└── deploy.bat                      # Windows 部署脚本
```

## ⚙️ 配置详解

### 简化配置 (docker-compose.simple.yml)

```yaml
version: '3.8'
services:
  dnf-pvf-tutorial:
    image: ghcr.io/springandme/dnf-pvf-tutorial:latest
    container_name: dnf-pvf-tutorial-simple
    ports:
      - "7210:3000"
    volumes:
      - ./pvfCourse:/app/pvfCourse:ro
    restart: unless-stopped
    environment:
      - NODE_ENV=production
```

**特点**：
- 使用预构建镜像
- 最小配置
- 适合快速部署

### 完整配置 (docker-compose.yml)

```yaml
version: '3.8'
services:
  dnf-pvf-tutorial:
    build:
      context: .
      dockerfile: Dockerfile
      target: production
    container_name: dnf-pvf-tutorial
    ports:
      - "7210:3000"
    volumes:
      - ./pvfCourse:/app/pvfCourse:ro
      - ./logs:/app/logs
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost:3000/api/files"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
    deploy:
      resources:
        limits:
          cpus: '0.5'
          memory: 512M
        reservations:
          cpus: '0.1'
          memory: 128M
    networks:
      - dnf-tutorial-network
```

**特点**：
- 本地构建镜像
- 健康检查
- 资源限制
- 自定义网络

## 🔧 高级配置

### 环境变量

| 变量名 | 默认值 | 说明 |
|--------|--------|------|
| `NODE_ENV` | `production` | 运行环境 |
| `PORT` | `3000` | 容器内端口 |

### 数据卷挂载

```yaml
volumes:
  # 只读挂载课程数据（推荐）
  - ./pvfCourse:/app/pvfCourse:ro
  
  # 读写挂载（如需修改数据）
  - ./pvfCourse:/app/pvfCourse:rw
  
  # 日志目录挂载
  - ./logs:/app/logs
  
  # 使用命名卷
  - tutorial-data:/app/pvfCourse:ro
```

### 网络配置

```yaml
networks:
  dnf-tutorial-network:
    driver: bridge
    ipam:
      config:
        - subnet: 172.20.0.0/16
```

## 🔄 数据更新

### 热更新课程数据

由于使用了数据卷挂载，可以在不重启容器的情况下更新课程数据：

```bash
# 方式一：直接替换文件
cd /path/to/deployment
# 更新 pvfCourse 目录中的文件

# 方式二：使用 Git 同步
git clone https://github.com/springandme/dnf-pvf-tutorial.git temp
rsync -av --delete temp/pvfCourse/ ./pvfCourse/
rm -rf temp

# 验证更新
curl http://localhost:7210/api/files
```

### 自动化更新脚本

```bash
#!/bin/bash
# update-course-data.sh

DEPLOY_DIR="/opt/dnf-pvf-tutorial"
BACKUP_DIR="$DEPLOY_DIR/backups"

cd $DEPLOY_DIR

# 创建备份
mkdir -p $BACKUP_DIR
tar -czf "$BACKUP_DIR/pvfCourse-$(date +%Y%m%d_%H%M%S).tar.gz" pvfCourse/

# 更新数据
git clone https://github.com/springandme/dnf-pvf-tutorial.git temp
rsync -av --delete temp/pvfCourse/ ./pvfCourse/
rm -rf temp

echo "课程数据更新完成"
```

## 🔍 监控和维护

### 健康检查

```bash
# 检查容器状态
docker-compose ps

# 查看健康检查状态
docker inspect dnf-pvf-tutorial | grep -A 10 Health

# 手动健康检查
curl http://localhost:7210/api/files
```

### 日志管理

```bash
# 查看实时日志
docker-compose logs -f dnf-pvf-tutorial

# 查看最近日志
docker-compose logs --tail 100 dnf-pvf-tutorial

# 清理日志
docker system prune -f
```

### 资源监控

```bash
# 查看资源使用
docker stats dnf-pvf-tutorial

# 查看详细信息
docker inspect dnf-pvf-tutorial
```

## 🛠️ 故障排除

### 常见问题

1. **端口冲突**：
   ```bash
   # 检查端口占用
   netstat -tlnp | grep 7210
   # 修改端口映射
   ports:
     - "8080:3000"  # 使用其他端口
   ```

2. **权限问题**：
   ```bash
   # 修复权限
   sudo chown -R 1000:1000 ./pvfCourse
   chmod -R 755 ./pvfCourse
   ```

3. **容器无法启动**：
   ```bash
   # 查看详细错误
   docker-compose logs dnf-pvf-tutorial
   
   # 重新构建
   docker-compose build --no-cache
   ```

4. **数据卷挂载失败**：
   ```bash
   # 检查路径
   ls -la ./pvfCourse
   
   # 使用绝对路径
   volumes:
     - /absolute/path/to/pvfCourse:/app/pvfCourse:ro
   ```

### 性能优化

1. **资源限制调整**：
   ```yaml
   deploy:
     resources:
       limits:
         cpus: '1.0'      # 根据服务器配置调整
         memory: 1G       # 根据需要调整
   ```

2. **日志配置**：
   ```yaml
   logging:
     driver: "json-file"
     options:
       max-size: "10m"
       max-file: "3"
   ```

## 📞 支持

如遇问题，请：
1. 检查本文档的故障排除部分
2. 查看 GitHub Issues
3. 运行配置验证脚本：`node validate-docker-config.js`
