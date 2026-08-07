// js/modules/weeklyBoard.js
import { generateWeeklyPlanner, generateDailyPlanner } from '../api/gemini.js';
import { fetchDishImage } from '../api/imageSearch.js';
import { getPantryList } from './pantry.js';
import { openRecipeDrawer } from './recipeDrawer.js';
import { isFavorite, toggleFavorite } from './favorites.js';

let currentWeeklyPlan = JSON.parse(localStorage.getItem('soussnap_current_plan') || 'null');

export function initWeeklyBoardModule() {
    setupBoardControls();
    if (currentWeeklyPlan) {
        renderWeeklyBoard(currentWeeklyPlan);
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

                const imageUrl = await fetchDishImage(dish.image_search_kw, dish.dish_name);
                const hasFav = isFavorite(dish.dish_name);

                dishCard.innerHTML = `
                    <div class="image-wrapper" style="position: relative;">
                        <img src="${imageUrl}" class="dish-thumb-mini" alt="${dish.dish_name}" loading="lazy" />
                        <button class="fav-heart-btn ${hasFav ? 'active' : ''}" style="position: absolute; top: 6px; right: 6px; background: rgba(0,0,0,0.5); border: none; border-radius: 50%; width: 28px; height: 28px; cursor: pointer; color: white; font-size: 14px; display: flex; align-items: center; justify-content: center;">
                            ${hasFav ? '❤️' : '🤍'}
                        </button>
                    </div>
                    <div class="dish-title-mini">${dish.dish_name}</div>
                `;

                // 点击爱心切换金榜状态（阻止冒泡以免触发打开菜谱）
                const heartBtn = dishCard.querySelector('.fav-heart-btn');
                heartBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const isNowFav = toggleFavorite(dish);
                    heartBtn.innerHTML = isNowFav ? '❤️' : '🤍';
                    heartBtn.classList.toggle('active', isNowFav);
                });

                // 点击卡片其它区域打开详情
                dishCard.addEventListener('click', () => openRecipeDrawer(dish));

                block.appendChild(dishCard);
            }
            col.appendChild(block);
        }
        boardContainer.appendChild(col);
    }
}
