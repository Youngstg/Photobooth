import { initAR, startARLoop, stopARLoop, applyARToCapture } from './ar-filters.js';
import { state } from './state.js';
import { updateSessionCount } from './ui.js';
import { showReviewScreen } from './main.js';
import { sendMultiplayerMessage, showToast, startVideoCallWithPartner } from './multiplayer.js';

export async function startCamera() {
    const videoY2k = document.getElementById('video-y2k');
    const videoDuoLocal = document.getElementById('video-duo-local');

    try {
        const stream = await navigator.mediaDevices.getUserMedia({
            video: {
                width: { ideal: 1920 },
                height: { ideal: 1080 },
                facingMode: "user"
            },
            audio: false
        });

        if (videoY2k) {
            videoY2k.srcObject = stream;
            videoY2k.muted = true;
            try { await videoY2k.play(); } catch(e) {}
        }
        if (videoDuoLocal) {
            videoDuoLocal.srcObject = stream;
            videoDuoLocal.muted = true;
            try { await videoDuoLocal.play(); } catch(e) {}
        }
        state.stream = stream;

        // Reset and render initial thumbnail strip and finish buttons
        updatePhotoCounter();

        // If in multiplayer mode, initiate video call to partner
        if (state.isMultiplayer) {
            startVideoCallWithPartner();
            setupDuoCameraLayout();
        } else {
            setupSoloCameraLayout();
        }

        // Start session timer when camera starts
        startSessionTimer();

        // Show camera screen
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
        document.getElementById('screen-camera').classList.add('active');

    } catch (err) {
        console.error("Error accessing camera:", err);
        // Replace alert() with styled toast + camera error screen
        showCameraError(err);
    }
}

/**
 * Show styled camera error with instructions instead of alert()
 */
function showCameraError(err) {
    let message = 'Tidak dapat mengakses kamera.';
    if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        message = 'Izin kamera ditolak. Klik ikon kamera di address bar browser dan izinkan akses kamera, lalu muat ulang halaman.';
    } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        message = 'Kamera tidak ditemukan. Pastikan kamera terhubung dan tidak digunakan aplikasi lain.';
    } else if (err.name === 'NotReadableError') {
        message = 'Kamera sedang digunakan aplikasi lain. Tutup aplikasi lain yang menggunakan kamera.';
    }

    // Show inline error instead of alert
    const cameraScreen = document.getElementById('screen-camera');
    if (cameraScreen) {
        cameraScreen.classList.add('active');
        document.querySelectorAll('.screen').forEach(s => {
            if (s !== cameraScreen) s.classList.remove('active');
        });
        cameraScreen.innerHTML = `
            <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;text-align:center;padding:40px;gap:20px;">
                <div style="font-size:60px;">📷</div>
                <h2 style="color:#FF69B4;font-family:'Titan One',cursive;margin:0;">Oops! Kamera Error</h2>
                <p style="color:#fff;max-width:400px;font-family:'Fredoka',sans-serif;font-size:16px;line-height:1.5;">${message}</p>
                <button onclick="location.reload()" class="btn-primary" style="font-size:18px;padding:14px 40px;">🔄 Coba Lagi</button>
            </div>
        `;
    }
}

function setupDuoCameraLayout() {
    const soloY2k = document.getElementById('camera-layout-y2k');
    const duoLayout = document.getElementById('camera-layout-duo');

    if (soloY2k) soloY2k.style.display = 'none';
    if (duoLayout) {
        duoLayout.style.display = 'flex';
        // Update player labels
        const localLabel = document.getElementById('duo-local-label');
        const remoteLabel = document.getElementById('duo-remote-label');
        if (localLabel) localLabel.textContent = `${state.localPlayer?.name || 'Player 1'} (${state.isHost ? 'Host' : 'Guest'})`;
        if (remoteLabel) remoteLabel.textContent = `${state.remotePlayer?.name || 'Partner'} (${state.isHost ? 'Guest' : 'Host'})`;
    }

    // Start AR loop for duo local video
    startARLoop();
}

function setupSoloCameraLayout() {
    const duoLayout = document.getElementById('camera-layout-duo');
    if (duoLayout) duoLayout.style.display = 'none';

    // Theme is always Y2K
    const soloY2k = document.getElementById('camera-layout-y2k');
    if (soloY2k) soloY2k.style.display = 'flex';

    startARLoop();
}


