import { initAR } from './ar-filters.js';
import { state } from './state.js';
import { loadAssets } from './assets.js';
import { updateClock, updateSessionCount, showScreen, setupUIListeners } from './ui.js';
import { startCamera, startAutomaticCapture, finishPhotoSession, stopCamera } from './camera.js';
import { allFrameThemes, fetchTemplates } from './templates.js';
import { availableFilters, applyFilterToImages } from './filters.js';
import { initCursorSync } from './cursor-sync.js';
import { initReactions } from './reactions.js';
import { setupRoomLobbyListeners } from './room.js';
import { onMultiplayerMessage, sendMultiplayerMessage, showToast } from './multiplayer.js';

// Setup basic decorations and UI
document.addEventListener('DOMContentLoaded', async () => {
    // Initialize AR Face Filters (MediaPipe)
    initAR();
    
    // Initialize Multiplayer Realtime Engines
    initCursorSync();
    initReactions();
    setupRoomLobbyListeners();
    setupMultiplayerEventHandlers();

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

/**
 * Setup Listeners for synchronized multiplayer events
 */
function setupMultiplayerEventHandlers() {
    // 1. Synchronized Capture Trigger
    onMultiplayerMessage('start_capture', () => {
        console.log('[Multiplayer Event] Partner triggered photo capture');
        startAutomaticCapture(true);
    });

    // 2. Synchronized Photo Added
    onMultiplayerMessage('photo_added', (data) => {
        if (data.photoUrl && !state.capturedPhotos.includes(data.photoUrl)) {
            state.capturedPhotos.push(data.photoUrl);
            updateSessionCount();
            const counter = document.getElementById('photo-counter');
            if (counter) counter.textContent = `${state.capturedPhotos.length} Foto Diambil`;
            const duoCounter = document.getElementById('duo-photo-count');
            if (duoCounter) duoCounter.textContent = `${state.capturedPhotos.length} Foto`;
        }
    });

    // 3. Synchronized Screen Navigation
    onMultiplayerMessage('nav_screen', (data) => {
        console.log('[Multiplayer Event] Navigating to screen:', data.screenId);
        if (data.screenId === 'screen-review') {
            showReviewScreen(true);
        } else if (data.screenId === 'screen-filter-selection') {
            showFilterSelection(true);
        } else if (data.screenId === 'screen-frame-selection') {
            showFrameSelection(true);
        } else if (data.screenId === 'screen-composition') {
            createFinalComposition(true);
        } else {
            showScreen(data.screenId);
        }
    });

    // 4. Synchronized Photo Selection
    onMultiplayerMessage('toggle_photo_select', (data) => {
        const photoItems = document.querySelectorAll('#photo-grid .photo-item');
        const targetItem = Array.from(photoItems).find(el => parseInt(el.dataset.index) === data.index);
        if (targetItem) {
            if (data.selected) {
                targetItem.classList.add('selected');
                addPartnerSelectionBadge(targetItem);
            } else {
                targetItem.classList.remove('selected');
                removePartnerSelectionBadge(targetItem);
            }
            updateSelectedPhotos(true);
        }
    });

    // 5. Synchronized Filter Selection
    onMultiplayerMessage('select_filter', (data) => {
        state.selectedFilter = data.filterId;
        const filterItems = document.querySelectorAll('#filter-grid .frame-item');
        filterItems.forEach(el => {
            if (el.dataset.filterId === data.filterId) {
                el.classList.add('selected', 'selected-by-partner');
            } else {
                el.classList.remove('selected', 'selected-by-partner');
            }
        });
        showToast(`✨ Partner memilih filter: ${data.filterId}`);
    });

    // 6. Synchronized Frame Selection
    onMultiplayerMessage('select_frame', (data) => {
        const found = allFrameThemes.find(f => f.id === data.frameId);
        if (found) {
            state.selectedFrame = found;
            const frameItems = document.querySelectorAll('#frame-grid .frame-item');
            frameItems.forEach(el => {
                if (el.dataset.frameId === data.frameId) {
                    el.classList.add('selected', 'selected-by-partner');
                } else {
                    el.classList.remove('selected', 'selected-by-partner');
                }
            });
            showToast(`🖼️ Partner memilih frame: ${found.name}`);
        }
    });

    // 7. Restart Session
    onMultiplayerMessage('restart_session', () => {
        resetLocalState();
        showScreen('screen-lobby');
        showToast('🔄 Sesi direset oleh partner.');
    });
}

function addPartnerSelectionBadge(el) {
    let badge = el.querySelector('.partner-selected-badge');
    if (!badge) {
        badge = document.createElement('div');
        badge.className = 'partner-selected-badge';
        badge.textContent = `✨ ${state.remotePlayer?.name || 'Partner'}`;
        el.appendChild(badge);
    }
}

function removePartnerSelectionBadge(el) {
    const badge = el.querySelector('.partner-selected-badge');
    if (badge) badge.remove();
}

function setupButtonListeners() {
    // Screen 1: Welcome Screen -> Go to Mode/Lobby Selection
    const startBtn = document.getElementById('btn-start-now');
    if (startBtn) {
        startBtn.addEventListener('click', () => {
            showScreen('screen-lobby');
        });
    }

    // Screen 2: Capture & Finish buttons
    const startCaptureHandler = () => { 
        startAutomaticCapture(false); 
    };
    if (document.getElementById('btn-capture-retro')) document.getElementById('btn-capture-retro').addEventListener('click', startCaptureHandler);
    if (document.getElementById('btn-capture-y2k')) document.getElementById('btn-capture-y2k').addEventListener('click', startCaptureHandler);
    if (document.getElementById('btn-capture-duo')) document.getElementById('btn-capture-duo').addEventListener('click', startCaptureHandler);

    const finishCaptureHandler = () => {
        finishPhotoSession();
    };
    if (document.getElementById('btn-finish-retro')) document.getElementById('btn-finish-retro').addEventListener('click', finishCaptureHandler);
    if (document.getElementById('btn-finish-y2k')) document.getElementById('btn-finish-y2k').addEventListener('click', finishCaptureHandler);
    if (document.getElementById('btn-finish-duo')) document.getElementById('btn-finish-duo').addEventListener('click', finishCaptureHandler);

    // Screen 3: Review buttons
    document.getElementById('btn-retake').addEventListener('click', () => {
        state.currentPhotoIndex = 0;
        state.capturedPhotos = [];
        state.selectedPhotos = [];
        state.filteredPhotos = [];
        state.selectedFilter = 'normal';
        
        if (state.isMultiplayer) {
            sendMultiplayerMessage({
                type: 'nav_screen',
                screenId: 'screen-camera'
            });
        }
        startCamera();
    });

    document.getElementById('btn-continue-to-frame').addEventListener('click', () => {
        if (state.isMultiplayer) {
            sendMultiplayerMessage({
                type: 'nav_screen',
                screenId: 'screen-filter-selection'
            });
        }
        showFilterSelection();
    });

    // Screen 3.5: Filter Selection buttons
    document.getElementById('btn-back-to-review-from-filter').addEventListener('click', () => {
        if (state.isMultiplayer) {
            sendMultiplayerMessage({
                type: 'nav_screen',
                screenId: 'screen-review'
            });
        }
        showReviewScreen();
    });

    document.getElementById('btn-apply-filter').addEventListener('click', async () => {
        const btn = document.getElementById('btn-apply-filter');
        btn.textContent = 'Memproses...';
        btn.disabled = true;
        
        try {
            state.filteredPhotos = await applyFilterToImages(state.selectedPhotos, state.selectedFilter);
            if (state.isMultiplayer) {
                sendMultiplayerMessage({
                    type: 'nav_screen',
                    screenId: 'screen-frame-selection'
                });
            }
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
        if (state.isMultiplayer) {
            sendMultiplayerMessage({
                type: 'nav_screen',
                screenId: 'screen-filter-selection'
            });
        }
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
        if (state.isMultiplayer) {
            sendMultiplayerMessage({
                type: 'restart_session'
            });
        }
        resetLocalState();
        showScreen('screen-lobby');
    });
}

function resetLocalState() {
    state.photoCount = 0;
    state.currentPhotoIndex = 0;
    state.capturedPhotos = [];
    state.selectedPhotos = [];
    state.filteredPhotos = [];
    state.selectedFilter = 'normal';
    state.selectedFrame = null;
}

// Exported for camera.js to call after capturing
export function showReviewScreen(isRemote = false) {
    if (state.timerInterval) clearInterval(state.timerInterval);
    state.isSessionActive = false;
    state.isCapturing = false;
    stopCamera();

    showScreen('screen-review');

    if (!state.capturedPhotos || state.capturedPhotos.length === 0) {
        alert('Tidak ada foto yang tertangkap. Silakan mulai ulang.');
        showScreen('screen-lobby');
        return;
    }

    const reviewTitle = document.querySelector('#screen-review h2');
    reviewTitle.textContent = `Pilih 1 sampai 4 Foto Terbaik`;

    const reviewInstruction = document.querySelector('#screen-review p');
    reviewInstruction.textContent = state.isMultiplayer 
        ? `Kolaborasi: Klik foto bersama partner untuk memilih (Maksimal 4 foto)` 
        : `Klik foto untuk memilih/batal pilih (Maksimal 4 foto)`;

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
            const willSelect = !photoItem.classList.contains('selected');

            if (!willSelect) {
                photoItem.classList.remove('selected');
                removePartnerSelectionBadge(photoItem);
            } else {
                if (currentSelected < 4) {
                    photoItem.classList.add('selected');
                } else {
                    alert(`Maksimal 4 foto yang bisa dipilih!`);
                    return;
                }
            }

            if (state.isMultiplayer) {
                sendMultiplayerMessage({
                    type: 'toggle_photo_select',
                    index: index,
                    selected: willSelect
                });
            }

            updateSelectedPhotos();
        });
        photoGrid.appendChild(photoItem);
    });

    updateSelectedPhotos();
}

