import { state } from './state.js';
import { loadAssets } from './assets.js';
import { updateClock, updateSessionCount, showScreen, setupUIListeners } from './ui.js?v=2';
import { startCamera, startAutomaticCapture } from './camera.js';
import { allFrameThemes, fetchTemplates } from './templates.js';
import { availableFilters, applyFilterToImages } from './filters.js';

// Setup basic decorations and UI
document.addEventListener('DOMContentLoaded', async () => {
    await fetchTemplates();
    loadAssets().then(() => {
        console.log('Assets loaded from main');
    });

    setupUIListeners();
    updateClock();
    setInterval(updateClock, 1000);
    updateSessionCount();

    setupButtonListeners();
});

function setupButtonListeners() {
    // Screen 1: Welcome Screen
    const startBtn = document.getElementById('btn-start-now');
    if (startBtn) {
        startBtn.addEventListener('click', () => {
            state.currentPhotoIndex = 0;
            state.capturedPhotos = [];
            state.selectedPhotos = [];
            startCamera();
        });
    }

    // Screen 2: Capture button
    document.getElementById('btn-capture').addEventListener('click', () => {
        startAutomaticCapture();
    });

    // Screen 3: Review buttons
    document.getElementById('btn-retake').addEventListener('click', () => {
        state.currentPhotoIndex = 0;
        state.capturedPhotos = [];
        state.selectedPhotos = [];
        state.filteredPhotos = [];
        state.selectedFilter = 'normal';
        startCamera();
    });

    document.getElementById('btn-continue-to-frame').addEventListener('click', () => {
        showFilterSelection();
    });

    // Screen 3.5: Filter Selection buttons
    document.getElementById('btn-back-to-review-from-filter').addEventListener('click', () => {
        showReviewScreen();
    });

    document.getElementById('btn-apply-filter').addEventListener('click', async () => {
        // Here we apply filter and go to frame selection
        const btn = document.getElementById('btn-apply-filter');
        btn.textContent = 'Memproses...';
        btn.disabled = true;
        
        try {
            state.filteredPhotos = await applyFilterToImages(state.selectedPhotos, state.selectedFilter);
            showFrameSelection();
        } catch(e) {
            console.error('Error applying filter', e);
            alert('Gagal menerapkan filter!');
        } finally {
            btn.textContent = 'Lanjut Pilih Frame';
            btn.disabled = false;
        }
    });

    // Screen 4: Frame selection back button
    document.getElementById('btn-back-to-review').addEventListener('click', () => {
        showFilterSelection();
    });

    // Screen 5: Composition buttons
    document.getElementById('btn-download').addEventListener('click', () => {
        const canvas = document.getElementById('final-canvas');
        const link = document.createElement('a');
        link.download = `photobooth-${Date.now()}.jpg`;
        link.href = canvas.toDataURL('image/jpeg', 0.95);
        link.click();
    });

    document.getElementById('btn-restart').addEventListener('click', () => {
        state.photoCount = 0;
        state.currentPhotoIndex = 0;
        state.capturedPhotos = [];
        state.selectedPhotos = [];
        state.filteredPhotos = [];
        state.selectedFilter = 'normal';
        state.selectedFrame = null;
        showScreen('screen-count-selection');
    });
}

// Exported for camera.js to call after capturing
export function showReviewScreen() {
    showScreen('screen-review');

    
    if (!state.capturedPhotos || state.capturedPhotos.length === 0) {
        alert('Tidak ada foto yang tertangkap. Silakan mulai ulang.');
        showScreen('screen-count-selection');
        return;
    }

    const reviewTitle = document.querySelector('#screen-review h2');
    reviewTitle.textContent = `Pilih 1 sampai 4 Foto Terbaik`;

    const reviewInstruction = document.querySelector('#screen-review p');
    reviewInstruction.textContent = `Klik foto untuk memilih/batal pilih (Maksimal 4 foto)`;

    const photoGrid = document.getElementById('photo-grid');
    photoGrid.innerHTML = '';

    state.capturedPhotos.forEach((photoUrl, index) => {
        const photoItem = document.createElement('div');
        photoItem.className = 'photo-item';
        photoItem.dataset.index = index;
        photoItem.innerHTML = `
            <img src="${photoUrl}" alt="Photo ${index + 1}">
            <div class="check-mark">✓</div>
        `;

        photoItem.addEventListener('click', () => {
            const currentSelected = document.querySelectorAll('.photo-item.selected').length;
            if (photoItem.classList.contains('selected')) {
                photoItem.classList.remove('selected');
            } else {
                if (currentSelected < 4) {
                    photoItem.classList.add('selected');
                } else {
                    alert(`Maksimal 4 foto yang bisa dipilih!`);
                }
            }
            updateSelectedPhotos();
        });
        photoGrid.appendChild(photoItem);
    });

    updateSelectedPhotos();
}

