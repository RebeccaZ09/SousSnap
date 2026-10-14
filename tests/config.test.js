// tests/config.test.js
import { describe, it, expect, beforeEach } from 'vitest';
import { 
    getAppConfig, 
    saveAppConfig, 
    getUserPreferences, 
    saveUserPreferences, 
    DEFAULT_PREFERENCES 
} from '../js/config.js';

describe('Config Module', () => {
    beforeEach(() => {
        localStorage.clear();
    });

    it('getAppConfig 应在 localStorage 为空时返回空字符串', () => {
        const config = getAppConfig();
        expect(config.geminiApiKey).toBe('');
        expect(config.googleApiKey).toBe('');
        expect(config.googleCx).toBe('');
    });

    it('saveAppConfig 应正确保存并修剪 (trim) API Key 字符串', () => {
        saveAppConfig('  key123  ', '  googleKey  ', '  cx123  ');
        const config = getAppConfig();
        expect(config.geminiApiKey).toBe('key123');
        expect(config.googleApiKey).toBe('googleKey');
        expect(config.googleCx).toBe('cx123');
    });

    it('getUserPreferences 应在空记录时返回 null', () => {
        expect(getUserPreferences()).toBeNull();
    });

    it('saveUserPreferences 应正确序列化并读取用户偏好', () => {
        const prefs = { ...DEFAULT_PREFERENCES, dietaryRestrictions: '海鲜过敏' };
        saveUserPreferences(prefs);
        const result = getUserPreferences();
        expect(result).toEqual(prefs);
        expect(result.dietaryRestrictions).toBe('海鲜过敏');
    });
});
