// js/modules/weeklyBoard.js
import { generateWeeklyPlanner, generateDailyPlanner, generateSingleReplacementDish } from '../api/gemini.js';
import { getPantryList } from './pantry.js';
import { openRecipeDrawer } from './recipeDrawer.js';
import { isFavorite, toggleFavorite } from './favorites.js';

let currentWeeklyPlan = JSON.parse(localStorage.getItem('soussnap_current_plan') || 'null');

export function initWeeklyBoardModule() {
    setupBoardControls();
    
    const savedPlan = localStorage.getItem('soussnap_current_plan');
    const savedMode = localStorage.getItem('soussnap_plan_mode') || 'weekly';

    if (savedPlan) {
        try {
            currentWeeklyPlan = JSON.parse(savedPlan);
            renderWeeklyBoard(currentWeeklyPlan);
            
            if (savedMode === 'daily') {
                const titleEl = document.querySelector('#tab-planner .section-header h2');
                if (titleEl) titleEl.innerHTML = '☀️ 今日三餐规划';
            }
        } catch (e) {
            console.error("解析缓存菜单失败:", e);
        }
    }
}

function setupBoardControls() {
    const btnWeekly = document.getElementById('btnGenerateWeekly');
    const btnDaily = document.getElementById('btnGenerateDaily');

    if (btnWeekly) {
        btnWeekly.addEventListener('click', () => handleGenerate('weekly'));
    }
    if (btnDaily) {
        btnDaily.addEventListener('click', () => handleGenerate('daily'));
    }
}

async function handleGenerate(mode = 'weekly') {
    const loadingState = document.getElementById('loadingState');
    if (loadingState) loadingState.classList.remove('hidden');

    try {
        const pantry = getPantryList();
        const planData = mode === 'daily' 
            ? await generateDailyPlanner(pantry) 
            : await generateWeeklyPlanner(pantry);

        if (planData && planData.weeklyPlan) {
            currentWeeklyPlan = planData.weeklyPlan;
            localStorage.setItem('soussnap_current_plan', JSON.stringify(currentWeeklyPlan));
            localStorage.setItem('soussnap_plan_mode', mode);

            const titleEl = document.querySelector('#tab-planner .section-header h2');
            if (titleEl) {
                titleEl.innerHTML = mode === 'daily' ? '☀️ 今日三餐规划' : '📅 本周三餐规划';
            }

            renderWeeklyBoard(currentWeeklyPlan);
        }
    } catch (err) {
        alert(`生成菜单失败: ${err.message}`);
    } finally {
        if (loadingState) loadingState.classList.add('hidden');
    }
}

export function renderWeeklyBoard(planArray) {
    const boardContainer = document.getElementById('weeklyBoard');
    if (!boardContainer) return;

    boardContainer.innerHTML = '';
    const currentMode = localStorage.getItem('soussnap_plan_mode') || 'weekly';

    if (currentMode === 'daily') {
        boardContainer.classList.add('daily-full-mode');
        boardContainer.style.gridTemplateColumns = '1fr';
    } else {
        boardContainer.classList.remove('daily-full-mode');
        boardContainer.style.gridTemplateColumns = '';
    }

    // 遍历星期（dayIndex）
    planArray.forEach((dayData, dayIndex) => {
        const col = document.createElement('div');
        col.className = 'board-column';
        col.innerHTML = `<div class="column-header"><span>${dayData.day}</span></div>`;

        const mealTypes = [
            { key: 'breakfast', label: '🍳 早餐' },
            { key: 'lunch', label: '🍱 午餐' },
            { key: 'dinner', label: '🍲 晚餐' }
        ];

        mealTypes.forEach(type => {
            const block = document.createElement('div');
            block.className = 'meal-block';
            block.innerHTML = `<div class="meal-label">${type.label}</div>`;

            const dishes = dayData[type.key] || [];
            dishes.forEach((dish, dishIndex) => {
                const dishCard = document.createElement('div');
                const hasFav = isFavorite(dish.dish_name);

                dishCard.className = 'dish-card-item';
                dishCard.style.cssText = `
                    display: flex; 
                    justify-content: space-between; 
                    align-items: center; 
                    width: 100%;
                    background: #fff; 
                    padding: ${currentMode === 'daily' ? '14px 20px' : '10px 8px'}; 
                    margin-bottom: 8px; 
                    border-radius: 8px; 
                    box-shadow: 0 1px 3px rgba(0,0,0,0.02);
                    cursor: pointer; 
                    transition: background 0.2s;
                `;

                dishCard.innerHTML = `
                    <div style="flex: 1; padding-right: 8px;">
                        <div style="font-weight: 600; font-size: ${currentMode === 'daily' ? '16px' : '15px'}; color: var(--text-main, #333);">${dish.dish_name}</div>
                        ${currentMode === 'daily' && dish.ingredients ? `<div style="font-size: 13px; color: var(--text-secondary, #775555); margin-top: 3px;">主料: ${dish.ingredients.slice(0, 4).join(', ')}</div>` : ''}
                    </div>
                    <div style="display: flex; align-items: center; gap: 2px; flex-shrink: 0;">
                        <!-- 换菜按钮 -->
                        <button class="replace-dish-btn" title="换个新菜" style="background: none; border: none; cursor: pointer; font-size: 16px; padding: 6px; transition: transform 0.3s;">
                            🔄
                        </button>
                        <!-- 收藏红心按钮 -->
                        <button class="fav-heart-btn ${hasFav ? 'active' : ''}" style="background: none; border: none; cursor: pointer; font-size: 20px; padding: 6px;">
                            ${hasFav ? '❤️' : '🤍'}
                        </button>
                    </div>
                `;

                // 1. 点击换菜按钮逻辑
                const replaceBtn = dishCard.querySelector('.replace-dish-btn');
                replaceBtn.addEventListener('click', async (e) => {
                    e.stopPropagation();
                    replaceBtn.style.transform = 'rotate(180deg)';
                    replaceBtn.disabled = true;

                    try {
                        const newDish = await generateSingleReplacementDish(type.key, dish.dish_name);
                        if (newDish && newDish.dish_name) {
                            // 更新内存中的对应数据
                            currentWeeklyPlan[dayIndex][type.key][dishIndex] = newDish;
                            // 同步回 localStorage
                            localStorage.setItem('soussnap_current_plan', JSON.stringify(currentWeeklyPlan));
                            // 重新渲染看板
                            renderWeeklyBoard(currentWeeklyPlan);
                        }
                    } catch (err) {
                        alert(`换菜失败: ${err.message}`);
                        replaceBtn.style.transform = 'rotate(0deg)';
                        replaceBtn.disabled = false;
                    }
                });

                // 2. 点击爱心切换收藏状态
                const heartBtn = dishCard.querySelector('.fav-heart-btn');
                heartBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const isNowFav = toggleFavorite(dish);
                    heartBtn.innerHTML = isNowFav ? '❤️' : '🤍';
                    heartBtn.classList.toggle('active', isNowFav);
                });

                // 3. 点击卡片打开详情抽屉
                dishCard.addEventListener('click', () => openRecipeDrawer(dish));

                block.appendChild(dishCard);
            });
            col.appendChild(block);
        });
        boardContainer.appendChild(col);
    });
}
