// js/modules/pantry.js
import { scanImageForIngredients } from '../api/gemini.js';

let pantryItems = JSON.parse(localStorage.getItem('soussnap_pantry') || '[]');

export function initPantryModule() {
    renderPantryList();
    setupPantryEvents();
}

export function getPantryList() {
    return pantryItems;
}

function savePantry() {
    localStorage.setItem('soussnap_pantry', JSON.stringify(pantryItems));
    renderPantryList();
}

function renderPantryList() {
    const container = document.getElementById('pantry-tags-container');
    if (!container) return;

    if (pantryItems.length === 0) {
        container.innerHTML = `<span class="empty-hint">食材库暂无内容，可通过上方手动添加或拍小票。</span>`;
        return;
    }

    container.innerHTML = pantryItems.map((item, idx) => `
        <span class="pantry-tag">
            ${item.name}
            <button class="remove-tag-btn" data-index="${idx}">&times;</button>
        </span>
    `).join('');

    container.querySelectorAll('.remove-tag-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const index = parseInt(e.target.dataset.index, 10);
            pantryItems.splice(index, 1);
            savePantry();
        });
    });
}

function setupPantryEvents() {
    const addBtn = document.getElementById('add-ingredient-btn');
    const input = document.getElementById('new-ingredient-input');
    const scanBtn = document.getElementById('scan-receipt-btn');
    const fileInput = document.getElementById('receipt-file-input');

    if (addBtn && input) {
        const addItem = () => {
            const val = input.value.trim();
            if (val) {
                pantryItems.push({ name: val, addedAt: new Date().toISOString() });
                input.value = '';
                savePantry();
            }
        };
        addBtn.addEventListener('click', addItem);
        input.addEventListener('keypress', (e) => { if (e.key === 'Enter') addItem(); });
    }

    if (scanBtn && fileInput) {
        scanBtn.addEventListener('click', () => fileInput.click());

        fileInput.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;

            scanBtn.disabled = true;
            scanBtn.innerText = '识别中...';

            try {
                const base64 = await fileToBase64(file);
                const result = await scanImageForIngredients(base64);

                if (result && Array.isArray(result.items)) {
                    result.items.forEach(item => {
                        if (!pantryItems.some(p => p.name === item)) {
                            pantryItems.push({ name: item, addedAt: new Date().toISOString() });
                        }
                    });
                    savePantry();
                    alert(`成功识别出 ${result.items.length} 种食材并加入食材库！`);
                }
            } catch (err) {
                alert(`识别失败: ${err.message}`);
            } finally {
                scanBtn.disabled = false;
                scanBtn.innerText = '📷 拍小票/食材导入';
                fileInput.value = '';
            }
        });
    }
}

function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result.split(',')[1]);
        reader.onerror = error => reject(error);
    });
}
