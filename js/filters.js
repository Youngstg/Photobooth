// Filter Definitions and Logic - ALL CLIENT-SIDE (no server round-trip)
// FIX #17 (High): Moved all filter processing to Canvas API — faster, no server dependency, private

export const availableFilters = [
    { id: 'normal', name: 'Normal' },
    { id: 'grayscale', name: 'Hitam Putih' },
    { id: 'sepia', name: 'Sepia' },
    { id: 'retro', name: 'Retro' },
    { id: 'frog', name: 'Muka Kodok 🐸' }
];

/**
 * Apply filter to a list of image URLs using Canvas API (client-side only)
 * @param {string[]} imageUrls - Array of image data URLs
 * @param {string} filterId - Filter ID to apply
 * @returns {Promise<string[]>} - Array of filtered image data URLs
 */
export async function applyFilterToImages(imageUrls, filterId) {
    if (filterId === 'normal') return imageUrls;

    const filteredUrls = [];
    const offscreenCanvas = document.createElement('canvas');
    const ctx = offscreenCanvas.getContext('2d');

    for (const url of imageUrls) {
        try {
            const img = await loadImage(url);
            offscreenCanvas.width = img.naturalWidth;
            offscreenCanvas.height = img.naturalHeight;
            ctx.clearRect(0, 0, offscreenCanvas.width, offscreenCanvas.height);

            const filtered = applyCanvasFilter(ctx, offscreenCanvas, img, filterId);
            filteredUrls.push(filtered);
        } catch (error) {
            console.error("Error applying client-side filter:", error);
            filteredUrls.push(url); // Fallback: return original
        }
    }

    return filteredUrls;
}

/**
 * Apply a CSS/Canvas filter to an image and return the result as a data URL
 */
function applyCanvasFilter(ctx, canvas, img, filterId) {
    const w = canvas.width;
    const h = canvas.height;

    if (filterId === 'grayscale') {
        ctx.filter = 'grayscale(100%)';
        ctx.drawImage(img, 0, 0);
        ctx.filter = 'none';

    } else if (filterId === 'sepia') {
        ctx.filter = 'sepia(100%)';
        ctx.drawImage(img, 0, 0);
        ctx.filter = 'none';

    } else if (filterId === 'retro') {
        // Warm retro look: slightly overexposed warm tones + vignette
        ctx.filter = 'contrast(108%) saturate(115%) brightness(108%) sepia(20%) hue-rotate(-5deg)';
        ctx.drawImage(img, 0, 0);
        ctx.filter = 'none';

        // Add warm vignette overlay
        const vignette = ctx.createRadialGradient(w / 2, h / 2, h * 0.25, w / 2, h / 2, h * 0.85);
        vignette.addColorStop(0, 'rgba(0,0,0,0)');
        vignette.addColorStop(1, 'rgba(80,30,0,0.45)');
        ctx.fillStyle = vignette;
        ctx.fillRect(0, 0, w, h);

        // Subtle film grain effect via noise
        ctx.globalAlpha = 0.04;
        for (let i = 0; i < w * h * 0.002; i++) {
            const gx = Math.random() * w;
            const gy = Math.random() * h;
            const brightness = Math.random() > 0.5 ? 255 : 0;
            ctx.fillStyle = `rgba(${brightness},${brightness},${brightness},0.5)`;
            ctx.fillRect(gx, gy, 1, 1);
        }
        ctx.globalAlpha = 1.0;

    } else if (filterId === 'frog') {
        // Green fisheye effect: distorted + green tint
        // Step 1: Apply green tint via CSS filter
        ctx.filter = 'saturate(130%) hue-rotate(80deg) brightness(115%) contrast(108%)';
        ctx.drawImage(img, 0, 0);
        ctx.filter = 'none';

        // Step 2: Add subtle green overlay for extra "frog" feel
        ctx.globalAlpha = 0.12;
        ctx.fillStyle = '#22cc55';
        ctx.fillRect(0, 0, w, h);
        ctx.globalAlpha = 1.0;

        // Step 3: Barrel distortion approximation using canvas transform
        // Draw a subtle fisheye effect by scaling center region
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = w;
        tempCanvas.height = h;
        const tCtx = tempCanvas.getContext('2d');
        tCtx.drawImage(canvas, 0, 0);

        ctx.clearRect(0, 0, w, h);
        ctx.save();
        ctx.translate(w / 2, h / 2);
        ctx.scale(1.08, 1.08); // Slight scale to simulate barrel distortion
        ctx.translate(-w / 2, -h / 2);
        ctx.drawImage(tempCanvas, 0, 0);
        ctx.restore();
    }

    return canvas.toDataURL('image/jpeg', 0.92);
}

/**
 * Load an image from URL and return an HTMLImageElement
 */
function loadImage(src) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = src;
    });
}

/**
 * Get CSS filter string for UI preview thumbnail
 */
export function getCSSFilterForPreview(filterId) {
    if (filterId === 'grayscale') return 'grayscale(100%)';
    if (filterId === 'sepia') return 'sepia(100%)';
    if (filterId === 'retro') return 'contrast(108%) saturate(115%) sepia(20%) hue-rotate(-5deg)';
    if (filterId === 'frog') return 'saturate(130%) hue-rotate(80deg) brightness(115%)';
    return 'none';
}
