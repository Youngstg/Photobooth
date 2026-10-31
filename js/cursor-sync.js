// Cursor Synchronization Module
// FIX #7 (Critical): Added proper RAF cleanup to prevent memory leak from infinite animation loop
import { state } from './state.js';
import { sendMultiplayerMessage } from './multiplayer.js';

let cursorContainer = null;
let remoteCursorEl = null;
let lastSendTime = 0;
const SEND_INTERVAL_MS = 25; // ~40 FPS cursor updates

// Target and interpolated position for smooth 60fps rendering
let targetX = 50;
let targetY = 50;
let currentX = 50;
let currentY = 50;
let isAnimating = false;
let animationLoopId = null; // FIX: Track RAF ID for cleanup

// Avatar vector icons map
export const AVATARS = {
    cat: {
        label: 'Kitty',
        img: 'Assets/avatars/cat.webp',
        svg: `<img src="Assets/avatars/cat.webp" class="cursor-avatar-img" alt="Cat">`
    },
    bunny: {
        label: 'Bunny',
        img: 'Assets/avatars/bunny.webp?v=2',
        svg: `<img src="Assets/avatars/bunny.webp?v=2" class="cursor-avatar-img" alt="Bunny">`
    },
    bear: {
        label: 'Bear',
        img: 'Assets/avatars/bear.webp',
        svg: `<img src="Assets/avatars/bear.webp" class="cursor-avatar-img" alt="Bear">`
    },
    heart: {
        label: 'Heart',
        img: 'Assets/avatars/heart.webp',
        svg: `<img src="Assets/avatars/heart.webp" class="cursor-avatar-img" alt="Heart">`
    },
    star: {
        label: 'Star',
        img: 'Assets/avatars/star.webp',
        svg: `<img src="Assets/avatars/star.webp" class="cursor-avatar-img" alt="Star">`
    },
    camera: {
        label: 'Camera',
        img: 'Assets/avatars/camera.webp?v=2',
        svg: `<img src="Assets/avatars/camera.webp?v=2" class="cursor-avatar-img" alt="Camera">`
    }
};

// Distinct design presets for Host (Player 1) and Guest (Player 2)
export const PLAYER_DESIGNS = {
    host: {
        themeColor: '#FF69B4',
        accentColor: '#8370F5',
        gradient: 'linear-gradient(135deg, #FF69B4, #8370F5)',
        cursorSvg: `data:image/svg+xml;utf8,<svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M2 2L10.5 24.5L14.5 14.5L24.5 10.5L2 2Z" fill="%23FF69B4" stroke="white" stroke-width="2" stroke-linejoin="round"/><circle cx="14" cy="14" r="2.5" fill="white"/></svg>`,
        badgeClass: 'player-badge-host'
    },
    guest: {
        themeColor: '#00D2D3',
        accentColor: '#54A0FF',
        gradient: 'linear-gradient(135deg, #00D2D3, #54A0FF)',
        cursorSvg: `data:image/svg+xml;utf8,<svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M2 2L10.5 24.5L14.5 14.5L24.5 10.5L2 2Z" fill="%2300D2D3" stroke="white" stroke-width="2" stroke-linejoin="round"/><circle cx="14" cy="14" r="2.5" fill="white"/></svg>`,
        badgeClass: 'player-badge-guest'
    }
};

/**
 * Initialize cursor listeners and rendering layer
 */
export function initCursorSync() {
    createCursorOverlay();
    setupLocalCursorTracking();
    startCursorAnimationLoop();
}

function createCursorOverlay() {
    if (document.getElementById('cursor-layer')) return;

    cursorContainer = document.createElement('div');
    cursorContainer.id = 'cursor-layer';
    cursorContainer.className = 'cursor-layer';
    document.body.appendChild(cursorContainer);

    remoteCursorEl = document.createElement('div');
    remoteCursorEl.id = 'remote-partner-cursor';
    remoteCursorEl.className = 'remote-cursor hidden';
    remoteCursorEl.innerHTML = `
        <div class="remote-cursor-pointer">
            <svg class="cursor-arrow" width="28" height="28" viewBox="0 0 28 28" fill="none">
                <path class="cursor-path" d="M3 3L11.5 24.5L15.5 15.5L24.5 11.5L3 3Z" fill="#00D2D3" stroke="white" stroke-width="2.5" stroke-linejoin="round"/>
                <circle cx="15.5" cy="15.5" r="2.5" fill="white"/>
            </svg>
            <div class="cursor-sparkle-trail"></div>
        </div>
        <div class="remote-cursor-badge">
            <span class="cursor-avatar">${AVATARS.bunny.svg}</span>
            <span class="cursor-name">Partner</span>
        </div>
    `;
    cursorContainer.appendChild(remoteCursorEl);
}

