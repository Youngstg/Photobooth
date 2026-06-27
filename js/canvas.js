import { drawAsset } from './assets.js';

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

// Helper: Distribute photos in grid
export function distributePhotosInGrid(ctx, photos, photoCount, x, y, totalWidth, totalHeight, gap = 10) {
    if (photoCount === 1) {
        drawImageCover(ctx, photos[0], x, y, totalWidth, totalHeight);
    } else if (photoCount === 2) {
        const w = (totalWidth - gap) / 2;
        drawImageCover(ctx, photos[0], x, y, w, totalHeight);
        drawImageCover(ctx, photos[1], x + w + gap, y, w, totalHeight);
    } else if (photoCount === 3) {
        const topH = totalHeight * 0.6 - gap/2;
        const bottomH = totalHeight * 0.4 - gap/2;
        const bottomW = (totalWidth - gap) / 2;
        drawImageCover(ctx, photos[0], x, y, totalWidth, topH);
        drawImageCover(ctx, photos[1], x, y + topH + gap, bottomW, bottomH);
        drawImageCover(ctx, photos[2], x + bottomW + gap, y + topH + gap, bottomW, bottomH);
    } else {
        const w = (totalWidth - gap) / 2;
        const h = (totalHeight - gap) / 2;
        for(let i = 0; i < 2; i++) {
            for(let j = 0; j < 2; j++) {
                const idx = i * 2 + j;
                if(photos[idx]) drawImageCover(ctx, photos[idx], x + j * (w + gap), y + i * (h + gap), w, h);
            }
        }
    }
}

// Universal render function that dispatches to specific theme renderers
export function renderFrame(ctx, photos, themeId, photoCount) {
    switch(themeId) {
        case 'spotify-player': renderSpotifyFrame(ctx, photos, photoCount); break;
        case 'laptop-ui': renderLaptopFrame(ctx, photos, photoCount); break;
        case 'polaroid': renderPolaroidFrame(ctx, photos, photoCount); break;
        case 'phone-chat': renderPhoneChatFrame(ctx, photos, photoCount); break;
        case 'split-screen': renderSplitScreenFrame(ctx, photos, photoCount); break;
        case 'filmstrip': renderFilmstripFrame(ctx, photos, photoCount); break;
        case 'instagram-grid': renderInstagramFrame(ctx, photos, photoCount); break;
        case 'polaroid-stack': renderPolaroidStackFrame(ctx, photos, photoCount); break;
        case 'comic-strip': renderComicStripFrame(ctx, photos, photoCount); break;
        case 'photo-grid': renderPhotoGridFrame(ctx, photos, photoCount); break;
        case 'video-call': renderVideoCallFrame(ctx, photos, photoCount); break;
        case 'magazine': renderMagazineFrame(ctx, photos, photoCount); break;
    }
}

