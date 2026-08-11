// js/modules/favorites.js
import { openRecipeDrawer } from './recipeDrawer.js';

const FAVORITES_KEY = 'soussnap_favorites';

export function getFavoritesList() {
    return JSON.parse(localStorage.getItem(FAVORITES_KEY) || '[]');
}

export function isFavorite(dishName) {
    const list = getFavoritesList();
    return list.some(item => item.dish_name === dishName);
}

export function toggleFavorite(dish) {
    let list = getFavoritesList();
    const index = list.findIndex(item => item.dish_name === dish.dish_name);

    if (index >= 0) {
        list.splice(index, 1);
    } else {
        list.push(dish);
    }

    localStorage.setItem(FAVORITES_KEY, JSON.stringify(list));
    renderFavoritesUI();
    return index < 0;
}

export function renderFavoritesUI() {
    const container = document.getElementById('favoriteList'); // 对应你 index.html 中的 ID
    if (!container) return;

    const list = getFavoritesList();
    if (list.length === 0) {
        container.innerHTML = `<div class="empty-tip" style="color: #888; text-align: center; padding: 24px; font-size: 14px;">暂无收藏的菜品，点击菜品上的 ❤️ 即可加入“我的最爱”！</div>`;
        return;
    }

    // 自动按早、午、晚餐分类聚合
    const categorized = {
        '🍳 早餐': [],
        '🍱 午餐': [],
        '🍲 晚餐': [],
        '🍽️ 其他': []
    };

    list.forEach(dish => {
        // 根据 dish 自带的 mealTag 或名称简单归类，如果没有默认归入其他或午/晚餐
        const meal = dish.mealType || '其他';
        if (meal.includes('早') || meal === 'breakfast') {
            categorized['🍳 早餐'].push(dish);
        } else if (meal.includes('午') || meal === 'lunch') {
            categorized['🍱 午餐'].push(dish);
        } else if (meal.includes('晚') || meal === 'dinner') {
            categorized['🍲 晚餐'].push(dish);
        } else {
            // 如果没带标签，默认平均分配或归入“我的最爱”主分类，这里优雅地按三餐通用/综合展示
            categorized['🍽️ 其他'].push(dish);
        }
    });

    let html = '';
    for (const [categoryName, dishes] of Object.entries(categorized)) {
        if (dishes.length === 0) continue;

        html += `
            <div class="fav-category-group" style="margin-bottom: 16px;">
                <div style="font-size: 14px; font-weight: 600; color: #555; margin-bottom: 8px; padding-left: 4px;">${categoryName}</div>
                <div style="display: flex; flex-direction: column; gap: 6px;">
        `;

        dishes.forEach(dish => {
            html += `
                <div class="favorite-item-row" data-name="${dish.dish_name}" style="display: flex; justify-content: space-between; align-items: center; background: #fafafa; padding: 10px 14px; border-radius: 8px; cursor: pointer; border: 1px solid #eee; transition: background 0.2s;">
                    <span style="font-size: 15px; font-weight: 500; color: #333;">${dish.dish_name}</span>
                    <button class="remove-fav-inline" data-name="${dish.dish_name}" style="background: none; border: none; cursor: pointer; font-size: 16px; padding: 4px;" title="移出最爱">❤️</button>
                </div>
            `;
        });

        html += `</div></div>`;
    }

    container.innerHTML = html;

    // 绑定点击整行打开抽屉事件
    container.querySelectorAll('.favorite-item-row').forEach(row => {
        row.addEventListener('click', (e) => {
            // 如果点的是爱心按钮，不触发打开抽屉
            if (e.target.classList.contains('remove-fav-inline')) return;
            const name = row.dataset.name;
            const dish = list.find(d => d.dish_name === name);
            if (dish) openRecipeDrawer(dish);
        });
    });

    // 绑定点击爱心取消收藏事件
    container.querySelectorAll('.remove-fav-inline').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const name = e.target.dataset.name;
            const dish = list.find(d => d.dish_name === name);
            if (dish) toggleFavorite(dish);
        });
    });
}
