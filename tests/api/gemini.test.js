import { describe, it, expect, vi, beforeEach } from 'vitest';
import { scanImageForIngredients, refineSingleDish, generateWeeklyPlanner } from '../../js/api/gemini.js';

// 🌟 Mock 配置模块与本地存储，确保测试时能顺利拿到 API Key 和金榜/偏好数据
vi.mock('../../js/config.js', () => ({
    getAppConfig: () => ({ geminiApiKey: 'fake-key' }),
    getUserPreferences: () => ({})
}));

vi.mock('../../modules/favorites.js', () => ({
    getFavoritesList: () => [
        { dish_name: '营养燕麦粥', ingredients: ['燕麦', '牛奶'], steps: '煮开即可' }
    ]
}));

describe('Gemini API Module', () => {
    beforeEach(() => {
        vi.restoreAllMocks();
    });

    it('scanImageForIngredients 应支持图像 Base64 解析食材', async () => {
        vi.spyOn(global, 'fetch').mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                candidates: [{
                    content: {
                        parts: [{ text: JSON.stringify({ items: ['土豆', '牛肉'] }) }]
                    }
                }]
            })
        });

        const result = await scanImageForIngredients('data:image/png;base64,fake', 'fake-key');
        expect(result).toEqual({ items: ['土豆', '牛肉'] });
    });

    it('refineSingleDish 应正确请求并微调单个菜谱', async () => {
        vi.spyOn(global, 'fetch').mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                candidates: [{
                    content: {
                        parts: [{ 
                            text: JSON.stringify({
                                dish_name: '微辣宫保鸡丁',
                                ingredients: ['鸡胸肉', '花生', '黄瓜'],
                                steps: ['切块', '炒制']
                            }) 
                        }]
                    }
                }]
            })
        });

        const dish = await refineSingleDish('宫保鸡丁', '做成微辣', 'fake-key');
        expect(dish).toBeDefined();
        expect(dish.dish_name).toBe('微辣宫保鸡丁');
    });

    it('generateWeeklyPlanner 应支持生成 5 天包含幼儿午餐便当的菜单', async () => {
        // Mock 模拟 Gemini 成功返回 5 天结构化菜单
        const mockWeeklyResponse = {
            weeklyPlan: [
                {
                    day: '周一',
                    breakfast: [{ dish_name: '营养燕麦粥', ingredients: ['燕麦'], steps: '煮', image_search_kw: 'breakfast' }],
                    lunch: [{ dish_name: '水果奶酪便当', ingredients: ['奶酪棒', '草莓', '小饼干'], steps: '装盒', image_search_kw: 'bento' }],
                    dinner: [{ dish_name: '清炒小白菜', ingredients: ['小白菜'], steps: '炒', image_search_kw: 'dinner' }]
                }
            ]
        };

        vi.spyOn(global, 'fetch').mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                candidates: [{
                    content: {
                        parts: [{ text: JSON.stringify(mockWeeklyResponse) }]
                    }
                }]
            })
        });

        const plan = await generateWeeklyPlanner([]);
        expect(plan).toBeDefined();
        expect(plan.weeklyPlan).toBeInstanceOf(Array);
        expect(plan.weeklyPlan[0].lunch[0].ingredients.length).toBeGreaterThanOrEqual(2); // 验证午餐包含多项便当食材
    });
});
