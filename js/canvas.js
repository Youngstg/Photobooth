// Helper function to draw image with cover behavior
export function drawImageCover(ctx, img, x, y, width, height) {
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

    ctx.drawImage(img, sx, sy, sWidth, sHeight, x, y, width, height);
}

// Universal dynamic render function using uploaded template PNG
export function renderDynamicFrame(ctx, photos, templateConfig) {
    return new Promise((resolve) => {
        // 1. Draw all user photos in their defined slots (underneath)
        for (let i = 0; i < photos.length; i++) {
            if (i < templateConfig.slots.length) {
                const slot = templateConfig.slots[i];
                drawImageCover(ctx, photos[i], slot.x, slot.y, slot.w, slot.h);
            }
        }
        
        // 2. Draw the transparent PNG template on top
        const templateImg = new Image();
        templateImg.crossOrigin = 'Anonymous';
        templateImg.onload = () => {
            ctx.drawImage(templateImg, 0, 0, templateConfig.width, templateConfig.height);
            resolve();
        };
        templateImg.src = templateConfig.url;
    });
}
