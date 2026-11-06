// Global State - Guaranteed Singleton across any module imports
if (typeof window !== 'undefined') {
    if (!window.__PHOTOBOOTH_STATE__) {
        window.__PHOTOBOOTH_STATE__ = {
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
            isRoomLocked: false,
            isHost: false,
            localPlayer: null,
            remotePlayer: null,
            peer: null,
            dataConnection: null,
            mediaConnection: null,
            remoteStream: null,
            filteredPhotos: [],
            slotAdjustments: {}
        };
    }
}

export const state = typeof window !== 'undefined' ? window.__PHOTOBOOTH_STATE__ : {
    sessionTimeLimit: 90,
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
    isMultiplayer: false,
    roomCode: null,
    isRoomLocked: false,
    isHost: false,
    localPlayer: null,
    remotePlayer: null,
    peer: null,
    dataConnection: null,
    mediaConnection: null,
    remoteStream: null,
    filteredPhotos: [],
    slotAdjustments: {}
};

// Template generation mode - disable assets to prevent CORS taint
export let isTemplateGenerationMode = false;
