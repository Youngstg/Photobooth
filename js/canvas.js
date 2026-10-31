// Helper function to draw image with cover behavior and interactive pan/zoom adjustment
export function drawImageCover(ctx, img, x, y, width, height, borderRadius = 0, adjustment = null) {
    const scale = (adjustment && typeof adjustment.scale === 'number') ? Math.max(0.5, Math.min(3.5, adjustment.scale)) : 1.0;
    const offsetX = (adjustment && typeof adjustment.offsetX === 'number') ? adjustment.offsetX : 0;
    const offsetY = (adjustment && typeof adjustment.offsetY === 'number') ? adjustment.offsetY : 0;

    const imgRatio = img.width / img.height;
    const frameRatio = width / height;

    let baseWidth, baseHeight;

    if (imgRatio > frameRatio) {
        baseHeight = img.height;
        baseWidth = img.height * frameRatio;
    } else {
        baseWidth = img.width;
        baseHeight = img.width / frameRatio;
    }

    // Zooming in means cropping a smaller sub-rectangle of the source image
    const sWidth = baseWidth / scale;
    const sHeight = baseHeight / scale;

    // Center crop coordinates
    const centerSx = (img.width - sWidth) / 2;
    const centerSy = (img.height - sHeight) / 2;

    // Apply interactive pan offset (dragging the photo moves the view)
    let sx = centerSx - (offsetX * sWidth);
    let sy = centerSy - (offsetY * sHeight);

    // Keep source crop safely inside boundaries (allowing slight slack for artistic repositioning)
    sx = Math.max(-sWidth * 0.4, Math.min(img.width - sWidth * 0.6, sx));
    sy = Math.max(-sHeight * 0.4, Math.min(img.height - sHeight * 0.6, sy));

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

// Universal dynamic render function: slot foto selalu berada DI BAWAH layer template PNG
export function renderDynamicFrame(targetCtx, photos, templateConfig, targetWidth, targetHeight, adjustments = {}) {
    return new Promise(async (resolve) => {
        try {
            const nativeW = templateConfig.width || 800;
            const nativeH = templateConfig.height || 1200;
            const destW = targetWidth || nativeW;
            const destH = targetHeight || nativeH;

            // Render entirely on an isolated offscreen canvas at native dimensions
            const offscreen = document.createElement('canvas');
            offscreen.width = nativeW;
            offscreen.height = nativeH;
            const offCtx = offscreen.getContext('2d');

            const bgColor = templateConfig.bgColor || '#FFFFFF';
            const borderColor = templateConfig.borderColor || '#2C2416';
            const footerText = templateConfig.footerText || '✨ CUTE SNAPS PHOTOBOOTH ✨';
            const hasCustomTemplate = !!(templateConfig.url && templateConfig.url.trim().length > 0 && !templateConfig.url.includes('AAAAASUVORK5CYII='));

            // 1. Draw Frame Background
            offCtx.save();
            offCtx.fillStyle = bgColor;
            offCtx.fillRect(0, 0, nativeW, nativeH);

            if (!hasCustomTemplate) {
                // Frame Outer Border for default styling
                offCtx.strokeStyle = borderColor;
                offCtx.lineWidth = 12;
                offCtx.strokeRect(6, 6, nativeW - 12, nativeH - 12);
            }
            offCtx.restore();

            // 2. LAYER BAWAH: Draw all user photos in their defined slots
            const slots = templateConfig.slots || [];
            for (let i = 0; i < slots.length; i++) {
                const slot = slots[i];
                // Ensure every slot has a photo: pick photos[i], or cycle if photos.length < slots.length
                const photoImg = (photos && photos.length > 0)
                    ? (photos[i] || photos[i % photos.length])
                    : null;
                
                if (photoImg) {
                    if (!hasCustomTemplate) {
                        // Draw slot drop shadow for non-template designs
                        offCtx.save();
                        offCtx.fillStyle = '#2C2416';
                        offCtx.fillRect(slot.x + 6, slot.y + 6, slot.w, slot.h);
                        offCtx.restore();
                    }

                    // Draw photo with cover fitting & user pan/zoom adjustment
                    const slotAdj = (adjustments && adjustments[i]) ? adjustments[i] : { offsetX: 0, offsetY: 0, scale: 1.0 };
                    drawImageCover(offCtx, photoImg, slot.x, slot.y, slot.w, slot.h, hasCustomTemplate ? 0 : 6, slotAdj);

                    if (!hasCustomTemplate) {
                        // Draw slot border for non-template designs
                        offCtx.save();
                        offCtx.strokeStyle = borderColor;
                        offCtx.lineWidth = 5;
                        offCtx.strokeRect(slot.x, slot.y, slot.w, slot.h);
                        offCtx.restore();
                    }
                }
            }

            // 3. Draw Decorative Footer & Date (only if not using custom full template)
            if (!hasCustomTemplate) {
                offCtx.save();
                const dateStr = new Date().toLocaleDateString('id-ID', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric'
                });

                offCtx.fillStyle = borderColor;
                offCtx.font = 'bold 22px "Fredoka", "Comic Sans MS", sans-serif';
                offCtx.textAlign = 'center';
                offCtx.textBaseline = 'middle';
                offCtx.fillText(footerText, nativeW / 2, nativeH - 45);

                offCtx.font = '16px "Courier New", monospace';
                offCtx.fillStyle = '#636E72';
                offCtx.fillText(`📅 ${dateStr}`, nativeW / 2, nativeH - 20);
                offCtx.restore();
            }

            // 4. LAYER ATAS: Draw Transparent PNG template ON TOP of photos
            // Sehingga ornamen, stiker, garis tepi, dan dekorasi frame tidak pernah tertimpa foto
            if (hasCustomTemplate) {
                await new Promise((imgDone) => {
                    const templateImg = new Image();
                    templateImg.crossOrigin = 'Anonymous';
                    templateImg.onload = () => {
                        try {
                            const tCanvas = document.createElement('canvas');
                            tCanvas.width = nativeW;
                            tCanvas.height = nativeH;
                            const tCtx = tCanvas.getContext('2d');
                            tCtx.drawImage(templateImg, 0, 0, nativeW, nativeH);

                            // Punch out slots with destination-out so photos underneath are 100% visible
                            slots.forEach(slot => {
                                tCtx.save();
                                tCtx.globalCompositeOperation = 'destination-out';
                                tCtx.beginPath();
                                const inset = 4;
                                const rx = slot.x + inset;
                                const ry = slot.y + inset;
                                const rw = Math.max(1, slot.w - (inset * 2));
                                const rh = Math.max(1, slot.h - (inset * 2));
                                if (tCtx.roundRect) {
                                    tCtx.roundRect(rx, ry, rw, rh, 6);
                                } else {
                                    tCtx.rect(rx, ry, rw, rh);
                                }
                                tCtx.fill();
                                tCtx.restore();
                            });

                            offCtx.drawImage(tCanvas, 0, 0, nativeW, nativeH);
                        } catch(err) {
                            console.warn('Fallback direct template draw:', err);
                            offCtx.drawImage(templateImg, 0, 0, nativeW, nativeH);
                        }
                        imgDone();
                    };
                    templateImg.onerror = () => {
                        console.warn('Could not load template PNG image, using rendered canvas layout.');
                        imgDone();
                    };
                    templateImg.src = templateConfig.url;
                });
            }

            // 5. ATOMIC BLIT: Blit entire completed composition onto destination canvas
            targetCtx.clearRect(0, 0, destW, destH);
            targetCtx.imageSmoothingEnabled = true;
            targetCtx.imageSmoothingQuality = 'high';
            targetCtx.drawImage(offscreen, 0, 0, destW, destH);
            resolve();
        } catch (err) {
            console.error('Error during renderDynamicFrame:', err);
            resolve();
        }
    });
}
