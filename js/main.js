import { initAR } from './ar-filters.js';
import { state } from './state.js';
import { loadAssets } from './assets.js';
import { updateClock, updateSessionCount, showScreen, setupUIListeners } from './ui.js';
import { startCamera, startAutomaticCapture, finishPhotoSession, stopCamera } from './camera.js';
import { allFrameThemes, fetchTemplates } from './templates.js';
import { availableFilters, applyFilterToImages } from './filters.js';
import { initCursorSync } from './cursor-sync.js';
import { initReactions } from './reactions.js';
import { setupRoomLobbyListeners, startDuoSession } from './room.js';
import { onMultiplayerMessage, sendMultiplayerMessage, showToast, showConfirm } from './multiplayer.js';

let isComposing = false;

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

    // 2. Synchronized Photo Taken (FIX #2 Critical: no photo data sent over DataChannel)
    onMultiplayerMessage('photo_taken', (data) => {
        console.log('[Multiplayer Event] Partner photo sync. Count:', data.count);
        updateSessionCount();
        const duoCounter = document.getElementById('duo-photo-count');
        if (duoCounter) duoCounter.textContent = `${state.capturedPhotos.length} Foto`;
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
        } else if (data.screenId === 'screen-camera') {
            startDuoSession();
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
        showToast(`Partner memilih filter: ${data.filterId}`);
    });

    // 6. Synchronized Frame Selection (Works on both Screen 4 and Screen 5)
    onMultiplayerMessage('select_frame', async (data) => {
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
            // Update Screen 5 composition template cards
            const compItems = document.querySelectorAll('#composition-template-list .comp-template-card');
            compItems.forEach(el => {
                if (el.dataset.frameId === data.frameId) {
                    el.classList.add('selected');
                } else {
                    el.classList.remove('selected');
                }
            });
            const compScreen = document.getElementById('screen-composition');
            if (compScreen && compScreen.classList.contains('active')) {
                await createFinalComposition(true);
            }
            showToast(`Partner memilih template: ${found.name}`);
        }
    });

    // 7. Restart Session
    onMultiplayerMessage('restart_session', () => {
        resetLocalState();
        showScreen('screen-lobby');
        showToast('Sesi direset oleh partner.');
    });
}

