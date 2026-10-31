import { FaceLandmarker, FilesetResolver } from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/+esm";
import { state } from './state.js';

let faceLandmarker = null;
let lastVideoTime = -1;
let lastResults = null;
let activeFilter = 'none';
let trackingLoopId = null;
let isARReady = false;
let isLoopRequested = false;

// AR overlay canvases (per layout)
let canvasY2k = null;
let ctxY2k = null;
let canvasDuo = null;
let ctxDuo = null;

// Preload Prop Graphic Assets (WebP format)
const propImages = {};
const PROPS_MANIFEST = {
    cowboy: 'Assets/props/cowboy_hat.webp',
    mustache: 'Assets/props/mustache.webp',
    sunglasses: 'Assets/props/sunglasses.webp',
    crown: 'Assets/props/crown.webp',
    cat: 'Assets/props/cat_ears.webp'
};

function preloadProps() {
    for (const [key, path] of Object.entries(PROPS_MANIFEST)) {
        const img = new Image();
        img.src = path;
        propImages[key] = img;
    }
}
preloadProps();

export async function initAR() {
    console.log("Initializing MediaPipe FaceLandmarker for Props...");
    setARButtonsLoadingState(true);

    try {
        const filesetResolver = await FilesetResolver.forVisionTasks(
            "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm"
        );
        
        try {
            faceLandmarker = await FaceLandmarker.createFromOptions(filesetResolver, {
                baseOptions: {
                    modelAssetPath: `https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task`,
                    delegate: "GPU"
                },
                outputFaceBlendshapes: false,
                runningMode: "VIDEO",
                numFaces: 4
            });
            console.log("✓ MediaPipe FaceLandmarker (GPU) initialized successfully!");
        } catch (gpuErr) {
            console.warn("GPU delegate failed, falling back to CPU mode:", gpuErr);
            faceLandmarker = await FaceLandmarker.createFromOptions(filesetResolver, {
                baseOptions: {
                    modelAssetPath: `https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task`,
                    delegate: "CPU"
                },
                outputFaceBlendshapes: false,
                runningMode: "VIDEO",
                numFaces: 4
            });
            console.log("✓ MediaPipe FaceLandmarker (CPU) initialized successfully!");
        }

        isARReady = true;
        setARButtonsLoadingState(false);
        setupUI();
        
        if (isLoopRequested) {
            startARLoop();
        }
    } catch (e) {
        console.error("Failed to load FaceLandmarker:", e);
        setARButtonsLoadingState(false, true);
    }
}

/**
 * Update AR button states: loading indication
 */
function setARButtonsLoadingState(isLoading, isError = false) {
    const arBtns = document.querySelectorAll('.ar-btn');
    arBtns.forEach(btn => {
        if (isLoading && btn.dataset.filter !== 'none') {
            btn.style.opacity = '0.7';
            btn.setAttribute('title', 'Memuat model AR...');
        } else if (isError) {
            btn.style.opacity = '0.5';
            btn.setAttribute('title', 'Koneksi AR terganggu');
        } else {
            btn.style.opacity = '';
            btn.style.cursor = 'pointer';
        }
    });

    const filterBoxes = document.querySelectorAll('.ar-filter-box');
    filterBoxes.forEach(box => {
        let badge = box.querySelector('.ar-loading-badge');
        if (isLoading) {
            if (!badge) {
                badge = document.createElement('div');
                badge.className = 'ar-loading-badge';
                badge.textContent = '⏳ Memuat AR...';
                badge.style.fontSize = '11px';
                badge.style.color = '#8370F5';
                box.insertBefore(badge, box.firstChild);
            }
        } else {
            if (badge) badge.remove();
        }
    });
}

export function setupUI() {
    document.querySelectorAll('.ar-btn').forEach(btn => {
        btn.onclick = (e) => {
            const target = e.currentTarget;
            document.querySelectorAll('.ar-btn').forEach(b => b.classList.remove('active'));
            target.classList.add('active');
            activeFilter = target.getAttribute('data-filter') || 'none';
            console.log("AR Prop selected:", activeFilter);
        };
    });
}

