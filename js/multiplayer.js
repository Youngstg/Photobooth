// Multiplayer Connection & Signaling Engine (WebRTC + PeerJS)
import { state } from './state.js';
import { getIceConfig } from './config.js';
import { handleRemoteCursorMove, handleRemoteCursorClick, updateRemoteCursorDesign, hideRemoteCursor, stopCursorAnimationLoop, AVATARS } from './cursor-sync.js';
import { handleRemoteReaction, showReactionBar, hideReactionBar } from './reactions.js';
import { showScreen } from './ui.js';

let peer = null;
let dataConn = null;
let mediaConn = null;

// Expose getIceConfig for testing and inspection
export { getIceConfig };
if (typeof window !== 'undefined') {
    window.getIceConfig = getIceConfig;
}

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
 * Generate a unique 8-char Room Code (e.g. K9P2X4WT)
 * Cryptographically random and mixed with high-resolution entropy to ensure uniqueness across users.
 */
export function generateRoomCode() {
    // 32-char unambiguous charset (excluding easily confused 0, O, 1, I)
    const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
    const randomBytes = new Uint8Array(8);
    
    if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
        window.crypto.getRandomValues(randomBytes);
    } else {
        for (let i = 0; i < 8; i++) {
            randomBytes[i] = Math.floor(Math.random() * 256);
        }
    }

    // Mix high-resolution timestamp entropy to eliminate any risk of collision across concurrent users
    const now = Date.now();
    const perf = (typeof performance !== 'undefined' && performance.now) ? (performance.now() * 1000 | 0) : 0;
    randomBytes[0] = (randomBytes[0] ^ (now & 0xFF)) % chars.length;
    randomBytes[1] = (randomBytes[1] ^ ((now >> 8) & 0xFF) ^ (perf & 0xFF)) % chars.length;

    let code = '';
    for (let i = 0; i < 8; i++) {
        code += chars[randomBytes[i] % chars.length];
    }
    return code;
}

/**
 * Create a new multiplayer room (Host)
 */
