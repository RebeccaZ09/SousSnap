// js/modules/favorites.js
import { openRecipeDrawer } from './recipeDrawer.js';

const FAVORITES_KEY = 'soussnap_favorites';

export function initFavoritesModule() {
    renderFavoritesUI();
    setupFavoritesEvents();
}

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
    const container = document.getElementById('favoriteList');
    if (!container) return;

    const list = getFavoritesList();
    
    // 顶部操作栏 (去掉了拍照，只保留手动输入按钮)
    let topActionHtml = `
        <div style="margin-bottom: 16px; display: flex;">
            <button id="btnAddFavorite" class="btn-primary" style="flex: 1; font-size: 13px; padding: 10px; border-radius: var(--radius-md, 12px); background: var(--primary-color, #7D8F74); color: white; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 6px;">
                <span>➕ 手动输入菜名加入最爱</span>
            </button>
        </div>
    `;

    if (list.length === 0) {
        container.innerHTML = topActionHtml + `
            <div class="empty-tip" style="color: var(--text-secondary, #8C857E); text-align: center; padding: 30px; font-size: 13px; background: #FFFFFF; border-radius: var(--radius-lg, 16px); border: 1px solid var(--border-color, #E8E4DD);">
                🌱 暂无收藏的菜品，快去添加第一道拿手菜吧！
            </div>
        `;
        setupFavoritesEvents();
        return;
    }

    // 按早、午、晚餐分类聚合
    const categorized = {
        '🍳 早餐': [],
        '🍱 午餐': [],
        '🍲 晚餐': [],
        '🍽️ 其他': []
    };

    list.forEach(dish => {
        const meal = dish.mealType || '';
        if (meal.includes('早') || meal === 'breakfast') {
            categorized['🍳 早餐'].push(dish);
        } else if (meal.includes('午') || meal === 'lunch') {
            categorized['🍱 午餐'].push(dish);
        } else if (meal.includes('晚') || meal === 'dinner') {
            categorized['🍲 晚餐'].push(dish);
        } else {
            categorized['🍽️ 其他'].push(dish);
        }
    });

    let html = topActionHtml;
    for (const [categoryName, dishes] of Object.entries(categorized)) {
        if (dishes.length === 0) continue;

        html += `
            <div class="fav-category-group" style="margin-bottom: 16px;">
                <div style="font-size: 13px; font-weight: 600; color: var(--text-secondary, #8C857E); margin-bottom: 8px; padding-left: 4px;">${categoryName}</div>
                <div style="display: flex; flex-direction: column; gap: 8px;">
        `;

        dishes.forEach(dish => {
            let label = '其他';
            const rawMeal = dish.mealType || '';
            
            if (rawMeal.includes('早') || rawMeal === 'breakfast') label = '早餐';
            else if (rawMeal.includes('午') || rawMeal === 'lunch') label = '午餐';
            else if (rawMeal.includes('晚') || rawMeal === 'dinner') label = '晚餐';

            // 把之前的 span 改成了 select 下拉菜单
            html += `
                <div class="favorite-item-row" data-name="${dish.dish_name}" style="display: flex; justify-content: space-between; align-items: center; background: #FFFFFF; padding: 12px 16px; border-radius: var(--radius-md, 12px); cursor: pointer; border: 1px solid var(--border-color, #E8E4DD); box-shadow: 0 2px 8px rgba(125, 115, 105, 0.03); transition: all 0.2s;">
                    <div style="display: flex; align-items: center; gap: 8px; flex: 1; padding-right: 8px;">
                        <select class="meal-type-select" data-name="${dish.dish_name}" style="font-size: 12px; background: #F5F3F0; padding: 4px 6px; border-radius: 6px; color: var(--text-secondary, #8C857E); border: 1px solid #E8E4DD; outline: none; cursor: pointer;">
                            <option value="早餐" ${label === '早餐' ? 'selected' : ''}>🍳 早餐</option>
                            <option value="午餐" ${label === '午餐' ? 'selected' : ''}>🍱 午餐</option>
                            <option value="晚餐" ${label === '晚餐' ? 'selected' : ''}>🍲 晚餐</option>
                            <option value="其他" ${label === '其他' ? 'selected' : ''}>🍽️ 其他</option>
                        </select>
                        <span style="font-size: 14px; font-weight: 500; color: var(--text-main, #4A4543);">${dish.dish_name}</span>
                    </div>
                    <button class="remove-fav-inline" data-name="${dish.dish_name}" style="background: none; border: none; cursor: pointer; font-size: 15px; padding: 4px;" title="移出最爱">🗑️</button>
                </div>
            `;
        });

        html += `</div></div>`;
    }

    container.innerHTML = html;
    setupFavoritesEvents();
}

function setupFavoritesEvents() {
    const container = document.getElementById('favoriteList');
    if (!container) return;

    const addBtn = document.getElementById('btnAddFavorite');

    // 1. 绑定添加按钮点击事件 (仅支持手动输入)
    if (addBtn && !addBtn.dataset.bound) {
        addBtn.dataset.bound = "true";
        addBtn.addEventListener('click', () => {
            const dishName = prompt("请输入你想加入最爱的菜名：");
            if (dishName && dishName.trim()) {
                const newDish = {
                    dish_name: dishName.trim(),
                    mealType: '其他', // 添加时默认放到“其他”，用户可以用左侧下拉菜单快速修改
                    ingredients: [],
                    steps: '手动添加的菜品，暂无详细步骤。',
                    addedAt: new Date().toISOString()
                };
                let list = getFavoritesList();
                if (!list.some(d => d.dish_name === newDish.dish_name)) {
                    list.push(newDish);
                    localStorage.setItem(FAVORITES_KEY, JSON.stringify(list));
                    renderFavoritesUI();
                } else {
                    alert('这道菜已经在你的最爱里啦！');
                }
            }
        });
    }

    // 2. 绑定下拉菜单切换事件 (修改老菜品的餐次)
    container.querySelectorAll('.meal-type-select').forEach(select => {
        if (select.dataset.bound) return;
        select.dataset.bound = "true";

        select.addEventListener('change', (e) => {
            const name = e.target.dataset.name;
            const newMealType = e.target.value;
            let list = getFavoritesList();
            const dishIndex = list.findIndex(d => d.dish_name === name);
            
            if (dishIndex !== -1) {
                list[dishIndex].mealType = newMealType;
                localStorage.setItem(FAVORITES_KEY, JSON.stringify(list));
                renderFavoritesUI(); // 重新渲染，菜品会自动移动到新分类下
            }
        });
    });

    // 3. 绑定点击整行打开抽屉事件
    container.querySelectorAll('.favorite-item-row').forEach(row => {
        if (row.dataset.bound) return;
        row.dataset.bound = "true";

        row.addEventListener('click', (e) => {
            // 防止点击下拉菜单或删除按钮时触发打开菜谱抽屉
            if (e.target.classList.contains('remove-fav-inline')) return;
            if (e.target.tagName.toLowerCase() === 'select' || e.target.tagName.toLowerCase() === 'option') return;
            
            const name = row.dataset.name;
            const list = getFavoritesList();
            const dish = list.find(d => d.dish_name === name);
            if (dish) openRecipeDrawer(dish);
        });
    });

    // 4. 绑定点击垃圾桶删除收藏事件
    container.querySelectorAll('.remove-fav-inline').forEach(btn => {
        if (btn.dataset.bound) return;
        btn.dataset.bound = "true";

        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const name = e.target.dataset.name;
            const list = getFavoritesList();
            const dish = list.find(d => d.dish_name === name);
            if (dish) toggleFavorite(dish);
        });
    });
}
