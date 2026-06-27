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

Kabar baiknya, repositori ini sudah 100% siap untuk lingkungan produksi (*Production Ready*) karena sudah dilengkapi dengan:
- `requirements.txt` (menggunakan `opencv-python-headless` yang aman untuk server Linux).
- `Procfile` (menggunakan server `gunicorn`).
- Dinamisasi binding Port di `server.py`.

### Cara Deploy Menggunakan Render (render.com) atau Railway (railway.app)
Ini adalah platform termudah untuk menjalankan aplikasi Flask secara gratis/murah.

1. **Upload ke GitHub**: Pastikan semua file di folder ini sudah di-push ke repositori GitHub Anda.
2. **Login ke Platform**: Masuk ke dasbor [Render.com](https://render.com) atau [Railway.app](https://railway.app).
3. **Pilih Deploy from GitHub**: Buat "New Web Service" (Render) atau "New Project" (Railway).
4. **Pilih Repositori**: Pilih repositori Photobooth Anda.
5. **Konfigurasi Otomatis**: Platform akan mendeteksi `requirements.txt` dan `Procfile` secara otomatis.
6. **Selesai!**: Tunggu 1-2 menit hingga proses *build* selesai. Platform akan memberikan URL aman (`https://...`) yang bisa langsung Anda bagikan ke orang lain!

> **Penting**: Pastikan Anda tidak menghapus atau mengubah file `Procfile` karena file tersebut memberi tahu server *cloud* cara menjalankan aplikasi Anda (`gunicorn server:app`).
