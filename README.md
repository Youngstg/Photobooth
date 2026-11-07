# 📸 CuteSnaps — Interactive Web Photobooth & Face AR Studio

<p align="center">
  <img src="https://img.shields.io/badge/Status-Live%20Production-success?style=for-the-badge" alt="Production Status" />
  <img src="https://img.shields.io/badge/Python-3.12-blue?style=for-the-badge&logo=python" alt="Python" />
  <img src="https://img.shields.io/badge/Flask-3.0-black?style=for-the-badge&logo=flask" alt="Flask" />
  <img src="https://img.shields.io/badge/OpenCV-Headless-5C3EE8?style=for-the-badge&logo=opencv" alt="OpenCV" />
  <img src="https://img.shields.io/badge/MediaPipe-Face%20Mesh-00897B?style=for-the-badge" alt="MediaPipe" />
  <img src="https://img.shields.io/badge/WSGI-Gunicorn-green?style=for-the-badge&logo=gunicorn" alt="Gunicorn" />
</p>

<p align="center">
  <strong>Aplikasi photobooth web modern yang menggabungkan pelacakan wajah Augmented Reality (AR) secara real-time dengan pemrosesan citra digital server-side untuk menghasilkan kolase foto bergaya retro polaroid.</strong>
</p>

<p align="center">
  🌐 <strong>Live Demo:</strong> <a href="https://cutesnaps.us.ci" target="_blank">https://cutesnaps.us.ci</a>
</p>

---

## 💡 Gambaran Proyek

**CuteSnaps Photobooth** dirancang untuk menghadirkan pengalaman photobooth fisik ke dalam browser web dengan performa tinggi. Aplikasi ini memadukan kekuatan **Google MediaPipe** di sisi klien untuk mendeteksi landmark wajah dengan latensi ultra-rendah, serta **OpenCV** di sisi backend untuk rendering filter grafis dan penataan frame foto resolusi tinggi.

---

## ✨ Fitur Unggulan

### 1. 🎭 Real-Time Face AR Filters (MediaPipe)
* Pelacakan 468 titik landmark wajah secara akurat di peramban tanpa memerlukan komputasi server yang berat.
* Pilihan stiker AR, mahkota virtual, kacamata, dan efek ekspresi dinamis yang bergerak mulus mengikuti orientasi kepala pengguna.

### 2. 🎞️ Dual-Theme Aesthetic (Retro 90s & Y2K)
* Pengalaman antarmuka interaktif yang dapat berganti instan antara tema **Cyber Y2K** (gradien futuristik & font distingtif) dan **Classic 90s Polaroid**.
* Efek audio interaktif dan transisi visual responsif di perangkat desktop maupun smartphone.

### 3. 👥 Duo Collab Multiplayer (WebRTC + Coturn STUN/TURN)
* Kolaborasi photobooth jarak jauh 2 orang secara *real-time* via WebRTC & PeerJS.
* Sinkronisasi kursor lawan secara langsung, emoji reaction bar interaktif, dan hitung mundur pemotretan bersama.
* Didukung oleh infrastruktur **Coturn STUN/TURN** mandiri di VPS untuk penembusan Symmetric NAT / CGNAT pada jaringan seluler (Telkomsel/Indosat/XL).
* Sistem keamanan room: pembatasan ketat tepat 2 orang, konfirmasi persetujuan Host, kode room 8-karakter acak, dan kode langsung hangus setelah partner terhubung.

### 4. 🖼️ Automated Photo Strip Stitching & OpenCV Processing
* Mode pemotretan otomatis 4 pose dengan visual countdown interaktif.
* Pemrosesan citra tingkat lanjut menggunakan **OpenCV**: Grayscale, Warm Sepia, Vintage Grain, dan Distortion Filters.
* Injeksi metadata standar **JFIF APP0 (300 DPI)** pada berkas JPG hasil ekspor untuk standar kualitas cetak profesional HD.

### 5. 🔒 Privasi Terjamin (Zero Server Storage)
* Seluruh proses pengolahan foto dan photostrip berlangsung 100% lokal di browser pengguna (HTML5 Canvas).
* Server tidak menyimpan foto atau rekaman video pengguna, menjaga privasi penuh tanpa jejak di database backend.

---

## 🏗️ Arsitektur Sistem

```
[ Pengguna A (Host) ] <═══════════ WebRTC P2P (Media & Data) ═══════════> [ Pengguna B (Guest) ]
         │                                      ▲                                    │
         │ (Jika terhalang NAT Seluler)         │                                    │
         └───────────> [ Coturn Server (TURN Relay :3478/:5349) ] <──────────────────┘
                                                ▲
                                                │ Konfigurasi ICE Dinamis
                                                │
[ Nginx Reverse Proxy (SSL 443) ] ──> [ Gunicorn WSGI ] ──> [ Flask API Core ]
                                                               ├── GET /api/ice-servers
                                                               └── POST /api/filter (OpenCV)
```

---

## 🧪 Pengujian Otomatis (CI/CD Quality Assurance)

Proyek ini telah melalui pengujian menyeluruh menggunakan suite pengujian otomatis **Playwright**:

```bash
# Jalankan smoke test CI (17 pengujian)
npm test

# Jalankan pengujian komprehensif 14 perbaikan UAT
node tests/retest-all.js
```

---

## 🛠️ Tech Stack

* **Frontend:** HTML5 Canvas, Vanilla Modern CSS (Y2K Metallic Chrome Aesthetics), JavaScript (ES6+), Audio Web API
* **Real-Time Multiplayer:** WebRTC, PeerJS, Coturn STUN/TURN (Ubuntu VPS)
* **Computer Vision (Client):** [Google MediaPipe Face Mesh ESM](https://developers.google.com/mediapipe)
* **Backend Core:** [Python 3.12](https://www.python.org/), [Flask 3.0](https://flask.palletsprojects.com/)
* **Image Processing Engine:** [OpenCV (opencv-python-headless)](https://opencv.org/), [NumPy](https://numpy.org/)
* **WSGI & Process Management:** [Gunicorn](https://gunicorn.org/), [PM2](https://pm2.io/)
* **Testing & CI/CD:** Playwright, GitHub Actions Workflow (.github/workflows/deploy.yml, playwright.yml)
* **Server Infrastructure:** Tencent Cloud Lighthouse VPS (Ubuntu 24.04), Nginx, Let's Encrypt SSL, Coturn

---

## 📄 Lisensi

Proyek ini dibuat untuk keperluan eksplorasi teknologi Computer Vision dan antarmuka web kreatif.  
© 2026 **CuteSnaps Photobooth**. Seluruh hak cipta dilindungi.
