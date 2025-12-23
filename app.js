// Global State
const state = {
    photoCount: 0, // Jumlah foto yang akan digunakan di frame
    requiredPhotoCount: 0, // Jumlah foto yang wajib dipilih
    totalCaptureCount: 0, // Total foto yang akan diambil (4x lipat)
    currentPhotoIndex: 0,
    capturedPhotos: [],
    selectedPhotos: [],
    selectedFrame: null,
    stream: null
};

// Frame Templates (akan dikembangkan lebih lanjut)
const frameTemplates = [
    {
        id: 'single',
        name: 'Single Photo',
        layout: 'single',
        width: 800,
        height: 1000
    },
    {
        id: 'double-vertical',
        name: 'Double Vertical',
        layout: 'double-vertical',
        width: 800,
        height: 1000
    },
    {
        id: 'triple-grid',
        name: 'Triple Grid',
        layout: 'triple-grid',
        width: 1000,
        height: 800
    },
    {
        id: 'quad-grid',
        name: 'Quad Grid',
        layout: 'quad-grid',
        width: 1000,
        height: 1000
    }
];

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
        state.photoCount = parseInt(e.target.dataset.count);
        state.requiredPhotoCount = state.photoCount;
        state.totalCaptureCount = state.photoCount * 4; // 4x lipat
        state.currentPhotoIndex = 0;
        state.capturedPhotos = [];
        state.selectedPhotos = [];

        document.getElementById('total-photos').textContent = state.totalCaptureCount;
        startCamera();
    });
});

// Screen 2: Camera
async function startCamera() {
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

        updatePhotoCounter();
    } catch (error) {
        alert('Tidak dapat mengakses kamera. Pastikan Anda memberikan izin kamera.');
        showScreen('screen-count-selection');
    }
}

function updatePhotoCounter() {
    document.getElementById('current-photo').textContent = state.currentPhotoIndex + 1;
}

document.getElementById('btn-capture').addEventListener('click', () => {
    const countdownEl = document.getElementById('countdown');
    const btnCapture = document.getElementById('btn-capture');

    btnCapture.disabled = true;

    let count = 3;
    countdownEl.textContent = count;

    const countdownInterval = setInterval(() => {
        count--;
        if (count > 0) {
            countdownEl.textContent = count;
        } else {
            clearInterval(countdownInterval);
            countdownEl.textContent = '';
            capturePhoto();
            btnCapture.disabled = false;
        }
    }, 1000);
});

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

    if (state.currentPhotoIndex < state.totalCaptureCount) {
        updatePhotoCounter();
    } else {
        stopCamera();
        showReviewScreen();
    }
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
function showFrameSelection() {
    showScreen('screen-frame-selection');

    const frameGrid = document.getElementById('frame-grid');
    frameGrid.innerHTML = '';

    frameTemplates.forEach(frame => {
        const frameItem = document.createElement('div');
        frameItem.className = 'frame-item';

        // Generate preview canvas for frame
        const previewCanvas = document.createElement('canvas');
        previewCanvas.width = 250;
        previewCanvas.height = 250;
        const ctx = previewCanvas.getContext('2d');

        // Draw simple preview based on layout
        drawFramePreview(ctx, frame.layout, 250, 250);

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

function drawFramePreview(ctx, layout, width, height) {
    ctx.fillStyle = '#f0f0f0';
    ctx.fillRect(0, 0, width, height);

    ctx.strokeStyle = '#667eea';
    ctx.lineWidth = 3;

    switch(layout) {
        case 'single':
            ctx.strokeRect(10, 10, width - 20, height - 20);
            break;
        case 'double-vertical':
            ctx.strokeRect(10, 10, width - 20, height/2 - 15);
            ctx.strokeRect(10, height/2 + 5, width - 20, height/2 - 15);
            break;
        case 'triple-grid':
            ctx.strokeRect(10, 10, width - 20, height/2 - 15);
            ctx.strokeRect(10, height/2 + 5, width/2 - 15, height/2 - 15);
            ctx.strokeRect(width/2 + 5, height/2 + 5, width/2 - 15, height/2 - 15);
            break;
        case 'quad-grid':
            ctx.strokeRect(10, 10, width/2 - 15, height/2 - 15);
            ctx.strokeRect(width/2 + 5, 10, width/2 - 15, height/2 - 15);
            ctx.strokeRect(10, height/2 + 5, width/2 - 15, height/2 - 15);
            ctx.strokeRect(width/2 + 5, height/2 + 5, width/2 - 15, height/2 - 15);
            break;
    }
}

document.getElementById('btn-back-to-review').addEventListener('click', () => {
    showReviewScreen();
});

// Screen 5: Final Composition
async function createFinalComposition() {
    showScreen('screen-composition');

    const canvas = document.getElementById('final-canvas');
    const ctx = canvas.getContext('2d');

    const frame = state.selectedFrame;
    canvas.width = frame.width;
    canvas.height = frame.height;

    // White background
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Load and draw photos based on layout
    const photos = await Promise.all(state.selectedPhotos.map(loadImage));

    drawPhotosInFrame(ctx, photos, frame);
}

function loadImage(src) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = src;
    });
}

