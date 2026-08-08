// js/modules/weeklyBoard.js
import { generateWeeklyPlanner, generateDailyPlanner } from '../api/gemini.js';
// 不再需要在看板中引入 fetchDishImage
import { getPantryList } from './pantry.js';
import { openRecipeDrawer } from './recipeDrawer.js';
import { isFavorite, toggleFavorite } from './favorites.js';

let currentWeeklyPlan = JSON.parse(localStorage.getItem('soussnap_current_plan') || 'null');

export function initWeeklyBoardModule() {
    setupBoardControls();
    
    // 初始化时恢复上次的菜单和模式
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

            // 动态切换标题
            const titleEl = document.querySelector('#tab-planner .section-header h2');
            if (titleEl) {
                titleEl.innerHTML = mode === 'daily' ? '☀️ 今日三餐规划' : '📅 本周三餐规划';
            }

            await renderWeeklyBoard(currentWeeklyPlan);
        }
    } catch (err) {
        alert(`生成菜单失败: ${err.message}`);
    } finally {
        if (loadingState) loadingState.classList.add('hidden');
    }
}

export async function renderWeeklyBoard(planArray) {
    const boardContainer = document.getElementById('weeklyBoard');
    if (!boardContainer) return;

    boardContainer.innerHTML = '';

    for (const dayData of planArray) {
        const col = document.createElement('div');
        col.className = 'board-column';
        col.innerHTML = `<div class="column-header"><span>${dayData.day}</span></div>`;

        const mealTypes = [
            { key: 'breakfast', label: '🍳 早餐' },
            { key: 'lunch', label: '🍱 午餐' },
            { key: 'dinner', label: '🍲 晚餐' }
        ];

        for (const type of mealTypes) {
            const block = document.createElement('div');
            block.className = 'meal-block';
            block.innerHTML = `<div class="meal-label">${type.label}</div>`;

            const dishes = dayData[type.key] || [];
            for (const dish of dishes) {
                const dishCard = document.createElement('div');
                dishCard.className = 'dish-card-mini';

                const hasFav = isFavorite(dish.dish_name);

                // 🔥 核心改动：看板中不再渲染图片，只展示菜名和红心按钮，秒开无延迟
                dishCard.innerHTML = `
                    <div style="display: flex; justify-content: space-between; align-items: center; width: 100%; padding: 4px 0;">
                        <span class="dish-title-mini" style="flex: 1; font-weight: 500;">${dish.dish_name}</span>
                        <button class="fav-heart-btn ${hasFav ? 'active' : ''}" style="background: none; border: none; cursor: pointer; font-size: 16px; padding: 2px 6px;">
                            ${hasFav ? '❤️' : '🤍'}
                        </button>
                    </div>
                `;

                // 点击爱心切换金榜状态
                const heartBtn = dishCard.querySelector('.fav-heart-btn');
                heartBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const isNowFav = toggleFavorite(dish);
                    heartBtn.innerHTML = isNowFav ? '❤️' : '🤍';
                    heartBtn.classList.toggle('active', isNowFav);
                });

                // 点击卡片打开详情抽屉
                dishCard.addEventListener('click', () => openRecipeDrawer(dish));

                block.appendChild(dishCard);
            }
            col.appendChild(block);
        }
        boardContainer.appendChild(col);
    }
}
