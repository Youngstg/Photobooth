import { API_BASE_URL } from './config.js';

// Global Admin State
let allTemplates = [];
let editingTemplateId = null;
let currentTemplateUrl = '';
let templateWidth = 800;
let templateHeight = 1200;
let slots = []; // Array of { x, y, w, h, aspectRatio, lockRatio, ratioName }
let showGuides = true;
let currentFilter = 'all';
let searchQuery = '';

// DOM Elements - Navigation & Tabs
const tabBtnManager = document.getElementById('tab-btn-manager');
const tabBtnEditor = document.getElementById('tab-btn-editor');
const tabManager = document.getElementById('tab-manager');
const tabEditor = document.getElementById('tab-editor');
const tabTemplatesCount = document.getElementById('tab-templates-count');

// DOM Elements - Manager Tab
const managerSearch = document.getElementById('manager-search');
const filterChips = document.querySelectorAll('.filter-chip');
const btnManagerCreateNew = document.getElementById('btn-manager-create-new');
const templatesGrid = document.getElementById('templates-grid');

// DOM Elements - Editor Tab
const editorModeBanner = document.getElementById('editor-mode-banner');
const modeBadge = document.getElementById('mode-badge');
const modeText = document.getElementById('mode-text');
const btnResetToNew = document.getElementById('btn-reset-to-new');

const fileInput = document.getElementById('template-file');
const btnUpload = document.getElementById('btn-upload');
const templateNameInput = document.getElementById('template-name');
const previewImage = document.getElementById('preview-image');
const previewContainer = document.getElementById('preview-container');
const overlaysContainer = document.getElementById('overlays-container');
const guidesContainer = document.getElementById('guides-container');
const dimensionsInfo = document.getElementById('dimensions-info');
const slotsContainer = document.getElementById('slots-container');
const btnAddSlot = document.getElementById('btn-add-slot');
const btnSave = document.getElementById('btn-save');
const sliderOpacity = document.getElementById('slider-template-opacity');
const opacityVal = document.getElementById('opacity-val');
const chkShowGuides = document.getElementById('chk-show-guides');

// Toast Notification Elements
const adminToast = document.getElementById('admin-toast');
const toastIcon = document.getElementById('toast-icon');
const toastMessage = document.getElementById('toast-message');
let toastTimeout = null;

export function showToast(message, isError = false) {
    if (!adminToast) return;
    if (toastTimeout) clearTimeout(toastTimeout);
    
    toastIcon.textContent = isError ? '❌' : '✅';
    toastMessage.textContent = message;
    
    if (isError) {
        adminToast.classList.add('error');
    } else {
        adminToast.classList.remove('error');
    }
    
    adminToast.classList.add('show');
    toastTimeout = setTimeout(() => {
        adminToast.classList.remove('show');
    }, 3200);
}

// =========================================
// TAB SWITCHING LOGIC
// =========================================
function switchTab(tabName) {
    if (tabName === 'manager') {
        tabBtnManager.classList.add('active');
        tabBtnEditor.classList.remove('active');
        tabManager.classList.add('active');
        tabEditor.classList.remove('active');
        fetchTemplates();
    } else {
        tabBtnEditor.classList.add('active');
        tabBtnManager.classList.remove('active');
        tabEditor.classList.add('active');
        tabManager.classList.remove('active');
        // Re-render editor overlays when tab becomes visible
        setTimeout(() => {
            renderOverlays();
        }, 60);
    }
}

if (tabBtnManager) tabBtnManager.addEventListener('click', () => switchTab('manager'));
if (tabBtnEditor) tabBtnEditor.addEventListener('click', () => switchTab('editor'));
if (btnManagerCreateNew) btnManagerCreateNew.addEventListener('click', () => {
    resetEditorForm();
    switchTab('editor');
});
if (btnResetToNew) btnResetToNew.addEventListener('click', () => {
    resetEditorForm();
    showToast('Form telah di-reset ke Mode Baru.');
});

// =========================================
// FETCH & RENDER TEMPLATES (MANAGER TAB)
// =========================================
async function fetchTemplates() {
    try {
        if (templatesGrid) {
            templatesGrid.innerHTML = `
                <div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: #8E8EA0;">
                    <div style="font-size: 28px; margin-bottom: 10px;">⏳</div>
                    <div>Memuat daftar template...</div>
                </div>
            `;
        }
        const res = await fetch(`${API_BASE_URL}/api/templates?t=${Date.now()}`);
        if (!res.ok) throw new Error('Gagal mengambil daftar template');
        const data = await res.json();
        allTemplates = Array.isArray(data) ? data : [];
        if (tabTemplatesCount) tabTemplatesCount.textContent = allTemplates.length;
        renderTemplateCards();
    } catch (e) {
        console.error('Error fetching templates:', e);
        if (templatesGrid) {
            templatesGrid.innerHTML = `
                <div class="empty-state" style="grid-column: 1 / -1;">
                    <div style="font-size: 40px;">⚠️</div>
                    <h3>Gagal Memuat Template</h3>
                    <p>${e.message}</p>
                    <button class="btn-create-new" onclick="location.reload()" style="display:inline-flex;">🔄 Coba Lagi</button>
                </div>
            `;
        }
    }
}