function setupLocalCursorTracking() {
    // Mouse movement tracking normalized to 0-100%
    window.addEventListener('mousemove', (e) => {
        if (!state.isMultiplayer) return;

        const normX = (e.clientX / window.innerWidth) * 100;
        const normY = (e.clientY / window.innerHeight) * 100;

        const now = performance.now();
        if (now - lastSendTime > SEND_INTERVAL_MS) {
            lastSendTime = now;
            sendMultiplayerMessage({
                type: 'cursor_move',
                x: Number(normX.toFixed(2)),
                y: Number(normY.toFixed(2))
            });
        }
    });

    // Mouse click tracking for synced click burst animations
    window.addEventListener('click', (e) => {
        if (!state.isMultiplayer) return;

        const normX = (e.clientX / window.innerWidth) * 100;
        const normY = (e.clientY / window.innerHeight) * 100;

        sendMultiplayerMessage({
            type: 'cursor_click',
            x: Number(normX.toFixed(2)),
            y: Number(normY.toFixed(2))
        });
    });

    // Touch support for mobile devices
    window.addEventListener('touchmove', (e) => {
        if (!state.isMultiplayer || e.touches.length === 0) return;
        const touch = e.touches[0];
        const normX = (touch.clientX / window.innerWidth) * 100;
        const normY = (touch.clientY / window.innerHeight) * 100;

        const now = performance.now();
        if (now - lastSendTime > SEND_INTERVAL_MS) {
            lastSendTime = now;
            sendMultiplayerMessage({
                type: 'cursor_move',
                x: Number(normX.toFixed(2)),
                y: Number(normY.toFixed(2))
            });
        }
    }, { passive: true });
}

/**
 * Handle incoming cursor move from remote partner
 */
export function handleRemoteCursorMove(data) {
    if (!remoteCursorEl) return;

    targetX = data.x;
    targetY = data.y;

    if (remoteCursorEl.classList.contains('hidden')) {
        remoteCursorEl.classList.remove('hidden');
        currentX = targetX;
        currentY = targetY;
    }

    updateRemoteCursorDesign();
}

/**
 * Handle remote click ripple
 */
export function handleRemoteCursorClick(data) {
    createClickBurst(data.x, data.y, state.remotePlayer?.isHost ? 'host' : 'guest');
}

/**
 * Create cute animated click burst / ripple
 */
export function createClickBurst(normX, normY, role = 'guest') {
    if (!cursorContainer) return;

    const burst = document.createElement('div');
    burst.className = `click-burst click-burst-${role}`;
    burst.style.left = `${normX}%`;
    burst.style.top = `${normY}%`;

    burst.innerHTML = `
        <div class="burst-ring"></div>
        <div class="burst-symbol">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M12 2l2.4 7.2h7.6l-6.1 4.5 2.3 7.3-6.2-4.6-6.2 4.6 2.3-7.3-6.1-4.5h7.6z"/></svg>
        </div>
    `;

    cursorContainer.appendChild(burst);

    setTimeout(() => {
        if (burst && burst.parentNode) {
            burst.parentNode.removeChild(burst);
        }
    }, 900);
}

/**
 * Update partner cursor badge, colors, avatar, and name
 */
export function updateRemoteCursorDesign() {
    if (!remoteCursorEl) return;

    const partner = state.remotePlayer;
    if (!partner) return;

    const roleKey = partner.isHost ? 'host' : 'guest';
    const design = PLAYER_DESIGNS[roleKey] || PLAYER_DESIGNS.guest;

    const avatarEl = remoteCursorEl.querySelector('.cursor-avatar');
    const nameEl = remoteCursorEl.querySelector('.cursor-name');
    const pathEl = remoteCursorEl.querySelector('.cursor-path');
    const badgeEl = remoteCursorEl.querySelector('.remote-cursor-badge');

    const avatarObj = AVATARS[partner.avatar] || AVATARS.cat;
    if (avatarEl) avatarEl.innerHTML = avatarObj.svg || '';
    if (nameEl) nameEl.textContent = partner.name || (partner.isHost ? 'Host' : 'Partner');
    if (pathEl) pathEl.setAttribute('fill', design.themeColor);
    if (badgeEl) {
        badgeEl.style.background = design.gradient;
        badgeEl.style.boxShadow = `0 4px 15px ${design.themeColor}88`;
    }
}

/**
 * FIX #7 (Critical): Animation loop with proper RAF ID tracking
 * Loop only does work when in multiplayer mode to save CPU in solo mode
 */
function startCursorAnimationLoop() {
    if (isAnimating) return;
    isAnimating = true;

    function renderLoop() {
        // Only update cursor position when in multiplayer mode
        if (remoteCursorEl && state.isMultiplayer) {
            const lerpFactor = 0.35;
            currentX += (targetX - currentX) * lerpFactor;
            currentY += (targetY - currentY) * lerpFactor;

            remoteCursorEl.style.left = `${currentX}%`;
            remoteCursorEl.style.top = `${currentY}%`;
        }
        // FIX: Store RAF ID so it can be cancelled
        animationLoopId = requestAnimationFrame(renderLoop);
    }

    animationLoopId = requestAnimationFrame(renderLoop);
}

/**
 * FIX #7: Stop animation loop and release resources
 * Call this on disconnect/cleanup
 */
export function stopCursorAnimationLoop() {
    if (animationLoopId) {
        cancelAnimationFrame(animationLoopId);
        animationLoopId = null;
    }
    isAnimating = false;
}

/**
 * Reset and hide remote cursor
 */
export function hideRemoteCursor() {
    if (remoteCursorEl) {
        remoteCursorEl.classList.add('hidden');
    }
}
