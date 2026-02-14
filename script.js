const $ = s => document.querySelector(s);

// 状态变量
let currentFiles = [];
let currentRepoInfo = {};
let currentRefs = [];
let lastCheckedCheckbox = null;
let isDragging = false;
let startX = 0, startY = 0;
let selectionBox = null;
let initialCheckboxStates = new Map();
let discMode = 'search';
let markedLoaded = false;
let currentPreviewRepo = null;
let currentRawReadme = null;
let statusDataCache = { key: '' };
const readmeCache = new Map();

// 文本常量
const TEXT = {
    download: 'Download / 下载',
    zip: 'Zip / 打包',
    copied: 'Copied! / 已复制!',
    failedCopy: 'Failed / 失败',
    error: 'Error / 错误',
    analyzing: 'Analyzing... / 解析中...',
    fetchingBranches: 'Fetching branches... / 获取分支...',
    fetchingRepos: 'Fetching repos... / 获取仓库...',
    fetchingFileList: 'Fetching file list... / 获取文件列表...',
    selectRepo: 'Select Repo / 选择仓库',
    noFilesFound: 'No files found / 未找到文件',
    invalidUrl: 'Invalid URL / 无效链接',
    downloadingFiles: 'Downloading files... / 下载文件中...',
    zipping: 'Zipping... / 打包中...',
    done: 'Done! / 完成!',
    enterUrl: 'Please enter a URL / 请输入链接',
    analysisComplete: 'Analysis complete. Found {count} files. / 解析完成, 共找到 {count} 个文件.',
    preview: 'Preview / 预览',
    close: 'Close / 关闭',
    noSelection: 'No files selected / 未选择文件'
};

const t = (k, args = {}) => {
    let str = TEXT[k] || k;
    for (let key in args) {
        str = str.replace(new RegExp(`{${key}}`, 'g'), args[key]);
    }
    return str;
};

// 日志和提示
const log = t => {
    const st = $('#status-text');
    if (st) st.innerText = t;
    
    const container = $('#console-container');
    const cl = $('#console-log');
    if (cl && container) {
        container.style.display = 'block';
        const line = document.createElement('div');
        const time = new Date().toLocaleTimeString();
        line.innerText = `[${time}] ${t}`;
        line.style.borderBottom = '1px solid rgba(255,255,255,0.05)';
        line.style.padding = '2px 0';
        cl.appendChild(line);
        cl.scrollTop = cl.scrollHeight;
    }
    console.log(t);
};

const showToast = (message, type = 'info', duration = 3000) => {
    const container = $('#toast-container');
    const toast = document.createElement('div');
    toast.className = `toast-message ${type}`;
    
    let icon = 'ℹ️';
    if (type === 'success') icon = '✅';
    if (type === 'error') icon = '❌';
    
    toast.innerHTML = `<div class="toast-icon">${icon}</div><div>${message.replace(/\n/g, '<br>')}</div>`;
    container.appendChild(toast);
    
    requestAnimationFrame(() => toast.classList.add('show'));
    
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            if (container.contains(toast)) container.removeChild(toast);
        }, 300);
    }, duration);
    
    log(`[Toast: ${type}] ${message}`);
};

const clearLog = () => {
    $('#console-log').innerHTML = '';
    $('#console-container').style.display = 'none';
};

const setProgress = (percent) => {
    $('#progress-bar').style.width = `${percent}%`;
    $('#progress-container').style.display = 'block';
};

// 工具函数
const formatSize = (bytes) => {
    if (bytes === undefined || bytes === null) return '';
    if (bytes === 0) return '0 B';
    const units = ['B', 'KB', 'MB', 'GB'];
    let i = 0;
    while (bytes >= 1024 && i < units.length - 1) {
        bytes /= 1024;
        i++;
    }
    return `${bytes.toFixed(1)} ${units[i]}`;
};

const formatCompactNumber = (num) => {
    return Intl.NumberFormat('en-US', { notation: "compact", maximumFractionDigits: 1 }).format(num);
};

const timeAgo = (date) => {
    const seconds = Math.floor((new Date() - date) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + "y ago";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + "mo ago";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + "d ago";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + "h ago";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + "m ago";
    return Math.floor(seconds) + "s ago";
};

const getFileIcon = () => {
    return `<svg viewBox="0 0 16 16" width="14" height="14" fill="currentColor" style="opacity:0.6"><path d="M2 1.75C2 .784 2.784 0 3.75 0h6.586c.464 0 .909.184 1.237.513l2.914 2.914c.329.328.513.773.513 1.237v9.586A1.75 1.75 0 0 1 13.25 16h-9.5A1.75 1.75 0 0 1 2 14.25Zm1.75-.25a.25.25 0 0 0-.25.25v12.5c0 .138.112.25.25.25h9.5a.25.25 0 0 0 .25-.25V4.664a.25.25 0 0 0-.073-.177l-2.914-2.914a.25.25 0 0 0-.177-.073ZM6 5h4v1H6V5Zm0 3h4v1H6V8Zm0 3h2v1H6v-1Z"></path></svg>`;
};

const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
        log(`${t('copied')}: ${text}`);
    }).catch(err => {
        console.error(t('failedCopy'), err);
        log(t('failedCopy') + ': ' + err);
    });
};

const toggleSettings = (el) => {
    const panel = $('#settings-panel');
    const isOpen = panel.style.display === 'block';
    panel.style.display = isOpen ? 'none' : 'block';
    if (el) el.classList.toggle('open', !isOpen);
};

// API 请求
const fetchWithProxy = async (url, type = 'api') => {
    const apiProxy = $('#api-proxy').value.trim();
    const token = $('#gh-token').value.trim();
    const headers = {};
    if (token) headers['Authorization'] = `token ${token}`;

    let finalUrl = url;
    if (type === 'api' && apiProxy) {
        finalUrl = apiProxy + url;
    } 
    
    const response = await fetch(finalUrl, { headers });
    
    const limit = response.headers.get('x-ratelimit-limit');
    const remaining = response.headers.get('x-ratelimit-remaining');
    const reset = response.headers.get('x-ratelimit-reset');
    
    if (remaining !== null) {
        const el = $('#api-status');
        if (el) {
            const r = parseInt(remaining, 10);
            const l = parseInt(limit, 10);
            const percentage = (r / l) * 100;
            
            let level = 'high';
            if (percentage < 20) level = 'low';
            else if (percentage < 50) level = 'medium';
            
            el.setAttribute('data-level', level);
            
            const resetDate = new Date(parseInt(reset, 10) * 1000);
            el.title = `API: ${r}/${l} remaining\nResets: ${resetDate.toLocaleTimeString()}`;
        }
    }
    
    return response;
};