function renderTemplateCards() {
    if (!templatesGrid) return;
    templatesGrid.innerHTML = '';

    // Filter templates
    const query = searchQuery.toLowerCase().trim();
    const filtered = allTemplates.filter(t => {
        const matchesQuery = !query || 
            (t.name && t.name.toLowerCase().includes(query)) || 
            (t.id && t.id.toLowerCase().includes(query));
        
        const count = t.photoCount || (t.slots ? t.slots.length : 1);
        const matchesCount = currentFilter === 'all' || count.toString() === currentFilter;
        return matchesQuery && matchesCount;
    });

    if (filtered.length === 0) {
        templatesGrid.innerHTML = `
            <div class="empty-state" style="grid-column: 1 / -1;">
                <div style="font-size: 48px;">🔍</div>
                <h3>Tidak Ada Template yang Cocok</h3>
                <p>Coba kata kunci lain atau pilih filter jumlah foto yang berbeda.</p>
                <button id="btn-empty-create" class="btn-create-new">
                    <span>+ Buat Template Baru</span>
                </button>
            </div>
        `;
        const btnEmptyCreate = document.getElementById('btn-empty-create');
        if (btnEmptyCreate) {
            btnEmptyCreate.addEventListener('click', () => {
                resetEditorForm();
                switchTab('editor');
            });
        }
        return;
    }

    filtered.forEach(template => {
        const card = document.createElement('div');
        card.className = 'template-card';
        card.dataset.id = template.id;

        const photoCount = template.photoCount || (template.slots ? template.slots.length : 1);
        const width = template.width || 800;
        const height = template.height || 1200;
        const isCustomPng = !!(template.url && template.url.trim().length > 0 && !template.url.includes('AAAAASUVORK5CYII='));
        
        // Header Preview Container
        const previewArea = document.createElement('div');
        previewArea.className = 'card-preview-area';

        // Badge Type
        const typeBadge = document.createElement('span');
        typeBadge.className = `card-type-badge ${isCustomPng ? 'badge-png' : 'badge-procedural'}`;
        typeBadge.textContent = isCustomPng ? 'Custom PNG' : 'Procedural';
        previewArea.appendChild(typeBadge);

        if (isCustomPng) {
            const img = document.createElement('img');
            img.src = template.url;
            img.alt = template.name;
            img.className = 'card-preview-img';
            img.onerror = () => {
                // Fallback to generated canvas if image URL fails
                img.replaceWith(createMiniTemplateCanvas(template));
            };
            previewArea.appendChild(img);
        } else {
            const canvasEl = createMiniTemplateCanvas(template);
            previewArea.appendChild(canvasEl);
        }

        // Body Content
        const cardBody = document.createElement('div');
        cardBody.className = 'card-body';
        cardBody.innerHTML = `
            <h3 class="card-title" title="${template.name}">${template.name}</h3>
            <div class="card-id">ID: ${template.id}</div>
            
            <div class="card-meta-tags">
                <span class="meta-tag">📷 ${photoCount} Foto</span>
                <span class="meta-tag">📏 ${width} × ${height} px</span>
                <span class="meta-tag">🎨 ${isCustomPng ? 'Layer PNG' : 'Vector Box'}</span>
            </div>

            <div class="card-actions">
                <button class="btn-card-action btn-card-edit" title="Edit template ini">
                    <span>✏️</span> Edit
                </button>
                <button class="btn-card-action btn-card-dup" title="Duplikat template ini">
                    <span>📑</span> Salin
                </button>
                <button class="btn-card-action btn-card-del" title="Hapus template ini">
                    <span>🗑️</span>
                </button>
            </div>
        `;

        // Event Listeners for Card Actions
        const btnEdit = cardBody.querySelector('.btn-card-edit');
        const btnDup = cardBody.querySelector('.btn-card-dup');
        const btnDel = cardBody.querySelector('.btn-card-del');

        btnEdit.addEventListener('click', () => loadTemplateIntoEditor(template));
        btnDup.addEventListener('click', () => duplicateTemplate(template));
        btnDel.addEventListener('click', () => deleteTemplate(template));

        card.appendChild(previewArea);
        card.appendChild(cardBody);
        templatesGrid.appendChild(card);
    });
}

