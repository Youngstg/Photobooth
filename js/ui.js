import { state } from './state.js';

export const motivationalQuotes = [
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
export function updateClock() {
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
export function changeQuote() {
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

// Update session photo count
export function updateSessionCount() {
    const countWidget = document.getElementById('session-count');
    if (countWidget) {
        countWidget.textContent = `${state.sessionPhotoCount} Photos`;
    }
}

// Screen Navigation
export function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    document.getElementById(screenId).classList.add('active');
}

export function setupUIListeners() {
    const quoteEl = document.getElementById('motivational-quote');
    if (quoteEl) {
        quoteEl.addEventListener('click', changeQuote);
        // Set initial quote
        quoteEl.textContent = motivationalQuotes[0];
    }
}