export function renderSpotifyFrame(ctx, photos, photoCount) {
    const w = 800, h = 1000;
    ctx.fillStyle = '#121212';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 28px Courier New';
    ctx.fillText('←', 30, 45);
    ctx.fillText('⋯', w - 60, 45);

    const photoSize = 600;
    const photoX = (w - photoSize) / 2;
    const photoY = 100;

    if (photoCount === 1) {
        drawImageCover(ctx, photos[0], photoX, photoY, photoSize, photoSize);
    } else if (photoCount === 2) {
        drawImageCover(ctx, photos[0], photoX, photoY, photoSize / 2 - 5, photoSize);
        drawImageCover(ctx, photos[1], photoX + photoSize / 2 + 5, photoY, photoSize / 2 - 5, photoSize);
    } else if (photoCount === 3) {
        drawImageCover(ctx, photos[0], photoX, photoY, photoSize, photoSize / 2 - 5);
        drawImageCover(ctx, photos[1], photoX, photoY + photoSize / 2 + 5, photoSize / 2 - 5, photoSize / 2 - 5);
        drawImageCover(ctx, photos[2], photoX + photoSize / 2 + 5, photoY + photoSize / 2 + 5, photoSize / 2 - 5, photoSize / 2 - 5);
    } else {
        for(let i = 0; i < 2; i++) {
            for(let j = 0; j < 2; j++) {
                drawImageCover(ctx, photos[i * 2 + j], photoX + j * (photoSize / 2 + 5), photoY + i * (photoSize / 2 + 5), photoSize / 2 - 5, photoSize / 2 - 5);
            }
        }
    }

    drawAsset(ctx, 'heart', 100, photoY + photoSize + 20, 48, 48);

    const progressY = photoY + photoSize + 110;
    ctx.fillStyle = '#B3B3B3';
    ctx.font = '20px Courier New';
    ctx.fillText('0:00', 100, progressY);
    ctx.fillText('-3:14', w - 150, progressY);

    ctx.fillStyle = '#404040';
    ctx.fillRect(100, progressY + 10, w - 200, 6);
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(100, progressY + 10, (w - 200) * 0.3, 6);

    const controlY = progressY + 70;
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 36px Courier New';
    ctx.textAlign = 'center';
    ctx.fillText('⇄', 150, controlY);
    ctx.fillText('⏮', 260, controlY);
    drawAsset(ctx, 'play', 400 - 36, controlY - 48, 72, 72);
    drawAsset(ctx, 'next', 540 - 24, controlY - 36, 48, 48);
    ctx.fillText('🔁', 650, controlY);

    ctx.font = '36px Courier New';
    ctx.fillText('🔊', 100, h - 30);
    ctx.fillText('📋', w - 120, h - 30);
    ctx.textAlign = 'left';
}

export function renderLaptopFrame(ctx, photos, photoCount) {
    const w = 900, h = 700;
    ctx.fillStyle = '#008080';
    ctx.fillRect(0, 0, w, h);

    ctx.fillStyle = '#000080';
    ctx.fillRect(40, 30, w - 80, 25);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 14px Courier New';
    ctx.fillText('My Photos', 50, 48);

    ctx.fillStyle = '#C0C0C0';
    ctx.fillRect(w - 70, 32, 20, 20);
    ctx.fillStyle = '#000000';
    ctx.fillText('×', w - 65, 47);

    const photoX = 40, photoY = 60, photoW = w - 80, photoH = h - 130;
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(photoX, photoY, photoW, photoH);
    distributePhotosInGrid(ctx, photos, photoCount, photoX + 10, photoY + 10, photoW - 20, photoH - 20, 10);

    const iconX = w - 70;
    const icons = ['📁', '💻', '🎮', '🖼️', '📄'];
    const iconLabels = ['Folder', 'MyPC', 'Game', 'Pics', 'File'];
    icons.forEach((icon, i) => {
        const iconY = 100 + i * 70;
        ctx.font = '32px Courier New';
        ctx.fillStyle = '#FFFFFF';
        ctx.fillText(icon, iconX, iconY);
        ctx.font = '12px Courier New';
        ctx.fillText(iconLabels[i], iconX - 5, iconY + 20);
    });

    ctx.fillStyle = '#C0C0C0';
    ctx.fillRect(0, h - 30, w, 30);
    ctx.fillStyle = '#DFDFDF';
    ctx.fillRect(5, h - 28, 90, 26);
    drawAsset(ctx, 'windows', 10, h - 24, 24, 24);
    ctx.fillStyle = '#000000';
    ctx.font = 'bold 14px Courier New';
    ctx.fillText('Start', 40, h - 10);

    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(w - 80, h - 28, 75, 26);
    ctx.fillStyle = '#000000';
    ctx.font = '11px Courier New';
    const time = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    ctx.fillText(time, w - 70, h - 11);
}

export function renderPolaroidFrame(ctx, photos, photoCount) {
    const w = 800, h = 1000;
    ctx.fillStyle = '#D4A574';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(100, 80, 600, 750);
    distributePhotosInGrid(ctx, photos, photoCount, 120, 100, 560, 560);
    ctx.fillStyle = '#2C2416';
    ctx.font = 'italic 32px Courier New';
    ctx.textAlign = 'center';
    ctx.fillText('Sweet Memories', w/2, 750);
    ctx.font = '20px Courier New';
    ctx.fillText(new Date().toLocaleDateString(), w/2, 790);
    ctx.textAlign = 'left';
}

