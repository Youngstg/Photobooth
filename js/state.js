// Global State
export const state = {
    sessionTimeLimit: 90, // 90 seconds
    timerInterval: null,
    currentPhotoIndex: 0,
    capturedPhotos: [],
    selectedPhotos: [],
    selectedFilter: 'normal',
    selectedFrame: null,
    stream: null,
    sessionPhotoCount: 0,
    isCapturing: false,
    isSessionActive: false
};

// Template generation mode - disable assets to prevent CORS taint
export let isTemplateGenerationMode = false;