function updateSelectedPhotos(isRemote = false) {
    state.selectedPhotos = [];
    document.querySelectorAll('.photo-item.selected').forEach(item => {
        const index = parseInt(item.dataset.index);
        state.selectedPhotos.push(state.capturedPhotos[index]);
    });

    const btnContinue = document.getElementById('btn-continue-to-frame');
    if (!btnContinue) return;

    btnContinue.disabled = state.selectedPhotos.length < 1 || state.selectedPhotos.length > 4;
    if (state.selectedPhotos.length >= 1 && state.selectedPhotos.length <= 4) {
        btnContinue.textContent = `Lanjut Pilih Frame (${state.selectedPhotos.length}/4)`;
    } else {
        btnContinue.textContent = `Pilih 1-4 foto`;
    }
}

export async function showFilterSelection(isRemote = false) {
    showScreen('screen-filter-selection');

    const filterGrid = document.getElementById('filter-grid');
    filterGrid.innerHTML = '';

    if (!state.selectedPhotos || state.selectedPhotos.length === 0) {
        state.selectedPhotos = state.capturedPhotos.slice(0, 1);
    }
    const previewUrl = state.selectedPhotos[0];

    availableFilters.forEach(filter => {
        const filterItem = document.createElement('div');
        filterItem.className = `frame-item ${state.selectedFilter === filter.id ? 'selected' : ''}`;
        filterItem.dataset.filterId = filter.id;
        
        filterItem.innerHTML = `
            <img src="${previewUrl}" alt="${filter.name}" style="filter: ${getCSSFilterForPreview(filter.id)}">
            <div class="frame-name">${filter.name}</div>
        `;

        filterItem.addEventListener('click', async () => {
            document.querySelectorAll('#filter-grid .frame-item').forEach(el => el.classList.remove('selected', 'selected-by-partner'));
            filterItem.classList.add('selected');
            state.selectedFilter = filter.id;
            
            if (state.isMultiplayer) {
                sendMultiplayerMessage({
                    type: 'select_filter',
                    filterId: filter.id
                });
            }
        });

        filterGrid.appendChild(filterItem);
    });
}

