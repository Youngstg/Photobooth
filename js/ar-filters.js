import { FaceLandmarker, FilesetResolver } from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/+esm";
import { state } from './state.js';

let faceLandmarker = null;
let lastVideoTime = -1;
let activeFilter = 'none';
let trackingLoopId = null;

// The AR overlays
let canvasRetro = null;
let ctxRetro = null;
let canvasY2k = null;
let ctxY2k = null;

export async function initAR() {
    console.log("Initializing MediaPipe FaceLandmarker...");
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
        console.log("FaceLandmarker initialized!");
        setupUI();
    } catch (e) {
        console.error("Failed to load FaceLandmarker:", e);
    }
}

function setupUI() {
    document.querySelectorAll('.ar-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
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
    
    canvasRetro = document.getElementById('ar-overlay-retro');
    ctxRetro = canvasRetro ? canvasRetro.getContext('2d') : null;
    
    canvasY2k = document.getElementById('ar-overlay-y2k');
    ctxY2k = canvasY2k ? canvasY2k.getContext('2d') : null;

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
    // Clear canvases
    if (ctxRetro && canvasRetro) ctxRetro.clearRect(0, 0, canvasRetro.width, canvasRetro.height);
    if (ctxY2k && canvasY2k) ctxY2k.clearRect(0, 0, canvasY2k.width, canvasY2k.height);
}

function renderAR() {
    const video = state.theme === 'y2k' ? document.getElementById('video-y2k') : document.getElementById('video-retro');
    const canvas = state.theme === 'y2k' ? canvasY2k : canvasRetro;
    const ctx = state.theme === 'y2k' ? ctxY2k : ctxRetro;

    if (!video || !canvas || !ctx || video.videoWidth === 0) {
        trackingLoopId = requestAnimationFrame(renderAR);
        return;
    }

    // Sync canvas size
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
    const overlayCanvas = state.theme === 'y2k' ? canvasY2k : canvasRetro;
    if (overlayCanvas && activeFilter !== 'none') {
        ctx.save();
        ctx.drawImage(overlayCanvas, 0, 0, canvas.width, canvas.height);
        ctx.restore();
    }
}
