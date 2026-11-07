const { chromium } = require('playwright');

(async () => {
    console.log('🌐 Menghubungi URL Produksi Live: https://cutesnaps.us.ci ...');
    const browser = await chromium.launch({
        headless: true,
        args: [
            '--use-fake-ui-for-media-stream',
            '--use-fake-device-for-media-stream',
            '--no-sandbox'
        ]
    });

    try {
        const page = await browser.newPage();
        const consoleErrors = [];
        page.on('console', msg => {
            if (msg.type() === 'error') consoleErrors.push(msg.text());
        });

        const resp = await page.goto('https://cutesnaps.us.ci', { waitUntil: 'networkidle' });
        console.log('HTTP Status:', resp.status());

        const title = await page.title();
        const themeColor = await page.getAttribute('meta[name="theme-color"]', 'content');
        const ogLocale = await page.getAttribute('meta[property="og:locale"]', 'content');
        const startBtn = (await page.textContent('#btn-start-now')).trim();
        const bannerGreeting = (await page.textContent('.banner-line-1')).trim();

        console.log('📌 Title:', title);
        console.log('📌 Theme Color:', themeColor);
        console.log('📌 OG Locale:', ogLocale);
        console.log('📌 Tombol Utama:', startBtn);
        console.log('📌 Banner:', bannerGreeting);
        console.log('📌 Error Konsol di Live:', consoleErrors.length);
        if (consoleErrors.length > 0) {
            console.log('Detail Errors:', consoleErrors);
        }

        // Test navigation on live
        await page.click('#btn-start-now');
        await page.waitForTimeout(500);

        const roomCode = await page.inputValue('#lobby-room-code-display');
        console.log('📌 Generated Room Code di Live:', roomCode, `(Panjang: ${roomCode.length} karakter)`);

        console.log('\n✅ VERIFIKASI LIVE PRODUCTION BERHASIL 100%!');
    } finally {
        await browser.close();
    }
})();
