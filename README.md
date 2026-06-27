# 📸 Photobooth Web App

![Photobooth Preview](https://img.shields.io/badge/Status-Active-brightgreen) ![Python](https://img.shields.io/badge/Backend-Python_Flask-blue) ![JavaScript](https://img.shields.io/badge/Frontend-Vanilla_JS-yellow)

Sebuah aplikasi Photobooth interaktif berbasis web yang modern dan menyenangkan! Aplikasi ini memungkinkan pengguna untuk mengambil foto langsung dari *webcam*, menerapkan berbagai filter unik (termasuk filter "Muka Kodok"), dan menyusun foto-foto tersebut ke dalam berbagai bingkai (frame) estetis yang siap diunduh.

## ✨ Fitur Utama

- **📷 Integrasi Kamera Web (WebRTC)**: Mengambil foto secara *real-time* dengan hitung mundur otomatis.
- **🎨 Filter Gambar Instan (OpenCV)**: Pemrosesan gambar berkinerja tinggi menggunakan backend Python. Tersedia berbagai filter:
  - Hitam Putih (Grayscale)
  - Sepia (Vintage)
  - Retro
  - 🐸 **Muka Kodok (Frog Face)**: Filter distorsi lucu berpusat di wajah.
- **🖼️ Template Frame Beragam**: Beragam pilihan tata letak frame seperti *Spotify Player, Polaroid, Instagram Grid, Film Strip*, dan banyak lagi.
- **⚡ Arsitektur Modular**: Frontend dikembangkan menggunakan Vanilla ES Modules yang rapi, sementara Backend ditangani secara efisien oleh API Python Flask.

## 🛠️ Teknologi yang Digunakan

- **Frontend**: HTML5, Vanilla CSS, JavaScript (ES Modules), HTML5 Canvas.
- **Backend**: Python 3, Flask.
- **Image Processing**: OpenCV (`opencv-python-headless`), NumPy.
- **Deployment**: Mendukung deployment standar industri menggunakan `gunicorn` (tersedia `Procfile`).

## 🚀 Memulai (Getting Started)

Aplikasi ini sangat mudah dijalankan, baik di komputer lokal Anda untuk keperluan _development_ atau pesta kecil, maupun di-deploy secara online.

**Untuk panduan instalasi lengkap, silakan merujuk ke file [INSTALLATION.md](INSTALLATION.md).**

## 📂 Struktur Direktori Utama

- `/js` - Berisi semua modul JavaScript (State, UI, Camera, Canvas, Filters).
- `/Assets` - Menyimpan aset grafis ikon dan elemen antarmuka.
- `/template` - Menyimpan desain frame dan overlay.
- `server.py` - *Entry point* backend Flask API.
- `index.html` - *Entry point* antarmuka utama aplikasi.

## 🤝 Kontribusi

Kontribusi selalu diterima! Jika Anda ingin menambahkan filter baru, mendesain template frame baru, atau meningkatkan performa, silakan *fork* repositori ini dan buat *Pull Request*.

## 📜 Lisensi

Proyek ini bersifat *Open Source*. Silakan gunakan dan modifikasi sesuai kebutuhan Anda!
