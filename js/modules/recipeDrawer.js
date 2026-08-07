// js/modules/recipeDrawer.js
import { refineSingleDish } from '../api/gemini.js';

let activeDish = null;

export function openRecipeDrawer(dish) {
    activeDish = dish;
    const drawer = document.getElementById('recipe-drawer');
    if (!drawer) return;

    renderDrawerContent(dish);
    drawer.classList.add('open');
}

export function closeRecipeDrawer() {
    const drawer = document.getElementById('recipe-drawer');
    if (drawer) drawer.classList.remove('open');
}

function renderDrawerContent(dish) {
    document.getElementById('drawer-dish-title').innerText = dish.dish_name || '菜谱详情';
    
    const ingredientsContainer = document.getElementById('drawer-ingredients');
    if (ingredientsContainer) {
        const list = dish.ingredients || [];
        ingredientsContainer.innerHTML = list.map(i => `<li>${i}</li>`).join('');
    }

    const stepsContainer = document.getElementById('drawer-steps');
    if (stepsContainer) {
        stepsContainer.innerText = dish.steps || '暂无详细步骤';
    }
}

export function initRecipeDrawerEvents() {
    const closeBtn = document.getElementById('close-drawer-btn');
    if (closeBtn) closeBtn.addEventListener('click', closeRecipeDrawer);

    const refineBtn = document.getElementById('refine-dish-btn');
    const refineInput = document.getElementById('refine-input');

    if (refineBtn && refineInput) {
        refineBtn.addEventListener('click', async () => {
            const feedback = refineInput.value.trim();
            if (!feedback) return alert('请输入改进调整意向（如：想换成少油做法，或替换为鸡胸肉）');

            refineBtn.disabled = true;
            refineBtn.innerText = '大厨调整中...';

            try {
                const newDish = await refineSingleDish(activeDish, feedback);
                activeDish = newDish;
                renderDrawerContent(newDish);
                refineInput.value = '';
                alert('菜谱调整成功！');
            } catch (err) {
                alert(`调整失败: ${err.message}`);
            } finally {
                refineBtn.disabled = false;
                refineBtn.innerText = '💡 大厨指导微调';
            }
        });
    }
}
