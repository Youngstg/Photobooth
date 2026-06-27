// Filter Definitions and Logic

export const availableFilters = [
    { id: 'normal', name: 'Normal' },
    { id: 'grayscale', name: 'Hitam Putih' },
    { id: 'sepia', name: 'Sepia' },
    { id: 'retro', name: 'Retro' },
    { id: 'frog', name: 'Muka Kodok 🐸' }
];

export async function applyFilterToImages(imageUrls, filterId) {
    if (filterId === 'normal') return imageUrls;

    const filteredUrls = [];

    for (const url of imageUrls) {
        try {
            const response = await fetch('/api/filter', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    image: url,
                    filter: filterId
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            if (data.error) {
                throw new Error(data.error);
            }
            
            filteredUrls.push(data.image);
        } catch (error) {
            console.error("Error processing filter on backend:", error);
            // Fallback to original image if processing fails
            filteredUrls.push(url);
        }
    }

    return filteredUrls;
}
