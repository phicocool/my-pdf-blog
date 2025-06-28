// --- 全局设置 ---
const ADMIN_PASSWORD = 'gemini'; 

// --- DOMContentLoaded 事件监听器 ---
// 当整个HTML文档加载和解析完成后运行
document.addEventListener('DOMContentLoaded', () => {
    // 检查body标签是否存在，以确保脚本在文档完全加载后运行
    if (!document.body) {
        console.error("DOM not ready, script cannot run.");
        return;
    }
    // 获取body的ID，这是我们新的页面路由器
    const pageId = document.body.id;

    // 根据页面ID执行相应的初始化函数
    switch (pageId) {
        case 'page-login':
            handleLoginPage();
            initializeLoginDashboard();
            break;
        case 'page-index':
            handleIndexPage();
            break;
        case 'page-new-post':
            handleNewPostPage();
            break;
        case 'page-view-post':
            handleViewPostPage();
            break;
        default:
            // 如果没有匹配的ID，则不执行任何操作
            // 这有助于防止在未知页面上运行脚本
            console.log("No specific initialization for this page.");
    }

    // 为所有页面的退出按钮添加事件 (这个逻辑保持不变)
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            sessionStorage.removeItem('isLoggedIn');
            window.location.href = 'login.html';
        });
    }
});


// --- 登录页仪表盘初始化 ---
function initializeLoginDashboard() {
    updateDateTime();
    updateDailyQuote();
    updateVisitCount();
    fetchWeather();
    fetchNews('https://rss.ftchinese.com/feed.xml', 'news-china-content');
    fetchNews('http://feeds.bbci.co.uk/news/world/rss.xml', 'news-world-content');
}

// ... (以下所有函数都保持和之前完全一样，无需修改) ...

// --- 仪表盘功能函数 ---
function updateDateTime() {
    const now = new Date();
    const gregorianEl = document.querySelector('.gregorian-date');
    const lunarEl = document.querySelector('.lunar-date');
    if (!gregorianEl || !lunarEl) return;
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const day = now.getDate();
    gregorianEl.textContent = `${year}年${month}月${day}日`;
    const lunarData = calendar.solar2lunar(year, month, day);
    lunarEl.textContent = `${lunarData.gzYear}年 ${lunarData.monthStr}${lunarData.dayStr}`;
}

function updateDailyQuote() {
    const quoteEl = document.getElementById('daily-quote');
    if (!quoteEl) return;
    const quotes = [
        "生活就像骑自行车，要想保持平衡，就得不断前进。", "你未来的样子，藏在现在的努力里。",
        "唯有热爱，可抵岁月漫长。", "勇敢的人，不是不流泪的人，而是含着泪水继续奔跑的人。",
        "种一棵树最好的时间是十年前，其次是现在。", "星光不问赶路人，时光不负有心人。",
        "真正的英雄主义，是在认清生活真相后依然热爱生活。"
    ];
    const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24));
    quoteEl.textContent = quotes[dayOfYear % quotes.length];
}

function updateVisitCount() {
    const countEl = document.getElementById('visit-count');
    if (!countEl) return;
    let count = localStorage.getItem('visitCount') || 0;
    count++;
    localStorage.setItem('visitCount', count);
    countEl.textContent = count;
}

function fetchWeather() {
    const weatherContent = document.getElementById('weather-content');
    if (!weatherContent) return;
    fetch('https://wttr.in/?format=j1')
        .then(response => response.json())
        .then(data => {
            const area = data.nearest_area[0].areaName[0].value;
            const region = data.nearest_area[0].region[0].value;
            const current = data.current_condition[0];
            weatherContent.innerHTML = `<p><strong>${area}, ${region}</strong></p><p>${current.lang_zh[0].value}, ${current.temp_C}°C</p><p>体感: ${current.FeelsLikeC}°C</p><p>风速: ${current.windspeedKmph} km/h</p>`;
        })
        .catch(error => {
            console.error('天气信息获取失败:', error);
            weatherContent.innerHTML = '<p>无法加载天气信息。</p>';
        });
}

function fetchNews(rssUrl, elementId) {
    const newsContent = document.getElementById(elementId);
    if (!newsContent) return;
    const apiUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(rssUrl)}`;
    fetch(apiUrl)
        .then(response => response.json())
        .then(data => {
            if (data.status === 'ok') {
                const newsList = document.createElement('ul');
                newsList.className = 'news-list';
                data.items.slice(0, 5).forEach(item => {
                    const listItem = document.createElement('li');
                    listItem.innerHTML = `<a href="${item.link}" target="_blank" rel="noopener noreferrer">${item.title}</a>`;
                    newsList.appendChild(listItem);
                });
                newsContent.innerHTML = '';
                newsContent.appendChild(newsList);
            } else { throw new Error(data.message); }
        })
        .catch(error => {
            console.error('新闻获取失败:', error);
            newsContent.innerHTML = '<p>无法加载新闻提要。</p>';
        });
}

// --- 页面处理函数 ---
function handleLoginPage() {
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const password = document.getElementById('password').value;
            const errorMessage = document.getElementById('error-message');
            if (password === ADMIN_PASSWORD) {
                sessionStorage.setItem('isLoggedIn', 'true');
                window.location.href = 'index.html';
            } else {
                errorMessage.textContent = '密码错误，请重试！';
            }
        });
    }
}

function handleIndexPage() {
    const postList = document.getElementById('post-list');
    if (postList) {
        const posts = getPosts();
        if (posts.length === 0) {
            postList.innerHTML = '<p>还没有文章，快去发布一篇吧！</p>';
            return;
        }
        postList.innerHTML = '';
        posts.slice().reverse().forEach(post => {
            const listItem = document.createElement('li');
            const link = document.createElement('a');
            link.href = `view-post.html?id=${post.id}`;
            link.innerHTML = `<h3>${post.title}</h3><p>发布于：${new Date(post.timestamp).toLocaleString()}</p>`;
            listItem.appendChild(link);
            postList.appendChild(listItem);
        });
    }
}

function handleNewPostPage() {
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

function handleViewPostPage() {
    const params = new URLSearchParams(window.location.search);
    const postId = params.get('id');
    const post = getPostById(postId);
    if (post) {
        document.title = post.title;
        document.getElementById('dynamic-header-title').textContent = post.title;
        document.getElementById('post-content-container').innerHTML = post.content;
        const downloadButton = document.getElementById('download-pdf-btn');
        if (downloadButton) {
            downloadButton.addEventListener('click', generatePdf);
        }
    } else {
        document.getElementById('post-content-container').innerHTML = '<h2>未找到文章</h2><p>无法找到指定的文章，请返回首页。</p>';
    }
}

// --- 数据处理函数 (LocalStorage) ---
function getPosts() { return JSON.parse(localStorage.getItem('blogPosts') || '[]'); }
function getPostById(id) { return getPosts().find(post => post.id.toString() === id); }
function savePost(postData) {
    const posts = getPosts();
    posts.push({ id: Date.now(), timestamp: Date.now(), ...postData });
    localStorage.setItem('blogPosts', JSON.stringify(posts));
}

// --- PDF 生成函数 ---
function generatePdf() {
    const element = document.getElementById('pdf-content');
    const postTitle = document.getElementById('dynamic-header-title').textContent;
    const fileName = `${postTitle}.pdf`;
    const opt = {
        margin: [15, 10, 15, 10], filename: fileName,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
    };
    html2pdf().from(element).set(opt).save();
}
