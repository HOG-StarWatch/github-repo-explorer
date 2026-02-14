const $ = s => document.querySelector(s);
const log = t => {
     const st = $('#status-text');
     if(st) st.innerText = t;
     
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

function showToast(message, type = 'info', duration = 3000) {
    const container = $('#toast-container');
    const toast = document.createElement('div');
    toast.className = `toast-message ${type}`;
    
    let icon = 'ℹ️';
    if (type === 'success') icon = '✅';
    if (type === 'error') icon = '❌';
    
    toast.innerHTML = `<div class="toast-icon">${icon}</div><div>${message.replace(/\n/g, '<br>')}</div>`;
    
    container.appendChild(toast);
    
    // Trigger animation
    requestAnimationFrame(() => {
        toast.classList.add('show');
    });
    
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            if (container.contains(toast)) {
                container.removeChild(toast);
            }
        }, 300); // Wait for transition
    }, duration);
    
    // Also log to console
    log(`[Toast: ${type}] ${message}`);
}

function clearLog() {
    const cl = $('#console-log');
    if(cl) cl.innerHTML = '';
    $('#console-container').style.display = 'none';
}
const setProgress = (percent) => {
    $('#progress-bar').style.width = `${percent}%`;
    $('#progress-container').style.display = 'block';
};

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

let currentFiles = [];
let currentRepoInfo = {};
let currentRefs = [];

function toggleSettings(el) {
    const panel = $('#settings-panel');
    const isOpen = panel.style.display === 'block';
    panel.style.display = isOpen ? 'none' : 'block';
    if (el) el.classList.toggle('open', !isOpen);
}

async function fetchWithProxy(url, type = 'api') {
    const apiProxy = $('#api-proxy').value.trim();
    const token = $('#gh-token').value.trim();
    const headers = {};
    if (token) headers['Authorization'] = `token ${token}`;

    let finalUrl = url;
    if (type === 'api' && apiProxy) {
        finalUrl = apiProxy + url;
    } 
    
    return fetch(finalUrl, { headers }).then(r => {
        monitorRateLimit(r);
        return r;
    });
}

function monitorRateLimit(response) {
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
}

function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        log(`${t('copied')}: ${text}`);
    }).catch(err => {
        console.error(t('failedCopy'), err);
        log(t('failedCopy') + ': ' + err);
    });
}

function formatSize(bytes) {
    if (bytes === undefined || bytes === null) return '';
    if (bytes === 0) return '0 B';
    const units = ['B', 'KB', 'MB', 'GB'];
    let i = 0;
    while (bytes >= 1024 && i < units.length - 1) {
        bytes /= 1024;
        i++;
    }
    return `${bytes.toFixed(1)} ${units[i]}`;
}

function getFileIcon(filename) {
    return `<svg viewBox="0 0 16 16" width="14" height="14" fill="currentColor" style="opacity:0.6"><path d="M2 1.75C2 .784 2.784 0 3.75 0h6.586c.464 0 .909.184 1.237.513l2.914 2.914c.329.328.513.773.513 1.237v9.586A1.75 1.75 0 0 1 13.25 16h-9.5A1.75 1.75 0 0 1 2 14.25Zm1.75-.25a.25.25 0 0 0-.25.25v12.5c0 .138.112.25.25.25h9.5a.25.25 0 0 0 .25-.25V4.664a.25.25 0 0 0-.073-.177l-2.914-2.914a.25.25 0 0 0-.177-.073ZM6 5h4v1H6V5Zm0 3h4v1H6V8Zm0 3h2v1H6v-1Z"></path></svg>`;
}

// 预览逻辑
async function previewFile(url, filename, filepath) {
    const ext = filename.split('.').pop().toLowerCase();

    if (ext === 'md' || ext === 'markdown') {
        try {
            // Open discovery/markdown preview panel
            const text = await fetch(url).then(r => {
                if (!r.ok) throw new Error(`HTTP ${r.status}`);
                return r.text();
            });
            
            // Make sure marked is loaded if needed (reusing discovery logic)
            await ensureMarked();

            showMarkdownFile(filename, text, url, filepath);
            return;
        } catch(e) {
            console.error('MD Preview failed', e);
            // Fallback to normal preview on error
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
            // Use fetch directly to match download behavior and avoid unwanted proxying
            // if the URL is already absolute.
            const text = await fetch(url).then(r => {
                if (!r.ok) throw new Error(`HTTP ${r.status}`);
                return r.text();
            });
            
            // Simple escape
            const safeText = text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
            $('#preview-body').innerHTML = `<div class="preview-code">${safeText}</div>`;
        }
    } catch (e) {
        console.error('Preview error:', e);
        $('#preview-body').innerText = t('error') + ': ' + e.message;
    }
}

function closePreview() {
    $('#preview-modal').style.display = 'none';
}

let lastCheckedCheckbox = null;

function toggleAll(checkbox, event) {
    // Shift + Click Range Selection
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
}

function handleFolderSelect(checkbox, recurseUp = true) {
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
}

function updateParentState(checkbox) {
    let container = checkbox.closest('.children-container');
    if (!container) return; // Top level

    let parentDetails = container.parentElement; // <details>
    if (!parentDetails) return;

    let parentSummary = parentDetails.querySelector('summary');
    if (!parentSummary) return;

    let parentCheckbox = parentSummary.querySelector('.tree-checkbox');
    if (!parentCheckbox) return;

    // Get direct children checkboxes only
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
}

// Drag Selection Logic
let isDragging = false;
let startX = 0, startY = 0;
let selectionBox = null;
let initialCheckboxStates = new Map(); // Store initial states

function getBodyOffset() {
    const rect = document.body.getBoundingClientRect();
    return {
        left: rect.left + window.scrollX,
        top: rect.top + window.scrollY
    };
}

