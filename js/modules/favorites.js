// js/modules/favorites.js

const FAVORITES_KEY = 'soussnap_favorites';

// 获取必吃金榜列表
export function getFavoritesList() {
    return JSON.parse(localStorage.getItem(FAVORITES_KEY) || '[]');
}

// 判断某道菜是否在必吃金榜中
export function isFavorite(dishName) {
    const list = getFavoritesList();
    return list.some(item => item.dish_name === dishName);
}

// 切换爱心收藏状态 (加金榜 / 取消金榜)
export function toggleFavorite(dish) {
    let list = getFavoritesList();
    const index = list.findIndex(item => item.dish_name === dish.dish_name);

    if (index >= 0) {
        list.splice(index, 1); // 存在则移除
    } else {
        list.push(dish); // 不存在则添加
    }

    localStorage.setItem(FAVORITES_KEY, JSON.stringify(list));
    renderFavoritesUI(); // 重新渲染“必吃金榜”Tab 列表
    return index < 0; // 返回 true 表示已收藏，false 表示取消收藏
}

// 渲染“必吃金榜”Tab 页面的菜品列表
export function renderFavoritesUI() {
    const container = document.getElementById('favorites-grid');
    if (!container) return;

    const list = getFavoritesList();
    if (list.length === 0) {
        container.innerHTML = `<div class="empty-tip">暂无收藏的菜品，点击菜品卡片上的 ❤️ 即可加入必吃金榜！</div>`;
        return;
    }

    container.innerHTML = list.map(dish => `
        <div class="favorite-card">
            <div class="favorite-title">🏆 ${dish.dish_name}</div>
            <div class="favorite-tags">
                ${(dish.ingredients || []).map(i => `<span class="ing-tag">${i}</span>`).join('')}
            </div>
            <button class="remove-fav-btn" data-name="${dish.dish_name}">取消收藏</button>
        </div>
    `).join('');

    // 绑定取消收藏事件
    container.querySelectorAll('.remove-fav-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const name = e.target.dataset.name;
            const item = list.find(d => d.dish_name === name);
            if (item) {
                toggleFavorite(item);
            }
        });
    });
}
