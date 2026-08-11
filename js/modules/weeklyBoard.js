// js/modules/weeklyBoard.js
import { generateWeeklyPlanner, generateDailyPlanner } from '../api/gemini.js';
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

    // 适配单日或周视图的容器样式
    if (currentMode === 'daily') {
        boardContainer.style.gridTemplateColumns = '1fr';
    } else {
        boardContainer.style.gridTemplateColumns = '';
    }

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
                const hasFav = isFavorite(dish.dish_name);

                // 统一采用清爽的文字行，单日模式下可以稍微宽敞一些
                dishCard.className = 'dish-card-item';
                dishCard.style.cssText = `
                    display: flex; 
                    justify-content: space-between; 
                    align-items: center; 
                    background: #fff; 
                    padding: ${currentMode === 'daily' ? '12px 16px' : '10px 8px'}; 
                    margin-bottom: 8px; 
                    border-radius: 8px; 
                    box-shadow: 0 1px 3px rgba(0,0,0,0.02);
                    cursor: pointer; 
                    transition: background 0.2s;
                `;

                dishCard.innerHTML = `
                    <div>
                        <div style="font-weight: 500; font-size: 15px; color: #333;">${dish.dish_name}</div>
                        ${currentMode === 'daily' && dish.ingredients ? `<div style="font-size: 12px; color: #888; margin-top: 2px;">主料: ${dish.ingredients.slice(0, 3).join(', ')}</div>` : ''}
                    </div>
                    <button class="fav-heart-btn ${hasFav ? 'active' : ''}" style="background: none; border: none; cursor: pointer; font-size: 18px; padding: 4px;">
                        ${hasFav ? '❤️' : '🤍'}
                    </button>
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
