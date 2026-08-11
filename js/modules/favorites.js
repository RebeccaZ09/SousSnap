// js/modules/favorites.js
import { openRecipeDrawer } from './recipeDrawer.js';
import { scanImageForRecipe } from '../api/gemini.js'; // 假设你的 API 里有这个方法，或者用来解析菜谱

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
    const container = document.getElementById('favoriteList'); // 对应你 index.html 中的 ID
    if (!container) return;

    const list = getFavoritesList();
    
    // 我们在渲染列表的最上方注入一个“添加菜品”的操作栏
    let topActionHtml = `
        <div style="margin-bottom: 16px; display: flex; gap: 8px;">
            <button id="btnAddFavorite" class="btn-primary" style="flex: 1; font-size: 13px; padding: 10px; border-radius: var(--radius-md, 12px); background: var(--primary-color, #7D8F74); color: white; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 6px;">
                <span>❤️ 手动输入或拍照加入最爱</span>
            </button>
            <input type="file" id="favImageInput" accept="image/*" capture="environment" style="display: none;">
        </div>
    `;

    if (list.length === 0) {
        container.innerHTML = topActionHtml + `
            <div class="empty-tip" style="color: var(--text-secondary, #8C857E); text-align: center; padding: 30px; font-size: 13px; background: #FFFFFF; border-radius: var(--radius-lg, 16px); border: 1px solid var(--border-color, #E8E4DD);">
                🌱 暂无收藏的菜品，快去添加第一道拿手菜吧！
            </div>
        `;
        setupFavoritesEvents(); // 重新绑定事件
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
        const meal = dish.mealType || '其他';
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
            html += `
                <div class="favorite-item-row" data-name="${dish.dish_name}" style="display: flex; justify-content: space-between; align-items: center; background: #FFFFFF; padding: 12px 16px; border-radius: var(--radius-md, 12px); cursor: pointer; border: 1px solid var(--border-color, #E8E4DD); box-shadow: 0 2px 8px rgba(125, 115, 105, 0.03); transition: all 0.2s;">
                    <span style="font-size: 14px; font-weight: 500; color: var(--text-main, #4A4543);">${dish.dish_name}</span>
                    <button class="remove-fav-inline" data-name="${dish.dish_name}" style="background: none; border: none; cursor: pointer; font-size: 16px; padding: 4px;" title="移出最爱">❤️</button>
                </div>
            `;
        });

        html += `</div></div>`;
    }

    container.innerHTML = html;
    setupFavoritesEvents(); // 重新绑定所有交互事件
}

function setupFavoritesEvents() {
    const container = document.getElementById('favoriteList');
    if (!container) return;

    const addBtn = document.getElementById('btnAddFavorite');
    const fileInput = document.getElementById('favImageInput');

    // 1. 绑定添加按钮点击事件
    if (addBtn && fileInput && !addBtn.dataset.bound) {
        addBtn.dataset.bound = "true"; // 防止重复绑定
        addBtn.addEventListener('click', () => {
            const choice = prompt("请选择添加方式：\n1. 输入“1”：手动输入菜名\n2. 输入“2”：拍照或上传菜谱图片识别");
            
            if (choice === '1') {
                const dishName = prompt("请输入你想加入最爱的菜名：");
                if (dishName && dishName.trim()) {
                    const newDish = {
                        dish_name: dishName.trim(),
                        mealType: '其他',
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
            } else if (choice === '2') {
                fileInput.click(); // 唤起手机拍照或相册
            }
        });

        // 2. 绑定拍照/传图识别事件
        fileInput.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;

            addBtn.disabled = true;
            addBtn.innerHTML = '<span>✨ 正在解读菜谱中...</span>';

            try {
                const base64 = await fileToBase64(file);
                // 调用 Gemini 识别菜谱（返回包含菜名、食材、步骤的对象）
                const result = await scanImageForRecipe(base64); 

                if (result && (result.dish_name || result.name)) {
                    const dishName = result.dish_name || result.name;
                    const newDish = {
                        dish_name: dishName,
                        mealType: result.mealType || '其他',
                        ingredients: result.ingredients || [],
                        steps: result.steps || '通过图片识别添加。',
                        addedAt: new Date().toISOString()
                    };

                    let list = getFavoritesList();
                    if (!list.some(d => d.dish_name === dishName)) {
                        list.push(newDish);
                        localStorage.setItem(FAVORITES_KEY, JSON.stringify(list));
                        renderFavoritesUI();
                        alert(`成功将 "${dishName}" 加入最爱！`);
                    } else {
                        alert('这道菜已经在你的最爱里啦！');
                    }
                }
            } catch (err) {
                alert(`识别失败: ${err.message}`);
            } finally {
                addBtn.disabled = false;
                addBtn.innerHTML = '<span>❤️ 手动输入或拍照加入最爱</span>';
                fileInput.value = '';
            }
        });
    }

    // 3. 绑定点击整行打开抽屉事件
    container.querySelectorAll('.favorite-item-row').forEach(row => {
        // 避免重复绑定
        if (row.dataset.bound) return;
        row.dataset.bound = "true";

        row.addEventListener('click', (e) => {
            if (e.target.classList.contains('remove-fav-inline')) return;
            const name = row.dataset.name;
            const list = getFavoritesList();
            const dish = list.find(d => d.dish_name === name);
            if (dish) openRecipeDrawer(dish);
        });
    });

    // 4. 绑定点击红心取消收藏事件
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

function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result.split(',')[1]);
        reader.onerror = error => reject(error);
    });
}