export async function showFrameSelection(isRemote = false) {
    showScreen('screen-frame-selection');
    const frameGrid = document.getElementById('frame-grid');
    frameGrid.innerHTML = '';

    const photoCount = state.selectedPhotos.length || 1;
    // Show matching templates or all if none
    let availableFrames = allFrameThemes.filter(t => t.photoCount === photoCount);
    if (availableFrames.length === 0) {
        availableFrames = allFrameThemes;
    }

    if (availableFrames.length === 0) {
        frameGrid.innerHTML = `<p style="color:white; text-align:center; width:100%;">Tidak ada template frame yang tersedia. Silakan cek menu Admin.</p>`;
        return;
    }

    availableFrames.forEach((frame, index) => {
        const div = document.createElement('div');
        div.className = 'frame-item' + (index === 0 ? ' selected' : '');
        div.dataset.frameId = frame.id;
        div.innerHTML = `
            <div class="frame-preview-box">
                <img src="${frame.url}" style="width:100%; height:100%; object-fit:contain;">
            </div>
            <div class="frame-name">${frame.name}</div>
        `;
        
        div.addEventListener('click', () => {
            document.querySelectorAll('.frame-item').forEach(el => el.classList.remove('selected', 'selected-by-partner'));
            div.classList.add('selected');
            state.selectedFrame = frame;

            if (state.isMultiplayer) {
                sendMultiplayerMessage({
                    type: 'select_frame',
                    frameId: frame.id
                });
            }
        });

        frameGrid.appendChild(div);
        
        if (index === 0 && !state.selectedFrame) {
            state.selectedFrame = frame;
        }
    });

    // Add Continue to Final Result button on frame selection screen
    let btnProceed = document.getElementById('btn-proceed-to-composition');
    if (!btnProceed) {
        btnProceed = document.createElement('button');
        btnProceed.id = 'btn-proceed-to-composition';
        btnProceed.className = 'btn-primary';
        btnProceed.style.marginTop = '15px';
        btnProceed.textContent = 'Cetak & Lihat Hasil Foto ✨';
        
        const containerBody = document.querySelector('#screen-frame-selection .container-body');
        if (containerBody) {
            containerBody.appendChild(btnProceed);
        }
    }

    btnProceed.onclick = async () => {
        if (!state.selectedFrame && availableFrames.length > 0) {
            state.selectedFrame = availableFrames[0];
        }
        if (state.isMultiplayer) {
            sendMultiplayerMessage({
                type: 'nav_screen',
                screenId: 'screen-composition'
            });
        }
        await createFinalComposition();
    };
}

