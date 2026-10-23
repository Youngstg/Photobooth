import { FaceLandmarker, FilesetResolver } from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/+esm";
import { state } from './state.js';

let faceLandmarker = null;
let lastVideoTime = -1;
let activeFilter = 'none';
let trackingLoopId = null;
let isARReady = false;

// AR overlay canvases (per layout)
let canvasY2k = null;
let ctxY2k = null;
let canvasDuo = null;  // Support AR in Duo Mode
let ctxDuo = null;

export async function initAR() {
    console.log("Initializing MediaPipe FaceLandmarker...");

    // FIX #15 (High): Show loading state on AR buttons while model loads
    setARButtonsLoadingState(true);

    try {
        const filesetResolver = await FilesetResolver.forVisionTasks(
            "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm"
        );
        faceLandmarker = await FaceLandmarker.createFromOptions(filesetResolver, {
            baseOptions: {
                modelAssetPath: `https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task`,
                delegate: "GPU"
            },
            outputFaceBlendshapes: false,
            runningMode: "VIDEO",
            numFaces: 2
        });
        isARReady = true;
        console.log("FaceLandmarker initialized!");
        setARButtonsLoadingState(false);
        setupUI();
    } catch (e) {
        console.error("Failed to load FaceLandmarker:", e);
        setARButtonsLoadingState(false, true); // error state
    }
}

/**
 * Update AR button states: disabled while loading, enabled when ready
 */
function setARButtonsLoadingState(isLoading, isError = false) {
    const arBtns = document.querySelectorAll('.ar-btn:not([data-filter="none"])');
    arBtns.forEach(btn => {
        if (isLoading) {
            btn.disabled = true;
            btn.setAttribute('title', 'Filter AR sedang dimuat...');
            btn.style.opacity = '0.5';
            btn.style.cursor = 'wait';
        } else if (isError) {
            btn.disabled = true;
            btn.setAttribute('title', 'Filter AR gagal dimuat (cek koneksi internet)');
            btn.style.opacity = '0.4';
        } else {
            btn.disabled = false;
            btn.setAttribute('title', btn.dataset.filter);
            btn.style.opacity = '';
            btn.style.cursor = '';
        }
    });

    // Show/hide loading badge on filter section
    const filterBoxes = document.querySelectorAll('.ar-filter-box');
    filterBoxes.forEach(box => {
        let badge = box.querySelector('.ar-loading-badge');
        if (isLoading) {
            if (!badge) {
                badge = document.createElement('div');
                badge.className = 'ar-loading-badge';
                badge.textContent = '⏳ Filter AR dimuat...';
                box.insertBefore(badge, box.firstChild);
            }
        } else {
            if (badge) badge.remove();
        }
    });
}

function setupUI() {
    document.querySelectorAll('.ar-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            if (!isARReady && btn.dataset.filter !== 'none') return;
            document.querySelectorAll('.ar-btn').forEach(b => b.classList.remove('active'));
            const target = e.currentTarget;
            target.classList.add('active');
            activeFilter = target.getAttribute('data-filter');
            console.log("AR Filter selected:", activeFilter);
        });
    });
}

export function startARLoop() {
    if (!faceLandmarker) return;
    
    canvasY2k = document.getElementById('ar-overlay-y2k');
    ctxY2k = canvasY2k ? canvasY2k.getContext('2d') : null;

    // FIX #11: Support AR canvas in Duo mode
    canvasDuo = document.getElementById('ar-overlay-duo-local');
    ctxDuo = canvasDuo ? canvasDuo.getContext('2d') : null;

    if (trackingLoopId) {
        cancelAnimationFrame(trackingLoopId);
    }
    lastVideoTime = -1;
    renderAR();
}

export function stopARLoop() {
    if (trackingLoopId) {
        cancelAnimationFrame(trackingLoopId);
        trackingLoopId = null;
    }
    // Clear all canvases
    if (ctxY2k && canvasY2k) ctxY2k.clearRect(0, 0, canvasY2k.width, canvasY2k.height);
    if (ctxDuo && canvasDuo) ctxDuo.clearRect(0, 0, canvasDuo.width, canvasDuo.height);
}

