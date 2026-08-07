/**
 * @jest-environment jsdom
 */

import { PantryManager } from '../js/pantryManager.js';

describe('食材库编辑弹窗与交互 (Pantry Modal Unit Tests)', () => {
    let pantryManager;

    beforeEach(() => {
        // 构建所需的 DOM 结构
        document.body.innerHTML = `
            <div id="pantryList"></div>
            <div id="editIngredientModal" class="modal hidden">
                <input type="hidden" id="editIngredientId">
                <input type="text" id="editIngredientName">
                <select id="editIngredientCategory">
                    <option value="vegetable">🥦 蔬菜水果</option>
                    <option value="meat">🥩 肉类禽蛋</option>
                    <option value="seafood">🐟 水产海鲜</option>
                    <option value="staple">🌾 粮油米面</option>
                    <option value="condiment">🧂 调味料</option>
                    <option value="other">📦 其他</option>
                </select>
                <input type="date" id="editIngredientExpiry">
                <button id="btnSaveIngredient">保存修改</button>
                <button id="btnDeleteIngredient">删除食材</button>
                <button id="btnCloseEditIngredient">✕</button>
            </div>
        `;

        // 清除 localStorage 缓存
        localStorage.clear();

        // 初始化 PantryManager 实例
        pantryManager = new PantryManager();
        pantryManager.init();
    });

    test('1. 打开编辑弹窗时，应正确填充食材的初始数据', () => {
        const item = {
            id: 'item-123',
            name: '西兰花',
            category: 'vegetable',
            expiry: '2026-08-15'
        };
        
        pantryManager.openEditModal(item);

        expect(document.getElementById('editIngredientModal').classList.contains('hidden')).toBe(false);
        expect(document.getElementById('editIngredientId').value).toBe('item-123');
        expect(document.getElementById('editIngredientName').value).toBe('西兰花');
        expect(document.getElementById('editIngredientCategory').value).toBe('vegetable');
        expect(document.getElementById('editIngredientExpiry').value).toBe('2026-08-15');
    });

    test('2. 保存修改后，应更新食材数据并关闭弹窗', () => {
        // 初始写入一条数据
        const initialPantry = [{ id: 'item-123', name: '西兰花', category: 'vegetable', expiry: '2026-08-15' }];
        localStorage.setItem('pantry_items', JSON.stringify(initialPantry));
        pantryManager.loadPantry();

        // 打开并修改数据
        pantryManager.openEditModal(initialPantry[0]);
        document.getElementById('editIngredientName').value = '有机西兰花';
        document.getElementById('editIngredientCategory').value = 'vegetable';
        document.getElementById('editIngredientExpiry').value = '2026-08-20';

        // 模拟点击保存
        document.getElementById('btnSaveIngredient').click();

        // 验证 DOM 与 Storage 状态
        const updatedPantry = JSON.parse(localStorage.getItem('pantry_items'));
        expect(updatedPantry[0].name).toBe('有机西兰花');
        expect(updatedPantry[0].expiry).toBe('2026-08-20');
        expect(document.getElementById('editIngredientModal').classList.contains('hidden')).toBe(true);
    });

    test('3. 点击删除按钮时，应正确删除该食材并关闭弹窗', () => {
        const initialPantry = [
            { id: 'item-123', name: '西兰花', category: 'vegetable' },
            { id: 'item-456', name: '牛肉', category: 'meat' }
        ];
        localStorage.setItem('pantry_items', JSON.stringify(initialPantry));
        pantryManager.loadPantry();

        // 打开 item-123
        pantryManager.openEditModal(initialPantry[0]);
        
        // 点击删除
        document.getElementById('btnDeleteIngredient').click();

        // 验证删除结果
        const updatedPantry = JSON.parse(localStorage.getItem('pantry_items'));
        expect(updatedPantry.length).toBe(1);
        expect(updatedPantry[0].id).toBe('item-456');
        expect(document.getElementById('editIngredientModal').classList.contains('hidden')).toBe(true);
    });

    test('4. 点击关闭按钮，应仅关闭弹窗而不修改数据', () => {
        const initialPantry = [{ id: 'item-123', name: '西兰花', category: 'vegetable' }];
        localStorage.setItem('pantry_items', JSON.stringify(initialPantry));
        pantryManager.loadPantry();

        pantryManager.openEditModal(initialPantry[0]);
        document.getElementById('editIngredientName').value = '修改未保存名称';

        // 点击关闭
        document.getElementById('btnCloseEditIngredient').click();

        // 验证未被更新
        const currentPantry = JSON.parse(localStorage.getItem('pantry_items'));
        expect(currentPantry[0].name).toBe('西兰花');
        expect(document.getElementById('editIngredientModal').classList.contains('hidden')).toBe(true);
    });
});
