# Panduan Instalasi (Installation Guide)

Aplikasi Photobooth ini dirancang agar mudah dijalankan secara lokal di komputer Anda maupun di-deploy ke server *cloud* (seperti Render atau Railway).

## 💻 Menjalankan Secara Lokal (Local Development)

### Prasyarat
Pastikan Anda sudah menginstal **Python 3.8** (atau lebih baru) di komputer Anda.

### Langkah-Langkah (Windows)
Jika Anda menggunakan OS Windows, cara paling mudah adalah dengan menggunakan *batch script* yang telah disediakan:

1. Unduh atau *Clone* repositori ini ke dalam komputer Anda.
2. Buka folder `Photobooth`.
3. Klik dua kali pada file **`start-server.bat`**.
4. Script tersebut akan otomatis menginstal pustaka yang dibutuhkan (Flask, OpenCV) dan menyalakan server.
5. Buka browser Anda (Chrome/Edge direkomendasikan) dan kunjungi: **`http://localhost:8000`**.

### Langkah-Langkah (Mac / Linux)
1. Buka Terminal dan navigasi ke folder proyek.
2. (Opsional) Buat *virtual environment*:
   ```bash
   python3 -m venv venv
   source venv/bin/activate
   ```
3. Instal semua dependensi:
   ```bash
   pip install -r requirements.txt
   ```
4. Jalankan server Flask:
   ```bash
   python server.py
   ```
5. Buka browser dan kunjungi: **`http://localhost:8000`**.

---

## ☁️ Men-deploy ke Server / Cloud Hosting

Untuk membuat web ini bisa diakses publik (dan agar kamera berfungsi pada browser pengguna lain), aplikasi **wajib** di-deploy menggunakan protokol `HTTPS`. 

Aplikasi ini telah diproduksi dan di-deploy secara aktif di **Tencent Cloud Lighthouse VPS** dengan domain resmi: **[https://cutesnaps.us.ci](https://cutesnaps.us.ci)**.

Repositori ini sudah 100% siap untuk lingkungan produksi (*Production Ready*) karena dilengkapi dengan:
- `requirements.txt` (menggunakan `opencv-python-headless` yang aman untuk server Linux).
- `.github/workflows/deploy.yml` (CI/CD otomatis ke Tencent Cloud VPS via GitHub Actions).
- `.github/workflows/playwright.yml` (Pengujian kualitas otomatis Playwright di CI).
- Server STUN/TURN mandiri berbasis **Coturn** untuk transmisi Mode Duo tanpa batas.
- Dinamisasi binding Port di `server.py` dan auto-load `.env`.

### Panduan Deployment Lengkap ke VPS
Untuk instruksi teknis setup Nginx, Certbot SSL, PM2 daemon, dan Coturn di VPS Linux, silakan baca **[INSTALLATION_GUIDE.md](file:///d:/2026%20-%20Tugas%20Akhir%20dan%20Proyek%20Aktif/Photobooth/INSTALLATION_GUIDE.md)**.
