# Rencana Perbaikan — CuteSnaps (https://cutesnaps.us.ci)

Rencana ini disusun dari `laporan-uat-cutesnaps.md` (63 lulus, 7 gagal, 4 uji manual). Kesimpulan "siap produksi" di laporan terlalu dini: banyak status yang bertentangan dengan buktinya, dan beberapa risiko penting justru ditandai lulus.

Ukuran usaha hanya perkiraan kasar: **S** ≤ 1 hari, **M** 2–3 hari, **L** > 3 hari.

Kolom **Status**: ☐ belum, 🔄 dikerjakan, ✅ selesai dan terverifikasi.

**Catatan penting:** saat diperiksa ulang, halaman live masih berupa versi lama (meta description masih menyebut "filter AI" dan "puluhan frame", teks "HD 300 DPI" masih ada, stiker masih bernama `…removebg-preview`). Bisa jadi perbaikan baru ada di codebase lokal dan belum ter-deploy, atau hasil pengambilan ter-cache. Cek dulu sebelum mengklaim apa pun "selesai".

---

## 1. Rencana perbaikan

### Fase 0: sebelum dibuka ke publik

| # | Perbaikan | Dasar | Langkah | Usaha | Status |
|---|---|---|---|---|---|
| 1 | **Deploy dan verifikasi semua perbaikan di live** | Cek ulang halaman live | Deploy, bersihkan cache CDN dan service worker, lalu uji ulang A6, E4, F3, H1, H9 | S | ☐ |
| 2 | **Pastikan room hanya untuk 2 orang** | C10 | Bukti C10 menampilkan toast "Cutie berhasil join ke room!", bukan penolakan, yang bisa berarti orang ketiga berhasil masuk. Karena ini video kamera, risikonya serius. Host harus menolak koneksi ketiga, sebaiknya ada konfirmasi "izinkan bergabung?", kode hangus setelah partner terhubung, dan kode diperpanjang (misalnya 8 karakter) | M | 🔄 |
| 3 | **Pasang TURN yang layak untuk produksi** | D2, H3 | OpenRelay publik gratis biasanya dibatasi dan tanpa jaminan. Pakai TURN sendiri (coturn) atau layanan berbayar dengan kredensial sementara. Pertimbangkan juga signaling PeerJS sendiri, bukan broker publik | M | 🔄 |
| 4 | **Uji ulang penanganan kamera di perangkat nyata** | B2, B3 | `toastText: null` pada kedua uji, jadi tidak terbukti ada pesan error. Uji dengan kamera sungguhan | S | ☐ |
| 5 | **Perbaiki aset 404 dan AR** | A6, B5 | Cari asal `uploads/converted_….png`. Skrip MediaPipe `vision_bundle.js` 404; sepengetahuan saya paket itu menyediakan `.mjs`/`.cjs`, bukan `.js`, jadi cek cara pemuatannya. Pastikan properti AR benar-benar mendeteksi wajah | S | 🔄 |

### Fase 1: minggu pertama

| # | Perbaikan | Dasar | Langkah | Usaha | Status |
|---|---|---|---|---|---|
| 6 | Layout Duo di HP | D8 | Evidensi menunjukkan `containerWidth: 40`, `overflowX: true`. Lihat screenshot `D8-mobile-partner-layout.png` dan perbaiki tumpukan layout | M | ☐ |
| 7 | Error konsol | I2 | Ada 6 error, tapi catatannya menyebut 0. Telusuri semuanya | S | ☐ |
| 8 | Back dan refresh | A4 | Back keluar ke `about:blank`, layar aktif `undefined`. Tambah `history.pushState` per langkah dan peringatan `beforeunload` bila sudah ada foto | M | ☐ |
| 9 | Klaim di beranda | E5 | Meta menyebut "puluhan frame", padahal hanya 2 frame. Tambah frame atau ubah klaim, termasuk `og:description` dan Twitter yang masih menyebut "filter cerdas" | S | ☐ |
| 10 | Pesan error ramah | C6, C7 | Ganti "Could not connect to peer pb-room-…" menjadi "Kode tidak ditemukan atau sudah kedaluwarsa". Pesan asli membocorkan format ID internal | S | ☐ |
| 11 | Pemberitahuan privasi | H1 | Sebutkan pihak ketiga (signaling, TURN, CDN) dan bahwa IP bisa terlihat oleh partner. Jika TURN dipakai, video lewat server relay, jadi klaim "P2P langsung" perlu disesuaikan | S–M | ☐ |
| 12 | Mulai Lagi dan sisa data | F7, F8 | Cek skrip uji (kemungkinan dialog konfirmasi tidak diklik), dan cari tahu isi 1 kunci `localStorage` | S | ☐ |

