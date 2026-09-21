# DNF PVF 教程阅读器

一个用于学习和查看 DNF PVF 文件修改教程的 Web 应用程序。

## 🎯 项目简介

这是一个基于 Node.js 和 Express 的 Web 应用，提供了一个友好的界面来浏览和学习 DNF（地下城与勇士）PVF 文件修改教程。项目包含了丰富的教程内容，涵盖装备修改、怪物修改、技能修改等多个方面。

## ✨ 功能特点

- 📚 **丰富的教程内容**: 包含装备、怪物、技能、NPC、任务等各类修改教程
- 🌐 **Web 界面**: 提供直观的文件树浏览和内容查看
- 🔍 **快速搜索**: 支持教程内容的快速查找
- 📱 **响应式设计**: 适配不同设备屏幕
- 💾 **本地缓存**: 提升浏览体验

## 🚀 快速开始

### 在线访问

访问 GitHub Pages 部署的在线版本：
[https://springandme.github.io/dnf-pvf-tutorial/](https://springandme.github.io/dnf-pvf-tutorial/)

### 本地运行

1. **克隆项目**
   ```bash
   git clone https://github.com/springandme/dnf-pvf-tutorial.git
   cd dnf-pvf-tutorial
   ```

2. **安装依赖**
   ```bash
   npm install
   ```

3. **启动服务器**
   ```bash
   npm start
   ```

4. **访问应用**
   打开浏览器访问 `http://localhost:3000`

## 📁 项目结构

```
dnf-pvf-tutorial/
├── pvfCourse/              # 教程内容目录
│   ├── 【01】PVF文件解读/
│   ├── 【02】装备修改/
│   ├── 【03】怪物修改/
│   ├── 【04】技能修改/
│   └── ...
├── dnf_pvf_tutorial.html   # 主页面
├── style.css              # 样式文件
├── server.js              # Express 服务器
├── package.json           # 项目配置
└── README.md              # 项目说明
```

## 🛠️ 技术栈

- **后端**: Node.js + Express
- **前端**: HTML5 + CSS3 + JavaScript
- **部署**: GitHub Pages + GitHub Actions
- **容器化**: Docker (可选)

## 📖 教程内容

项目包含以下主要教程分类：

1. **PVF文件解读** - 基础知识和文件结构
2. **装备修改** - 武器、防具、饰品等装备相关修改
3. **怪物修改** - 怪物属性、AI、掉落等修改
4. **技能修改** - 职业技能、效果、伤害等修改
5. **NPC修改** - 商店、对话、任务NPC等修改
6. **任务修改** - 任务流程、奖励、条件等修改
7. **地图修改** - 地图属性、传送、背景等修改
8. **时装修改** - 外观、属性、特效等修改
9. **物品修改** - 道具、材料、消耗品等修改
10. **高级教程** - 进阶技巧和复杂修改

## 🔧 开发

### 本地开发

```bash
# 安装依赖
npm install

# 启动开发服务器
npm start

# 代码检查（如果配置了 ESLint）
npm run lint

# 运行测试（如果有测试）
npm test
```

### Docker 部署

#### 方式一：使用 docker-compose（推荐）

**快速部署**：
```bash
# 使用简化配置快速启动
docker-compose -f docker-compose.simple.yml up -d

# 访问应用
# http://localhost:7210 (自动重定向到首页)
```

**完整部署**：
```bash
# 使用完整配置启动（包含健康检查、资源限制等）
docker-compose up -d

# 查看运行状态
docker-compose ps

# 查看日志
docker-compose logs -f dnf-pvf-tutorial

# 停止服务
docker-compose down
```

#### 方式二：直接使用 Docker

```bash
# 使用预构建镜像
docker run -d \
  --name dnf-pvf-tutorial \
  -p 7210:3000 \
  -v $(pwd)/pvfCourse:/app/pvfCourse:ro \
  --restart unless-stopped \
  ghcr.io/springandme/dnf-pvf-tutorial:latest

# 或者本地构建镜像
docker build -t dnf-pvf-tutorial .
docker run -d \
  --name dnf-pvf-tutorial \
  -p 7210:3000 \
  -v $(pwd)/pvfCourse:/app/pvfCourse:ro \
  --restart unless-stopped \
  dnf-pvf-tutorial
```

#### 数据卷挂载说明

为了支持课程数据的热更新，建议使用数据卷挂载：

```yaml
volumes:
  # 只读挂载课程数据目录
  - ./pvfCourse:/app/pvfCourse:ro
  # 挂载教程图片缓存目录（约 300MB，建议持久化）
  - ./media-cache:/app/media-cache
  # 可选：挂载日志目录
  - ./logs:/app/logs
```

#### 教程图片说明

教程内容中的图片原始路径为 `/media/uploads/...`，源站为 DAF 论坛
（`https://daf.linglonger.com`）。服务端处理逻辑：

1. 请求 `/media/uploads/...` 时优先读本地缓存 `media-cache/media/`；
2. 本地没有时自动从源站拉取、落盘后返回（首次访问稍慢）；
3. 内容中的外部图床链接统一走 `/api/image-proxy`（服务端代理 + 磁盘缓存，
   规避混合内容拦截和防盗链）。

**推荐部署后执行一次预热镜像**，之后所有图片全部走本地：

```bash
node scripts/mirror-daf-media.js            # 扫描全部教程并下载引用的图片
node scripts/mirror-daf-media.js --force    # 强制重新下载
```

脚本支持断点续传，失败的记录在 `media-cache/mirror-failures.log`，重跑即可补齐。

#### 境外服务器的源站代理（反向隧道）

DAF 源站屏蔽境外 IP（TCP 可连但 TLS 握手被丢弃），海外服务器直连回源会失败。
若有一台国内网络的机器（如本地 WSL），可建立 SSH 反向隧道借道访问：

1. 本地安装 tinyproxy 并监听 `127.0.0.1:17771`（`sudo apt install tinyproxy`，
   配置 `Port 17771` / `Listen 127.0.0.1`）；
2. 服务器 `/etc/ssh/sshd_config` 设置 `GatewayPorts clientspecified` 并 reload；
3. 本地运行保活脚本（断线自动重连）：

```bash
nohup scripts/daf-tunnel.sh &
```

4. 服务器 compose 中配置（模板已内置）：

```yaml
extra_hosts:
  - "host.docker.internal:host-gateway"
environment:
  - MEDIA_UPSTREAM_PROXY=http://host.docker.internal:17771
```

生效后容器日志会输出 `upstream proxy enabled`，`/media/` 兜底回源与
`mirror-daf-media.js`（设同名环境变量）都会经国内出口访问源站。
隧道断开时服务自动降级为纯本地缓存模式，已有图片不受影响；
服务器侧隧道端口只绑定 docker0 网卡（172.17.0.1），外部无法访问。

**目录结构要求**：
```
部署目录/
├── docker-compose.yml
├── pvfCourse/              # 课程数据目录（必需）
│   ├── 【01】PVF文件解读/
│   ├── 【02】装备修改/
│   └── ...
└── logs/                   # 日志目录（可选）
```

#### 访问方式

- **主页访问**: `http://your-domain:7210` （自动重定向到教程首页）
- **直接访问**: `http://your-domain:7210/dnf_pvf_tutorial.html`
- **API 接口**: `http://your-domain:7210/api/files`

## 🚀 部署

### GitHub Actions 自动化部署

项目配置了 GitHub Actions 自动化部署：

- **GitHub Pages**: 自动部署静态版本
- **Docker**: 自动构建和发布 Docker 镜像到 GHCR

每次推送到 `master` 分支时会自动触发部署流程。

### 生产环境部署

#### 使用 Docker Compose 部署到服务器

1. **准备服务器环境**：
   ```bash
   # 安装 Docker 和 Docker Compose
   curl -fsSL https://get.docker.com -o get-docker.sh
   sh get-docker.sh
   sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
   sudo chmod +x /usr/local/bin/docker-compose
   ```

2. **部署应用**：
   ```bash
   # 创建部署目录
   mkdir -p /opt/dnf-pvf-tutorial
   cd /opt/dnf-pvf-tutorial

   # 下载配置文件
   wget https://raw.githubusercontent.com/springandme/dnf-pvf-tutorial/master/docker-compose.simple.yml

   # 下载或同步课程数据
   git clone https://github.com/springandme/dnf-pvf-tutorial.git temp
   cp -r temp/pvfCourse ./
   rm -rf temp

   # 启动服务
   docker-compose -f docker-compose.simple.yml up -d
   ```

3. **配置反向代理（可选）**：
   ```nginx
   # Nginx 配置示例
   server {
       listen 80;
       server_name your-domain.com;

       location / {
           proxy_pass http://localhost:7210;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
       }
   }
   ```

#### 更新课程数据

由于使用了数据卷挂载，更新课程数据无需重启容器：

```bash
# 方式一：直接替换文件
cd /opt/dnf-pvf-tutorial
# 更新 pvfCourse 目录中的文件

# 方式二：使用 Git 同步
git clone https://github.com/springandme/dnf-pvf-tutorial.git temp
rsync -av --delete temp/pvfCourse/ ./pvfCourse/
rm -rf temp

# 验证更新
curl http://localhost:7210/api/files
```

## 🔧 故障排除

### Docker 部署常见问题

1. **端口冲突**：
   ```bash
   # 检查端口占用
   netstat -tlnp | grep 7210
   # 或使用其他端口
   docker-compose up -d --scale dnf-pvf-tutorial=0
   # 修改 docker-compose.yml 中的端口映射
   ```

2. **权限问题**：
   ```bash
   # 确保数据目录权限正确
   sudo chown -R 1000:1000 ./pvfCourse
   chmod -R 755 ./pvfCourse
   ```

3. **容器无法启动**：
   ```bash
   # 查看详细日志
   docker-compose logs dnf-pvf-tutorial

   # 检查容器状态
   docker-compose ps

   # 重新构建镜像
   docker-compose build --no-cache
   ```

4. **数据卷挂载失败**：
   ```bash
   # 检查路径是否正确
   ls -la ./pvfCourse

   # 使用绝对路径
   volumes:
     - /absolute/path/to/pvfCourse:/app/pvfCourse:ro
   ```

### 性能优化建议

1. **资源限制**：根据服务器配置调整 `docker-compose.yml` 中的资源限制
2. **缓存策略**：启用浏览器缓存和 CDN
3. **日志管理**：定期清理容器日志
   ```bash
   # 清理日志
   docker system prune -f

   # 限制日志大小
   logging:
     driver: "json-file"
     options:
       max-size: "10m"
       max-file: "3"
   ```

## 🤝 贡献

欢迎贡献代码和教程内容！

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建 Pull Request

## 📄 许可证

本项目采用 ISC 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 📞 联系方式

如有问题或建议，请通过以下方式联系：

- GitHub Issues: [提交问题](https://github.com/springandme/dnf-pvf-tutorial/issues)
- 项目主页: [GitHub Repository](https://github.com/springandme/dnf-pvf-tutorial)

## 🙏 致谢

感谢所有为 DNF PVF 修改教程贡献内容的作者和社区成员。
