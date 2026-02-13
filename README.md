# GitHub Repo Explorer / 仓库浏览器

一个简单、优雅且功能强大的 GitHub 仓库/子目录浏览与下载工具。无需安装任何扩展或软件，直接在浏览器中运行。采用Github无鉴权API实现，墙内可用。

* [GitHub Repo Explorer / 仓库浏览器 示例页面](https://github-repo-explorer.pages.dev/)

## ✨ 主要特性 (Features)

*   **🚀 纯前端**: 无需后端服务器，所有逻辑在浏览器中完成。
*   **⚡ 性能**: 
    *   **DOM 懒加载 (Lazy Rendering)**: 即使是包含数万文件的超大仓库也能秒级渲染，毫无卡顿。
    *   **Recursive Tree API**: 一次性获取所有文件结构，极速且节省请求次数。
*   **📂 文件操作**: 
    *   **子目录下载**: 支持下载 GitHub 仓库中的任意子文件夹，自动打包为 ZIP。
*   **🌲 交互式目录树**: 
    *   清晰的层级结构展示。
    *   **复选框支持**: 可选择性下载特定文件或文件夹。
    *   **文件预览**: 支持预览代码文件和图片。
    *   **复制链接**: 一键复制文件的 Raw 链接或 GitHub 页面链接。
    *   **拖拽框选**: 支持像操作系统一样鼠标拖拽框选多个文件。
    *   **Export to AI**: 将选中文件的内容合并导出为 AI 友好的 Prompt 格式（Markdown），方便喂给 ChatGPT/Claude。
*   **🔍 实时搜索与发现 (Discovery)**:
    *   **文件搜索**: 支持在已解析的仓库中实时搜索文件，自动展开目录。
    *   **仓库发现**: 
        *   内置 "Find Repos" 功能，支持关键词搜索、编程语言筛选、Stars/Forks 排序。
        *   **趋势榜单**: 查看 GitHub 每日/每周/每月热门仓库。
        *   **即时预览**: 悬浮面板快速预览仓库 README，支持 **双引擎渲染** (本地 JS / GitHub API) 和 **源码查看**。
        *   **一键解析**: 在预览界面直接点击 "Open Here" 即可加载仓库。
        *   **Github1s**: 支持一键跳转 Github1s 查看源码。
*   **📊 仓库仪表盘 (Repo Dashboard)**:
    *   **健康检查**: 自动检测 `.gitignore`, `LICENSE` 等项目配置文件。
    *   **数据概览**: 可视化展示 Stars, Forks, Watchers, Issues 等核心数据。
    *   **社区动态 (Activity)**: 集成 GitHub Events API，以时间轴形式展示最新的 Push, PR, Issue 等动态。
    *   **CI/CD 状态**: 实时查看 GitHub Actions 构建状态。
    *   **Commits**: 查看最近提交记录。
    *   **Contributors**: 查看贡献者列表及头像。
    *   **Issues**: 查看最新 Issue 和 PR 列表。
    *   **Languages**: 可视化编程语言分布统计。
*   **🌗 极简 UI**:
    *   深色模式 (Dark Mode) 风格，沉浸式体验。
    *   极简的输入框与按钮设计，无干扰。
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
*   **⚡ 高级功能**:
    *   **Code Search**: 全局代码搜索，支持预览文件内容和跳转。
    *   **Releases 下载**: 
        *   查看 Release 详情（Markdown 渲染）。
        *   **下载加速**: 支持自定义 Release 附件下载链接模板（支持代理/镜像）。
    *   **Github1s 集成**: 提供 "Open in Github1s" 按钮，一键在 VS Code 风格的 Web IDE 中查看当前浏览的代码目录。
        *   [**Github1s 项目**:](https://github.com/conwnet/github1s)是另一个项目。
    *   **分支/Tag 切换**: 自动列出所有分支和标签，方便切换。
    *   **Token 支持**: 可配置 GitHub Token 以提高 API 速率限制。
    *   **代理支持**: 支持配置 API 代理以解决网络问题。

## 🛠️ 使用方法 (Usage)

1.  **打开工具**: 
    *   **在线使用**: 访问部署好的页面（推荐）。
    *   **本地使用**: 克隆项目，直接在浏览器中打开 `index.html` 文件（本地模式下 Path 路由等部分功能不可用，建议使用本地服务器 例如`python -m http.server` 启动）。
2.  **输入链接**: 将 GitHub 仓库或文件夹的 URL 粘贴到输入框中。
    * 支持简写: `user/repo`
    * 支持粘贴完整 URL: `https://github.com/user/repo/tree/main/src`
3.  **快捷操作**:
    * **Enter**: 开始解析。
    * **拖拽**: 框选多个文件。
4.  **导出/下载**:
    *   点击 "Download ZIP" 下载选中内容。
    *   点击 "Export to AI" 获取合并后的文本。

## 🚀 部署指南 (Deployment)
<span id="部署指南-deployment"></span>

### Cloudflare Pages / Netlify
本项目已包含 `_redirects` 文件，直接部署即可完美支持 SPA 路由。
*   **配置**: 无需额外配置，确保根目录包含 `_redirects`。
*   **原理**: `_redirects` 规则 `/* /index.html 200` 会将所有请求重写到首页，由前端 JS 接管路由。
*   **如果不使用 _redirects**: 访问 `example.com/user/repo` 会触发 404，通过 `404.html` 跳转到 `example.com/#/user/repo`，体验稍差。
*   **注意**: 如果您的项目根目录下存在 `404.html`，请将其重命名或删除，否则可能会干扰 Cloudflare Pages 的路由规则（优先级高于_redirects）。本项目默认提供 `404.html.bak` 作为备份。

### Vercel
请在项目根目录创建 `vercel.json`:
```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

### GitHub Pages
由于 GitHub Pages 不支持服务器端重写 (Rewrite)，即访问 `example.com/user/repo` 会返回 404 错误。我提供了两种方案：

1.  **推荐**: 使用 **Hash 路由** (e.g. `example.com/#/user/repo`)。本项目原生支持，无需任何配置。
2.  **Hack 方案**:
    *   本项目包含一个自定义的 `404.html.bak`。要启用该方案，请将其重命名为 `404.html`。
    *   当 GitHub Pages 返回 404 时，加载该页面。
    *   该页面会自动读取 URL 路径 (e.g. `/user/repo`) 并重定向到 `/#/user/repo`。
    *   **效果**: 用户访问 `example.com/user/repo` -> 闪烁一下 -> 自动跳转到 `example.com/#/user/repo` 并正常加载。

## ⚙️ 技术细节 (Technical Details)

### 1. 核心原理

*   **GitHub Trees API**: 使用 `GET /repos/{owner}/{repo}/git/trees/{ref}?recursive=1` 接口一次性获取所有文件。
    *   `recursive=1`: 一次性获取仓库内所有文件和文件夹的扁平列表（Flat List），极大地减少了 API 请求次数。
    *   **优势**: 相比逐层递归请求，速度更快且不易触发速率限制。
*   **Lazy Rendering**: 前端采用懒加载策略，仅当用户展开文件夹时才创建 DOM 节点，极大降低内存占用和渲染时间，且**不消耗额外 API 额度**。
*   **JSZip**: 纯前端 ZIP 打包库。所有文件内容通过 `fetch` 获取后，直接在浏览器内存中压缩打包，不经过第三方服务器。

### 2. URL 智能解析

工具通过正则表达式智能解析多种 GitHub URL 格式，支持仓库根目录、特定分支、深层子目录、Commit SHA 乃至用户主页。

*   **仓库根目录**: `github.com/user/repo` -> 解析为默认分支的根目录。
*   **分支/标签**: `github.com/user/repo/tree/dev` -> 解析为 `dev` 分支。
*   **子目录**: `github.com/user/repo/tree/main/src/assets` -> 自动识别 `main` 为分支，`src/assets` 为路径。
*   **Commit**: `github.com/user/repo/commit/5f3a...` -> 将 Commit SHA 视为 `ref` 进行解析。
*   **Ref 歧义处理**: 
    *   GitHub URL 中的 `tree/feature/new/logic` 可能表示分支 `feature/new` 下的 `logic` 目录，也可能表示分支 `feature/new/logic`。
    *   **解决方案**: 工具会预先获取仓库的所有 `branch` 和 `tags` 列表，按长度降序排序，优先匹配最长的分支名，从而精准区分分支与路径。

### 3. API 限制与优化

*   **速率限制 (Rate Limiting)**:
    *   未认证请求: 60 次/小时 (按 IP)。
    *   Token 认证: 5000 次/小时。
    *   **Token 安全**: Token 仅存储在本地内存中用于请求头，不会发送给除 GitHub API (或用户配置的代理) 以外的任何服务器。
*   **代理支持**: 允许用户配置 API 代理前缀（如 `https://api.cors.me/`），所有 GitHub API 请求都会通过该前缀转发，解决 CORS 跨域问题或网络访问受限问题。

## 📝 注意事项 (Notes)

*   **API 限制**: GitHub API 对未认证请求有每小时 60 次的限制。如果遇到限制，请在 "Advanced Settings / 高级设置" 中填入 GitHub Token。
*   **大文件支持**: 由于是纯前端实现，受限于浏览器内存，下载极大的仓库或文件可能会导致浏览器卡顿。但一般情况下，单个文件的大小在 10MB 以下，仓库的大小在 100MB 以下。工具是稳定的。同时工具提供链接，可使用其他下载器完成下载。
