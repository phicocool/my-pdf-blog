// --- 全局设置 ---
const ADMIN_PASSWORD = 'gemini';

// --- 主执行函数 ---
document.addEventListener('DOMContentLoaded', () => {
    if (!document.body) {
        console.error("DOM not fully loaded, aborting script.");
        return;
    }
    const pageId = document.body.id;

    // 根据页面ID精确执行初始化函数
    switch (pageId) {
        case 'page-login':
            initLoginPage();
            break;
        case 'page-index':
            initIndexPage();
            break;
        case 'page-new-post':
            initNewPostPage();
            break;
        case 'page-view-post':
            initViewPostPage();
            break;
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
    updateVisitCount(); // 修复后的计数器
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

// --- 仪表盘功能 (修复访问计数) ---

function updateVisitCount() {
    const countEl = document.getElementById('visit-count');
    if (!countEl) return;

    // 1. 从localStorage获取当前计数值，如果不存在则为0
    let count = parseInt(localStorage.getItem('visitCount') || '0');
    
    // 2. 每次调用时都将计数值加1
    count++;
    
    // 3. 将新的计数值存回localStorage
    localStorage.setItem('visitCount', count);
    
    // 4. 在页面上显示新的计数值
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
    fetch('https://wttr.in/?format=j1')
        .then(response => { if (!response.ok) throw new Error('Network response was not ok'); return response.json(); })
        .then(data => {
            if (data.nearest_area && data.current_condition) {
                const area = data.nearest_area[0].areaName[0].value;
                const region = data.nearest_area[0].region[0].value;
                const current = data.current_condition[0];
                weatherContent.innerHTML = `<p><strong>${area}, ${region}</strong></p><p>${current.lang_zh[0].value}, ${current.temp_C}°C</p><p>体感: ${current.FeelsLikeC}°C</p>`;
            } else { weatherContent.innerHTML = '<p>天气数据格式有误。</p>'; }
        })
        .catch(error => { console.error('天气信息获取失败:', error); weatherContent.innerHTML = '<p>无法加载天气信息。</p>'; });
}

function fetchNews(rssUrl, elementId) {
    const newsContent = document.getElementById(elementId);
    if (!newsContent) return;
    const apiUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(rssUrl)}`;
    fetch(apiUrl)
        .then(response => { if (!response.ok) throw new Error('Network response was not ok'); return response.json(); })
        .then(data => {
            if (data.status === 'ok' && data.items) {
                const newsList = document.createElement('ul'); newsList.className = 'news-list';
                data.items.slice(0, 5).forEach(item => {
                    const listItem = document.createElement('li');
                    listItem.innerHTML = `<a href="${item.link}" target="_blank" rel="noopener noreferrer">${item.title}</a>`;
                    newsList.appendChild(listItem);
                });
                newsContent.innerHTML = ''; newsContent.appendChild(newsList);
            } else { throw new Error(data.message || 'Invalid data structure'); }
        })
        .catch(error => { console.error('新闻获取失败:', error); newsContent.innerHTML = '<p>无法加载新闻提要。</p>'; });
}


// --- 数据存储与PDF生成 ---

function getPosts() { return JSON.parse(localStorage.getItem('blogPosts') || '[]'); }
function getPostById(id) { if (!id) return null; return getPosts().find(post => post.id && post.id.toString() === id); }
function savePost(postData) {
    const posts = getPosts();
    posts.push({ id: Date.now(), timestamp: Date.now(), ...postData });
    localStorage.setItem('blogPosts', JSON.stringify(posts));
}
function generatePdf() {
    const element = document.getElementById('pdf-content');
    const postTitle = document.getElementById('dynamic-header-title')?.textContent || 'document';
    const fileName = `${postTitle}.pdf`;
    const opt = { margin: [15, 10, 15, 10], filename: fileName, image: { type: 'jpeg', quality: 0.98 }, html2canvas: { scale: 2, useCORS: true }, jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }, pagebreak: { mode: ['avoid-all', 'css', 'legacy'] } };
    html2pdf().from(element).set(opt).save();
}
