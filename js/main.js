// js/main.js
import { initPreferencesModule } from './modules/preferences.js';
import { initPantryModule } from './modules/pantry.js';
import { initWeeklyBoardModule } from './modules/weeklyBoard.js';
import { initRecipeDrawerEvents } from './modules/recipeDrawer.js';
import { renderFavoritesUI } from './modules/favorites.js';

document.addEventListener('DOMContentLoaded', () => {
    // 1. 初始化 UI 基础设施 (Tab & Modal)
    const btnOpenSettings = document.getElementById('btnOpenSettings');
    const btnCloseSettings = document.getElementById('btnCloseSettings');
    const settingsModal = document.getElementById('settingsModal');

    if (btnOpenSettings && settingsModal) {
        btnOpenSettings.addEventListener('click', () => settingsModal.classList.add('active'));
    }
    if (btnCloseSettings && settingsModal) {
        btnCloseSettings.addEventListener('click', () => settingsModal.classList.remove('active'));
    }

    const tabButtons = document.querySelectorAll('.tab-item');
    const tabContents = document.querySelectorAll('.tab-content');

    tabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetTab = btn.dataset.tab;
            tabButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            tabContents.forEach(content => {
                if (content.id === `tab-${targetTab}`) {
                    content.classList.remove('hidden');
                } else {
                    content.classList.add('hidden');
                }
            });
        });
    });

    // 2. 安全初始化各个业务模块
    safeInit('PreferencesModule', initPreferencesModule);
    safeInit('PantryModule', initPantryModule);
    safeInit('WeeklyBoardModule', initWeeklyBoardModule);
    safeInit('RecipeDrawerEvents', initRecipeDrawerEvents);
    safeInit('FavoritesUI', renderFavoritesUI);
});

function safeInit(moduleName, initFn) {
    try {
        if (typeof initFn === 'function') initFn();
    } catch (err) {
        console.error(`[${moduleName}] 初始化错误:`, err);
    }
}