// Initial binding
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupUI);
} else {
    setupUI();
}

export function startARLoop() {
    isLoopRequested = true;
    canvasY2k = document.getElementById('ar-overlay-y2k');
    ctxY2k = canvasY2k ? canvasY2k.getContext('2d') : null;

    canvasDuo = document.getElementById('ar-overlay-duo-local');
    ctxDuo = canvasDuo ? canvasDuo.getContext('2d') : null;

    if (!faceLandmarker) {
        console.log("FaceLandmarker loading in progress... Loop will start once loaded.");
        return;
    }

    if (trackingLoopId) {
        cancelAnimationFrame(trackingLoopId);
    }
    lastVideoTime = -1;
    renderAR();
}

export function stopARLoop() {
    isLoopRequested = false;
    if (trackingLoopId) {
        cancelAnimationFrame(trackingLoopId);
        trackingLoopId = null;
    }
    lastResults = null;
    if (ctxY2k && canvasY2k) ctxY2k.clearRect(0, 0, canvasY2k.width, canvasY2k.height);
    if (ctxDuo && canvasDuo) ctxDuo.clearRect(0, 0, canvasDuo.width, canvasDuo.height);
}

function renderAR() {
    if (!isLoopRequested) return;

    let video, canvas, ctx;

    if (state.isMultiplayer) {
        video = document.getElementById('video-duo-local');
        canvas = canvasDuo;
        ctx = ctxDuo;
    } else {
        video = document.getElementById('video-y2k');
        canvas = canvasY2k;
        ctx = ctxY2k;
    }

    if (!video || !canvas || !ctx || video.videoWidth === 0 || video.readyState < 2) {
        trackingLoopId = requestAnimationFrame(renderAR);
        return;
    }

    // Sync canvas resolution to actual video dimensions
    if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
    }

    // Process video frame with MediaPipe FaceLandmarker
    if (faceLandmarker && video.currentTime !== lastVideoTime) {
        lastVideoTime = video.currentTime;
        try {
            lastResults = faceLandmarker.detectForVideo(video, performance.now());
        } catch(e) {
            console.error("Landmarker detect error:", e);
        }
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (lastResults && lastResults.faceLandmarks && activeFilter !== 'none') {
        for (const landmarks of lastResults.faceLandmarks) {
            drawPropFilter(ctx, landmarks, canvas.width, canvas.height);
        }
    }

    trackingLoopId = requestAnimationFrame(renderAR);
}

/**
 * Draws image with translation, rotation, and custom anchor center
 */
function drawPropImage(ctx, img, cx, cy, angle, targetWidth, targetHeight, anchorXRatio = 0.5, anchorYRatio = 0.5) {
    if (!img || !img.complete || img.naturalWidth === 0) return;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(angle);
    const drawX = -targetWidth * anchorXRatio;
    const drawY = -targetHeight * anchorYRatio;
    ctx.drawImage(img, drawX, drawY, targetWidth, targetHeight);
    ctx.restore();
}

/**
 * Align and draw AR props matching head rotation, tilt, and scale
 */