// Generate an aesthetic mini procedural canvas for templates without a full PNG
function createMiniTemplateCanvas(template) {
    const canvas = document.createElement('canvas');
    canvas.width = 160;
    canvas.height = 220;
    canvas.className = 'card-preview-canvas';
    const ctx = canvas.getContext('2d');

    const targetW = template.width || 800;
    const targetH = template.height || 1200;
    const scale = Math.min((canvas.width - 12) / targetW, (canvas.height - 12) / targetH);
    const renderW = targetW * scale;
    const renderH = targetH * scale;
    const offsetX = (canvas.width - renderW) / 2;
    const offsetY = (canvas.height - renderH) / 2;

    // Background
    ctx.fillStyle = template.bgColor || '#1C1536';
    ctx.fillRect(offsetX, offsetY, renderW, renderH);

    // Border
    ctx.strokeStyle = template.borderColor || '#FF76AC';
    ctx.lineWidth = 2.5;
    ctx.strokeRect(offsetX + 1, offsetY + 1, renderW - 2, renderH - 2);

    // Slots
    const tSlots = template.slots || [];
    tSlots.forEach((s, idx) => {
        const sx = offsetX + (s.x * scale);
        const sy = offsetY + (s.y * scale);
        const sw = Math.max(3, s.w * scale);
        const sh = Math.max(3, s.h * scale);

        // Photo placeholder gradient
        const grad = ctx.createLinearGradient(sx, sy, sx + sw, sy + sh);
        grad.addColorStop(0, '#FF69B4');
        grad.addColorStop(1, '#8370F5');
        ctx.fillStyle = grad;
        ctx.fillRect(sx, sy, sw, sh);

        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 1;
        ctx.strokeRect(sx, sy, sw, sh);

        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 8px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`F${idx + 1}`, sx + sw / 2, sy + sh / 2);
    });

    const footer = template.footerText || template.name || 'CUTE SNAPS';
    ctx.fillStyle = template.borderColor || '#FFFFFF';
    ctx.font = 'bold 8px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(footer.substring(0, 18), offsetX + renderW / 2, offsetY + renderH - 5);

    return canvas;
}

// Search & Filter Listeners
if (managerSearch) {
    managerSearch.addEventListener('input', (e) => {
        searchQuery = e.target.value;
        renderTemplateCards();
    });
}

filterChips.forEach(chip => {
    chip.addEventListener('click', () => {
        filterChips.forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        currentFilter = chip.dataset.filter;
        renderTemplateCards();
    });
});

// =========================================
// TEMPLATE ACTIONS: EDIT, DUPLICATE, DELETE
// =========================================
function loadTemplateIntoEditor(template) {
    editingTemplateId = template.id;
    currentTemplateUrl = template.url || '';
    templateWidth = template.width || 800;
    templateHeight = template.height || 1200;

    // Populate inputs
    if (templateNameInput) templateNameInput.value = template.name || '';
    if (dimensionsInfo) {
        dimensionsInfo.textContent = `📐 Resolusi: ${templateWidth} × ${templateHeight} px (ID: ${template.id})`;
    }

    // Set banner mode
    if (modeBadge) {
        modeBadge.textContent = 'Mode Edit';
        modeBadge.style.background = '#00ffcc';
        modeBadge.style.color = '#121217';
    }
    if (modeText) {
        modeText.innerHTML = `Mengedit template: <strong>${template.name}</strong> <span style="opacity:0.6; font-size:12px;">(${template.id})</span>`;
    }

    // Load slots
    slots = (template.slots || []).map(s => {
        const w = s.w || 200;
        const h = s.h || 150;
        const ratio = w / (h || 1);
        let ratioName = 'Custom';
        if (Math.abs(ratio - (4/3)) < 0.05) ratioName = '4:3';
        else if (Math.abs(ratio - (3/4)) < 0.05) ratioName = '3:4';
        else if (Math.abs(ratio - 1.0) < 0.05) ratioName = '1:1';
        else if (Math.abs(ratio - (16/9)) < 0.05) ratioName = '16:9';

        return {
            x: s.x || 0,
            y: s.y || 0,
            w: w,
            h: h,
            aspectRatio: ratio,
            lockRatio: true,
            ratioName: ratioName
        };
    });

    // If template has an image URL
    if (currentTemplateUrl && currentTemplateUrl.trim().length > 0 && !currentTemplateUrl.includes('AAAAASUVORK5CYII=')) {
        previewImage.src = currentTemplateUrl;
        previewImage.style.display = 'block';
    } else {
        // Procedural background preview
        previewImage.style.display = 'none';
        previewContainer.style.width = '360px';
        previewContainer.style.height = `${Math.round(360 * (templateHeight / templateWidth))}px`;
    }

    renderSlotsEditor();
    renderOverlays();

    switchTab('editor');
    showToast(`✏️ Template "${template.name}" siap diedit.`);
}

