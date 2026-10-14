// js/modules/recipeDrawer.js
import { refineSingleDish } from '../api/gemini.js';
import { isFavorite, toggleFavorite } from './favorites.js';

let activeDish = null;

export function openRecipeDrawer(dish) {
    activeDish = dish;
    const drawer = document.getElementById('recipeDrawer');
    if (!drawer) return;

    renderDrawerContent(dish);
    drawer.classList.add('active');
}

export function closeRecipeDrawer() {
    const drawer = document.getElementById('recipeDrawer');
    if (drawer) drawer.classList.remove('active');
}

function renderDrawerContent(dish) {
    // 1. 渲染标题
    const titleEl = document.getElementById('drawerTitle');
    if (titleEl) titleEl.innerText = dish.dish_name || '菜谱详情';

    // 2. 渲染收藏按钮状态
    const favBtn = document.getElementById('drawerFavBtn');
    if (favBtn) {
        const hasFav = isFavorite(dish.dish_name);
        favBtn.innerHTML = hasFav ? '❤️' : '🤍';
        
        // 防止重复绑定事件，先克隆或直接赋值 onclick
        favBtn.onclick = (e) => {
            e.stopPropagation();
            const isNowFav = toggleFavorite(dish);
            favBtn.innerHTML = isNowFav ? '❤️' : '🤍';
        };
    }
    
    // 3. 核心：渲染顶部的图片或“拍照上传”占位区
    const heroContainer = document.querySelector('.drawer-hero-container');
    if (heroContainer) {
        const storageKey = `soussnap_img_${dish.dish_name}`;
        const customImg = localStorage.getItem(storageKey);

        if (customImg) {
            // 如果用户上传过图片，展示实拍图并提供“更换图片”按钮
            heroContainer.innerHTML = `
                <div style="position: relative; width: 100%; border-radius: 12px; overflow: hidden;">
                    <img src="${customImg}" class="drawer-hero-img" alt="${dish.dish_name}" style="width: 100%; height: 200px; object-fit: cover; display: block;" />
                    <button id="btnChangePhoto" style="position: absolute; bottom: 10px; right: 10px; background: rgba(0,0,0,0.6); color: white; border: none; padding: 6px 12px; border-radius: 20px; font-size: 12px; cursor: pointer;">更换图片</button>
                </div>
                <input type="file" id="recipePhotoInput" accept="image/*" style="display: none;" />
            `;
        } else {
            // 如果没有上传过，显示精美的拍照/上传提示框
            heroContainer.innerHTML = `
                <div id="btnUploadPhotoPlaceholder" style="background: #f8f9fa; border: 2px dashed #ddd; border-radius: 12px; padding: 28px; text-align: center; cursor: pointer; width: 100%;">
                    <div style="font-size: 26px; margin-bottom: 4px;">📷</div>
                    <div style="font-size: 14px; color: #555; font-weight: 500;">添加我做这道菜的实拍图</div>
                    <div style="font-size: 11px; color: #999; margin-top: 2px;">记录属于你的私房菜</div>
                </div>
                <input type="file" id="recipePhotoInput" accept="image/*" style="display: none;" />
            `;
        }

        // 绑定文件选择触发逻辑
        const fileInput = document.getElementById('recipePhotoInput');
        const triggerBtn = document.getElementById('btnChangePhoto') || document.getElementById('btnUploadPhotoPlaceholder');
        
        if (triggerBtn && fileInput) {
            triggerBtn.addEventListener('click', () => fileInput.click());
            
            fileInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = (event) => {
                        const base64Str = event.target.result;
                        // 永久保存在本地 localStorage 中
                        localStorage.setItem(storageKey, base64Str);
                        // 局部刷新抽屉以立刻显示刚拍的照片
                        renderDrawerContent(dish);
                    };
                    reader.readAsDataURL(file);
                }
            });
        }
    }

    // 4. 渲染食材用量
    const ingredientsContainer = document.getElementById('drawerIngredients');
    if (ingredientsContainer) {
        const list = dish.ingredients || [];
        ingredientsContainer.innerHTML = list.map(i => `<span class="ing-tag">${i}</span>`).join('');
    }

    // 5. 渲染烹饪步骤
    const stepsContainer = document.getElementById('drawerSteps');
    if (stepsContainer) {
        stepsContainer.innerText = dish.steps || '暂无详细步骤';
    }
}

export function initRecipeDrawerEvents() {
    const closeBtn = document.getElementById('btnCloseDrawer');
    const overlay = document.getElementById('drawerOverlay');

    if (closeBtn) closeBtn.addEventListener('click', closeRecipeDrawer);
    if (overlay) overlay.addEventListener('click', closeRecipeDrawer);

    const refineBtn = document.getElementById('btnApplyAiTutor');
    const refineInput = document.getElementById('aiTutorInput');

    if (refineBtn && refineInput) {
        refineBtn.addEventListener('click', async () => {
            const feedback = refineInput.value.trim();
            if (!feedback) return alert('请输入微调想法（例如：换个不辣的做法/少油）');

            refineBtn.disabled = true;
            refineBtn.innerText = '调整中...';

            try {
                const newDish = await refineSingleDish(activeDish.dish_name, feedback);
                activeDish = newDish;
                renderDrawerContent(newDish);
                refineInput.value = '';
                alert('大厨已为你更新菜谱！');
            } catch (err) {
                alert(`调整失败: ${err.message}`);
            } finally {
                refineBtn.disabled = false;
                refineBtn.innerText = '重构';
            }
        });
    }
}
