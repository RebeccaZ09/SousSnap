// tests/api/imageSearch.test.js
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchDishImage } from '../../js/api/imageSearch.js';

describe('Image Search Module', () => {
    beforeEach(() => {
        vi.resetAllMocks();
    });

    it('未配置 Google Key 时，应直接返回 Pollinations AI 降级源图片 URL', async () => {
        const url = await fetchDishImage('宫保鸡丁', { apiKey: '', cx: '' });
        // 更新断言匹配 Pollinations AI 域名
        expect(url).toContain('https://image.pollinations.ai/prompt/');
        expect(url).toContain(encodeURIComponent('宫保鸡丁'));
    });

    it('Google API 请求失败或返回为空时，应自动降级至 Pollinations AI', async () => {
        global.fetch = vi.fn().mockRejectedValue(new Error('API Error'));

        const url = await fetchDishImage('宫保鸡丁', { apiKey: 'test-key', cx: 'test-cx' });
        expect(url).toContain('https://image.pollinations.ai/prompt/');
    });
});
