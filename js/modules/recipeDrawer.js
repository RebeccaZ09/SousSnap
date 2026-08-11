// js/modules/recipeDrawer.js
import { refineSingleDish } from '../api/gemini.js';

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
    const titleEl = document.getElementById('drawerTitle');
    if (titleEl) titleEl.innerText = dish.dish_name || '菜谱详情';
    
    // 检查是否有本地存储的自定义图片
    const storageKey = `soussnap_img_${dish.dish_name}`;
    const customImg = localStorage.getItem(storageKey);

    // 假设你在 HTML 里有一个图片容器 #drawerImageContainer 和一个图片标签 #drawerImage 以及上传按钮 #btnUploadPhoto
    // 如果没有，你可以通过下面动态控制或在 HTML 准备好
    const heroContainer = document.getElementById('drawerHeroContainer'); // 抽屉顶部的图片/上传区域
    
    if (heroContainer) {
        heroContainer.innerHTML = `
            ${customImg ? `
                <div style="position: relative; width: 100%; border-radius: 12px; overflow: hidden; margin-bottom: 12px;">
                    <img src="${customImg}" alt="${dish.dish_name}" style="width: 100%; max-height: 220px; object-fit: cover; display: block;" />
                    <button id="btnChangePhoto" style="position: absolute; bottom: 8px; right: 8px; background: rgba(0,0,0,0.6); color: white; border: none; padding: 6px 12px; border-radius: 20px; font-size: 12px; cursor: pointer;">更换图片</button>
                </div>
            ` : `
                <div style="background: #f8f9fa; border: 2px dashed #ddd; border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 12px; cursor: pointer;" id="btnUploadPhotoPlaceholder">
                    <div style="font-size: 28px; margin-bottom: 6px;">📷</div>
                    <div style="font-size: 14px; color: #666; font-weight: 500;">添加我做这道菜的实拍图</div>
                    <div style="font-size: 12px; color: #aaa; margin-top: 2px;">记录属于你的私房菜</div>
                </div>
            `}
            <input type="file" id="recipePhotoInput" accept="image/*" style="display: none;" />
        `;

        // 绑定上传触发事件
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
                        // 永久保存在 localStorage 中
                        localStorage.setItem(storageKey, base64Str);
                        // 重新渲染抽屉以显示图片
                        renderDrawerContent(dish);
                    };
                    reader.readAsDataURL(file);
                }
            });
        }
    }

    const ingredientsContainer = document.getElementById('drawerIngredients');
    if (ingredientsContainer) {
        const list = dish.ingredients || [];
        ingredientsContainer.innerHTML = list.map(i => `<span class="ing-tag">${i}</span>`).join('');
    }

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
                const newDish = await refineSingleDish(activeDish, feedback);
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
