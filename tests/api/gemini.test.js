import { describe, it, expect, vi, beforeEach } from 'vitest';
import { scanImageForIngredients, refineSingleDish } from '../../js/api/gemini.js';

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
});
