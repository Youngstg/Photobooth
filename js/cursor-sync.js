// Cursor Synchronization Module
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

// Avatar vector icons map
export const AVATARS = {
    cat: {
        label: 'Kitty',
        svg: `<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M12 15a2 2 0 1 0 0-4 2 2 0 0 0 0 4zm-7.5-3a7.5 7.5 0 0 0 15 0c0-1.5-.4-2.9-1.2-4.1l1.7-4.4-4.5 1.7A7.47 7.47 0 0 0 12 4.5c-1.5 0-2.9.4-4.1 1.2L3.4 4l1.7 4.5c-.8 1.2-1.2 2.6-1.2 4z"/></svg>`
    },
    bunny: {
        label: 'Bunny',
        svg: `<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M6.5 2C5.1 2 4 3.1 4 4.5v6c0 1.4 1.1 2.5 2.5 2.5h.3A7.5 7.5 0 0 0 12 19.5a7.5 7.5 0 0 0 5.2-6.5h.3c1.4 0 2.5-1.1 2.5-2.5v-6C20 3.1 18.9 2 17.5 2S15 3.1 15 4.5v5.2A7.44 7.44 0 0 0 12 9a7.44 7.44 0 0 0-3-.7V4.5C9 3.1 7.9 2 6.5 2zM12 15a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3z"/></svg>`
    },
    bear: {
        label: 'Bear',
        svg: `<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M19.5 4.5a3.5 3.5 0 0 0-3.3 2.3A7.95 7.95 0 0 0 12 6a7.95 7.95 0 0 0-4.2.8A3.5 3.5 0 1 0 4.5 11c0 .2.02.4.05.6A7.98 7.98 0 0 0 12 22a7.98 7.98 0 0 0 7.45-10.4c.03-.2.05-.4.05-.6a3.5 3.5 0 0 0 0-6.5zM9 11a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm6 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm-3 6c-1.5 0-2.5-.8-2.5-1.5s1-1.5 2.5-1.5 2.5.8 2.5 1.5-1 1.5-2.5 1.5z"/></svg>`
    },
    heart: {
        label: 'Heart',
        svg: `<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>`
    },
    star: {
        label: 'Star',
        svg: `<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>`
    },
    camera: {
        label: 'Camera',
        svg: `<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M9 2L7.17 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2h-3.17L15 2H9zm3 15c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/></svg>`
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
 * Animation loop using lerp (linear interpolation) for smooth 60fps movement
 */
function startCursorAnimationLoop() {
    if (isAnimating) return;
    isAnimating = true;

    function renderLoop() {
        if (remoteCursorEl && state.isMultiplayer) {
            const lerpFactor = 0.35;
            currentX += (targetX - currentX) * lerpFactor;
            currentY += (targetY - currentY) * lerpFactor;

            remoteCursorEl.style.left = `${currentX}%`;
            remoteCursorEl.style.top = `${currentY}%`;
        }
        requestAnimationFrame(renderLoop);
    }

    requestAnimationFrame(renderLoop);
}

/**
 * Reset and hide remote cursor
 */
export function hideRemoteCursor() {
    if (remoteCursorEl) {
        remoteCursorEl.classList.add('hidden');
    }
}
