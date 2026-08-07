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
    const generateBtn = document.getElementById('generate-weekly-btn');
    if (generateBtn) {
        generateBtn.addEventListener('click', handleGeneratePlan);
    }
}

async function handleGeneratePlan() {
    const btn = document.getElementById('generate-weekly-btn');
    if (btn) {
        btn.disabled = true;
        btn.innerText = '✨ 智能生成中...';
    }

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
        if (btn) {
            btn.disabled = false;
            btn.innerText = '✨ 生成本周灵感菜单';
        }
    }
}

export async function renderWeeklyBoard(planArray) {
    const boardContainer = document.getElementById('weekly-board-container');
    if (!boardContainer) return;

    boardContainer.innerHTML = '';

    for (const dayData of planArray) {
        const dayCard = document.createElement('div');
        dayCard.className = 'day-card';
        dayCard.innerHTML = `<h3 class="day-title">${dayData.day}</h3>`;

        const mealTypes = [
            { key: 'breakfast', label: '早餐' },
            { key: 'lunch', label: '午餐' },
            { key: 'dinner', label: '晚餐' }
        ];

        for (const type of mealTypes) {
            const section = document.createElement('div');
            section.className = 'meal-section';
            section.innerHTML = `<h4 class="meal-type-label">${type.label}</h4>`;

            const dishes = dayData[type.key] || [];
            for (const dish of dishes) {
                const dishCard = document.createElement('div');
                dishCard.className = 'dish-card';
                dishCard.onclick = () => openRecipeDrawer(dish);

                const imageUrl = await fetchDishImage(dish.image_search_kw, dish.dish_name);

                dishCard.innerHTML = `
                    <img src="${imageUrl}" class="dish-thumb" alt="${dish.dish_name}" loading="lazy" />
                    <div class="dish-info">
                        <div class="dish-name">${dish.dish_name}</div>
                        <div class="dish-ingredients-preview">${(dish.ingredients || []).join('、')}</div>
                    </div>
                `;
                section.appendChild(dishCard);
            }
            dayCard.appendChild(section);
        }
        boardContainer.appendChild(dayCard);
    }
}