export function renderPhoneChatFrame(ctx, photos, photoCount) {
    const w = 800, h = 1000;
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(50, 40, w - 100, h - 80);
    ctx.fillStyle = '#E5DDD5';
    ctx.fillRect(60, 120, w - 120, h - 260);

    ctx.fillStyle = '#075E54';
    ctx.fillRect(60, 50, w - 120, 80);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 32px Courier New';
    ctx.fillText('Chat Group', 80, 100);
    ctx.font = '40px Courier New';
    ctx.fillText('⋮', w - 110, 100);

    const availableHeight = h - 260;
    const photoBubbleH = Math.min(200, (availableHeight - 40) / photoCount - 15);

    photos.forEach((photo, i) => {
        ctx.fillStyle = i % 2 === 0 ? '#FFFFFF' : '#DCF8C6';
        const x = i % 2 === 0 ? 80 : w - 380;
        const y = 140 + i * (photoBubbleH + 15);
        ctx.beginPath();
        ctx.roundRect(x, y, 300, photoBubbleH, 8);
        ctx.fill();
        drawImageCover(ctx, photo, x + 10, y + 10, 280, photoBubbleH - 20);
    });

    const inputBoxY = h - 140;
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(60, inputBoxY, w - 120, 60);
    ctx.fillStyle = '#F0F0F0';
    ctx.beginPath();
    ctx.roundRect(75, inputBoxY + 10, w - 240, 40, 20);
    ctx.fill();
    ctx.fillStyle = '#999999';
    ctx.font = '18px Courier New';
    ctx.fillText('Type a message...', 95, inputBoxY + 37);

    drawAsset(ctx, 'smiley', w - 220, inputBoxY + 10, 36, 36);
    drawAsset(ctx, 'clip', w - 170, inputBoxY + 10, 36, 36);
    ctx.fillStyle = '#25D366';
    ctx.beginPath();
    ctx.arc(w - 110, inputBoxY + 30, 28, 0, Math.PI * 2);
    ctx.fill();
    drawAsset(ctx, 'send', w - 128, inputBoxY + 12, 36, 36);
}

export function renderSplitScreenFrame(ctx, photos, photoCount) {
    const w = 1000, h = 800;
    ctx.fillStyle = '#2C2416';
    ctx.fillRect(0, 0, w, h);
    if (photoCount === 1) {
        drawImageCover(ctx, photos[0], 20, 20, w - 40, h - 40);
    } else if (photoCount === 2) {
        drawImageCover(ctx, photos[0], 20, 20, w/2 - 30, h - 40);
        drawImageCover(ctx, photos[1], w/2 + 10, 20, w/2 - 30, h - 40);
        ctx.fillStyle = '#7BC4A8';
        ctx.fillRect(w/2 - 5, 0, 10, h);
    } else if (photoCount === 3) {
        drawImageCover(ctx, photos[0], 20, 20, w/2 - 30, h - 40);
        drawImageCover(ctx, photos[1], w/2 + 10, 20, w/2 - 30, h/2 - 30);
        drawImageCover(ctx, photos[2], w/2 + 10, h/2 + 10, w/2 - 30, h/2 - 30);
    } else {
        distributePhotosInGrid(ctx, photos, 4, 20, 20, w - 40, h - 40, 20);
    }
}