function drawPropFilter(ctx, landmarks, w, h) {
    if (!landmarks || landmarks.length === 0) return;

    // Key MediaPipe Face Landmarks
    const forehead = landmarks[10];      // Top of forehead
    const leftTemple = landmarks[234];   // Left temple / ear
    const rightTemple = landmarks[454];  // Right temple / ear
    const leftEye = landmarks[33];       // Left eye outer
    const rightEye = landmarks[263];     // Right eye outer
    const bridge = landmarks[168];       // Nose bridge between eyes
    const philtrum = landmarks[164];     // Upper lip philtrum (below nose)
    const mouthLeft = landmarks[61];     // Left mouth corner
    const mouthRight = landmarks[291];   // Right mouth corner

    // Head orientation and geometry
    const headDx = (rightTemple.x - leftTemple.x) * w;
    const headDy = (rightTemple.y - leftTemple.y) * h;
    const headAngle = Math.atan2(headDy, headDx);
    const headWidth = Math.hypot(headDx, headDy);

    // Eye line rotation
    const eyeDx = (rightEye.x - leftEye.x) * w;
    const eyeDy = (rightEye.y - leftEye.y) * h;
    const eyeAngle = Math.atan2(eyeDy, eyeDx);

    // Mouth line rotation
    const mouthDx = (mouthRight.x - mouthLeft.x) * w;
    const mouthDy = (mouthRight.y - mouthLeft.y) * h;
    const mouthAngle = Math.atan2(mouthDy, mouthDx);

    // Anchor points in canvas pixels
    const fx = forehead.x * w;
    const fy = forehead.y * h;
    const bx = bridge.x * w;
    const by = bridge.y * h;
    const mx = philtrum.x * w;
    const my = philtrum.y * h;

    // Helper functions for individual props
    const drawCowboyHat = () => {
        const img = propImages.cowboy;
        const targetW = headWidth * 1.85;
        const targetH = targetW * (400 / 600);
        drawPropImage(ctx, img, fx, fy, headAngle, targetW, targetH, 0.5, 0.73);
    };

    const drawMustache = () => {
        const img = propImages.mustache;
        const targetW = headWidth * 0.65;
        const targetH = targetW * (200 / 400);
        drawPropImage(ctx, img, mx, my, mouthAngle, targetW, targetH, 0.5, 0.45);
    };

    const drawSunglasses = () => {
        const img = propImages.sunglasses;
        const targetW = headWidth * 1.05;
        const targetH = targetW * (200 / 500);
        drawPropImage(ctx, img, bx, by, eyeAngle, targetW, targetH, 0.5, 0.5);
    };

    const drawCrown = () => {
        const img = propImages.crown;
        const targetW = headWidth * 1.15;
        const targetH = targetW * (300 / 400);
        drawPropImage(ctx, img, fx, fy, headAngle, targetW, targetH, 0.5, 0.88);
    };

    const drawCatEars = () => {
        const img = propImages.cat;
        const targetW = headWidth * 1.25;
        const targetH = targetW * (250 / 400);
        drawPropImage(ctx, img, fx, fy, headAngle, targetW, targetH, 0.5, 0.82);
    };

    switch (activeFilter) {
        case 'cowboy':
            drawCowboyHat();
            break;
        case 'mustache':
            drawMustache();
            break;
        case 'cowboy_mustache':
            drawCowboyHat();
            drawMustache();
            break;
        case 'glasses':
            drawSunglasses();
            break;
        case 'crown':
            drawCrown();
            break;
        case 'cat':
            drawCatEars();
            break;
        case 'party':
            drawCrown();
            drawSunglasses();
            drawMustache();
            break;
        case 'star':
            ctx.save();
            ctx.translate(bx, by);
            ctx.font = `${headWidth * 0.7}px sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('✨', 0, 0);
            ctx.restore();
            break;
        case 'bunny':
            ctx.save();
            ctx.translate(fx, fy);
            ctx.font = `${headWidth * 1.1}px sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'bottom';
            ctx.fillText('🐰', 0, 0);
            ctx.restore();
            break;
    }
}

/**
 * Burn AR overlay onto captured photo canvas
 */
export function applyARToCapture(canvas, ctx) {
    const overlayCanvas = state.isMultiplayer ? canvasDuo : canvasY2k;
    if (overlayCanvas && activeFilter !== 'none') {
        ctx.save();
        // Match the horizontal mirroring applied to the camera photo
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(overlayCanvas, 0, 0, canvas.width, canvas.height);
        ctx.restore();
    }
}
