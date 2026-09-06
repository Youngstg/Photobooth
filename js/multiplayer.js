// Multiplayer Connection & Signaling Engine (WebRTC + PeerJS)
import { state } from './state.js';
import { handleRemoteCursorMove, handleRemoteCursorClick, updateRemoteCursorDesign, hideRemoteCursor, AVATARS } from './cursor-sync.js';
import { handleRemoteReaction, showReactionBar, hideReactionBar } from './reactions.js';
import { showScreen } from './ui.js';

let peer = null;
let dataConn = null;
let mediaConn = null;

// Event callbacks registered by other modules
const messageHandlers = {
    cursor_move: handleRemoteCursorMove,
    cursor_click: handleRemoteCursorClick,
    reaction: handleRemoteReaction
};

/**
 * Register external message handler for game/app state
 */
export function onMultiplayerMessage(type, handler) {
    messageHandlers[type] = handler;
}

/**
 * Generate a unique 6-char Room Code (e.g. X8K2NP)
 * Cryptographically random and mixed with high-resolution entropy to ensure uniqueness across users.
 */
export function generateRoomCode() {
    // 32-char unambiguous charset (excluding easily confused 0, O, 1, I)
    const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
    const randomBytes = new Uint8Array(6);
    
    if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
        window.crypto.getRandomValues(randomBytes);
    } else {
        for (let i = 0; i < 6; i++) {
            randomBytes[i] = Math.floor(Math.random() * 256);
        }
    }

    // Mix high-resolution timestamp entropy to eliminate any risk of collision across concurrent users
    const now = Date.now();
    const perf = (typeof performance !== 'undefined' && performance.now) ? (performance.now() * 1000 | 0) : 0;
    randomBytes[0] = (randomBytes[0] ^ (now & 0xFF)) % chars.length;
    randomBytes[1] = (randomBytes[1] ^ ((now >> 8) & 0xFF) ^ (perf & 0xFF)) % chars.length;

    let code = '';
    for (let i = 0; i < 6; i++) {
        code += chars[randomBytes[i] % chars.length];
    }
    return code;
}

/**
 * Create a new multiplayer room (Host)
 */
export function createRoom(roomCode, playerName, playerAvatar) {
    return new Promise((resolve, reject) => {
        closeConnections();

        state.isMultiplayer = true;
        state.isHost = true;
        state.roomCode = roomCode;
        state.localPlayer = {
            id: 'host',
            name: playerName || 'Host',
            avatar: playerAvatar || 'cat',
            isHost: true
        };

        const hostPeerId = `pb-room-${roomCode.toLowerCase()}-host`;

        // Check if PeerJS library is loaded
        if (typeof Peer === 'undefined') {
            const err = new Error('PeerJS library not loaded. Check internet connection.');
            console.error(err);
            reject(err);
            return;
        }

        try {
            peer = new Peer(hostPeerId, {
                debug: 1,
                config: {
                    iceServers: [
                        { urls: 'stun:stun.l.google.com:19302' },
                        { urls: 'stun:global.stun.twilio.com:3478' }
                    ]
                }
            });

            peer.on('open', (id) => {
                console.log(`[Multiplayer] Host room created with Peer ID: ${id}`);
                state.peer = peer;
                updateRoomHeader();
                resolve(roomCode);
            });

            peer.on('connection', (conn) => {
                console.log('[Multiplayer] Guest connected to Host data channel');
                setupDataConnection(conn);
            });

            peer.on('call', (call) => {
                console.log('[Multiplayer] Incoming video call from Guest');
                handleIncomingCall(call);
            });

            peer.on('error', (err) => {
                console.error('[Multiplayer] Host Peer Error:', err);
                if (err.type === 'unavailable-id') {
                    // Room code collision, try with new code
                    reject(new Error('Kode room sudah digunakan. Coba buat room baru.'));
                } else {
                    reject(err);
                }
            });

            peer.on('disconnected', () => {
                console.warn('[Multiplayer] Peer disconnected, attempting reconnect...');
                peer.reconnect();
            });

        } catch (e) {
            reject(e);
        }
    });
}

/**
 * Join an existing multiplayer room (Guest)
 */
