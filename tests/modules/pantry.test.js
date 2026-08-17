/**
 * @jest-environment jsdom
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { initPantryModule, getPantryList } from '../../js/modules/pantry.js';
import * as geminiApi from '../../js/api/gemini.js';

vi.mock('../../js/api/gemini.js', () => ({
    scanImageForIngredients: vi.fn()
}));

describe('Pantry Module Unit Tests (食材库模块)', () => {
    beforeEach(() => {
        // 1. 清空内存数组与 localStorage
        const list = getPantryList();
        list.length = 0; 
        localStorage.clear();

        document.body.innerHTML = `
            <div id="pantry-tags-container"></div>
            <input id="new-ingredient-input" type="text" />
            <button id="add-ingredient-btn">添加</button>
            <button id="scan-receipt-btn">📷 拍小票/食材导入</button>
            <input type="file" id="receipt-file-input" />
        `;
        
        vi.spyOn(window, 'alert').mockImplementation(() => {});
        vi.clearAllMocks();
    });

    it('1. 初始化时，若食材库为空应显示提示信息', () => {
        initPantryModule();
        const container = document.getElementById('pantry-tags-container');
        expect(container.innerHTML).toContain('食材库暂无内容');
    });

    it('2. 手动输入食材名称并点击添加按钮，应成功添加并渲染标签', () => {
        initPantryModule();
        const input = document.getElementById('new-ingredient-input');
        const addBtn = document.getElementById('add-ingredient-btn');

        input.value = '西红柿';
        addBtn.click();

        const container = document.getElementById('pantry-tags-container');
        expect(container.innerHTML).toContain('西红柿');
        expect(getPantryList().some(item => item.name === '西红柿')).toBe(true);
        expect(input.value).toBe('');
    });

    it('3. 在输入框按 Enter 键，应支持添加食材', () => {
        initPantryModule();
        const input = document.getElementById('new-ingredient-input');

        input.value = '鸡蛋';
        input.dispatchEvent(new KeyboardEvent('keypress', { key: 'Enter' }));

        const container = document.getElementById('pantry-tags-container');
        expect(container.innerHTML).toContain('鸡蛋');
        expect(getPantryList().some(item => item.name === '鸡蛋')).toBe(true);
    });

    it('4. 点击食材标签上的删除按钮 &times; 应将其移除', () => {
        initPantryModule();
        const input = document.getElementById('new-ingredient-input');
        const addBtn = document.getElementById('add-ingredient-btn');

        input.value = '黄瓜';
        addBtn.click();

        // 准确选取 '黄瓜' 对应的删除按钮
        const removeBtn = document.querySelector('.remove-tag-btn[data-index="0"]');
        expect(removeBtn).not.toBeNull();
        removeBtn.click();

        const container = document.getElementById('pantry-tags-container');
        expect(container.innerHTML).not.toContain('黄瓜');
        expect(getPantryList().some(item => item.name === '黄瓜')).toBe(false);
    });

    it('5. 拍小票识别成功后，应自动解析食材并加入食材库', async () => {
        geminiApi.scanImageForIngredients.mockResolvedValueOnce({
            items: ['土豆', '牛肉']
        });

        initPantryModule();
        const fileInput = document.getElementById('receipt-file-input');

        const fakeFile = new File(['fake-image-content'], 'receipt.png', { type: 'image/png' });
        
        Object.defineProperty(fileInput, 'files', {
            value: [fakeFile]
        });
        
        fileInput.dispatchEvent(new Event('change'));

        await new Promise(resolve => setTimeout(resolve, 100));

        const container = document.getElementById('pantry-tags-container');
        expect(container.innerHTML).toContain('土豆');
        expect(container.innerHTML).toContain('牛肉');
        expect(window.alert).toHaveBeenCalledWith(expect.stringContaining('成功识别出 2 种食材'));
    });
});
