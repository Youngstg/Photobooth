import { renderFrame } from './canvas.js';

// Frame Templates - All themes available for all photo counts
export const allFrameThemes = [
    { id: 'spotify-player', name: 'Spotify Player', width: 800, height: 1000 },
    { id: 'laptop-ui', name: 'Laptop Interface', width: 900, height: 700 },
    { id: 'polaroid', name: 'Polaroid Classic', width: 800, height: 1000 },
    { id: 'phone-chat', name: 'Phone Chat', width: 800, height: 1000 },
    { id: 'split-screen', name: 'Split Screen', width: 1000, height: 800 },
    { id: 'filmstrip', name: 'Film Strip', width: 800, height: 1000 },
    { id: 'instagram-grid', name: 'Instagram Grid', width: 800, height: 1200 },
    { id: 'polaroid-stack', name: 'Polaroid Stack', width: 800, height: 1000 },
    { id: 'comic-strip', name: 'Comic Strip', width: 1200, height: 600 },
    { id: 'photo-grid', name: 'Photo Grid', width: 1000, height: 1000 },
    { id: 'video-call', name: 'Video Call UI', width: 1200, height: 800 },
    { id: 'magazine', name: 'Magazine Layout', width: 1000, height: 1200 }
];

// Generate frame templates for each photo count (1-4 photos)
export const frameTemplates = {};
for (let photoCount = 1; photoCount <= 4; photoCount++) {
    frameTemplates[photoCount] = allFrameThemes.map(theme => ({
        id: `${theme.id}-${photoCount}photo`,
        name: theme.name,
        themeId: theme.id,
        photoCount: photoCount,
        width: theme.width,
        height: theme.height,
        render: (ctx, photos) => renderFrame(ctx, photos, theme.id, photoCount)
    }));
}
