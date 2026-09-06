import { renderDynamicFrame } from './canvas.js';
import { API_BASE_URL } from './config.js';

export const FALLBACK_TEMPLATES = [
    {
        id: "duo-sweet-heart",
        name: "💖 Duo Sweet Heart (2 Foto)",
        url: "",
        bgColor: "#FFF0F5",
        borderColor: "#FF69B4",
        accentColor: "#8370F5",
        footerText: "✨ CUTE SNAPS • DUO COLLAB ✨",
        width: 800,
        height: 1200,
        photoCount: 2,
        slots: [
            { x: 60, y: 70, w: 680, h: 460 },
            { x: 60, y: 570, w: 680, h: 460 }
        ]
    },
    {
        id: "retro-strip-3",
        name: "🎞️ Classic 3-Cut Strip (3 Foto)",
        url: "",
        bgColor: "#2C2416",
        borderColor: "#FFEAA7",
        accentColor: "#E67E22",
        footerText: "🎞️ RETRO MEMORIES • PHOTOBOOTH",
        width: 600,
        height: 1350,
        photoCount: 3,
        slots: [
            { x: 50, y: 50, w: 500, h: 360 },
            { x: 50, y: 440, w: 500, h: 360 },
            { x: 50, y: 830, w: 500, h: 360 }
        ]
    },
    {
        id: "y2k-grid-4",
        name: "👾 Y2K Cyber Grid (4 Foto)",
        url: "",
        bgColor: "#1A1A2E",
        borderColor: "#00D2D3",
        accentColor: "#FF69B4",
        footerText: "⚡ Y2K PHOTO BOOTH • BEST FRIENDS ⚡",
        width: 900,
        height: 1200,
        photoCount: 4,
        slots: [
            { x: 60, y: 70, w: 365, h: 470 },
            { x: 475, y: 70, w: 365, h: 470 },
            { x: 60, y: 570, w: 365, h: 470 },
            { x: 475, y: 570, w: 365, h: 470 }
        ]
    },
    {
        id: "cute-strip-4",
        name: "🌸 Pastel 4-Cut Vertical (4 Foto)",
        url: "",
        bgColor: "#E8F8F5",
        borderColor: "#A29BFE",
        accentColor: "#FF7675",
        footerText: "🌸 MEMORIES WITH YOU • FOREVER 🌸",
        width: 600,
        height: 1600,
        photoCount: 4,
        slots: [
            { x: 45, y: 45, w: 510, h: 330 },
            { x: 45, y: 405, w: 510, h: 330 },
            { x: 45, y: 765, w: 510, h: 330 },
            { x: 45, y: 1125, w: 510, h: 330 }
        ]
    },
    {
        id: "polaroid-single-1",
        name: "📷 Aesthetic Polaroid (1 Foto)",
        url: "",
        bgColor: "#FFFFFF",
        borderColor: "#2C2416",
        accentColor: "#6C5CE7",
        footerText: "💖 OUR SPECIAL MOMENT 💖",
        width: 800,
        height: 1050,
        photoCount: 1,
        slots: [
            { x: 60, y: 60, w: 680, h: 780 }
        ]
    }
];

export let allFrameThemes = [];

function mapTemplates(data) {
    return data.map(t => ({
        id: t.id,
        name: t.name,
        photoCount: t.photoCount || (t.slots ? t.slots.length : 2),
        width: t.width || 800,
        height: t.height || 1200,
        url: t.url || '',
        bgColor: t.bgColor || '#FFFFFF',
        borderColor: t.borderColor || '#2C2416',
        accentColor: t.accentColor || '#8370F5',
        footerText: t.footerText || '✨ CUTE SNAPS PHOTOBOOTH ✨',
        slots: t.slots || [],
        render: (ctx, photos) => renderDynamicFrame(ctx, photos, t)
    }));
}

export async function fetchTemplates() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/templates`);
        if (!response.ok) throw new Error(`HTTP error ${response.status}`);
        const data = await response.json();
        
        if (Array.isArray(data) && data.length > 0) {
            allFrameThemes = mapTemplates(data);
        } else {
            allFrameThemes = mapTemplates(FALLBACK_TEMPLATES);
        }
        
        console.log("Loaded templates:", allFrameThemes);
    } catch (e) {
        console.warn('Failed to fetch templates from API, using fallback templates:', e);
        allFrameThemes = mapTemplates(FALLBACK_TEMPLATES);
    }
}

