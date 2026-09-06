// Helper function to draw image with cover behavior
export function drawImageCover(ctx, img, x, y, width, height, borderRadius = 0) {
    const imgRatio = img.width / img.height;
    const frameRatio = width / height;

    let sx, sy, sWidth, sHeight;

    if (imgRatio > frameRatio) {
        sHeight = img.height;
        sWidth = img.height * frameRatio;
        sx = (img.width - sWidth) / 2;
        sy = 0;
    } else {
        sWidth = img.width;
        sHeight = img.width / frameRatio;
        sx = 0;
        sy = (img.height - sHeight) / 2;
    }

    ctx.save();
    if (borderRadius > 0) {
        ctx.beginPath();
        if (ctx.roundRect) {
            ctx.roundRect(x, y, width, height, borderRadius);
        } else {
            ctx.rect(x, y, width, height);
        }
        ctx.clip();
    }
    ctx.drawImage(img, sx, sy, sWidth, sHeight, x, y, width, height);
    ctx.restore();
}

// Universal dynamic render function using uploaded template PNG or aesthetic built-in styling
export function renderDynamicFrame(ctx, photos, templateConfig) {
    return new Promise((resolve) => {
        const w = templateConfig.width || 800;
        const h = templateConfig.height || 1200;
        const bgColor = templateConfig.bgColor || '#FFFFFF';
        const borderColor = templateConfig.borderColor || '#2C2416';
        const accentColor = templateConfig.accentColor || '#8370F5';
        const footerText = templateConfig.footerText || '✨ CUTE SNAPS PHOTOBOOTH ✨';

        // 1. Draw Frame Background
        ctx.save();
        ctx.fillStyle = bgColor;
        ctx.fillRect(0, 0, w, h);

        // Frame Outer Border
        ctx.strokeStyle = borderColor;
        ctx.lineWidth = 12;
        ctx.strokeRect(6, 6, w - 12, h - 12);
        ctx.restore();

        // 2. Draw all user photos in their defined slots
        const slots = templateConfig.slots || [];
        for (let i = 0; i < photos.length; i++) {
            if (i < slots.length) {
                const slot = slots[i];
                
                // Draw slot drop shadow
                ctx.save();
                ctx.fillStyle = '#2C2416';
                ctx.fillRect(slot.x + 6, slot.y + 6, slot.w, slot.h);
                ctx.restore();

                // Draw photo with cover fitting
                drawImageCover(ctx, photos[i], slot.x, slot.y, slot.w, slot.h, 6);

                // Draw slot border
                ctx.save();
                ctx.strokeStyle = borderColor;
                ctx.lineWidth = 5;
                ctx.strokeRect(slot.x, slot.y, slot.w, slot.h);
                ctx.restore();
            }
        }

        // 3. Draw Decorative Footer & Date
        ctx.save();
        const dateStr = new Date().toLocaleDateString('id-ID', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });

        ctx.fillStyle = borderColor;
        ctx.font = 'bold 22px "Fredoka", "Comic Sans MS", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(footerText, w / 2, h - 45);

        ctx.font = '16px "Courier New", monospace';
        ctx.fillStyle = '#636E72';
        ctx.fillText(`📅 ${dateStr}`, w / 2, h - 20);
        ctx.restore();

        // 4. Draw Transparent PNG template on top if provided
        if (templateConfig.url && templateConfig.url.trim().length > 0 && !templateConfig.url.includes('AAAAASUVORK5CYII=')) {
            const templateImg = new Image();
            templateImg.crossOrigin = 'Anonymous';
            templateImg.onload = () => {
                ctx.drawImage(templateImg, 0, 0, w, h);
                resolve();
            };
            templateImg.onerror = () => {
                console.warn('Could not load template PNG image, using rendered canvas layout.');
                resolve();
            };
            templateImg.src = templateConfig.url;
        } else {
            resolve();
        }
    });
}