async function duplicateTemplate(template) {
    const copyId = `${template.id}-copy-${Date.now().toString(36)}`;
    const copyName = `${template.name} (Salinan)`;
    
    const duplicateConfig = {
        ...template,
        id: copyId,
        name: copyName,
        photoCount: template.slots ? template.slots.length : template.photoCount
    };

    try {
        const res = await fetch(`${API_BASE_URL}/api/admin/save-config`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(duplicateConfig)
        });
        const data = await res.json();
        if (data.success) {
            showToast(`📑 Berhasil menduplikasi "${template.name}"!`);
            await fetchTemplates();
        } else {
            throw new Error(data.error || 'Gagal menduplikasi template');
        }
    } catch (e) {
        showToast('Gagal menduplikasi: ' + e.message, true);
    }
}

async function deleteTemplate(template) {
    const confirmed = confirm(`⚠️ Apakah Anda yakin ingin menghapus template:\n"${template.name}" (ID: ${template.id})?\n\nTemplate ini akan dihapus permanen dari daftar photobooth.`);
    if (!confirmed) return;

    try {
        const res = await fetch(`${API_BASE_URL}/api/admin/delete-template`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: template.id })
        });
        const data = await res.json();
        if (data.success) {
            showToast(`🗑️ Template "${template.name}" berhasil dihapus.`);
            // If the deleted template was currently in editor, reset editor form
            if (editingTemplateId === template.id) {
                resetEditorForm();
            }
            await fetchTemplates();
        } else {
            throw new Error(data.error || 'Gagal menghapus template');
        }
    } catch (e) {
        showToast('Gagal menghapus: ' + e.message, true);
    }
}

function resetEditorForm() {
    editingTemplateId = null;
    currentTemplateUrl = '';
    templateWidth = 800;
    templateHeight = 1200;
    slots = [];

    if (templateNameInput) templateNameInput.value = '';
    if (fileInput) fileInput.value = '';
    if (previewImage) {
        previewImage.src = '';
        previewImage.style.display = 'none';
    }
    if (dimensionsInfo) dimensionsInfo.textContent = '';

    if (modeBadge) {
        modeBadge.textContent = 'Mode Baru';
        modeBadge.style.background = '#00ffcc22';
        modeBadge.style.color = '#00ffcc';
    }
    if (modeText) {
        modeText.textContent = 'Membuat Template Baru';
    }

    renderSlotsEditor();
    renderOverlays();
}

// =========================================
// EDITOR STUDIO LOGIC (SLOTS, SLIDERS, DRAG)
// =========================================

// Opacity Slider Listener
if (sliderOpacity) {
    sliderOpacity.addEventListener('input', (e) => {
        const val = e.target.value;
        if (opacityVal) opacityVal.textContent = `${val}%`;
        if (previewImage) previewImage.style.opacity = (val / 100).toString();
    });
}

// Guides Checkbox Listener
if (chkShowGuides) {
    chkShowGuides.addEventListener('change', (e) => {
        showGuides = e.target.checked;
        if (guidesContainer) {
            guidesContainer.style.display = showGuides ? 'block' : 'none';
        }
    });
}

if (btnUpload) {
    btnUpload.addEventListener('click', async () => {
        if (!fileInput || fileInput.files.length === 0) {
            showToast('Pilih file PNG terlebih dahulu!', true);
            return;
        }
        
        const formData = new FormData();
        formData.append('file', fileInput.files[0]);
        
        try {
            btnUpload.textContent = 'Mengunggah...';
            btnUpload.disabled = true;
            const res = await fetch(`${API_BASE_URL}/api/admin/upload-template`, {
                method: 'POST',
                body: formData
            });
            const data = await res.json();
            
            if (data.error) throw new Error(data.error);
            
            currentTemplateUrl = data.url;
            previewImage.src = currentTemplateUrl;
            previewImage.style.display = 'block';
            
            previewImage.onload = () => {
                templateWidth = previewImage.naturalWidth || 800;
                templateHeight = previewImage.naturalHeight || 1200;
                dimensionsInfo.textContent = `📐 Resolusi Asli: ${templateWidth} × ${templateHeight} px`;
                
                // If no slots exist yet, create a default centered slot with 4:3 fixed aspect ratio
                if (slots.length === 0) {
                    const defaultRatio = 4 / 3;
                    const defaultW = Math.round(templateWidth * 0.7);
                    const defaultH = Math.round(defaultW / defaultRatio);
                    const defaultX = Math.round((templateWidth - defaultW) / 2);
                    const defaultY = Math.round(templateHeight * 0.15);
                    slots.push({
                        x: defaultX,
                        y: defaultY,
                        w: defaultW,
                        h: defaultH,
                        aspectRatio: defaultRatio,
                        lockRatio: true,
                        ratioName: '4:3'
                    });
                }
                
                renderSlotsEditor();
                renderOverlays();
                showToast('✅ Template PNG berhasil diunggah.');
            };
            
        } catch (e) {
            showToast('Gagal mengunggah: ' + e.message, true);
        } finally {
            btnUpload.textContent = 'Upload & Preview';
            btnUpload.disabled = false;
        }
    });
}

