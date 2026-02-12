# GitHub Repo Explorer / 仓库浏览器

一个简单、优雅且功能强大的 GitHub 仓库/子目录浏览与下载工具。无需安装任何扩展或软件，直接在浏览器中运行。

## ✨ 主要特性 (Features)

*   **🚀 纯前端运行**: 无需后端服务器，所有逻辑在浏览器中完成。
*   **📂 子目录下载**: 支持下载 GitHub 仓库中的任意子文件夹，自动打包为 ZIP。
*   **🌲 交互式目录树**: 
    *   清晰的层级结构展示。
    *   **复选框支持**: 可选择性下载特定文件或文件夹。
    *   **文件预览**: 支持预览代码文件和图片。
    *   **复制链接**: 一键复制文件的 Raw 链接或 GitHub 页面链接。
*   **🌗 现代化 UI**:
    *   深色模式 (Dark Mode) 风格。
    *   响应式设计，适配各种屏幕尺寸。
    *   精准的 UI 对齐和交互体验。
*   **🔗 智能 URL 解析**:
    *   支持仓库主页链接 (e.g. `https://github.com/user/repo`)
    *   支持分支/Tag 链接 (e.g. `https://github.com/user/repo/tree/dev`)
    *   支持子目录链接 (e.g. `https://github.com/user/repo/tree/main/src`)
    *   支持用户主页链接 (e.g. `https://github.com/user`) - 罗列该用户所有仓库。
*   **⚡ 高级功能**:
    *   **分支/Tag 切换**: 自动列出所有分支和标签，方便切换。
    *   **Token 支持**: 可配置 GitHub Token 以提高 API 速率限制。
    *   **代理支持**: 支持配置 API 代理以解决网络问题。

## 🛠️ 使用方法 (Usage)

1.  **打开工具**: 直接在浏览器中打开 `github-repo-explorer.html` 文件。
2.  **输入链接**: 将 GitHub 仓库或文件夹的 URL 粘贴到输入框中。
3.  **点击解析**: 点击 "Analyze / 解析链接" 按钮。
4.  **选择文件**:
    *   解析完成后，目录树将显示文件结构。
    *   勾选需要下载的文件或文件夹（默认全选）。
    *   使用目录树右侧的 "Zip" 按钮下载单个文件夹。
    *   或点击底部的 "Download ZIP / 下载 ZIP" 按钮打包所有选中文件。

## 🔌 离线使用 (Offline Support)

本项目已内置 `jszip.min.js` 库。
*   **优先加载**: 页面会优先尝试加载本地的 `jszip.min.js` 文件。
*   **自动降级**: 若本地文件不存在，会自动回退到 CDN (cdnjs -> unpkg)，确保在任何环境下均可正常使用。

## ⚙️ 技术细节 (Technical Details)

### 1. 核心原理
*   **GitHub Trees API**: 使用 `GET /repos/{owner}/{repo}/git/trees/{ref}?recursive=1` 接口。
    *   `recursive=1`: 一次性获取仓库内所有文件和文件夹的扁平列表（Flat List），极大地减少了 API 请求次数。
    *   **优势**: 相比逐层递归请求，速度更快且不易触发速率限制。
*   **JSZip**: 纯前端 ZIP 打包库。所有文件内容通过 `fetch` 获取后，直接在浏览器内存中压缩打包，不经过第三方服务器。

### 2. URL 智能解析与路径匹配
工具通过正则表达式智能解析多种 GitHub URL 格式：
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