// Live Reaction Emojis Module (Angie-style)
import { state } from './state.js';
import { sendMultiplayerMessage } from './multiplayer.js';

export const REACTION_EMOJIS = ['💖', '✨', '😂', '📸', '🎉', '🐶', '✌️', '🔥'];

let reactionBarEl = null;

export function initReactions() {
    createReactionBar();
}

function createReactionBar() {
    if (document.getElementById('live-reaction-bar')) return;

    reactionBarEl = document.createElement('div');
    reactionBarEl.id = 'live-reaction-bar';
    reactionBarEl.className = 'live-reaction-bar';
    
    REACTION_EMOJIS.forEach(emoji => {
        const btn = document.createElement('button');
        btn.className = 'reaction-btn';
        btn.textContent = emoji;
        btn.title = `Send ${emoji}`;
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            sendReaction(emoji);
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

export function sendReaction(emoji) {
    // Spawn locally
    spawnFloatingEmoji(emoji, Math.random() * 80 + 10, 85, true);

    // Send to partner
    if (state.isMultiplayer) {
        sendMultiplayerMessage({
            type: 'reaction',
            emoji: emoji,
            x: Math.random() * 80 + 10
        });
    }
}

export function handleRemoteReaction(data) {
    spawnFloatingEmoji(data.emoji, data.x || Math.random() * 80 + 10, 85, false);
}

export function spawnFloatingEmoji(emoji, startXPercent, startYPercent, isSelf = true) {
    const el = document.createElement('div');
    el.className = `floating-reaction ${isSelf ? 'self' : 'partner'}`;
    el.textContent = emoji;
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
