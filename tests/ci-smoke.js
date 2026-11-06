/**
 * CuteSnaps CI Smoke Test Suite (Playwright)
 * Verifies core functionality, metadata, 0 console errors, 8-char room codes, 
 * 300 DPI JFIF injection, and mobile responsive layout.
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');
const { execSync } = require('child_process');

const PORT = 8089;
const ROOT_DIR = path.resolve(__dirname, '..');

const MIME_TYPES = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.webp': 'image/webp',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.mp3': 'audio/mpeg'
};

function createStaticServer() {
    return http.createServer((req, res) => {
        let reqPath = decodeURI(req.url.split('?')[0]);
        if (reqPath === '/') reqPath = '/index.html';

        const filePath = path.join(ROOT_DIR, reqPath);
        if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('404 Not Found');
            return;
        }

        const ext = path.extname(filePath).toLowerCase();
        const contentType = MIME_TYPES[ext] || 'application/octet-stream';
        res.writeHead(200, { 'Content-Type': contentType });
        fs.createReadStream(filePath).pipe(res);
    });
}

async function runSmokeTests() {
    console.log('====================================================');
    console.log('🧪 CUTESNAPS AUTOMATED CI SMOKE TEST SUITE');
    console.log('====================================================\n');

    let totalTests = 0;
    let passedTests = 0;

    function assert(condition, testName, details = '') {
        totalTests++;
        if (condition) {
            passedTests++;
            console.log(`  ✅ [PASS] ${testName}`);
        } else {
            console.error(`  ❌ [FAIL] ${testName}${details ? ' - ' + details : ''}`);
        }
    }

    // 1. Static Syntax & Template Integrity Checks
    console.log('📌 Tahap 1: Pengecekan Sintaksis & Integritas Template');
    try {
        const jsFiles = fs.readdirSync(path.join(ROOT_DIR, 'js')).filter(f => f.endsWith('.js'));
        for (const file of jsFiles) {
            execSync(`node --check "${path.join(ROOT_DIR, 'js', file)}"`);
        }
        assert(true, 'Semua berkas JavaScript (js/*.js) valid sintaksis');
    } catch (err) {
        assert(false, 'Semua berkas JavaScript valid sintaksis', err.message);
    }

    try {
        const tplContent = JSON.parse(fs.readFileSync(path.join(ROOT_DIR, 'templates.json'), 'utf-8'));
        const themes = tplContent.themes || [];
        let allFramesExist = true;
        let missingFrame = '';
        for (const theme of themes) {
            for (const tpl of (theme.templates || [])) {
                if (tpl.url && !tpl.url.startsWith('http')) {
                    const localPath = path.join(ROOT_DIR, tpl.url);
                    if (!fs.existsSync(localPath)) {
                        allFramesExist = false;
                        missingFrame = tpl.url;
                        break;
                    }
                }
            }
        }
        assert(allFramesExist, 'Semua frame templates.json tersedia di disk', missingFrame);
    } catch (err) {
        assert(false, 'Integritas templates.json', err.message);
    }

    // Start local server
    const server = createStaticServer();
    await new Promise((resolve) => server.listen(PORT, resolve));
    console.log(`\n🌐 Server pengujian lokal berjalan di http://localhost:${PORT}\n`);

    const browser = await chromium.launch({
        headless: true,
        args: [
            '--use-fake-ui-for-media-stream',
            '--use-fake-device-for-media-stream',
            '--no-sandbox',
            '--disable-setuid-sandbox'
        ]
    });

    try {
        const context = await browser.newContext({
            viewport: { width: 1280, height: 800 }
        });
        const page = await context.newPage();

        const consoleErrors = [];
        page.on('console', msg => {
            if (msg.type() === 'error') {
                consoleErrors.push(msg.text());
            }
        });

        // 2. Page Load & Metadata Checks (#13)
        console.log('📌 Tahap 2: Pengecekan Halaman & Metadata (#13)');
        await page.goto(`http://localhost:${PORT}/index.html`, { waitUntil: 'networkidle' });

        const pageTitle = await page.title();
        assert(pageTitle.includes('CuteSnaps') && pageTitle.includes('Photobooth Online Y2K'), 'Judul halaman deskriptif dan mencakup Y2K', pageTitle);

        const themeColor = await page.getAttribute('meta[name="theme-color"]', 'content');
        assert(themeColor === '#FFEAA7', 'Meta tag theme-color ada dan sesuai (#FFEAA7)', themeColor);

        const ogLocale = await page.getAttribute('meta[property="og:locale"]', 'content');
        assert(ogLocale === 'id_ID', 'Meta tag og:locale ada (id_ID)', ogLocale);

        assert(consoleErrors.length === 0, 'Nol error konsol pada saat inisialisasi awal', consoleErrors.join('; '));

        // 3. Language & UI Consistency (#13)
        console.log('📌 Tahap 3: Konsistensi Bahasa Antarmuka (#13)');
        const startBtnText = await page.textContent('#btn-start-now');
        assert(startBtnText.includes('MULAI SEKARANG'), 'Tombol selamat datang menggunakan bahasa Indonesia (MULAI SEKARANG)', startBtnText.trim());

        const bannerText = await page.textContent('.banner-line-1');
        assert(bannerText.includes('Selamat Datang'), 'Banner menyapa dengan bahasa Indonesia (Selamat Datang)', bannerText.trim());

        // 4. Privacy Modal Inspection (#11) - Test on Welcome Screen
        console.log('📌 Tahap 4: Pemberitahuan Privasi & Kebijakan Transmisi (#11)');
        await page.click('#btn-open-privacy-modal');
        await page.waitForTimeout(300);

        const modalVisible = await page.isVisible('#modal-privacy-notice');
        assert(modalVisible, 'Modal pemberitahuan privasi terbuka saat tautan diklik');

        const modalBodyText = await page.textContent('.privacy-modal-body');
        const hasTurnNotice = modalBodyText.includes('TURN') && modalBodyText.includes('IP');
        assert(hasTurnNotice, 'Modal privasi mencantumkan keterbukaan IP publik & relay TURN');

        await page.click('#btn-accept-privacy');
        await page.waitForTimeout(300);

        // 5. Lobby Navigation & 8-Char Room Code (#2)
        console.log('📌 Tahap 5: Navigasi Lobby & Validasi Kode Room 8 Karakter (#2)');
        await page.click('#btn-start-now');
        await page.waitForTimeout(300);

        const isLobbyActive = await page.evaluate(() => document.getElementById('screen-lobby').classList.contains('active'));
        assert(isLobbyActive, 'Navigasi layar transisi ke screen-lobby setelah tombol diklik');

        // Check input value of room code
        const roomCode = (await page.inputValue('#lobby-room-code-display')).trim();
        const isValidRoomCode = /^[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{8}$/.test(roomCode);
        assert(isValidRoomCode, `Kode room berformat 8 karakter acak aman (${roomCode})`, roomCode);

        const joinTabBtn = await page.textContent('#tab-lobby-join');
        assert(joinTabBtn.includes('Gabung Room Partner'), 'Label tab menggunakan teks Gabung Room Partner', joinTabBtn.trim());

        // 6. JFIF 300 DPI Export Injection Test (#14)
        console.log('📌 Tahap 6: Validasi Metadata 300 DPI pada Hasil Foto (#14)');
        const dpiResult = await page.evaluate(async () => {
            const { insertJpegDpi } = await import('./js/canvas.js');
            const c = document.createElement('canvas');
            c.width = 300;
            c.height = 300;
            const ctx = c.getContext('2d');
            ctx.fillStyle = '#FFEAA7';
            ctx.fillRect(0, 0, 300, 300);

            const rawData = c.toDataURL('image/jpeg', 0.95);
            const injected = insertJpegDpi(rawData, 300);
            const b64 = injected.split(',')[1];
            const bin = atob(b64);
            const bytes = new Uint8Array(bin.length);
            for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);

            return {
                marker: [bytes[2], bytes[3]],
                units: bytes[13],
                xDensity: (bytes[14] << 8) | bytes[15],
                yDensity: (bytes[16] << 8) | bytes[17]
            };
        });

        assert(dpiResult.marker[0] === 0xFF && dpiResult.marker[1] === 0xE0, 'Marker JFIF APP0 (0xFF 0xE0) valid');
        assert(dpiResult.units === 1, 'Unit resolusi adalah 1 (dots per inch)');
        assert(dpiResult.xDensity === 300 && dpiResult.yDensity === 300, `Resolusi density terbaca persis 300 x 300 DPI (${dpiResult.xDensity}x${dpiResult.yDensity})`);

        // 7. Mobile Viewport Layout (#6 / D8)
        console.log('📌 Tahap 7: Responsivitas Layar Ponsel (#6 / D8)');
        await page.setViewportSize({ width: 375, height: 667 });
        const mobileMetrics = await page.evaluate(() => {
            const duoLayout = document.getElementById('camera-layout-duo');
            const wasHidden = duoLayout.style.display === 'none';
            if (wasHidden) duoLayout.style.display = 'block';

            const container = document.getElementById('duo-camera-container');
            const containerWidth = container ? container.clientWidth : 0;
            const scrollWidth = document.documentElement.scrollWidth;
            const innerWidth = window.innerWidth;

            if (wasHidden) duoLayout.style.display = 'none';

            return {
                containerWidth,
                scrollWidth,
                innerWidth,
                hasOverflowX: scrollWidth > innerWidth
            };
        });

        assert(!mobileMetrics.hasOverflowX, `Viewport 375px bebas overflow horizontal (scrollWidth: ${mobileMetrics.scrollWidth}px, innerWidth: ${mobileMetrics.innerWidth}px)`);

    } finally {
        await browser.close();
        await new Promise((resolve) => server.close(resolve));
    }

    console.log('\n====================================================');
    console.log(`📊 RINGKASAN HASIL TEST: ${passedTests}/${totalTests} LULUS (${Math.round((passedTests / totalTests) * 100)}%)`);
    console.log('====================================================\n');

    if (passedTests < totalTests) {
        process.exit(1);
    }
}

runSmokeTests().catch(err => {
    console.error('Fatal error during test execution:', err);
    process.exit(1);
});