export function renderFilmstripFrame(ctx, photos, photoCount) {
    const w = 800, h = 1000;
    ctx.fillStyle = '#1A1A1A';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#000000';
    for(let i = 0; i < 20; i++) {
        ctx.fillRect(20, 30 + i * 48, 30, 35);
        ctx.fillRect(w - 50, 30 + i * 48, 30, 35);
    }
    const photoWidth = w - 140;
    const photoHeight = photoWidth * 0.75;
    const gap = 20;
    const totalPhotoHeight = photoCount * photoHeight + (photoCount - 1) * gap;
    const startY = (h - totalPhotoHeight) / 2;
    photos.forEach((photo, i) => {
        const y = startY + i * (photoHeight + gap);
        drawImageCover(ctx, photo, 70, y, photoWidth, photoHeight);
        ctx.strokeStyle = '#7BC4A8';
        ctx.lineWidth = 3;
        ctx.strokeRect(70, y, photoWidth, photoHeight);
    });
}

export function renderInstagramFrame(ctx, photos, photoCount) {
    const w = 800, h = 1200;
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#FAFAFA';
    ctx.fillRect(0, 0, w, 60);
    ctx.fillStyle = '#262626';
    ctx.font = 'bold 40px Courier New';
    ctx.fillText('📷', 30, 45);
    ctx.font = 'bold 32px Courier New';
    ctx.fillText('Instagram', 100, 42);
    drawAsset(ctx, 'chat', w - 110, 15, 36, 36);
    drawAsset(ctx, 'send', w - 60, 15, 36, 36);

    const profileY = 80;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(70, profileY + 35, 35, 0, Math.PI * 2);
    ctx.stroke();
    ctx.font = '24px Courier New';
    ctx.fillText('photobooth', 120, profileY + 40);
    ctx.font = '32px Courier New';
    ctx.fillText('⋯', w - 50, profileY + 40);

    const photoAreaY = profileY + 80;
    const photoAreaH = h - photoAreaY - 180;
    if (photoCount === 1) {
        drawImageCover(ctx, photos[0], 0, photoAreaY, w, photoAreaH);
    } else if (photoCount === 2) {
        const h1 = photoAreaH * 0.6, h2 = photoAreaH * 0.4 - 5;
        drawImageCover(ctx, photos[0], 0, photoAreaY, w, h1);
        drawImageCover(ctx, photos[1], 0, photoAreaY + h1 + 5, w, h2);
    } else if (photoCount === 3) {
        const h1 = photoAreaH * 0.6, h2 = photoAreaH * 0.4 - 5;
        drawImageCover(ctx, photos[0], 0, photoAreaY, w, h1);
        drawImageCover(ctx, photos[1], 0, photoAreaY + h1 + 5, w / 2 - 2.5, h2);
        drawImageCover(ctx, photos[2], w / 2 + 2.5, photoAreaY + h1 + 5, w / 2 - 2.5, h2);
    } else {
        const h1 = photoAreaH / 2 - 2.5;
        drawImageCover(ctx, photos[0], 0, photoAreaY, w / 2 - 2.5, h1);
        drawImageCover(ctx, photos[1], w / 2 + 2.5, photoAreaY, w / 2 - 2.5, h1);
        drawImageCover(ctx, photos[2], 0, photoAreaY + h1 + 5, w / 2 - 2.5, h1);
        drawImageCover(ctx, photos[3], w / 2 + 2.5, photoAreaY + h1 + 5, w / 2 - 2.5, h1);
    }

    const actionY = h - 120;
    drawAsset(ctx, 'heart', 30, actionY - 20, 40, 40);
    drawAsset(ctx, 'chat', 100, actionY - 20, 40, 40);
    drawAsset(ctx, 'send', 170, actionY - 20, 40, 40);
    drawAsset(ctx, 'saveInstagram', w - 70, actionY - 20, 40, 40);

    ctx.font = '18px Courier New';
    ctx.fillText('1,234 likes', 30, actionY + 35);
    ctx.fillText('photobooth Great memories!', 30, actionY + 60);

    ctx.fillStyle = '#FAFAFA';
    ctx.fillRect(0, h - 70, w, 70);
    const navY = h - 50, navSpacing = (w - 80) / 4, navStartX = 40;
    drawAsset(ctx, 'home', navStartX - 20, navY, 40, 40);
    drawAsset(ctx, 'search', navStartX + navSpacing - 20, navY, 40, 40);
    drawAsset(ctx, 'add', navStartX + navSpacing * 2 - 20, navY, 40, 40);
    drawAsset(ctx, 'heart', navStartX + navSpacing * 3 - 20, navY, 40, 40);
    drawAsset(ctx, 'user', navStartX + navSpacing * 4 - 20, navY, 40, 40);
}