if (btnAddSlot) {
    btnAddSlot.addEventListener('click', () => {
        const maxX = templateWidth || 800;
        const maxY = templateHeight || 1200;
        const defaultRatio = 4 / 3;
        const defaultW = Math.round(maxX * 0.65);
        const defaultH = Math.round(defaultW / defaultRatio);
        const defaultX = Math.round((maxX - defaultW) / 2);
        
        // Auto offset Y below last slot if available
        let defaultY = 60;
        if (slots.length > 0) {
            const last = slots[slots.length - 1];
            defaultY = Math.min(maxY - defaultH, last.y + last.h + 30);
        }

        slots.push({
            x: defaultX,
            y: defaultY,
            w: defaultW,
            h: defaultH,
            aspectRatio: defaultRatio,
            lockRatio: true,
            ratioName: '4:3'
        });
        renderSlotsEditor();
        renderOverlays();
        showToast(`➕ Slot Foto ke-${slots.length} ditambahkan.`);
    });
}

function getRatioLabel(slot) {
    if (slot.ratioName) return slot.ratioName;
    const r = slot.aspectRatio || (slot.w / (slot.h || 1));
    if (Math.abs(r - (4/3)) < 0.05) return '4:3';
    if (Math.abs(r - (3/4)) < 0.05) return '3:4';
    if (Math.abs(r - 1.0) < 0.05) return '1:1';
    if (Math.abs(r - (16/9)) < 0.05) return '16:9';
    return `${r.toFixed(2)}:1`;
}

