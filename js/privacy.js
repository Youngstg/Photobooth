/**
 * Privacy & In-App Browser Utilities for CuteSnaps
 */

const PRIVACY_CONSENT_KEY = 'cutesnaps_privacy_consented';

/**
 * Check if the user has already consented to the privacy notice
 */
export function isPrivacyConsented() {
    try {
        return localStorage.getItem(PRIVACY_CONSENT_KEY) === 'true';
    } catch (e) {
        return false;
    }
}

/**
 * Save user consent
 */
export function setPrivacyConsented() {
    try {
        localStorage.setItem(PRIVACY_CONSENT_KEY, 'true');
    } catch (e) {}
}

/**
 * Show the privacy modal and return a Promise that resolves when the user accepts
 */
export function promptPrivacyNotice() {
    return new Promise((resolve) => {
        const modal = document.getElementById('modal-privacy-notice');
        if (!modal) {
            resolve(true);
            return;
        }

        modal.style.display = 'flex';
        requestAnimationFrame(() => modal.classList.add('visible'));

        const acceptBtn = document.getElementById('btn-accept-privacy');
        const handleAccept = () => {
            setPrivacyConsented();
            modal.classList.remove('visible');
            setTimeout(() => {
                modal.style.display = 'none';
            }, 200);
            if (acceptBtn) acceptBtn.removeEventListener('click', handleAccept);
            resolve(true);
        };

        if (acceptBtn) {
            acceptBtn.addEventListener('click', handleAccept);
        } else {
            resolve(true);
        }
    });
}

/**
 * Open privacy modal manually (e.g. from footer link)
 */
export function openPrivacyModal() {
    const modal = document.getElementById('modal-privacy-notice');
    if (!modal) return;
    modal.style.display = 'flex';
    requestAnimationFrame(() => modal.classList.add('visible'));

    const acceptBtn = document.getElementById('btn-accept-privacy');
    const handleClose = () => {
        modal.classList.remove('visible');
        setTimeout(() => {
            modal.style.display = 'none';
        }, 200);
        if (acceptBtn) acceptBtn.removeEventListener('click', handleClose);
    };
    if (acceptBtn) {
        acceptBtn.addEventListener('click', handleClose);
    }
}

/**
 * Detect if opened inside social media in-app browsers
 * (Instagram, TikTok, Facebook, Messenger, Line, WhatsApp, Twitter/X, WeChat)
 */
export function detectInAppBrowser() {
    if (typeof navigator === 'undefined') return false;
    const ua = navigator.userAgent || navigator.vendor || window.opera || '';
    return /Instagram|FBAN|FBAV|TikTok|musical_ly|Line\/|Snapchat|WhatsApp|MicroMessenger|Twitter/i.test(ua);
}

/**
 * Initialize in-app browser warning banner and privacy listeners
 */
export function initPrivacyAndBrowserGuards() {
    // 1. In-App Browser Warning
    if (detectInAppBrowser()) {
        const warningBanner = document.getElementById('in-app-browser-warning');
        if (warningBanner) {
            warningBanner.style.display = 'flex';
        }
    }

    // Copy app link button
    const copyLinkBtn = document.getElementById('btn-copy-app-link');
    if (copyLinkBtn) {
        copyLinkBtn.addEventListener('click', async () => {
            try {
                await navigator.clipboard.writeText(window.location.href);
                copyLinkBtn.textContent = 'Tersalin!';
                setTimeout(() => {
                    copyLinkBtn.textContent = 'Salin Link';
                }, 2500);
            } catch (err) {
                // Fallback
                const temp = document.createElement('input');
                temp.value = window.location.href;
                document.body.appendChild(temp);
                temp.select();
                document.execCommand('copy');
                document.body.removeChild(temp);
                copyLinkBtn.textContent = 'Tersalin!';
                setTimeout(() => {
                    copyLinkBtn.textContent = 'Salin Link';
                }, 2500);
            }
        });
    }

    // 2. Open Privacy Modal from link
    const openPrivacyBtn = document.getElementById('btn-open-privacy-modal');
    if (openPrivacyBtn) {
        openPrivacyBtn.addEventListener('click', () => {
            openPrivacyModal();
        });
    }
}

