// tests/modules/recipeDrawer.test.js
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { openRecipeDrawer, closeRecipeDrawer, initRecipeDrawerEvents } from '../../js/modules/recipeDrawer.js';

describe('Recipe Drawer Module', () => {
    beforeEach(() => {
        document.body.innerHTML = `
            <div id="recipeDrawer"></div>
            <div id="drawerOverlay"></div>
            <div id="drawerTitle"></div>
            <div id="drawerIngredients"></div>
            <div id="drawerSteps"></div>
            <button id="btnCloseDrawer"></button>
            <input id="aiTutorInput" />
            <button id="btnApplyAiTutor"></button>
        `;
    });

    it('openRecipeDrawer 应写入数据并加上 active class', () => {
        const dish = { dish_name: '番茄炒蛋', ingredients: ['番茄', '鸡蛋'], steps: '先炒蛋' };
        openRecipeDrawer(dish);

        expect(document.getElementById('drawerTitle').innerText).toBe('番茄炒蛋');
        expect(document.getElementById('recipeDrawer').classList.contains('active')).toBe(true);
    });

    it('closeRecipeDrawer 应移除 active class', () => {
        const drawer = document.getElementById('recipeDrawer');
        drawer.classList.add('active');

        closeRecipeDrawer();
        expect(drawer.classList.contains('active')).toBe(false);
    });
});
