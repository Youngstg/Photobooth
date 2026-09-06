// Room Management and Lobby UI Module
import { state } from './state.js';
import { createRoom, joinRoom, generateRoomCode, sendMultiplayerMessage, showToast } from './multiplayer.js';
import { showScreen } from './ui.js';
import { startCamera } from './camera.js';

let selectedAvatar = 'cat';
let activeLobbyTab = 'create'; // 'create' or 'join'
let roomCodeInterval = null;
const ROTATION_SECONDS = 120; // 2 minutes (120s)
let timeRemaining = ROTATION_SECONDS;
let isRoomCreated = false;

/**
 * Format seconds into MM:SS
 */
function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Update timer badge display in UI
 */
function updateTimerDisplay() {
    const countdownEl = document.getElementById('room-code-countdown');
    const badgeEl = document.getElementById('room-code-timer-badge');
    if (countdownEl) {
        countdownEl.textContent = formatTime(timeRemaining);
    }
    if (badgeEl) {
        if (timeRemaining <= 20) {
            badgeEl.classList.add('warning');
        } else {
            badgeEl.classList.remove('warning');
        }
    }
}

/**
 * Generate a new unique room code and reset 2-minute timer
 */
export function rotateRoomCode(notify = false) {
    const newCode = generateRoomCode();
    const roomCodeInput = document.getElementById('lobby-room-code-display');
    if (roomCodeInput) {
        roomCodeInput.value = newCode;
    }

    // If host has already clicked "Buat Room" but partner hasn't connected yet,
    // re-create host peer with new code and update share link
    if (isRoomCreated && state.isHost && !state.remotePlayer) {
        const shareLinkInput = document.getElementById('share-link-input');
        if (shareLinkInput) {
            const fullUrl = `${window.location.origin}${window.location.pathname}?room=${newCode}`;
            shareLinkInput.value = fullUrl;
        }

        const nameInput = document.getElementById('player-name-input');
        const playerName = (nameInput && nameInput.value.trim()) || 'Host';
        createRoom(newCode, playerName, selectedAvatar).catch(err => {
            console.warn('[Room] Error updating host peer with new code:', err);
        });

        showToast(`Kode room otomatis diperbarui ke: ${newCode}`);
    } else if (notify) {
        showToast(`Kode room baru di-generate: ${newCode}`);
    }

    timeRemaining = ROTATION_SECONDS;
    updateTimerDisplay();
}

/**
 * Start the 2-minute auto rotation timer
 */
export function startRoomCodeTimer() {
    stopRoomCodeTimer();

    const roomCodeInput = document.getElementById('lobby-room-code-display');
    if (!roomCodeInput || !roomCodeInput.value) {
        rotateRoomCode(false);
    } else {
        updateTimerDisplay();
    }

    roomCodeInterval = setInterval(() => {
        // If partner is already connected in session, stop rotating
        if (state.remotePlayer) {
            stopRoomCodeTimer();
            const badgeEl = document.getElementById('room-code-timer-badge');
            if (badgeEl) {
                badgeEl.classList.remove('warning');
                badgeEl.innerHTML = `<svg viewBox="0 0 24 24" width="14" height="14" fill="#2ED573"><circle cx="12" cy="12" r="10"/></svg> <strong>Terhubung</strong>`;
            }
            return;
        }

        timeRemaining--;
        if (timeRemaining <= 0) {
            rotateRoomCode(true);
        } else {
            updateTimerDisplay();
        }
    }, 1000);
}

/**
 * Stop the 2-minute auto rotation timer
 */
export function stopRoomCodeTimer() {
    if (roomCodeInterval) {
        clearInterval(roomCodeInterval);
        roomCodeInterval = null;
    }
}