document.addEventListener('mousedown', (e) => {
    const treeView = document.getElementById('tree-view');
    if (!treeView || treeView.style.display === 'none') return;
    if (!treeView.contains(e.target)) return;
    
    if (['INPUT', 'A', 'BUTTON', 'SUMMARY'].includes(e.target.tagName) || e.target.closest('summary') || e.target.closest('.action-btn')) return;

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
    
    // Snapshot current states
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
        // Skip hidden items (e.g. inside collapsed details)
        if (item.offsetParent === null) return;

        const rect = item.getBoundingClientRect();
        const itemLeft = rect.left + window.scrollX - offset.left;
        const itemTop = rect.top + window.scrollY - offset.top;
        
        const intersect = (left < itemLeft + rect.width && left + width > itemLeft && top < itemTop + rect.height && top + height > itemTop);
        
        if (intersect) {
            item.classList.add('selecting');
            const checkbox = item.querySelector('.tree-checkbox');
            if (checkbox) {
                // Toggle logic: Invert initial state
                const wasChecked = initialCheckboxStates.get(checkbox);
                checkbox.checked = !wasChecked;
                checkbox.indeterminate = false;
            }
        } else {
            if (item.classList.contains('selecting')) {
                item.classList.remove('selecting');
                const checkbox = item.querySelector('.tree-checkbox');
                if (checkbox) {
                    // Revert to initial state
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
    
    // 1. Handle Folders (Top-Down)
    changedCheckboxes.forEach(cb => {
            if (cb.getAttribute('data-type') === 'folder') {
                handleFolderSelect(cb, false);
            }
    });

    // 2. Handle Parent Updates (Bottom-Up)
    changedCheckboxes.reverse().forEach(cb => updateParentState(cb));
    
    initialCheckboxStates.clear();
});

function renderBreadcrumbs(owner, repo, branch, path) {
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
}

// 目录树渲染逻辑
function renderTree(files, rootPath) {
    lastCheckedCheckbox = null;
    const tree = {};
    
    // 构建树结构
    files.forEach(file => {
        const relativePath = file.path.replace(rootPath, '').replace(/^\//, '');
        const parts = relativePath.split('/');
        let current = tree;
        
        parts.forEach((part, i) => {
            if (!current[part]) {
                current[part] = (i === parts.length - 1) ? { __file: file } : { __path: (current.__path ? current.__path + '/' : (rootPath ? rootPath + '/' : '')) + part };
            }
            current = current[part];
        });
    });
    // 修复根路径追踪
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
        div.setAttribute('tabindex', '0'); // Keyboard focus
        
        // 图标逻辑
        const iconHtml = isFile 
            ? `<span class="file-icon">${getFileIcon(name)}</span>` 
            : `<span class="folder-arrow"><svg viewBox="0 0 16 16" width="10" height="10" fill="currentColor"><path d="M6.427 4.427l3.396 3.396a.25.25 0 0 1 0 .354l-3.396 3.396A.25.25 0 0 1 6 11.396V4.604a.25.25 0 0 1 .427-.177z"></path></svg></span><span class="folder-icon"><svg viewBox="0 0 16 16" width="14" height="14" fill="currentColor" style="color:#54aeff"><path d="M1.75 1A1.75 1.75 0 0 0 0 2.75v10.5C0 14.216.784 15 1.75 15h12.5A1.75 1.75 0 0 0 16 13.25v-8.5A1.75 1.75 0 0 0 14.25 3H7.5a.25.25 0 0 1-.2-.1l-.9-1.2C6.07 1.26 5.55 1 5 1H1.75Z"></path></svg></span>`;

        let actionsHtml = '';
        let progressHtml = '';
        let sizeHtml = '';
        let clickAction = '';

        if (isFile) {
            const safeId = 'file-' + obj.__file.path.replace(/[^a-zA-Z0-9]/g, '-');
            obj.__file.domId = safeId;
            
            progressHtml = `
                <div class="file-progress-wrap">
                    <div class="file-progress-bar" id="${safeId}"></div>
                </div>
            `;
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

        // 复选框
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
            
            // Lazy Loading Logic
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
                    
                    // Sync checkbox state from parent
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
    
    // 根目录排序
    const keys = Object.keys(tree).filter(k => !k.startsWith('__'));
    const folders = keys.filter(k => !tree[k].__file).sort();
    const rootFiles = keys.filter(k => tree[k].__file).sort();
    
    [...folders, ...rootFiles].forEach(key => {
        const node = createNode(key, tree[key]);
        container.appendChild(node);
    });
}

// 快捷键逻辑
document.addEventListener('keydown', (e) => {
    // Ctrl+F: Focus Search
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'f') {
        e.preventDefault();
        const searchInput = document.getElementById('file-search');
        if (searchInput && !searchInput.disabled) {
            searchInput.focus();
            searchInput.select();
        }
        return;
    }

    // Tree Navigation
    const active = document.activeElement;
    const isTreeItem = active.classList.contains('tree-item');
    
    if (isTreeItem) {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            moveFocus(active, 1);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            moveFocus(active, -1);
        } else if (e.key === ' ' || e.key === 'Enter') {
            e.preventDefault();
            
            const details = active.closest('details');
            // Check if we are focusing a folder summary
            if (details && details.querySelector('summary > .tree-item') === active) {
                if (e.key === 'Enter') {
                    details.open = !details.open;
                } else {
                    // Space: Toggle Checkbox
                    const cb = active.querySelector('.tree-checkbox');
                    if(cb) {
                        cb.checked = !cb.checked;
                        toggleAll(cb, { stopPropagation: () => {} });
                    }
                }
            } else {
                // File
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

function moveFocus(current, direction) {
    // Get all visible tree-items
    // We traverse the DOM to find visible tree-items
    // A simple approach: querySelectorAll('.tree-item') and filter by visibility
    const allItems = Array.from(document.querySelectorAll('.tree-item'));
    // Filter out items inside closed details
    // An item is visible if all its ancestor details are open.
    // But offsetParent check is faster and simpler for "rendered and visible"
    const visibleItems = allItems.filter(el => el.offsetParent !== null);
    
    const index = visibleItems.indexOf(current);
    if (index !== -1) {
        const newIndex = index + direction;
        if (newIndex >= 0 && newIndex < visibleItems.length) {
            visibleItems[newIndex].focus();
        }
    }
}

function parseGitHubUrl(url) {
    url = url.trim();
    
    // Remove query params and hash (e.g. ?tab=readme-ov-file, #L10)
    url = url.split(/[?#]/)[0];

    if (url.startsWith('git@github.com:')) {
        url = url.replace('git@github.com:', 'https://github.com/').replace(/\.git$/, '');
    }

    // 1. 处理简写格式: "user/repo" 或 "/user/repo"
    // 排除包含 github.com 的情况，只匹配 ^/?[\w-]+/[\w.-]+$
    // GitHub 用户名规则: 仅限字母数字和连字符，不能以连字符开头/结尾
    // 仓库名规则: 字母数字、连字符、点、下划线
    const shortMatch = url.match(/^\/?([a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?)\/([a-zA-Z0-9._-]+)$/);
    if (shortMatch) {
        return {
            owner: shortMatch[1],
            repo: shortMatch[2],
            type: undefined,
            ref: undefined,
            path: ''
        };
    }

    // 1.1 Support Deep Links without domain (e.g. /user/repo/tree/main/src)
    const deepMatch = url.match(/^\/?([a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?)\/([a-zA-Z0-9._-]+)\/(tree|blob)\/([^/]+)(?:\/(.*))?$/);
    if (deepMatch) {
        return {
            owner: deepMatch[1],
            repo: deepMatch[2],
            type: deepMatch[3],
            ref: deepMatch[4],
            path: deepMatch[5] || ''
        };
    }
    
    // 2. 补全 protocol 如果丢失 (e.g. "github.com/user/repo")
    if (url.match(/^(www\.)?github\.com\//)) {
        url = 'https://' + url;
    }
    
    // 处理 raw.githubusercontent.com
    // Format: https://raw.githubusercontent.com/owner/repo/ref/path
    const rawMatch = url.match(/raw\.githubusercontent\.com\/([^/]+)\/([^/]+)\/([^/]+)\/(.+)/);
    if (rawMatch) {
        return {
            owner: rawMatch[1],
            repo: rawMatch[2],
            type: 'blob',
            ref: rawMatch[3],
            path: rawMatch[4]
        };
    }

    url = url.replace(/\.git$/, '');
    
    // 处理 /commit/SHA -> 将 SHA 视为引用
    const commitMatch = url.match(/github\.com\/([^/]+)\/([^/]+)\/commit\/([a-f0-9]+)/);
    if (commitMatch) {
        return {
            owner: commitMatch[1],
            repo: commitMatch[2],
            type: 'tree', // treat as tree root
            ref: commitMatch[3],
            path: ''
        };
    }

    // 处理 /releases/tag/TAG -> 将 TAG 视为引用
    const releaseMatch = url.match(/github\.com\/([^/]+)\/([^/]+)\/releases\/tag\/([^/]+)/);
    if (releaseMatch) {
        return {
            owner: releaseMatch[1],
            repo: releaseMatch[2],
            type: 'tree',
            ref: releaseMatch[3],
            path: ''
        };
    }
    
    // 处理用户主页链接
    // Regex for user: github.com/username (and optional /)
    
    const userMatch = url.match(/github\.com\/([^/]+)\/?$/);
    if (userMatch) {
            return {
                owner: userMatch[1],
                type: 'user'
            };
    }

    const match = url.match(/github\.com\/([^/]+)\/([^/]+)(?:\/(tree|blob)\/([^/]+)(?:\/(.*))?)?/);
    if (!match) return null;
    return {
        owner: match[1],
        repo: match[2],
        type: match[3],
        ref: match[4], // branch or tag or commit
        path: match[5] || ''
    };
}

async function downloadSingleFile(url, filename) {
        try {
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        } catch (e) {
            console.error(e);
            log(t('error') + ': ' + e.message);
        }
}

function getSelectedFiles(scopePath = null) {
    // 查找所有选中的文件
    const checkedInputs = Array.from(document.querySelectorAll('.tree-checkbox:checked[data-type="file"]'));
    const checkedPaths = new Set(checkedInputs.map(i => i.getAttribute('data-path')));
    
    let files = currentFiles.filter(f => checkedPaths.has(f.path));
    
    if (scopePath) {
            files = files.filter(f => f.path === scopePath || f.path.startsWith(scopePath + '/'));
    }
    return files;
}

async function downloadFolderZip(folderPath) {
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
}

async function downloadFilesAsZip(files, zipName) {
    await ensureJSZip();
    $('#btn-analyze').disabled = true;
    $('#btn-download').disabled = true;
    
        const zip = new JSZip();
        let count = 0;
        log(t('downloadingFiles', { count: files.length }));
        setProgress(0);

        // 并发下载限制
        const limit = 10;
        for (let i = 0; i < files.length; i += limit) {
            await Promise.all(files.slice(i, i + limit).map(async f => {
                const bar = f.domId ? document.getElementById(f.domId) : null;
                if(bar) bar.style.width = '20%'; 
                
                try {
                    const blob = await fetch(f.url).then(r => r.blob());
                    zip.file(f.path, blob);
                    if(bar) bar.style.width = '100%';
                } catch (e) { 
                    console.error(e);
                    if(bar) {
                        bar.style.backgroundColor = 'red';
                        bar.style.width = '100%';
                    }
                }
                count++;
                const percent = (count / files.length * 100).toFixed(0);
                log(`${t('downloadingFiles', { count: files.length })} (${percent}%)`);
                setProgress(percent);
            }));
        }

    zip.generateAsync({type:"blob"}).then(function(content) {
        const a = document.createElement("a");
        a.href = URL.createObjectURL(content);
        a.download = zipName;
        a.click();
        
        log(t('done'));
        $('#progress-container').style.display = 'none';
        $('#btn-download').disabled = false;
    });
}

// 添加回车触发
$('#url').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') start();
});

// 绑定搜索框回车事件
$('#file-search').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') performFileSearch();
});

async function start() {
    let url = $('#url').value.trim();
    if (!url) return log(t('enterUrl'));
    
    // 自动补全 github.com 前缀
    if (!url.startsWith('http') && !url.startsWith('git@')) {
        if (url.indexOf('github.com') === -1) {
                // 简单的格式检查，避免非法字符？暂时先直接补全
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
    $('#file-search').disabled = true; // Disable search
    $('#btn-search-file').disabled = true;
    $('#file-search').value = ''; // Clear search
    log(t('analyzing'));

    // 解析 URL
    const parsed = parseGitHubUrl(url);
    if (!parsed) {
        log(t('invalidUrl'));
        $('#btn-analyze').disabled = false;
        return;
    }
    
    const { owner, repo, type, path: urlPath } = parsed;
    let ref = parsed.ref;
    let path = urlPath;
    
    // 处理用户主页逻辑
    if (parsed.type === 'user') {
        await handleUserRepos(parsed.owner);
        return;
    }

    log(t('fetchingBranches'));
    
    try {
        // 获取所有分支和标签
        // 用于区分 URL 中的分支名和路径
        // e.g. tree/feature/new/logic/src/index.js -> is branch "feature/new" or "feature/new/logic"?
        const [branches, tags] = await Promise.all([
            fetchWithProxy(`https://api.github.com/repos/${owner}/${repo}/branches`).then(r => r.json()),
            fetchWithProxy(`https://api.github.com/repos/${owner}/${repo}/tags`).then(r => r.json())
        ]);

        if (branches.message) throw new Error(branches.message);

        const branchNames = branches.map(b => b.name);
        const tagNames = tags.map(t => t.name);
        const refs = [...branchNames, ...tagNames].sort((a, b) => b.length - a.length); // Sort by length desc
        currentRefs = refs; // Store for selector

        // 若未指定引用，尝试使用默认分支
        if (!ref) {
                const repoInfo = await fetchWithProxy(`https://api.github.com/repos/${owner}/${repo}`).then(r => r.json());
                ref = repoInfo.default_branch || 'master';
        } else {
                // 尝试从 URL 匹配引用
                // The URL parser might have captured "branch/path/to/file" as "branch" and "path/to/file"
                // We need to check if the captured "ref" is actually part of a longer branch name
                const potentialRef = ref + (path ? '/' + path : '');
                const matchedRef = refs.find(r => potentialRef === r || potentialRef.startsWith(r + '/'));
                
                if (matchedRef) {
                    ref = matchedRef;
                    path = potentialRef.substring(matchedRef.length).replace(/^\//, '');
                }
        }
        
        // 填充引用选择器
        const selector = $('#ref-selector');
        selector.innerHTML = '';
        
        // 显示排序：主分支优先
        const displayRefs = [...currentRefs].sort((a, b) => {
            const pA = (a === 'main' || a === 'master') ? 1 : 0;
            const pB = (b === 'main' || b === 'master') ? 1 : 0;
            if (pA !== pB) return pB - pA; // Higher priority first
            return a.localeCompare(b);
        });

        displayRefs.forEach(r => {
            const option = document.createElement('option');
            option.value = r;
            option.text = r;
            option.selected = r === ref;
            selector.appendChild(option);
        });
        
        $('#breadcrumbs-container').style.display = 'flex'; // Show breadcrumbs container

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
}

async function handleUserRepos(owner) {
        log(t('fetchingRepos'));
        try {
            const repos = await fetchWithProxy(`https://api.github.com/users/${owner}/repos?per_page=100&sort=updated`).then(r => r.json());
            if (repos.message) throw new Error(repos.message);
            if (!repos.length) throw new Error(t('noFilesFound')); // 复用消息
            
            const container = $('#tree-view');
            container.innerHTML = '';
            container.style.display = 'block';
            
            const ul = document.createElement('div');
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
                ul.appendChild(div);
            });
            container.appendChild(ul);
            
            log(t('selectRepo'));
            $('#breadcrumbs-container').style.display = 'none';

            // Update URL for user profile
            window.history.pushState(null, '', '/?' + `https://github.com/${owner}`);
            
        } catch(e) {
        console.error(e);
        showToast(t('error') + ': ' + e.message, 'error');
    } finally {
        $('#btn-analyze').disabled = false;
        // Enable status button if repo loaded
            if (currentRepoInfo.owner) $('#btn-status').disabled = false;
        }
}

async function onRefChange() {
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
}

async function fetchAndRenderTree(owner, repo, ref, path) {
    log(t('fetchingFileList'));
    let files = [];
    
    // 检查是否为 blob URL，区分文件和目录
    // If path is provided, we need to check if it's a file or directory. 
    // The previous logic used 'type' from URL, but now we might change branch.
    // Let's assume tree first.
    
    try {
            const treeUrl = `https://api.github.com/repos/${owner}/${repo}/git/trees/${ref}?recursive=1`;
            const treeData = await fetchWithProxy(treeUrl).then(r => r.json());
            
            if (treeData.message) throw new Error(treeData.message);
            if (treeData.truncated) {
            const msg = 'Warning: Repository is too large (>100k files). File list is truncated.';
            log(msg);
            showToast(msg, 'info', 5000);
        }
            
            files = treeData.tree
                .filter(i => i.type === 'blob'); // Only files

            if (path) {
                // Check if path exists as a directory prefix or exact file match
                files = files.filter(i => i.path === path || i.path.startsWith(path + '/'));
            }
            
            // 若未找到文件
            // If Tree API fails (e.g. repo too large), maybe fallback or error
    } catch (e) {
        // 若 Tree API 失败
        throw e;
    }
    
    if (!files.length) throw new Error(t('noFilesFound'));

    $('#btn-status').disabled = false;

    // 使用模板处理 URL
    const template = $('#url-template').value.trim();
    const branch = ref; // Use resolved ref as branch
    files = files.map(i => {
        let fileUrl = template
            .replace('{owner}', owner)
            .replace('{repo}', repo)
            .replace('{ref}', branch)
            .replace('{branch}', branch)
            .replace('{path}', i.path);
        
        const repoUrl = `https://github.com/${owner}/${repo}/blob/${branch}/${i.path}`;

        return { 
            path: i.path, 
            url: fileUrl,
            repoUrl: repoUrl,
            size: i.size // Capture size
        };
    });

    currentFiles = files; // Store for download
    // currentRepoInfo 路径已设置
    currentRepoInfo.ref = ref; // Update ref in state

    // 渲染目录树
    renderBreadcrumbs(owner, repo, branch, path);
    renderTree(files, path);
    
    $('#file-search').disabled = false; // Enable search
    $('#btn-search-file').disabled = false;
    $('#file-search').placeholder = "Search files... / 搜索文件...";
    
    showToast(t('analysisComplete', { count: files.length }), 'success');
    $('#btn-download').disabled = false;
    $('#btn-github1s').disabled = false;
    $('#btn-export-ai').disabled = false;
    $('#btn-release').disabled = false;
    $('#btn-code-search').disabled = false;

    // Update Browser URL for easy sharing / 更新浏览器 URL
    let shareUrl = `https://github.com/${owner}/${repo}`;
    if (branch && (path || (branch !== 'main' && branch !== 'master'))) {
        shareUrl += `/tree/${branch}`;
        if (path) shareUrl += `/${path}`;
    }
    window.history.pushState(null, '', '/?' + shareUrl);
}

function performFileSearch() {
    const val = $('#file-search').value.trim().toLowerCase();
    
    if (!val) {
        renderTree(currentFiles, currentRepoInfo.path);
        log('Search cleared.');
        return;
    }
    
    log(`Searching for "${val}"...`);
    
    // Filter files
    const filtered = currentFiles.filter(f => f.path.toLowerCase().includes(val));
    
    log(`Found ${filtered.length} matches.`);
    
    // Re-render
    renderTree(filtered, currentRepoInfo.path);
    
    // Expand all folders when searching
    const details = document.querySelectorAll('#tree-view details');
    details.forEach(d => d.open = true);
}

async function exportForAI() {
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
            
            // Generate Tree Structure
            filesToExport.forEach(f => {
                markdown += `- ${f.path}\n`;
            });
            
            markdown += `\n# File Contents\n\n`;
            
            let count = 0;
            // Concurrent limit
            const limit = 5;
            for (let i = 0; i < filesToExport.length; i += limit) {
                await Promise.all(filesToExport.slice(i, i + limit).map(async file => {
                try {
                    const ext = file.path.split('.').pop();
                    const res = await fetch(file.url);
                    const text = await res.text();
                    
                    // Simple content check to avoid binary (if extension is not obvious)
                    if (text.indexOf('\0') !== -1) {
                        markdown += `## ${file.path}\n\n> Binary file skipped\n\n`;
                    } else {
                        markdown += `## ${file.path}\n\n\`\`\`${ext}\n${text}\n\`\`\`\n\n`;
                    }
                } catch (e) {
                    markdown += `## ${file.path}\n\n> Error fetching content: ${e.message}\n\n`;
                }
                count++;
                const tokens = Math.round(markdown.length / 4);
                btn.innerText = `Exporting ${count}/${filesToExport.length} (~${(tokens/1000).toFixed(1)}k tokens)...`;
                }));
            }
            
            // Download
            const blob = new Blob([markdown], { type: 'text/markdown' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
        a.href = url;
        a.download = `${currentRepoInfo.repo}-context.md`;
        a.click();
        
        // Show Token Estimate Result
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
}

async function downloadZip() {
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
}

/* Discovery Logic */
let discMode = 'search';
let markedLoaded = false;
const readmeCache = new Map();

function openDiscovery() {
    $('#discovery-modal').style.display = 'flex';
    $('#disc-modal-title').innerText = "Repo Discovery / 发现仓库";
    
    // Restore layout (in case it was used for file preview)
    $('.discovery-sidebar').style.display = 'block';
    $('.discovery-main').style.display = 'flex';
    $('#disc-preview-panel').style.width = ''; // Let CSS handle width (75%)
    $('#disc-preview-panel').style.borderLeft = ''; // Let CSS handle
    $('#disc-preview-panel').style.display = 'none'; // Start hidden

    ensureMarked().catch(e => console.error('Failed to load marked', e));
}

function closeDiscovery() {
    $('#discovery-modal').style.display = 'none';
    
    // Full Layout Reset to prevent state corruption
    const sidebar = $('.discovery-sidebar');
    const main = $('.discovery-main');
    const panel = $('#disc-preview-panel');
    
    if (sidebar) {
        sidebar.style.display = 'block';
        sidebar.classList.remove('hidden');
    }
    
    if (main) {
        main.style.display = 'flex';
        main.style.flex = '1';
        main.style.maxWidth = '';
        main.style.minWidth = '0';
    }
    
    if (panel) {
        panel.style.display = 'none';
        panel.style.width = '';
    }
    
    currentPreviewRepo = null;
}

function switchDiscoveryMode(mode) {
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
}

async function performDiscoveryAction() {
    const listEl = $('#disc-repo-list');
    listEl.innerHTML = '<div style="grid-column: 1/-1; text-align:center; padding: 50px;">Loading...</div>';
    
    try {
        let query = '';
        if (discMode === 'search') {
            const k = $('#disc-searchInput').value.trim();
            if (k) query += k;
            else if (!$('#disc-langSelect').value) query += 'stars:>1000';
        } else {
            const range = $('#disc-dateRange').value;
            const date = new Date();
            if (range === 'daily') date.setDate(date.getDate() - 1);
            else if (range === 'weekly') date.setDate(date.getDate() - 7);
            else if (range === 'monthly') date.setMonth(date.getMonth() - 1);
            query += `created:>${date.toISOString().split('T')[0]}`;
        }

        const lang = $('#disc-langSelect').value;
        if (lang) query += ` language:${lang}`;
        
        const minStars = $('#disc-minStars').value;
        if (minStars) query += ` stars:>${minStars}`;
        
        const sort = $('#disc-sortSelect').value;
        const url = `https://api.github.com/search/repositories?q=${encodeURIComponent(query.trim())}&sort=${sort}&order=desc&per_page=30`;

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
}

function renderDiscoveryRepos(repos) {
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
            const colors = { JavaScript: '#f1e05a', TypeScript: '#2b7489', Python: '#3572A5', Java: '#b07219', Go: '#00ADD8', Rust: '#dea584', Vue: '#41b883', HTML:'#e34c26', CSS:'#563d7c' };
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
}

let currentPreviewRepo = null;
let currentRawReadme = null;

async function showDiscoveryPreview(repo) {
    const panel = $('#disc-preview-panel');
    const content = $('#disc-preview-content');
    const sidebar = $('.discovery-sidebar');
    const main = $('.discovery-main');
    
    // Layout Fix: Hide sidebar, shrink main list
    // Use inline styles to guarantee layout (25% / 75%)
    sidebar.style.display = 'none';
    
    // Force 25% width for the list
    main.style.flex = '0 0 25%';
    main.style.maxWidth = '25%';
    main.style.minWidth = '25%';
    
    // Restore inner title for discovery mode
    $('#disc-preview-title').style.display = 'block';

    // Configure Preview Panel
    panel.style.display = 'flex';
    panel.style.flexDirection = 'column'; // Ensure vertical stacking
    panel.style.flex = '1'; // Take remaining space (75%)
    panel.style.width = ''; // Clear fixed width if any
    panel.style.minWidth = '0'; // Allow shrinking
    panel.style.borderLeft = '1px solid var(--border)';
    
    $('#disc-preview-title').innerText = repo.full_name;
    $('#disc-link-github').href = repo.html_url;
    
    // Store current context
    currentPreviewRepo = repo;
    currentRawReadme = null;

    // Reset buttons
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

    // Check Cache
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

    try {
        const res = await fetch(`https://api.github.com/repos/${repo.full_name}/readme`);
        if (!res.ok) throw new Error('No README');
        const data = await res.json();
        const raw = decodeURIComponent(escape(window.atob(data.content.replace(/\n/g, ''))));
        
        // Cache it
        readmeCache.set(repo.full_name, raw);
        currentRawReadme = raw;
        
        await renderMarkdown(raw, repo.full_name);
    } catch (e) {
        content.innerText = 'Failed to load README: ' + e.message;
    }
}

async function showMarkdownFile(filename, text, url, filepath) {
    // Show modal
    $('#discovery-modal').style.display = 'flex';
    
    // Set full URL path title
    const fullUrl = `https://github.com/${currentRepoInfo.owner}/${currentRepoInfo.repo}/blob/${currentRepoInfo.ref}/${filepath}`;
    const titleEl = $('#disc-modal-title');
    titleEl.innerText = fullUrl;
    titleEl.title = fullUrl;
    titleEl.style.whiteSpace = 'nowrap';
    titleEl.style.overflow = 'hidden';
    titleEl.style.textOverflow = 'ellipsis';
    titleEl.style.maxWidth = 'calc(100vw - 100px)';
    titleEl.style.display = 'block';

    // Layout for file preview: Hide sidebar/main, Full width panel
    $('.discovery-sidebar').style.display = 'none';
    $('.discovery-main').style.display = 'none';
    
    const panel = $('#disc-preview-panel');
    panel.style.display = 'flex';
    panel.style.width = '100%';
    panel.style.borderLeft = 'none';
    
    // Hide the redundant preview title inside the panel since we moved it to modal header
    $('#disc-preview-title').style.display = 'none';

    // $('#disc-preview-title').innerText = filename; // No longer needed
    $('#disc-link-github').href = url;
    
    // Context
    currentPreviewRepo = currentRepoInfo.owner + '/' + currentRepoInfo.repo;
    currentRawReadme = text;

    // Buttons
    $('#disc-btn-open').innerText = "Download";
    $('#disc-btn-open').onclick = () => downloadSingleFile(url, filename);
    
    $('#disc-btn-github1s').onclick = () => {
            const { owner, repo, ref } = currentRepoInfo;
            const g1sUrl = `https://github1s.com/${owner}/${repo}/blob/${ref}/${filepath}`;
            window.open(g1sUrl, '_blank');
    };
    
    await renderMarkdown(text, currentPreviewRepo);
}

async function rerenderPreview() {
    if (currentRawReadme && currentPreviewRepo) {
        const content = $('#disc-preview-content');
        content.innerHTML = '<span style="color:gray">Re-rendering...</span>';
        try {
            await renderMarkdown(currentRawReadme, currentPreviewRepo.full_name);
        } catch(e) {
            content.innerText = 'Render failed: ' + e.message;
        }
    }
}

async function renderMarkdown(text, contextRepo) {
        const engine = $('#disc-render-engine').value;
        const content = $('#disc-preview-content');
        
        if (engine === 'source') {
            const safeText = text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
            content.innerHTML = `<pre style="white-space:pre-wrap; word-wrap:break-word; background:var(--bg-secondary); padding:10px; border-radius:4px; font-family:monospace;">${safeText}</pre>`;
            return;
        }

        if (engine === 'api') {
            // GitHub API Render
            try {
                const res = await fetch('https://api.github.com/markdown', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        // If token is set, use it
                        ...(localStorage.getItem('gh_token') ? { 'Authorization': `token ${localStorage.getItem('gh_token')}` } : {})
                    },
                    body: JSON.stringify({
                        text: text,
                        mode: 'gfm',
                        context: contextRepo
                    })
                });
                
                if (!res.ok) throw new Error(`API Error ${res.status}`);
                const html = await res.text();
                content.innerHTML = html;
            } catch (e) {
                console.error('API Render Error', e);
                content.innerHTML = `<div style="color:red">API Render Failed: ${e.message}. Falling back to JS.</div>`;
                // Fallback
                if (window.marked) content.innerHTML += window.marked.parse(text);
            }
        } else {
            // JS Render
            if (window.marked) {
                content.innerHTML = window.marked.parse(text);
            } else {
                content.innerText = text;
            }
        }
}

function closeDiscPreview() {
    const sidebar = $('.discovery-sidebar');
    const main = $('.discovery-main');
    
    // Check if we are in File Preview mode (where main list is hidden)
    if (main.style.display === 'none') {
        closeDiscovery();
        return;
    }
    
    // Otherwise, we are in Discovery Preview mode
    $('#disc-preview-panel').style.display = 'none';
    
    // Restore Sidebar and Main List
    sidebar.style.display = 'block'; 
    
    // Reset Main List to flexible width
    main.style.flex = '1';
    main.style.maxWidth = '';
    main.style.minWidth = '0';
}

function loadScript(urls) {
    if (!urls || !urls.length) return Promise.reject(new Error('No URLs'));
    return new Promise((resolve, reject) => {
        const s = document.createElement('script');
        s.src = urls[0];
        s.onload = resolve;
        s.onerror = () => {
            console.warn(`Failed to load ${urls[0]}, trying fallback...`);
            loadScript(urls.slice(1)).then(resolve).catch(reject);
        };
        document.head.appendChild(s);
    });
}

// Bind Enter for discovery search
$('#disc-searchInput').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') performDiscoveryAction();
});

// Close modals on click outside / 点击边缘关闭
document.querySelectorAll('.modal-overlay').forEach(el => {
    el.addEventListener('click', (e) => {
        if (e.target === el) {
            if (el.id === 'discovery-modal') {
                    // Prevent accidental closing of the Discovery modal
                    // Users must use the 'X' button or ESC key
                    return;
            } else if (el.id === 'preview-modal') {
                closePreview();
            } else {
                el.style.display = 'none';
            }
        }
    });
});

// Global Key Handler for ESC
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

let statusDataCache = {};

function switchStatusTab(tabId) {
    // Update Tab UI
    document.querySelectorAll('.tab-nav .tab-item').forEach(el => {
        el.classList.remove('active');
        if (el.getAttribute('onclick').includes(tabId)) el.classList.add('active');
    });
    
    document.querySelectorAll('.status-tab-content').forEach(el => el.classList.remove('active'));
    document.getElementById(`status-tab-${tabId}`).classList.add('active');
    
    // Load content if needed
    if (tabId === 'overview') loadStatusOverview();
    else if (tabId === 'activity') loadStatusActivity();
    else if (tabId === 'ci') loadStatusCI();
    else if (tabId === 'commits') loadStatusCommits();
    else if (tabId === 'contributors') loadStatusContributors();
    else if (tabId === 'issues') loadStatusIssues();
    else if (tabId === 'languages') loadStatusLanguages();
}

async function openRepoStatus() {
        const { owner, repo } = currentRepoInfo;
        if (!owner || !repo) return;
        
        $('#status-modal').style.display = 'flex';
        
        // Reset Cache if repo changed
        const repoKey = `${owner}/${repo}`;
        if (statusDataCache.key !== repoKey) {
            statusDataCache = { key: repoKey };
            // Reset UI
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
}

async function loadStatusOverview() {
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
                <div class="stat-card">
                    <div class="stat-value">${formatCompactNumber(repoData.stargazers_count)}</div>
                    <div class="stat-label">Stars</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${formatCompactNumber(repoData.forks_count)}</div>
                    <div class="stat-label">Forks</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${formatCompactNumber(repoData.subscribers_count)}</div>
                    <div class="stat-label">Watchers</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${formatCompactNumber(repoData.open_issues_count)}</div>
                    <div class="stat-label">Issues</div>
                </div>
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
                        <div>${hasGitignore ? 'Yes' : 'No'} .gitignore</div>
                        <div>${hasLicense ? 'Yes' : 'No'} LICENSE</div>
                        <div>${community && community.files && community.files.readme ? 'Yes' : 'No'} README</div>
                        <div>${community && community.files && community.files.contributing ? 'Yes' : 'No'} CONTRIBUTING</div>
                        <div>${hasEditorConfig ? 'Yes' : 'No'} .editorconfig</div>
                        <div>${hasESLint ? 'Yes' : 'No'} ESLint</div>
                    </div>
                </div>
            </div>
        `;
        
        container.innerHTML = html;
        statusDataCache.overview = true;
        
    } catch (e) {
        container.innerHTML = `<div style="color:red">Error: ${e.message}</div>`;
    }
}

async function loadStatusCommits() {
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
}

async function loadStatusContributors() {
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
}

async function loadStatusIssues() {
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
}

async function loadStatusLanguages() {
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
}

// Code Search Logic
function openCodeSearch() {
        $('#code-search-modal').style.display = 'flex';
        $('#code-search-input').focus();
}

async function performCodeSearch() {
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
                    // Construct raw URL for preview
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
}

async function loadStatusActivity() {
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
}

async function loadStatusCI() {
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
}

function formatCompactNumber(num) {
    return Intl.NumberFormat('en-US', { notation: "compact", maximumFractionDigits: 1 }).format(num);
}

function timeAgo(date) {
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
}

function openGithub1s() {
        const { owner, repo, ref, path } = currentRepoInfo;
        if (!owner || !repo) return;
        
        let url = `https://github1s.com/${owner}/${repo}`;
        if (ref) {
            // github1s format: https://github1s.com/owner/repo/tree/ref/path
            // If path is empty, it's just root of ref
            
            // Note: github1s handles /blob/ vs /tree/ gracefully, but let's stick to standard github URL structure
            // If we have a path, and we are in explorer mode (folder), use tree.
            url += `/tree/${ref}`;
            if (path) {
                url += `/${path}`;
            }
        }
        window.open(url, '_blank');
}


async function ensureMarked() {
    if (markedLoaded || window.marked) {
        markedLoaded = true;
        return;
    }
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
}

async function ensureJSZip() {
    if (window.JSZip) return;
    try {
        await loadScript([
            'jszip.min.js',
            'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js',
            'https://unpkg.com/jszip@3.10.1/dist/jszip.min.js'
        ]);
        if (!window.JSZip) throw new Error('JSZip loaded but not available on window');
    } catch (e) {
        console.error('JSZip load failed', e);
        throw e;
    }
}

async function openReleaseInfo() {
    const { owner, repo } = currentRepoInfo;
    const container = $('#release-modal-body');
    $('#release-modal').style.display = 'flex';
    container.innerHTML = '<div style="text-align:center;padding:20px">Loading releases...</div>';
    
    try {
        // Ensure marked is loaded before use
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
                    
                    // Get template
                    let template = $('#release-url-template').value.trim();
                    if (!template) template = 'https://github.com/{owner}/{repo}/releases/download/{tag}/{filename}';
                    
                    rel.assets.forEach(asset => {
                        const size = formatSize(asset.size);
                        
                        // Generate custom URL
                        let downloadUrl = template
                            .replace('{owner}', owner)
                            .replace('{repo}', repo)
                            .replace('{tag}', rel.tag_name)
                            .replace('{filename}', asset.name);
                        
                        // Fallback if user messed up template or it's empty
                        if (downloadUrl.indexOf('{') > -1) { 
                                // Check if they meant to keep some braces? Assume simple replace failed if braces remain
                                // Actually some might use query params {?query}. Let's just trust the replacement.
                        }
                        
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
}

function closeReleaseModal() {
    $('#release-modal').style.display = 'none';
}

function resetSetting(id, defaultValue) {
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
}

function updateSettingsPreview() {
    // Release Preview
    const relTemplate = $('#release-url-template').value.trim() || 'https://github.com/{owner}/{repo}/releases/download/{tag}/{filename}';
    const relPreview = relTemplate
        .replace('{owner}', 'HOG-StarWatch')
        .replace('{repo}', 'github-repo-explorer')
        .replace('{tag}', 'v1.0.0')
        .replace('{filename}', 'github-repo-explorer.zip');
    
    const relPreviewEl = $('#release-preview');
    if(relPreviewEl) relPreviewEl.innerText = 'Preview: ' + relPreview;

    // File Preview
    const fileTemplate = $('#url-template').value.trim() || 'https://raw.githubusercontent.com/{owner}/{repo}/{ref}/{path}';
    const filePreview = fileTemplate
        .replace('{owner}', 'HOG-StarWatch')
        .replace('{repo}', 'github-repo-explorer')
        .replace('{ref}', 'main')
        .replace('{path}', 'README.md');
    
    const filePreviewEl = $('#file-preview');
    if(filePreviewEl) filePreviewEl.innerText = 'Preview: ' + filePreview;
}

// Theme Toggle Logic
function toggleTheme() {
    const html = document.documentElement;
    const current = html.getAttribute('data-theme');
    const next = current === 'light' ? 'dark' : 'light';
    html.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
    updateThemeIcon(next);
}

function updateThemeIcon(theme) {
    const btn = document.getElementById('theme-toggle-btn');
    if (btn) {
        // Sun for light, Moon for dark
        btn.innerHTML = theme === 'light' 
            ? '<svg viewBox="0 0 16 16" width="16" height="16" fill="currentColor"><path d="M8 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM8 0a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-1 0v-2A.5.5 0 0 1 8 0zm0 13a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-1 0v-2A.5.5 0 0 1 8 13zm8-5a.5.5 0 0 1-.5.5h-2a.5.5 0 0 1 0-1h2a.5.5 0 0 1 .5.5zM3 8a.5.5 0 0 1-.5.5h-2a.5.5 0 0 1 0-1h2A.5.5 0 0 1 3 8zm10.657-5.657a.5.5 0 0 1 0 .707l-1.414 1.415a.5.5 0 1 1-.707-.708l1.414-1.414a.5.5 0 0 1 .707 0zm-9.193 9.193a.5.5 0 0 1 0 .707L3.05 13.657a.5.5 0 0 1-.707-.707l1.414-1.414a.5.5 0 0 1 .707 0zm9.193 2.121a.5.5 0 0 1-.707 0l-1.414-1.414a.5.5 0 0 1 .707-.707l1.414 1.414a.5.5 0 0 1 0 .707zM4.46 4.46a.5.5 0 0 1-.707 0L2.343 3.05a.5.5 0 1 1 .707-.707l1.414 1.414a.5.5 0 0 1 0 .708z"/></svg>'
            : '<svg viewBox="0 0 16 16" width="16" height="16" fill="currentColor"><path d="M9.598 1.591a.75.75 0 0 1 .785-.175 7 7 0 1 1-8.967 8.967.75.75 0 0 1 .961-.96 5.5 5.5 0 0 0 7.046-7.046.75.75 0 0 1 .175-.786zm1.616 1.945a7 7 0 0 1-7.678 7.678 5.5 5.5 0 1 0 7.678-7.678z"/></svg>';
    }
}

// Initialize Theme
(function initTheme() {
    const saved = localStorage.getItem('theme') || 'dark';
    document.documentElement.setAttribute('data-theme', saved);
    // updateThemeIcon will be called after DOMContentLoaded
})();

// Initialize from URL params / 初始化 URL 参数
window.addEventListener('DOMContentLoaded', () => {
    // Restore Settings from localStorage
        const savedToken = localStorage.getItem('gh_token');
        if (savedToken) $('#gh-token').value = savedToken;
        
        const savedApiProxy = localStorage.getItem('gh_api_proxy');
        if (savedApiProxy) $('#api-proxy').value = savedApiProxy;

        const savedReleaseTemplate = localStorage.getItem('gh_release_template');
        if (savedReleaseTemplate) $('#release-url-template').value = savedReleaseTemplate;

        const savedUrlTemplate = localStorage.getItem('gh_url_template');
        if (savedUrlTemplate) $('#url-template').value = savedUrlTemplate;
        
        // Initial Preview
        updateSettingsPreview();

        // Bind inputs to localStorage and Preview
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

        // Initialize Theme Icon
        const savedTheme = localStorage.getItem('theme') || 'dark';
        updateThemeIcon(savedTheme);

        let targetUrl = '';
        
        // 1. Check Search Query (?...)
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
        
        // 2. Check Hash (#...) - often used for SPAs on static hosts
    if (!targetUrl && window.location.hash) {
        let raw = window.location.hash.substring(1); // remove #
        // Support #/user/repo or #user/repo
        if (raw.startsWith('/')) raw = raw.substring(1);
        // Allow simple paths (user/repo) or even just user
        if (raw) targetUrl = raw;
    }

        // 3. Check Pathname (/...) - for SPA capable servers
    // e.g. example.com/user/repo -> pathname is /user/repo
    if (!targetUrl) {
        const path = window.location.pathname;
        // Filter out common files and root
        if (path && path !== '/' && path !== '/index.html' && !path.endsWith('.html')) {
            let raw = path.replace(/^\//, ''); // remove leading slash
            // Only treat as repo/user if it matches pattern
            if (raw) {
                targetUrl = raw;
            }
        }
    }

        if (targetUrl) {
            // Ignore if it's just 'index.html' or similar
            if (targetUrl === 'index.html') return;

            $('#url').value = targetUrl;
            // Small delay to ensure UI is ready
            setTimeout(start, 100);
        }
});
