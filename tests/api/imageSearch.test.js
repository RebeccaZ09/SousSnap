// tests/api/imageSearch.test.js
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { saveAppConfig } from '../../js/config.js';
import { fetchDishImage } from '../../js/api/imageSearch.js';

describe('Image Search Module', () => {
    beforeEach(() => {
        localStorage.clear();
        vi.restoreAllMocks();
    });

    it('未配置 Google Key 时，应直接返回 Unsplash 源图片 URL', async () => {
        const url = await fetchDishImage('宫保鸡丁');
        expect(url).toContain('https://source.unsplash.com/800x600/?%E5%AE%AB%E4%BF%9D%E9%B8%A1%E4%B8%81');
    });

    it('配置 Google API Key 并成功搜索时返回 Google 图片 URL', async () => {
        saveAppConfig('gemini_key', 'google_key', 'google_cx');

        global.fetch = vi.fn().mockResolvedValue({
            json: async () => ({
                items: [{ link: 'https://example.com/gongbao.jpg' }]
            })
        });

        const url = await fetchDishImage('宫保鸡丁');
        expect(url).toBe('https://example.com/gongbao.jpg');
    });

    it('Google API 请求失败或返回为空时，应自动降级至 Unsplash', async () => {
        saveAppConfig('gemini_key', 'google_key', 'google_cx');

        global.fetch = vi.fn().mockRejectedValue(new Error('Network Error'));

        const url = await fetchDishImage('宫保鸡丁');
        expect(url).toContain('https://source.unsplash.com/800x600/?');
    });
});