export function setupRoomLobbyListeners() {
    // Listen for partner connection events to pause/resume rotation
    window.addEventListener('pb_partner_connected', () => {
        stopRoomCodeTimer();
        const badgeEl = document.getElementById('room-code-timer-badge');
        if (badgeEl) {
            badgeEl.classList.remove('warning');
            badgeEl.innerHTML = `<svg viewBox="0 0 24 24" width="14" height="14" fill="#2ED573"><circle cx="12" cy="12" r="10"/></svg> <strong>Terhubung</strong>`;
        }
    });

    window.addEventListener('pb_partner_disconnected', () => {
        const badgeEl = document.getElementById('room-code-timer-badge');
        if (badgeEl) {
            badgeEl.innerHTML = `<svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.5-13H11v6l5.2 3.2.8-1.3-4.5-2.7V7z"/></svg> <span class="timer-text">Berlaku:</span> <strong id="room-code-countdown">02:00</strong>`;
        }
        if (activeLobbyTab === 'create' && state.isMultiplayer) {
            startRoomCodeTimer();
        }
    });

    // Mode Selection: Solo vs Duo
    const btnSolo = document.getElementById('btn-mode-solo');
    const btnDuo = document.getElementById('btn-mode-duo');
    const duoSetupPanel = document.getElementById('duo-setup-panel');

    if (btnSolo) {
        btnSolo.addEventListener('click', () => {
            state.isMultiplayer = false;
            btnSolo.classList.add('active');
            if (btnDuo) btnDuo.classList.remove('active');
            if (duoSetupPanel) duoSetupPanel.style.display = 'none';
            stopRoomCodeTimer();

            // Start solo camera session directly
            startSoloSession();
        });
    }

    if (btnDuo) {
        btnDuo.addEventListener('click', () => {
            state.isMultiplayer = true;
            btnDuo.classList.add('active');
            if (btnSolo) btnSolo.classList.remove('active');
            if (duoSetupPanel) duoSetupPanel.style.display = 'block';

            // Auto generate room code and start 2-minute timer immediately
            startRoomCodeTimer();
        });
    }

    // Avatar pickers
    document.querySelectorAll('.avatar-option').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.avatar-option').forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
            selectedAvatar = btn.dataset.avatar || 'cat';
        });
    });

    // Lobby Tabs: Create vs Join
    const tabCreate = document.getElementById('tab-lobby-create');
    const tabJoin = document.getElementById('tab-lobby-join');
    const panelCreate = document.getElementById('panel-lobby-create');
    const panelJoin = document.getElementById('panel-lobby-join');

    if (tabCreate && tabJoin) {
        tabCreate.addEventListener('click', () => {
            activeLobbyTab = 'create';
            tabCreate.classList.add('active');
            tabJoin.classList.remove('active');
            if (panelCreate) panelCreate.style.display = 'block';
            if (panelJoin) panelJoin.style.display = 'none';

            // Start/resume room code rotation on create tab
            if (!state.remotePlayer) {
                startRoomCodeTimer();
            }
        });

        tabJoin.addEventListener('click', () => {
            activeLobbyTab = 'join';
            tabJoin.classList.add('active');
            tabCreate.classList.remove('active');
            if (panelCreate) panelCreate.style.display = 'none';
            if (panelJoin) panelJoin.style.display = 'block';

            // Pause rotation while on join tab
            stopRoomCodeTimer();
        });
    }

    // Action: Manual Refresh Code Button
    const btnRefreshCode = document.getElementById('btn-refresh-code');
    if (btnRefreshCode) {
        btnRefreshCode.addEventListener('click', () => {
            rotateRoomCode(true);
        });
    }

    // Action: Create Room
    const btnCreateRoomAction = document.getElementById('btn-create-room-action');
    if (btnCreateRoomAction) {
        btnCreateRoomAction.addEventListener('click', async () => {
            const nameInput = document.getElementById('player-name-input');
            const playerName = (nameInput && nameInput.value.trim()) || 'Host';
            let roomCodeInput = document.getElementById('lobby-room-code-display');
            let roomCode = roomCodeInput ? roomCodeInput.value.trim() : '';
            if (!roomCode) {
                roomCode = generateRoomCode();
                if (roomCodeInput) roomCodeInput.value = roomCode;
            }

            btnCreateRoomAction.disabled = true;
            btnCreateRoomAction.textContent = 'Membuat Room...';

            try {
                await createRoom(roomCode, playerName, selectedAvatar);
                isRoomCreated = true;
                showToast(`Room ${roomCode} dibuat! Bagikan kode atau link ke partner.`);

                // Show shareable link
                const shareLinkInput = document.getElementById('share-link-input');
                if (shareLinkInput) {
                    const fullUrl = `${window.location.origin}${window.location.pathname}?room=${roomCode}`;
                    shareLinkInput.value = fullUrl;
                }

                // Show room created section
                const roomInfoSection = document.getElementById('room-created-info');
                if (roomInfoSection) roomInfoSection.style.display = 'block';
                btnCreateRoomAction.style.display = 'none';

            } catch (err) {
                console.error(err);
                alert(`Gagal membuat room: ${err.message}`);
                btnCreateRoomAction.disabled = false;
                btnCreateRoomAction.textContent = 'Buat Room Sekarang';
            }
        });
    }

    // Action: Copy Share Link & Room Code
    const btnCopyLink = document.getElementById('btn-copy-share-link');
    if (btnCopyLink) {
        btnCopyLink.addEventListener('click', () => {
            const shareLinkInput = document.getElementById('share-link-input');
            if (shareLinkInput) {
                navigator.clipboard.writeText(shareLinkInput.value).then(() => {
                    btnCopyLink.innerHTML = `<svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg> Tersalin!`;
                    showToast('Link room berhasil disalin ke clipboard!');
                    setTimeout(() => { 
                        btnCopyLink.innerHTML = `<svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z"/></svg> Salin Link`; 
                    }, 2000);
                });
            }
        });
    }

    const btnCopyCode = document.getElementById('btn-copy-code');
    if (btnCopyCode) {
        btnCopyCode.addEventListener('click', () => {
            const code = document.getElementById('lobby-room-code-display').value;
            if (!code) return;
            navigator.clipboard.writeText(code).then(() => {
                btnCopyCode.innerHTML = `<svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg> Tersalin!`;
                showToast(`Kode room ${code} disalin!`);
                setTimeout(() => { 
                    btnCopyCode.innerHTML = `<svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg> Salin`; 
                }, 2000);
            });
        });
    }

    // Action: Join Room
    const btnJoinRoomAction = document.getElementById('btn-join-room-action');
    if (btnJoinRoomAction) {
        btnJoinRoomAction.addEventListener('click', async () => {
            const nameInput = document.getElementById('player-name-input');
            const playerName = (nameInput && nameInput.value.trim()) || 'Guest';
            const joinCodeInput = document.getElementById('input-join-code');
            const roomCode = joinCodeInput ? joinCodeInput.value.trim().toUpperCase() : '';

            if (!roomCode) {
                alert('Masukkan Kode Room terlebih dahulu!');
                return;
            }

            btnJoinRoomAction.disabled = true;
            btnJoinRoomAction.textContent = 'Menghubungkan...';

            try {
                await joinRoom(roomCode, playerName, selectedAvatar);
                showToast(`Berhasil bergabung ke room ${roomCode}!`);

                // Start Duo camera session
                setTimeout(() => {
                    startDuoSession();
                }, 600);

            } catch (err) {
                console.error(err);
                alert(`Gagal bergabung ke room: ${err.message}`);
                btnJoinRoomAction.disabled = false;
                btnJoinRoomAction.textContent = 'Gabung Room Sekarang';
            }
        });
    }

    // Action: Start Collab Session (Host clicks when partner is connected)
    const btnStartCollab = document.getElementById('btn-start-collab-session');
    if (btnStartCollab) {
        btnStartCollab.addEventListener('click', () => {
            // Notify partner to also navigate to camera screen
            sendMultiplayerMessage({
                type: 'nav_screen',
                screenId: 'screen-camera'
            });
            startDuoSession();
        });
    }

    // Leave Room button in header
    const btnLeaveRoom = document.getElementById('btn-leave-room');
    if (btnLeaveRoom) {
        btnLeaveRoom.addEventListener('click', () => {
            if (confirm('Yakin ingin keluar dari sesi kolaborasi?')) {
                window.location.href = window.location.pathname;
            }
        });
    }

    // Check URL parameters for direct join: ?room=XXXXXX
    checkUrlForRoomInvite();
}

/**
 * Handle URL auto-invite: e.g. https://.../?room=ABC123
 */
function checkUrlForRoomInvite() {
    const urlParams = new URLSearchParams(window.location.search);
    const roomParam = urlParams.get('room');
    if (roomParam) {
        const btnDuo = document.getElementById('btn-mode-duo');
        if (btnDuo) btnDuo.click();

        const tabJoin = document.getElementById('tab-lobby-join');
        if (tabJoin) tabJoin.click();

        const joinCodeInput = document.getElementById('input-join-code');
        if (joinCodeInput) {
            joinCodeInput.value = roomParam.toUpperCase();
        }

        showToast(`Kode room otomatis terisi: ${roomParam.toUpperCase()}`);
    }
}

function startSoloSession() {
    state.isMultiplayer = false;
    state.currentPhotoIndex = 0;
    state.capturedPhotos = [];
    state.selectedPhotos = [];
    startCamera();
}

function startDuoSession() {
    state.currentPhotoIndex = 0;
    state.capturedPhotos = [];
    state.selectedPhotos = [];
    startCamera();
}