function renderSlotsEditor() {
    if (!slotsContainer) return;
    slotsContainer.innerHTML = '';
    const maxX = templateWidth || 1200;
    const maxY = templateHeight || 1800;

    slots.forEach((slot, index) => {
        if (slot.aspectRatio === undefined) {
            slot.aspectRatio = slot.h > 0 ? (slot.w / slot.h) : (4/3);
        }
        if (slot.lockRatio === undefined) {
            slot.lockRatio = true;
        }

        const ratioLabel = getRatioLabel(slot);
        const is4x3 = ratioLabel === '4:3';
        const is3x4 = ratioLabel === '3:4';
        const is1x1 = ratioLabel === '1:1';
        const is16x9 = ratioLabel === '16:9';

        const div = document.createElement('div');
        div.className = 'slot-editor';
        div.id = `slot-editor-${index}`;
        div.innerHTML = `
            <div class="slot-header">
                <h4>📸 Foto ke-${index + 1}</h4>
                <div style="display:flex; gap:8px; align-items:center;">
                    <span class="lock-badge">🔒 Skala Fix (${ratioLabel})</span>
                    <button type="button" class="btn-del-slot" onclick="removeSlot(${index})" title="Hapus slot ini">✕ Hapus</button>
                </div>
            </div>
            
            <!-- Pilihan Rasio Skala Tetap (Fixed Ratio Presets) -->
            <div class="form-group" style="margin-bottom: 12px;">
                <label style="color: #00ffcc; font-size: 12px; margin-bottom: 6px;">📐 Rasio Skala Kamera (Fix Scale - Cegah Gepeng):</label>
                <div class="ratio-presets">
                    <button type="button" class="btn-ratio ${is4x3 ? 'active' : ''}" onclick="setSlotRatio(${index}, 4, 3, '4:3')">📷 4:3 (Landscape)</button>
                    <button type="button" class="btn-ratio ${is3x4 ? 'active' : ''}" onclick="setSlotRatio(${index}, 3, 4, '3:4')">📸 3:4 (Portrait)</button>
                    <button type="button" class="btn-ratio ${is1x1 ? 'active' : ''}" onclick="setSlotRatio(${index}, 1, 1, '1:1')">⏹️ 1:1 (Kotak/Square)</button>
                    <button type="button" class="btn-ratio ${is16x9 ? 'active' : ''}" onclick="setSlotRatio(${index}, 16, 9, '16:9')">🖥️ 16:9 (Wide)</button>
                </div>
            </div>

            <!-- Slider Utama: Ukuran Slot (Perbesar / Perkecil Secara Proporsional) -->
            <div class="scale-box">
                <div class="scale-box-title">
                    <span>🔍 Ukuran Slot (Perbesar / Perkecil)</span>
                    <strong id="val-size-${index}">${slot.w} × ${slot.h} px</strong>
                </div>
                <div class="slider-controls">
                    <input type="range" class="input-size-range" min="50" max="${maxX}" value="${slot.w}" 
                           oninput="onSlotSizeChange(${index}, this.value)">
                    <input type="number" class="input-size-num" min="50" max="${maxX}" value="${slot.w}" 
                           oninput="onSlotSizeChange(${index}, this.value)">
                </div>
                <div style="display:flex; justify-content:space-between; align-items:center; margin-top:6px; font-size:11px; color:#aaa;">
                    <span>*Lebar &amp; Tinggi otomatis terkunci sesuai rasio (anti-gepeng)</span>
                    <label style="margin:0; display:inline-flex; align-items:center; gap:4px; cursor:pointer;">
                        <input type="checkbox" ${slot.lockRatio !== false ? 'checked' : ''} onchange="toggleLockRatio(${index}, this.checked)">
                        <span style="color:#00ffcc; font-weight:600;">Kunci Rasio</span>
                    </label>
                </div>
            </div>

            <!-- Posisi X Slider -->
            <div class="slider-row">
                <div class="slider-header">
                    <span>Posisi X (Horizontal)</span>
                    <strong id="val-x-${index}">${slot.x} px</strong>
                </div>
                <div class="slider-controls">
                    <input type="range" class="input-x-range" min="0" max="${maxX}" value="${slot.x}" 
                           oninput="onSlotPosChange(${index}, 'x', this.value)">
                    <input type="number" class="input-x-num" min="0" max="${maxX}" value="${slot.x}" 
                           oninput="onSlotPosChange(${index}, 'x', this.value)">
                </div>
            </div>

            <!-- Posisi Y Slider -->
            <div class="slider-row">
                <div class="slider-header">
                    <span>Posisi Y (Vertikal)</span>
                    <strong id="val-y-${index}">${slot.y} px</strong>
                </div>
                <div class="slider-controls">
                    <input type="range" class="input-y-range" min="0" max="${maxY}" value="${slot.y}" 
                           oninput="onSlotPosChange(${index}, 'y', this.value)">
                    <input type="number" class="input-y-num" min="0" max="${maxY}" value="${slot.y}" 
                           oninput="onSlotPosChange(${index}, 'y', this.value)">
                </div>
            </div>

            <!-- Quick Action Helpers -->
            <div class="slot-quick-actions">
                <button type="button" class="btn-quick" onclick="quickCenterX(${index})">📐 Rata Tengah (Center X)</button>
                <button type="button" class="btn-quick" onclick="duplicateSlot(${index})">📋 Duplikat Slot</button>
            </div>
        `;
        slotsContainer.appendChild(div);
    });
}

// 1. Ubah Ukuran Slot (Perbesar / Perkecil) dengan Rasio Tetap (Anti-Gepeng)
window.onSlotSizeChange = (index, value) => {
    const slot = slots[index];
    if (!slot) return;
    const newW = Math.max(40, parseInt(value) || 40);
    const ratio = slot.aspectRatio || (slot.w / (slot.h || 1)) || (4/3);
    
    slot.w = newW;
    if (slot.lockRatio !== false) {
        slot.h = Math.round(newW / ratio);
    }
    
    syncSlotEditorInputs(index);
    renderOverlays();
};

// 2. Ubah Posisi X atau Y
window.onSlotPosChange = (index, field, value) => {
    const slot = slots[index];
    if (!slot) return;
    const val = Math.max(0, parseInt(value) || 0);
    slot[field] = val;
    
    syncSlotEditorInputs(index);
    renderOverlays();
};

// 3. Atur Rasio Tetap (Preset: 4:3, 3:4, 1:1, 16:9)
window.setSlotRatio = (index, rw, rh, name) => {
    const slot = slots[index];
    if (!slot) return;
    const ratio = rw / rh;
    slot.aspectRatio = ratio;
    slot.ratioName = name || `${rw}:${rh}`;
    slot.lockRatio = true;
    
    slot.h = Math.round(slot.w / ratio);
    
    renderSlotsEditor();
    renderOverlays();
};

