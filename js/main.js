// --- 全局设置 ---
const ADMIN_PASSWORD = 'gemini';

// --- 主执行函数 ---
document.addEventListener('DOMContentLoaded', () => {
    if (!document.body) { console.error("DOM not fully loaded."); return; }
    const pageId = document.body.id;

    // 根据页面ID精确执行初始化函数
    switch (pageId) {
        case 'page-login': initLoginPage(); break;
        case 'page-index': initIndexPage(); break;
        case 'page-new-post': initNewPostPage(); break;
        case 'page-view-post': initViewPostPage(); break;
    }

    // 为所有页面的退出按钮添加通用事件
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            sessionStorage.removeItem('isLoggedIn');
            window.location.href = 'login.html';
        });
    }
});


// --- 各页面初始化函数 ---
function initLoginPage() {
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const passwordInput = document.getElementById('password');
            const errorMessage = document.getElementById('error-message');
            if (passwordInput && passwordInput.value === ADMIN_PASSWORD) {
                sessionStorage.setItem('isLoggedIn', 'true');
                window.location.href = 'index.html';
            } else if (errorMessage) {
                errorMessage.textContent = '密码错误，请重试！';
            }
        });
    }
}

function initIndexPage() {
    displayPostList();
    updateVisitCount();
    updateDailyQuote();
    fetchWeather();
    fetchNews('https://rss.ftchinese.com/feed.xml', 'news-china-content');
    fetchNews('http://feeds.bbci.co.uk/news/world/rss.xml', 'news-world-content');
}

function initNewPostPage() {
    const newPostForm = document.getElementById('new-post-form');
    if (newPostForm) {
        newPostForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const title = document.getElementById('post-title').value;
            const content = document.getElementById('post-content').value;
            savePost({ title, content });
            alert('文章发布成功！');
            window.location.href = 'index.html';
        });
    }
}

function initViewPostPage() {
    const params = new URLSearchParams(window.location.search);
    const postId = params.get('id');
    const post = getPostById(postId);
    const titleEl = document.getElementById('dynamic-header-title');
    const contentContainer = document.getElementById('post-content-container');
    const downloadButton = document.getElementById('download-pdf-btn');

    if (post && titleEl && contentContainer && downloadButton) {
        document.title = post.title;
        titleEl.textContent = post.title;
        contentContainer.innerHTML = post.content;
        downloadButton.style.display = 'inline-flex';
        // 关键：将 generatePdf 绑定到按钮的 click 事件
        downloadButton.addEventListener('click', generatePdf);
    } else {
        if (contentContainer) {
            contentContainer.innerHTML = '<h2>文章加载失败</h2><p>无法找到指定的文章或页面结构错误，请返回首页。</p>';
        }
        if (downloadButton) downloadButton.style.display = 'none';
    }
}


// --- 功能函数 ---
function displayPostList() {
    const postListEl = document.getElementById('post-list');
    if (!postListEl) return;
    const posts = getPosts();
    if (posts.length === 0) {
        postListEl.innerHTML = '<li><p>还没有文章，快去发布一篇吧！</p></li>';
        return;
    }
    postListEl.innerHTML = '';
    posts.slice().reverse().forEach(post => {
        const listItem = document.createElement('li');
        const link = document.createElement('a');
        link.href = `view-post.html?id=${post.id}`;
        link.innerHTML = `<h3>${post.title}</h3><p>发布于：${new Date(post.timestamp).toLocaleString()}</p>`;
        listItem.appendChild(link);
        postListEl.appendChild(listItem);
    });
}

// --- 仪表盘功能 ---
function updateVisitCount() { /* 代码同前，保持不变 */ }
function updateDailyQuote() { /* 代码同前，保持不变 */ }
function fetchWeather() { /* 代码同前，保持不变 */ }
function fetchNews(rssUrl, elementId) { /* 代码同前，保持不变 */ }


// --- 数据存储与PDF生成 ---
function getPosts() { return JSON.parse(localStorage.getItem('blogPosts') || '[]'); }
function getPostById(id) { if (!id) return null; return getPosts().find(post => post.id && post.id.toString() === id); }

