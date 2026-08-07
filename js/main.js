// js/main.js
import { initPreferencesModule } from './modules/preferences.js';
import { initPantryModule } from './modules/pantry.js';
import { initWeeklyBoardModule } from './modules/weeklyBoard.js';
import { initRecipeDrawerEvents } from './modules/recipeDrawer.js';

document.addEventListener('DOMContentLoaded', () => {
    console.log("SousSnap App 初始化中...");

    // =========================================================
    // 1. 优先绑定 UI 基础框架 (Tab 切换 & 设置弹窗)
    // 放在最顶层：确保即使子模块有错，Tab 和设置按钮也绝对能点
    // =========================================================

    // 打开/关闭吃货设定 Modal
    const btnOpenSettings = document.getElementById('btnOpenSettings');
    const btnCloseSettings = document.getElementById('btnCloseSettings');
    const settingsModal = document.getElementById('settingsModal');

    if (btnOpenSettings && settingsModal) {
        btnOpenSettings.addEventListener('click', () => {
            settingsModal.classList.add('active');
        });
    }

    if (btnCloseSettings && settingsModal) {
        btnCloseSettings.addEventListener('click', () => {
            settingsModal.classList.remove('active');
        });
    }

    // 底部 Tab 导航栏切换
    const tabButtons = document.querySelectorAll('.tab-item');
    const tabContents = document.querySelectorAll('.tab-content');

    tabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetTab = btn.dataset.tab;

            // 切换按钮高亮样式
            tabButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            // 切换对应区域显示/隐藏
            tabContents.forEach(content => {
                if (content.id === `tab-${targetTab}`) {
                    content.classList.remove('hidden');
                } else {
                    content.classList.add('hidden');
                }
            });
        });
    });

    // =========================================================
    // 2. 独立安全初始化各个业务模块 (带错误隔离 protection)
    // =========================================================
    safeInit('PreferencesModule', initPreferencesModule);
    safeInit('PantryModule', initPantryModule);
    safeInit('WeeklyBoardModule', initWeeklyBoardModule);
    safeInit('RecipeDrawerEvents', initRecipeDrawerEvents);

    console.log("SousSnap App 初始化完成!");
});

// 安全初始化包装函数：防止单个模块报错拖垮整个页面
function safeInit(moduleName, initFn) {
    try {
        if (typeof initFn === 'function') {
            initFn();
        }
    } catch (err) {
        console.error(`[${moduleName}] 初始化报错 (已隔离，不影响 UI):`, err);
    }
}
