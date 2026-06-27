import { state } from './state.js';
import { showScreen, updateSessionCount } from './ui.js';
import { showReviewScreen } from './main.js'; // Will export showReviewScreen from main.js

// Screen 2: Camera
export async function startCamera() {
    // Validasi state sebelum memulai kamera
    if (!state.photoCount || !state.requiredPhotoCount || !state.totalCaptureCount) {
        console.error('Error: State tidak valid saat memulai kamera');
        console.error('State:', state);
        alert('Terjadi kesalahan. Silakan pilih jumlah foto kembali.');
        showScreen('screen-count-selection');
        return;
    }

    showScreen('screen-camera');

    try {
        state.stream = await navigator.mediaDevices.getUserMedia({
            video: {
                facingMode: 'user',
                width: { ideal: 1280 },
                height: { ideal: 720 }
            }
        });

        const video = document.getElementById('video');
        video.srcObject = state.stream;

        // Reset counter display
        document.getElementById('current-photo').textContent = '1';
        document.getElementById('total-photos').textContent = state.totalCaptureCount;

        const btnCapture = document.getElementById('btn-capture');
        btnCapture.disabled = false;
        btnCapture.style.display = 'block';
        btnCapture.textContent = 'Mulai Ambil Foto';

        console.log('Kamera siap. Akan mengambil', state.totalCaptureCount, 'foto');
    } catch (error) {
        console.error('Error akses kamera:', error);
        alert('Tidak dapat mengakses kamera. Pastikan Anda memberikan izin kamera.');
        showScreen('screen-count-selection');
    }
}

export function updatePhotoCounter() {
    // Tampilkan index + 1 agar dimulai dari 1 bukan 0
    document.getElementById('current-photo').textContent = state.currentPhotoIndex + 1;
}

export function startAutomaticCapture() {
    const countdownEl = document.getElementById('countdown');
    const btnCapture = document.getElementById('btn-capture');

    btnCapture.style.display = 'none'; // Sembunyikan tombol

    console.log(`Mulai ambil ${state.totalCaptureCount} foto untuk ${state.requiredPhotoCount} slot frame`);

    // Fungsi untuk countdown dan ambil 1 foto
    function takeOnePhoto(photoIndex) {
        return new Promise((resolve) => {
            let count = 5;
            countdownEl.textContent = count;

            const interval = setInterval(() => {
                count--;
                if (count > 0) {
                    countdownEl.textContent = count;
                } else {
                    clearInterval(interval);
                    countdownEl.textContent = '📸';

                    // Ambil foto setelah 300ms
                    setTimeout(() => {
                        capturePhoto();
                        console.log(`Foto ${photoIndex + 1}/${state.totalCaptureCount} diambil`);
                        resolve();
                    }, 300);
                }
            }, 1000);
        });
    }

    // Ambil semua foto secara berurutan
    async function takeAllPhotos() {
        for (let i = 0; i < state.totalCaptureCount; i++) {
            await takeOnePhoto(i);

            // Delay 500ms sebelum foto berikutnya (kecuali foto terakhir)
            if (i < state.totalCaptureCount - 1) {
                await new Promise(resolve => setTimeout(resolve, 500));
            }
        }

        // Selesai semua foto
        countdownEl.textContent = '✅ Selesai!';
        console.log(`Total foto tersimpan: ${state.capturedPhotos.length}`);

        // Update session count
        state.sessionPhotoCount += state.capturedPhotos.length;
        updateSessionCount();

        setTimeout(() => {
            stopCamera();
            showReviewScreen();
        }, 1000);
    }

    // Mulai proses
    takeAllPhotos();
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

    state.currentPhotoIndex++;
    updatePhotoCounter();

    console.log(`Foto ${state.currentPhotoIndex} tersimpan. Total foto sekarang: ${state.capturedPhotos.length}`);
}

export function stopCamera() {
    if (state.stream) {
        state.stream.getTracks().forEach(track => track.stop());
        state.stream = null;
    }
}
