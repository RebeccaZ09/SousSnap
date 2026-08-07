// js/modules/preferences.js
import { getAppConfig, saveAppConfig, getUserPreferences, saveUserPreferences, DEFAULT_PREFERENCES } from '../config.js';

export function initPreferencesModule() {
    loadSettingsModalValues();
    loadPreferencesFormValues();
    setupEventListeners();
}

function loadSettingsModalValues() {
    const config = getAppConfig();
    const geminiInput = document.getElementById('gemini-api-key');
    const googleInput = document.getElementById('google-api-key');
    const googleCxInput = document.getElementById('google-cx');

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

    setVal('dietary-restrictions', prefs.dietaryRestrictions || '');
    setVal('bf-cuisine', prefs.bfCuisine || DEFAULT_PREFERENCES.bfCuisine);
    setVal('bf-count', prefs.bfCount || DEFAULT_PREFERENCES.bfCount);
    setVal('lunch-cuisine', prefs.lunchCuisine || DEFAULT_PREFERENCES.lunchCuisine);
    setVal('lunch-count', prefs.lunchCount || DEFAULT_PREFERENCES.lunchCount);
    setVal('dinner-cuisine', prefs.dinnerCuisine || DEFAULT_PREFERENCES.dinnerCuisine);
    setVal('dinner-count', prefs.dinnerCount || DEFAULT_PREFERENCES.dinnerCount);
}

function setupEventListeners() {
    // Save Settings Modal
    const saveSettingsBtn = document.getElementById('save-settings-btn');
    if (saveSettingsBtn) {
        saveSettingsBtn.addEventListener('click', () => {
            const geminiKey = document.getElementById('gemini-api-key').value;
            const googleKey = document.getElementById('google-api-key').value;
            const googleCx = document.getElementById('google-cx').value;

            saveAppConfig(geminiKey, googleKey, googleCx);
            alert('设置已保存！');
            document.getElementById('settings-modal').classList.remove('active');
        });
    }

    // Save Preferences Form
    const savePrefsBtn = document.getElementById('save-preferences-btn');
    if (savePrefsBtn) {
        savePrefsBtn.addEventListener('click', () => {
            const prefs = {
                dietaryRestrictions: document.getElementById('dietary-restrictions').value,
                bfCuisine: document.getElementById('bf-cuisine').value,
                bfCount: parseInt(document.getElementById('bf-count').value, 10) || 1,
                lunchCuisine: document.getElementById('lunch-cuisine').value,
                lunchCount: parseInt(document.getElementById('lunch-count').value, 10) || 2,
                dinnerCuisine: document.getElementById('dinner-cuisine').value,
                dinnerCount: parseInt(document.getElementById('dinner-count').value, 10) || 2
            };

            saveUserPreferences(prefs);
            alert('吃货偏好设定已保存！');
        });
    }
}