function addPartnerSelectionBadge(el) {
    let badge = el.querySelector('.partner-selected-badge');
    if (!badge) {
        badge = document.createElement('div');
        badge.className = 'partner-selected-badge';
        badge.innerHTML = `<svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor" style="display:inline-block; vertical-align:middle; margin-right:4px;"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>${state.remotePlayer?.name || 'Partner'}`;
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
    if (document.getElementById('btn-capture-y2k')) document.getElementById('btn-capture-y2k').addEventListener('click', startCaptureHandler);
    if (document.getElementById('btn-capture-duo')) document.getElementById('btn-capture-duo').addEventListener('click', startCaptureHandler);

    const finishCaptureHandler = () => {
        finishPhotoSession();
    };
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
            const photosToFilter = (state.selectedPhotos && state.selectedPhotos.length > 0)
                ? state.selectedPhotos
                : (state.capturedPhotos && state.capturedPhotos.length > 0 ? state.capturedPhotos.slice(0, 4) : []);
            
            state.filteredPhotos = await applyFilterToImages(photosToFilter, state.selectedFilter || 'normal');
            if (state.isMultiplayer) {
                sendMultiplayerMessage({
                    type: 'nav_screen',
                    screenId: 'screen-frame-selection'
                });
            }
            showFrameSelection();
        } catch(e) {
            console.error('Error applying filter', e);
            // FIX #10 (High): Replace alert() with showToast()
            showToast('❌ Gagal menerapkan filter. Silakan coba lagi.');
        } finally {
            btn.textContent = 'Lanjut Pilih Frame';
            btn.disabled = false;
        }
    });

    // Screen 4: Frame selection back & proceed buttons
    document.getElementById('btn-back-to-review').addEventListener('click', () => {
        if (state.isMultiplayer) {
            sendMultiplayerMessage({
                type: 'nav_screen',
                screenId: 'screen-filter-selection'
            });
        }
        showFilterSelection();
    });

    const btnProceedStatic = document.getElementById('btn-proceed-to-composition');
    if (btnProceedStatic) {
        btnProceedStatic.addEventListener('click', async () => {
            if (isComposing) return;
            if (!state.selectedFrame && allFrameThemes.length > 0) {
                state.selectedFrame = allFrameThemes[0];
            }
            if (state.isMultiplayer) {
                sendMultiplayerMessage({
                    type: 'nav_screen',
                    screenId: 'screen-composition'
                });
            }
            await createFinalComposition();
        });
    }

    // Screen 5: Composition buttons
    // FIX: Also add improve download filename
    document.getElementById('btn-download').addEventListener('click', () => {
        const canvas = document.getElementById('final-canvas');
        const link = document.createElement('a');
        // FIX #35 (Minor): Human-readable filename instead of raw epoch timestamp
        const now = new Date();
        const pad = n => String(n).padStart(2, '0');
        const dateStr = `${now.getFullYear()}${pad(now.getMonth()+1)}${pad(now.getDate())}`;
        const timeStr = `${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
        link.download = `cutesnaps-${dateStr}-${timeStr}.jpg`;
        link.href = canvas.toDataURL('image/jpeg', 0.95);
        link.click();
        showToast('📥 Foto berhasil diunduh!');
    });

    let isRestartConfirmActive = false;
    document.getElementById('btn-restart').addEventListener('click', async () => {
        if (isRestartConfirmActive) return;
        isRestartConfirmActive = true;
        try {
            // FIX #29 (Medium): Confirm before losing all photos
            const confirmed = await showConfirm(
                'Mulai Sesi Baru?',
                'Semua foto yang belum diunduh akan hilang permanen. Lanjutkan?',
                'Ya, Mulai Baru',
                'Batal'
            );
            if (!confirmed) return;
            
            if (state.isMultiplayer) {
                sendMultiplayerMessage({
                    type: 'restart_session'
                });
            }
            resetLocalState();
            showScreen('screen-lobby');
        } finally {
            isRestartConfirmActive = false;
        }
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
export function showReviewScreen(isRemote = false, explicitPhotos = null) {
    if (state.timerInterval) clearInterval(state.timerInterval);
    state.isSessionActive = false;
    state.isCapturing = false;
    stopCamera();

    // 1. Prioritize explicitPhotos argument
    if (explicitPhotos && Array.isArray(explicitPhotos) && explicitPhotos.length > 0) {
        state.capturedPhotos = [...explicitPhotos];
    }

    // 2. Sync from global singleton window.__PHOTOBOOTH_STATE__ and window.__CAPTURED_PHOTOS__
    if ((!state.capturedPhotos || state.capturedPhotos.length === 0) && typeof window !== 'undefined') {
        if (window.__PHOTOBOOTH_STATE__ && Array.isArray(window.__PHOTOBOOTH_STATE__.capturedPhotos) && window.__PHOTOBOOTH_STATE__.capturedPhotos.length > 0) {
            state.capturedPhotos = [...window.__PHOTOBOOTH_STATE__.capturedPhotos];
        } else if (window.__CAPTURED_PHOTOS__ && Array.isArray(window.__CAPTURED_PHOTOS__) && window.__CAPTURED_PHOTOS__.length > 0) {
            state.capturedPhotos = [...window.__CAPTURED_PHOTOS__];
        }
    }

    // 3. Fallback to sessionStorage if still empty
    if (!state.capturedPhotos || state.capturedPhotos.length === 0) {
        try {
            const cached = sessionStorage.getItem('cutesnaps_captured_photos');
            if (cached) {
                const parsed = JSON.parse(cached);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    state.capturedPhotos = parsed;
                    if (window.__PHOTOBOOTH_STATE__) window.__PHOTOBOOTH_STATE__.capturedPhotos = parsed;
                }
            }
        } catch(e) {}
    }

    showScreen('screen-review');

    if (!state.capturedPhotos || state.capturedPhotos.length === 0) {
        showToast('📷 Belum ada foto yang diambil.');
        const reviewTitle = document.querySelector('#screen-review h2');
        if (reviewTitle) reviewTitle.textContent = 'Belum Ada Foto';
        const reviewInstruction = document.querySelector('#screen-review p');
        if (reviewInstruction) reviewInstruction.textContent = 'Kamu belum mengambil foto di sesi ini.';
        const photoGrid = document.getElementById('photo-grid');
        if (photoGrid) {
            photoGrid.innerHTML = `
                <div style="text-align:center; padding: 40px 20px; width: 100%; grid-column: 1 / -1;">
                    <div style="font-size: 54px; margin-bottom: 15px;">📸</div>
                    <p style="font-size: 18px; font-weight: bold; margin-bottom: 25px; color: #2C2416;">Belum ada foto yang tersimpan</p>
                    <button id="btn-empty-retake" class="btn-primary" style="font-size: 18px; padding: 14px 32px; border-radius: 25px;">
                        📷 Ambil Foto Sekarang
                    </button>
                </div>
            `;
            const btnEmptyRetake = document.getElementById('btn-empty-retake');
            if (btnEmptyRetake) {
                btnEmptyRetake.addEventListener('click', () => {
                    startCamera();
                });
            }
        }
        const btnContinue = document.getElementById('btn-continue-to-frame');
        if (btnContinue) {
            btnContinue.disabled = true;
            btnContinue.textContent = 'Pilih 1-4 foto';
        }
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

    const maxToSelect = Math.min(state.capturedPhotos.length, 4);
    state.capturedPhotos.forEach((photoUrl, index) => {
        const photoItem = document.createElement('div');
        const isPreSelected = index < maxToSelect;
        photoItem.className = `photo-item ${isPreSelected ? 'selected' : ''}`;
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
                    // FIX #10 (High): Replace alert() with showToast()
                    showToast('⚠️ Maksimal 4 foto yang bisa dipilih!');
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
        if (state.capturedPhotos && state.capturedPhotos[index]) {
            state.selectedPhotos.push(state.capturedPhotos[index]);
        }
    });

    if (state.selectedPhotos.length === 0 && state.capturedPhotos && state.capturedPhotos.length > 0) {
        state.selectedPhotos = state.capturedPhotos.slice(0, 4);
    }

    const btnContinue = document.getElementById('btn-continue-to-frame');
    if (!btnContinue) return;

    btnContinue.disabled = state.selectedPhotos.length < 1 || state.selectedPhotos.length > 4;
    if (state.selectedPhotos.length >= 1 && state.selectedPhotos.length <= 4) {
        btnContinue.textContent = `Lanjut Pilih Filter (${state.selectedPhotos.length}/4) ➔`;
    } else {
        btnContinue.textContent = `Pilih 1-4 foto`;
    }
}

export async function showFilterSelection(isRemote = false) {
    showScreen('screen-filter-selection');

    const filterGrid = document.getElementById('filter-grid');
    filterGrid.innerHTML = '';

    if (!state.selectedPhotos || state.selectedPhotos.length === 0) {
        if (state.capturedPhotos && state.capturedPhotos.length > 0) {
            state.selectedPhotos = state.capturedPhotos.slice(0, Math.min(4, state.capturedPhotos.length));
        } else if (typeof window !== 'undefined' && window.__CAPTURED_PHOTOS__ && window.__CAPTURED_PHOTOS__.length > 0) {
            state.selectedPhotos = window.__CAPTURED_PHOTOS__.slice(0, Math.min(4, window.__CAPTURED_PHOTOS__.length));
        }
    }
    const previewUrl = (state.selectedPhotos && state.selectedPhotos.length > 0) 
        ? state.selectedPhotos[0] 
        : (state.capturedPhotos && state.capturedPhotos.length > 0 ? state.capturedPhotos[0] : '');

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
        const previewSrc = getFramePreviewSrc(frame);
        div.innerHTML = `
            <div class="frame-preview-box">
                <img src="${previewSrc}" alt="${frame.name}">
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

    // Proceed to composition button
    const btnProceed = document.getElementById('btn-proceed-to-composition');
    if (btnProceed) {
        btnProceed.style.display = 'inline-block';
    }
}

// Generate thumbnail preview for frames (both transparent PNG and procedural canvas)
function getFramePreviewSrc(frame) {
    if (frame.url && frame.url.trim().length > 0 && !frame.url.includes('AAAAASUVORK5CYII=')) {
        return frame.url;
    }
    const canvas = document.createElement('canvas');
    canvas.width = 160;
    canvas.height = 220;
    const ctx = canvas.getContext('2d');
    
    const targetW = frame.width || 800;
    const targetH = frame.height || 1200;
    const scale = Math.min((canvas.width - 16) / targetW, (canvas.height - 16) / targetH);
    const renderW = targetW * scale;
    const renderH = targetH * scale;
    const offsetX = (canvas.width - renderW) / 2;
    const offsetY = (canvas.height - renderH) / 2;
    
    // Background
    ctx.fillStyle = frame.bgColor || '#1C1536';
    ctx.fillRect(offsetX, offsetY, renderW, renderH);
    
    // Outer border
    ctx.strokeStyle = frame.borderColor || '#FF76AC';
    ctx.lineWidth = 2.5;
    ctx.strokeRect(offsetX + 1, offsetY + 1, renderW - 2, renderH - 2);
    
    // Slots
    const slots = frame.slots || [];
    slots.forEach((s, idx) => {
        const sx = offsetX + (s.x * scale);
        const sy = offsetY + (s.y * scale);
        const sw = Math.max(2, s.w * scale);
        const sh = Math.max(2, s.h * scale);
        
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(sx, sy, sw, sh);
        ctx.strokeStyle = frame.borderColor || '#2C2416';
        ctx.lineWidth = 1;
        ctx.strokeRect(sx, sy, sw, sh);
        
        ctx.fillStyle = '#8370F5';
        ctx.font = 'bold 9px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`Foto ${idx + 1}`, sx + sw / 2, sy + sh / 2);
    });
    
    const footerText = frame.footerText || frame.name || 'CUTE SNAPS';
    ctx.fillStyle = frame.borderColor || '#FFFFFF';
    ctx.font = 'bold 8px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(footerText.substring(0, 18), offsetX + renderW / 2, offsetY + renderH - 6);
    
    return canvas.toDataURL('image/png');
}

// getCSSFilterForPreview now imported from filters.js (kept here as local fallback)
function getCSSFilterForPreview(filterId) {
    if (filterId === 'grayscale') return 'grayscale(100%)';
    if (filterId === 'sepia') return 'sepia(100%)';
    if (filterId === 'retro') return 'contrast(108%) saturate(115%) sepia(20%) hue-rotate(-5deg)';
    if (filterId === 'frog') return 'saturate(130%) hue-rotate(80deg) brightness(115%)';
    return 'none';
}

let cachedLoadedPhotos = [];
let renderRafId = null;
let isInteractivitySetup = false;

function debouncedFastRender() {
    if (renderRafId) cancelAnimationFrame(renderRafId);
    renderRafId = requestAnimationFrame(async () => {
        const canvas = document.getElementById('final-canvas');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const frame = state.selectedFrame;
        if (!frame || !cachedLoadedPhotos || cachedLoadedPhotos.length === 0) return;
        const HD_SCALE = 2.5;
        const targetW = Math.round((frame.width || 800) * HD_SCALE);
        const targetH = Math.round((frame.height || 1200) * HD_SCALE);
        await frame.render(ctx, cachedLoadedPhotos, targetW, targetH, state.slotAdjustments);
    });
}

function getSlotAtClientPos(clientX, clientY) {
    const canvas = document.getElementById('final-canvas');
    if (!canvas || !state.selectedFrame) return -1;
    const rect = canvas.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return -1;

    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const canvasX = (clientX - rect.left) * scaleX;
    const canvasY = (clientY - rect.top) * scaleY;

    const frame = state.selectedFrame;
    const HD_SCALE = canvas.width / (frame.width || 800);
    const slots = frame.slots || [];

    for (let i = 0; i < slots.length; i++) {
        const s = slots[i];
        const sx = s.x * HD_SCALE;
        const sy = s.y * HD_SCALE;
        const sw = s.w * HD_SCALE;
        const sh = s.h * HD_SCALE;
        if (canvasX >= sx && canvasX <= sx + sw && canvasY >= sy && canvasY <= sy + sh) {
            return i;
        }
    }
    return -1;
}

function initCompositionInteractivity() {
    const canvas = document.getElementById('final-canvas');
    if (!canvas || isInteractivitySetup) return;
    isInteractivitySetup = true;

    let activeDraggingSlot = -1;
    let dragStartX = 0;
    let dragStartY = 0;
    let initialOffsetX = 0;
    let initialOffsetY = 0;
    let isDragging = false;

    // Reset button
    const btnReset = document.getElementById('btn-reset-adjustments');
    if (btnReset) {
        btnReset.onclick = () => {
            state.slotAdjustments = {};
            debouncedFastRender();
            showToast('↺ Posisi dan zoom foto telah direset');
        };
    }

    // Hover cursor
    canvas.addEventListener('mousemove', (e) => {
        if (isDragging) return;
        const slotIdx = getSlotAtClientPos(e.clientX, e.clientY);
        canvas.style.cursor = slotIdx !== -1 ? 'grab' : 'default';
    });

    // Mouse drag start
    canvas.addEventListener('mousedown', (e) => {
        const slotIdx = getSlotAtClientPos(e.clientX, e.clientY);
        if (slotIdx === -1) return;
        activeDraggingSlot = slotIdx;
        isDragging = true;
        dragStartX = e.clientX;
        dragStartY = e.clientY;

        if (!state.slotAdjustments) state.slotAdjustments = {};
        if (!state.slotAdjustments[slotIdx]) {
            state.slotAdjustments[slotIdx] = { offsetX: 0, offsetY: 0, scale: 1.0 };
        }
        initialOffsetX = state.slotAdjustments[slotIdx].offsetX || 0;
        initialOffsetY = state.slotAdjustments[slotIdx].offsetY || 0;
        canvas.style.cursor = 'grabbing';
        e.preventDefault();
    });

    // Window mouse move
    window.addEventListener('mousemove', (e) => {
        if (!isDragging || activeDraggingSlot === -1) return;
        const canvasEl = document.getElementById('final-canvas');
        if (!canvasEl) return;
        const rect = canvasEl.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) return;

        const deltaX = (e.clientX - dragStartX) / rect.width;
        const deltaY = (e.clientY - dragStartY) / rect.height;

        const adj = state.slotAdjustments[activeDraggingSlot];
        const scale = adj.scale || 1.0;
        adj.offsetX = initialOffsetX + (deltaX * 1.6 / scale);
        adj.offsetY = initialOffsetY + (deltaY * 1.6 / scale);

        debouncedFastRender();
    });

    window.addEventListener('mouseup', () => {
        if (isDragging) {
            isDragging = false;
            activeDraggingSlot = -1;
            const canvasEl = document.getElementById('final-canvas');
            if (canvasEl) canvasEl.style.cursor = 'grab';
        }
    });

    // Mouse wheel zoom
    canvas.addEventListener('wheel', (e) => {
        const slotIdx = getSlotAtClientPos(e.clientX, e.clientY);
        if (slotIdx === -1) return;
        e.preventDefault();

        if (!state.slotAdjustments) state.slotAdjustments = {};
        if (!state.slotAdjustments[slotIdx]) {
            state.slotAdjustments[slotIdx] = { offsetX: 0, offsetY: 0, scale: 1.0 };
        }
        const adj = state.slotAdjustments[slotIdx];
        const delta = e.deltaY < 0 ? 0.08 : -0.08;
        adj.scale = Math.max(0.6, Math.min(3.0, (adj.scale || 1.0) + delta));

        debouncedFastRender();
    }, { passive: false });

    // Touch support for mobile devices
    let touchStartDist = 0;
    let initialTouchScale = 1.0;

    canvas.addEventListener('touchstart', (e) => {
        if (e.touches.length === 1) {
            const touch = e.touches[0];
            const slotIdx = getSlotAtClientPos(touch.clientX, touch.clientY);
            if (slotIdx === -1) return;
            activeDraggingSlot = slotIdx;
            isDragging = true;
            dragStartX = touch.clientX;
            dragStartY = touch.clientY;

            if (!state.slotAdjustments) state.slotAdjustments = {};
            if (!state.slotAdjustments[slotIdx]) {
                state.slotAdjustments[slotIdx] = { offsetX: 0, offsetY: 0, scale: 1.0 };
            }
            initialOffsetX = state.slotAdjustments[slotIdx].offsetX || 0;
            initialOffsetY = state.slotAdjustments[slotIdx].offsetY || 0;
            e.preventDefault();
        } else if (e.touches.length === 2) {
            const t1 = e.touches[0];
            const t2 = e.touches[1];
            touchStartDist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
            const midX = (t1.clientX + t2.clientX) / 2;
            const midY = (t1.clientY + t2.clientY) / 2;
            activeDraggingSlot = getSlotAtClientPos(midX, midY);
            if (activeDraggingSlot !== -1) {
                if (!state.slotAdjustments) state.slotAdjustments = {};
                if (!state.slotAdjustments[activeDraggingSlot]) {
                    state.slotAdjustments[activeDraggingSlot] = { offsetX: 0, offsetY: 0, scale: 1.0 };
                }
                initialTouchScale = state.slotAdjustments[activeDraggingSlot].scale || 1.0;
            }
            e.preventDefault();
        }
    }, { passive: false });

    canvas.addEventListener('touchmove', (e) => {
        if (e.touches.length === 1 && isDragging && activeDraggingSlot !== -1) {
            const touch = e.touches[0];
            const rect = canvas.getBoundingClientRect();
            const deltaX = (touch.clientX - dragStartX) / rect.width;
            const deltaY = (touch.clientY - dragStartY) / rect.height;

            const adj = state.slotAdjustments[activeDraggingSlot];
            const scale = adj.scale || 1.0;
            adj.offsetX = initialOffsetX + (deltaX * 1.6 / scale);
            adj.offsetY = initialOffsetY + (deltaY * 1.6 / scale);

            debouncedFastRender();
            e.preventDefault();
        } else if (e.touches.length === 2 && activeDraggingSlot !== -1) {
            const t1 = e.touches[0];
            const t2 = e.touches[1];
            const dist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
            if (touchStartDist > 0) {
                const ratio = dist / touchStartDist;
                const adj = state.slotAdjustments[activeDraggingSlot];
                adj.scale = Math.max(0.6, Math.min(3.0, initialTouchScale * ratio));
                debouncedFastRender();
            }
            e.preventDefault();
        }
    }, { passive: false });

    canvas.addEventListener('touchend', () => {
        isDragging = false;
        activeDraggingSlot = -1;
        touchStartDist = 0;
    });
}

