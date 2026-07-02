import { initAR, startARLoop, stopARLoop, applyARToCapture } from './ar-filters.js';
import { state } from './state.js';
import { updateSessionCount } from './ui.js';
import { showReviewScreen } from './main.js';

export async function startCamera() {
    const videoRetro = document.getElementById('video-retro');
    const videoY2k = document.getElementById('video-y2k');
    try {
        const stream = await navigator.mediaDevices.getUserMedia({
            video: {
                width: { ideal: 1920 },
                height: { ideal: 1080 },
                facingMode: "user"
            }
        });
        if(videoRetro) videoRetro.srcObject = stream;
        if(videoY2k) videoY2k.srcObject = stream;
        state.stream = stream;

        // Start session timer when camera starts
        startSessionTimer();

        // Show camera screen
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
        document.getElementById('screen-camera').classList.add('active');

    } catch (err) {
        console.error("Error accessing camera:", err);
        alert("Tidak dapat mengakses kamera. Pastikan memberikan izin kamera.");
    }
}

export function startSessionTimer() {
    const timerElRetro = document.getElementById('global-timer-retro');
    const timerElY2k = document.getElementById('global-timer-y2k');
    
    // reset state
    state.isSessionActive = true;
    let timeLeft = state.sessionTimeLimit; // 90 seconds
    
    const updateDisplay = (secs) => {
        const m = Math.floor(secs / 60);
        const s = secs % 60;
        const text = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
        if(timerElRetro) timerElRetro.textContent = text;
        if(timerElY2k) timerElY2k.textContent = text;
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
        
        if (timeLeft <= 0) {
            clearInterval(state.timerInterval);
            state.isSessionActive = false;
            state.isCapturing = false;
            
            // Time is up!
            updateSessionCount();
            stopCamera();
            showReviewScreen();
        }
    }, 1000);
}

function updatePhotoCounter() {
    const counter = document.getElementById('photo-counter');
    if (counter) {
        counter.textContent = `${state.capturedPhotos.length} Foto Diambil`;
    }
}

export function startAutomaticCapture() {
    if (state.isCapturing || !state.isSessionActive) return;
    state.isCapturing = true;

    const countdownElRetro = document.getElementById('countdown-retro');
    const countdownElY2k = document.getElementById('countdown-y2k');
    if(state.theme === 'y2k' && countdownElY2k) countdownElY2k.style.display = 'flex';
    else if(countdownElRetro) countdownElRetro.style.display = 'flex';

    // Fungsi delay yang bisa di-await
    function takeOnePhoto() {
        return new Promise((resolve) => {
            let count = 3;
            if (countdownElRetro) countdownElRetro.textContent = count;
            if (countdownElY2k) countdownElY2k.textContent = count;
            
            const interval = setInterval(() => {
                // Berhenti jika sesi habis
                if (!state.isSessionActive) {
                    clearInterval(interval);
                    if (countdownElRetro) countdownElRetro.style.display = 'none';
                    if (countdownElY2k) countdownElY2k.style.display = 'none';
                    resolve();
                    return;
                }
                
                count--;
                if (count > 0) {
                    if (countdownElRetro) countdownElRetro.textContent = count;
            if (countdownElY2k) countdownElY2k.textContent = count;
                } else {
                    clearInterval(interval);
                    if (countdownElRetro) countdownElRetro.textContent = '📸';
                    if (countdownElY2k) countdownElY2k.textContent = '📸';

                    // Ambil foto setelah 300ms
                    setTimeout(() => {
                        if (state.isSessionActive) {
                            capturePhoto();
                        }
                        resolve();
                    }, 300);
                }
            }, 1000);
        });
    }

    async function takeSinglePhoto() {
        if (state.capturedPhotos.length >= state.totalPhotos) {
            stopCamera();
            showReviewScreen();
            return;
        }

        await takeOnePhoto();
        
        if (countdownElRetro) countdownElRetro.style.display = 'none';
        if (countdownElY2k) countdownElY2k.style.display = 'none';
        state.isCapturing = false;

        if (state.capturedPhotos.length >= state.totalPhotos) {
            setTimeout(() => {
                stopCamera();
                showReviewScreen();
            }, 500); // short delay so user sees the flash before screen transitions
        }
    }

    takeSinglePhoto();
}

export function capturePhoto() {
    const video = state.theme === 'y2k' ? document.getElementById('video-y2k') : document.getElementById('video-retro');
    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');

    // Set canvas size to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw video frame to canvas
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convert to data URL
    const photoDataUrl = canvas.toDataURL('image/jpeg', 0.9);
    state.capturedPhotos.push(photoDataUrl);

    updatePhotoCounter();
    console.log(`Foto tersimpan. Total foto sekarang: ${state.capturedPhotos.length}`);
}

export function stopCamera() {
    if (state.stream) {
        state.stream.getTracks().forEach(track => track.stop());
        state.stream = null;
    }
}
