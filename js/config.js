// Central API Base URL & WebRTC ICE Configuration
export const API_BASE_URL = (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'))
    ? ''
    : 'https://luckystg.pythonanywhere.com';

let cachedIceConfig = null;

/**
 * Returns WebRTC ICE server configuration (STUN + TURN) safely.
 * Priority:
 * 1. window.__CUTESNAPS_CONFIG__.iceServers (if injected at runtime/build)
 * 2. Backend API /api/ice-servers (reading environment variables without hardcoded credentials)
 * 3. Fallback: Public STUN servers only (Google, Cloudflare) - Zero hardcoded credentials.
 */
export async function getIceConfig() {
    if (cachedIceConfig) return cachedIceConfig;

    // 1. Injected runtime config
    if (typeof window !== 'undefined' && window.__CUTESNAPS_CONFIG__?.iceServers) {
        cachedIceConfig = {
            iceServers: window.__CUTESNAPS_CONFIG__.iceServers,
            iceCandidatePoolSize: 10
        };
        return cachedIceConfig;
    }

    // 2. Fetch from backend API endpoints
    const endpoints = [
        '/api/ice-servers',
        `${API_BASE_URL}/api/ice-servers`
    ];

    for (const endpoint of endpoints) {
        try {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 2500);
            const res = await fetch(endpoint, {
                signal: controller.signal,
                headers: { 'Accept': 'application/json' },
                cache: 'no-store'
            });
            clearTimeout(timeout);

            if (res.ok) {
                const data = await res.json();
                if (data && Array.isArray(data.iceServers) && data.iceServers.length > 0) {
                    cachedIceConfig = {
                        iceServers: data.iceServers,
                        iceCandidatePoolSize: 10
                    };
                    if (!data.hasTurn) {
                        console.warn('[WebRTC] Production TURN server is not configured in environment variables. WebRTC may fail across symmetric NAT / cellular data.');
                    }
                    return cachedIceConfig;
                }
            }
        } catch (_) {
            // continue to fallback
        }
    }

    // 3. Fallback to public STUN servers (Safe: no passwords or private credentials in code)
    console.warn('[WebRTC] Using fallback public STUN servers. To enable cross-network TURN relay, configure TURN_SERVERS, TURN_USERNAME, and TURN_CREDENTIAL in .env.');
    cachedIceConfig = {
        iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
            { urls: 'stun:stun.cloudflare.com:3478' }
        ],
        iceCandidatePoolSize: 10
    };
    return cachedIceConfig;
}