function updateSelectedPhotos() {
    state.selectedPhotos = [];
    document.querySelectorAll('.photo-item.selected').forEach(item => {
        const index = parseInt(item.dataset.index);
        state.selectedPhotos.push(state.capturedPhotos[index]);
    });

    const btnContinue = document.getElementById('btn-continue-to-frame');
    btnContinue.disabled = state.selectedPhotos.length < 1 || state.selectedPhotos.length > 4;
    if (state.selectedPhotos.length >= 1 && state.selectedPhotos.length <= 4) {
        btnContinue.textContent = 'Lanjut Pilih Frame';
    } else {
        btnContinue.textContent = `Pilih foto (Maks. 4)`;
    }
}

export async function showFilterSelection() {
    showScreen('screen-filter-selection');

    const filterGrid = document.getElementById('filter-grid');
    filterGrid.innerHTML = '';

    // Create a small preview from the first selected photo
    const previewUrl = state.selectedPhotos[0];

    availableFilters.forEach(filter => {
        const filterItem = document.createElement('div');
        filterItem.className = `frame-item ${state.selectedFilter === filter.id ? 'selected' : ''}`;
        
        filterItem.innerHTML = `
            <img src="${previewUrl}" alt="${filter.name}" style="filter: ${getCSSFilterForPreview(filter.id)}">
            <div class="frame-name">${filter.name}</div>
        `;

        filterItem.addEventListener('click', async () => {
            // Remove selected class from all
            document.querySelectorAll('#filter-grid .frame-item').forEach(el => el.classList.remove('selected'));
            filterItem.classList.add('selected');
            state.selectedFilter = filter.id;
            
            // Auto advance
            const btn = document.getElementById('btn-apply-filter');
            btn.textContent = 'Memproses...';
            btn.disabled = true;
            
            try {
                state.filteredPhotos = await applyFilterToImages(state.selectedPhotos, state.selectedFilter);
                showFrameSelection();
            } catch(e) {
                console.error('Error applying filter', e);
                alert('Gagal menerapkan filter!');
            } finally {
                btn.textContent = 'Lanjut Pilih Frame';
                btn.disabled = false;
            }
        });

        filterGrid.appendChild(filterItem);
    });
}

export async function showFrameSelection() {
    showScreen('screen-frames');
    const frameGrid = document.getElementById('frame-grid');
    frameGrid.innerHTML = '';

    // Filter templates by photoCount
    const availableFrames = allFrameThemes.filter(t => t.photoCount === state.photoCount);

    if (availableFrames.length === 0) {
        frameGrid.innerHTML = `<p style="color:white; text-align:center; width:100%;">Tidak ada template dengan ${state.photoCount} foto. Silakan buat di menu Admin.</p>`;
    }

    availableFrames.forEach((frame, index) => {
        const div = document.createElement('div');
        div.className = 'frame-item' + (index === 0 ? ' selected' : '');
        div.innerHTML = `
            <div class="frame-preview-box">
                <img src="${frame.url}" style="width:100%; height:100%; object-fit:contain;">
            </div>
            <div class="frame-name">${frame.name}</div>
        `;
        
        div.addEventListener('click', () => {
            document.querySelectorAll('.frame-item').forEach(el => el.classList.remove('selected'));
            div.classList.add('selected');
            state.selectedFrame = frame;
        });

        frameGrid.appendChild(div);
        
        if (index === 0) {
            state.selectedFrame = frame;
        }
    });
}

function getCSSFilterForPreview(filterId) {
    if (filterId === 'grayscale') return 'grayscale(100%)';
    if (filterId === 'sepia') return 'sepia(100%)';
    if (filterId === 'retro') return 'contrast(120%) sepia(30%) hue-rotate(-30deg)';
    if (filterId === 'frog') return 'contrast(120%) drop-shadow(0 0 10px green)'; // CSS can't bulge, just a rough indicator
    return 'none';
}



async function createFinalComposition() {
    showScreen('screen-composition');
    const canvas = document.getElementById('final-canvas');
    const ctx = canvas.getContext('2d');
    const frame = state.selectedFrame;
    
    // HD SCALING: Multiply resolution by 3 for crisp text and images
    const HD_SCALE = 3;
    canvas.width = frame.width * HD_SCALE;
    canvas.height = frame.height * HD_SCALE;
    
    ctx.save();
    ctx.scale(HD_SCALE, HD_SCALE);
    
    const photosToUse = state.filteredPhotos && state.filteredPhotos.length > 0 ? state.filteredPhotos : state.selectedPhotos;
    const photos = await Promise.all(photosToUse.map(loadImage));
    await frame.render(ctx, photos);
    ctx.restore();
}

function loadImage(src) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = src;
    });
}