function renderCompositionTemplateSidebar() {
    const list = document.getElementById('composition-template-list');
    if (!list) return;
    list.innerHTML = '';

    const counter = document.getElementById('template-count-badge');
    if (counter) counter.textContent = `${allFrameThemes.length} Template`;

    allFrameThemes.forEach((frame) => {
        const item = document.createElement('div');
        const isSelected = state.selectedFrame && state.selectedFrame.id === frame.id;
        item.className = `comp-template-card ${isSelected ? 'selected' : ''}`;
        item.dataset.frameId = frame.id;

        const previewSrc = getFramePreviewSrc(frame);
        item.innerHTML = `
            <div class="comp-template-thumb-wrapper">
                <img src="${previewSrc}" alt="${frame.name}" class="comp-template-thumb" loading="lazy">
                ${isSelected ? '<span class="comp-template-active-tag">Aktif</span>' : ''}
            </div>
            <div class="comp-template-info">
                <div class="comp-template-name" title="${frame.name}">${frame.name}</div>
                <div class="comp-template-slots">${frame.photoCount || (frame.slots ? frame.slots.length : 1)} Foto</div>
            </div>
        `;

        item.addEventListener('click', async () => {
            if (state.selectedFrame && state.selectedFrame.id === frame.id) return;
            state.selectedFrame = frame;

            document.querySelectorAll('#composition-template-list .comp-template-card').forEach(el => {
                el.classList.remove('selected');
                const tag = el.querySelector('.comp-template-active-tag');
                if (tag) tag.remove();
            });
            item.classList.add('selected');
            const thumbWrap = item.querySelector('.comp-template-thumb-wrapper');
            if (thumbWrap && !thumbWrap.querySelector('.comp-template-active-tag')) {
                const tag = document.createElement('span');
                tag.className = 'comp-template-active-tag';
                tag.textContent = 'Aktif';
                thumbWrap.appendChild(tag);
            }

            if (state.isMultiplayer) {
                sendMultiplayerMessage({
                    type: 'select_frame',
                    frameId: frame.id
                });
            }

            await createFinalComposition();
        });

        list.appendChild(item);
    });
}

