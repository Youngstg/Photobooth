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

### 3. 🖼️ Automated Photo Strip Stitching & OpenCV Processing
* Mode pemotretan otomatis 4 pose dengan visual countdown interaktif.
* Pemrosesan citra tingkat lanjut menggunakan **OpenCV**: Grayscale, Warm Sepia, Vintage Grain, dan Distortion Filters.
* Penggabungan otomatis menjadi strip foto polaroid beresolusi tinggi yang siap diunduh atau dibagikan.

### 4. 🎛️ Dynamic Frame & Template Management
* Dashboard khusus untuk mengunggah, mengonfigurasi dimensi, serta mengatur layout bingkai kustom secara dinamis tanpa mengubah kode sumber.
* Sistem penyimpanan modular yang mendukung penyimpanan lokal berkecepatan tinggi maupun sinkronisasi cloud NoSQL.

---

## 🏗️ Arsitektur Sistem

```
[ Pengguna Web (Kamera) ]
          │
          ├──> [ Client Layer (MediaPipe JS) ] ──> Pelacakan Landmark Wajah Real-Time
          │                                        Rendering Efek AR Canvas 60 FPS
          │
          └──> [ HTTP POST /api/filter ] ────────> [ Nginx Reverse Proxy (SSL) ]
                                                            │
                                                            ▼
                                                   [ Gunicorn WSGI ]
                                                            │
                                                            ▼
                                                [ Flask Application Core ]
                                                            ├── Pemrosesan OpenCV
                                                            ├── Stitching Strip Foto
                                                            └── Penyimpanan Foto
```

---

## 🛠️ Tech Stack

* **Frontend:** HTML5 Canvas, Vanilla Modern CSS, JavaScript (ES6+), Audio Web API
* **Computer Vision (Client):** [Google MediaPipe Face Mesh](https://developers.google.com/mediapipe)
* **Backend Core:** [Python 3.12](https://www.python.org/), [Flask 3.0](https://flask.palletsprojects.com/)
* **Image Processing Engine:** [OpenCV (opencv-python-headless)](https://opencv.org/), [NumPy](https://numpy.org/)
* **WSGI & Process Management:** [Gunicorn](https://gunicorn.org/), [PM2](https://pm2.io/)
* **Server Infrastructure:** Ubuntu Linux, Nginx, Let's Encrypt SSL, GitHub Actions CI/CD

---

## 📄 Lisensi

Proyek ini dibuat untuk keperluan eksplorasi teknologi Computer Vision dan antarmuka web kreatif.  
© 2026 **CuteSnaps Photobooth**. Seluruh hak cipta dilindungi.