function getCSSFilterForPreview(filterId) {
    if (filterId === 'grayscale') return 'grayscale(100%)';
    if (filterId === 'sepia') return 'sepia(100%)';
    if (filterId === 'retro') return 'contrast(120%) sepia(30%) hue-rotate(-30deg)';
    if (filterId === 'frog') return 'contrast(120%) drop-shadow(0 0 10px green)';
    return 'none';
}

async function createFinalComposition(isRemote = false) {
    showScreen('screen-composition');
    const canvas = document.getElementById('final-canvas');
    const ctx = canvas.getContext('2d');
    
    let frame = state.selectedFrame;
    if (!frame && allFrameThemes.length > 0) {
        frame = allFrameThemes[0];
        state.selectedFrame = frame;
    }

    if (!frame) {
        console.warn('No frame template available for composition');
        return;
    }
    
    // HD SCALING: Multiply resolution by 3 for crisp text and images
    const HD_SCALE = 2.5;
    canvas.width = frame.width * HD_SCALE;
    canvas.height = frame.height * HD_SCALE;
    
    ctx.save();
    ctx.scale(HD_SCALE, HD_SCALE);
    
    const photosToUse = state.filteredPhotos && state.filteredPhotos.length > 0 
        ? state.filteredPhotos 
        : (state.selectedPhotos.length > 0 ? state.selectedPhotos : state.capturedPhotos);
        
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
