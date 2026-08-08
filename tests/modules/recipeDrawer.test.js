/**
 * @jest-environment jsdom
 */
import { describe, it, expect, beforeEach } from 'vitest';

describe('Recipe Drawer Module', () => {
    beforeEach(() => {
        document.body.innerHTML = `
            <div id="recipeDrawer" class="drawer hidden">
                <div id="recipeContent"></div>
                <button id="btnCloseDrawer">Close</button>
            </div>
        `;
    });

    it('抽屉初始化时应默认隐藏', () => {
        const drawer = document.getElementById('recipeDrawer');
        expect(drawer.classList.contains('hidden')).toBe(true);
    });
});
