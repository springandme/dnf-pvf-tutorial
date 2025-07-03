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

```bash
# 构建镜像
docker build -t dnf-pvf-tutorial .

# 运行容器
docker run -p 3000:3000 dnf-pvf-tutorial
```

## 🚀 部署

项目配置了 GitHub Actions 自动化部署：

- **GitHub Pages**: 自动部署静态版本
- **Docker**: 自动构建和发布 Docker 镜像到 GHCR

每次推送到 `master` 分支时会自动触发部署流程。

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
