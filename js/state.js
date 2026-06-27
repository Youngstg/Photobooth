// Global State
export const state = {
    photoCount: 0, // Jumlah foto yang akan digunakan di frame
    requiredPhotoCount: 0, // Jumlah foto yang wajib dipilih
    totalCaptureCount: 0, // Total foto yang akan diambil (4x lipat)
    currentPhotoIndex: 0,
    capturedPhotos: [],
    selectedPhotos: [],
    selectedFilter: 'normal',
    selectedFrame: null,
    stream: null,
    sessionPhotoCount: 0
};

// Template generation mode - disable assets to prevent CORS taint
export let isTemplateGenerationMode = false;
