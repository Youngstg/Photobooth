import { state } from './state.js';
import { updateSessionCount } from './ui.js';
import { showReviewScreen } from './main.js';

export async function startCamera() {
    const video = document.getElementById('video');
    try {
        const stream = await navigator.mediaDevices.getUserMedia({
            video: {
                width: { ideal: 1920 },
                height: { ideal: 1080 },
                facingMode: "user"
            }
        });
        video.srcObject = stream;
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
    const timerEl = document.getElementById('global-timer');
    if (!timerEl) return;
    
    // reset state
    state.isSessionActive = true;
    let timeLeft = state.sessionTimeLimit; // 90 seconds
    
    const updateDisplay = (secs) => {
        const m = Math.floor(secs / 60);
        const s = secs % 60;
        timerEl.textContent = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
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

    const countdownEl = document.getElementById('countdown-overlay');
    countdownEl.style.display = 'flex';

    // Fungsi delay yang bisa di-await
    function takeOnePhoto() {
        return new Promise((resolve) => {
            let count = 3;
            countdownEl.textContent = count;
            
            const interval = setInterval(() => {
                // Berhenti jika sesi habis
                if (!state.isSessionActive) {
                    clearInterval(interval);
                    countdownEl.style.display = 'none';
                    resolve();
                    return;
                }
                
                count--;
                if (count > 0) {
                    countdownEl.textContent = count;
                } else {
                    clearInterval(interval);
                    countdownEl.textContent = '📸';

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

    // Ambil foto terus menerus sampai isSessionActive false
    async function takeContinuousPhotos() {
        while (state.isSessionActive && state.isCapturing) {
            await takeOnePhoto();
            
            if (state.isSessionActive && state.isCapturing) {
                // Delay 500ms sebelum foto berikutnya
                await new Promise(resolve => setTimeout(resolve, 500));
            }
        }
        countdownEl.style.display = 'none';
        state.isCapturing = false;
    }

    takeContinuousPhotos();
}

export function capturePhoto() {
    const video = document.getElementById('video');
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
