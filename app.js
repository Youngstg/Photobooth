// Global State
const state = {
    photoCount: 0, // Jumlah foto yang akan digunakan di frame
    requiredPhotoCount: 0, // Jumlah foto yang wajib dipilih
    totalCaptureCount: 0, // Total foto yang akan diambil (4x lipat)
    currentPhotoIndex: 0,
    capturedPhotos: [],
    selectedPhotos: [],
    selectedFrame: null,
    stream: null,
    sessionPhotoCount: 0
};

// Motivational quotes array
const motivationalQuotes = [
    "Smile! You're creating memories!",
    "Every photo tells a story",
    "Be yourself, everyone else is taken",
    "Life is like a camera, focus on what's important",
    "Capture the moment, cherish forever",
    "Beauty begins the moment you decide to be yourself",
    "Strike a pose! Work it!",
    "Keep calm and say cheese!",
    "Life is short, make every selfie count!",
    "Photobooth: Where awkward is awesome!",
    "Your vibe attracts your tribe",
    "Good vibes only!",
    "Make today so awesome, yesterday gets jealous!",
    "Confidence is your best outfit!",
    "Life isn't perfect but your photos can be!"
];

let currentQuoteIndex = 0;

// Update clock widget with AM/PM and time bars
function updateClock() {
    const now = new Date();
    let hours = now.getHours();
    const minutes = now.getMinutes();
    const seconds = now.getSeconds();
    const minutesStr = String(minutes).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';

    hours = hours % 12;
    hours = hours ? hours : 12; // 0 should be 12
    const hoursStr = String(hours).padStart(2, '0');

    const clockTime = document.getElementById('clock-time');
    if (clockTime) {
        clockTime.textContent = `${hoursStr}:${minutesStr} ${ampm}`;
    }

    // Update time bars
    const hourBar = document.getElementById('hour-bar');
    const minBar = document.getElementById('min-bar');
    const secBar = document.getElementById('sec-bar');

    if (hourBar) {
        // 12 hours = 100%, so current hour / 12 * 100
        const hourPercent = (hours / 12) * 100;
        hourBar.style.width = `${hourPercent}%`;
    }

    if (minBar) {
        // 60 minutes = 100%, so current minute / 60 * 100
        const minPercent = (minutes / 60) * 100;
        minBar.style.width = `${minPercent}%`;
    }

    if (secBar) {
        // 60 seconds = 100%, so current second / 60 * 100
        const secPercent = (seconds / 60) * 100;
        secBar.style.width = `${secPercent}%`;
    }
}

// Change motivational quote
function changeQuote() {
    currentQuoteIndex = (currentQuoteIndex + 1) % motivationalQuotes.length;
    const quoteEl = document.getElementById('motivational-quote');
    if (quoteEl) {
        quoteEl.style.opacity = '0';
        setTimeout(() => {
            quoteEl.textContent = motivationalQuotes[currentQuoteIndex];
            quoteEl.style.opacity = '1';
        }, 200);
    }
}

// Add click event to quote
document.addEventListener('DOMContentLoaded', () => {
    const quoteEl = document.getElementById('motivational-quote');
    if (quoteEl) {
        quoteEl.addEventListener('click', changeQuote);
        // Set initial quote
        quoteEl.textContent = motivationalQuotes[0];
    }
});

// Update session photo count
function updateSessionCount() {
    const countWidget = document.getElementById('session-count');
    if (countWidget) {
        countWidget.textContent = `${state.sessionPhotoCount} Photos`;
    }
}

// Initialize decorations
updateClock();
setInterval(updateClock, 1000); // Update clock and time bars every second
updateSessionCount();

// Frame Templates - All themes available for all photo counts
const allFrameThemes = [
    { id: 'spotify-player', name: 'Spotify Player', width: 800, height: 1000 },
    { id: 'laptop-ui', name: 'Laptop Interface', width: 900, height: 700 },
    { id: 'polaroid', name: 'Polaroid Classic', width: 800, height: 1000 },
    { id: 'phone-chat', name: 'Phone Chat', width: 800, height: 1000 },
    { id: 'split-screen', name: 'Split Screen', width: 1000, height: 800 },
    { id: 'filmstrip', name: 'Film Strip', width: 800, height: 1000 },
    { id: 'instagram-grid', name: 'Instagram Grid', width: 1000, height: 800 },
    { id: 'polaroid-stack', name: 'Polaroid Stack', width: 800, height: 1000 },
    { id: 'comic-strip', name: 'Comic Strip', width: 1200, height: 600 },
    { id: 'photo-grid', name: 'Photo Grid', width: 1000, height: 1000 },
    { id: 'video-call', name: 'Video Call UI', width: 1200, height: 800 },
    { id: 'magazine', name: 'Magazine Layout', width: 1000, height: 1200 }
];

// Generate frame templates for each photo count (1-4 photos)
const frameTemplates = {};
for (let photoCount = 1; photoCount <= 4; photoCount++) {
    frameTemplates[photoCount] = allFrameThemes.map(theme => ({
        id: `${theme.id}-${photoCount}photo`,
        name: theme.name,
        themeId: theme.id,
        photoCount: photoCount,
        width: theme.width,
        height: theme.height,
        render: (ctx, photos) => renderFrame(ctx, photos, theme.id, photoCount)
    }));
}

// Screen Navigation
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    document.getElementById(screenId).classList.add('active');
}

// Screen 1: Count Selection
document.querySelectorAll('.count-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        // Use currentTarget to get the button element, not the clicked child
        const button = e.currentTarget;
        state.photoCount = parseInt(button.dataset.count);
        state.requiredPhotoCount = state.photoCount;
        state.totalCaptureCount = state.photoCount * 4; // 4x lipat
        state.currentPhotoIndex = 0;
        state.capturedPhotos = [];
        state.selectedPhotos = [];

        console.log('Selected photo count:', state.photoCount);
        console.log('Required photos:', state.requiredPhotoCount);
        console.log('Total to capture:', state.totalCaptureCount);

        document.getElementById('total-photos').textContent = state.totalCaptureCount;
        startCamera();
    });
});

