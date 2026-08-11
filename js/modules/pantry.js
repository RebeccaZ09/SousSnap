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
    const container = document.getElementById('pantryList') || document.getElementById('pantry-tags-container');
    if (!container) return;

    if (pantryItems.length === 0) {
        container.innerHTML = `<span class="empty-hint">食材库暂无内容，可通过上方手动添加或拍小票。</span>`;
        return;
    }

    container.innerHTML = pantryItems.map((item, idx) => `
        <span class="pantry-tag" data-index="${idx}" style="cursor: pointer;" title="点击查看/编辑食材详情">
            ${item.name}
            <button class="remove-tag-btn" data-index="${idx}" title="删除">&times;</button>
        </span>
    `).join('');

    // 点击食材标签本身（排除删除按钮）打开查看/编辑弹窗
    container.querySelectorAll('.pantry-tag').forEach(tag => {
        tag.addEventListener('click', (e) => {
            if (e.target.classList.contains('remove-tag-btn')) return;
            const index = parseInt(tag.dataset.index, 10);
            openEditModal(index);
        });
    });

    container.querySelectorAll('.remove-tag-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const index = parseInt(btn.dataset.index, 10);
            pantryItems.splice(index, 1);
            savePantry();
        });
    });
}

function openEditModal(index) {
    const item = pantryItems[index];
    if (!item) return;

    const modal = document.getElementById('editIngredientModal');
    const idInput = document.getElementById('editIngredientId');
    const nameInput = document.getElementById('editIngredientName');
    const categorySelect = document.getElementById('editIngredientCategory');
    const expiryInput = document.getElementById('editIngredientExpiry');

    if (modal && nameInput) {
        idInput.value = index;
        nameInput.value = item.name || '';
        if (categorySelect) categorySelect.value = item.category || 'vegetable';
        if (expiryInput) expiryInput.value = item.expiry || '';
        modal.classList.add('active');
    }
}

function setupPantryEvents() {
    // 对应 index.html 中的 ID
    const addBtn = document.getElementById('btnAddIngredient') || document.getElementById('add-ingredient-btn');
    const input = document.getElementById('manualIngredientInput') || document.getElementById('new-ingredient-input');
    const scanBtn = document.getElementById('btnScanImage') || document.getElementById('scan-receipt-btn');
    const fileInput = document.getElementById('imageFileInput') || document.getElementById('receipt-file-input');

    // 编辑/查看模态框相关按钮
    const editModal = document.getElementById('editIngredientModal');
    const closeEditBtn = document.getElementById('btnCloseEditIngredient');
    const saveEditBtn = document.getElementById('btnSaveIngredient');
    const deleteEditBtn = document.getElementById('btnDeleteIngredient');
    const idInput = document.getElementById('editIngredientId');
    const nameInput = document.getElementById('editIngredientName');
    const categorySelect = document.getElementById('editIngredientCategory');
    const expiryInput = document.getElementById('editIngredientExpiry');

    if (closeEditBtn && editModal) {
        closeEditBtn.addEventListener('click', () => editModal.classList.remove('active'));
    }

    if (saveEditBtn && editModal) {
        saveEditBtn.addEventListener('click', () => {
            const index = parseInt(idInput.value, 10);
            const newName = nameInput.value.trim();
            if (!isNaN(index) && pantryItems[index] && newName) {
                pantryItems[index].name = newName;
                if (categorySelect) pantryItems[index].category = categorySelect.value;
                if (expiryInput) pantryItems[index].expiry = expiryInput.value;
                savePantry();
                editModal.classList.remove('active');
            }
        });
    }

    if (deleteEditBtn && editModal) {
        deleteEditBtn.addEventListener('click', () => {
            const index = parseInt(idInput.value, 10);
            if (!isNaN(index) && pantryItems[index]) {
                pantryItems.splice(index, 1);
                savePantry();
                editModal.classList.remove('active');
            }
        });
    }

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
                scanBtn.innerText = '🔍 识别并存入食材库';
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