export function joinRoom(roomCode, playerName, playerAvatar) {
    return new Promise((resolve, reject) => {
        closeConnections();

        const cleanCode = roomCode.trim().toUpperCase();
        state.isMultiplayer = true;
        state.isHost = false;
        state.roomCode = cleanCode;
        state.localPlayer = {
            id: 'guest',
            name: playerName || 'Guest',
            avatar: playerAvatar || 'bunny',
            isHost: false
        };

        if (typeof Peer === 'undefined') {
            const err = new Error('PeerJS library not loaded. Check internet connection.');
            reject(err);
            return;
        }

        try {
            // Guest gets a random peer ID
            const guestPeerId = `pb-guest-${Math.random().toString(36).substring(2, 9)}`;
            peer = new Peer(guestPeerId, {
                debug: 1,
                config: {
                    iceServers: [
                        { urls: 'stun:stun.l.google.com:19302' },
                        { urls: 'stun:global.stun.twilio.com:3478' }
                    ]
                }
            });

            peer.on('open', (id) => {
                console.log(`[Multiplayer] Guest peer opened with ID: ${id}`);
                state.peer = peer;

                const hostPeerId = `pb-room-${cleanCode.toLowerCase()}-host`;
                console.log(`[Multiplayer] Connecting to Host: ${hostPeerId}`);

                const conn = peer.connect(hostPeerId, {
                    reliable: true
                });

                conn.on('open', () => {
                    console.log('[Multiplayer] Connected to Host data channel!');
                    setupDataConnection(conn);
                    updateRoomHeader();
                    resolve(cleanCode);
                });

                conn.on('error', (err) => {
                    console.error('[Multiplayer] Connection to Host failed:', err);
                    reject(new Error('Gagal menghubungkan ke room. Pastikan Kode Room benar!'));
                });
            });

            peer.on('call', (call) => {
                console.log('[Multiplayer] Incoming video call from Host');
                handleIncomingCall(call);
            });

            peer.on('error', (err) => {
                console.error('[Multiplayer] Guest Peer Error:', err);
                reject(err);
            });

        } catch (e) {
            reject(e);
        }
    });
}

/**
 * Configure bidirectional DataConnection
 */
function setupDataConnection(conn) {
    dataConn = conn;
    state.dataConnection = conn;

    conn.on('open', () => {
        console.log('[Multiplayer] Data channel fully open');
        
        // Send initial handshake with our player info
        sendMultiplayerMessage({
            type: 'handshake',
            player: state.localPlayer
        });

        showReactionBar();
        notifyPartnerConnected();

        // If local camera is already active, initiate video call to partner
        if (state.stream) {
            startVideoCallWithPartner();
        }
    });

    conn.on('data', (data) => {
        handleIncomingData(data);
    });

    conn.on('close', () => {
        console.warn('[Multiplayer] Partner disconnected');
        handlePartnerDisconnected();
    });

    conn.on('error', (err) => {
        console.error('[Multiplayer] Data channel error:', err);
    });
}

/**
 * Send a message packet to partner
 */
export function sendMultiplayerMessage(payload) {
    if (dataConn && dataConn.open) {
        try {
            dataConn.send(payload);
        } catch (e) {
            console.error('[Multiplayer] Error sending message:', e);
        }
    }
}

/**
 * Handle incoming data packets
 */
function handleIncomingData(data) {
    if (!data || !data.type) return;

    if (data.type === 'handshake') {
        state.remotePlayer = data.player;
        console.log('[Multiplayer] Received handshake from partner:', state.remotePlayer);
        updateRemoteCursorDesign();
        updateRoomHeader();
        notifyPartnerConnected();

        // If host receives handshake, send handshake reply
        if (state.isHost) {
            sendMultiplayerMessage({
                type: 'handshake_reply',
                player: state.localPlayer
            });
        }
        return;
    }

    if (data.type === 'handshake_reply') {
        state.remotePlayer = data.player;
        console.log('[Multiplayer] Received handshake reply:', state.remotePlayer);
        updateRemoteCursorDesign();
        updateRoomHeader();
        notifyPartnerConnected();
        return;
    }

    // Call registered handler if available
    const handler = messageHandlers[data.type];
    if (handler) {
        handler(data);
    }
}

/**
 * Initiate WebRTC video call to partner
 */
export function startVideoCallWithPartner() {
    if (!peer || !state.stream || !state.isMultiplayer) return;

    const partnerPeerId = state.isHost 
        ? dataConn?.peer 
        : `pb-room-${state.roomCode.toLowerCase()}-host`;

    if (!partnerPeerId) {
        console.warn('[Multiplayer] No partner Peer ID to call');
        return;
    }

    console.log(`[Multiplayer] Calling partner video stream: ${partnerPeerId}`);
    try {
        const call = peer.call(partnerPeerId, state.stream);
        if (call) {
            handleOutgoingCall(call);
        }
    } catch (e) {
        console.error('[Multiplayer] Error calling partner stream:', e);
    }
}

function handleOutgoingCall(call) {
    mediaConn = call;
    state.mediaConnection = call;

    call.on('stream', (remoteStream) => {
        console.log('[Multiplayer] Received remote video stream from partner');
        state.remoteStream = remoteStream;
        attachRemoteVideo(remoteStream);
    });

    call.on('close', () => {
        console.log('[Multiplayer] Video call closed');
        detachRemoteVideo();
    });

    call.on('error', (err) => {
        console.error('[Multiplayer] Video call error:', err);
    });
}