// Screen 2: Camera
async function startCamera() {
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

function updatePhotoCounter() {
    // Tampilkan index + 1 agar dimulai dari 1 bukan 0
    document.getElementById('current-photo').textContent = state.currentPhotoIndex + 1;
}

document.getElementById('btn-capture').addEventListener('click', () => {
    startAutomaticCapture();
});

function startAutomaticCapture() {
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

function capturePhoto() {
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

function stopCamera() {
    if (state.stream) {
        state.stream.getTracks().forEach(track => track.stop());
        state.stream = null;
    }
}

// Screen 3: Photo Review
function showReviewScreen() {
    showScreen('screen-review');

    console.log(`Menampilkan ${state.capturedPhotos.length} foto. User harus pilih ${state.requiredPhotoCount} foto.`);

    // Validasi state
    if (!state.requiredPhotoCount || state.requiredPhotoCount <= 0) {
        console.error('Error: requiredPhotoCount tidak valid:', state.requiredPhotoCount);
        console.error('State saat ini:', state);
        alert('Terjadi kesalahan saat memuat foto. Silakan mulai ulang dari awal.');
        showScreen('screen-count-selection');
        return;
    }

    // Validasi captured photos
    if (!state.capturedPhotos || state.capturedPhotos.length === 0) {
        console.error('Error: Tidak ada foto yang tertangkap');
        console.error('State saat ini:', state);
        alert('Tidak ada foto yang tertangkap. Silakan mulai ulang.');
        showScreen('screen-count-selection');
        return;
    }

    // Update instruction text
    const reviewTitle = document.querySelector('#screen-review h2');
    reviewTitle.textContent = `Pilih ${state.requiredPhotoCount} Foto Terbaik`;

    const reviewInstruction = document.querySelector('#screen-review p');
    reviewInstruction.textContent = `Klik foto untuk memilih/batal pilih (pilih tepat ${state.requiredPhotoCount} foto)`;

    const photoGrid = document.getElementById('photo-grid');
    photoGrid.innerHTML = '';

    state.capturedPhotos.forEach((photoUrl, index) => {
        const photoItem = document.createElement('div');
        photoItem.className = 'photo-item'; // Tidak selected secara default
        photoItem.dataset.index = index;

        photoItem.innerHTML = `
            <img src="${photoUrl}" alt="Photo ${index + 1}">
            <div class="check-mark">✓</div>
        `;

        photoItem.addEventListener('click', () => {
            const currentSelected = document.querySelectorAll('.photo-item.selected').length;

            if (photoItem.classList.contains('selected')) {
                // Deselect
                photoItem.classList.remove('selected');
            } else {
                // Check if we can select more
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

    // Initially no photos are selected
    updateSelectedPhotos();
}

function updateSelectedPhotos() {
    state.selectedPhotos = [];
    document.querySelectorAll('.photo-item.selected').forEach(item => {
        const index = parseInt(item.dataset.index);
        state.selectedPhotos.push(state.capturedPhotos[index]);
    });

    const btnContinue = document.getElementById('btn-continue-to-frame');
    // Hanya enable jika jumlah foto yang dipilih sesuai dengan yang dibutuhkan
    btnContinue.disabled = state.selectedPhotos.length !== state.requiredPhotoCount;

    // Update button text
    if (state.selectedPhotos.length === state.requiredPhotoCount) {
        btnContinue.textContent = 'Lanjut Pilih Frame';
    } else {
        btnContinue.textContent = `Pilih ${state.requiredPhotoCount - state.selectedPhotos.length} foto lagi`;
    }
}

document.getElementById('btn-retake').addEventListener('click', () => {
    state.currentPhotoIndex = 0;
    state.capturedPhotos = [];
    state.selectedPhotos = [];
    startCamera();
});

document.getElementById('btn-continue-to-frame').addEventListener('click', () => {
    showFrameSelection();
});

// Screen 4: Frame Selection
async function showFrameSelection() {
    showScreen('screen-frame-selection');

    const frameGrid = document.getElementById('frame-grid');
    frameGrid.innerHTML = '<div style="text-align: center; padding: 20px; font-family: Courier New;">Loading previews...</div>';

    // Get frames for current photo count
    const availableFrames = frameTemplates[state.photoCount] || [];

    // Load selected photos as images
    const photoImages = await Promise.all(state.selectedPhotos.map(loadImage));

    frameGrid.innerHTML = '';

    availableFrames.forEach(frame => {
        const frameItem = document.createElement('div');
        frameItem.className = 'frame-item';

        // Generate ACTUAL preview with user's photos
        const previewCanvas = document.createElement('canvas');

        // Scale down for preview (use aspect ratio of original)
        const scale = 300 / Math.max(frame.width, frame.height);
        previewCanvas.width = frame.width * scale;
        previewCanvas.height = frame.height * scale;

        const ctx = previewCanvas.getContext('2d');

        // Scale context for rendering
        ctx.save();
        ctx.scale(scale, scale);

        // Render actual frame with user's photos
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

function drawFramePreview(ctx, frameId, width, height) {
    // Background
    ctx.fillStyle = '#F5E6D3';
    ctx.fillRect(0, 0, width, height);

    const colors = {
        spotify: '#1DB954',
        dark: '#2C2416',
        gray: '#7F7F7F',
        teal: '#7BC4A8',
        cream: '#EDD9C3'
    };

    ctx.font = 'bold 10px Courier New';

    switch(frameId) {
        case 'spotify-player':
            // Spotify green background top
            ctx.fillStyle = colors.spotify;
            ctx.fillRect(20, 20, width - 40, 100);
            // Photo area
            ctx.fillStyle = '#fff';
            ctx.fillRect(30, 40, 80, 80);
            // Text lines
            ctx.fillStyle = colors.dark;
            ctx.fillRect(120, 50, 100, 8);
            ctx.fillRect(120, 70, 70, 6);
            // Controls at bottom
            ctx.fillStyle = colors.dark;
            ctx.fillRect(20, height - 60, width - 40, 40);
            ctx.fillText('SPOTIFY', width/2 - 20, 140);
            break;

        case 'laptop-ui':
            // Laptop frame
            ctx.fillStyle = colors.dark;
            ctx.fillRect(10, 10, width - 20, height - 20);
            // Screen
            ctx.fillStyle = '#fff';
            ctx.fillRect(20, 30, width - 40, height - 80);
            // Photo in center
            ctx.fillStyle = colors.teal;
            ctx.fillRect(40, 50, width - 80, height - 120);
            // Keyboard bottom
            ctx.fillStyle = colors.gray;
            ctx.fillRect(20, height - 45, width - 40, 30);
            ctx.fillText('LAPTOP', width/2 - 20, 25);
            break;

        case 'polaroid':
            // Classic polaroid
            ctx.fillStyle = '#fff';
            ctx.fillRect(30, 20, width - 60, height - 40);
            ctx.fillStyle = colors.teal;
            ctx.fillRect(40, 30, width - 80, height - 100);
            ctx.fillStyle = colors.dark;
            ctx.fillText('POLAROID', width/2 - 25, height - 30);
            break;

        case 'phone-chat':
            // Phone UI
            ctx.fillStyle = colors.dark;
            ctx.fillRect(40, 10, width - 80, height - 20);
            ctx.fillStyle = '#fff';
            ctx.fillRect(50, 30, width - 100, height - 60);
            // Chat bubbles
            ctx.fillStyle = colors.teal;
            ctx.fillRect(60, 50, 80, 40);
            ctx.fillRect(width - 140, 110, 80, 40);
            ctx.fillText('CHAT', width/2 - 15, 25);
            break;

        case 'split-screen':
            ctx.fillStyle = colors.teal;
            ctx.fillRect(20, 20, width/2 - 25, height - 40);
            ctx.fillStyle = colors.cream;
            ctx.fillRect(width/2 + 5, 20, width/2 - 25, height - 40);
            ctx.fillStyle = colors.dark;
            ctx.fillText('SPLIT', width/2 - 15, height/2);
            break;

        case 'polaroid-stack':
            ctx.fillStyle = colors.teal;
            ctx.fillRect(40, 20, width - 80, 70);
            ctx.fillRect(40, 100, width - 80, 70);
            ctx.fillRect(40, 180, width - 80, 70);
            ctx.fillText('STACK', width/2 - 15, height - 20);
            break;

        case 'filmstrip':
            ctx.fillStyle = colors.dark;
            ctx.fillRect(10, 10, width - 20, height - 20);
            ctx.fillStyle = '#fff';
            ctx.fillRect(30, 50, width - 60, 80);
            ctx.fillRect(30, 150, width - 60, 80);
            ctx.fillText('FILM', width/2 - 12, 30);
            break;

        case 'instagram-grid':
            ctx.fillStyle = colors.teal;
            ctx.fillRect(20, 20, width - 40, 80);
            ctx.fillStyle = colors.cream;
            ctx.fillRect(20, 110, width/2 - 25, 80);
            ctx.fillRect(width/2 + 5, 110, width/2 - 25, 80);
            ctx.fillStyle = colors.dark;
            ctx.fillText('INSTAGRAM', width/2 - 30, height - 40);
            break;

        case 'triple-stack':
            ctx.fillStyle = colors.teal;
            ctx.fillRect(40, 20, width - 80, 70);
            ctx.fillRect(40, 100, width - 80, 70);
            ctx.fillRect(40, 180, width - 80, 70);
            ctx.fillText('STACK', width/2 - 15, height - 20);
            break;

        case 'comic-strip':
            ctx.fillStyle = colors.dark;
            ctx.fillRect(10, 10, width - 20, height - 20);
            ctx.fillStyle = '#fff';
            for(let i = 0; i < 3; i++) {
                ctx.fillRect(20 + i * 90, 30, 80, height - 60);
            }
            ctx.fillStyle = colors.dark;
            ctx.fillText('COMIC', width/2 - 15, 25);
            break;

        case 'photo-grid':
            for(let i = 0; i < 2; i++) {
                for(let j = 0; j < 2; j++) {
                    ctx.fillStyle = i + j % 2 === 0 ? colors.teal : colors.cream;
                    ctx.fillRect(20 + j * 130, 20 + i * 130, 120, 120);
                }
            }
            ctx.fillStyle = colors.dark;
            ctx.fillText('GRID', width/2 - 12, height - 20);
            break;

        case 'video-call':
            ctx.fillStyle = colors.dark;
            ctx.fillRect(10, 10, width - 20, height - 20);
            ctx.fillStyle = '#fff';
            for(let i = 0; i < 2; i++) {
                for(let j = 0; j < 2; j++) {
                    ctx.fillRect(20 + j * 135, 30 + i * 115, 125, 105);
                }
            }
            ctx.fillText('VIDEO CALL', width/2 - 30, 25);
            break;

        case 'magazine':
            ctx.fillStyle = '#fff';
            ctx.fillRect(10, 10, width - 20, height - 20);
            ctx.fillStyle = colors.teal;
            ctx.fillRect(20, 20, width - 40, 120);
            ctx.fillStyle = colors.cream;
            ctx.fillRect(20, 150, width/2 - 25, 80);
            ctx.fillRect(width/2 + 5, 150, width/2 - 25, 50);
            ctx.fillRect(width/2 + 5, 210, width/2 - 25, 20);
            ctx.fillStyle = colors.dark;
            ctx.fillText('MAGAZINE', width/2 - 27, height - 20);
            break;
    }
}

document.getElementById('btn-back-to-review').addEventListener('click', () => {
    showReviewScreen();
});

// Universal render function that dispatches to specific theme renderers
function renderFrame(ctx, photos, themeId, photoCount) {
    switch(themeId) {
        case 'spotify-player':
            renderSpotifyFrame(ctx, photos, photoCount);
            break;
        case 'laptop-ui':
            renderLaptopFrame(ctx, photos, photoCount);
            break;
        case 'polaroid':
            renderPolaroidFrame(ctx, photos, photoCount);
            break;
        case 'phone-chat':
            renderPhoneChatFrame(ctx, photos, photoCount);
            break;
        case 'split-screen':
            renderSplitScreenFrame(ctx, photos, photoCount);
            break;
        case 'filmstrip':
            renderFilmstripFrame(ctx, photos, photoCount);
            break;
        case 'instagram-grid':
            renderInstagramFrame(ctx, photos, photoCount);
            break;
        case 'polaroid-stack':
            renderPolaroidStackFrame(ctx, photos, photoCount);
            break;
        case 'comic-strip':
            renderComicStripFrame(ctx, photos, photoCount);
            break;
        case 'photo-grid':
            renderPhotoGridFrame(ctx, photos, photoCount);
            break;
        case 'video-call':
            renderVideoCallFrame(ctx, photos, photoCount);
            break;
        case 'magazine':
            renderMagazineFrame(ctx, photos, photoCount);
            break;
    }
}

// Helper function to draw image with cover behavior
function drawImageCover(ctx, img, x, y, width, height) {
    const imgRatio = img.width / img.height;
    const frameRatio = width / height;

    let sx, sy, sWidth, sHeight;

    if (imgRatio > frameRatio) {
        sHeight = img.height;
        sWidth = img.height * frameRatio;
        sx = (img.width - sWidth) / 2;
        sy = 0;
    } else {
        sWidth = img.width;
        sHeight = img.width / frameRatio;
        sx = 0;
        sy = (img.height - sHeight) / 2;
    }

    ctx.drawImage(img, sx, sy, sWidth, sHeight, x, y, width, height);
}

// Frame Render Functions - Updated to support 1-4 photos
function renderSpotifyFrame(ctx, photos, photoCount) {
    const w = 800, h = 1000;

    // Black background
    ctx.fillStyle = '#121212';
    ctx.fillRect(0, 0, w, h);

    // Top bar with back arrow and menu
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 28px Courier New';
    ctx.fillText('←', 30, 45);
    ctx.fillText('⋯', w - 60, 45);

    // Main photo area - square album cover
    const photoSize = 600;
    const photoX = (w - photoSize) / 2;
    const photoY = 100;

    if (photoCount === 1) {
        drawImageCover(ctx, photos[0], photoX, photoY, photoSize, photoSize);
    } else if (photoCount === 2) {
        drawImageCover(ctx, photos[0], photoX, photoY, photoSize / 2 - 5, photoSize / 2 - 5);
        drawImageCover(ctx, photos[1], photoX + photoSize / 2 + 5, photoY, photoSize / 2 - 5, photoSize / 2 - 5);
        // Bottom half with pattern
        ctx.fillStyle = '#1DB954';
        ctx.fillRect(photoX, photoY + photoSize / 2 + 5, photoSize, photoSize / 2 - 5);
    } else if (photoCount === 3) {
        drawImageCover(ctx, photos[0], photoX, photoY, photoSize, photoSize / 2 - 5);
        drawImageCover(ctx, photos[1], photoX, photoY + photoSize / 2 + 5, photoSize / 2 - 5, photoSize / 2 - 5);
        drawImageCover(ctx, photos[2], photoX + photoSize / 2 + 5, photoY + photoSize / 2 + 5, photoSize / 2 - 5, photoSize / 2 - 5);
    } else {
        for(let i = 0; i < 2; i++) {
            for(let j = 0; j < 2; j++) {
                drawImageCover(ctx, photos[i * 2 + j], photoX + j * (photoSize / 2 + 5), photoY + i * (photoSize / 2 + 5), photoSize / 2 - 5, photoSize / 2 - 5);
            }
        }
    }

    // Heart icon below album
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '32px Courier New';
    ctx.fillText('♡', 100, photoY + photoSize + 60);

    // Time and progress bar
    const progressY = photoY + photoSize + 110;
    ctx.fillStyle = '#B3B3B3';
    ctx.font = '16px Courier New';
    ctx.fillText('0:00', 100, progressY);
    ctx.fillText('-3:14', w - 130, progressY);

    // Progress bar
    ctx.fillStyle = '#404040';
    ctx.fillRect(100, progressY + 10, w - 200, 4);
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(100, progressY + 10, (w - 200) * 0.3, 4);

    // Control buttons (shuffle, prev, play, next, repeat)
    const controlY = progressY + 60;
    const controls = [
        { icon: '⇄', x: 150 },
        { icon: '⏮', x: 260 },
        { icon: '▶', x: 400, large: true },
        { icon: '⏭', x: 540 },
        { icon: '🔁', x: 650 }
    ];

    controls.forEach(ctrl => {
        ctx.fillStyle = '#FFFFFF';
        ctx.font = ctrl.large ? 'bold 48px Courier New' : 'bold 32px Courier New';
        ctx.textAlign = 'center';
        ctx.fillText(ctrl.icon, ctrl.x, controlY);
    });

    // Bottom icons
    ctx.font = '24px Courier New';
    ctx.fillText('🔊', 100, h - 40);
    ctx.fillText('📋', w - 100, h - 40);

    ctx.textAlign = 'left';
}

// Helper: Distribute photos in grid
function distributePhotosInGrid(ctx, photos, photoCount, x, y, totalWidth, totalHeight, gap = 10) {
    if (photoCount === 1) {
        drawImageCover(ctx, photos[0], x, y, totalWidth, totalHeight);
    } else if (photoCount === 2) {
        const w = (totalWidth - gap) / 2;
        drawImageCover(ctx, photos[0], x, y, w, totalHeight);
        drawImageCover(ctx, photos[1], x + w + gap, y, w, totalHeight);
    } else if (photoCount === 3) {
        // 1 foto besar atas, 2 foto kecil bawah
        const topH = totalHeight * 0.6 - gap/2;
        const bottomH = totalHeight * 0.4 - gap/2;
        const bottomW = (totalWidth - gap) / 2;
        drawImageCover(ctx, photos[0], x, y, totalWidth, topH);
        drawImageCover(ctx, photos[1], x, y + topH + gap, bottomW, bottomH);
        drawImageCover(ctx, photos[2], x + bottomW + gap, y + topH + gap, bottomW, bottomH);
    } else {
        const w = (totalWidth - gap) / 2;
        const h = (totalHeight - gap) / 2;
        for(let i = 0; i < 2; i++) {
            for(let j = 0; j < 2; j++) {
                const idx = i * 2 + j;
                if(photos[idx]) drawImageCover(ctx, photos[idx], x + j * (w + gap), y + i * (h + gap), w, h);
            }
        }
    }
}

function renderLaptopFrame(ctx, photos, photoCount) {
    const w = 900, h = 700;

    // Wooden desk background
    ctx.fillStyle = '#8B7355';
    ctx.fillRect(0, 0, w, h);

    // Laptop base/keyboard
    ctx.fillStyle = '#2C2416';
    ctx.fillRect(50, h - 120, w - 100, 100);

    // Laptop screen frame
    ctx.fillStyle = '#1A1A1A';
    ctx.fillRect(80, 40, w - 160, h - 180);

    // Windows 95 desktop background (teal)
    ctx.fillStyle = '#008080';
    ctx.fillRect(95, 55, w - 190, h - 210);

    // Windows 95 title bar
    ctx.fillStyle = '#000080';
    ctx.fillRect(120, 80, w - 240, 25);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 14px Courier New';
    ctx.fillText('My Photos', 130, 98);

    // Window close button
    ctx.fillStyle = '#C0C0C0';
    ctx.fillRect(w - 150, 82, 20, 20);
    ctx.fillStyle = '#000000';
    ctx.fillText('×', w - 145, 97);

    // Photo display area inside window
    const photoX = 120;
    const photoY = 110;
    const photoW = w - 240;
    const photoH = h - 340;

    // White window content area
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(photoX, photoY, photoW, photoH);

    distributePhotosInGrid(ctx, photos, photoCount, photoX + 10, photoY + 10, photoW - 20, photoH - 20, 10);

    // Desktop icons on the right side
    const iconX = w - 150;
    const icons = ['📁', '💻', '🎮', '🖼️', '📄'];
    const iconLabels = ['Folder', 'MyPC', 'Game', 'Pics', 'File'];

    icons.forEach((icon, i) => {
        const iconY = 80 + i * 70;
        ctx.font = '32px Courier New';
        ctx.fillText(icon, iconX, iconY);
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '12px Courier New';
        ctx.fillText(iconLabels[i], iconX - 5, iconY + 20);
    });

    // Windows taskbar
    ctx.fillStyle = '#C0C0C0';
    ctx.fillRect(95, h - 165, w - 190, 25);

    // Start button
    ctx.fillStyle = '#DFDFDF';
    ctx.fillRect(100, h - 163, 60, 21);
    ctx.fillStyle = '#000000';
    ctx.font = 'bold 12px Courier New';
    ctx.fillText('Start', 108, h - 148);

    // Keyboard keys
    ctx.fillStyle = '#3D3427';
    for(let row = 0; row < 3; row++) {
        for(let col = 0; col < 15; col++) {
            ctx.fillRect(70 + col * 50, h - 105 + row * 25, 40, 18);
        }
    }

    // Trackpad
    ctx.fillStyle = '#4A4A4A';
    ctx.fillRect(w / 2 - 80, h - 50, 160, 35);
}

function renderPolaroidFrame(ctx, photos, photoCount) {
    const w = 800, h = 1000;
    ctx.fillStyle = '#D4A574';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(100, 80, 600, 750);

    distributePhotosInGrid(ctx, photos, photoCount, 120, 100, 560, 560);

    ctx.fillStyle = '#2C2416';
    ctx.font = 'italic 32px Courier New';
    ctx.textAlign = 'center';
    ctx.fillText('Sweet Memories', w/2, 750);
    ctx.font = '20px Courier New';
    ctx.fillText(new Date().toLocaleDateString(), w/2, 790);
    ctx.textAlign = 'left';
}

function renderPhoneChatFrame(ctx, photos, photoCount) {
    const w = 800, h = 1000;

    // Phone frame background
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, w, h);

    // White phone screen
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(50, 40, w - 100, h - 80);

    // WhatsApp chat background
    ctx.fillStyle = '#E5DDD5';
    ctx.fillRect(60, 120, w - 120, h - 260);

    // WhatsApp header
    ctx.fillStyle = '#075E54';
    ctx.fillRect(60, 50, w - 120, 70);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 24px Courier New';
    ctx.fillText('Chat Group', 80, 90);

    // Three dots menu
    ctx.font = '28px Courier New';
    ctx.fillText('⋮', w - 100, 90);

    // Draw photo bubbles only (no text messages)
    const availableHeight = h - 260; // Total height minus header and input box
    const photoBubbleH = Math.min(200, (availableHeight - 40) / photoCount - 15);

    photos.forEach((photo, i) => {
        ctx.fillStyle = i % 2 === 0 ? '#FFFFFF' : '#DCF8C6';
        const x = i % 2 === 0 ? 80 : w - 380;
        const y = 140 + i * (photoBubbleH + 15);

        // Rounded bubble background
        ctx.beginPath();
        ctx.roundRect(x, y, 300, photoBubbleH, 8);
        ctx.fill();

        // Photo inside bubble
        drawImageCover(ctx, photo, x + 10, y + 10, 280, photoBubbleH - 20);
    });

    // BOTTOM INPUT BOX AREA (kotak untuk mengetik)
    const inputBoxY = h - 140;

    // Input box background (white)
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(60, inputBoxY, w - 120, 60);

    // Input text field
    ctx.fillStyle = '#F0F0F0';
    ctx.beginPath();
    ctx.roundRect(75, inputBoxY + 10, w - 240, 40, 20);
    ctx.fill();

    // Placeholder text
    ctx.fillStyle = '#999999';
    ctx.font = '14px Courier New';
    ctx.fillText('Type a message...', 95, inputBoxY + 35);

    // Emoji button
    ctx.fillStyle = '#7F8C8D';
    ctx.font = '24px Courier New';
    ctx.fillText('😊', w - 200, inputBoxY + 38);

    // Attach button
    ctx.fillText('📎', w - 160, inputBoxY + 38);

    // Send button (green circle)
    ctx.fillStyle = '#25D366';
    ctx.beginPath();
    ctx.arc(w - 110, inputBoxY + 30, 22, 0, Math.PI * 2);
    ctx.fill();

    // Send icon (white arrow)
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 18px Courier New';
    ctx.fillText('➤', w - 120, inputBoxY + 36);
}

function renderSplitScreenFrame(ctx, photos, photoCount) {
    const w = 1000, h = 800;
    ctx.fillStyle = '#2C2416';
    ctx.fillRect(0, 0, w, h);

    if (photoCount === 1) {
        drawImageCover(ctx, photos[0], 20, 20, w - 40, h - 40);
    } else if (photoCount === 2) {
        drawImageCover(ctx, photos[0], 20, 20, w/2 - 30, h - 40);
        drawImageCover(ctx, photos[1], w/2 + 10, 20, w/2 - 30, h - 40);
        ctx.fillStyle = '#7BC4A8';
        ctx.fillRect(w/2 - 5, 0, 10, h);
    } else if (photoCount === 3) {
        drawImageCover(ctx, photos[0], 20, 20, w/2 - 30, h - 40);
        drawImageCover(ctx, photos[1], w/2 + 10, 20, w/2 - 30, h/2 - 30);
        drawImageCover(ctx, photos[2], w/2 + 10, h/2 + 10, w/2 - 30, h/2 - 30);
    } else {
        distributePhotosInGrid(ctx, photos, 4, 20, 20, w - 40, h - 40, 20);
    }
}

function renderFilmstripFrame(ctx, photos, photoCount) {
    const w = 800, h = 1000;
    ctx.fillStyle = '#1A1A1A';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#000000';
    for(let i = 0; i < 20; i++) {
        ctx.fillRect(20, 30 + i * 48, 30, 35);
        ctx.fillRect(w - 50, 30 + i * 48, 30, 35);
    }

    const frameH = (h - 200) / photoCount;
    photos.forEach((photo, i) => {
        const y = 100 + i * frameH;
        drawImageCover(ctx, photo, 70, y, w - 140, frameH - 20);
        ctx.strokeStyle = '#7BC4A8';
        ctx.lineWidth = 3;
        ctx.strokeRect(70, y, w - 140, frameH - 20);
    });
}

function renderInstagramFrame(ctx, photos, photoCount) {
    const w = 1000, h = 800;

    // White background
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, w, h);

    // Top header bar
    ctx.fillStyle = '#FAFAFA';
    ctx.fillRect(0, 0, w, 60);

    // Header icons and text
    ctx.fillStyle = '#262626';
    ctx.font = 'bold 32px Courier New';
    ctx.fillText('📷', 30, 42); // Camera icon
    ctx.font = 'bold 28px Courier New';
    ctx.fillText('Instagram', 90, 40);
    ctx.font = '24px Courier New';
    ctx.fillText('📧', w - 140, 40); // Messenger icon
    ctx.fillText('✈', w - 70, 40); // Send icon

    // Profile section
    const profileY = 80;
    ctx.fillStyle = '#262626';
    ctx.beginPath();
    ctx.arc(70, profileY + 30, 25, 0, Math.PI * 2);
    ctx.stroke();
    ctx.font = '18px Courier New';
    ctx.fillText('photobooth', 110, profileY + 35);
    ctx.fillText('⋯', w - 50, profileY + 35); // Three dots menu

    // Main photo area
    const photoAreaY = profileY + 70;
    const photoAreaH = h - photoAreaY - 120;

    if (photoCount === 1) {
        drawImageCover(ctx, photos[0], 0, photoAreaY, w, photoAreaH);
    } else if (photoCount === 2) {
        const h1 = photoAreaH * 0.6;
        const h2 = photoAreaH * 0.4 - 5;
        drawImageCover(ctx, photos[0], 0, photoAreaY, w, h1);
        drawImageCover(ctx, photos[1], 0, photoAreaY + h1 + 5, w, h2);
    } else if (photoCount === 3) {
        const h1 = photoAreaH * 0.6;
        const h2 = photoAreaH * 0.4 - 5;
        drawImageCover(ctx, photos[0], 0, photoAreaY, w, h1);
        drawImageCover(ctx, photos[1], 0, photoAreaY + h1 + 5, w / 2 - 2.5, h2);
        drawImageCover(ctx, photos[2], w / 2 + 2.5, photoAreaY + h1 + 5, w / 2 - 2.5, h2);
    } else {
        const h1 = photoAreaH / 2 - 2.5;
        drawImageCover(ctx, photos[0], 0, photoAreaY, w / 2 - 2.5, h1);
        drawImageCover(ctx, photos[1], w / 2 + 2.5, photoAreaY, w / 2 - 2.5, h1);
        drawImageCover(ctx, photos[2], 0, photoAreaY + h1 + 5, w / 2 - 2.5, h1);
        drawImageCover(ctx, photos[3], w / 2 + 2.5, photoAreaY + h1 + 5, w / 2 - 2.5, h1);
    }

    // Action icons below photos
    const actionY = h - 100;
    ctx.fillStyle = '#262626';
    ctx.font = '28px Courier New';
    ctx.fillText('♡', 30, actionY);
    ctx.fillText('💬', 90, actionY);
    ctx.fillText('✈', 150, actionY);
    ctx.fillText('🔖', w - 60, actionY);

    // Bottom navigation bar
    ctx.fillStyle = '#FAFAFA';
    ctx.fillRect(0, h - 60, w, 60);
    ctx.fillStyle = '#262626';
    ctx.font = '28px Courier New';
    const navIcons = ['🏠', '🔍', '➕', '♡', '👤'];
    navIcons.forEach((icon, i) => {
        ctx.fillText(icon, 100 + i * 180, h - 22);
    });
}

function renderPolaroidStackFrame(ctx, photos, photoCount) {
    const w = 800, h = 1000;

    // Cream background
    ctx.fillStyle = '#F5E6D3';
    ctx.fillRect(0, 0, w, h);

    // Add spacing for top and bottom as requested
    const topBottomSpacing = 80; // Increased from 50
    const availableHeight = h - (topBottomSpacing * 2);
    const gapBetweenPhotos = 30; // Spacing between polaroids
    const totalGaps = (photoCount - 1) * gapBetweenPhotos;
    const photoHeight = (availableHeight - totalGaps) / photoCount;

    photos.forEach((photo, i) => {
        const y = topBottomSpacing + i * (photoHeight + gapBetweenPhotos);

        // Shadow effect
        ctx.fillStyle = 'rgba(0,0,0,0.15)';
        ctx.fillRect(85, y + 5, w - 160, photoHeight + 80);

        // White polaroid frame
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(80, y, w - 160, photoHeight + 80);

        // Photo area (leaving space at bottom for text)
        drawImageCover(ctx, photo, 100, y + 15, w - 200, photoHeight - 10);

        // Optional: Add subtle text area at bottom of polaroid
        ctx.fillStyle = '#2C2416';
        ctx.font = '16px Courier New';
        ctx.textAlign = 'center';
        ctx.fillText(`Memory ${i + 1}`, w / 2, y + photoHeight + 55);
    });

    ctx.textAlign = 'left';
}

function renderComicStripFrame(ctx, photos, photoCount) {
    const w = 1200, h = 600;

    // Comic book page background (aged paper)
    ctx.fillStyle = '#FFE5B4';
    ctx.fillRect(0, 0, w, h);

    const panelW = (w - 80 - (photoCount - 1) * 40) / photoCount;
    const panelH = 480;

    photos.forEach((photo, i) => {
        const x = 40 + i * (panelW + 40);

        // Black panel border
        ctx.fillStyle = '#000000';
        ctx.fillRect(x - 5, 55, panelW + 10, panelH + 10);

        // White panel background
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(x, 60, panelW, panelH);

        // Draw SPEED LINES / ACTION EFFECTS radiating from corners
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2;

        // Speed lines from top-left corner
        for (let j = 0; j < 8; j++) {
            ctx.beginPath();
            ctx.moveTo(x + 10, 70);
            ctx.lineTo(x + 50 + j * 15, 70 + j * 20);
            ctx.stroke();
        }

        // Speed lines from top-right corner
        for (let j = 0; j < 8; j++) {
            ctx.beginPath();
            ctx.moveTo(x + panelW - 10, 70);
            ctx.lineTo(x + panelW - 50 - j * 15, 70 + j * 20);
            ctx.stroke();
        }

        // Speed lines from bottom corners
        for (let j = 0; j < 6; j++) {
            ctx.beginPath();
            ctx.moveTo(x + 10, 520);
            ctx.lineTo(x + 40 + j * 12, 520 - j * 15);
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(x + panelW - 10, 520);
            ctx.lineTo(x + panelW - 40 - j * 12, 520 - j * 15);
            ctx.stroke();
        }

        // Photo in center
        const photoMargin = 80;
        drawImageCover(ctx, photo, x + photoMargin / 2, 140, panelW - photoMargin, panelH - 180);

        // Speech bubble at bottom
        ctx.fillStyle = '#FFFFFF';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.ellipse(x + panelW / 2, 515, 100, 20, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Speech bubble tail
        ctx.beginPath();
        ctx.moveTo(x + panelW / 2 - 20, 505);
        ctx.lineTo(x + panelW / 2 - 30, 480);
        ctx.lineTo(x + panelW / 2 - 10, 500);
        ctx.fill();
        ctx.stroke();

        // Exclamation text
        ctx.fillStyle = '#000000';
        ctx.font = 'bold 14px Courier New';
        ctx.textAlign = 'center';
        const exclamations = ['WOW!', 'POW!', 'ZAP!', 'BOOM!'];
        ctx.fillText(exclamations[i % exclamations.length], x + panelW / 2, 520);
    });

    ctx.textAlign = 'left';
}

function renderPhotoGridFrame(ctx, photos, photoCount) {
    const w = 1000, h = 1000;
    ctx.fillStyle = '#2C2416';
    ctx.fillRect(0, 0, w, h);
    distributePhotosInGrid(ctx, photos, photoCount, 20, 20, w - 40, h - 40, 20);
}

function renderVideoCallFrame(ctx, photos, photoCount) {
    const w = 1200, h = 800;

    // Dark background (Zoom-style)
    ctx.fillStyle = '#1C1C1C';
    ctx.fillRect(0, 0, w, h);

    // Top header bar
    ctx.fillStyle = '#2D2D2D';
    ctx.fillRect(0, 0, w, 60);

    // Zoom Meeting title
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 24px Courier New';
    ctx.fillText('Zoom Meeting', 30, 40);

    // Speaker View button
    ctx.fillStyle = '#3C3C3C';
    ctx.fillRect(w - 200, 15, 160, 30);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '16px Courier New';
    ctx.fillText('📊 Speaker View', w - 190, 37);

    // Calculate grid layout for photos
    const gridStartY = 80;
    const gridH = h - gridStartY - 80; // Leave space for controls

    distributePhotosInGrid(ctx, photos, photoCount, 20, gridStartY, w - 40, gridH, 10);

    // Add name labels on photos
    photos.forEach((_, i) => {
        let x, y, photoW, photoH;

        if (photoCount === 1) {
            x = 20; y = gridStartY;
            photoW = w - 40; photoH = gridH;
        } else if (photoCount === 2) {
            photoW = (w - 50) / 2;
            photoH = gridH;
            x = i === 0 ? 20 : 20 + photoW + 10;
            y = gridStartY;
        } else if (photoCount === 3) {
            // Layout: 1 foto besar atas, 2 foto kecil bawah
            const topH = gridH * 0.6 - 5;
            const bottomH = gridH * 0.4 - 5;
            const bottomW = (w - 50) / 2;

            if (i === 0) {
                // Foto besar atas
                x = 20;
                y = gridStartY;
                photoW = w - 40;
                photoH = topH;
            } else if (i === 1) {
                // Foto kecil kiri bawah
                x = 20;
                y = gridStartY + topH + 10;
                photoW = bottomW;
                photoH = bottomH;
            } else {
                // Foto kecil kanan bawah
                x = 20 + bottomW + 10;
                y = gridStartY + topH + 10;
                photoW = bottomW;
                photoH = bottomH;
            }
        } else {
            photoW = (w - 50) / 2;
            photoH = (gridH - 10) / 2;
            x = (i % 2) * (photoW + 10) + 20;
            y = Math.floor(i / 2) * (photoH + 10) + gridStartY;
        }

        // Name label at bottom of each video
        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.fillRect(x + 10, y + photoH - 35, 150, 25);
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '14px Courier New';
        ctx.fillText(`Participant ${i + 1}`, x + 20, y + photoH - 17);
    });

    // Bottom control bar
    ctx.fillStyle = '#1C1C1C';
    ctx.fillRect(0, h - 70, w, 70);

    // Control buttons
    const controls = [
        { icon: '🎤', label: 'Mute' },
        { icon: '🎥', label: 'Stop Video' },
        { icon: '👥', label: 'Participants' },
        { icon: '💬', label: 'Chat' },
        { icon: '🎬', label: 'Record' },
        { icon: '😊', label: 'Reactions' }
    ];

    const btnSpacing = (w - 200) / controls.length;
    controls.forEach((ctrl, i) => {
        const btnX = 100 + i * btnSpacing;
        ctx.font = '28px Courier New';
        ctx.fillStyle = '#FFFFFF';
        ctx.textAlign = 'center';
        ctx.fillText(ctrl.icon, btnX, h - 35);
        ctx.font = '12px Courier New';
        ctx.fillText(ctrl.label, btnX, h - 12);
    });

    // Leave button (red)
    ctx.fillStyle = '#E74C3C';
    ctx.fillRect(w - 120, h - 55, 100, 40);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 16px Courier New';
    ctx.fillText('Leave', w - 70, h - 28);

    ctx.textAlign = 'left';
}

function renderMagazineFrame(ctx, photos, photoCount) {
    const w = 1000, h = 1200;

    // Aged newspaper background
    ctx.fillStyle = '#F4E8D0';
    ctx.fillRect(0, 0, w, h);

    // Add aged paper texture
    ctx.strokeStyle = 'rgba(0,0,0,0.03)';
    ctx.lineWidth = 1;
    for (let i = 0; i < h; i += 25) {
        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(w, i);
        ctx.stroke();
    }

    // Newspaper masthead
    ctx.fillStyle = '#000000';
    ctx.font = 'bold 52px Courier New';
    ctx.textAlign = 'center';
    ctx.fillText('THE NEWSPAPER NAME', w / 2, 65);

    // Decorative lines
    ctx.fillRect(50, 80, w - 100, 2);
    ctx.fillRect(50, 85, w - 100, 1);

    // Date and edition info
    ctx.font = '12px Courier New';
    ctx.fillText('Vol. XXIV No. 127 | ' + new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }), w / 2, 105);

    // Main headline
    ctx.font = 'bold 32px Courier New';
    ctx.fillText('YOUR HEADLINE HERE', w / 2, 145);

    // Subheading
    ctx.font = 'italic 14px Courier New';
    ctx.fillText('A memorable moment captured in time', w / 2, 168);

    ctx.textAlign = 'left';

    // Layout photos with irregular positioning (like real newspaper)
    let currentY = 190;

    if (photoCount === 1) {
        // Single large photo on left, text on right
        drawImageCover(ctx, photos[0], 60, currentY, 420, 350);

        // Text columns next to photo
        renderNewspaperText(ctx, 500, currentY, 440, 350, 2);
        currentY += 370;
    } else if (photoCount === 2) {
        // Two photos TIDAK berdempet - foto 1 atas kiri, foto 2 bawah kanan dengan teks di tengah
        drawImageCover(ctx, photos[0], 60, currentY, 380, 240);

        // Text column di kanan atas
        renderNewspaperText(ctx, 460, currentY, 480, 240, 2);
        currentY += 260;

        // Text column di kiri bawah
        renderNewspaperText(ctx, 60, currentY, 320, 220, 1);

        // Foto 2 di kanan bawah
        drawImageCover(ctx, photos[1], 400, currentY, 540, 220);
        currentY += 240;
    } else if (photoCount === 3) {
        // One large photo top, two smaller below irregular
        drawImageCover(ctx, photos[0], 60, currentY, 880, 260);
        currentY += 280;
        drawImageCover(ctx, photos[1], 60, currentY, 420, 240);

        // Text between photos
        renderNewspaperText(ctx, 500, currentY, 200, 240, 1);
        drawImageCover(ctx, photos[2], 720, currentY, 220, 240);
        currentY += 260;
    } else {
        // Irregular 4-photo layout - 1 foto dipaling bawah
        drawImageCover(ctx, photos[0], 60, currentY, 360, 200);

        // Text di kanan atas
        renderNewspaperText(ctx, 440, currentY, 500, 200, 2);
        currentY += 220;

        // Foto 2 dan 3 dengan text
        drawImageCover(ctx, photos[1], 60, currentY, 280, 180);
        renderNewspaperText(ctx, 360, currentY, 180, 180, 1);
        drawImageCover(ctx, photos[2], 560, currentY, 380, 180);
        currentY += 200;

        // Text row sebelum foto terakhir
        renderNewspaperText(ctx, 60, currentY, 880, 70, 3);
        currentY += 85;

        // Foto 4 PALING BAWAH (lebar penuh)
        drawImageCover(ctx, photos[3], 60, currentY, 880, 220);
        currentY += 240;
    }

    // "EXTRA! EXTRA!" section with border
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 3;
    ctx.strokeRect(55, currentY, w - 110, 50);
    ctx.font = 'bold 28px Courier New';
    ctx.fillStyle = '#000000';
    ctx.textAlign = 'center';
    ctx.fillText('EXTRA! EXTRA! READ ALL ABOUT IT!', w / 2, currentY + 35);
    currentY += 65;

    // Bottom text columns with actual-looking text
    renderNewspaperText(ctx, 60, currentY, w - 120, h - currentY - 40, 3);

    ctx.textAlign = 'left';
}

// Helper function to render realistic newspaper text
function renderNewspaperText(ctx, x, y, width, height, columns) {
    ctx.fillStyle = '#000000';
    ctx.font = '9px Courier New';
    ctx.textAlign = 'left';

    const columnW = (width - (columns - 1) * 15) / columns;
    const loremWords = 'Lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua Ut enim ad minim veniam quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur'.split(' ');

    for (let col = 0; col < columns; col++) {
        const colX = x + col * (columnW + 15);
        let lineY = y + 12;
        let wordIndex = Math.floor(Math.random() * loremWords.length);

        while (lineY < y + height - 10) {
            let line = '';
            let lineWidth = 0;

            // Build line word by word
            while (lineWidth < columnW - 10) {
                const word = loremWords[wordIndex % loremWords.length];
                const testLine = line + (line ? ' ' : '') + word;
                const testWidth = ctx.measureText(testLine).width;

                if (testWidth > columnW - 10 && line) break;

                line = testLine;
                lineWidth = testWidth;
                wordIndex++;
            }

            // Draw the line of text
            ctx.fillText(line, colX, lineY);
            lineY += 11;

            // Occasionally add bold headlines within text
            if (Math.random() < 0.15 && lineY < y + height - 30) {
                ctx.font = 'bold 10px Courier New';
                ctx.fillText(loremWords[wordIndex % loremWords.length].toUpperCase() + ' ' +
                           loremWords[(wordIndex + 1) % loremWords.length].toUpperCase(), colX, lineY + 8);
                lineY += 18;
                ctx.font = '9px Courier New';
                wordIndex += 2;
            }
        }
    }
}

// Screen 5: Final Composition
async function createFinalComposition() {
    showScreen('screen-composition');

    const canvas = document.getElementById('final-canvas');
    const ctx = canvas.getContext('2d');

    const frame = state.selectedFrame;
    canvas.width = frame.width;
    canvas.height = frame.height;

    // Load photos
    const photos = await Promise.all(state.selectedPhotos.map(loadImage));

    // Use frame's render function
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

// Download
document.getElementById('btn-download').addEventListener('click', () => {
    const canvas = document.getElementById('final-canvas');
    const link = document.createElement('a');
    link.download = `photobooth-${Date.now()}.jpg`;
    link.href = canvas.toDataURL('image/jpeg', 0.95);
    link.click();
});

// Restart
document.getElementById('btn-restart').addEventListener('click', () => {
    state.photoCount = 0;
    state.currentPhotoIndex = 0;
    state.capturedPhotos = [];
    state.selectedPhotos = [];
    state.selectedFrame = null;

    showScreen('screen-count-selection');
});
