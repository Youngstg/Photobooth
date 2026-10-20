import { state } from './state.js';

// FIX #18 (High): Semua kutipan diterjemahkan ke Bahasa Indonesia agar konsisten dengan UI
export const motivationalQuotes = [
    "Senyum! Kamu sedang menciptakan kenangan indah! ✨",
    "Setiap foto menceritakan sebuah kisah unik",
    "Jadilah dirimu sendiri, semua orang lain sudah ada!",
    "Hidup bagaikan kamera, fokus pada hal yang penting",
    "Abadikan momennya, kenang selamanya 💕",
    "Kecantikanmu dimulai saat kamu berani jadi dirimu sendiri",
    "Pamerkan gayamu! Tunjukkan yang terbaik!",
    "Tetap semangat dan katakan cheese! 📸",
    "Hidup singkat, buat setiap selfie bermakna!",
    "Photobooth: Tempat di mana kikuk itu super keren!",
    "Energimu menarik orang-orang terbaik di sekitarmu",
    "Vibes positif hanya! Ayo bersinar! ☀️",
    "Buat hari ini luar biasa, sampai kemarin cemburu!",
    "Percaya diri adalah outfit terbaikmu!",
    "Hidupmu mungkin tidak sempurna, tapi fotomu bisa! 💖",
    "Momen terbaik adalah yang kamu ciptakan sendiri",
    "Saatnya jadi bintang di frame mu sendiri! ⭐"
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
        const hourPercent = (hours / 12) * 100;
        hourBar.style.width = `${hourPercent}%`;
    }

    if (minBar) {
        const minPercent = (minutes / 60) * 100;
        minBar.style.width = `${minPercent}%`;
    }

    if (secBar) {
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
    const el = document.getElementById('session-count');
    if (el) {
        const count = state.capturedPhotos ? state.capturedPhotos.length : 0;
        el.textContent = `${count} Foto`;
    }
}

// Screen Navigation
export function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    const target = document.getElementById(screenId);
    if (target) target.classList.add('active');
}

export function setupUIListeners() {
    const quoteEl = document.getElementById('motivational-quote');
    if (quoteEl) {
        quoteEl.addEventListener('click', changeQuote);
        quoteEl.textContent = motivationalQuotes[0];
    }
    
    initTheme();
}

function initTheme() {
    document.body.classList.add('theme-y2k');
    localStorage.setItem('photobooth_theme', 'theme-y2k');
    state.theme = 'y2k';
}
