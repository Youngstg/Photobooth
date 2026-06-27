import { state } from './state.js';
import { loadAssets } from './assets.js';
import { updateClock, updateSessionCount, showScreen, setupUIListeners } from './ui.js';
import { startCamera, startAutomaticCapture } from './camera.js';
import { frameTemplates } from './templates.js';
import { availableFilters, applyFilterToImages } from './filters.js';

// Setup basic decorations and UI
document.addEventListener('DOMContentLoaded', () => {
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
    // Screen 1: Count Selection
    document.querySelectorAll('.count-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const button = e.currentTarget;
            state.photoCount = parseInt(button.dataset.count);
            state.requiredPhotoCount = state.photoCount;
            state.totalCaptureCount = state.photoCount * 4;
            state.currentPhotoIndex = 0;
            state.capturedPhotos = [];
            state.selectedPhotos = [];

            document.getElementById('total-photos').textContent = state.totalCaptureCount;
            startCamera();
        });
    });

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

    if (!state.requiredPhotoCount || state.requiredPhotoCount <= 0) {
        alert('Terjadi kesalahan saat memuat foto. Silakan mulai ulang dari awal.');
        showScreen('screen-count-selection');
        return;
    }
    if (!state.capturedPhotos || state.capturedPhotos.length === 0) {
        alert('Tidak ada foto yang tertangkap. Silakan mulai ulang.');
        showScreen('screen-count-selection');
        return;
    }

    const reviewTitle = document.querySelector('#screen-review h2');
    reviewTitle.textContent = `Pilih ${state.requiredPhotoCount} Foto Terbaik`;

    const reviewInstruction = document.querySelector('#screen-review p');
    reviewInstruction.textContent = `Klik foto untuk memilih/batal pilih (pilih tepat ${state.requiredPhotoCount} foto)`;

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
                if (currentSelected < state.requiredPhotoCount) {
                    photoItem.classList.add('selected');
                } else {
                    alert(`Anda hanya bisa memilih ${state.requiredPhotoCount} foto!`);
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
    btnContinue.disabled = state.selectedPhotos.length !== state.requiredPhotoCount;
    if (state.selectedPhotos.length === state.requiredPhotoCount) {
        btnContinue.textContent = 'Lanjut Pilih Frame';
    } else {
        btnContinue.textContent = `Pilih ${state.requiredPhotoCount - state.selectedPhotos.length} foto lagi`;
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

        filterItem.addEventListener('click', () => {
            // Remove selected class from all
            document.querySelectorAll('#filter-grid .frame-item').forEach(el => el.classList.remove('selected'));
            filterItem.classList.add('selected');
            state.selectedFilter = filter.id;
        });

        filterGrid.appendChild(filterItem);
    });
}

// Helper to give CSS preview before canvas processing
function getCSSFilterForPreview(filterId) {
    if (filterId === 'grayscale') return 'grayscale(100%)';
    if (filterId === 'sepia') return 'sepia(100%)';
    if (filterId === 'retro') return 'contrast(120%) sepia(30%) hue-rotate(-30deg)';
    if (filterId === 'frog') return 'contrast(120%) drop-shadow(0 0 10px green)'; // CSS can't bulge, just a rough indicator
    return 'none';
}

async function showFrameSelection() {
    showScreen('screen-frame-selection');
    const frameGrid = document.getElementById('frame-grid');
    frameGrid.innerHTML = '<div style="text-align: center; padding: 20px; font-family: Courier New;">Loading previews...</div>';

    const availableFrames = frameTemplates[state.photoCount] || [];
    // USE FILTERED PHOTOS INSTEAD OF RAW SELECTED PHOTOS
    const photosToUse = state.filteredPhotos && state.filteredPhotos.length > 0 ? state.filteredPhotos : state.selectedPhotos;
    const photoImages = await Promise.all(photosToUse.map(loadImage));

    frameGrid.innerHTML = '';
    availableFrames.forEach(frame => {
        const frameItem = document.createElement('div');
        frameItem.className = 'frame-item';
        
        const previewCanvas = document.createElement('canvas');
        const scale = 300 / Math.max(frame.width, frame.height);
        previewCanvas.width = frame.width * scale;
        previewCanvas.height = frame.height * scale;
        
        const ctx = previewCanvas.getContext('2d');
        ctx.save();
        ctx.scale(scale, scale);
        frame.render(ctx, photoImages);
        ctx.restore();

        frameItem.innerHTML = `
            <img src="${previewCanvas.toDataURL()}" alt="${frame.name}">
            <div class="frame-name">${frame.name}</div>
        `;
        frameItem.addEventListener('click', () => {
            state.selectedFrame = frame;
            createFinalComposition();
        });
        frameGrid.appendChild(frameItem);
    });
}

async function createFinalComposition() {
    showScreen('screen-composition');
    const canvas = document.getElementById('final-canvas');
    const ctx = canvas.getContext('2d');
    const frame = state.selectedFrame;
    canvas.width = frame.width;
    canvas.height = frame.height;
    
    const photosToUse = state.filteredPhotos && state.filteredPhotos.length > 0 ? state.filteredPhotos : state.selectedPhotos;
    const photos = await Promise.all(photosToUse.map(loadImage));
    frame.render(ctx, photos);
}

function loadImage(src) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = src;
    });
}