export function startSessionTimer() {
    const timerElY2k = document.getElementById('global-timer-y2k');
    const timerElDuo = document.getElementById('global-timer-duo');
    
    // reset state
    state.isSessionActive = true;
    let timeLeft = state.sessionTimeLimit; // 90 seconds
    
    const updateDisplay = (secs) => {
        const m = Math.floor(secs / 60);
        const s = secs % 60;
        const text = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
        if (timerElY2k) timerElY2k.textContent = text;
        if (timerElDuo) timerElDuo.textContent = text;
    };
    updateDisplay(timeLeft);
    
    if (state.timerInterval) clearInterval(state.timerInterval);
    
    state.timerInterval = setInterval(() => {
        if (!state.isSessionActive) {
            clearInterval(state.timerInterval);
            return;
        }
        
        timeLeft--;
        updateDisplay(timeLeft);

        // Warn when time is almost up
        if (timeLeft === 15) {
            showToast('⏰ Waktu tinggal 15 detik!');
        }
        
        if (timeLeft <= 0) {
            clearInterval(state.timerInterval);
            state.isSessionActive = false;
            state.isCapturing = false;
            
            // Time is up!
            updateSessionCount();
            stopARLoop();
            stopCamera();

            if (state.capturedPhotos && state.capturedPhotos.length > 0) {
                showToast('⏰ Waktu habis! Melanjutkan ke pemilihan foto.');
            } else {
                showToast('⏰ Waktu habis dan belum ada foto diambil.');
            }
            showReviewScreen(false, state.capturedPhotos);

            // Sync navigation in multiplayer
            if (state.isMultiplayer) {
                sendMultiplayerMessage({
                    type: 'nav_screen',
                    screenId: 'screen-review'
                });
            }
        }
    }, 1000);
}

export function updatePhotoCounter() {
    const count = state.capturedPhotos ? state.capturedPhotos.length : 0;
    const counter = document.getElementById('photo-counter');
    if (counter) {
        counter.textContent = `${count} Foto Diambil`;
    }
    const soloBadge = document.getElementById('solo-photo-count-badge');
    if (soloBadge) {
        soloBadge.textContent = `${count} / 6 Foto`;
    }
    const duoCounter = document.getElementById('duo-photo-count');
    if (duoCounter) {
        duoCounter.textContent = `${count} Foto`;
    }
    const sessionCount = document.getElementById('session-count');
    if (sessionCount) {
        sessionCount.textContent = `${count} Foto`;
    }

    // Update Finish buttons - ALWAYS visible, changes to ready when count >= 1
    const btnFinishDuo = document.getElementById('btn-finish-duo');
    const btnFinishY2k = document.getElementById('btn-finish-y2k');

    [btnFinishDuo, btnFinishY2k].forEach(btn => {
        if (!btn) return;
        const textSpan = btn.querySelector('.finish-btn-text');
        if (count >= 1) {
            btn.classList.add('ready');
            if (textSpan) {
                textSpan.textContent = `Selesai & Pilih (${count} Foto) ➔`;
            } else {
                btn.textContent = `Selesai & Pilih (${count} Foto) ➔`;
            }
            btn.title = 'Selesai dan lanjut memilih frame';
        } else {
            btn.classList.remove('ready');
            if (textSpan) {
                textSpan.textContent = 'Selesai & Pilih Foto';
            } else {
                btn.textContent = 'Selesai & Pilih Foto';
            }
            btn.title = 'Ambil minimal 1 foto dulu';
        }
    });

    // Render thumbnail previews
    renderThumbnails('solo-thumbnails-bar');
    renderThumbnails('duo-thumbnails-bar');

    // Auto-finish if max photos reached (prevent RAM overload)
    const MAX_PHOTOS = 6;
    if (count >= MAX_PHOTOS && state.isSessionActive) {
        showToast(`📸 ${MAX_PHOTOS} foto tercapai! Sesi otomatis selesai.`);
        finishPhotoSession();
    }
}

function renderThumbnails(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = '';
    const totalSlots = 6;
    for (let i = 0; i < totalSlots; i++) {
        const slot = document.createElement('div');
        slot.className = 'thumb-slot';
        if (state.capturedPhotos && state.capturedPhotos[i]) {
            slot.classList.add('filled');
            const img = document.createElement('img');
            img.src = state.capturedPhotos[i];
            img.alt = `Foto ${i + 1}`;
            slot.appendChild(img);
        } else {
            slot.textContent = `${i + 1}`;
        }
        container.appendChild(slot);
    }
}

