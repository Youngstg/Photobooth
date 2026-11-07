# 🚀 Cara Menjalankan Photobooth

## Cara Mudah (Recommended)

### 1. Jalankan Server
**Double-click** file `start-server.bat`

Atau klik kanan → Run as Administrator

### 2. Buka Browser
Setelah CMD terbuka, buka browser dan ketik:
```
http://localhost:8000
```

### 3. Pilih Halaman:
- **Main App**: `http://localhost:8000/index.html`
- **Generate Templates**: `http://localhost:8000/generate-templates.html`

### 4. Stop Server
Tekan `Ctrl+C` di jendela CMD untuk menghentikan server.

---

## Cara Manual

Jika file `.bat` tidak bekerja, buka CMD/PowerShell di folder proyek dan jalankan:

```bash
# Opsi 1: Menjalankan server Flask lengkap (API + Fitur Filter + ICE WebRTC)
python server.py
# Akses di browser: http://localhost:5000

# Opsi 2: Menjalankan server statis sederhana
python -m http.server 8000
# Akses di browser: http://localhost:8000
```

---

## ⚠️ PENTING

- ❌ **JANGAN** buka file HTML langsung dari File Explorer
- ✅ **HARUS** melalui `http://localhost:8000/`
- ❌ **JANGAN** tutup CMD saat menggunakan aplikasi
- ✅ **HARUS** ada Python terinstall di komputer

---

## FAQ

**Q: Kenapa harus pakai server lokal?**
A: Untuk menghindari CORS error saat load assets (gambar icon).

**Q: Port 8000 sudah dipakai?**
A: Edit file `start-server.bat`, ganti `8000` dengan port lain (misal `8080` atau `3000`).

**Q: Python tidak terinstall?**
A: Download dari https://www.python.org/downloads/

---

## Seperti Framework Lain

Ini mirip dengan:
- **Node.js**: `npm run dev` atau `npm start`
- **PHP**: `php artisan serve` atau `php -S localhost:8000`
- **Python**: `python manage.py runserver` (Django) atau `flask run`

File `start-server.bat` adalah versi sederhana dari command tersebut untuk project ini!