### Fase 2: poles

| # | Perbaikan | Langkah | Usaha |
|---|---|---|---|
| 13 | Metadata dan bahasa | Lengkapi `theme-color`, `og:locale`, title yang lebih deskriptif; samakan bahasa ("Welcome to Cute Snaps!", "Capture Time!") | S |
| 14 | DPI dan kualitas hasil | Tanam metadata DPI pada JPG, atau tetap pakai redaksi "Siap Cetak"; cek parameter kualitas JPG dengan kamera nyata | S |
| 15 | Otomasi | Pasang Playwright di CI agar setiap deploy diuji otomatis | M |

---

## 2. Koreksi untuk laporan UAT

| Kelompok | ID | Masalah |
|---|---|---|
| Kemungkinan bug nyata, tapi ditandai lulus | C10, A4 | Lihat perbaikan #2 dan #8 |
| Bukti tidak cocok dengan status "lulus" | B2, B3, B7, E1, E2, B5, H3 | Toast null, timer habis tak teramati, `hostPartnerBadge: false`, `iceServersCount: 0`, AR diuji dengan kamera palsu |
| Teks laporan salah, tapi status "gagal" benar | I2, D8 | 6 error konsol dan `overflowX: true` bertentangan dengan catatan |
| Status "gagal", tapi catatan menyatakan lulus | F7, F8, G3, H1 | Kemungkinan skrip uji bermasalah; verifikasi manual |
| Tidak menilai kualitas | F3, F4 | File 160 KB untuk 2000×3000 px wajar bila kamera palsu (pola sederhana); kualitas asli hanya bisa dinilai dengan kamera nyata |
| Masih ada di live | F3, I1, I6 | Teks "300 DPI" masih tampil; `theme-color` tidak terlihat; sebagian teks masih Inggris |

Hitungan 63 lulus / 7 gagal tidak bisa dipercaya apa adanya. Ubah status menjadi "belum terbukti" untuk yang buktinya tidak cocok.

---

## 3. Uji ulang setelah perbaikan

- **Otomatis:** A1, A4, A6, C6–C10, D8, E5, F7–F8, H1, I2.
- **Manual di perangkat nyata:** D2 (WiFi + data seluler), F5 (unduh iPhone/Android), G2, G7, kualitas foto dengan kamera sungguhan, dan AR dengan wajah asli.

---

## 4. Catatan penyelesaian

| Tanggal | Perbaikan # | Catatan |
|---|---|---|
| 2026-11-06 | #2 | Room dibatasi tepat 2 orang (koneksi ke-3 ditolak Host), konfirmasi Host (Opsi A) aktif via showConfirm(), kode room diperpanjang jadi 8 karakter, kode hangus setelah partner terhubung, dan pesan error PeerJS disanitasi ramah. |
| 2026-11-06 | #3 | Kredensial hardcoded OpenRelay dihapus. ICE config dibaca dinamis dari env vars via /api/ice-servers & getIceConfig(). File .env.example dibuat lengkap dengan panduan produksi. |
| 2026-11-06 | #5 | Tag vision_bundle.js 404 dihapus (FaceLandmarker dimuat via ESM resmi di js/ar-filters.js). Frame Y2K dipindah ke Assets/frames/y2k-cyber-frame.png pada templates.json. |

