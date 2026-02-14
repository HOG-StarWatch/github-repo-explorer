# GitHub Repo Explorer / 仓库浏览器

<div align="center">

**一个简单、优雅、高效的 GitHub 仓库浏览与下载工具**  
纯前端实现，无需后端，即开即用

[![在线体验](https://img.shields.io/badge/demo-online-blue?style=flat-square)](https://github-repo-explorer.pages.dev/)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](https://github.com/HOG-StarWatch/github-repo-explorer/pulls)

</div>

---

## 📖 简介

GitHub Repo Explorer 是一个纯前端的 GitHub 仓库浏览工具，解决 GitHub 原生功能的痛点：

- **下载子目录**：GitHub 不支持单独下载文件夹，而完整克隆太慢
- **AI 代码分析**：快速导出项目代码给 ChatGPT/Claude 分析
- **网络加速**：支持代理模板，解决访问慢的问题
- **快速浏览**：像 VS Code 一样展开/折叠目录，无需跳转页面

---

## ✨ 核心特性

### 🚀 高性能浏览
- **Recursive Tree API**：一次性获取所有文件结构，减少请求次数
- **懒加载渲染**：仅展开时才创建 DOM，即使数万文件也能流畅渲染
- **实时文件搜索**：快速定位文件，自动展开匹配目录
- **分支/Tag 切换**：自动列出所有分支和标签

### 📂 便捷文件操作
- **子目录下载**：任意文件夹一键打包为 ZIP
- **复选框选择**：灵活选择需要下载的文件或文件夹
- **拖拽框选**：像操作系统一样框选多个文件
- **文件预览**：支持代码文件语法高亮和图片预览
- **复制链接**：一键复制 Raw 链接或 GitHub 页面链接

### 🤖 AI 友好
- **Export to AI**：将选中文件合并为 Markdown 格式，直接粘贴给 AI
- **Token 估算**：实时估算导出内容的 token 数量，避免超出上下文限制

### 🔍 仓库发现
- **关键词搜索**：按语言、Star 数筛选 GitHub 仓库
- **趋势榜单**：查看每日/每周/每月热门仓库
- **README 预览**：悬浮卡片快速查看项目介绍，支持双引擎渲染（本地/API）
- **一键解析**：预览界面直接点击 "Open Here" 即可加载仓库

### 📊 仓库仪表盘
- **健康检查**：自动检测 `.gitignore`、`LICENSE` 等配置文件
- **数据概览**：Stars、Forks、Watchers、Issues 可视化展示
- **社区动态**：时间轴展示 Push、PR、Issue 等最新动态
- **CI/CD 状态**：实时查看 GitHub Actions 构建状态
- **Commits**：查看最近提交记录
- **贡献者列表**：查看贡献者头像和提交数
- **语言分布**：可视化编程语言统计

*   **🔗 全能 URL 解析 (Universal URL Parsing)**:
    *   **标准链接**:
        *   仓库主页: `https://github.com/user/repo`
        *   分支/Tag: `https://github.com/user/repo/tree/dev`
        *   子目录: `https://github.com/user/repo/tree/main/src`
        *   文件: `https://github.com/user/repo/blob/main/README.md`
        *   Commit: `https://github.com/user/repo/commit/5f3a...`
        *   Release Tag: `https://github.com/user/repo/releases/tag/v1.0.0`
    *   **用户主页**: `https://github.com/user` -> 罗列该用户所有仓库。
    *   **简写模式**:
        *   `user/repo` -> 自动识别为 `https://github.com/user/repo`。
        *   `/user/repo` -> 同上。
        *   `user` -> 自动识别为用户主页 `https://github.com/user`。
        *   `github.com/user/repo` (无 https) -> 自动补全协议头。
        *   `www.github.com/user/repo` -> 自动跳转并补全协议头。
    *   **参数传递**:
        *   `https://example.com/?url=https://github.com/user/repo` -> 自动填充并分析。
        *   `https://example.com/?https://github.com/user/repo` -> 支持直接粘贴。
        *   `https://example.com/?user/repo` -> 支持简写。
        *   `https://example.com/#/user/repo` -> 支持 Hash 路由（适合静态部署）。
        *   `https://example.com/user/repo` -> 支持 Path 路由（需服务器配置支持或404Hack方案代替）
            *   **详见 [部署指南-Github Pages](#-部署指南-deployment)**。
        *   **Clean URL**: 无论访问路径如何，解析成功后浏览器地址栏会自动统一更新为 `https://example.com/?https://github.com/user/repo`。
    *   **特殊格式**:
        *   支持 URL 编码格式 (e.g. `?https%3A%2F%2Fgithub.com...`)。
        *   支持 SSH 链接 (e.g. `git@github.com:user/repo.git`)。
### ⚡ 高级功能
- **Code Search**：全局代码搜索，支持预览和跳转
- **Releases 管理**：查看 Release 详情，支持自定义下载加速模板
- **Github1s 集成**：一键在 VS Code 风格的 Web IDE 中查看代码
    *   [**Github1s 项目**:](https://github.com/conwnet/github1s)是另一个项目。
- **分支/Tag 切换**: 自动列出所有分支和标签，方便切换。
- **Token 支持**：配置 GitHub Token 提升 API 速率限制 (60 → 5000/小时)
- **代理支持**：配置 API 代理解决网络问题
- **Deep Linking**：分享链接自动恢复当前浏览路径

---

## 🎯 使用场景

| 场景 | 痛点 | 解决方案 |
|------|------|----------|
| **下载子文件夹** | 只想获取项目中的某个目录，却要克隆整个仓库 | 找到目标文件夹 → 点击「Download ZIP」 |
| **AI 代码分析** | 需要把多个文件内容发给 AI，手动复制太慢 | 勾选文件 → 点击「Export to AI」→ 粘贴给 AI |
| **网络加速** | Release 下载链接无法访问 | 高级设置中配置代理模板 |
| **快速代码阅读** | GitHub 网页需要频繁跳转页面 | 目录树展开浏览，无需跳转 |

---

## 🛠️ 快速开始

### 在线使用
访问部署好的页面：[在线体验](https://github-repo-explorer.pages.dev/)

### 本地运行
```bash
# 克隆项目
git clone https://github.com/HOG-StarWatch/github-repo-explorer.git
cd github-repo-explorer

# 使用本地服务器启动（推荐）
python -m http.server 8000
# 或
npx http-server
# etc.

# 浏览器访问 http://localhost:8000
```

### 基本操作
1. **输入链接**：支持多种格式
   - 简写：`user/repo`
   - 完整 URL：`https://github.com/user/repo/tree/main/src`
   - 用户主页：`https://github.com/user`
   - SSH 链接：`git@github.com:user/repo.git`

2. **浏览/选择**
   - 按 `Enter` 开始解析
   - 展开文件夹查看结构
   - 拖拽框选多个文件

3. **导出/下载**
   - 「Download ZIP」下载选中内容
   - 「Export to AI」导出合并文本

---

## ⚙️ 高级配置

点击「Advanced Settings」进入配置：

| 配置项 | 说明 | 默认值 |
|--------|------|--------|
| **GitHub Token** | 提升 API 速率限制 (5000/小时)，本地存储安全 | 可选 |
| **API Proxy** | 配置 API 代理解决网络问题 | 可选 |
| **Release 模板** | 自定义 Release 下载链接 | `https://github.com/{owner}/{repo}/releases/download/{tag}/{filename}` |
| **文件模板** | 自定义 Raw 文件链接 | `https://raw.githubusercontent.com/{owner}/{repo}/{ref}/{path}` |
*   **Download Relese Templates**: 自定义 Release 或 Raw 文件的下载链接模板（支持302跳转的加速服务均可用）。
    *    GitHub 的 Release 文件下载流程是：访问 github.com/.../download/... -> GitHub 服务器鉴权 -> 302 跳转 到 AWS S3 存储桶
    *    这个 S3 链接是 动态生成且带签名 的，无法直接预测。

---

## 🚀 部署指南

### Cloudflare Pages / Netlify（推荐）
项目已包含 `_redirects` 文件，直接部署即可支持 SPA 路由。

### Vercel
创建 `vercel.json`：
```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

### GitHub Pages
由于 GitHub Pages 不支持服务端重写，提供两种方案：

1. **Hash 路由**（默认）：`example.com/#/user/repo`，无需配置
2. **404 Hack**：将 `404.html.bak` 重命名为 `404.html`，自动处理路径跳转

---

## 🔧 技术细节

### 核心原理
- **GitHub Trees API**：`recursive=1` 一次性获取所有文件结构
- **懒加载渲染**：仅展开时创建 DOM 节点，降低内存占用
- **JSZip**：纯前端打包，不经过第三方服务器

### URL 智能解析
- 支持仓库根目录、分支、子目录、Commit SHA、用户主页
- 通过预获取分支/标签列表，精准区分分支名和路径

### API 限制优化
- 未认证：60 次/小时（按 IP）
- Token 认证：5000 次/小时
- Token 仅用于请求头，本地存储安全

---

## 📝 注意事项

- **API 限制**：遇到限制请在设置中配置 GitHub Token
- **大文件支持**：受浏览器内存限制，建议单个文件 < 10MB，仓库 < 100MB
- **兼容性**：支持所有现代浏览器（Chrome、Firefox、Safari、Edge）

---

## 🤝 贡献指南

欢迎提交 PR 和 Issue！

1. Fork 项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

---

<div align="center">
Made with ❤️ by <a href="https://github.com/HOG-StarWatch">HOG-StarWatch</a>
</div>