function drawPhotosInFrame(ctx, photos, frame) {
    const padding = 20;
    const gap = 10;

    switch(frame.layout) {
        case 'single':
            if (photos[0]) {
                drawImageCover(ctx, photos[0], padding, padding,
                    frame.width - padding*2, frame.height - padding*2);
            }
            break;

        case 'double-vertical':
            const halfHeight = (frame.height - padding*2 - gap) / 2;
            if (photos[0]) {
                drawImageCover(ctx, photos[0], padding, padding,
                    frame.width - padding*2, halfHeight);
            }
            if (photos[1]) {
                drawImageCover(ctx, photos[1], padding, padding + halfHeight + gap,
                    frame.width - padding*2, halfHeight);
            }
            break;

        case 'triple-grid':
            const topHeight = (frame.height - padding*2 - gap) * 0.6;
            const bottomHeight = (frame.height - padding*2 - gap) * 0.4;
            const halfWidth = (frame.width - padding*2 - gap) / 2;

            if (photos[0]) {
                drawImageCover(ctx, photos[0], padding, padding,
                    frame.width - padding*2, topHeight);
            }
            if (photos[1]) {
                drawImageCover(ctx, photos[1], padding, padding + topHeight + gap,
                    halfWidth, bottomHeight);
            }
            if (photos[2]) {
                drawImageCover(ctx, photos[2], padding + halfWidth + gap, padding + topHeight + gap,
                    halfWidth, bottomHeight);
            }
            break;

        case 'quad-grid':
            const quadHalfH = (frame.height - padding*2 - gap) / 2;
            const quadHalfW = (frame.width - padding*2 - gap) / 2;

            if (photos[0]) {
                drawImageCover(ctx, photos[0], padding, padding, quadHalfW, quadHalfH);
            }
            if (photos[1]) {
                drawImageCover(ctx, photos[1], padding + quadHalfW + gap, padding, quadHalfW, quadHalfH);
            }
            if (photos[2]) {
                drawImageCover(ctx, photos[2], padding, padding + quadHalfH + gap, quadHalfW, quadHalfH);
            }
            if (photos[3]) {
                drawImageCover(ctx, photos[3], padding + quadHalfW + gap, padding + quadHalfH + gap,
                    quadHalfW, quadHalfH);
            }
            break;
    }
}

// Draw image with cover effect (no gaps, like CSS object-fit: cover)
function drawImageCover(ctx, img, x, y, width, height) {
    const imgRatio = img.width / img.height;
    const frameRatio = width / height;

    let sourceX = 0;
    let sourceY = 0;
    let sourceWidth = img.width;
    let sourceHeight = img.height;

    if (imgRatio > frameRatio) {
        // Image is wider than frame
        sourceWidth = img.height * frameRatio;
        sourceX = (img.width - sourceWidth) / 2;
    } else {
        // Image is taller than frame
        sourceHeight = img.width / frameRatio;
        sourceY = (img.height - sourceHeight) / 2;
    }

    ctx.drawImage(img, sourceX, sourceY, sourceWidth, sourceHeight, x, y, width, height);
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