/**
 * [新功能] 保存文章时，净化HTML，移除script标签
 */
function savePost(postData) {
    const posts = getPosts();
    const sanitizedContent = postData.content.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    const newPost = {
        id: Date.now(),
        timestamp: Date.now(),
        title: postData.title,
        content: sanitizedContent
    };
    posts.push(newPost);
    localStorage.setItem('blogPosts', JSON.stringify(posts));
}

/**
 * [重大更新] 全面优化的PDF生成函数
 */
async function generatePdf() {
    const downloadButton = document.getElementById('download-pdf-btn');
    const contentToPrint = document.getElementById('pdf-content');
    const postTitle = document.getElementById('dynamic-header-title')?.textContent || 'document';
    const fileName = `${postTitle}.pdf`;

    if (!contentToPrint || !downloadButton) return;

    // 1. 设置加载状态
    const originalButtonText = downloadButton.innerHTML;
    downloadButton.disabled = true;
    downloadButton.innerHTML = '正在生成...';
    
    // 2. 添加强制打印样式类
    contentToPrint.classList.add('printable-area');

    const opt = {
        margin: [10, 10, 15, 10],
        filename: fileName,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, logging: false },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
    };

    try {
        // 3. 使用 html2pdf 生成 PDF
        await html2pdf().from(contentToPrint).set(opt).save();
    } catch (error) {
        console.error("PDF generation failed:", error);
        alert("PDF生成失败！请检查文章内容是否包含特殊格式，或尝试刷新页面后重试。");
    } finally {
        // 4. 无论成功或失败，都恢复按钮状态并移除打印样式
        contentToPrint.classList.remove('printable-area');
        downloadButton.disabled = false;
        downloadButton.innerHTML = originalButtonText;
    }
}

// 确保其他函数存在且无误
function updateVisitCount() {
    const countEl = document.getElementById('visit-count');
    if (!countEl) return;
    let count = parseInt(localStorage.getItem('visitCount') || '0');
    count++;
    localStorage.setItem('visitCount', count);
    countEl.textContent = count;
}
function updateDailyQuote() {
    const quoteEl = document.getElementById('daily-quote');
    if (!quoteEl) return;
    const quotes = [ "生活就像骑自行车，要想保持平衡，就得不断前进。", "你未来的样子，藏在现在的努力里。", "唯有热爱，可抵岁月漫长。", "勇敢的人，不是不流泪的人，而是含着泪水继续奔跑的人。", "种一棵树最好的时间是十年前，其次是现在。", "星光不问赶路人，时光不负有心人。", "真正的英雄主义，是在认清生活真相后依然热爱生活。" ];
    const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0)) / 86400000);
    quoteEl.textContent = quotes[dayOfYear % quotes.length];
}
function fetchWeather() {
    const weatherContent = document.getElementById('weather-content');
    if (!weatherContent) return;
    fetch('https://wttr.in/?format=j1').then(r => r.ok ? r.json() : Promise.reject(r)).then(d => {
        if(d.nearest_area && d.current_condition) weatherContent.innerHTML = `<p><strong>${d.nearest_area[0].areaName[0].value}</strong></p><p>${d.current_condition[0].lang_zh[0].value}, ${d.current_condition[0].temp_C}°C</p>`;
    }).catch(e => { console.error(e); weatherContent.innerHTML = '<p>天气加载失败</p>'; });
}
function fetchNews(rssUrl, elementId) {
    const newsContent = document.getElementById(elementId);
    if (!newsContent) return;
    const apiUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(rssUrl)}`;
    fetch(apiUrl).then(r => r.ok ? r.json() : Promise.reject(r)).then(d => {
        if (d.status === 'ok' && d.items) {
            const list = document.createElement('ul'); list.className = 'news-list';
            d.items.slice(0, 5).forEach(i => {
                const item = document.createElement('li');
                item.innerHTML = `<a href="${i.link}" target="_blank" rel="noopener noreferrer">${i.title}</a>`;
                list.appendChild(item);
            });
            newsContent.innerHTML = ''; newsContent.appendChild(list);
        }
    }).catch(e => { console.error(e); newsContent.innerHTML = '<p>新闻加载失败</p>'; });
}
