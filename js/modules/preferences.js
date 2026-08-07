// js/modules/preferences.js
import { getAppConfig, saveAppConfig, getUserPreferences, saveUserPreferences, DEFAULT_PREFERENCES } from '../config.js';

export function initPreferencesModule() {
    loadSettingsModalValues();
    loadPreferencesFormValues();
    setupEventListeners();
}

function loadSettingsModalValues() {
    const config = getAppConfig();
    const geminiInput = document.getElementById('apiKeyInput');
    const googleInput = document.getElementById('googleApiKeyInput');
    const googleCxInput = document.getElementById('googleCxInput');

    if (geminiInput) geminiInput.value = config.geminiApiKey;
    if (googleInput) googleInput.value = config.googleApiKey;
    if (googleCxInput) googleCxInput.value = config.googleCx;
}

function loadPreferencesFormValues() {
    const prefs = getUserPreferences() || DEFAULT_PREFERENCES;
    
    const setVal = (id, val) => {
        const el = document.getElementById(id);
        if (el) el.value = val;
    };

    setVal('dietaryRestrictionsInput', prefs.dietaryRestrictions || '');
    setVal('bfCuisine', prefs.bfCuisine || DEFAULT_PREFERENCES.bfCuisine);
    setVal('bfCount', prefs.bfCount || DEFAULT_PREFERENCES.bfCount);
    setVal('lunchCuisine', prefs.lunchCuisine || DEFAULT_PREFERENCES.lunchCuisine);
    setVal('lunchCount', prefs.lunchCount || DEFAULT_PREFERENCES.lunchCount);
    setVal('dinnerCuisine', prefs.dinnerCuisine || DEFAULT_PREFERENCES.dinnerCuisine);
    setVal('dinnerCount', prefs.dinnerCount || DEFAULT_PREFERENCES.dinnerCount);
}

function setupEventListeners() {
    // 保存吃货设定
    const btnSaveSettings = document.getElementById('btnSaveSettings');
    if (btnSaveSettings) {
        btnSaveSettings.addEventListener('click', () => {
            const geminiKey = document.getElementById('apiKeyInput')?.value || '';
            const googleKey = document.getElementById('googleApiKeyInput')?.value || '';
            const googleCx = document.getElementById('googleCxInput')?.value || '';

            saveAppConfig(geminiKey, googleKey, googleCx);

            const prefs = {
                dietaryRestrictions: document.getElementById('dietaryRestrictionsInput')?.value || '',
                bfCuisine: document.getElementById('bfCuisine')?.value || DEFAULT_PREFERENCES.bfCuisine,
                bfCount: parseInt(document.getElementById('bfCount')?.value, 10) || 1,
                lunchCuisine: document.getElementById('lunchCuisine')?.value || DEFAULT_PREFERENCES.lunchCuisine,
                lunchCount: parseInt(document.getElementById('lunchCount')?.value, 10) || 2,
                dinnerCuisine: document.getElementById('dinnerCuisine')?.value || DEFAULT_PREFERENCES.dinnerCuisine,
                dinnerCount: parseInt(document.getElementById('dinnerCount')?.value, 10) || 2
            };

            saveUserPreferences(prefs);
            alert('吃货设定保存成功！');
            document.getElementById('settingsModal')?.classList.remove('active');
        });
    }
}
