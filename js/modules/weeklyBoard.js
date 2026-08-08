// js/modules/weeklyBoard.js
import { generateWeeklyPlanner, generateDailyPlanner } from '../api/gemini.js';
import { fetchDishImage } from '../api/imageSearch.js'; // 需要重新引入图片获取
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
    const currentMode = localStorage.getItem('soussnap_plan_mode') || 'weekly';

    // 如果是单日模式，让看板容器适应全宽，排版更大气
    if (currentMode === 'daily') {
        boardContainer.style.gridTemplateColumns = '1fr';
    } else {
        boardContainer.style.gridTemplateColumns = '';
    }

    for (const dayData of planArray) {
        const col = document.createElement('div');
        col.className = currentMode === 'daily' ? 'board-column daily-view' : 'board-column';
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

                if (currentMode === 'daily') {
                    // 🌟 单日模式：全宽大卡片，左侧小图+菜名+食材预览，右侧红心
                    dishCard.className = 'dish-card-daily';
                    dishCard.style.cssText = 'display: flex; align-items: center; justify-content: space-between; background: #fff; padding: 12px 16px; border-radius: 12px; margin-bottom: 10px; box-shadow: 0 2px 6px rgba(0,0,0,0.04); cursor: pointer; transition: transform 0.2s;';
                    
                    dishCard.innerHTML = `
                        <div style="display: flex; align-items: center; gap: 14px; flex: 1;">
                            <img src="" class="dish-thumb-daily" alt="${dish.dish_name}" style="width: 64px; height: 64px; object-fit: cover; border-radius: 8px; background: #f0f0f0;" />
                            <div>
                                <div style="font-weight: 600; font-size: 16px; color: #333;">${dish.dish_name}</div>
                                <div style="font-size: 12px; color: #888; margin-top: 4px;">主料: ${(dish.ingredients || []).slice(0, 3).join(', ')}</div>
                            </div>
                        </div>
                        <button class="fav-heart-btn ${hasFav ? 'active' : ''}" style="background: none; border: none; cursor: pointer; font-size: 20px; padding: 8px;">
                            ${hasFav ? '❤️' : '🤍'}
                        </button>
                    `;

                    // 异步加载单日模式的小图
                    fetchDishImage(dish.image_search_kw, dish.dish_name).then(url => {
                        const img = dishCard.querySelector('img');
                        if (img) img.src = url;
                    });

                } else {
                    // 📅 周菜单模式：保持原有的极简紧凑行
                    dishCard.className = 'dish-card-mini';
                    dishCard.style.cssText = 'display: flex; justify-content: space-between; align-items: center; width: 100%; padding: 8px 4px; border-bottom: 1px solid #f2f2f2; cursor: pointer;';
                    
                    dishCard.innerHTML = `
                        <span style="font-weight: 500; font-size: 14px; color: #333;">${dish.dish_name}</span>
                        <button class="fav-heart-btn ${hasFav ? 'active' : ''}" style="background: none; border: none; cursor: pointer; font-size: 16px; padding: 2px 6px; opacity: 0.4;">
                            ${hasFav ? '❤️' : '🤍'}
                        </button>
                    `;
                }

                // 点击爱心切换金榜状态
                const heartBtn = dishCard.querySelector('.fav-heart-btn');
                heartBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const isNowFav = toggleFavorite(dish);
                    heartBtn.innerHTML = isNowFav ? '❤️' : '🤍';
                    heartBtn.classList.toggle('active', isNowFav);
                    if (currentMode !== 'daily') {
                        heartBtn.style.opacity = isNowFav ? '1' : '0.4';
                    }
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
