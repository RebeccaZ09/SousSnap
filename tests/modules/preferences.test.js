// tests/modules/preferences.test.js
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { initPreferencesModule } from '../../js/modules/preferences.js';
import { getAppConfig, getUserPreferences } from '../../js/config.js';

describe('Preferences UI Module', () => {
    beforeEach(() => {
        localStorage.clear();
        vi.spyOn(window, 'alert').mockImplementation(() => {});

        document.body.innerHTML = `
            <input id="apiKeyInput" />
            <input id="googleApiKeyInput" />
            <input id="googleCxInput" />
            <input id="dietaryRestrictionsInput" />
            <input id="bfCuisine" value="西式快手" />
            <input id="bfCount" value="1" />
            <input id="lunchCuisine" value="中式家常" />
            <input id="lunchCount" value="2" />
            <input id="dinnerCuisine" value="中式家常" />
            <input id="dinnerCount" value="2" />
            <button id="btnSaveSettings"></button>
            <div id="settingsModal" class="active"></div>
        `;
    });

    it('点击保存设置按钮时应成功写入 localStorage 并关闭 Modal', () => {
        initPreferencesModule();

        document.getElementById('apiKeyInput').value = 'gemini_key_123';
        document.getElementById('dietaryRestrictionsInput').value = '不吃辣';

        const saveBtn = document.getElementById('btnSaveSettings');
        saveBtn.click();

        expect(getAppConfig().geminiApiKey).toBe('gemini_key_123');
        expect(getUserPreferences().dietaryRestrictions).toBe('不吃辣');
        expect(document.getElementById('settingsModal').classList.contains('active')).toBe(false);
    });
});