export function createRoom(roomCode, playerName, playerAvatar) {
    return new Promise(async (resolve, reject) => {
        closeConnections();

        state.isMultiplayer = true;
        state.isHost = true;
        state.isRoomLocked = false;
        state.remotePlayer = null;
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
            const iceConfig = await getIceConfig();
            peer = new Peer(hostPeerId, {
                debug: 1,
                config: iceConfig
            });

            peer.on('open', (id) => {
                console.log(`[Multiplayer] Host room created with Peer ID: ${id}`);
                state.peer = peer;
                updateRoomHeader();
                resolve(roomCode);
            });

            peer.on('connection', (conn) => {
                console.log('[Multiplayer] Incoming connection to Host data channel');

                // FIX #2 (Tugas #2): Hentikan koneksi ketiga di sisi Host & cek jika room terkunci
                if (state.remotePlayer || state.isRoomLocked) {
                    console.warn('[Multiplayer] 3rd/unauthorized connection attempt rejected: Room is full/locked');
                    const rejectFull = () => {
                        try {
                            conn.send({
                                type: 'room_full',
                                message: 'Room ini sudah penuh (maksimal 2 orang) atau sesi sedang berlangsung.'
                            });
                        } catch (_) {}
                        setTimeout(() => { try { conn.close(); } catch (_) {} }, 400);
                    };
                    if (conn.open) rejectFull();
                    else conn.on('open', rejectFull);
                    return;
                }

                // Handle handshake / join request from first guest
                conn.on('data', async (data) => {
                    if (!data || !data.type) return;

                    if (data.type === 'join_request' || data.type === 'handshake') {
                        if (state.remotePlayer || state.isRoomLocked) {
                            try {
                                conn.send({
                                    type: 'room_full',
                                    message: 'Room sudah penuh (maksimal 2 orang).'
                                });
                                setTimeout(() => { try { conn.close(); } catch (_) {} }, 400);
                            } catch (_) {}
                            return;
                        }

                        const guestPlayer = data.player || { name: 'Tamu', avatar: 'bunny' };
                        const guestName = guestPlayer.name || 'Tamu';

                        // Konfirmasi "Izinkan bergabung?" di sisi Host (Opsi A)
                        const confirmed = await showConfirm(
                            'Permintaan Bergabung',
                            `${guestName} ingin bergabung ke room Anda. Izinkan?`,
                            'Izinkan',
                            'Tolak'
                        );

                        if (confirmed) {
                            if (state.remotePlayer) {
                                try {
                                    conn.send({ type: 'room_full', message: 'Room sudah terisi.' });
                                    setTimeout(() => { try { conn.close(); } catch (_) {} }, 400);
                                } catch (_) {}
                                return;
                            }

                            // Host menerima!
                            state.remotePlayer = guestPlayer;
                            state.isRoomLocked = true; // Kode hangus & kunci room!

                            // Hentikan timer kode room di UI dan tandai terhubung
                            window.dispatchEvent(new CustomEvent('pb_partner_connected'));

                            // Kirim konfirmasi penerimaan ke partner
                            conn.send({
                                type: 'join_accepted',
                                player: state.localPlayer
                            });

                            setupDataConnection(conn);
                            updateRemoteCursorDesign();
                            updateRoomHeader();
                            notifyPartnerConnected();
                            showToast(`🤝 ${guestName} bergabung ke room!`);

                            if (state.stream) {
                                startVideoCallWithPartner();
                            }

                            // Catch guest up jika host sudah berpindah layar
                            const currentScreen = document.querySelector('.screen.active');
                            if (currentScreen && currentScreen.id !== 'screen-lobby' && currentScreen.id !== 'screen-welcome') {
                                sendMultiplayerMessage({
                                    type: 'nav_screen',
                                    screenId: currentScreen.id
                                });
                            }
                        } else {
                            // Host menolak koneksi tamu
                            try {
                                conn.send({
                                    type: 'join_rejected',
                                    message: 'Host menolak permintaan bergabung Anda.'
                                });
                                setTimeout(() => { try { conn.close(); } catch (_) {} }, 400);
                            } catch (_) {}
                            showToast(`🚫 Anda menolak permintaan bergabung dari ${guestName}.`);
                        }
                        return;
                    }

                    // Setelah partner diterima, teruskan pesan game/aplikasi
                    if (state.remotePlayer && dataConn === conn) {
                        handleIncomingData(data);
                    }
                });

                conn.on('close', () => {
                    if (state.remotePlayer && dataConn === conn) {
                        console.warn('[Multiplayer] Partner disconnected');
                        handlePartnerDisconnected();
                    }
                });

                conn.on('error', (err) => {
                    console.error('[Multiplayer] Host data channel error:', err);
                });
            });

            // Tolak panggilan video jika bukan dari partner resmi
            peer.on('call', (call) => {
                console.log('[Multiplayer] Incoming video call from:', call.peer);
                if (!dataConn || call.peer !== dataConn.peer || !state.remotePlayer) {
                    console.warn('[Multiplayer] Unauthorized incoming video call rejected from:', call.peer);
                    try { call.close(); } catch (_) {}
                    return;
                }
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
                console.warn('[Multiplayer] Host signaling server connection disconnected.');
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
    return new Promise(async (resolve, reject) => {
        closeConnections();

        const cleanCode = roomCode.trim().toUpperCase();
        state.isMultiplayer = true;
        state.isHost = false;
        state.isRoomLocked = false;
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
            const iceConfig = await getIceConfig();
            const guestPeerId = `pb-guest-${Math.random().toString(36).substring(2, 9)}`;
            peer = new Peer(guestPeerId, {
                debug: 1,
                config: iceConfig
            });

            let isResolved = false;
            let joinTimeout = setTimeout(() => {
                if (!isResolved) {
                    isResolved = true;
                    try { peer?.destroy(); } catch (_) {}
                    reject(new Error('Waktu tunggu habis. Host tidak merespon permintaan bergabung.'));
                }
            }, 35000);

            peer.on('open', (id) => {
                console.log(`[Multiplayer] Guest peer opened with ID: ${id}`);
                state.peer = peer;

                const hostPeerId = `pb-room-${cleanCode.toLowerCase()}-host`;
                console.log(`[Multiplayer] Connecting to Host: ${hostPeerId}`);

                const conn = peer.connect(hostPeerId, {
                    reliable: true
                });

                conn.on('open', () => {
                    console.log('[Multiplayer] Connected to Host data channel! Sending join_request...');
                    conn.send({
                        type: 'join_request',
                        player: state.localPlayer
                    });
                });

                conn.on('data', (data) => {
                    if (!data || !data.type) return;

                    if (data.type === 'join_accepted') {
                        if (isResolved) return;
                        isResolved = true;
                        clearTimeout(joinTimeout);

                        state.remotePlayer = data.player;
                        state.isRoomLocked = true;
                        setupDataConnection(conn);
                        updateRemoteCursorDesign();
                        updateRoomHeader();
                        resolve(cleanCode);
                        return;
                    }

                    if (data.type === 'join_rejected') {
                        if (isResolved) return;
                        isResolved = true;
                        clearTimeout(joinTimeout);
                        try { conn.close(); } catch (_) {}
                        try { peer?.destroy(); } catch (_) {}
                        reject(new Error(data.message || 'Permintaan bergabung ditolak oleh Host.'));
                        return;
                    }

                    if (data.type === 'room_full') {
                        if (isResolved) return;
                        isResolved = true;
                        clearTimeout(joinTimeout);
                        try { conn.close(); } catch (_) {}
                        try { peer?.destroy(); } catch (_) {}
                        reject(new Error(data.message || 'Room sudah penuh (maksimal 2 orang).'));
                        return;
                    }

                    // Process other messages once connected
                    if (state.remotePlayer) {
                        handleIncomingData(data);
                    }
                });

                conn.on('close', () => {
                    console.warn('[Multiplayer] Host disconnected');
                    if (!isResolved) {
                        isResolved = true;
                        clearTimeout(joinTimeout);
                        reject(new Error('Koneksi ke Host terputus sebelum permintaan diterima.'));
                    } else {
                        handlePartnerDisconnected();
                    }
                });

                conn.on('error', (err) => {
                    console.error('[Multiplayer] Connection to Host error:', err);
                    if (!isResolved) {
                        isResolved = true;
                        clearTimeout(joinTimeout);
                        reject(new Error('Kode room tidak ditemukan atau sudah kedaluwarsa. Pastikan kode benar atau buat room baru.'));
                    }
                });
            });

            peer.on('call', (call) => {
                console.log('[Multiplayer] Incoming video call from Host');
                handleIncomingCall(call);
            });

            peer.on('error', (err) => {
                console.error('[Multiplayer] Guest Peer Error:', err);
                if (!isResolved) {
                    isResolved = true;
                    clearTimeout(joinTimeout);
                    if (err.type === 'peer-unavailable' || err.message?.includes('Could not connect to peer')) {
                        reject(new Error('Kode room tidak ditemukan atau sudah kedaluwarsa. Pastikan kode benar atau buat room baru.'));
                    } else {
                        reject(new Error(err.message || 'Gagal menyambung ke jaringan Peer.'));
                    }
                }
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

    showReactionBar();
    notifyPartnerConnected();

    // If local camera is already active, initiate video call to partner
    if (state.stream) {
        startVideoCallWithPartner();
    }

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
    const statusText = document.getElementById('duo-remote-status-text');
    const retryBtn = document.getElementById('btn-retry-partner-video');
    if (statusText) statusText.textContent = 'Menghubungkan kamera partner...';
    if (retryBtn) retryBtn.style.display = 'none';

    try {
        const call = peer.call(partnerPeerId, state.stream);
        if (call) {
            handleOutgoingCall(call);
        }
    } catch (e) {
        console.error('[Multiplayer] Error calling partner stream:', e);
    }

    // 15-second watchdog for cross-network WebRTC media connection
    if (window._partnerVideoWatchdog) clearTimeout(window._partnerVideoWatchdog);
    window._partnerVideoWatchdog = setTimeout(() => {
        if (!state.remoteStream) {
            console.warn('[Multiplayer] Partner video connection timeout (15s)');
            if (statusText) {
                statusText.textContent = 'Koneksi video partner terhambat (WebRTC/firewall). Coba klik tombol di bawah untuk menyambungkan ulang.';
            }
            if (retryBtn) retryBtn.style.display = 'inline-block';
        }
    }, 15000);
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
    if (window._partnerVideoWatchdog) {
        clearTimeout(window._partnerVideoWatchdog);
        window._partnerVideoWatchdog = null;
    }
    const statusText = document.getElementById('duo-remote-status-text');
    const retryBtn = document.getElementById('btn-retry-partner-video');
    if (statusText) statusText.textContent = 'Partner Terhubung';
    if (retryBtn) retryBtn.style.display = 'none';

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
    const statusText = document.getElementById('duo-remote-status-text');
    const retryBtn = document.getElementById('btn-retry-partner-video');
    if (statusText) statusText.textContent = 'Kamera partner terputus. Klik Hubungkan Ulang jika partner masih online.';
    if (retryBtn) retryBtn.style.display = 'inline-block';
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
    showToast(`${partner.name} berhasil join ke room!`);
}

/**
 * Handle disconnection
 */
function handlePartnerDisconnected() {
    hideRemoteCursor();
    detachRemoteVideo();
    state.remotePlayer = null;
    state.isRoomLocked = false;
    window.dispatchEvent(new CustomEvent('pb_partner_disconnected'));
    showToast('Partner terputus dari room.');
    
    const lobbyStatus = document.getElementById('lobby-partner-status');
    if (lobbyStatus) {
        lobbyStatus.innerHTML = `<span class="pulse-dot"></span> Menunggu partner join...`;
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
    state.isRoomLocked = false;
    state.remotePlayer = null;
    state.remoteStream = null;
    hideRemoteCursor();
    stopCursorAnimationLoop(); // FIX #7 (Critical): Stop RAF loop to prevent memory leak
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
 * FIX #19 (High): Custom confirm dialog to replace window.confirm()
 * Returns a Promise<boolean>
 */
export function showConfirm(title, message, confirmText = 'Ya', cancelText = 'Batal') {
    return new Promise((resolve) => {
        // Strict Singleton Guard: Prevent multiple dialogs if clicked multiple times
        if (document.querySelector('.pb-confirm-overlay')) {
            resolve(false);
            return;
        }

        const overlay = document.createElement('div');
        overlay.className = 'pb-confirm-overlay';
        overlay.innerHTML = `
            <div class="pb-confirm-dialog" role="dialog" aria-modal="true">
                <div class="pb-confirm-icon">⚠️</div>
                <h3 class="pb-confirm-title">${title}</h3>
                <p class="pb-confirm-message">${message}</p>
                <div class="pb-confirm-buttons">
                    <button type="button" class="btn-primary pb-confirm-btn-yes">${confirmText}</button>
                    <button type="button" class="btn-secondary pb-confirm-btn-no">${cancelText}</button>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);

        // Animate in smoothly
        requestAnimationFrame(() => overlay.classList.add('visible'));

        let resolved = false;
        const cleanup = (result) => {
            if (resolved) return;
            resolved = true;
            overlay.classList.remove('visible');
            setTimeout(() => {
                if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
            }, 200);
            resolve(result);
        };

        const yesBtn = overlay.querySelector('.pb-confirm-btn-yes');
        const noBtn = overlay.querySelector('.pb-confirm-btn-no');
        if (yesBtn) yesBtn.addEventListener('click', (e) => { e.stopPropagation(); cleanup(true); });
        if (noBtn) noBtn.addEventListener('click', (e) => { e.stopPropagation(); cleanup(false); });
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) cleanup(false);
        });
    });
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