// 4. Toggle Kunci Rasio
window.toggleLockRatio = (index, isLocked) => {
    const slot = slots[index];
    if (!slot) return;
    slot.lockRatio = isLocked;
    if (isLocked) {
        slot.aspectRatio = slot.w / (slot.h || 1);
    }
    renderSlotsEditor();
};

// 5. Sync Tampilan Nilai Input di Kartu Slot
function syncSlotEditorInputs(index) {
    const editor = document.getElementById(`slot-editor-${index}`);
    if (!editor) return;
    const slot = slots[index];

    const valX = document.getElementById(`val-x-${index}`);
    const valY = document.getElementById(`val-y-${index}`);
    const valSize = document.getElementById(`val-size-${index}`);

    if (valX) valX.textContent = `${slot.x} px`;
    if (valY) valY.textContent = `${slot.y} px`;
    if (valSize) valSize.textContent = `${slot.w} × ${slot.h} px`;

    const setVal = (sel, v) => {
        const el = editor.querySelector(sel);
        if (el && el.value != v) el.value = v;
    };

    setVal('.input-x-range', slot.x);
    setVal('.input-x-num', slot.x);
    setVal('.input-y-range', slot.y);
    setVal('.input-y-num', slot.y);
    setVal('.input-size-range', slot.w);
    setVal('.input-size-num', slot.w);
}

window.quickCenterX = (index) => {
    if (!templateWidth) return;
    const newX = Math.round((templateWidth - slots[index].w) / 2);
    slots[index].x = newX;
    syncSlotEditorInputs(index);
    renderOverlays();
};

window.duplicateSlot = (index) => {
    const orig = slots[index];
    const offset = orig.h + 20;
    const maxY = templateHeight || 1800;
    const newY = Math.min(maxY - orig.h, orig.y + offset);
    slots.push({
        x: orig.x,
        y: newY,
        w: orig.w,
        h: orig.h,
        aspectRatio: orig.aspectRatio,
        lockRatio: orig.lockRatio,
        ratioName: orig.ratioName
    });
    renderSlotsEditor();
    renderOverlays();
};

window.removeSlot = (index) => {
    slots.splice(index, 1);
    renderSlotsEditor();
    renderOverlays();
};

// Interaksi Drag & Resize di Live Preview dengan Rasio Terkunci
function setupInteractiveGuide(guideDiv, index, scaleX, scaleY) {
    const slot = slots[index];

    // 1. Drag Pindah Posisi (Move)
    guideDiv.addEventListener('mousedown', (e) => {
        if (e.target.classList.contains('slot-resize-handle')) return;
        e.preventDefault();
        
        document.querySelectorAll('.slot-editor').forEach(el => el.style.borderLeftColor = '#00ffcc');
        const activeCard = document.getElementById(`slot-editor-${index}`);
        if (activeCard) activeCard.style.borderLeftColor = '#ff0066';

        const startMouseX = e.clientX;
        const startMouseY = e.clientY;
        const startSlotX = slot.x;
        const startSlotY = slot.y;
        const maxX = (templateWidth || 800) - slot.w;
        const maxY = (templateHeight || 1200) - slot.h;

        function onMouseMove(moveEvent) {
            const dx = (moveEvent.clientX - startMouseX) / scaleX;
            const dy = (moveEvent.clientY - startMouseY) / scaleY;
            slot.x = Math.max(0, Math.min(maxX, Math.round(startSlotX + dx)));
            slot.y = Math.max(0, Math.min(maxY, Math.round(startSlotY + dy)));
            syncSlotEditorInputs(index);
            renderOverlays();
        }

        function onMouseUp() {
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
        }

        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    });

    // 2. Drag Sudut Handle: Perbesar / Perkecil dengan Rasio Tetap (Anti-Gepeng)
    const handle = guideDiv.querySelector('.slot-resize-handle');
    if (handle) {
        handle.addEventListener('mousedown', (e) => {
            e.preventDefault();
            e.stopPropagation();

            const startMouseX = e.clientX;
            const startW = slot.w;
            const ratio = slot.aspectRatio || (slot.w / (slot.h || 1)) || (4/3);
            const maxX = (templateWidth || 800) - slot.x;
            const maxY = (templateHeight || 1200) - slot.y;

            function onMouseMove(moveEvent) {
                const dx = (moveEvent.clientX - startMouseX) / scaleX;
                let newW = Math.max(50, Math.round(startW + dx));
                let newH = Math.round(newW / ratio);

                if (newW > maxX) {
                    newW = maxX;
                    newH = Math.round(newW / ratio);
                }
                if (newH > maxY) {
                    newH = maxY;
                    newW = Math.round(newH * ratio);
                }

                slot.w = newW;
                slot.h = newH;
                syncSlotEditorInputs(index);
                renderOverlays();
            }

            function onMouseUp() {
                document.removeEventListener('mousemove', onMouseMove);
                document.removeEventListener('mouseup', onMouseUp);
            }

            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseUp);
        });
    }
}