export function renderPolaroidStackFrame(ctx, photos, photoCount) {
    const w = 800, h = 1000;
    ctx.fillStyle = '#F5E6D3';
    ctx.fillRect(0, 0, w, h);
    const topBottomSpacing = 80;
    const availableHeight = h - (topBottomSpacing * 2);
    const gapBetweenPhotos = 30;
    const totalGaps = (photoCount - 1) * gapBetweenPhotos;
    const photoHeight = (availableHeight - totalGaps) / photoCount;

    photos.forEach((photo, i) => {
        const y = topBottomSpacing + i * (photoHeight + gapBetweenPhotos);
        ctx.fillStyle = 'rgba(0,0,0,0.15)';
        ctx.fillRect(85, y + 5, w - 160, photoHeight + 80);
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(80, y, w - 160, photoHeight + 80);
        drawImageCover(ctx, photo, 100, y + 15, w - 200, photoHeight - 10);
        ctx.fillStyle = '#2C2416';
        ctx.font = '16px Courier New';
        ctx.textAlign = 'center';
        ctx.fillText(`Memory ${i + 1}`, w / 2, y + photoHeight + 55);
    });
    ctx.textAlign = 'left';
}

export function renderComicStripFrame(ctx, photos, photoCount) {
    const w = 1200, h = 600;
    ctx.fillStyle = '#FFE5B4';
    ctx.fillRect(0, 0, w, h);
    const panelW = (w - 80 - (photoCount - 1) * 40) / photoCount;
    const panelH = 480;

    photos.forEach((photo, i) => {
        const x = 40 + i * (panelW + 40);
        ctx.fillStyle = '#000000';
        ctx.fillRect(x - 5, 55, panelW + 10, panelH + 10);
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(x, 60, panelW, panelH);
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2;

        for (let j = 0; j < 8; j++) {
            ctx.beginPath(); ctx.moveTo(x + 10, 70); ctx.lineTo(x + 50 + j * 15, 70 + j * 20); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(x + panelW - 10, 70); ctx.lineTo(x + panelW - 50 - j * 15, 70 + j * 20); ctx.stroke();
        }
        for (let j = 0; j < 6; j++) {
            ctx.beginPath(); ctx.moveTo(x + 10, 520); ctx.lineTo(x + 40 + j * 12, 520 - j * 15); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(x + panelW - 10, 520); ctx.lineTo(x + panelW - 40 - j * 12, 520 - j * 15); ctx.stroke();
        }

        const photoMargin = 80;
        drawImageCover(ctx, photo, x + photoMargin / 2, 140, panelW - photoMargin, panelH - 180);

        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath(); ctx.ellipse(x + panelW / 2, 515, 100, 20, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(x + panelW / 2 - 20, 505); ctx.lineTo(x + panelW / 2 - 30, 480); ctx.lineTo(x + panelW / 2 - 10, 500); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#000000';
        ctx.font = 'bold 14px Courier New';
        ctx.textAlign = 'center';
        const exclamations = ['WOW!', 'POW!', 'ZAP!', 'BOOM!'];
        ctx.fillText(exclamations[i % exclamations.length], x + panelW / 2, 520);
    });
    ctx.textAlign = 'left';
}

export function renderPhotoGridFrame(ctx, photos, photoCount) {
    const w = 1000, h = 1000;
    ctx.fillStyle = '#2C2416';
    ctx.fillRect(0, 0, w, h);
    distributePhotosInGrid(ctx, photos, photoCount, 20, 20, w - 40, h - 40, 20);
}

export function renderVideoCallFrame(ctx, photos, photoCount) {
    const w = 1200, h = 800;
    ctx.fillStyle = '#1C1C1C';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#2D2D2D';
    ctx.fillRect(0, 0, w, 60);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 24px Courier New';
    ctx.fillText('Zoom Meeting', 30, 40);
    ctx.fillStyle = '#3C3C3C';
    ctx.fillRect(w - 200, 15, 160, 30);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '16px Courier New';
    ctx.fillText('📊 Speaker View', w - 190, 37);

    const gridStartY = 80, gridH = h - gridStartY - 80;
    distributePhotosInGrid(ctx, photos, photoCount, 20, gridStartY, w - 40, gridH, 10);

    photos.forEach((_, i) => {
        let x, y, photoW, photoH;
        if (photoCount === 1) {
            x = 20; y = gridStartY; photoW = w - 40; photoH = gridH;
        } else if (photoCount === 2) {
            photoW = (w - 50) / 2; photoH = gridH;
            x = i === 0 ? 20 : 20 + photoW + 10; y = gridStartY;
        } else if (photoCount === 3) {
            const topH = gridH * 0.6 - 5, bottomH = gridH * 0.4 - 5, bottomW = (w - 50) / 2;
            if (i === 0) { x = 20; y = gridStartY; photoW = w - 40; photoH = topH; }
            else if (i === 1) { x = 20; y = gridStartY + topH + 10; photoW = bottomW; photoH = bottomH; }
            else { x = 20 + bottomW + 10; y = gridStartY + topH + 10; photoW = bottomW; photoH = bottomH; }
        } else {
            photoW = (w - 50) / 2; photoH = (gridH - 10) / 2;
            x = (i % 2) * (photoW + 10) + 20; y = Math.floor(i / 2) * (photoH + 10) + gridStartY;
        }
        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.fillRect(x + 10, y + photoH - 35, 150, 25);
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '14px Courier New';
        ctx.fillText(`Participant ${i + 1}`, x + 20, y + photoH - 17);
    });

    ctx.fillStyle = '#1C1C1C';
    ctx.fillRect(0, h - 70, w, 70);
    const controls = [
        { asset: null, icon: '🎤', label: 'Mute' },
        { asset: 'responsive', icon: null, label: 'Stop Video' },
        { asset: null, icon: '👥', label: 'Participants' },
        { asset: 'chat', icon: null, label: 'Chat' },
        { asset: 'record', icon: null, label: 'Record' },
        { asset: 'smiley', icon: null, label: 'Reactions' }
    ];
    const btnSpacing = (w - 200) / controls.length;
    controls.forEach((ctrl, i) => {
        const btnX = 100 + i * btnSpacing;
        if (ctrl.asset) drawAsset(ctx, ctrl.asset, btnX - 20, h - 55, 40, 40);
        else { ctx.font = '40px Courier New'; ctx.fillStyle = '#FFFFFF'; ctx.textAlign = 'center'; ctx.fillText(ctrl.icon, btnX, h - 30); }
        ctx.font = '14px Courier New'; ctx.fillStyle = '#FFFFFF'; ctx.textAlign = 'center'; ctx.fillText(ctrl.label, btnX, h - 8);
    });

    ctx.fillStyle = '#E74C3C';
    ctx.fillRect(w - 120, h - 55, 100, 40);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 16px Courier New';
    ctx.fillText('Leave', w - 70, h - 28);
    ctx.textAlign = 'left';
}

export function renderMagazineFrame(ctx, photos, photoCount) {
    const w = 1000, h = 1200;
    ctx.fillStyle = '#F4E8D0';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = 'rgba(0,0,0,0.03)';
    ctx.lineWidth = 1;
    for (let i = 0; i < h; i += 25) { ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(w, i); ctx.stroke(); }
    ctx.fillStyle = '#000000';
    ctx.font = 'bold 52px Courier New';
    ctx.textAlign = 'center';
    ctx.fillText('THE NEWSPAPER NAME', w / 2, 65);
    ctx.fillRect(50, 80, w - 100, 2);
    ctx.fillRect(50, 85, w - 100, 1);
    ctx.font = '12px Courier New';
    ctx.fillText('Vol. XXIV No. 127 | ' + new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }), w / 2, 105);
    ctx.font = 'bold 32px Courier New';
    ctx.fillText('YOUR HEADLINE HERE', w / 2, 145);
    ctx.font = 'italic 14px Courier New';
    ctx.fillText('A memorable moment captured in time', w / 2, 168);
    ctx.textAlign = 'left';

    let currentY = 190;
    if (photoCount === 1) {
        drawImageCover(ctx, photos[0], 60, currentY, 420, 350);
        renderNewspaperText(ctx, 500, currentY, 440, 350, 2);
        currentY += 370;
    } else if (photoCount === 2) {
        drawImageCover(ctx, photos[0], 60, currentY, 380, 240);
        renderNewspaperText(ctx, 460, currentY, 480, 240, 2);
        currentY += 260;
        renderNewspaperText(ctx, 60, currentY, 320, 220, 1);
        drawImageCover(ctx, photos[1], 400, currentY, 540, 220);
        currentY += 240;
    } else if (photoCount === 3) {
        drawImageCover(ctx, photos[0], 60, currentY, 880, 260);
        currentY += 280;
        drawImageCover(ctx, photos[1], 60, currentY, 420, 240);
        renderNewspaperText(ctx, 500, currentY, 200, 240, 1);
        drawImageCover(ctx, photos[2], 720, currentY, 220, 240);
        currentY += 260;
    } else {
        drawImageCover(ctx, photos[0], 60, currentY, 360, 200);
        renderNewspaperText(ctx, 440, currentY, 500, 200, 2);
        currentY += 220;
        drawImageCover(ctx, photos[1], 60, currentY, 280, 180);
        renderNewspaperText(ctx, 360, currentY, 180, 180, 1);
        drawImageCover(ctx, photos[2], 560, currentY, 380, 180);
        currentY += 200;
        renderNewspaperText(ctx, 60, currentY, 880, 70, 3);
        currentY += 85;
        drawImageCover(ctx, photos[3], 60, currentY, 880, 220);
        currentY += 240;
    }

    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 3;
    ctx.strokeRect(55, currentY, w - 110, 50);
    ctx.font = 'bold 28px Courier New';
    ctx.fillStyle = '#000000';
    ctx.textAlign = 'center';
    ctx.fillText('EXTRA! EXTRA! READ ALL ABOUT IT!', w / 2, currentY + 35);
    currentY += 65;
    renderNewspaperText(ctx, 60, currentY, w - 120, h - currentY - 40, 3);
    ctx.textAlign = 'left';
}

