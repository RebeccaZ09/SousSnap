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
