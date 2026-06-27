// Asset Images Cache
export const assetImages = {};

const assetPaths = {
    heart: 'Assets/heart.png',
    play: 'Assets/play.png',
    next: 'Assets/nextbutton.png',
    replay: 'Assets/replay.png',
    home: 'Assets/home.png',
    search: 'Assets/search.png',
    add: 'Assets/add.png',
    saveInstagram: 'Assets/saveinstagram.png',
    user: 'Assets/user.png',
    chat: 'Assets/chat.png',
    send: 'Assets/send.png',
    smiley: 'Assets/smiley.png',
    clip: 'Assets/clip.png',
    speechBubble: 'Assets/speech-bubble.png',
    record: 'Assets/record.png',
    responsive: 'Assets/responsive.png',
    windows: 'Assets/windows.png'
};

// Load all asset images and convert to canvas for CORS-safe usage
export function loadAssets() {
    console.log('Starting to load assets...');
    return Promise.all(
        Object.entries(assetPaths).map(([key, path]) => {
            return new Promise((resolve) => {
                const img = new Image();

                img.onload = () => {
                    try {
                        // Convert to canvas to avoid CORS taint
                        const canvas = document.createElement('canvas');
                        canvas.width = img.width;
                        canvas.height = img.height;
                        const ctx = canvas.getContext('2d');
                        ctx.drawImage(img, 0, 0);

                        // Create new image from canvas data URL
                        const safeImg = new Image();
                        safeImg.onload = () => {
                            assetImages[key] = safeImg;
                            console.log(`✓ Loaded asset: ${key} from ${path}`);
                            resolve();
                        };
                        safeImg.src = canvas.toDataURL();
                    } catch (error) {
                        console.warn(`✗ Failed to convert asset: ${key} - ${error.message}`);
                        // Store original image anyway
                        assetImages[key] = img;
                        resolve();
                    }
                };

                img.onerror = () => {
                    console.warn(`✗ Failed to load asset: ${key} from ${path}`);
                    resolve(); // Continue even if one fails
                };

                img.src = path;
            });
        })
    ).then(() => {
        console.log(`All assets loaded: ${Object.keys(assetImages).length}/${Object.keys(assetPaths).length}`);
        return Promise.resolve();
    });
}

// Helper to draw asset image
export function drawAsset(ctx, assetKey, x, y, width, height) {
    if (assetImages[assetKey]) {
        ctx.drawImage(assetImages[assetKey], x, y, width, height);
    }
}