async function createFinalComposition(isRemote = false) {
    if (isComposing) {
        console.warn('Composition already in progress, skipping duplicate call.');
        return;
    }
    isComposing = true;

    try {
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

        // Render side-by-side template selector
        renderCompositionTemplateSidebar();
        
        // HD SCALING: Multiply resolution by 2.5 for crisp text and images
        const HD_SCALE = 2.5;
        const targetW = Math.round((frame.width || 800) * HD_SCALE);
        const targetH = Math.round((frame.height || 1200) * HD_SCALE);
        canvas.width = targetW;
        canvas.height = targetH;
        ctx.clearRect(0, 0, targetW, targetH);
        
        let photosToUse = (state.filteredPhotos && state.filteredPhotos.length > 0) 
            ? state.filteredPhotos 
            : ((state.selectedPhotos && state.selectedPhotos.length > 0) 
                ? state.selectedPhotos 
                : (state.capturedPhotos && state.capturedPhotos.length > 0 
                    ? state.capturedPhotos 
                    : (typeof window !== 'undefined' && window.__CAPTURED_PHOTOS__ ? window.__CAPTURED_PHOTOS__ : [])));

        // Fallback to sessionStorage if array is empty
        if (photosToUse.length === 0 && typeof window !== 'undefined') {
            try {
                const cached = sessionStorage.getItem('cutesnaps_captured_photos');
                if (cached) {
                    const parsed = JSON.parse(cached);
                    if (Array.isArray(parsed) && parsed.length > 0) {
                        photosToUse = parsed;
                    }
                }
            } catch(e) {}
        }
            
        const slotsCount = (frame.slots && frame.slots.length > 0) ? frame.slots.length : (frame.photoCount || 1);
        if (photosToUse.length < slotsCount && state.capturedPhotos && state.capturedPhotos.length > 0) {
            for (const p of state.capturedPhotos) {
                if (photosToUse.length >= slotsCount) break;
                if (!photosToUse.includes(p)) photosToUse.push(p);
            }
        }

        const photos = await Promise.all(photosToUse.map(loadImage));
        cachedLoadedPhotos = photos;
        if (!state.slotAdjustments) state.slotAdjustments = {};
        await frame.render(ctx, photos, targetW, targetH, state.slotAdjustments);

        // Initialize drag & zoom interactivity on canvas
        initCompositionInteractivity();
    } catch (err) {
        console.error('Error during createFinalComposition:', err);
    } finally {
        isComposing = false;
    }
}

function loadImage(src) {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => {
            console.warn('Failed to load image, using fallback placeholder');
            const c = document.createElement('canvas');
            c.width = 100; c.height = 100;
            const fallback = new Image();
            fallback.src = c.toDataURL();
            resolve(fallback);
        };
        img.src = src;
    });
}
