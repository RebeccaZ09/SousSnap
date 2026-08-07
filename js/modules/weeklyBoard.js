// js/modules/weeklyBoard.js
import { generateWeeklyPlanner } from '../api/gemini.js';
import { fetchDishImage } from '../api/imageSearch.js';
import { getPantryList } from './pantry.js';
import { openRecipeDrawer } from './recipeDrawer.js';

let currentWeeklyPlan = JSON.parse(localStorage.getItem('soussnap_current_plan') || 'null');

export function initWeeklyBoardModule() {
    setupBoardControls();
    if (currentWeeklyPlan) {
        renderWeeklyBoard(currentWeeklyPlan);
    }
}

function setupBoardControls() {
    const generateBtn = document.getElementById('btnGenerateWeekly');
    if (generateBtn) {
        generateBtn.addEventListener('click', handleGeneratePlan);
    }
}

async function handleGeneratePlan() {
    const btn = document.getElementById('btnGenerateWeekly');
    const loadingState = document.getElementById('loadingState');
    
    if (btn) btn.disabled = true;
    if (loadingState) loadingState.classList.remove('hidden');

    try {
        const pantry = getPantryList();
        const planData = await generateWeeklyPlanner(pantry);

        if (planData && planData.weeklyPlan) {
            currentWeeklyPlan = planData.weeklyPlan;
            localStorage.setItem('soussnap_current_plan', JSON.stringify(currentWeeklyPlan));
            await renderWeeklyBoard(currentWeeklyPlan);
        } else {
            throw new Error('未接收到格式正确的周计划数据');
        }
    } catch (err) {
        alert(`生成菜单失败: ${err.message}`);
    } finally {
        if (btn) btn.disabled = false;
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
                dishCard.onclick = () => openRecipeDrawer(dish);

                const imageUrl = await fetchDishImage(dish.image_search_kw, dish.dish_name);

                dishCard.innerHTML = `
                    <img src="${imageUrl}" class="dish-thumb-mini" alt="${dish.dish_name}" loading="lazy" />
                    <div class="dish-title-mini">${dish.dish_name}</div>
                `;
                block.appendChild(dishCard);
            }
            col.appendChild(block);
        }
        boardContainer.appendChild(col);
    }
}
