// Asset Images Cache
export const assetImages = {};

const assetPaths = {
    logo: 'Assets/logo.webp',
    sticker1: 'Assets/emoji/download__1_-removebg-preview.webp',
    sticker2: 'Assets/emoji/download__2_-removebg-preview.webp',
    sticker3: 'Assets/emoji/gv-removebg-preview.webp',
    sticker4: 'Assets/emoji/smile-removebg-preview.webp'
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
