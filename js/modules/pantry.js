// js/modules/pantry.js
import { scanImageForIngredients } from '../api/gemini.js';

let pantryItems = JSON.parse(localStorage.getItem('soussnap_pantry') || '[]');
let currentFilterCategory = 'all';

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

// 分类中文与图标映射
const CATEGORY_MAP = {
    vegetable: { label: '蔬菜果蔬', icon: '🥦', color: '#e6f4ea', textCol: '#137333' },
    meat: { label: '肉类海鲜', icon: '🥩', color: '#fce8e6', textCol: '#c5221f' },
    dairy: { label: '蛋奶烘焙', icon: '🧀', color: '#fef7e0', textCol: '#b06000' },
    pantry: { label: '粮油干货', icon: '🌾', color: '#f1f3f4', textCol: '#3c4043' },
    condiment: { label: '调味酱料', icon: '🧂', color: '#e8f0fe', textCol: '#1967d2' },
    other: { label: '其他食材', icon: '🍲', color: '#f3e8fd', textCol: '#8430ce' }
};

function renderPantryList() {
    const container = document.getElementById('pantryList') || document.getElementById('pantry-tags-container');
    if (!container) return;

    // 1. 如果没有容器包裹筛选栏，可以自动注入一个干净的筛选头部（如果已有可忽略）
    if (!document.getElementById('pantryFilterBar')) {
        const parent = container.parentElement;
        if (parent && !document.getElementById('pantryFilterBar')) {
            const filterBar = document.createElement('div');
            filterBar.id = 'pantryFilterBar';
            filterBar.style.cssText = 'display: flex; gap: 8px; margin-bottom: 16px; flex-wrap: wrap; align-items: center;';
            filterBar.innerHTML = `
                <button class="filter-pill active" data-cat="all" style="padding: 6px 14px; border-radius: 20px; border: 1px solid #ddd; background: #333; color: #fff; cursor: pointer; font-size: 13px; transition: all 0.2s;">全部 (${pantryItems.length})</button>
                ${Object.keys(CATEGORY_MAP).map(key => `
                    <button class="filter-pill" data-cat="${key}" style="padding: 6px 14px; border-radius: 20px; border: 1px solid #ddd; background: #f8f9fa; color: #555; cursor: pointer; font-size: 13px; transition: all 0.2s;">
                        ${CATEGORY_MAP[key].icon} ${CATEGORY_MAP[key].label}
                    </button>
                `).join('')}
            `;
            parent.insertBefore(filterBar, container);

            // 绑定筛选点击事件
            filterBar.querySelectorAll('.filter-pill').forEach(btn => {
                btn.addEventListener('click', () => {
                    filterBar.querySelectorAll('.filter-pill').forEach(b => {
                        b.classList.remove('active');
                        b.style.background = '#f8f9fa';
                        b.style.color = '#555';
                        b.style.borderColor = '#ddd';
                    });
                    btn.classList.add('active');
                    btn.style.background = '#333';
                    btn.style.color = '#fff';
                    btn.style.borderColor = '#333';
                    currentFilterCategory = btn.dataset.cat;
                    renderPantryList();
                });
            });
        }
    }

    // 2. 过滤食材
    const filteredItems = currentFilterCategory === 'all' 
        ? pantryItems 
        : pantryItems.filter(item => (item.category || 'other') === currentFilterCategory);

    if (pantryItems.length === 0) {
        container.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: #888; background: #fafafa; border-radius: 12px; border: 2px dashed #eee;">
                <div style="font-size: 36px; margin-bottom: 8px;">🧺</div>
                <div style="font-weight: 500; font-size: 15px;">食材库暂无内容</div>
                <div style="font-size: 13px; color: #aaa; margin-top: 4px;">可通过上方输入框手动添加，或点击“拍小票/冰箱”智能识别</div>
            </div>`;
        return;
    }

    if (filteredItems.length === 0) {
        container.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 30px; color: #888; font-size: 14px;">
                该分类下暂无食材
            </div>`;
        return;
    }

    // 3. 渲染精致的网格卡片布局
    container.style.cssText = `
        display: grid; 
        grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); 
        gap: 12px; 
        width: 100%;
    `;

    container.innerHTML = filteredItems.map((item) => {
        // 查找原始索引以便于编辑和删除
        const realIdx = pantryItems.indexOf(item);
        const catInfo = CATEGORY_MAP[item.category] || CATEGORY_MAP.other;
        
        // 计算保质期状态
        let expiryHtml = '';
        if (item.expiry) {
            const today = new Date().toISOString().split('T')[0];
            if (item.expiry < today) {
                expiryHtml = `<span style="font-size: 11px; color: #d93025; background: #fce8e6; padding: 2px 6px; border-radius: 4px; font-weight: 500;">⚠️ 已过保质期</span>`;
            } else {
                expiryHtml = `<span style="font-size: 11px; color: #5f6368;">保质期至: ${item.expiry}</span>`;
            }
        }

        return `
            <div class="pantry-card-item" data-index="${realIdx}" style="
                background: #fff; 
                border: 1px solid #eaeaea; 
                border-radius: 10px; 
                padding: 12px 14px; 
                display: flex; 
                flex-direction: column; 
                justify-content: space-between; 
                cursor: pointer; 
                position: relative;
                transition: all 0.2s ease;
                box-shadow: 0 1px 3px rgba(0,0,0,0.02);
            " onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 4px 12px rgba(0,0,0,0.08)'" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 1px 3px rgba(0,0,0,0.02)'">
                
                <div>
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 6px;">
                        <span style="font-size: 18px;" title="${catInfo.label}">${catInfo.icon}</span>
                        <button class="remove-tag-btn" data-index="${realIdx}" title="删除食材" style="
                            background: none; border: none; cursor: pointer; color: #999; font-size: 16px; padding: 0 4px; border-radius: 4px;
                        " onmouseover="this.style.color='#d93025'" onmouseout="this.style.color='#999'">&times;</button>
                    </div>
                    <div style="font-weight: 600; font-size: 15px; color: #202124; margin-bottom: 4px; word-break: break-all;">${item.name}</div>
                </div>

                <div style="display: flex; flex-direction: column; gap: 4px; margin-top: 8px; border-top: 1px solid #f1f3f4; pt: 8px;">
                    <span style="align-self: flex-start; font-size: 11px; background: ${catInfo.color}; color: ${catInfo.textCol}; padding: 2px 6px; border-radius: 4px; font-weight: 500;">
                        ${catInfo.label}
                    </span>
                    ${expiryHtml}
                </div>
            </div>
        `;
    }).join('');

    // 绑定点击卡片打开编辑模态框
    container.querySelectorAll('.pantry-card-item').forEach(card => {
        card.addEventListener('click', (e) => {
            if (e.target.classList.contains('remove-tag-btn')) return;
            const index = parseInt(card.dataset.index, 10);
            openEditModal(index);
        });
    });

    // 绑定删除按钮
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
    const addBtn = document.getElementById('btnAddIngredient') || document.getElementById('add-ingredient-btn');
    const input = document.getElementById('manualIngredientInput') || document.getElementById('new-ingredient-input');
    const scanBtn = document.getElementById('btnScanImage') || document.getElementById('scan-receipt-btn');
    const fileInput = document.getElementById('imageFileInput') || document.getElementById('receipt-file-input');

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
                pantryItems.push({ 
                    name: val, 
                    category: 'vegetable', // 默认归为蔬菜/果蔬
                    addedAt: new Date().toISOString() 
                });
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
                    result.items.render?.(); // safety
                    result.items.forEach(item => {
                        // 兼容 AI 返回的是字符串或者是带分类的对象
                        const itemName = typeof item === 'string' ? item : item.name;
                        const itemCat = typeof item === 'object' && item.category ? item.category : 'vegetable';
                        
                        if (itemName && !pantryItems.some(p => p.name === itemName)) {
                            pantryItems.push({ 
                                name: itemName, 
                                category: itemCat, 
                                addedAt: new Date().toISOString() 
                            });
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