function renderAR() {
    // FIX #11: Choose video element and canvas based on current mode
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

    if (!video || !canvas || !ctx || video.videoWidth === 0) {
        trackingLoopId = requestAnimationFrame(renderAR);
        return;
    }

    // Sync canvas size to video
    if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
    }

    // Process frame
    let results = null;
    if (video.currentTime !== lastVideoTime) {
        lastVideoTime = video.currentTime;
        try {
            results = faceLandmarker.detectForVideo(video, performance.now());
        } catch(e) {
            console.error("Landmarker error:", e);
        }
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (results && results.faceLandmarks && activeFilter !== 'none') {
        for (const landmarks of results.faceLandmarks) {
            drawFilter(ctx, landmarks, canvas.width, canvas.height);
        }
    }

    trackingLoopId = requestAnimationFrame(renderAR);
}




function drawFilter(ctx, landmarks, w, h) {
    ctx.save();
    
    if (activeFilter === 'glasses') {
        const leftEye = landmarks[33];
        const rightEye = landmarks[263];
        const lx = leftEye.x * w;
        const ly = leftEye.y * h;
        const rx = rightEye.x * w;
        const ry = rightEye.y * h;
        const dx = rx - lx;
        const dy = ry - ly;
        const dist = Math.sqrt(dx*dx + dy*dy);
        const angle = Math.atan2(dy, dx);
        const cx = (lx + rx) / 2;
        const cy = (ly + ry) / 2;
        const size = dist * 2.5;
        
        ctx.translate(cx, cy);
        ctx.rotate(angle);
        ctx.font = `${size}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🕶️', 0, 0);
    } 
    else if (activeFilter === 'crown' || activeFilter === 'hat') {
        const forehead = landmarks[10];
        const leftEar = landmarks[234];
        const rightEar = landmarks[454];
        const lx = leftEar.x * w;
        const rx = rightEar.x * w;
        const headWidth = Math.abs(rx - lx);
        const fx = forehead.x * w;
        const fy = forehead.y * h;
        
        const emoji = activeFilter === 'crown' ? '👑' : '🎩';
        const size = headWidth * 1.5;
        
        ctx.translate(fx, fy - (size * 0.3));
        ctx.font = `${size}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        ctx.fillText(emoji, 0, 0);
    }
    else if (activeFilter === 'bunny') {
        const forehead = landmarks[10];
        const leftEar = landmarks[234];
        const rightEar = landmarks[454];
        const lx = leftEar.x * w;
        const rx = rightEar.x * w;
        const headWidth = Math.abs(rx - lx);
        const fx = forehead.x * w;
        const fy = forehead.y * h;
        
        const size = headWidth * 1.2;
        
        ctx.translate(fx, fy);
        ctx.font = `${size}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        ctx.fillText('🐰', 0, size * 0.2);
    }
    else if (activeFilter === 'cat') {
        const nose = landmarks[1];
        const leftEar = landmarks[234];
        const rightEar = landmarks[454];
        const lx = leftEar.x * w;
        const rx = rightEar.x * w;
        const headWidth = Math.abs(rx - lx);
        const nx = nose.x * w;
        const ny = nose.y * h;
        
        const size = headWidth * 1.5;
        
        ctx.translate(nx, ny);
        ctx.font = `${size}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🐱', 0, 0);
    }
    else if (activeFilter === 'star') {
        const nose = landmarks[1];
        const leftEar = landmarks[234];
        const rightEar = landmarks[454];
        const lx = leftEar.x * w;
        const rx = rightEar.x * w;
        const headWidth = Math.abs(rx - lx);
        const nx = nose.x * w;
        const ny = nose.y * h;
        
        const size = headWidth * 1.2;
        
        ctx.translate(nx, ny - size*0.1);
        ctx.font = `${size}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🤩', 0, 0);
    }
    
    ctx.restore();
}

export function applyARToCapture(canvas, ctx) {
    // FIX #11: Use duo canvas if in multiplayer mode
    const overlayCanvas = state.isMultiplayer ? canvasDuo : canvasY2k;
    if (overlayCanvas && activeFilter !== 'none') {
        ctx.save();
        ctx.drawImage(overlayCanvas, 0, 0, canvas.width, canvas.height);
        ctx.restore();
    }
}
