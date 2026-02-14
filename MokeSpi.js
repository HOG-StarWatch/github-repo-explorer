// GitHub Repo Explorer 模拟数据脚本 - 修复版
// 用法：在浏览器 F12 控制台直接粘贴运行

(function() {
    console.log('%c📦 GitHub Repo Explorer 模拟数据模式已激活', 'color: #4CAF50; font-size: 14px; font-weight: bold');
    
    // ==================== 辅助函数 ====================
    // 安全的 base64 编码（支持中文）
    function safeBtoa(str) {
        // 使用 TextEncoder 将字符串转换为 UTF-8 字节数组
        const encoder = new TextEncoder();
        const bytes = encoder.encode(str);
        
        // 将字节数组转换为二进制字符串
        let binary = '';
        for (let i = 0; i < bytes.length; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        
        // 使用 btoa 编码
        return btoa(binary);
    }
    
    // ==================== 模拟数据 ====================
    const MOCK_DATA = {
        // 用户信息
        user: {
            login: 'mock-user',
            id: 123456,
            avatar_url: 'https://avatars.githubusercontent.com/u/123456?v=4',
            html_url: 'https://github.com/mock-user',
            name: 'Mock User',
            company: '@mock-company',
            blog: 'https://mock.blog',
            location: 'Mock City',
            email: null,
            bio: 'This is a mock user for development',
            public_repos: 42,
            followers: 100,
            following: 50,
            created_at: '2020-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z'
        },
        
        // 仓库列表
        repos: [
            {
                id: 1,
                name: 'mock-repo-1',
                full_name: 'mock-user/mock-repo-1',
                private: false,
                html_url: 'https://github.com/mock-user/mock-repo-1',
                description: '这是一个模拟仓库，用于开发测试',
                fork: false,
                created_at: '2023-01-01T00:00:00Z',
                updated_at: '2024-01-01T00:00:00Z',
                pushed_at: '2024-01-01T00:00:00Z',
                homepage: 'https://mock-repo-1.example.com',
                size: 1024,
                stargazers_count: 1234,
                watchers_count: 1234,
                language: 'JavaScript',
                forks_count: 56,
                open_issues_count: 7,
                master_branch: 'main',
                default_branch: 'main',
                license: {
                    key: 'mit',
                    name: 'MIT License',
                    spdx_id: 'MIT',
                    url: 'https://api.github.com/licenses/mit'
                }
            },
            {
                id: 2,
                name: 'mock-repo-2',
                full_name: 'mock-user/mock-repo-2',
                private: false,
                html_url: 'https://github.com/mock-user/mock-repo-2',
                description: '第二个模拟仓库，包含多种文件类型',
                fork: false,
                created_at: '2023-06-01T00:00:00Z',
                updated_at: '2024-01-01T00:00:00Z',
                pushed_at: '2024-01-01T00:00:00Z',
                homepage: null,
                size: 2048,
                stargazers_count: 567,
                watchers_count: 567,
                language: 'TypeScript',
                forks_count: 23,
                open_issues_count: 3,
                master_branch: 'main',
                default_branch: 'main',
                license: {
                    key: 'apache-2.0',
                    name: 'Apache License 2.0',
                    spdx_id: 'Apache-2.0',
                    url: 'https://api.github.com/licenses/apache-2.0'
                }
            },
            {
                id: 3,
                name: 'mock-repo-3',
                full_name: 'mock-user/mock-repo-3',
                private: true,
                html_url: 'https://github.com/mock-user/mock-repo-3',
                description: '私有仓库模拟',
                fork: false,
                created_at: '2023-12-01T00:00:00Z',
                updated_at: '2024-01-01T00:00:00Z',
                pushed_at: '2024-01-01T00:00:00Z',
                homepage: null,
                size: 512,
                stargazers_count: 0,
                watchers_count: 1,
                language: 'Python',
                forks_count: 0,
                open_issues_count: 0,
                master_branch: 'main',
                default_branch: 'main',
                license: null
            }
        ],
        
        // 分支列表
        branches: [
            { name: 'main', commit: { sha: 'abc123', url: 'https://api.github.com/repos/mock-user/mock-repo/commits/abc123' }, protected: true },
            { name: 'develop', commit: { sha: 'def456', url: 'https://api.github.com/repos/mock-user/mock-repo/commits/def456' }, protected: false },
            { name: 'feature/new-ui', commit: { sha: 'ghi789', url: 'https://api.github.com/repos/mock-user/mock-repo/commits/ghi789' }, protected: false },
            { name: 'hotfix/v1.0.1', commit: { sha: 'jkl012', url: 'https://api.github.com/repos/mock-user/mock-repo/commits/jkl012' }, protected: false }
        ],
        
        // 标签列表
        tags: [
            { name: 'v1.0.0', commit: { sha: 'abc123', url: 'https://api.github.com/repos/mock-user/mock-repo/commits/abc123' }, zipball_url: 'https://api.github.com/repos/mock-user/mock-repo/zipball/v1.0.0', tarball_url: 'https://api.github.com/repos/mock-user/mock-repo/tarball/v1.0.0' },
            { name: 'v1.1.0', commit: { sha: 'def456', url: 'https://api.github.com/repos/mock-user/mock-repo/commits/def456' }, zipball_url: 'https://api.github.com/repos/mock-user/mock-repo/zipball/v1.1.0', tarball_url: 'https://api.github.com/repos/mock-user/mock-repo/tarball/v1.1.0' },
            { name: 'v2.0.0-beta', commit: { sha: 'ghi789', url: 'https://api.github.com/repos/mock-user/mock-repo/commits/ghi789' }, zipball_url: 'https://api.github.com/repos/mock-user/mock-repo/zipball/v2.0.0-beta', tarball_url: 'https://api.github.com/repos/mock-user/mock-repo/tarball/v2.0.0-beta' }
        ],
        
        // 文件树 (git/trees)
        treeData: {
            sha: 'mock-tree-sha-123',
            url: 'https://api.github.com/repos/mock-user/mock-repo/git/trees/main',
            tree: [
                // 根目录文件
                { path: 'README.md', mode: '100644', type: 'blob', sha: 'readme-sha-123', size: 1234, url: 'https://api.github.com/repos/mock-user/mock-repo/git/blobs/readme-sha-123' },
                { path: 'package.json', mode: '100644', type: 'blob', sha: 'pkg-sha-123', size: 567, url: 'https://api.github.com/repos/mock-user/mock-repo/git/blobs/pkg-sha-123' },
                { path: 'tsconfig.json', mode: '100644', type: 'blob', sha: 'ts-sha-123', size: 890, url: 'https://api.github.com/repos/mock-user/mock-repo/git/blobs/ts-sha-123' },
                { path: '.gitignore', mode: '100644', type: 'blob', sha: 'gitignore-sha-123', size: 234, url: 'https://api.github.com/repos/mock-user/mock-repo/git/blobs/gitignore-sha-123' },
                
                // src 目录
                { path: 'src', mode: '040000', type: 'tree', sha: 'src-sha-123', url: 'https://api.github.com/repos/mock-user/mock-repo/git/trees/src-sha-123' },
                { path: 'src/index.js', mode: '100644', type: 'blob', sha: 'index-sha-123', size: 3456, url: 'https://api.github.com/repos/mock-user/mock-repo/git/blobs/index-sha-123' },
                { path: 'src/app.js', mode: '100644', type: 'blob', sha: 'app-sha-123', size: 2789, url: 'https://api.github.com/repos/mock-user/mock-repo/git/blobs/app-sha-123' },
                { path: 'src/utils.js', mode: '100644', type: 'blob', sha: 'utils-sha-123', size: 1234, url: 'https://api.github.com/repos/mock-user/mock-repo/git/blobs/utils-sha-123' },
                
                // src/components 目录
                { path: 'src/components', mode: '040000', type: 'tree', sha: 'components-sha-123', url: 'https://api.github.com/repos/mock-user/mock-repo/git/trees/components-sha-123' },
                { path: 'src/components/Button.jsx', mode: '100644', type: 'blob', sha: 'button-sha-123', size: 2345, url: 'https://api.github.com/repos/mock-user/mock-repo/git/blobs/button-sha-123' },
                { path: 'src/components/Modal.jsx', mode: '100644', type: 'blob', sha: 'modal-sha-123', size: 3456, url: 'https://api.github.com/repos/mock-user/mock-repo/git/blobs/modal-sha-123' },
                { path: 'src/components/Header.jsx', mode: '100644', type: 'blob', sha: 'header-sha-123', size: 1567, url: 'https://api.github.com/repos/mock-user/mock-repo/git/blobs/header-sha-123' },
                
                // docs 目录
                { path: 'docs', mode: '040000', type: 'tree', sha: 'docs-sha-123', url: 'https://api.github.com/repos/mock-user/mock-repo/git/trees/docs-sha-123' },
                { path: 'docs/README.md', mode: '100644', type: 'blob', sha: 'docs-readme-sha-123', size: 890, url: 'https://api.github.com/repos/mock-user/mock-repo/git/blobs/docs-readme-sha-123' },
                { path: 'docs/API.md', mode: '100644', type: 'blob', sha: 'api-sha-123', size: 5678, url: 'https://api.github.com/repos/mock-user/mock-repo/git/blobs/api-sha-123' },
                
                // tests 目录
                { path: 'tests', mode: '040000', type: 'tree', sha: 'tests-sha-123', url: 'https://api.github.com/repos/mock-user/mock-repo/git/trees/tests-sha-123' },
                { path: 'tests/test.js', mode: '100644', type: 'blob', sha: 'test-sha-123', size: 1234, url: 'https://api.github.com/repos/mock-user/mock-repo/git/blobs/test-sha-123' },
                { path: 'tests/utils.test.js', mode: '100644', type: 'blob', sha: 'utils-test-sha-123', size: 2345, url: 'https://api.github.com/repos/mock-user/mock-repo/git/blobs/utils-test-sha-123' }
            ],
            truncated: false
        },
        
        // 文件内容 (raw)
        fileContents: {
            'README.md': '# Mock Repository\n\n这是一个模拟的 GitHub 仓库，用于开发测试。\n\n## 功能\n\n- 文件树浏览\n- 代码预览\n- 下载功能\n- 搜索功能\n\n## 技术栈\n\n- JavaScript\n- HTML5\n- CSS3\n\n## 许可证\n\nMIT',
            'package.json': JSON.stringify({
                name: 'mock-repo',
                version: '1.0.0',
                description: 'A mock repository for development',
                main: 'src/index.js',
                scripts: {
                    start: 'node src/index.js',
                    test: 'jest',
                    build: 'webpack'
                },
                dependencies: {
                    react: '^18.2.0',
                    'react-dom': '^18.2.0'
                },
                devDependencies: {
                    jest: '^29.0.0',
                    webpack: '^5.0.0'
                }
            }, null, 2),
            'src/index.js': `// Main entry point
import React from 'react';
import ReactDOM from 'react-dom';
import App from './app';

ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.getElementById('root')
);`,
            'src/app.js': `import React from 'react';
import Header from './components/Header';
import Button from './components/Button';

function App() {
  return (
    <div>
      <Header title="Mock App" />
      <Button onClick={() => alert('Clicked!')}>
        Click me
      </Button>
    </div>
  );
}

export default App;`,
            'src/components/Button.jsx': `import React from 'react';

const Button = ({ children, onClick, variant = 'primary' }) => {
  const styles = {
    primary: { backgroundColor: '#007bff', color: 'white' },
    secondary: { backgroundColor: '#6c757d', color: 'white' }
  };

  return (
    <button
      style={{
        ...styles[variant],
        padding: '8px 16px',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer'
      }}
      onClick={onClick}
    >
      {children}
    </button>
  );
};

export default Button;`
        },
        
        // 仓库信息
        repoInfo: {
            id: 123456789,
            name: 'mock-repo',
            full_name: 'mock-user/mock-repo',
            private: false,
            html_url: 'https://github.com/mock-user/mock-repo',
            description: '一个用于开发的模拟仓库',
            fork: false,
            created_at: '2023-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z',
            pushed_at: '2024-01-01T00:00:00Z',
            size: 10240,
            stargazers_count: 1234,
            watchers_count: 1234,
            language: 'JavaScript',
            forks_count: 56,
            open_issues_count: 7,
            default_branch: 'main',
            subscribers_count: 89,
            network_count: 56
        },
        
        // 社区资料
        communityProfile: {
            health_percentage: 85,
            files: {
                readme: { url: 'https://api.github.com/repos/mock-user/mock-repo/readme', html_url: 'https://github.com/mock-user/mock-repo#readme' },
                contributing: { url: 'https://api.github.com/repos/mock-user/mock-repo/contents/CONTRIBUTING.md', html_url: 'https://github.com/mock-user/mock-repo/blob/main/CONTRIBUTING.md' },
                license: { url: 'https://api.github.com/repos/mock-user/mock-repo/license', html_url: 'https://github.com/mock-user/mock-repo/blob/main/LICENSE' },
                code_of_conduct: null,
                issue_template: null,
                pull_request_template: null
            }
        },
        
        // 提交记录
        commits: [
            {
                sha: 'abc123',
                commit: {
                    author: { name: 'Mock Developer', email: 'dev@example.com', date: '2024-01-01T10:00:00Z' },
                    committer: { name: 'Mock Developer', email: 'dev@example.com', date: '2024-01-01T10:00:00Z' },
                    message: 'Initial commit\n\nAdd basic project structure',
                    tree: { sha: 'tree-sha-123', url: 'https://api.github.com/repos/mock-user/mock-repo/git/trees/tree-sha-123' },
                    url: 'https://api.github.com/repos/mock-user/mock-repo/git/commits/abc123',
                    comment_count: 0
                },
                author: { login: 'mock-user', avatar_url: 'https://avatars.githubusercontent.com/u/123456?v=4' },
                committer: { login: 'mock-user', avatar_url: 'https://avatars.githubusercontent.com/u/123456?v=4' },
                parents: [],
                html_url: 'https://github.com/mock-user/mock-repo/commit/abc123'
            },
            {
                sha: 'def456',
                commit: {
                    author: { name: 'Mock Developer', email: 'dev@example.com', date: '2024-01-02T11:00:00Z' },
                    committer: { name: 'Mock Developer', email: 'dev@example.com', date: '2024-01-02T11:00:00Z' },
                    message: 'Add components and utils',
                    tree: { sha: 'tree-sha-456', url: 'https://api.github.com/repos/mock-user/mock-repo/git/trees/tree-sha-456' },
                    url: 'https://api.github.com/repos/mock-user/mock-repo/git/commits/def456',
                    comment_count: 2
                },
                author: { login: 'mock-user', avatar_url: 'https://avatars.githubusercontent.com/u/123456?v=4' },
                committer: { login: 'mock-user', avatar_url: 'https://avatars.githubusercontent.com/u/123456?v=4' },
                parents: [{ sha: 'abc123', url: 'https://api.github.com/repos/mock-user/mock-repo/commits/abc123' }],
                html_url: 'https://github.com/mock-user/mock-repo/commit/def456'
            },
            {
                sha: 'ghi789',
                commit: {
                    author: { name: 'Mock Developer', email: 'dev@example.com', date: '2024-01-03T12:00:00Z' },
                    committer: { name: 'Mock Developer', email: 'dev@example.com', date: '2024-01-03T12:00:00Z' },
                    message: 'Update documentation',
                    tree: { sha: 'tree-sha-789', url: 'https://api.github.com/repos/mock-user/mock-repo/git/trees/tree-sha-789' },
                    url: 'https://api.github.com/repos/mock-user/mock-repo/git/commits/ghi789',
                    comment_count: 1
                },
                author: { login: 'mock-user', avatar_url: 'https://avatars.githubusercontent.com/u/123456?v=4' },
                committer: { login: 'mock-user', avatar_url: 'https://avatars.githubusercontent.com/u/123456?v=4' },
                parents: [{ sha: 'def456', url: 'https://api.github.com/repos/mock-user/mock-repo/commits/def456' }],
                html_url: 'https://github.com/mock-user/mock-repo/commit/ghi789'
            }
        ],
        
        // 贡献者
        contributors: [
            {
                login: 'mock-user',
                id: 123456,
                avatar_url: 'https://avatars.githubusercontent.com/u/123456?v=4',
                html_url: 'https://github.com/mock-user',
                contributions: 42
            },
            {
                login: 'contributor-1',
                id: 234567,
                avatar_url: 'https://avatars.githubusercontent.com/u/234567?v=4',
                html_url: 'https://github.com/contributor-1',
                contributions: 15
            },
            {
                login: 'contributor-2',
                id: 345678,
                avatar_url: 'https://avatars.githubusercontent.com/u/345678?v=4',
                html_url: 'https://github.com/contributor-2',
                contributions: 8
            }
        ],
        
        // Issues
        issues: [
            {
                id: 1,
                number: 101,
                title: 'Fix button styling issue',
                body: 'The primary button has incorrect padding',
                state: 'open',
                locked: false,
                user: { login: 'mock-user', avatar_url: 'https://avatars.githubusercontent.com/u/123456?v=4' },
                labels: [{ name: 'bug', color: 'd73a4a' }],
                assignee: null,
                milestone: null,
                comments: 3,
                created_at: '2024-01-01T10:00:00Z',
                updated_at: '2024-01-02T11:00:00Z',
                closed_at: null,
                html_url: 'https://github.com/mock-user/mock-repo/issues/101'
            },
            {
                id: 2,
                number: 102,
                title: 'Add unit tests for components',
                body: 'Need to increase test coverage',
                state: 'open',
                locked: false,
                user: { login: 'contributor-1', avatar_url: 'https://avatars.githubusercontent.com/u/234567?v=4' },
                labels: [{ name: 'enhancement', color: 'a2eeef' }, { name: 'good first issue', color: '7057ff' }],
                assignee: { login: 'mock-user', avatar_url: 'https://avatars.githubusercontent.com/u/123456?v=4' },
                milestone: { title: 'v1.1.0' },
                comments: 5,
                created_at: '2024-01-03T12:00:00Z',
                updated_at: '2024-01-04T13:00:00Z',
                closed_at: null,
                html_url: 'https://github.com/mock-user/mock-repo/issues/102'
            }
        ],
        
        // 语言统计
        languages: {
            JavaScript: 24567,
            TypeScript: 12345,
            CSS: 5678,
            HTML: 4321
        },
        
        // 活动事件
        events: [
            {
                id: '1',
                type: 'PushEvent',
                actor: { login: 'mock-user', avatar_url: 'https://avatars.githubusercontent.com/u/123456?v=4' },
                repo: { name: 'mock-user/mock-repo' },
                payload: { ref: 'refs/heads/main', commits: [{ message: 'Update README' }, { message: 'Fix typo' }] },
                created_at: '2024-01-01T10:00:00Z'
            },
            {
                id: '2',
                type: 'PullRequestEvent',
                actor: { login: 'contributor-1', avatar_url: 'https://avatars.githubusercontent.com/u/234567?v=4' },
                repo: { name: 'mock-user/mock-repo' },
                payload: { action: 'opened', number: 42, pull_request: { title: 'Add new feature' } },
                created_at: '2024-01-02T11:00:00Z'
            },
            {
                id: '3',
                type: 'IssuesEvent',
                actor: { login: 'mock-user', avatar_url: 'https://avatars.githubusercontent.com/u/123456?v=4' },
                repo: { name: 'mock-user/mock-repo' },
                payload: { action: 'opened', issue: { number: 101, title: 'Bug report' } },
                created_at: '2024-01-03T12:00:00Z'
            },
            {
                id: '4',
                type: 'WatchEvent',
                actor: { login: 'user-1', avatar_url: 'https://avatars.githubusercontent.com/u/456789?v=4' },
                repo: { name: 'mock-user/mock-repo' },
                payload: { action: 'started' },
                created_at: '2024-01-04T13:00:00Z'
            },
            {
                id: '5',
                type: 'ForkEvent',
                actor: { login: 'user-2', avatar_url: 'https://avatars.githubusercontent.com/u/567890?v=4' },
                repo: { name: 'mock-user/mock-repo' },
                payload: { forkee: { full_name: 'user-2/mock-repo' } },
                created_at: '2024-01-05T14:00:00Z'
            },
            {
                id: '6',
                type: 'ReleaseEvent',
                actor: { login: 'mock-user', avatar_url: 'https://avatars.githubusercontent.com/u/123456?v=4' },
                repo: { name: 'mock-user/mock-repo' },
                payload: { action: 'published', release: { tag_name: 'v1.0.0' } },
                created_at: '2024-01-06T15:00:00Z'
            }
        ],
        
        // CI 检查
        checkRuns: {
            total_count: 3,
            check_runs: [
                {
                    id: 1,
                    name: 'Build',
                    status: 'completed',
                    conclusion: 'success',
                    started_at: '2024-01-01T10:00:00Z',
                    completed_at: '2024-01-01T10:05:00Z',
                    app: { name: 'GitHub Actions' }
                },
                {
                    id: 2,
                    name: 'Test',
                    status: 'completed',
                    conclusion: 'success',
                    started_at: '2024-01-01T10:05:00Z',
                    completed_at: '2024-01-01T10:10:00Z',
                    app: { name: 'GitHub Actions' }
                },
                {
                    id: 3,
                    name: 'Lint',
                    status: 'completed',
                    conclusion: 'failure',
                    started_at: '2024-01-01T10:10:00Z',
                    completed_at: '2024-01-01T10:12:00Z',
                    app: { name: 'GitHub Actions' }
                }
            ]
        },
        
        // 发行版
        releases: [
            {
                id: 1,
                tag_name: 'v1.0.0',
                name: 'Version 1.0.0',
                body: 'First stable release\n\n- Feature 1\n- Feature 2\n- Bug fixes',
                draft: false,
                prerelease: false,
                created_at: '2024-01-01T10:00:00Z',
                published_at: '2024-01-01T10:00:00Z',
                html_url: 'https://github.com/mock-user/mock-repo/releases/tag/v1.0.0',
                assets: [
                    { name: 'source-code.zip', size: 1024000, download_count: 100 },
                    { name: 'binary.exe', size: 2048000, download_count: 50 }
                ]
            },
            {
                id: 2,
                tag_name: 'v1.1.0-beta',
                name: 'Version 1.1.0 Beta',
                body: 'Beta release with new features',
                draft: false,
                prerelease: true,
                created_at: '2024-01-15T10:00:00Z',
                published_at: '2024-01-15T10:00:00Z',
                html_url: 'https://github.com/mock-user/mock-repo/releases/tag/v1.1.0-beta',
                assets: [
                    { name: 'source-code.zip', size: 1536000, download_count: 25 }
                ]
            }
        ],
        
        // 搜索结果
        codeSearch: {
            total_count: 2,
            items: [
                {
                    name: 'index.js',
                    path: 'src/index.js',
                    sha: 'index-sha-123',
                    url: 'https://api.github.com/repositories/123456/contents/src/index.js',
                    git_url: 'https://api.github.com/repos/mock-user/mock-repo/git/blobs/index-sha-123',
                    html_url: 'https://github.com/mock-user/mock-repo/blob/main/src/index.js',
                    repository: { full_name: 'mock-user/mock-repo' }
                },
                {
                    name: 'app.js',
                    path: 'src/app.js',
                    sha: 'app-sha-123',
                    url: 'https://api.github.com/repositories/123456/contents/src/app.js',
                    git_url: 'https://api.github.com/repos/mock-user/mock-repo/git/blobs/app-sha-123',
                    html_url: 'https://github.com/mock-user/mock-repo/blob/main/src/app.js',
                    repository: { full_name: 'mock-user/mock-repo' }
                }
            ]
        },
        
        // 搜索仓库结果 (对应 /search/repositories)
        searchRepos: {
            total_count: 15,
            incomplete_results: false,
            items: [
                {
                    id: 1001,
                    name: 'react',
                    full_name: 'facebook/react',
                    private: false,
                    html_url: 'https://github.com/facebook/react',
                    description: 'The library for web and native user interfaces',
                    fork: false,
                    url: 'https://api.github.com/repos/facebook/react',
                    created_at: '2013-05-24T16:15:54Z',
                    updated_at: '2024-02-14T10:00:00Z',
                    pushed_at: '2024-02-14T09:00:00Z',
                    homepage: 'https://react.dev',
                    size: 250000,
                    stargazers_count: 225000,
                    watchers_count: 225000,
                    language: 'JavaScript',
                    forks_count: 46000,
                    open_issues_count: 1200,
                    master_branch: 'main',
                    default_branch: 'main',
                    score: 1.0,
                    license: {
                        key: 'mit',
                        name: 'MIT License',
                        spdx_id: 'MIT',
                        url: 'https://api.github.com/licenses/mit'
                    }
                },
                {
                    id: 1002,
                    name: 'vue',
                    full_name: 'vuejs/vue',
                    private: false,
                    html_url: 'https://github.com/vuejs/vue',
                    description: 'This is the repo for Vue 2. For Vue 3, go to https://github.com/vuejs/core',
                    fork: false,
                    url: 'https://api.github.com/repos/vuejs/vue',
                    created_at: '2013-07-29T03:24:00Z',
                    updated_at: '2024-02-13T18:00:00Z',
                    pushed_at: '2024-02-12T15:00:00Z',
                    homepage: 'https://vuejs.org',
                    size: 35000,
                    stargazers_count: 207000,
                    watchers_count: 207000,
                    language: 'JavaScript',
                    forks_count: 33600,
                    open_issues_count: 150,
                    master_branch: 'main',
                    default_branch: 'main',
                    score: 0.95,
                    license: {
                        key: 'mit',
                        name: 'MIT License',
                        spdx_id: 'MIT',
                        url: 'https://api.github.com/licenses/mit'
                    }
                },
                {
                    id: 1003,
                    name: 'tailwindcss',
                    full_name: 'tailwindlabs/tailwindcss',
                    private: false,
                    html_url: 'https://github.com/tailwindlabs/tailwindcss',
                    description: 'A utility-first CSS framework for rapid UI development.',
                    fork: false,
                    url: 'https://api.github.com/repos/tailwindlabs/tailwindcss',
                    created_at: '2017-10-23T20:46:00Z',
                    updated_at: '2024-02-14T08:00:00Z',
                    pushed_at: '2024-02-13T22:00:00Z',
                    homepage: 'https://tailwindcss.com',
                    size: 18000,
                    stargazers_count: 79000,
                    watchers_count: 79000,
                    language: 'JavaScript',
                    forks_count: 3900,
                    open_issues_count: 85,
                    master_branch: 'master',
                    default_branch: 'master',
                    score: 0.85,
                    license: {
                        key: 'mit',
                        name: 'MIT License',
                        spdx_id: 'MIT',
                        url: 'https://api.github.com/licenses/mit'
                    }
                },
                {
                    id: 1004,
                    name: 'vite',
                    full_name: 'vitejs/vite',
                    private: false,
                    html_url: 'https://github.com/vitejs/vite',
                    description: 'Next generation frontend tooling. It\'s fast!',
                    fork: false,
                    url: 'https://api.github.com/repos/vitejs/vite',
                    created_at: '2020-04-20T07:24:00Z',
                    updated_at: '2024-02-14T09:30:00Z',
                    pushed_at: '2024-02-14T08:45:00Z',
                    homepage: 'https://vitejs.dev',
                    size: 28000,
                    stargazers_count: 66000,
                    watchers_count: 66000,
                    language: 'TypeScript',
                    forks_count: 5900,
                    open_issues_count: 250,
                    master_branch: 'main',
                    default_branch: 'main',
                    score: 0.8,
                    license: {
                        key: 'mit',
                        name: 'MIT License',
                        spdx_id: 'MIT',
                        url: 'https://api.github.com/licenses/mit'
                    }
                },
                {
                    id: 1005,
                    name: 'next.js',
                    full_name: 'vercel/next.js',
                    private: false,
                    html_url: 'https://github.com/vercel/next.js',
                    description: 'The React Framework',
                    fork: false,
                    url: 'https://api.github.com/repos/vercel/next.js',
                    created_at: '2016-10-05T23:32:00Z',
                    updated_at: '2024-02-14T10:00:00Z',
                    pushed_at: '2024-02-14T09:55:00Z',
                    homepage: 'https://nextjs.org',
                    size: 150000,
                    stargazers_count: 122000,
                    watchers_count: 122000,
                    language: 'JavaScript',
                    forks_count: 26000,
                    open_issues_count: 1800,
                    master_branch: 'canary',
                    default_branch: 'canary',
                    score: 0.78,
                    license: {
                        key: 'mit',
                        name: 'MIT License',
                        spdx_id: 'MIT',
                        url: 'https://api.github.com/licenses/mit'
                    }
                },
                {
                    id: 1006,
                    name: 'deno',
                    full_name: 'denoland/deno',
                    private: false,
                    html_url: 'https://github.com/denoland/deno',
                    description: 'A modern runtime for JavaScript and TypeScript.',
                    fork: false,
                    url: 'https://api.github.com/repos/denoland/deno',
                    created_at: '2018-05-11T16:04:00Z',
                    updated_at: '2024-02-14T09:45:00Z',
                    pushed_at: '2024-02-14T09:20:00Z',
                    homepage: 'https://deno.com',
                    size: 120000,
                    stargazers_count: 93000,
                    watchers_count: 93000,
                    language: 'Rust',
                    forks_count: 5100,
                    open_issues_count: 950,
                    master_branch: 'main',
                    default_branch: 'main',
                    score: 0.75,
                    license: {
                        key: 'mit',
                        name: 'MIT License',
                        spdx_id: 'MIT',
                        url: 'https://api.github.com/licenses/mit'
                    }
                },
                {
                    id: 1007,
                    name: 'bun',
                    full_name: 'oven-sh/bun',
                    private: false,
                    html_url: 'https://github.com/oven-sh/bun',
                    description: 'Incredibly fast JavaScript runtime, bundler, test runner, and package manager – all in one',
                    fork: false,
                    url: 'https://api.github.com/repos/oven-sh/bun',
                    created_at: '2021-07-16T17:25:00Z',
                    updated_at: '2024-02-14T09:50:00Z',
                    pushed_at: '2024-02-14T09:15:00Z',
                    homepage: 'https://bun.sh',
                    size: 45000,
                    stargazers_count: 70000,
                    watchers_count: 70000,
                    language: 'Zig',
                    forks_count: 2500,
                    open_issues_count: 750,
                    master_branch: 'main',
                    default_branch: 'main',
                    score: 0.72,
                    license: {
                        key: 'mit',
                        name: 'MIT License',
                        spdx_id: 'MIT',
                        url: 'https://api.github.com/licenses/mit'
                    }
                },
                {
                    id: 1008,
                    name: 'rust',
                    full_name: 'rust-lang/rust',
                    private: false,
                    html_url: 'https://github.com/rust-lang/rust',
                    description: 'Empowering everyone to build reliable and efficient software.',
                    fork: false,
                    url: 'https://api.github.com/repos/rust-lang/rust',
                    created_at: '2010-06-16T21:24:00Z',
                    updated_at: '2024-02-14T09:55:00Z',
                    pushed_at: '2024-02-14T09:30:00Z',
                    homepage: 'https://www.rust-lang.org',
                    size: 500000,
                    stargazers_count: 95000,
                    watchers_count: 95000,
                    language: 'Rust',
                    forks_count: 12000,
                    open_issues_count: 5000,
                    master_branch: 'master',
                    default_branch: 'master',
                    score: 0.7,
                    license: {
                        key: 'mit',
                        name: 'MIT License',
                        spdx_id: 'MIT',
                        url: 'https://api.github.com/licenses/mit'
                    }
                },
                {
                    id: 1009,
                    name: 'langchain',
                    full_name: 'langchain-ai/langchain',
                    private: false,
                    html_url: 'https://github.com/langchain-ai/langchain',
                    description: 'Building applications with LLMs through composability',
                    fork: false,
                    url: 'https://api.github.com/repos/langchain-ai/langchain',
                    created_at: '2022-10-17T17:19:00Z',
                    updated_at: '2024-02-14T10:00:00Z',
                    pushed_at: '2024-02-14T09:45:00Z',
                    homepage: 'https://python.langchain.com',
                    size: 25000,
                    stargazers_count: 85000,
                    watchers_count: 85000,
                    language: 'Python',
                    forks_count: 13000,
                    open_issues_count: 350,
                    master_branch: 'master',
                    default_branch: 'master',
                    score: 0.68,
                    license: {
                        key: 'mit',
                        name: 'MIT License',
                        spdx_id: 'MIT',
                        url: 'https://api.github.com/licenses/mit'
                    }
                },
                {
                    id: 1010,
                    name: 'ollama',
                    full_name: 'ollama/ollama',
                    private: false,
                    html_url: 'https://github.com/ollama/ollama',
                    description: 'Get up and running with large language models locally',
                    fork: false,
                    url: 'https://api.github.com/repos/ollama/ollama',
                    created_at: '2023-06-26T17:52:00Z',
                    updated_at: '2024-02-14T09:40:00Z',
                    pushed_at: '2024-02-14T09:20:00Z',
                    homepage: 'https://ollama.ai',
                    size: 15000,
                    stargazers_count: 45000,
                    watchers_count: 45000,
                    language: 'Go',
                    forks_count: 2800,
                    open_issues_count: 250,
                    master_branch: 'main',
                    default_branch: 'main',
                    score: 0.65,
                    license: {
                        key: 'mit',
                        name: 'MIT License',
                        spdx_id: 'MIT',
                        url: 'https://api.github.com/licenses/mit'
                    }
                }
            ]
        },
        
        // 趋势数据 (daily/weekly/monthly)
        trendingRepos: {
            total_count: 25,
            items: [
                {
                    id: 2001,
                    name: 'screenshot-to-code',
                    full_name: 'abi/screenshot-to-code',
                    private: false,
                    html_url: 'https://github.com/abi/screenshot-to-code',
                    description: 'Drop in a screenshot and convert it to clean code (HTML/Tailwind/React/Vue)',
                    fork: false,
                    created_at: '2023-11-15T10:00:00Z',
                    updated_at: '2024-02-14T08:00:00Z',
                    pushed_at: '2024-02-14T07:55:00Z',
                    homepage: '',
                    size: 8500,
                    stargazers_count: 42000,
                    watchers_count: 42000,
                    language: 'TypeScript',
                    forks_count: 3200,
                    open_issues_count: 45,
                    default_branch: 'main',
                    score: 1.0
                },
                {
                    id: 2002,
                    name: 'gpt-engineer',
                    full_name: 'gpt-engineer-org/gpt-engineer',
                    private: false,
                    html_url: 'https://github.com/gpt-engineer-org/gpt-engineer',
                    description: 'Specify what you want it to build, the AI asks for clarification, and then builds it.',
                    fork: false,
                    created_at: '2023-06-15T14:30:00Z',
                    updated_at: '2024-02-14T07:30:00Z',
                    pushed_at: '2024-02-13T22:15:00Z',
                    homepage: '',
                    size: 12000,
                    stargazers_count: 51000,
                    watchers_count: 51000,
                    language: 'Python',
                    forks_count: 6500,
                    open_issues_count: 120,
                    default_branch: 'main',
                    score: 0.98
                },
                {
                    id: 2003,
                    name: 'open-webui',
                    full_name: 'open-webui/open-webui',
                    private: false,
                    html_url: 'https://github.com/open-webui/open-webui',
                    description: 'User-friendly WebUI for LLMs (Formerly Ollama WebUI)',
                    fork: false,
                    created_at: '2023-10-09T18:40:00Z',
                    updated_at: '2024-02-14T08:45:00Z',
                    pushed_at: '2024-02-14T08:30:00Z',
                    homepage: 'https://openwebui.com',
                    size: 9500,
                    stargazers_count: 18000,
                    watchers_count: 18000,
                    language: 'TypeScript',
                    forks_count: 2100,
                    open_issues_count: 80,
                    default_branch: 'main',
                    score: 0.95
                }
            ]
        },
        
        // 为每个发现仓库准备 README 内容
        discoveryReadmes: {
            'facebook/react': `# React

React is a JavaScript library for building user interfaces.

## Features

- **Declarative**: React makes it painless to create interactive UIs.
- **Component-Based**: Build encapsulated components that manage their own state.
- **Learn Once, Write Anywhere**: You can develop new features in React without rewriting existing code.

## Installation

\`\`\`bash
npm install react react-dom
\`\`\`

## Usage

\`\`\`jsx
import React from 'react';
import ReactDOM from 'react-dom';

function App() {
  return <h1>Hello, world!</h1>;
}

ReactDOM.render(<App />, document.getElementById('root'));
\`\`\`

## Documentation

You can find the React documentation [on the website](https://react.dev/).`,
            
            'vuejs/vue': `# Vue.js

Vue.js is a progressive JavaScript framework for building user interfaces.

## Introduction

Vue is designed from the ground up to be incrementally adoptable. The core library is focused on the view layer only, and is easy to pick up and integrate with other libraries or existing projects.

## Getting Started

\`\`\`html
<script src="https://unpkg.com/vue@3/dist/vue.global.js"></script>

<div id="app">{{ message }}</div>

<script>
  const { createApp } = Vue
  
  createApp({
    data() {
      return {
        message: 'Hello Vue!'
      }
    }
  }).mount('#app')
</script>
\`\`\`

## Ecosystem

- Vue Router: Official router
- Pinia: State management
- Vue CLI: Standard tooling

## Links

- [Documentation](https://vuejs.org/)
- [GitHub](https://github.com/vuejs/vue)`,
            
            'tailwindlabs/tailwindcss': `# Tailwind CSS

Tailwind CSS is a utility-first CSS framework packed with classes like flex, pt-4, text-center and rotate-90 that can be composed to build any design, directly in your markup.

## Features

- **Utility-First**: Build complex components with a constrained set of utility classes
- **Responsive Design**: Use responsive variants to build adaptive interfaces
- **Dark Mode**: Style your site in dark mode with the dark: variant
- **Customization**: Configure everything with tailwind.config.js

## Installation

\`\`\`bash
npm install -D tailwindcss
npx tailwindcss init
\`\`\`

## Usage

Add the Tailwind directives to your CSS:

\`\`\`css
@tailwind base;
@tailwind components;
@tailwind utilities;
\`\`\`

## Documentation

Visit [tailwindcss.com](https://tailwindcss.com) for full documentation.`,
            
            'vitejs/vite': `# Vite

Vite is a build tool that aims to provide a faster and leaner development experience for modern web projects.

## Why Vite?

- **Instant Server Start**: No bundling needed before dev
- **Lightning Fast HMR**: Fast Hot Module Replacement
- **Rich Features**: TypeScript, JSX, CSS, etc. out of the box
- **Optimized Build**: Rollup-based production build

## Quick Start

\`\`\`bash
# Create a new Vite project
npm create vite@latest my-app -- --template react

# Install dependencies
cd my-app
npm install

# Start dev server
npm run dev
\`\`\`

## Configuration

Create \`vite.config.js\` in your project root:

\`\`\`js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()]
})
\`\`\`

## Links

- [Documentation](https://vitejs.dev/)
- [GitHub](https://github.com/vitejs/vite)`,
            
            'vercel/next.js': `# Next.js

Next.js is a React framework for production.

## Features

- **Hybrid Static & Server Rendering**: Use both static and server-rendered pages
- **File-system Routing**: Pages become routes automatically
- **API Routes**: Build API endpoints as part of your app
- **Built-in CSS Support**: Import CSS files directly in components
- **Code Splitting**: Automatic code splitting for faster page loads

## Getting Started

\`\`\`bash
npx create-next-app@latest my-app
cd my-app
npm run dev
\`\`\`

## Create a Page

Create \`pages/index.js\`:

\`\`\`jsx
export default function Home() {
  return <h1>Hello Next.js!</h1>
}
\`\`\`

## Documentation

Visit [nextjs.org/docs](https://nextjs.org/docs) for full documentation.`,
            
            'denoland/deno': `# Deno

Deno is a modern runtime for JavaScript and TypeScript.

## Key Features

- **Secure by default**: No file, network, or environment access unless explicitly enabled
- **TypeScript out of the box**: Supports TypeScript without additional tooling
- **Single executable**: Ships as a single binary
- **ES modules**: Uses ES modules as the default module system
- **Built-in tooling**: Includes formatter, linter, and test runner

## Installation

\`\`\`bash
# Using curl (macOS, Linux)
curl -fsSL https://deno.land/install.sh | sh

# Using PowerShell (Windows)
irm https://deno.land/install.ps1 | iex
\`\`\`

## Hello World

\`\`\`typescript
// hello.ts
console.log("Hello Deno!");

// Run with
// deno run hello.ts
\`\`\`

## Documentation

Visit [deno.land](https://deno.land) for full documentation.`,
            
            'oven-sh/bun': `# Bun

Bun is an all-in-one JavaScript runtime, bundler, test runner, and package manager.

## Features

- **Fast Startup**: Bun is designed to start fast
- **Package Manager**: Drop-in replacement for npm/yarn/pnpm
- **Bundler**: Bundle JavaScript/TypeScript for the browser
- **Test Runner**: Built-in test runner with Jest-like API
- **Runtime**: Compatible with Node.js APIs

## Installation

\`\`\`bash
# macOS, Linux
curl -fsSL https://bun.sh/install | bash

# npm
npm install -g bun
\`\`\`

## Quick Start

\`\`\`bash
# Create a new project
bun init

# Run a script
bun run index.ts

# Install dependencies
bun install
\`\`\`

## Links

- [Documentation](https://bun.sh/docs)
- [GitHub](https://github.com/oven-sh/bun)`,
            
            'rust-lang/rust': `# Rust

Rust is a systems programming language that runs blazingly fast, prevents segfaults, and guarantees thread safety.

## Why Rust?

- **Performance**: Zero-cost abstractions, no runtime, no garbage collector
- **Memory Safety**: Ownership system guarantees memory safety at compile time
- **Concurrency**: Fearless concurrency with thread safety guarantees
- **Interoperability**: Call C libraries with minimal overhead

## Installation

\`\`\`bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
\`\`\`

## Hello World

\`\`\`rust
// hello.rs
fn main() {
    println!("Hello, Rust!");
}

// Compile and run:
// rustc hello.rs
// ./hello
\`\`\`

## Documentation

Visit [rust-lang.org](https://www.rust-lang.org/) for full documentation.`,
            
            'langchain-ai/langchain': `# LangChain

LangChain is a framework for developing applications powered by language models.

## Features

- **Modular Components**: Building blocks for working with LLMs
- **Chains**: Sequences of calls to LLMs or other utilities
- **Agents**: Let LLMs decide which tools to use
- **Memory**: Persist state between chain calls
- **Integrations**: Support for OpenAI, Hugging Face, and more

## Installation

\`\`\`bash
# Python
pip install langchain

# JavaScript
npm install langchain
\`\`\`

## Basic Usage (Python)

\`\`\`python
from langchain.llms import OpenAI
from langchain.prompts import PromptTemplate

llm = OpenAI(temperature=0.9)
prompt = PromptTemplate.from_template("What is a good name for a company that makes {product}?")

chain = prompt | llm
result = chain.invoke({"product": "colorful socks"})
print(result)
\`\`\`

## Links

- [Documentation](https://python.langchain.com/)
- [GitHub](https://github.com/langchain-ai/langchain)`,
            
            'ollama/ollama': `# Ollama

Ollama allows you to run large language models locally.

## Features

- **Local Models**: Run models on your own hardware
- **Model Library**: Access to popular models like Llama 2, Mistral, and CodeLlama
- **Simple API**: REST API for easy integration
- **Cross-Platform**: Works on macOS, Linux, and Windows

## Installation

\`\`\`bash
# macOS
brew install ollama

# Linux
curl -fsSL https://ollama.com/install.sh | sh
\`\`\`

## Quick Start

\`\`\`bash
# Pull a model
ollama pull llama2

# Run the model
ollama run llama2 "Hello, how are you?"

# Start the server
ollama serve
\`\`\`

## API Usage

\`\`\`bash
curl http://localhost:11434/api/generate -d '{
  "model": "llama2",
  "prompt": "Why is the sky blue?"
}'
\`\`\`

## Links

- [Documentation](https://ollama.ai/docs)
- [GitHub](https://github.com/ollama/ollama)`,
            
            'abi/screenshot-to-code': `# Screenshot to Code

Drop in a screenshot and convert it to clean code (HTML/Tailwind/React/Vue).

## How It Works

1. Upload a screenshot of a design
2. AI analyzes the screenshot
3. Generates production-ready code
4. Copy and use in your project

## Features

- **Multiple Frameworks**: Supports HTML/Tailwind, React, Vue
- **Responsive**: Generates responsive layouts
- **Clean Code**: Produces readable, maintainable code
- **Fast**: Results in seconds

## Try It

Visit [screenshot-to-code.com](https://screenshot-to-code.com) to try it out.

## Links

- [GitHub](https://github.com/abi/screenshot-to-code)
- [Demo](https://screenshot-to-code.com/demo)`,
            
            'gpt-engineer-org/gpt-engineer': `# GPT Engineer

GPT Engineer lets you specify what you want it to build, asks clarifying questions, and then builds it.

## Philosophy

GPT Engineer is made to be:

- **Accessible**: Easy to use for non-technical users
- **Interactive**: Asks questions to clarify requirements
- **Transparent**: Shows you exactly what it's doing
- **Extensible**: Can be customized with your own prompts

## Installation

\`\`\`bash
pip install gpt-engineer
\`\`\`

## Usage

\`\`\`bash
# Create a new project
gpt-engineer create my-project

# Enter your prompt in the generated prompt file
# Then run:
gpt-engineer run my-project
\`\`\`

## Links

- [Documentation](https://gpt-engineer.readthedocs.io/)
- [GitHub](https://github.com/gpt-engineer-org/gpt-engineer)`,
            
            'open-webui/open-webui': `# Open WebUI

Open WebUI is a user-friendly WebUI for LLMs (Formerly Ollama WebUI).

## Features

- **User-Friendly Interface**: Clean, intuitive design
- **Multiple Models**: Support for various LLM backends
- **Chat History**: Save and revisit conversations
- **Markdown Support**: Rich text formatting
- **Responsive**: Works on desktop and mobile

## Quick Start with Docker

\`\`\`bash
docker run -d -p 3000:8080 \\
  -v open-webui:/app/backend/data \\
  --name open-webui \\
  ghcr.io/open-webui/open-webui:main
\`\`\`

## Manual Installation

\`\`\`bash
git clone https://github.com/open-webui/open-webui.git
cd open-webui
npm install
npm run build
npm start
\`\`\`

## Links

- [Documentation](https://openwebui.com/docs)
- [GitHub](https://github.com/open-webui/open-webui)
- [Demo](https://openwebui.com/)`
        }
    };
    
    // ==================== 路由匹配规则 ====================
    const ROUTES = [
        // 用户仓库列表
        {
            pattern: /\/users\/([^/]+)\/repos/,
            handler: (match) => {
                return { 
                    data: MOCK_DATA.repos,
                    headers: { 'x-ratelimit-limit': '5000', 'x-ratelimit-remaining': '4999', 'x-ratelimit-reset': String(Math.floor(Date.now() / 1000) + 3600) }
                };
            }
        },
        
        // 仓库分支
        {
            pattern: /\/repos\/([^/]+)\/([^/]+)\/branches/,
            handler: () => ({ data: MOCK_DATA.branches })
        },
        
        // 仓库标签
        {
            pattern: /\/repos\/([^/]+)\/([^/]+)\/tags/,
            handler: () => ({ data: MOCK_DATA.tags })
        },
        
        // 仓库信息
        {
            pattern: /\/repos\/([^/]+)\/([^/]+)(?:\/?$)/,
            handler: () => ({ data: MOCK_DATA.repoInfo })
        },
        
        // 社区资料
        {
            pattern: /\/repos\/([^/]+)\/([^/]+)\/community\/profile/,
            handler: () => ({ data: MOCK_DATA.communityProfile })
        },
        
        // Git 树 (文件列表)
        {
            pattern: /\/repos\/([^/]+)\/([^/]+)\/git\/trees\/([^/?]+)/,
            handler: (match) => {
                return { data: MOCK_DATA.treeData };
            }
        },
        
        // 提交记录
        {
            pattern: /\/repos\/([^/]+)\/([^/]+)\/commits/,
            handler: () => ({ data: MOCK_DATA.commits })
        },
        
        // 贡献者
        {
            pattern: /\/repos\/([^/]+)\/([^/]+)\/contributors/,
            handler: () => ({ data: MOCK_DATA.contributors })
        },
        
        // Issues
        {
            pattern: /\/repos\/([^/]+)\/([^/]+)\/issues/,
            handler: () => ({ data: MOCK_DATA.issues })
        },
        
        // 语言统计
        {
            pattern: /\/repos\/([^/]+)\/([^/]+)\/languages/,
            handler: () => ({ data: MOCK_DATA.languages })
        },
        
        // 活动事件
        {
            pattern: /\/repos\/([^/]+)\/([^/]+)\/events/,
            handler: () => ({ data: MOCK_DATA.events })
        },
        
        // CI 检查
        {
            pattern: /\/repos\/([^/]+)\/([^/]+)\/commits\/([^/]+)\/check-runs/,
            handler: () => ({ data: MOCK_DATA.checkRuns })
        },
        
        // 发行版
        {
            pattern: /\/repos\/([^/]+)\/([^/]+)\/releases/,
            handler: () => ({ data: MOCK_DATA.releases })
        },
        
        // 代码搜索
        {
            pattern: /\/search\/code/,
            handler: () => ({ data: MOCK_DATA.codeSearch })
        },
        
        // 仓库搜索 (用于 Discovery)
        {
            pattern: /\/search\/repositories/,
            handler: (match, url) => {
                // 解析 URL 参数
                const urlObj = new URL(url, window.location.origin);
                const q = urlObj.searchParams.get('q') || '';
                const sort = urlObj.searchParams.get('sort') || 'stars';
                
                console.log('%c[Mock] Discovery 搜索:', 'color: #9C27B0', { q, sort });
                
                // 如果是日期查询（趋势），返回趋势数据
                if (q.includes('created:>')) {
                    return { data: MOCK_DATA.trendingRepos };
                }
                
                // 否则返回普通搜索结果
                return { data: MOCK_DATA.searchRepos };
            }
        },
        
        // 获取 README 内容（修复版 - 支持中文）
        {
            pattern: /\/repos\/([^/]+)\/([^/]+)\/readme/,
            handler: (match) => {
                const owner = match[1];
                const repo = match[2];
                const fullName = `${owner}/${repo}`;
                
                // 获取对应的 README 内容，如果没有则使用默认
                const readmeContent = MOCK_DATA.discoveryReadmes[fullName] || MOCK_DATA.discoveryReadmes['facebook/react'];
                
                // 使用安全的 base64 编码
                const encodedContent = safeBtoa(readmeContent);
                
                return {
                    data: {
                        type: 'file',
                        encoding: 'base64',
                        size: readmeContent.length,
                        name: 'README.md',
                        path: 'README.md',
                        content: encodedContent,
                        sha: 'mock-readme-sha-123',
                        url: `https://api.github.com/repos/${owner}/${repo}/readme`,
                        git_url: `https://api.github.com/repos/${owner}/${repo}/git/blobs/mock-readme-sha-123`,
                        html_url: `https://github.com/${owner}/${repo}/blob/main/README.md`,
                        download_url: `https://raw.githubusercontent.com/${owner}/${repo}/main/README.md`,
                        _links: {
                            git: `https://api.github.com/repos/${owner}/${repo}/git/blobs/mock-readme-sha-123`,
                            self: `https://api.github.com/repos/${owner}/${repo}/readme`,
                            html: `https://github.com/${owner}/${repo}/blob/main/README.md`
                        }
                    }
                };
            }
        },
        
        // 原始文件内容 (raw.githubusercontent.com)
        {
            pattern: /raw\.githubusercontent\.com\/([^/]+)\/([^/]+)\/([^/]+)\/(.+)/,
            handler: (match) => {
                const path = match[4];
                const content = MOCK_DATA.fileContents[path] || MOCK_DATA.fileContents['README.md'];
                return { 
                    data: content,
                    isText: true,
                    headers: { 'content-type': 'text/plain' }
                };
            }
        },
        
        // 默认匹配 (用于不匹配的 API)
        {
            pattern: /.*/,
            handler: (match, url) => {
                console.log('%c[Mock] 未匹配的 URL:', 'color: #ff9800', url);
                return { data: {} };
            }
        }
    ];
    
    // ==================== 保存原始 fetch ====================
    const originalFetch = window.fetch;
    
    // ==================== 拦截器 ====================
    window.fetch = function(input, init) {
        const url = typeof input === 'string' ? input : input.url;
        
        console.log('%c[Mock] 拦截请求:', 'color: #2196F3', url);
        
        // 查找匹配的路由
        for (const route of ROUTES) {
            const match = url.match(route.pattern);
            if (match) {
                console.log('%c[Mock] 匹配路由:', 'color: #4CAF50', route.pattern);
                
                const result = route.handler(match, url);
                
                // 构建模拟响应
                const responseData = result.data;
                const responseHeaders = result.headers || {};
                
                // 如果是文本内容，直接返回文本
                if (result.isText) {
                    return Promise.resolve(new Response(responseData, {
                        status: 200,
                        statusText: 'OK',
                        headers: new Headers(responseHeaders)
                    }));
                }
                
                // 否则返回 JSON
                return Promise.resolve(new Response(JSON.stringify(responseData), {
                    status: 200,
                    statusText: 'OK',
                    headers: new Headers({
                        'Content-Type': 'application/json',
                        ...responseHeaders
                    })
                }));
            }
        }
        
        // 如果没有匹配的路由，继续使用原始 fetch
        console.log('%c[Mock] 未匹配，使用原始请求:', 'color: #ff9800', url);
        return originalFetch.call(this, input, init);
    };
    
    // ==================== 添加退出按钮到 UI ====================
    function addMockButton() {
        // 检查是否已存在
        if (document.getElementById('mock-exit-btn')) {
            return;
        }
        
        // 创建按钮
        const btn = document.createElement('button');
        btn.id = 'mock-exit-btn';
        btn.innerHTML = '🔌 退出模拟模式';
        btn.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            z-index: 99999;
            background: linear-gradient(135deg, #f44336, #d32f2f);
            color: white;
            border: none;
            border-radius: 50px;
            padding: 12px 24px;
            font-size: 16px;
            font-weight: bold;
            cursor: pointer;
            box-shadow: 0 4px 15px rgba(244, 67, 54, 0.3);
            transition: all 0.3s ease;
            border: 2px solid rgba(255, 255, 255, 0.2);
            letter-spacing: 0.5px;
        `;
        
        // 添加悬停效果
        btn.onmouseover = () => {
            btn.style.transform = 'scale(1.05)';
            btn.style.boxShadow = '0 6px 20px rgba(244, 67, 54, 0.4)';
        };
        btn.onmouseout = () => {
            btn.style.transform = 'scale(1)';
            btn.style.boxShadow = '0 4px 15px rgba(244, 67, 54, 0.3)';
        };
        
        // 点击事件
        btn.onclick = function() {
            if (window.fetch === originalFetch) {
                alert('模拟模式已退出（未激活）');
                return;
            }
            window.fetch = originalFetch;
            console.log('%c[Mock] 模拟模式已关闭，恢复原始 fetch', 'color: #f44336; font-size: 14px; font-weight: bold');
            
            // 更新按钮样式
            btn.innerHTML = '✅ 已退出';
            btn.style.background = 'linear-gradient(135deg, #4CAF50, #388E3C)';
            btn.style.boxShadow = '0 4px 15px rgba(76, 175, 80, 0.3)';
            
            // 3秒后移除按钮
            setTimeout(() => {
                btn.style.opacity = '0';
                setTimeout(() => {
                    if (btn.parentNode) btn.remove();
                }, 300);
            }, 2000);
        };
        
        document.body.appendChild(btn);
        console.log('%c[Mock] 退出按钮已添加到页面右下角', 'color: #4CAF50');
    }
    
    // 等待 DOM 加载完成后添加按钮
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', addMockButton);
    } else {
        addMockButton();
    }
    
    // 添加一个方便的退出方法（控制台可用）
    window.disableMock = function() {
        if (window.fetch === originalFetch) {
            console.log('%c[Mock] 模拟模式已关闭（未激活）', 'color: #f44336');
            return;
        }
        window.fetch = originalFetch;
        console.log('%c[Mock] 模拟模式已关闭，恢复原始 fetch', 'color: #f44336; font-size: 14px; font-weight: bold');
        
        // 移除按钮
        const btn = document.getElementById('mock-exit-btn');
        if (btn) {
            btn.innerHTML = '✅ 已退出';
            btn.style.background = 'linear-gradient(135deg, #4CAF50, #388E3C)';
            setTimeout(() => {
                btn.style.opacity = '0';
                setTimeout(() => btn.remove(), 300);
            }, 2000);
        }
    };
    
    // 输出使用说明
    console.log('%c📖 使用说明:', 'color: #FFC107; font-size: 14px');
    console.log('  ✅ 所有 GitHub API 请求现在返回模拟数据');
    console.log('  ✅ Repo Discovery 已支持（搜索/趋势）');
    console.log('  ✅ README 已修复，支持中文内容');
    console.log('  ✅ 点击右下角红色按钮可退出模拟模式');
    console.log('  ✅ 在控制台输入 `disableMock()` 也可退出');
    console.log('  ✅ 输入 `MOCK_DATA` 可以查看所有模拟数据');
    console.log('  ✅ 输入 `window.fetch === originalFetch` 检查是否在模拟模式');
    
    // 暴露 MOCK_DATA 到全局，方便调试
    window.MOCK_DATA = MOCK_DATA;
    window.originalFetch = originalFetch;
    
})();