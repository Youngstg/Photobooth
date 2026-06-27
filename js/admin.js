let currentTemplateUrl = '';
let templateWidth = 0;
let templateHeight = 0;
let slots = []; // Array of {x, y, w, h}

const fileInput = document.getElementById('template-file');
const btnUpload = document.getElementById('btn-upload');
const previewImage = document.getElementById('preview-image');
const previewContainer = document.getElementById('preview-container');
const overlaysContainer = document.getElementById('overlays-container');
const dimensionsInfo = document.getElementById('dimensions-info');
const slotsContainer = document.getElementById('slots-container');
const btnAddSlot = document.getElementById('btn-add-slot');
const btnSave = document.getElementById('btn-save');

btnUpload.addEventListener('click', async () => {
    if (fileInput.files.length === 0) {
        alert('Pilih file PNG terlebih dahulu!');
        return;
    }
    
    const formData = new FormData();
    formData.append('file', fileInput.files[0]);
    
    try {
        btnUpload.textContent = 'Mengunggah...';
        const res = await fetch('/api/admin/upload-template', {
            method: 'POST',
            body: formData
        });
        const data = await res.json();
        
        if (data.error) throw new Error(data.error);
        
        currentTemplateUrl = data.url;
        previewImage.src = currentTemplateUrl;
        previewImage.style.display = 'block';
        
        previewImage.onload = () => {
            templateWidth = previewImage.naturalWidth;
            templateHeight = previewImage.naturalHeight;
            dimensionsInfo.textContent = `Resolusi Asli: ${templateWidth} x ${templateHeight} px`;
            renderOverlays();
        };
        
    } catch (e) {
        alert('Gagal mengunggah: ' + e.message);
    } finally {
        btnUpload.textContent = 'Upload & Preview';
    }
});

btnAddSlot.addEventListener('click', () => {
    slots.push({ x: 0, y: 0, w: 300, h: 400 });
    renderSlotsEditor();
    renderOverlays();
});

function renderSlotsEditor() {
    slotsContainer.innerHTML = '';
    slots.forEach((slot, index) => {
        const div = document.createElement('div');
        div.className = 'slot-editor';
        div.innerHTML = `
            <h4>Foto ke-${index + 1} <button style="width:auto; padding:2px 5px; float:right; background:red;" onclick="removeSlot(${index})">X</button></h4>
            <div class="slot-row">
                <label>X: <input type="number" value="${slot.x}" onchange="updateSlot(${index}, 'x', this.value)"></label>
                <label>Y: <input type="number" value="${slot.y}" onchange="updateSlot(${index}, 'y', this.value)"></label>
            </div>
            <div class="slot-row">
                <label>Lebar: <input type="number" value="${slot.w}" onchange="updateSlot(${index}, 'w', this.value)"></label>
                <label>Tinggi: <input type="number" value="${slot.h}" onchange="updateSlot(${index}, 'h', this.value)"></label>
            </div>
        `;
        slotsContainer.appendChild(div);
    });
}

window.removeSlot = (index) => {
    slots.splice(index, 1);
    renderSlotsEditor();
    renderOverlays();
};

window.updateSlot = (index, field, value) => {
    slots[index][field] = parseInt(value) || 0;
    renderOverlays();
};

function renderOverlays() {
    overlaysContainer.innerHTML = '';
    if (!templateWidth || !templateHeight) return;
    
    // We must scale the overlay coordinates based on how the image is scaled in the browser
    const displayWidth = previewImage.clientWidth;
    const displayHeight = previewImage.clientHeight;
    
    const scaleX = displayWidth / templateWidth;
    const scaleY = displayHeight / templateHeight;
    
    slots.forEach((slot, index) => {
        const div = document.createElement('div');
        div.className = 'slot-overlay';
        div.textContent = index + 1;
        div.style.left = (slot.x * scaleX) + 'px';
        div.style.top = (slot.y * scaleY) + 'px';
        div.style.width = (slot.w * scaleX) + 'px';
        div.style.height = (slot.h * scaleY) + 'px';
        overlaysContainer.appendChild(div);
    });
}

// Re-render when window resizes because image display size changes
window.addEventListener('resize', renderOverlays);

btnSave.addEventListener('click', async () => {
    const name = document.getElementById('template-name').value.trim();
    if (!name || !currentTemplateUrl || slots.length === 0) {
        alert('Pastikan template sudah diupload, memiliki nama, dan minimal 1 slot foto!');
        return;
    }
    
    const config = {
        id: name.toLowerCase().replace(/[^a-z0-9]/g, '-'),
        name: name,
        url: currentTemplateUrl,
        width: templateWidth,
        height: templateHeight,
        photoCount: slots.length,
        slots: slots
    };
    
    try {
        btnSave.textContent = 'Menyimpan...';
        const res = await fetch('/api/admin/save-config', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(config)
        });
        const data = await res.json();
        if (data.success) {
            alert('Template berhasil disimpan! Silakan kembali ke halaman utama (Photobooth).');
        } else {
            throw new Error(data.error || 'Unknown error');
        }
    } catch (e) {
        alert('Gagal menyimpan: ' + e.message);
    } finally {
        btnSave.textContent = '💾 Simpan Template';
    }
});