export function renderNewspaperText(ctx, x, y, width, height, columns) {
    ctx.fillStyle = '#000000';
    ctx.font = '9px Courier New';
    ctx.textAlign = 'left';
    const columnW = (width - (columns - 1) * 15) / columns;
    const loremWords = 'Lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua Ut enim ad minim veniam quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur'.split(' ');

    for (let col = 0; col < columns; col++) {
        const colX = x + col * (columnW + 15);
        let lineY = y + 12;
        let wordIndex = Math.floor(Math.random() * loremWords.length);

        while (lineY < y + height - 10) {
            let line = '';
            let lineWidth = 0;
            while (lineWidth < columnW - 10) {
                const word = loremWords[wordIndex % loremWords.length];
                const testLine = line + (line ? ' ' : '') + word;
                const testWidth = ctx.measureText(testLine).width;
                if (testWidth > columnW - 10 && line) break;
                line = testLine; lineWidth = testWidth; wordIndex++;
            }
            ctx.fillText(line, colX, lineY);
            lineY += 11;
            if (Math.random() < 0.15 && lineY < y + height - 30) {
                ctx.font = 'bold 10px Courier New';
                ctx.fillText(loremWords[wordIndex % loremWords.length].toUpperCase() + ' ' + loremWords[(wordIndex + 1) % loremWords.length].toUpperCase(), colX, lineY + 8);
                lineY += 18;
                ctx.font = '9px Courier New';
                wordIndex += 2;
            }
        }
    }
}