function renderOverlays() {
    if (!overlaysContainer || !guidesContainer) return;
    overlaysContainer.innerHTML = '';
    guidesContainer.innerHTML = '';
    if (!templateWidth || !templateHeight) return;
    
    const displayWidth = previewImage.clientWidth || previewContainer.clientWidth || 300;
    const displayHeight = previewImage.clientHeight || (displayWidth * (templateHeight / templateWidth));
    
    const scaleX = displayWidth / templateWidth;
    const scaleY = displayHeight / templateHeight;
    
    slots.forEach((slot, index) => {
        const left = Math.round(slot.x * scaleX);
        const top = Math.round(slot.y * scaleY);
        const width = Math.round(slot.w * scaleX);
        const height = Math.round(slot.h * scaleY);
        const ratioLabel = getRatioLabel(slot);

        // 1. LAYER BAWAH (di bawah template PNG): Foto slot
        const slotDiv = document.createElement('div');
        slotDiv.className = 'slot-overlay';
        slotDiv.style.left = `${left}px`;
        slotDiv.style.top = `${top}px`;
        slotDiv.style.width = `${width}px`;
        slotDiv.style.height = `${height}px`;
        slotDiv.innerHTML = `
            <div>Foto ${index + 1}</div>
            <span>${slot.w} × ${slot.h} px</span>
            <span style="font-size:10px; opacity:0.8;">(${ratioLabel})</span>
        `;
        overlaysContainer.appendChild(slotDiv);

        // 2. LAYER PANDUAN (di atas template PNG): Garis panduan interaktif
        if (showGuides) {
            const guideDiv = document.createElement('div');
            guideDiv.className = 'slot-guide-box';
            guideDiv.style.left = `${left}px`;
            guideDiv.style.top = `${top}px`;
            guideDiv.style.width = `${width}px`;
            guideDiv.style.height = `${height}px`;
            guideDiv.innerHTML = `
                <div class="slot-guide-header">
                    <span class="slot-guide-tag">Slot ${index + 1}</span>
                    <span class="slot-ratio-tag">🔒 ${ratioLabel}</span>
                </div>
                <div class="slot-resize-handle" title="Tarik sudut ini untuk perbesar / perkecil (skala terkunci)"></div>
            `;

            setupInteractiveGuide(guideDiv, index, scaleX, scaleY);
            guidesContainer.appendChild(guideDiv);
        }
    });
}

// Re-render when window resizes
window.addEventListener('resize', renderOverlays);

// =========================================
// SAVE TEMPLATE
// =========================================
if (btnSave) {
    btnSave.addEventListener('click', async () => {
        const name = (templateNameInput ? templateNameInput.value : '').trim();
        if (!name || slots.length === 0) {
            showToast('Beri nama template dan tambahkan minimal 1 slot foto!', true);
            return;
        }

        // Clean coordinate data
        const cleanSlots = slots.map(s => ({
            x: Math.round(s.x),
            y: Math.round(s.y),
            w: Math.round(s.w),
            h: Math.round(s.h)
        }));

        const idToSave = editingTemplateId || name.toLowerCase().replace(/[^a-z0-9]/g, '-');

        const config = {
            id: idToSave,
            name: name,
            url: currentTemplateUrl,
            width: templateWidth,
            height: templateHeight,
            photoCount: cleanSlots.length,
            slots: cleanSlots
        };
        
        try {
            btnSave.textContent = 'Menyimpan...';
            btnSave.disabled = true;
            const res = await fetch(`${API_BASE_URL}/api/admin/save-config`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(config)
            });
            const data = await res.json();
            if (data.success) {
                showToast(`✅ Template "${name}" berhasil disimpan!`);
                editingTemplateId = idToSave;
                if (modeText) {
                    modeText.innerHTML = `Mengedit template: <strong>${name}</strong> <span style="opacity:0.6; font-size:12px;">(${idToSave})</span>`;
                }
                // Refresh template manager list
                fetchTemplates();
            } else {
                throw new Error(data.error || 'Gagal menyimpan template');
            }
        } catch (e) {
            showToast('Gagal menyimpan: ' + e.message, true);
        } finally {
            btnSave.textContent = '💾 Simpan Template';
            btnSave.disabled = false;
        }
    });
}

// Initial load: Fetch all templates on page load
document.addEventListener('DOMContentLoaded', () => {
    fetchTemplates();
});
