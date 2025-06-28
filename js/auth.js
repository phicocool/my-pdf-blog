// 这个脚本必须在每个受保护页面的 <head> 或 <body> 顶部被引入
// 它的作用是在页面内容加载之前检查登录状态，如果未登录则立即跳转
(function() {
    // sessionStorage在标签页关闭后会自动清除，比localStorage更适合做登录状态判断
    const isLoggedIn = sessionStorage.getItem('isLoggedIn');

    // 如果当前页面不是登录页，并且用户未登录
    if (window.location.pathname.indexOf('login.html') === -1 && isLoggedIn !== 'true') {
        // 跳转到登录页
        window.location.href = 'login.html';
    }
})();