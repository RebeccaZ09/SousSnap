// tests/api/gemini.test.js
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { saveAppConfig, saveUserPreferences } from '../../js/config.js';
import { generateWeeklyPlanner, refineSingleDish, scanImageForIngredients } from '../../js/api/gemini.js';

describe('Gemini API Module', () => {
    beforeEach(() => {
        localStorage.clear();
        vi.restoreAllMocks();
    });

    it('未设置 API Key 时应直接抛出异常', async () => {
        await expect(generateWeeklyPlanner([])).rejects.toThrow('请先设置 Gemini API Key！');
    });

    it('Gemini 返回 API Error 时应抛出具体错误信息', async () => {
        saveAppConfig('mock_gemini_key', '', '');
        
        global.fetch = vi.fn().mockResolvedValue({
            json: async () => ({ error: { message: 'API Key Invalid' } })
        });

        await expect(generateWeeklyPlanner([])).rejects.toThrow('[Gemini API Error]: API Key Invalid');
    });

    it('Gemini 返回空数据时应抛出未返回有效内容错误', async () => {
        saveAppConfig('mock_gemini_key', '', '');
        
        global.fetch = vi.fn().mockResolvedValue({
            json: async () => ({ candidates: [] })
        });

        await expect(generateWeeklyPlanner([])).rejects.toThrow('Gemini 未返回有效内容');
    });

    it('generateWeeklyPlanner 应成功解析 Markdown 包裹的 JSON 数据', async () => {
        saveAppConfig('mock_gemini_key', '', '');
        const mockResponse = {
            weeklyPlan: [{ day: '周一', breakfast: [{ dish_name: '燕麦粥' }] }]
        };

        global.fetch = vi.fn().mockResolvedValue({
            json: async () => ({
                candidates: [{
                    content: {
                        parts: [{ text: `\`\`\`json\n${JSON.stringify(mockResponse)}\n\`\`\`` }]
                    }
                }]
            })
        });

        const result = await generateWeeklyPlanner([{ name: '燕麦' }]);
        expect(result).toEqual(mockResponse);
        expect(result.weeklyPlan[0].day).toBe('周一');
    });

    it('refineSingleDish 应正确请求并微调单个菜谱', async () => {
        saveAppConfig('mock_gemini_key', '', '');
        const mockDish = { dish_name: '红烧肉', steps: '步骤1' };
        const mockRefined = { dish_name: '少油红烧肉', steps: '步骤1(少油版)' };

        global.fetch = vi.fn().mockResolvedValue({
            json: async () => ({
                candidates: [{ content: { parts: [{ text: JSON.stringify(mockRefined) }] } }]
            })
        });

        const result = await refineSingleDish(mockDish, '少油');
        expect(result.dish_name).toBe('少油红烧肉');
    });

    it('scanImageForIngredients 应支持图像 Base64 解析食材', async () => {
        saveAppConfig('mock_gemini_key', '', '');
        const mockItems = { items: ['西红柿', '鸡蛋'] };

        global.fetch = vi.fn().mockResolvedValue({
            json: async () => ({
                candidates: [{ content: { parts: [{ text: JSON.stringify(mockItems) }] } }]
            })
        });

        const result = await scanImageForIngredients('fake_base64_string');
        expect(result.items).toContain('西红柿');
    });
});
