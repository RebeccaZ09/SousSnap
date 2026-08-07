// js/main.js
import { initPreferencesModule } from './modules/preferences.js';
import { initPantryModule } from './modules/pantry.js';
import { initWeeklyBoardModule } from './modules/weeklyBoard.js';
import { initRecipeDrawerEvents } from './modules/recipeDrawer.js';

document.addEventListener('DOMContentLoaded', () => {
    console.log("SousSnap App initialized!");

    // Initialize module handlers
    initPreferencesModule();
    initPantryModule();
    initWeeklyBoardModule();
    initRecipeDrawerEvents();

    // Modal toggles
    const openSettingsBtn = document.getElementById('open-settings-btn');
    const closeSettingsBtn = document.getElementById('close-settings-btn');
    const settingsModal = document.getElementById('settings-modal');

    if (openSettingsBtn && settingsModal) {
        openSettingsBtn.addEventListener('click', () => settingsModal.classList.add('active'));
    }
    if (closeSettingsBtn && settingsModal) {
        closeSettingsBtn.addEventListener('click', () => settingsModal.classList.remove('active'));
    }
});
