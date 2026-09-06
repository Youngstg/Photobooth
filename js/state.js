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
    isSessionActive: false,
    theme: 'y2k',
    
    // Multiplayer (Angie-Style) State
    isMultiplayer: false,
    roomCode: null,
    isHost: false,
    localPlayer: null,
    remotePlayer: null,
    peer: null,
    dataConnection: null,
    mediaConnection: null,
    remoteStream: null,
    filteredPhotos: []
};

// Template generation mode - disable assets to prevent CORS taint
export let isTemplateGenerationMode = false;
