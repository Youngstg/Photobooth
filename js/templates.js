import { renderDynamicFrame } from './canvas.js';

export let allFrameThemes = [];

export async function fetchTemplates() {
    try {
        const response = await fetch('/api/templates');
        const data = await response.json();
        
        allFrameThemes = data.map(t => ({
            id: t.id,
            name: t.name,
            photoCount: t.photoCount,
            width: t.width,
            height: t.height,
            url: t.url,
            slots: t.slots,
            render: (ctx, photos) => renderDynamicFrame(ctx, photos, t)
        }));
        
        console.log("Loaded templates:", allFrameThemes);
    } catch (e) {
        console.error('Failed to fetch templates', e);
        allFrameThemes = [];
    }
}
