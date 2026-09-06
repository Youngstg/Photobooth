// Live Reactions Vector Icons Module (Duo Collab)
import { state } from './state.js';
import { sendMultiplayerMessage } from './multiplayer.js';

export const REACTIONS = {
    heart: {
        id: 'heart',
        title: 'Heart',
        color: '#FF4757',
        svg: `<svg viewBox="0 0 24 24" width="22" height="22" fill="#FF4757"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>`
    },
    sparkle: {
        id: 'sparkle',
        title: 'Sparkle',
        color: '#FFD32A',
        svg: `<svg viewBox="0 0 24 24" width="22" height="22" fill="#FFD32A"><path d="M12 2L9.5 9.5 2 12l7.5 2.5L12 22l2.5-7.5L22 12l-7.5-2.5z"/></svg>`
    },
    star: {
        id: 'star',
        title: 'Star',
        color: '#FFA502',
        svg: `<svg viewBox="0 0 24 24" width="22" height="22" fill="#FFA502"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>`
    },
    camera: {
        id: 'camera',
        title: 'Camera',
        color: '#2ED573',
        svg: `<svg viewBox="0 0 24 24" width="22" height="22" fill="#2ED573"><path d="M9 2L7.17 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2h-3.17L15 2H9zm3 15c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/></svg>`
    },
    smile: {
        id: 'smile',
        title: 'Smile',
        color: '#1E90FF',
        svg: `<svg viewBox="0 0 24 24" width="22" height="22" fill="#1E90FF"><path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z"/></svg>`
    },
    fire: {
        id: 'fire',
        title: 'Fire',
        color: '#FF6348',
        svg: `<svg viewBox="0 0 24 24" width="22" height="22" fill="#FF6348"><path d="M13.5.67s.74 2.65.74 4.8c0 2.06-1.35 3.73-3.41 3.73-2.07 0-3.63-1.67-3.63-3.73l.03-.36C5.21 7.51 4 10.62 4 14c0 4.42 3.58 8 8 8s8-3.58 8-8C20 8.61 17.41 3.8 13.5.67zM11.71 19c-1.78 0-3.22-1.4-3.22-3.14 0-1.62 1.05-2.76 2.81-3.12 1.77-.36 3.6-1.21 4.62-2.58.39 1.29.59 2.65.59 4.04 0 2.65-2.15 4.8-4.8 4.8z"/></svg>`
    },
    thumbsUp: {
        id: 'thumbsUp',
        title: 'Like',
        color: '#70A1FF',
        svg: `<svg viewBox="0 0 24 24" width="22" height="22" fill="#70A1FF"><path d="M1 21h4V9H1v12zm22-11c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L14.17 1 7.59 7.59C7.22 7.95 7 8.45 7 9v10c0 1.1.9 2 2 2h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-2z"/></svg>`
    },
    bolt: {
        id: 'bolt',
        title: 'Energy',
        color: '#8370F5',
        svg: `<svg viewBox="0 0 24 24" width="22" height="22" fill="#8370F5"><path d="M7 2v11h3v9l7-12h-4l4-8z"/></svg>`
    }
};

let reactionBarEl = null;

export function initReactions() {
    createReactionBar();
}

function createReactionBar() {
    if (document.getElementById('live-reaction-bar')) return;

    reactionBarEl = document.createElement('div');
    reactionBarEl.id = 'live-reaction-bar';
    reactionBarEl.className = 'live-reaction-bar';

    Object.values(REACTIONS).forEach(reaction => {
        const btn = document.createElement('button');
        btn.className = 'reaction-btn';
        btn.innerHTML = reaction.svg;
        btn.title = reaction.title;
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            sendReaction(reaction.id);
        });
        reactionBarEl.appendChild(btn);
    });

    document.body.appendChild(reactionBarEl);
}

export function showReactionBar() {
    if (reactionBarEl) reactionBarEl.classList.add('visible');
}

export function hideReactionBar() {
    if (reactionBarEl) reactionBarEl.classList.remove('visible');
}

export function sendReaction(reactionId) {
    // Spawn locally
    spawnFloatingReaction(reactionId, Math.random() * 80 + 10, 85, true);

    // Send to partner
    if (state.isMultiplayer) {
        sendMultiplayerMessage({
            type: 'reaction',
            reactionId: reactionId,
            x: Math.random() * 80 + 10
        });
    }
}

export function handleRemoteReaction(data) {
    const reactionId = data.reactionId || (data.emoji ? mapEmojiToReactionId(data.emoji) : 'heart');
    spawnFloatingReaction(reactionId, data.x || Math.random() * 80 + 10, 85, false);
}

function mapEmojiToReactionId(emoji) {
    if (emoji === '💖') return 'heart';
    if (emoji === '✨') return 'sparkle';
    if (emoji === '📸') return 'camera';
    if (emoji === '😂') return 'smile';
    if (emoji === '🔥') return 'fire';
    if (emoji === '✌️') return 'peace';
    return 'heart';
}

export function spawnFloatingReaction(reactionId, startXPercent, startYPercent, isSelf = true) {
    const reaction = REACTIONS[reactionId] || REACTIONS.heart;
    const el = document.createElement('div');
    el.className = `floating-reaction ${isSelf ? 'self' : 'partner'}`;
    el.innerHTML = reaction.svg;
    el.style.left = `${startXPercent}%`;
    el.style.bottom = `${100 - startYPercent}%`;

    // Add slight random horizontal sway
    const randomOffset = (Math.random() - 0.5) * 60;
    el.style.setProperty('--sway-offset', `${randomOffset}px`);

    document.body.appendChild(el);

    setTimeout(() => {
        if (el && el.parentNode) {
            el.parentNode.removeChild(el);
        }
    }, 2200);
}