export function finishPhotoSession() {
    if (!state.capturedPhotos || state.capturedPhotos.length === 0) {
        showToast('⚠️ Ambil minimal 1 foto dulu sebelum selesai!');
        return;
    }
    if (state.timerInterval) clearInterval(state.timerInterval);
    state.isSessionActive = false;
    state.isCapturing = false;

    updateSessionCount();
    stopARLoop();
    stopCamera();
    showReviewScreen(false, state.capturedPhotos);

    // Sync navigation in multiplayer
    if (state.isMultiplayer) {
        sendMultiplayerMessage({
            type: 'nav_screen',
            screenId: 'screen-review'
        });
    }
}

/**
 * Trigger capture (broadcasts to partner if multiplayer)
 */
export function startAutomaticCapture(isRemoteTriggered = false) {
    if (state.isCapturing || !state.isSessionActive) return;

    if (state.isMultiplayer && !isRemoteTriggered) {
        sendMultiplayerMessage({
            type: 'start_capture'
        });
    }

    executeCountdownAndCapture();
}

function executeCountdownAndCapture() {
    state.isCapturing = true;
    state.theme = 'y2k';

    const countdownY2k = document.getElementById('countdown-y2k');
    const countdownDuo = document.getElementById('countdown-duo');

    if (state.isMultiplayer && countdownDuo) countdownDuo.style.display = 'flex';
    else if (countdownY2k) countdownY2k.style.display = 'flex';

    function takeOnePhoto() {
        return new Promise((resolve) => {
            let count = 3;
            const setDisplay = (val) => {
                if (countdownY2k) countdownY2k.textContent = val;
                if (countdownDuo) countdownDuo.textContent = val;
            };

            setDisplay(count);
            
            const interval = setInterval(() => {
                if (!state.isSessionActive) {
                    clearInterval(interval);
                    if (countdownY2k) countdownY2k.style.display = 'none';
                    if (countdownDuo) countdownDuo.style.display = 'none';
                    state.isCapturing = false;
                    resolve();
                    return;
                }
                
                count--;
                if (count > 0) {
                    setDisplay(count);
                } else {
                    clearInterval(interval);
                    setDisplay('📸');

                    setTimeout(() => {
                        capturePhoto();
                        if (countdownY2k) countdownY2k.style.display = 'none';
                        if (countdownDuo) countdownDuo.style.display = 'none';
                        state.isCapturing = false;
                        resolve();
                    }, 300);
                }
            }, 1000);
        });
    }

    async function processCapture() {
        await takeOnePhoto();
        if (countdownY2k) countdownY2k.style.display = 'none';
        if (countdownDuo) countdownDuo.style.display = 'none';
        state.isCapturing = false;
    }

    processCapture();
}

/**
 * Capture photo from webcam(s)
 */