// URL 解析
const parseGitHubUrl = (url) => {
    url = url.trim();
    url = url.split(/[?#]/)[0];

    if (url.startsWith('git@github.com:')) {
        url = url.replace('git@github.com:', 'https://github.com/').replace(/\.git$/, '');
    }

    const shortMatch = url.match(/^\/?([a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?)\/([a-zA-Z0-9._-]+)$/);
    if (shortMatch) {
        return { owner: shortMatch[1], repo: shortMatch[2] };
    }

    const deepMatch = url.match(/^\/?([a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?)\/([a-zA-Z0-9._-]+)\/(tree|blob)\/([^/]+)(?:\/(.*))?$/);
    if (deepMatch) {
        return { owner: deepMatch[1], repo: deepMatch[2], type: deepMatch[3], ref: deepMatch[4], path: deepMatch[5] || '' };
    }
    
    if (url.match(/^(www\.)?github\.com\//)) {
        url = 'https://' + url;
    }
    
    const rawMatch = url.match(/raw\.githubusercontent\.com\/([^/]+)\/([^/]+)\/([^/]+)\/(.+)/);
    if (rawMatch) {
        return { owner: rawMatch[1], repo: rawMatch[2], type: 'blob', ref: rawMatch[3], path: rawMatch[4] };
    }

    url = url.replace(/\.git$/, '');
    
    const commitMatch = url.match(/github\.com\/([^/]+)\/([^/]+)\/commit\/([a-f0-9]+)/);
    if (commitMatch) {
        return { owner: commitMatch[1], repo: commitMatch[2], type: 'tree', ref: commitMatch[3], path: '' };
    }

    const releaseMatch = url.match(/github\.com\/([^/]+)\/([^/]+)\/releases\/tag\/([^/]+)/);
    if (releaseMatch) {
        return { owner: releaseMatch[1], repo: releaseMatch[2], type: 'tree', ref: releaseMatch[3], path: '' };
    }
    
    const userMatch = url.match(/github\.com\/([^/]+)\/?$/);
    if (userMatch) {
        return { owner: userMatch[1], type: 'user' };
    }

    const match = url.match(/github\.com\/([^/]+)\/([^/]+)(?:\/(tree|blob)\/([^/]+)(?:\/(.*))?)?/);
    if (!match) return null;
    return { owner: match[1], repo: match[2], type: match[3], ref: match[4], path: match[5] || '' };
};

// 下载功能
const downloadSingleFile = (url, filename) => {
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
};

const getSelectedFiles = (scopePath = null) => {
    const checkedInputs = Array.from(document.querySelectorAll('.tree-checkbox:checked[data-type="file"]'));
    const checkedPaths = new Set(checkedInputs.map(i => i.getAttribute('data-path')));
    
    let files = currentFiles.filter(f => checkedPaths.has(f.path));
    
    if (scopePath) {
        files = files.filter(f => f.path === scopePath || f.path.startsWith(scopePath + '/'));
    }
    return files;
};

const ensureJSZip = async () => {
    if (window.JSZip) return;
    
    const loadScript = (urls) => {
        return new Promise((resolve, reject) => {
            const s = document.createElement('script');
            s.src = urls[0];
            s.onload = resolve;
            s.onerror = () => {
                if (urls.length > 1) {
                    loadScript(urls.slice(1)).then(resolve).catch(reject);
                } else {
                    reject();
                }
            };
            document.head.appendChild(s);
        });
    };
    
    await loadScript([
        'jszip.min.js',
        'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js',
        'https://unpkg.com/jszip@3.10.1/dist/jszip.min.js'
    ]);
    
    if (!window.JSZip) throw new Error('JSZip loaded but not available on window');
};

// 修复：Bug #1 - 计数器错误
const downloadFilesAsZip = async (files, zipName) => {
    await ensureJSZip();
    $('#btn-analyze').disabled = true;
    $('#btn-download').disabled = true;
    
    const zip = new JSZip();
    let completedCount = 0;
    const totalFiles = files.length;
    log(t('downloadingFiles', { count: totalFiles }));
    setProgress(0);

    const limit = 10;
    for (let i = 0; i < totalFiles; i += limit) {
        const batch = files.slice(i, i + limit);
        await Promise.all(batch.map(async f => {
            const bar = f.domId ? document.getElementById(f.domId) : null;
            if (bar) bar.style.width = '20%'; 
            
            try {
                const response = await fetch(f.url);
                const blob = await response.blob();
                zip.file(f.path, blob);
                if (bar) bar.style.width = '100%';
            } catch (e) { 
                console.error(e);
                if (bar) {
                    bar.style.backgroundColor = 'red';
                    bar.style.width = '100%';
                }
            }
            
            completedCount++;
            const percent = (completedCount / totalFiles * 100).toFixed(0);
            log(`${t('downloadingFiles', { count: totalFiles })} (${percent}%)`);
            setProgress(percent);
        }));
    }

    const content = await zip.generateAsync({ type: "blob" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(content);
    a.download = zipName;
    a.click();
    
    log(t('done'));
    $('#progress-container').style.display = 'none';
    $('#btn-download').disabled = false;
};

const downloadFolderZip = async (folderPath) => {
    const filesToZip = getSelectedFiles(folderPath);
    
    if (filesToZip.length === 0) {
        log(t('noSelection'));
        return;
    }
    
    const { owner, repo, ref } = currentRepoInfo;
    const safeRef = ref.replace(/[\/\\]/g, '-');
    const safePath = folderPath.replace(/[\/\\]/g, '-');
    const zipName = `${owner}-${repo}-${safeRef}-${safePath}.zip`;

    await downloadFilesAsZip(filesToZip, zipName);
};

const downloadZip = async () => {
    const filesToZip = getSelectedFiles();
    if (filesToZip.length === 0) {
        log(t('noSelection'));
        return;
    }
    
    const { owner, repo, ref, path } = currentRepoInfo;
    const safeRef = ref.replace(/[\/\\]/g, '-');
    let zipName = `${owner}-${repo}-${safeRef}`;
    
    if (path) {
        const safePath = path.replace(/[\/\\]/g, '-');
        zipName += `-${safePath}`;
    }
    zipName += '.zip';

    await downloadFilesAsZip(filesToZip, zipName);
};

// 预览功能
const previewFile = async (url, filename, filepath) => {
    const ext = filename.split('.').pop().toLowerCase();

    if (ext === 'md' || ext === 'markdown') {
        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const text = await response.text();
            
            await ensureMarked();
            showMarkdownFile(filename, text, url, filepath);
            return;
        } catch(e) {
            console.error('MD Preview failed', e);
        }
    }

    const isImg = ['png','jpg','jpeg','gif','svg'].includes(ext);
    
    $('#preview-title').innerText = filename;
    $('#preview-body').innerHTML = 'Loading...';
    $('#preview-modal').style.display = 'flex';
    
    try {
        if (isImg) {
            $('#preview-body').innerHTML = `<img src="${url}" class="preview-image">`;
        } else {
            const response = await fetch(url);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const text = await response.text();
            
            const safeText = text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
            $('#preview-body').innerHTML = `<div class="preview-code">${safeText}</div>`;
        }
    } catch (e) {
        console.error('Preview error:', e);
        $('#preview-body').innerText = t('error') + ': ' + e.message;
    }
};

const closePreview = () => {
    $('#preview-modal').style.display = 'none';
};

// 复选框树逻辑
const toggleAll = (checkbox, event) => {
    if (event && event.shiftKey && lastCheckedCheckbox && lastCheckedCheckbox !== checkbox) {
        const all = Array.from(document.querySelectorAll('.tree-checkbox'));
        const start = all.indexOf(lastCheckedCheckbox);
        const end = all.indexOf(checkbox);
        
        if (start !== -1 && end !== -1) {
            const low = Math.min(start, end);
            const high = Math.max(start, end);
            for (let i = low; i <= high; i++) {
                const c = all[i];
                if (c !== checkbox) {
                    c.checked = checkbox.checked;
                    c.indeterminate = false; 
                    if (c.getAttribute('data-type') === 'folder') handleFolderSelect(c, false); 
                    updateParentState(c); 
                }
            }
        }
    }
    
    if (checkbox.getAttribute('data-type') === 'folder') {
        handleFolderSelect(checkbox);
    }
    
    updateParentState(checkbox);
    lastCheckedCheckbox = checkbox;
};

const handleFolderSelect = (checkbox, recurseUp = true) => {
    const details = checkbox.closest('details');
    if (details) {
        const container = details.querySelector('.children-container');
        if (container) {
            const children = container.querySelectorAll('.tree-checkbox');
            children.forEach(c => {
                c.checked = checkbox.checked;
                c.indeterminate = false; 
            });
        }
    }
    if (recurseUp) updateParentState(checkbox);
};

const updateParentState = (checkbox) => {
    let container = checkbox.closest('.children-container');
    if (!container) return;

    let parentDetails = container.parentElement;
    if (!parentDetails) return;

    let parentSummary = parentDetails.querySelector('summary');
    if (!parentSummary) return;

    let parentCheckbox = parentSummary.querySelector('.tree-checkbox');
    if (!parentCheckbox) return;

    const siblingCheckboxes = Array.from(container.querySelectorAll(':scope > .tree-item .tree-checkbox, :scope > details > summary .tree-checkbox'));
    
    const allChecked = siblingCheckboxes.every(c => c.checked);
    const someChecked = siblingCheckboxes.some(c => c.checked || c.indeterminate);
    
    const newState = allChecked;
    const newIndeterminate = someChecked && !allChecked;
    
    if (parentCheckbox.checked !== newState || parentCheckbox.indeterminate !== newIndeterminate) {
        parentCheckbox.checked = newState;
        parentCheckbox.indeterminate = newIndeterminate;
        updateParentState(parentCheckbox);
    }
};

// 拖动选择
const getBodyOffset = () => {
    const rect = document.body.getBoundingClientRect();
    return { left: rect.left + window.scrollX, top: rect.top + window.scrollY };
};

document.addEventListener('mousedown', (e) => {
    const treeView = document.getElementById('tree-view');
    if (!treeView || treeView.style.display === 'none') return;
    if (!treeView.contains(e.target)) return;
    
    if (['INPUT', 'A', 'BUTTON', 'SUMMARY'].includes(e.target.tagName) || 
        e.target.closest('summary') || e.target.closest('.action-btn')) return;

    isDragging = true;
    
    const offset = getBodyOffset();
    startX = e.pageX - offset.left;
    startY = e.pageY - offset.top;
    
    if (!selectionBox) {
        selectionBox = document.createElement('div');
        selectionBox.className = 'selection-box';
        document.body.appendChild(selectionBox);
    }
    
    selectionBox.style.left = startX + 'px';
    selectionBox.style.top = startY + 'px';
    selectionBox.style.width = '0px';
    selectionBox.style.height = '0px';
    selectionBox.style.display = 'block';
    
    initialCheckboxStates.clear();
    document.querySelectorAll('.tree-checkbox').forEach(cb => {
        initialCheckboxStates.set(cb, cb.checked);
    });
    
    e.preventDefault();
});

document.addEventListener('mousemove', (e) => {
    if (!isDragging || !selectionBox) return;
    
    const offset = getBodyOffset();
    const currentX = e.pageX - offset.left;
    const currentY = e.pageY - offset.top;
    
    const width = Math.abs(currentX - startX);
    const height = Math.abs(currentY - startY);
    const left = Math.min(currentX, startX);
    const top = Math.min(currentY, startY);
    
    selectionBox.style.width = width + 'px';
    selectionBox.style.height = height + 'px';
    selectionBox.style.left = left + 'px';
    selectionBox.style.top = top + 'px';
    
    const items = document.querySelectorAll('.tree-item');
    items.forEach(item => {
        if (item.offsetParent === null) return;

        const rect = item.getBoundingClientRect();
        const itemLeft = rect.left + window.scrollX - offset.left;
        const itemTop = rect.top + window.scrollY - offset.top;
        
        const intersect = (left < itemLeft + rect.width && left + width > itemLeft && 
                          top < itemTop + rect.height && top + height > itemTop);
        
        if (intersect) {
            item.classList.add('selecting');
            const checkbox = item.querySelector('.tree-checkbox');
            if (checkbox) {
                const wasChecked = initialCheckboxStates.get(checkbox);
                checkbox.checked = !wasChecked;
                checkbox.indeterminate = false;
            }
        } else {
            if (item.classList.contains('selecting')) {
                item.classList.remove('selecting');
                const checkbox = item.querySelector('.tree-checkbox');
                if (checkbox) {
                    checkbox.checked = initialCheckboxStates.get(checkbox);
                }
            }
        }
    });
});

document.addEventListener('mouseup', (e) => {
    if (!isDragging) return;
    isDragging = false;
    if (selectionBox) selectionBox.style.display = 'none';
    
    const affectedItems = document.querySelectorAll('.tree-item.selecting');
    affectedItems.forEach(item => item.classList.remove('selecting'));
    
    const changedCheckboxes = [];
    affectedItems.forEach(item => {
        const cb = item.querySelector('.tree-checkbox');
        if(cb) changedCheckboxes.push(cb);
    });
    
    changedCheckboxes.forEach(cb => {
        if (cb.getAttribute('data-type') === 'folder') {
            handleFolderSelect(cb, false);
        }
    });

    changedCheckboxes.reverse().forEach(cb => updateParentState(cb));
    
    initialCheckboxStates.clear();
});

// 面包屑
const renderBreadcrumbs = (owner, repo, branch, path) => {
    const container = $('#breadcrumbs');
    container.innerHTML = '';
    
    const parts = [
        { name: owner, url: `https://github.com/${owner}` },
        { name: repo, url: `https://github.com/${owner}/${repo}` },
        { name: branch, url: `https://github.com/${owner}/${repo}/tree/${branch}` }
    ];
    
    if (path) {
        path.split('/').forEach((p, i, arr) => {
            const currentPath = arr.slice(0, i + 1).join('/');
            parts.push({ 
                name: p, 
                url: `https://github.com/${owner}/${repo}/tree/${branch}/${currentPath}`,
                isPath: true
            });
        });
    }
    
    parts.forEach((p, i) => {
        const span = document.createElement('span');
        span.className = 'breadcrumb-item';
        span.innerText = p.name;
        span.onclick = () => {
            $('#url').value = p.url;
            start();
        };
        container.appendChild(span);
        
        if (i < parts.length - 1) {
            const sep = document.createElement('span');
            sep.className = 'breadcrumb-separator';
            sep.innerText = '/';
            container.appendChild(sep);
        }
    });
};

// 树渲染
// 修复：Bug #2 - childrenContainer 未正确添加
const renderTree = (files, rootPath) => {
    lastCheckedCheckbox = null;
    const tree = {};
    
    files.forEach(file => {
        const relativePath = file.path.replace(rootPath, '').replace(/^\//, '');
        const parts = relativePath.split('/');
        let current = tree;
        
        parts.forEach((part, i) => {
            if (!current[part]) {
                if (i === parts.length - 1) {
                    current[part] = { __file: file };
                } else {
                    current[part] = { __path: (current.__path ? current.__path + '/' : (rootPath ? rootPath + '/' : '')) + part };
                }
            }
            current = current[part];
        });
    });
    
    function fixPath(node, prefix) {
        Object.keys(node).forEach(key => {
            if (key.startsWith('__')) return;
            const fullPath = prefix ? prefix + '/' + key : key;
            if (!node[key].__file) {
                node[key].__path = fullPath;
                fixPath(node[key], fullPath);
            }
        });
    }
    fixPath(tree, rootPath);

    const container = $('#tree-view');
    container.innerHTML = '';
    container.style.display = 'block';
    
    function createNode(name, obj) {
        const isFile = obj.__file;
        const isFolder = !isFile;

        const div = document.createElement('div');
        div.className = 'tree-item';
        div.setAttribute('tabindex', '0');
        
        const iconHtml = isFile 
            ? `<span class="file-icon">${getFileIcon()}</span>` 
            : `<span class="folder-arrow"><svg viewBox="0 0 16 16" width="10" height="10" fill="currentColor"><path d="M6.427 4.427l3.396 3.396a.25.25 0 0 1 0 .354l-3.396 3.396A.25.25 0 0 1 6 11.396V4.604a.25.25 0 0 1 .427-.177z"></path></svg></span><span class="folder-icon"><svg viewBox="0 0 16 16" width="14" height="14" fill="currentColor" style="color:#54aeff"><path d="M1.75 1A1.75 1.75 0 0 0 0 2.75v10.5C0 14.216.784 15 1.75 15h12.5A1.75 1.75 0 0 0 16 13.25v-8.5A1.75 1.75 0 0 0 14.25 3H7.5a.25.25 0 0 1-.2-.1l-.9-1.2C6.07 1.26 5.55 1 5 1H1.75Z"></path></svg></span>`;

        let actionsHtml = '';
        let progressHtml = '';
        let sizeHtml = '';
        let clickAction = '';

        if (isFile) {
            const safeId = 'file-' + obj.__file.path.replace(/[^a-zA-Z0-9]/g, '-');
            obj.__file.domId = safeId;
            
            progressHtml = `<div class="file-progress-wrap"><div class="file-progress-bar" id="${safeId}"></div></div>`;
            actionsHtml = `
                <span class="action-btn" onclick="copyToClipboard('${obj.__file.repoUrl}')" title="Copy GitHub Link">Repo</span>
                <span class="action-btn" onclick="copyToClipboard('${obj.__file.url}')" title="Copy Raw Link">Raw</span>
                <span class="action-btn" onclick="downloadSingleFile('${obj.__file.url}', '${name}')" title="Download File">${t('download')}</span>
            `;
            sizeHtml = `<span class="file-size">${formatSize(obj.__file.size)}</span>`;
            
            const safePath = obj.__file.path.replace(/'/g, "\\'");
            clickAction = `onclick="previewFile('${obj.__file.url}', '${name}', '${safePath}')" style="cursor:pointer; text-decoration:underline;"`;
        } else {
            const folderPath = obj.__path;
            const repoUrl = `https://github.com/${currentRepoInfo.owner}/${currentRepoInfo.repo}/tree/${currentRepoInfo.ref}/${folderPath}`;
            actionsHtml = `
                <span class="action-btn" onclick="copyToClipboard('${repoUrl}')" title="Copy GitHub Link">Repo</span>
                <span class="action-btn" onclick="downloadFolderZip('${folderPath}')" title="Download Folder as ZIP">${t('zip')}</span>
            `;
        }

        const checkboxHtml = `<input type="checkbox" class="tree-checkbox" checked onclick="event.stopPropagation()" onchange="toggleAll(this, event)" data-path="${isFile ? obj.__file.path : obj.__path}" data-type="${isFile ? 'file' : 'folder'}">`;

        div.innerHTML = `
            <div class="tree-content">
                <div class="tree-item-left">
                    ${checkboxHtml}
                    ${iconHtml}
                    <span class="file-name" title="${name}" ${clickAction}>${name}</span>
                </div>
                <div style="display:flex; align-items:center;">
                    ${sizeHtml}
                    ${actionsHtml}
                    ${progressHtml}
                </div>
            </div>
        `;
        
        if (isFolder) {
            const details = document.createElement('details');
            const summary = document.createElement('summary');
            summary.appendChild(div);
            details.appendChild(summary);
            
            const childrenContainer = document.createElement('div');
            childrenContainer.className = 'children-container';
            details.appendChild(childrenContainer);
            
            details.__treeNode = obj;
            details.__rendered = false;
            
            details.addEventListener('toggle', function() {
                if (this.open && !this.__rendered) {
                    this.__rendered = true;
                    const nodeObj = this.__treeNode;
                    const container = this.querySelector('.children-container');
                    
                    const keys = Object.keys(nodeObj).filter(k => !k.startsWith('__'));
                    const folders = keys.filter(k => !nodeObj[k].__file).sort();
                    const files = keys.filter(k => nodeObj[k].__file).sort();
                    
                    [...folders, ...files].forEach(key => {
                        const childNode = createNode(key, nodeObj[key]);
                        container.appendChild(childNode);
                    });
                    
                    const parentCb = this.querySelector('.tree-checkbox');
                    if (parentCb && !parentCb.indeterminate) {
                        const childCbs = container.querySelectorAll('.tree-checkbox');
                        childCbs.forEach(cb => cb.checked = parentCb.checked);
                    }
                }
            });
            
            return details;
        } else {
            return div;
        }
    }
    
    const keys = Object.keys(tree).filter(k => !k.startsWith('__'));
    const folders = keys.filter(k => !tree[k].__file).sort();
    const rootFiles = keys.filter(k => tree[k].__file).sort();
    
    [...folders, ...rootFiles].forEach(key => {
        const node = createNode(key, tree[key]);
        container.appendChild(node);
    });
};

// 快捷键
document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'f') {
        e.preventDefault();
        const searchInput = document.getElementById('file-search');
        if (searchInput && !searchInput.disabled) {
            searchInput.focus();
            searchInput.select();
        }
        return;
    }

    const active = document.activeElement;
    const isTreeItem = active.classList.contains('tree-item');
    
    if (isTreeItem) {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            const allItems = Array.from(document.querySelectorAll('.tree-item'));
            const visibleItems = allItems.filter(el => el.offsetParent !== null);
            const index = visibleItems.indexOf(active);
            if (index !== -1 && index < visibleItems.length - 1) {
                visibleItems[index + 1].focus();
            }
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            const allItems = Array.from(document.querySelectorAll('.tree-item'));
            const visibleItems = allItems.filter(el => el.offsetParent !== null);
            const index = visibleItems.indexOf(active);
            if (index !== -1 && index > 0) {
                visibleItems[index - 1].focus();
            }
        } else if (e.key === ' ' || e.key === 'Enter') {
            e.preventDefault();
            
            const details = active.closest('details');
            if (details && details.querySelector('summary > .tree-item') === active) {
                if (e.key === 'Enter') {
                    details.open = !details.open;
                } else {
                    const cb = active.querySelector('.tree-checkbox');
                    if(cb) {
                        cb.checked = !cb.checked;
                        toggleAll(cb, { stopPropagation: () => {} });
                    }
                }
            } else {
                if (e.key === 'Enter') {
                    const nameSpan = active.querySelector('.file-name');
                    if(nameSpan) nameSpan.click();
                } else {
                    const cb = active.querySelector('.tree-checkbox');
                    if(cb) {
                        cb.checked = !cb.checked;
                        toggleAll(cb, { stopPropagation: () => {} });
                    }
                }
            }
        }
    }
});

// 搜索
const performFileSearch = () => {
    const val = $('#file-search').value.trim().toLowerCase();
    
    if (!val) {
        renderTree(currentFiles, currentRepoInfo.path);
        log('Search cleared.');
        return;
    }
    
    log(`Searching for "${val}"...`);
    
    const filtered = currentFiles.filter(f => f.path.toLowerCase().includes(val));
    
    log(`Found ${filtered.length} matches.`);
    
    renderTree(filtered, currentRepoInfo.path);
    
    const details = document.querySelectorAll('#tree-view details');
    details.forEach(d => d.open = true);
};

// 主要逻辑
const start = async () => {
    let url = $('#url').value.trim();
    if (!url) return log(t('enterUrl'));
    
    if (!url.startsWith('http') && !url.startsWith('git@')) {
        if (url.indexOf('github.com') === -1) {
            url = 'https://github.com/' + url;
        } else {
            url = 'https://' + url;
        }
        $('#url').value = url;
    }

    $('#btn-analyze').disabled = true;
    $('#btn-download').disabled = true;
    $('#btn-export-ai').disabled = true;
    $('#btn-github1s').disabled = true;
    $('#btn-status').disabled = true;
    $('#btn-release').disabled = true;
    $('#btn-code-search').disabled = true;
    $('#progress-container').style.display = 'none';
    $('#progress-bar').style.width = '0%';
    $('#tree-view').style.display = 'none';
    $('#file-search').disabled = true;
    $('#btn-search-file').disabled = true;
    $('#file-search').value = '';
    log(t('analyzing'));

    const parsed = parseGitHubUrl(url);
    if (!parsed) {
        log(t('invalidUrl'));
        $('#btn-analyze').disabled = false;
        return;
    }
    
    const { owner, repo, type, path: urlPath } = parsed;
    let ref = parsed.ref;
    let path = urlPath;
    
    if (parsed.type === 'user') {
        await handleUserRepos(parsed.owner);
        return;
    }

    log(t('fetchingBranches'));
    
    try {
        const [branches, tags] = await Promise.all([
            fetchWithProxy(`https://api.github.com/repos/${owner}/${repo}/branches`).then(r => r.json()),
            fetchWithProxy(`https://api.github.com/repos/${owner}/${repo}/tags`).then(r => r.json())
        ]);

        if (branches.message) throw new Error(branches.message);

        const branchNames = branches.map(b => b.name);
        const tagNames = tags.map(t => t.name);
        const refs = [...branchNames, ...tagNames].sort((a, b) => b.length - a.length);
        currentRefs = refs;

        const selector = $('#ref-selector');
        selector.innerHTML = '';
        
        const displayRefs = [...currentRefs].sort((a, b) => {
            const pA = (a === 'main' || a === 'master') ? 1 : 0;
            const pB = (b === 'main' || b === 'master') ? 1 : 0;
            if (pA !== pB) return pB - pA;
            return a.localeCompare(b);
        });

        if (!ref) {
            const repoInfo = await fetchWithProxy(`https://api.github.com/repos/${owner}/${repo}`).then(r => r.json());
            ref = repoInfo.default_branch || 'master';
        } else {
            const potentialRef = ref + (path ? '/' + path : '');
            const matchedRef = refs.find(r => potentialRef === r || potentialRef.startsWith(r + '/'));
            
            if (matchedRef) {
                ref = matchedRef;
                path = potentialRef.substring(matchedRef.length).replace(/^\//, '');
            }
        }
        
        displayRefs.forEach(r => {
            const option = document.createElement('option');
            option.value = r;
            option.text = r;
            option.selected = r === ref;
            selector.appendChild(option);
        });
        
        $('#breadcrumbs-container').style.display = 'flex';

        currentRepoInfo = { owner, repo, path: path || '' };
        await fetchAndRenderTree(owner, repo, ref, path);

        $('#btn-status').disabled = false;
        $('#btn-release').disabled = false;
        $('#btn-github1s').disabled = false;

    } catch (e) {
        console.error(e);
        showToast(t('error') + ': ' + e.message, 'error');
    } finally {
        $('#btn-analyze').disabled = false;
    }
};

const handleUserRepos = async (owner) => {
    log(t('fetchingRepos'));
    try {
        const repos = await fetchWithProxy(`https://api.github.com/users/${owner}/repos?per_page=100&sort=updated`).then(r => r.json());
        if (repos.message) throw new Error(repos.message);
        if (!repos.length) throw new Error(t('noFilesFound'));
        
        const container = $('#tree-view');
        container.innerHTML = '';
        container.style.display = 'block';
        
        repos.forEach(repo => {
            const div = document.createElement('div');
            div.className = 'tree-item';
            div.style.padding = '5px 10px';
            div.style.cursor = 'pointer';
            div.innerHTML = `
                <div style="display:flex; align-items:center;">
                    <span class="folder-icon"><svg viewBox="0 0 16 16" width="14" height="14" fill="currentColor"><path d="M2 2.5A2.5 2.5 0 0 1 4.5 0h8.75a.75.75 0 0 1 .75.75v12.5a.75.75 0 0 1-.75.75h-2.5a.75.75 0 1 1 0-1.5h1.75v-2h-8v2h1.75a.75.75 0 0 1 0 1.5h-2.5a.75.75 0 0 1-.75-.75V2.5Zm2.5-.5a1 1 0 0 0-1 1v1h10v-1a1 1 0 0 0-1-1H4.5Zm0 3.5v7.5h10v-7.5H4.5Z"></path></svg></span>
                    <span class="file-name" style="font-weight:600">${repo.name}</span>
                    <span style="margin-left:10px; font-size:12px; color:#6a737d;">${repo.description || ''}</span>
                </div>
            `;
            div.onclick = () => {
                $('#url').value = repo.html_url;
                start();
            };
            container.appendChild(div);
        });
        
        log(t('selectRepo'));
        $('#breadcrumbs-container').style.display = 'none';
        window.history.pushState(null, '', '/?' + `https://github.com/${owner}`);
        
    } catch(e) {
        console.error(e);
        showToast(t('error') + ': ' + e.message, 'error');
    } finally {
        $('#btn-analyze').disabled = false;
        if (currentRepoInfo.owner) $('#btn-status').disabled = false;
    }
};

const onRefChange = async () => {
    const ref = $('#ref-selector').value;
    const { owner, repo, path } = currentRepoInfo;
    if (!owner || !repo) return;
    
    $('#btn-analyze').disabled = true;
    $('#btn-download').disabled = true;
    
    try {
        await fetchAndRenderTree(owner, repo, ref, path);
    } catch(e) {
        console.error(e);
        showToast(t('error') + ': ' + e.message, 'error');
    } finally {
        $('#btn-analyze').disabled = false;
    }
};

// 修复：Bug #4 - 模板替换优化
const fetchAndRenderTree = async (owner, repo, ref, path) => {
    log(t('fetchingFileList'));
    let files = [];
    
    try {
        const treeUrl = `https://api.github.com/repos/${owner}/${repo}/git/trees/${ref}?recursive=1`;
        const treeData = await fetchWithProxy(treeUrl).then(r => r.json());
        
        if (treeData.message) throw new Error(treeData.message);
        if (treeData.truncated) {
            const msg = 'Warning: Repository is too large (>100k files). File list is truncated.';
            log(msg);
            showToast(msg, 'info', 5000);
        }
        
        files = treeData.tree.filter(i => i.type === 'blob');

        if (path) {
            files = files.filter(i => i.path === path || i.path.startsWith(path + '/'));
        }
        
    } catch (e) {
        throw e;
    }
    
    if (!files.length) throw new Error(t('noFilesFound'));

    $('#btn-status').disabled = false;

    const template = $('#url-template').value.trim() || 'https://raw.githubusercontent.com/{owner}/{repo}/{ref}/{path}';
    const branch = ref;
    
    // 修复：使用更安全的替换方式
    files = files.map(i => {
        let fileUrl = template
            .replace(/\{owner\}/g, owner)
            .replace(/\{repo\}/g, repo)
            .replace(/\{ref\}/g, branch)
            .replace(/\{branch\}/g, branch)
            .replace(/\{path\}/g, i.path);
        
        const repoUrl = `https://github.com/${owner}/${repo}/blob/${branch}/${i.path}`;

        return { 
            path: i.path, 
            url: fileUrl,
            repoUrl: repoUrl,
            size: i.size
        };
    });

    currentFiles = files;
    currentRepoInfo.ref = ref;

    renderBreadcrumbs(owner, repo, branch, path);
    renderTree(files, path);
    
    $('#file-search').disabled = false;
    $('#btn-search-file').disabled = false;
    $('#file-search').placeholder = "Search files... / 搜索文件...";
    
    showToast(t('analysisComplete', { count: files.length }), 'success');
    $('#btn-download').disabled = false;
    $('#btn-github1s').disabled = false;
    $('#btn-export-ai').disabled = false;
    $('#btn-release').disabled = false;
    $('#btn-code-search').disabled = false;

    let shareUrl = `https://github.com/${owner}/${repo}`;
    if (branch && (path || (branch !== 'main' && branch !== 'master'))) {
        shareUrl += `/tree/${branch}`;
        if (path) shareUrl += `/${path}`;
    }
    window.history.pushState(null, '', '/?' + shareUrl);
};

// AI 导出
// 修复：Bug #5 - token 计数显示
const exportForAI = async () => {
    const checked = document.querySelectorAll('.tree-checkbox:checked');
    let filesToExport = [];
    
    if (checked.length > 0) {
        checked.forEach(c => {
            const path = c.getAttribute('data-path');
            const file = currentFiles.find(f => f.path === path);
            if (file) filesToExport.push(file);
        });
    } else {
        if (!confirm(t('noSelection') + '. Export ALL files in current view? / 未选择文件。导出当前视图所有文件？')) {
            return;
        }
        filesToExport = currentFiles;
    }
    
    if (filesToExport.length > 50) {
        if (!confirm(`Warning: You are about to export ${filesToExport.length} files. This may take a while and consume API quota. Continue?`)) return;
    }

    const btn = $('#btn-export-ai');
    const originalText = btn.innerText;
    btn.disabled = true;
    btn.innerText = "Exporting...";
    
    try {
        let markdown = `# File Tree\n\n`;
        
        filesToExport.forEach(f => {
            markdown += `- ${f.path}\n`;
        });
        
        markdown += `\n# File Contents\n\n`;
        
        let completedCount = 0;
        const totalFiles = filesToExport.length;
        const limit = 5;
        
        for (let i = 0; i < totalFiles; i += limit) {
            const batch = filesToExport.slice(i, i + limit);
            await Promise.all(batch.map(async file => {
                try {
                    const ext = file.path.split('.').pop();
                    const res = await fetch(file.url);
                    const text = await res.text();
                    
                    if (text.indexOf('\0') !== -1) {
                        markdown += `## ${file.path}\n\n> Binary file skipped\n\n`;
                    } else {
                        markdown += `## ${file.path}\n\n\`\`\`${ext}\n${text}\n\`\`\`\n\n`;
                    }
                } catch (e) {
                    markdown += `## ${file.path}\n\n> Error fetching content: ${e.message}\n\n`;
                }
                completedCount++;
                const tokens = Math.round(markdown.length / 4);
                btn.innerText = `Exporting ${completedCount}/${totalFiles} (~${(tokens/1000).toFixed(1)}k tokens)...`;
            }));
        }
        
        const blob = new Blob([markdown], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${currentRepoInfo.repo}-context.md`;
        a.click();
        
        const totalTokens = Math.round(markdown.length / 4);
        const tokenMsg = `Export Complete!<br>Estimated Tokens: ${formatCompactNumber(totalTokens)}<br><small>(Based on 1 token ≈ 4 chars)</small>`;
        
        showToast(tokenMsg, 'success', 5000);
        
    } catch (e) {
        showToast('Export failed: ' + e.message, 'error');
        console.error(e);
    } finally {
        btn.disabled = false;
        btn.innerText = originalText;
    }
};

// Markdown 相关
const ensureMarked = async () => {
    if (markedLoaded || window.marked) {
        markedLoaded = true;
        return;
    }
    
    const loadScript = (urls) => {
        return new Promise((resolve, reject) => {
            const s = document.createElement('script');
            s.src = urls[0];
            s.onload = resolve;
            s.onerror = () => {
                console.warn(`Failed to load ${urls[0]}, trying fallback...`);
                if (urls.length > 1) {
                    loadScript(urls.slice(1)).then(resolve).catch(reject);
                } else {
                    reject();
                }
            };
            document.head.appendChild(s);
        });
    };
    
    try {
        await loadScript([
            'marked.min.js',
            'https://cdnjs.cloudflare.com/ajax/libs/marked/9.1.2/marked.min.js',
            'https://unpkg.com/marked@9.1.2/marked.min.js'
        ]);
        markedLoaded = true;
    } catch (e) {
        console.error('Marked load failed', e);
        throw e;
    }
};

const renderMarkdown = async (text, contextRepo) => {
    const engine = $('#disc-render-engine').value;
    const content = $('#disc-preview-content');
    
    if (engine === 'source') {
        const safeText = text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
        content.innerHTML = `<pre style="white-space:pre-wrap; word-wrap:break-word; background:var(--bg-secondary); padding:10px; border-radius:4px; font-family:monospace;">${safeText}</pre>`;
        return;
    }

    if (engine === 'api') {
        try {
            const token = localStorage.getItem('gh_token');
            const headers = { 'Content-Type': 'application/json' };
            if (token) headers['Authorization'] = `token ${token}`;
            
            const res = await fetch('https://api.github.com/markdown', {
                method: 'POST',
                headers: headers,
                body: JSON.stringify({ text: text, mode: 'gfm', context: contextRepo })
            });
            
            if (!res.ok) throw new Error(`API Error ${res.status}`);
            const html = await res.text();
            content.innerHTML = html;
        } catch (e) {
            console.error('API Render Error', e);
            content.innerHTML = `<div style="color:red">API Render Failed: ${e.message}. Falling back to JS.</div>`;
            if (window.marked) content.innerHTML += window.marked.parse(text);
        }
    } else {
        if (window.marked) {
            content.innerHTML = window.marked.parse(text);
        } else {
            content.innerText = text;
        }
    }
};

const showMarkdownFile = async (filename, text, url, filepath) => {
    $('#discovery-modal').style.display = 'flex';
    
    const fullUrl = `https://github.com/${currentRepoInfo.owner}/${currentRepoInfo.repo}/blob/${currentRepoInfo.ref}/${filepath}`;
    const titleEl = $('#disc-modal-title');
    titleEl.innerText = fullUrl;
    titleEl.title = fullUrl;
    titleEl.style.whiteSpace = 'nowrap';
    titleEl.style.overflow = 'hidden';
    titleEl.style.textOverflow = 'ellipsis';
    titleEl.style.maxWidth = 'calc(100vw - 100px)';
    titleEl.style.display = 'block';

    $('.discovery-sidebar').style.display = 'none';
    $('.discovery-main').style.display = 'none';
    
    const panel = $('#disc-preview-panel');
    panel.style.display = 'flex';
    panel.style.width = '100%';
    panel.style.borderLeft = 'none';
    
    $('#disc-preview-title').style.display = 'none';
    $('#disc-link-github').href = url;
    
    currentPreviewRepo = currentRepoInfo.owner + '/' + currentRepoInfo.repo;
    currentRawReadme = text;

    $('#disc-btn-open').innerText = "Download";
    $('#disc-btn-open').onclick = () => downloadSingleFile(url, filename);
    
    $('#disc-btn-github1s').onclick = () => {
        const { owner, repo, ref } = currentRepoInfo;
        const g1sUrl = `https://github1s.com/${owner}/${repo}/blob/${ref}/${filepath}`;
        window.open(g1sUrl, '_blank');
    };
    
    await renderMarkdown(text, currentPreviewRepo);
};

// Discovery 相关
const openDiscovery = () => {
    $('#discovery-modal').style.display = 'flex';
    $('#disc-modal-title').innerText = "Repo Discovery / 发现仓库";
    
    $('.discovery-sidebar').style.display = 'block';
    $('.discovery-main').style.display = 'flex';
    $('#disc-preview-panel').style.display = 'none';

    ensureMarked().catch(e => console.error('Failed to load marked', e));
};

const closeDiscovery = () => {
    $('#discovery-modal').style.display = 'none';
    
    const sidebar = $('.discovery-sidebar');
    const main = $('.discovery-main');
    const panel = $('#disc-preview-panel');
    
    if (sidebar) sidebar.style.display = 'block';
    if (main) {
        main.style.display = 'flex';
        main.style.flex = '1';
        main.style.maxWidth = '';
        main.style.minWidth = '0';
    }
    if (panel) panel.style.display = 'none';
    
    currentPreviewRepo = null;
};

const switchDiscoveryMode = (mode) => {
    discMode = mode;
    $('#tab-search').className = `capsule-tab ${mode === 'search' ? 'active' : ''}`;
    $('#tab-trending').className = `capsule-tab ${mode === 'trending' ? 'active' : ''}`;
    
    const searchInput = $('#disc-searchInput');
    const dateRange = $('#disc-dateRange');
    const actionBtn = $('#disc-actionBtn');

    if (mode === 'trending') {
        searchInput.disabled = true;
        searchInput.placeholder = "Trending mode";
        dateRange.disabled = false;
        actionBtn.innerText = "View Trending";
        performDiscoveryAction();
    } else {
        searchInput.disabled = false;
        searchInput.placeholder = "React, Vue, AI...";
        dateRange.disabled = true;
        actionBtn.innerText = "Search";
    }
};

// 修复：Bug #6 - query 构建逻辑
const performDiscoveryAction = async () => {
    const listEl = $('#disc-repo-list');
    listEl.innerHTML = '<div style="grid-column: 1/-1; text-align:center; padding: 50px;">Loading...</div>';
    
    try {
        let query = '';
        if (discMode === 'search') {
            const searchTerm = $('#disc-searchInput').value.trim();
            if (searchTerm) {
                query = searchTerm;
            } else {
                // 如果没有搜索词，默认显示高星项目
                query = 'stars:>1000';
            }
        } else {
            const range = $('#disc-dateRange').value;
            const date = new Date();
            if (range === 'daily') date.setDate(date.getDate() - 1);
            else if (range === 'weekly') date.setDate(date.getDate() - 7);
            else if (range === 'monthly') date.setMonth(date.getMonth() - 1);
            query = `created:>${date.toISOString().split('T')[0]}`;
        }

        const lang = $('#disc-langSelect').value;
        if (lang) query += ` language:${lang}`;
        
        const minStars = $('#disc-minStars').value;
        if (minStars) query += ` stars:>${minStars}`;
        
        const sort = $('#disc-sortSelect').value;
        const url = `https://api.github.com/search/repositories?q=${encodeURIComponent(query)}&sort=${sort}&order=desc&per_page=30`;

        const res = await fetch(url);
        if (!res.ok) {
            if (res.status === 403) throw new Error('API Rate Limit Exceeded');
            throw new Error(`API Error ${res.status}`);
        }
        
        const data = await res.json();
        renderDiscoveryRepos(data.items);
        $('#disc-result-count').innerText = `${data.total_count} results`;
        $('#disc-list-title').innerText = discMode === 'search' ? 'Search Results' : 'Trending';

    } catch (e) {
        console.error(e);
        listEl.innerHTML = `<div style="grid-column: 1/-1; text-align: center; color: #ff4d4f;">Error: ${e.message}</div>`;
    }
};

const renderDiscoveryRepos = (repos) => {
    const listEl = $('#disc-repo-list');
    listEl.innerHTML = '';
    
    if (!repos || !repos.length) {
        listEl.innerHTML = '<div style="grid-column: 1/-1; text-align: center; color: var(--text-dim);">No results found</div>';
        return;
    }

    repos.forEach(repo => {
        const card = document.createElement('div');
        card.className = 'repo-card';
        card.onclick = () => showDiscoveryPreview(repo);
        
        let langColor = '#ccc';
        if (repo.language) {
            const colors = { 
                JavaScript: '#f1e05a', TypeScript: '#2b7489', Python: '#3572A5', 
                Java: '#b07219', Go: '#00ADD8', Rust: '#dea584', Vue: '#41b883', 
                HTML:'#e34c26', CSS:'#563d7c' 
            };
            langColor = colors[repo.language] || '#ccc';
        }

        card.innerHTML = `
            <div class="repo-header">
                <span class="repo-name">${repo.full_name}</span>
                <span style="font-size:11px; color:#8b949e">${new Date(repo.updated_at).toLocaleDateString()}</span>
            </div>
            <div class="repo-desc">${repo.description || 'No description'}</div>
            <div class="repo-meta">
                <div class="meta-item" style="color:${langColor}"><span class="lang-dot" style="background:${langColor}"></span> ${repo.language || 'Unknown'}</div>
                <div class="meta-item">⭐ ${(repo.stargazers_count/1000).toFixed(1)}k</div>
            </div>
        `;
        listEl.appendChild(card);
    });
};

// 修复：Bug #3 - 异步逻辑优化
const showDiscoveryPreview = async (repo) => {
    const panel = $('#disc-preview-panel');
    const content = $('#disc-preview-content');
    const sidebar = $('.discovery-sidebar');
    const main = $('.discovery-main');
    
    sidebar.style.display = 'none';
    main.style.flex = '0 0 25%';
    main.style.maxWidth = '25%';
    main.style.minWidth = '25%';
    
    $('#disc-preview-title').style.display = 'block';

    panel.style.display = 'flex';
    panel.style.flexDirection = 'column';
    panel.style.flex = '1';
    panel.style.width = '';
    panel.style.minWidth = '0';
    panel.style.borderLeft = '1px solid var(--border)';
    
    $('#disc-preview-title').innerText = repo.full_name;
    $('#disc-link-github').href = repo.html_url;
    
    currentPreviewRepo = repo;
    currentRawReadme = null;

    $('#disc-btn-open').innerText = "Open Here";
    $('#disc-btn-open').onclick = () => {
        closeDiscovery();
        $('#url').value = repo.html_url;
        start();
    };
    
    $('#disc-btn-github1s').onclick = () => {
        window.open(`https://github1s.com/${repo.full_name}`, '_blank');
    };

    content.innerHTML = 'Loading README...';

    // 检查缓存
    if (readmeCache.has(repo.full_name)) {
        const raw = readmeCache.get(repo.full_name);
        currentRawReadme = raw;
        try {
            await renderMarkdown(raw, repo.full_name);
        } catch(e) {
            content.innerText = 'Render failed: ' + e.message;
        }
        return;
    }

    // 异步获取 README
    try {
        const res = await fetch(`https://api.github.com/repos/${repo.full_name}/readme`);
        if (!res.ok) throw new Error('No README');
        const data = await res.json();
        const raw = decodeURIComponent(escape(window.atob(data.content.replace(/\n/g, ''))));
        
        readmeCache.set(repo.full_name, raw);
        currentRawReadme = raw;
        
        await renderMarkdown(raw, repo.full_name);
    } catch (e) {
        content.innerText = 'Failed to load README: ' + e.message;
    }
};

const closeDiscPreview = () => {
    const sidebar = $('.discovery-sidebar');
    const main = $('.discovery-main');
    
    if (main.style.display === 'none') {
        closeDiscovery();
        return;
    }
    
    $('#disc-preview-panel').style.display = 'none';
    
    sidebar.style.display = 'block'; 
    main.style.flex = '1';
    main.style.maxWidth = '';
    main.style.minWidth = '0';
};

// 模态框关闭
document.querySelectorAll('.modal-overlay').forEach(el => {
    el.addEventListener('click', (e) => {
        if (e.target === el) {
            if (el.id === 'discovery-modal') {
                return;
            } else if (el.id === 'preview-modal') {
                closePreview();
            } else {
                el.style.display = 'none';
            }
        }
    });
});

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        const preview = $('#disc-preview-panel');
        const modal = $('#discovery-modal');
        
        if (preview && preview.style.display === 'flex') {
            closeDiscPreview();
            e.preventDefault();
            e.stopPropagation();
        } else if (modal && modal.style.display === 'flex') {
            closeDiscovery();
            e.preventDefault();
            e.stopPropagation();
        } else if ($('#status-modal').style.display === 'flex') {
            $('#status-modal').style.display = 'none';
            e.preventDefault();
        }
    }
});

// 仓库状态相关
const switchStatusTab = (tabId) => {
    document.querySelectorAll('.tab-nav .tab-item').forEach(el => {
        el.classList.remove('active');
        if (el.getAttribute('onclick').includes(tabId)) el.classList.add('active');
    });
    
    document.querySelectorAll('.status-tab-content').forEach(el => el.classList.remove('active'));
    document.getElementById(`status-tab-${tabId}`).classList.add('active');
    
    if (tabId === 'overview') loadStatusOverview();
    else if (tabId === 'activity') loadStatusActivity();
    else if (tabId === 'ci') loadStatusCI();
    else if (tabId === 'commits') loadStatusCommits();
    else if (tabId === 'contributors') loadStatusContributors();
    else if (tabId === 'issues') loadStatusIssues();
    else if (tabId === 'languages') loadStatusLanguages();
};

const openRepoStatus = async () => {
    const { owner, repo } = currentRepoInfo;
    if (!owner || !repo) return;
    
    $('#status-modal').style.display = 'flex';
    
    const repoKey = `${owner}/${repo}`;
    if (statusDataCache.key !== repoKey) {
        statusDataCache = { key: repoKey };
        
        const loaders = {
            overview: 'Loading...',
            activity: 'Loading activity...',
            ci: 'Loading CI status...',
            commits: 'Loading commits...',
            contributors: 'Loading contributors...',
            issues: 'Loading issues...',
            languages: 'Loading languages...'
        };
        
        Object.entries(loaders).forEach(([key, msg]) => {
            $(`#status-tab-${key}`).innerHTML = key === 'overview' ? msg : `<div style="text-align:center; padding:20px; color:#8b949e;">${msg}</div>`;
        });
    }

    switchStatusTab('overview');
};

const loadStatusOverview = async () => {
    if (statusDataCache.overview) return;
    
    const { owner, repo } = currentRepoInfo;
    const container = $('#status-tab-overview');
    
    try {
        const [repoData, community] = await Promise.all([
            fetchWithProxy(`https://api.github.com/repos/${owner}/${repo}`).then(r => r.json()),
            fetchWithProxy(`https://api.github.com/repos/${owner}/${repo}/community/profile`).then(r => r.ok ? r.json() : null)
        ]);

        const hasGitignore = currentFiles.some(f => f.path.endsWith('.gitignore'));
        const hasLicense = currentFiles.some(f => f.path.toUpperCase().includes('LICENSE'));
        const hasEditorConfig = currentFiles.some(f => f.path === '.editorconfig');
        const hasESLint = currentFiles.some(f => f.path.includes('.eslintrc') || f.path.includes('eslint.config'));
        
        let html = `
            <div class="stats-grid">
                <div class="stat-card"><div class="stat-value">${formatCompactNumber(repoData.stargazers_count)}</div><div class="stat-label">Stars</div></div>
                <div class="stat-card"><div class="stat-value">${formatCompactNumber(repoData.forks_count)}</div><div class="stat-label">Forks</div></div>
                <div class="stat-card"><div class="stat-value">${formatCompactNumber(repoData.subscribers_count)}</div><div class="stat-label">Watchers</div></div>
                <div class="stat-card"><div class="stat-value">${formatCompactNumber(repoData.open_issues_count)}</div><div class="stat-label">Issues</div></div>
            </div>
            
            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:20px;">
                <div>
                    <h4 style="margin-top:0; border-bottom:1px solid var(--border); padding-bottom:10px;">Repository Info</h4>
                    <div style="font-size:13px; line-height:2.2;">
                        <div>Size: <b>${formatSize(repoData.size * 1024)}</b></div>
                        <div>License: <b>${repoData.license ? (repoData.license.spdx_id || repoData.license.name) : 'None'}</b></div>
                        <div>Created: <b>${new Date(repoData.created_at).toLocaleDateString()}</b></div>
                        <div>Updated: <b>${new Date(repoData.updated_at).toLocaleDateString()}</b></div>
                        <div>Language: <b>${repoData.language || 'N/A'}</b></div>
                    </div>
                </div>
                <div>
                    <h4 style="margin-top:0; border-bottom:1px solid var(--border); padding-bottom:10px;">Health Check</h4>
                    <div style="font-size:13px; line-height:2.2;">
                        <div>${hasGitignore ? '✅' : '❌'} .gitignore</div>
                        <div>${hasLicense ? '✅' : '❌'} LICENSE</div>
                        <div>${community && community.files && community.files.readme ? '✅' : '❌'} README</div>
                        <div>${community && community.files && community.files.contributing ? '✅' : '❌'} CONTRIBUTING</div>
                        <div>${hasEditorConfig ? '✅' : '❌'} .editorconfig</div>
                        <div>${hasESLint ? '✅' : '❌'} ESLint</div>
                    </div>
                </div>
            </div>
        `;
        
        container.innerHTML = html;
        statusDataCache.overview = true;
        
    } catch (e) {
        container.innerHTML = `<div style="color:red">Error: ${e.message}</div>`;
    }
};

const loadStatusCommits = async () => {
    if (statusDataCache.commits) return;
    const { owner, repo, ref } = currentRepoInfo;
    const container = $('#status-tab-commits');
    try {
        const commits = await fetchWithProxy(`https://api.github.com/repos/${owner}/${repo}/commits?sha=${ref}&per_page=30`).then(r => r.json());
        if (!Array.isArray(commits)) throw new Error(commits.message || 'Failed');
        
        let html = '';
        commits.forEach(c => {
            html += `
                <div class="timeline-item">
                    <div class="timeline-icon" style="border-radius:4px;">C</div>
                    <div class="timeline-body">
                        <div class="timeline-header">
                            <div style="font-weight:600;color:var(--text);">${c.commit.author.name}</div>
                            <div>${timeAgo(new Date(c.commit.author.date))}</div>
                        </div>
                        <div style="font-size:13px;color:var(--text);margin-bottom:5px;">${c.commit.message.split('\n')[0]}</div>
                        <div style="font-size:11px;color:var(--text-dim);font-family:monospace;">${c.sha.substring(0,7)}</div>
                    </div>
                </div>`;
        });
        container.innerHTML = html;
        statusDataCache.commits = true;
    } catch(e) { container.innerHTML = `<div style="color:red">Error: ${e.message}</div>`; }
};

const loadStatusContributors = async () => {
    if (statusDataCache.contributors) return;
    const { owner, repo } = currentRepoInfo;
    const container = $('#status-tab-contributors');
    try {
        const users = await fetchWithProxy(`https://api.github.com/repos/${owner}/${repo}/contributors?per_page=30`).then(r => r.json());
        if (!Array.isArray(users)) throw new Error(users.message || 'Failed');
        
        let html = '<div style="display:grid;grid-template-columns:repeat(auto-fill, minmax(150px, 1fr));gap:15px;">';
        users.forEach(u => {
            html += `
                <a href="${u.html_url}" target="_blank" style="text-decoration:none;color:var(--text);background:rgba(255,255,255,0.02);border:1px solid var(--border);border-radius:8px;padding:15px;display:flex;flex-direction:column;align-items:center;transition:0.2s;" onmouseover="this.style.borderColor='var(--link)'" onmouseout="this.style.borderColor='var(--border)'">
                    <img src="${u.avatar_url}" style="width:50px;height:50px;border-radius:50%;margin-bottom:10px;">
                    <div style="font-weight:600;margin-bottom:5px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:100%;">${u.login}</div>
                    <div style="font-size:11px;color:var(--text-dim);">${u.contributions} commits</div>
                </a>`;
        });
        html += '</div>';
        container.innerHTML = html;
        statusDataCache.contributors = true;
    } catch(e) { container.innerHTML = `<div style="color:red">Error: ${e.message}</div>`; }
};

const loadStatusIssues = async () => {
    if (statusDataCache.issues) return;
    const { owner, repo } = currentRepoInfo;
    const container = $('#status-tab-issues');
    try {
        const issues = await fetchWithProxy(`https://api.github.com/repos/${owner}/${repo}/issues?state=open&sort=updated&per_page=30`).then(r => r.json());
        if (!Array.isArray(issues)) throw new Error(issues.message || 'Failed');
        
        if (issues.length === 0) {
            container.innerHTML = '<div style="text-align:center;padding:50px;">No open issues found.</div>';
            return;
        }
        
        let html = '';
        issues.forEach(i => {
            const icon = i.pull_request ? 'PR' : 'Is';
            html += `
                <div style="display:flex;gap:10px;padding:10px;border-bottom:1px solid var(--border);">
                    <div style="font-size:12px;padding-top:4px;font-weight:bold;color:var(--text-dim);">${icon}</div>
                    <div style="flex:1;">
                        <a href="${i.html_url}" target="_blank" style="text-decoration:none;color:var(--text);font-weight:600;display:block;margin-bottom:4px;">${i.title}</a>
                        <div style="font-size:12px;color:var(--text-dim);">
                            #${i.number} opened by ${i.user.login} • ${timeAgo(new Date(i.created_at))}
                        </div>
                    </div>
                    <div style="font-size:12px;color:var(--text-dim);display:flex;align-items:center;">
                        ${i.comments} comments
                    </div>
                </div>`;
        });
        container.innerHTML = html;
        statusDataCache.issues = true;
    } catch(e) { container.innerHTML = `<div style="color:red">Error: ${e.message}</div>`; }
};

const loadStatusLanguages = async () => {
    if (statusDataCache.languages) return;
    const { owner, repo } = currentRepoInfo;
    const container = $('#status-tab-languages');
    try {
        const langs = await fetchWithProxy(`https://api.github.com/repos/${owner}/${repo}/languages`).then(r => r.json());
        
        const total = Object.values(langs).reduce((a, b) => a + b, 0);
        let html = '<div style="margin-bottom:20px;height:10px;display:flex;border-radius:5px;overflow:hidden;">';
        let legendHtml = '<div style="display:flex;flex-wrap:wrap;gap:15px;">';
        
        const colors = ['#f1e05a', '#2b7489', '#563d7c', '#e34c26', '#3178c6', '#89e051', '#e76c0c']; 
        let colorIdx = 0;
        
        for (const [lang, bytes] of Object.entries(langs)) {
            const percent = ((bytes / total) * 100).toFixed(1);
            if (percent < 0.1) continue;
            
            const color = colors[colorIdx % colors.length];
            html += `<div style="width:${percent}%;background:${color};" title="${lang}: ${percent}%"></div>`;
            legendHtml += `
                <div style="display:flex;align-items:center;font-size:12px;">
                    <span style="width:10px;height:10px;background:${color};border-radius:50%;margin-right:6px;"></span>
                    <span style="font-weight:600;margin-right:4px;">${lang}</span>
                    <span style="color:var(--text-dim);">${percent}%</span>
                </div>`;
            colorIdx++;
        }
        html += '</div>' + legendHtml + '</div>';
        
        container.innerHTML = html;
        statusDataCache.languages = true;
    } catch(e) { container.innerHTML = `<div style="color:red">Error: ${e.message}</div>`; }
};

// 修复：Bug #7 - 添加缺失的事件类型
const loadStatusActivity = async () => {
    if (statusDataCache.activity) return;
    
    const { owner, repo } = currentRepoInfo;
    const container = $('#status-tab-activity');
    
    try {
        const events = await fetchWithProxy(`https://api.github.com/repos/${owner}/${repo}/events?per_page=30`).then(r => r.json());
        
        if (!Array.isArray(events)) throw new Error(events.message || 'Failed to fetch events');
        
        let html = '';
        if (events.length === 0) {
            html = '<div style="text-align:center; padding:20px; color:gray">No recent activity</div>';
        } else {
            events.forEach(e => {
                let action = '';
                let icon = 'Act';
                let details = '';
                
                switch(e.type) {
                    case 'PushEvent':
                        icon = 'C';
                        action = `pushed to <span class="timeline-ref">${e.payload.ref.replace('refs/heads/', '')}</span>`;
                        details = (e.payload.commits || []).map(c => `<div style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">- ${c.message}</div>`).join('');
                        break;
                    case 'PullRequestEvent':
                        icon = 'PR';
                        action = `${e.payload.action} PR <span class="timeline-ref">#${e.payload.number}</span>`;
                        details = `<div style="font-weight:600">${e.payload.pull_request.title}</div>`;
                        break;
                    case 'IssuesEvent':
                        icon = 'Is';
                        action = `${e.payload.action} issue <span class="timeline-ref">#${e.payload.issue.number}</span>`;
                        details = `<div style="font-weight:600">${e.payload.issue.title}</div>`;
                        break;
                    case 'WatchEvent':
                        icon = '★';
                        action = 'starred this repository';
                        break;
                    case 'ForkEvent':
                        icon = 'F';
                        action = 'forked this repository';
                        break;
                    case 'CreateEvent':
                        icon = '+';
                        action = `created ${e.payload.ref_type} <span class="timeline-ref">${e.payload.ref || ''}</span>`;
                        break;
                    case 'DeleteEvent':
                        icon = '-';
                        action = `deleted ${e.payload.ref_type} <span class="timeline-ref">${e.payload.ref || ''}</span>`;
                        break;
                    case 'ReleaseEvent':
                        icon = 'R';
                        action = `released <span class="timeline-ref">${e.payload.release.tag_name}</span>`;
                        break;
                    case 'MemberEvent':
                        icon = 'M';
                        action = `${e.payload.action} <span class="timeline-ref">${e.payload.member.login}</span> as collaborator`;
                        break;
                    case 'PublicEvent':
                        icon = '🌍';
                        action = 'made the repository public';
                        break;
                    default:
                        action = e.type.replace('Event', '');
                }
                
                html += `
                    <div class="timeline-item">
                        <div class="timeline-icon">${icon}</div>
                        <div class="timeline-body">
                            <div class="timeline-header">
                                <div>
                                    <span class="timeline-user">${e.actor.login}</span> ${action}
                                </div>
                                <div>${timeAgo(new Date(e.created_at))}</div>
                            </div>
                            ${details ? `<div style="margin-top:5px; color:var(--text-dim);">${details}</div>` : ''}
                        </div>
                    </div>
                `;
            });
        }
        
        container.innerHTML = html;
        statusDataCache.activity = true;
        
    } catch (e) {
        container.innerHTML = `<div style="color:red">Error: ${e.message}</div>`;
    }
};

const loadStatusCI = async () => {
    if (statusDataCache.ci) return;
    
    const { owner, repo, ref } = currentRepoInfo;
    const container = $('#status-tab-ci');
    
    try {
        const checkRuns = await fetchWithProxy(`https://api.github.com/repos/${owner}/${repo}/commits/${ref}/check-runs`).then(r => r.ok ? r.json() : null);
        
        let html = '';
        if (checkRuns && checkRuns.check_runs && checkRuns.check_runs.length > 0) {
            checkRuns.check_runs.forEach(run => {
                const color = run.conclusion === 'success' ? '#2da44e' : (run.conclusion === 'failure' ? '#cf222e' : '#9a6700');
                const icon = run.conclusion === 'success' ? '✔' : (run.conclusion === 'failure' ? '✖' : '●');
                html += `<div style="display:flex; justify-content:space-between; padding:10px; border-bottom:1px solid var(--border); align-items:center;">
                    <div style="display:flex; align-items:center; gap:10px;">
                        <span style="color:${color}; font-size:16px;">${icon}</span>
                        <div>
                            <div style="font-weight:600">${run.name}</div>
                            <div style="font-size:11px; color:var(--text-dim);">${run.app ? run.app.name : 'GitHub Actions'}</div>
                        </div>
                    </div>
                    <div style="text-align:right;">
                        <div style="font-size:12px; color:${color}; text-transform:capitalize;">${run.conclusion || run.status}</div>
                        <div style="font-size:11px; color:var(--text-dim);">${new Date(run.completed_at || run.started_at).toLocaleDateString()}</div>
                    </div>
                </div>`;
            });
        } else {
            html = `<div style="text-align:center; padding:50px; color:gray;">No CI/CD checks found for ref: <b>${ref}</b></div>`;
        }
        
        container.innerHTML = html;
        statusDataCache.ci = true;
    } catch (e) {
        container.innerHTML = `<div style="color:red">Error: ${e.message}</div>`;
    }
};

// 其他功能
const openGithub1s = () => {
    const { owner, repo, ref, path } = currentRepoInfo;
    if (!owner || !repo) return;
    
    let url = `https://github1s.com/${owner}/${repo}`;
    if (ref) {
        url += `/tree/${ref}`;
        if (path) url += `/${path}`;
    }
    window.open(url, '_blank');
};

const openCodeSearch = () => {
    $('#code-search-modal').style.display = 'flex';
    $('#code-search-input').focus();
};

const performCodeSearch = async () => {
    const query = $('#code-search-input').value.trim();
    if (!query) return;
    
    const { owner, repo } = currentRepoInfo;
    const container = $('#code-search-results');
    container.innerHTML = '<div style="text-align:center;padding:50px;">Searching...</div>';
    
    try {
        const q = encodeURIComponent(`${query} repo:${owner}/${repo}`);
        const res = await fetchWithProxy(`https://api.github.com/search/code?q=${q}`);
        const data = await res.json();
        
        if (data.items && data.items.length > 0) {
            let html = '';
            data.items.forEach(item => {
                const rawUrl = item.html_url.replace('github.com', 'raw.githubusercontent.com').replace('/blob/', '/');
                
                html += `
                    <div style="padding:15px;border-bottom:1px solid var(--border);">
                        <div style="display:flex;justify-content:space-between;margin-bottom:5px;">
                            <a href="javascript:void(0)" onclick="previewFile('${rawUrl}', '${item.name}', '${item.path}')" style="font-weight:600;color:var(--link);text-decoration:none;">${item.path}</a>
                            <a href="${item.html_url}" target="_blank" style="font-size:12px;color:var(--text-dim);">GitHub ↗</a>
                        </div>
                        <div style="font-size:12px;color:var(--text-dim);font-family:monospace;background:rgba(0,0,0,0.2);padding:5px;border-radius:4px;overflow-x:auto;">
                            Match in file...
                        </div>
                    </div>`;
            });
            container.innerHTML = html;
        } else {
            container.innerHTML = `<div style="text-align:center;padding:50px;">No matches found. <br><small>${data.message || ''}</small></div>`;
        }
    } catch (e) {
        container.innerHTML = `<div style="color:red;text-align:center;padding:50px;">Error: ${e.message}</div>`;
    }
};

const openReleaseInfo = async () => {
    const { owner, repo } = currentRepoInfo;
    const container = $('#release-modal-body');
    $('#release-modal').style.display = 'flex';
    container.innerHTML = '<div style="text-align:center;padding:20px">Loading releases...</div>';
    
    try {
        await ensureMarked();

        const releases = await fetchWithProxy(`https://api.github.com/repos/${owner}/${repo}/releases`).then(r => r.json());
        
        if (Array.isArray(releases) && releases.length > 0) {
            let html = '';
            releases.forEach(rel => {
                const date = new Date(rel.published_at).toLocaleDateString();
                const body = rel.body ? marked.parse(rel.body) : '<i>No description</i>';
                
                let assetsHtml = '';
                if (rel.assets && rel.assets.length > 0) {
                    assetsHtml = '<div style="margin-top:10px;border-top:1px solid var(--border);padding-top:10px;"><b>Assets:</b><div style="display:flex;flex-wrap:wrap;gap:10px;margin-top:5px;">';
                    
                    let template = $('#release-url-template').value.trim();
                    if (!template) template = 'https://github.com/{owner}/{repo}/releases/download/{tag}/{filename}';
                    
                    rel.assets.forEach(asset => {
                        const size = formatSize(asset.size);
                        
                        let downloadUrl = template
                            .replace(/\{owner\}/g, owner)
                            .replace(/\{repo\}/g, repo)
                            .replace(/\{tag\}/g, rel.tag_name)
                            .replace(/\{filename\}/g, asset.name);
                        
                        assetsHtml += `
                            <a href="${downloadUrl}" target="_blank" style="text-decoration:none;color:var(--text);background:rgba(255,255,255,0.05);border:1px solid var(--border);border-radius:6px;padding:5px 10px;font-size:12px;display:flex;align-items:center;transition:0.2s;" onmouseover="this.style.borderColor='var(--link)'" onmouseout="this.style.borderColor='var(--border)'">
                                <span style="margin-right:5px">Asset:</span>
                                <span>${asset.name}</span>
                                <span style="margin-left:8px;color:var(--text-dim)">${size}</span>
                            </a>
                        `;
                    });
                    assetsHtml += '</div></div>';
                }
                
                html += `
                    <div style="background:rgba(255,255,255,0.02);border:1px solid var(--border);border-radius:8px;padding:20px;margin-bottom:20px;">
                        <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:10px;">
                            <div>
                                <h2 style="margin:0;font-size:20px;color:var(--link);">${rel.name || rel.tag_name}</h2>
                                <div style="margin-top:5px;font-size:12px;color:var(--text-dim);">
                                    <span style="background:var(--btn-bg);color:white;padding:2px 6px;border-radius:10px;margin-right:8px;">${rel.tag_name}</span>
                                    ${rel.prerelease ? '<span style="background:#9e6a03;color:white;padding:2px 6px;border-radius:10px;margin-right:8px;">Pre-release</span>' : ''}
                                    <span>Published on ${date}</span>
                                </div>
                            </div>
                            <a href="${rel.html_url}" target="_blank" style="font-size:13px;color:var(--text-dim);text-decoration:none;border:1px solid var(--border);padding:4px 10px;border-radius:6px;">View on GitHub</a>
                        </div>
                        <div class="markdown-body" style="font-size:13px;">${body}</div>
                        ${assetsHtml}
                    </div>
                `;
            });
            container.innerHTML = html;
        } else {
            container.innerHTML = '<div style="text-align:center;padding:20px">No releases found.</div>';
        }
    } catch (e) {
        console.error(e);
        container.innerHTML = `<div style="color:red;text-align:center;">Error loading releases: ${e.message}</div>`;
    }
};

const closeReleaseModal = () => {
    $('#release-modal').style.display = 'none';
};

// 设置相关
const resetSetting = (id, defaultValue) => {
    const input = document.getElementById(id);
    if(input) {
        input.value = defaultValue;
        
        let key = '';
        if(id === 'gh-token') key = 'gh_token';
        else if(id === 'api-proxy') key = 'gh_api_proxy';
        else if(id === 'release-url-template') key = 'gh_release_template';
        else if(id === 'url-template') key = 'gh_url_template';
        
        if(key) {
            if (defaultValue) localStorage.setItem(key, defaultValue);
            else localStorage.removeItem(key);
        }
        updateSettingsPreview();
    }
};

const updateSettingsPreview = () => {
    const relTemplate = $('#release-url-template').value.trim() || 'https://github.com/{owner}/{repo}/releases/download/{tag}/{filename}';
    const relPreview = relTemplate
        .replace(/\{owner\}/g, 'HOG-StarWatch')
        .replace(/\{repo\}/g, 'github-repo-explorer')
        .replace(/\{tag\}/g, 'v1.0.0')
        .replace(/\{filename\}/g, 'github-repo-explorer.zip');
    
    const relPreviewEl = $('#release-preview');
    if(relPreviewEl) relPreviewEl.innerText = 'Preview: ' + relPreview;

    const fileTemplate = $('#url-template').value.trim() || 'https://raw.githubusercontent.com/{owner}/{repo}/{ref}/{path}';
    const filePreview = fileTemplate
        .replace(/\{owner\}/g, 'HOG-StarWatch')
        .replace(/\{repo\}/g, 'github-repo-explorer')
        .replace(/\{ref\}/g, 'main')
        .replace(/\{path\}/g, 'README.md');
    
    const filePreviewEl = $('#file-preview');
    if(filePreviewEl) filePreviewEl.innerText = 'Preview: ' + filePreview;
};

// 主题切换
const toggleTheme = () => {
    const html = document.documentElement;
    const current = html.getAttribute('data-theme');
    const next = current === 'light' ? 'dark' : 'light';
    html.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
    updateThemeIcon(next);
};

const updateThemeIcon = (theme) => {
    const btn = document.getElementById('theme-toggle-btn');
    if (btn) {
        btn.innerHTML = theme === 'light' 
            ? '<svg viewBox="0 0 16 16" width="16" height="16" fill="currentColor"><path d="M8 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM8 0a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-1 0v-2A.5.5 0 0 1 8 0zm0 13a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-1 0v-2A.5.5 0 0 1 8 13zm8-5a.5.5 0 0 1-.5.5h-2a.5.5 0 0 1 0-1h2a.5.5 0 0 1 .5.5zM3 8a.5.5 0 0 1-.5.5h-2a.5.5 0 0 1 0-1h2A.5.5 0 0 1 3 8zm10.657-5.657a.5.5 0 0 1 0 .707l-1.414 1.415a.5.5 0 1 1-.707-.708l1.414-1.414a.5.5 0 0 1 .707 0zm-9.193 9.193a.5.5 0 0 1 0 .707L3.05 13.657a.5.5 0 0 1-.707-.707l1.414-1.414a.5.5 0 0 1 .707 0zm9.193 2.121a.5.5 0 0 1-.707 0l-1.414-1.414a.5.5 0 0 1 .707-.707l1.414 1.414a.5.5 0 0 1 0 .707zM4.46 4.46a.5.5 0 0 1-.707 0L2.343 3.05a.5.5 0 1 1 .707-.707l1.414 1.414a.5.5 0 0 1 0 .708z"/></svg>'
            : '<svg viewBox="0 0 16 16" width="16" height="16" fill="currentColor"><path d="M9.598 1.591a.75.75 0 0 1 .785-.175 7 7 0 1 1-8.967 8.967.75.75 0 0 1 .961-.96 5.5 5.5 0 0 0 7.046-7.046.75.75 0 0 1 .175-.786zm1.616 1.945a7 7 0 0 1-7.678 7.678 5.5 5.5 0 1 0 7.678-7.678z"/></svg>';
    }
};

// 初始化
window.addEventListener('DOMContentLoaded', () => {
    const savedToken = localStorage.getItem('gh_token');
    if (savedToken) $('#gh-token').value = savedToken;
    
    const savedApiProxy = localStorage.getItem('gh_api_proxy');
    if (savedApiProxy) $('#api-proxy').value = savedApiProxy;

    const savedReleaseTemplate = localStorage.getItem('gh_release_template');
    if (savedReleaseTemplate) $('#release-url-template').value = savedReleaseTemplate;

    const savedUrlTemplate = localStorage.getItem('gh_url_template');
    if (savedUrlTemplate) $('#url-template').value = savedUrlTemplate;
    
    updateSettingsPreview();

    $('#gh-token').addEventListener('input', (e) => localStorage.setItem('gh_token', e.target.value.trim()));
    $('#api-proxy').addEventListener('input', (e) => localStorage.setItem('gh_api_proxy', e.target.value.trim()));
    
    $('#release-url-template').addEventListener('input', (e) => {
        localStorage.setItem('gh_release_template', e.target.value.trim());
        updateSettingsPreview();
    });
    
    $('#url-template').addEventListener('input', (e) => {
        localStorage.setItem('gh_url_template', e.target.value.trim());
        updateSettingsPreview();
    });

    const savedTheme = localStorage.getItem('theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeIcon(savedTheme);

    $('#url').addEventListener('keydown', (e) => {
        if (e.key === 'Enter') start();
    });

    $('#file-search').addEventListener('keydown', (e) => {
        if (e.key === 'Enter') performFileSearch();
    });

    $('#disc-searchInput').addEventListener('keydown', (e) => {
        if (e.key === 'Enter') performDiscoveryAction();
    });

    let targetUrl = '';
    
    const search = window.location.search;
    if (search) {
        const params = new URLSearchParams(search);
        if (params.get('url')) {
            targetUrl = params.get('url');
        } else {
            let raw = search.substring(1);
            try { raw = decodeURIComponent(raw); } catch (e) {}
            if (raw) targetUrl = raw;
        }
    }
    
    if (!targetUrl && window.location.hash) {
        let raw = window.location.hash.substring(1);
        if (raw.startsWith('/')) raw = raw.substring(1);
        if (raw) targetUrl = raw;
    }

    if (!targetUrl) {
        const path = window.location.pathname;
        if (path && path !== '/' && path !== '/index.html' && !path.endsWith('.html')) {
            let raw = path.replace(/^\//, '');
            if (raw) targetUrl = raw;
        }
    }

    if (targetUrl && targetUrl !== 'index.html') {
        $('#url').value = targetUrl;
        setTimeout(start, 100);
    }
});