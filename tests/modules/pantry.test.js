// tests/modules/pantry.test.js
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { initPantryModule, getPantryList } from '../../js/modules/pantry.js';
import * as geminiApi from '../../js/api/gemini.js';

describe('Pantry UI Module', () => {
    beforeEach(() => {
        localStorage.clear();
        document.body.innerHTML = `
            <div id="pantry-tags-container"></div>
            <input id="new-ingredient-input" />
            <button id="add-ingredient-btn"></button>
            <button id="scan-receipt-btn"></button>
            <input type="file" id="receipt-file-input" />
        `;
    });

    it('手添加食材并渲染 Tag，点击删除按钮应从库中移除', () => {
        initPantryModule();

        const input = document.getElementById('new-ingredient-input');
        const addBtn = document.getElementById('add-ingredient-btn');

        input.value = '牛肉';
        addBtn.click();

        expect(getPantryList().length).toBe(1);
        expect(getPantryList()[0].name).toBe('牛肉');

        // 测试删除按钮
        const removeBtn = document.querySelector('.remove-tag-btn');
        expect(removeBtn).not.toBeNull();
        removeBtn.click();

        expect(getPantryList().length).toBe(0);
    });

    it('输入框按回车键 (Enter) 同样触发添加功能', () => {
        initPantryModule();

        const input = document.getElementById('new-ingredient-input');
        input.value = '土豆';
        
        const enterEvent = new KeyboardEvent('keypress', { key: 'Enter' });
        input.dispatchEvent(enterEvent);

        expect(getPantryList()[0].name).toBe('土豆');
    });
});
