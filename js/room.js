// Room Management and Lobby UI Module
import { state } from './state.js';
import { createRoom, joinRoom, generateRoomCode, sendMultiplayerMessage, showToast } from './multiplayer.js';
import { showScreen } from './ui.js';
import { startCamera } from './camera.js';

let selectedAvatar = 'cat';
let activeLobbyTab = 'create'; // 'create' or 'join'

export function setupRoomLobbyListeners() {
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

            // Auto generate room code if empty
            const roomCodeInput = document.getElementById('lobby-room-code-display');
            if (roomCodeInput && !roomCodeInput.value) {
                roomCodeInput.value = generateRoomCode();
            }
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
        });

        tabJoin.addEventListener('click', () => {
            activeLobbyTab = 'join';
            tabJoin.classList.add('active');
            tabCreate.classList.remove('active');
            if (panelCreate) panelCreate.style.display = 'none';
            if (panelJoin) panelJoin.style.display = 'block';
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
                showToast(`🎉 Room ${roomCode} dibuat! Bagikan kode atau link ke partner.`);

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
                btnCreateRoomAction.textContent = 'Buat Room Sekarang ✨';
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
                    btnCopyLink.textContent = 'Tersalin! ✅';
                    showToast('Link room berhasil disalin ke clipboard!');
                    setTimeout(() => { btnCopyLink.textContent = 'Salin Link 📋'; }, 2000);
                });
            }
        });
    }

    const btnCopyCode = document.getElementById('btn-copy-code');
    if (btnCopyCode) {
        btnCopyCode.addEventListener('click', () => {
            const code = document.getElementById('lobby-room-code-display').value;
            navigator.clipboard.writeText(code).then(() => {
                btnCopyCode.textContent = 'Tersalin! ✅';
                showToast(`Kode room ${code} disalin!`);
                setTimeout(() => { btnCopyCode.textContent = 'Salin Kode'; }, 2000);
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
                showToast(`🎉 Berhasil bergabung ke room ${roomCode}!`);

                // Start Duo camera session
                setTimeout(() => {
                    startDuoSession();
                }, 600);

            } catch (err) {
                console.error(err);
                alert(`Gagal bergabung ke room: ${err.message}`);
                btnJoinRoomAction.disabled = false;
                btnJoinRoomAction.textContent = 'Gabung Room Sekarang 🚀';
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

        showToast(`💡 Kode room otomatis terisi: ${roomParam.toUpperCase()}`);
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