export function capturePhoto() {
    try {
        const canvas = document.getElementById('canvas');
        if (!canvas) {
            console.error('Canvas not found');
            return;
        }
        const ctx = canvas.getContext('2d');

        // DUO MODE CAPTURE
        if (state.isMultiplayer) {
            const localVideo = document.getElementById('video-duo-local');
            const remoteVideo = document.getElementById('video-duo-remote');

            const hasRemote = remoteVideo && remoteVideo.videoWidth > 0 && state.remoteStream;

            const targetW = 1920;
            const targetH = 1080;
            canvas.width = targetW;
            canvas.height = targetH;

            const halfW = targetW / 2;

            if (hasRemote) {
                const leftVideo = state.isHost ? localVideo : remoteVideo;
                const rightVideo = state.isHost ? remoteVideo : localVideo;

                ctx.save();
                ctx.translate(halfW, 0);
                ctx.scale(-1, 1);
                drawVideoCover(ctx, leftVideo, 0, 0, halfW, targetH);
                ctx.restore();

                ctx.save();
                ctx.translate(targetW, 0);
                ctx.scale(-1, 1);
                drawVideoCover(ctx, rightVideo, 0, 0, halfW, targetH);
                ctx.restore();

                ctx.save();
                ctx.lineWidth = 6;
                ctx.strokeStyle = '#FFFFFF';
                ctx.shadowColor = 'rgba(0,0,0,0.4)';
                ctx.shadowBlur = 8;
                ctx.beginPath();
                ctx.moveTo(halfW, 0);
                ctx.lineTo(halfW, targetH);
                ctx.stroke();

                ctx.fillStyle = '#FF69B4';
                ctx.beginPath();
                ctx.arc(halfW, targetH / 2, 28, 0, Math.PI * 2);
                ctx.fill();
                ctx.strokeStyle = '#FFFFFF';
                ctx.lineWidth = 4;
                ctx.stroke();

                ctx.font = '24px sans-serif';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText('💖', halfW, targetH / 2);
                ctx.restore();

            } else {
                if (!localVideo) return;
                const vw = localVideo.videoWidth || 1280;
                const vh = localVideo.videoHeight || 720;
                canvas.width = vw;
                canvas.height = vh;
                ctx.save();
                ctx.translate(canvas.width, 0);
                ctx.scale(-1, 1);
                ctx.drawImage(localVideo, 0, 0, canvas.width, canvas.height);
                ctx.restore();
            }

            applyARToCapture(canvas, ctx);

            const photoDataUrl = canvas.toDataURL('image/jpeg', 0.92);
            state.capturedPhotos.push(photoDataUrl);
            if (typeof window !== 'undefined') {
                if (window.__PHOTOBOOTH_STATE__) window.__PHOTOBOOTH_STATE__.capturedPhotos = state.capturedPhotos;
                window.__CAPTURED_PHOTOS__ = state.capturedPhotos;
            }
            try {
                sessionStorage.setItem('cutesnaps_captured_photos', JSON.stringify(state.capturedPhotos));
            } catch(e) {}

            sendMultiplayerMessage({
                type: 'photo_taken',
                count: state.capturedPhotos.length
            });

            // Duo Shutter Flash
            const flashDuo = document.getElementById('shutter-flash-duo');
            if (flashDuo) {
                flashDuo.classList.add('flash-active');
                setTimeout(() => flashDuo.classList.remove('flash-active'), 120);
            }

        } else {
            // SOLO MODE CAPTURE
            const video = document.getElementById('video-y2k');
            if (!video) {
                console.warn('Video element not found');
                return;
            }

            let vw = video.videoWidth;
            let vh = video.videoHeight;

            if (!vw || !vh) {
                const track = state.stream?.getVideoTracks()[0];
                const settings = track ? track.getSettings() : null;
                vw = (settings && settings.width) || video.clientWidth || 1280;
                vh = (settings && settings.height) || video.clientHeight || 720;
            }

            canvas.width = vw;
            canvas.height = vh;

            ctx.save();
            ctx.translate(canvas.width, 0);
            ctx.scale(-1, 1);
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            ctx.restore();

            applyARToCapture(canvas, ctx);

            const photoDataUrl = canvas.toDataURL('image/jpeg', 0.92);
            state.capturedPhotos.push(photoDataUrl);
            if (typeof window !== 'undefined') {
                if (window.__PHOTOBOOTH_STATE__) window.__PHOTOBOOTH_STATE__.capturedPhotos = state.capturedPhotos;
                window.__CAPTURED_PHOTOS__ = state.capturedPhotos;
            }
            try {
                sessionStorage.setItem('cutesnaps_captured_photos', JSON.stringify(state.capturedPhotos));
            } catch(e) {}

            // Solo Shutter Flash
            const flashSolo = document.getElementById('shutter-flash-overlay');
            if (flashSolo) {
                flashSolo.classList.add('flash-active');
                setTimeout(() => flashSolo.classList.remove('flash-active'), 120);
            }
        }

        updatePhotoCounter();
        showToast(`📸 Foto ke-${state.capturedPhotos.length} berhasil diambil!`);
        console.log(`Foto tersimpan. Total foto: ${state.capturedPhotos.length}`);

    } catch (err) {
        console.error('Error during capturePhoto:', err);
        showToast('❌ Gagal menyimpan foto: ' + err.message);
    }
}

/**
 * Draw video stream with cover aspect ratio into target box
 */
function drawVideoCover(ctx, video, dx, dy, dWidth, dHeight) {
    const vWidth = video.videoWidth;
    const vHeight = video.videoHeight;
    if (!vWidth || !vHeight) return;

    const vRatio = vWidth / vHeight;
    const dRatio = dWidth / dHeight;

    let sx, sy, sWidth, sHeight;
    if (vRatio > dRatio) {
        sHeight = vHeight;
        sWidth = vHeight * dRatio;
        sx = (vWidth - sWidth) / 2;
        sy = 0;
    } else {
        sWidth = vWidth;
        sHeight = vWidth / dRatio;
        sx = 0;
        sy = (vHeight - sHeight) / 2;
    }

    ctx.drawImage(video, sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight);
}

export function stopCamera() {
    if (state.stream) {
        state.stream.getTracks().forEach(track => track.stop());
        state.stream = null;
    }
}