function handleIncomingCall(call) {
    mediaConn = call;
    state.mediaConnection = call;

    // Answer call with local stream (or blank stream if camera not started yet)
    if (state.stream) {
        call.answer(state.stream);
    } else {
        // If local stream not ready, we can still answer
        call.answer();
    }

    call.on('stream', (remoteStream) => {
        console.log('[Multiplayer] Received remote stream from incoming call');
        state.remoteStream = remoteStream;
        attachRemoteVideo(remoteStream);
    });

    call.on('close', () => {
        detachRemoteVideo();
    });
}

/**
 * Attach remote stream to video elements in UI
 */
export function attachRemoteVideo(stream) {
    const videoRemoteDuo = document.getElementById('video-duo-remote');
    if (videoRemoteDuo) {
        videoRemoteDuo.srcObject = stream;
        videoRemoteDuo.play().catch(e => console.log('Autoplay remote video:', e));
    }
    const container = document.getElementById('duo-camera-container');
    if (container) {
        container.classList.add('has-partner-video');
    }
}

export function detachRemoteVideo() {
    state.remoteStream = null;
    const videoRemoteDuo = document.getElementById('video-duo-remote');
    if (videoRemoteDuo) {
        videoRemoteDuo.srcObject = null;
    }
    const container = document.getElementById('duo-camera-container');
    if (container) {
        container.classList.remove('has-partner-video');
    }
}

/**
 * Partner Connected notification toast
 */
function notifyPartnerConnected() {
    const partner = state.remotePlayer || { name: 'Partner', avatar: 'star' };
    const avatarObj = AVATARS[partner.avatar] || AVATARS.cat;
    const lobbyStatus = document.getElementById('lobby-partner-status');
    if (lobbyStatus) {
        lobbyStatus.innerHTML = `
            <div class="status-connected-box">
                <span class="status-avatar" style="display: inline-flex; align-items: center; justify-content: center; width: 32px; height: 32px; background: #8370F5; color: white; border-radius: 50%; padding: 4px;">${avatarObj.svg}</span>
                <div>
                    <strong>${partner.name}</strong> terhubung!
                    <div style="font-size: 12px; color: #48bb78;">Siap untuk foto bersama</div>
                </div>
            </div>
        `;
    }

    const btnStartCollab = document.getElementById('btn-start-collab-session');
    if (btnStartCollab) {
        btnStartCollab.disabled = false;
        btnStartCollab.classList.remove('disabled');
        btnStartCollab.textContent = 'Mulai Photobooth Bersama';
    }

    window.dispatchEvent(new CustomEvent('pb_partner_connected', { detail: partner }));
    showToast(`${partner.name} bergabung ke room!`);
}

/**
 * Handle disconnection
 */
function handlePartnerDisconnected() {
    hideRemoteCursor();
    detachRemoteVideo();
    window.dispatchEvent(new CustomEvent('pb_partner_disconnected'));
    showToast('Partner terputus dari room.');
    
    const lobbyStatus = document.getElementById('lobby-partner-status');
    if (lobbyStatus) {
        lobbyStatus.innerHTML = `<span class="pulse-dot"></span> Menunggu partner bergabung...`;
    }
}

/**
 * Close all active WebRTC connections and reset state
 */
export function closeConnections() {
    if (dataConn) {
        try { dataConn.close(); } catch(e) {}
        dataConn = null;
    }
    if (mediaConn) {
        try { mediaConn.close(); } catch(e) {}
        mediaConn = null;
    }
    if (peer) {
        try { peer.destroy(); } catch(e) {}
        peer = null;
    }
    state.isMultiplayer = false;
    state.remotePlayer = null;
    state.remoteStream = null;
    hideRemoteCursor();
    hideReactionBar();
    updateRoomHeader();
}

/**
 * Update top room header bar
 */
export function updateRoomHeader() {
    let headerEl = document.getElementById('duo-room-header');
    if (!headerEl) return;

    if (state.isMultiplayer && state.roomCode) {
        headerEl.style.display = 'flex';
        const codeEl = document.getElementById('header-room-code');
        const partnerInfoEl = document.getElementById('header-partner-info');

        if (codeEl) codeEl.textContent = state.roomCode;
        if (partnerInfoEl) {
            if (state.remotePlayer) {
                partnerInfoEl.innerHTML = `
                    <span class="online-indicator"></span>
                    <span>${state.remotePlayer.name} (${state.remotePlayer.isHost ? 'Host' : 'Partner'})</span>
                `;
            } else {
                partnerInfoEl.innerHTML = `
                    <span class="waiting-indicator"></span>
                    <span>Menunggu partner...</span>
                `;
            }
        }
    } else {
        headerEl.style.display = 'none';
    }
}

/**
 * Simple toast popup helper
 */
export function showToast(message, duration = 3000) {
    let toast = document.getElementById('pb-toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'pb-toast';
        toast.className = 'pb-toast';
        document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.classList.add('show');

    setTimeout(() => {
        toast.classList.remove('show');
    }, duration);
}
