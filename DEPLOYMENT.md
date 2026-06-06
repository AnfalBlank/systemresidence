# Deployment Guide — KSTP Cakung VPS

Panduan deploy sistem ke VPS production. Diuji untuk Ubuntu 22.04 / 24.04.

---

## 1. Arsitektur Production

```
                 ┌─────────────────────────────┐
                 │   VPS (Ubuntu)              │
                 │                             │
   browser ──►   │   Nginx :443 (TLS)          │
                 │     │                       │
                 │     ├─► / → frontend (dist) │
                 │     └─► /api → :4000        │
                 │              ↓ pm2          │
                 │           backend Node.js   │
                 └─────────────┬───────────────┘
                               │
                               ▼
                       Turso libSQL (cloud)
```

- **Frontend** statis (`dist/`) disajikan langsung Nginx
- **Backend** Node.js di port 4000, dijaga `pm2` (auto-restart, boot on reboot)
- **Database** Turso (sudah cloud, tidak perlu di VPS)
- **Nginx** sebagai reverse proxy + TLS via Let's Encrypt

---

## 2. Persiapan VPS

```bash
# Update sistem
sudo apt update && sudo apt upgrade -y

# Install Node.js LTS (via NodeSource)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs git nginx ufw

# Install pm2 globally
sudo npm install -g pm2

# Verifikasi
node -v   # harus v20.x
nginx -v
```

### Firewall

```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
```

---

## 3. Clone Repository

```bash
cd /var/www
sudo mkdir -p kstp-cakung && sudo chown $USER:$USER kstp-cakung
git clone https://github.com/AnfalBlank/systemresidence.git kstp-cakung
cd kstp-cakung
```

---

## 4. Setup Backend

```bash
cd /var/www/kstp-cakung/backend
npm install
```

### Buat file `.env`
```bash
nano .env
```

Isi:
```ini
PORT=4000

# WAJIB ganti dengan secret kuat (min 32 char random)
JWT_SECRET=isi-dengan-string-acak-panjang-untuk-production

# Turso credentials Anda
TURSO_DATABASE_URL=libsql://smartresidence-anfal.aws-ap-northeast-1.turso.io
TURSO_AUTH_TOKEN=token-turso-anda

# Domain frontend production
CORS_ORIGIN=https://kstp.example.com
```

> **Penting**: Rotasi JWT_SECRET dan TURSO_AUTH_TOKEN bila pernah terkirim
> dalam plaintext sebelumnya. Generate JWT secret:
> ```
> openssl rand -hex 48
> ```

### Migrasi & seed (sekali saja)

```bash
npm run db:migrate
# Optional — hanya bila ingin data demo:
# npm run db:seed
```

> Untuk **production murni** tanpa data demo, **lewati** `db:seed`. Buat akun
> super admin pertama langsung lewat SQL Turso atau seed kustom (lihat §10).

### Build & jalankan dengan pm2

```bash
npm run build
pm2 start dist/index.js --name kstp-backend
pm2 save
pm2 startup    # ikuti instruksi systemd yang muncul (jalankan sudo command-nya)
```

Cek status:
```bash
pm2 status
pm2 logs kstp-backend --lines 50
curl http://localhost:4000/health   # harus {"ok":true,...}
```

---

## 5. Setup Frontend

```bash
cd /var/www/kstp-cakung
npm install
```

### Buat file `.env`
```bash
nano .env
```

Isi:
```ini
VITE_API_URL=https://kstp.example.com
# JANGAN set VITE_SHOW_DEMO=true di production
```

### Build static

```bash
npm run build
# Hasilnya di /var/www/kstp-cakung/dist
```

---

## 6. Setup Nginx

```bash
sudo nano /etc/nginx/sites-available/kstp-cakung
```

Isi (ganti `kstp.example.com` dengan domain Anda):

```nginx
server {
    listen 80;
    server_name kstp.example.com;

    # Redirect ke HTTPS — diisi otomatis setelah certbot dijalankan
    # Tetap biarkan kosong dulu di langkah pertama, certbot yang akan modify

    root /var/www/kstp-cakung/dist;
    index index.html;

    # File statis frontend
    location / {
        try_files $uri $uri/ /index.html;

        # Cache aset hashed (yang punya .[hash].js / .[hash].css)
        location ~* \.(js|css|svg|png|jpg|jpeg|gif|webp|woff2?)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
            try_files $uri =404;
        }
    }

    # Reverse proxy ke backend
    location /api/ {
        proxy_pass http://127.0.0.1:4000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 60s;
    }

    # Health check pass-through (optional)
    location = /health {
        proxy_pass http://127.0.0.1:4000/health;
    }

    # Body size untuk upload (kalau nanti ada upload foto)
    client_max_body_size 5M;

    # Compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript image/svg+xml;
    gzip_min_length 1024;
}
```

### Aktifkan & reload

```bash
sudo ln -s /etc/nginx/sites-available/kstp-cakung /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

Cek di browser: `http://kstp.example.com` harus muncul halaman login.

---

## 7. TLS dengan Let's Encrypt

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d kstp.example.com
```

Pilih opsi **redirect HTTP → HTTPS**. Certbot akan:
- Update `sites-available/kstp-cakung` dengan `listen 443 ssl`
- Tambahkan blok redirect dari HTTP
- Setup auto-renewal cron

Cek `https://kstp.example.com` — harus aman dengan padlock.

---

## 8. Buat Akun Super Admin Pertama

Dari local atau SSH, jalankan SQL ini ke Turso (dashboard atau CLI):

```sql
-- Generate password hash dulu di local (bcrypt 10 rounds):
-- node -e "console.log(require('bcryptjs').hashSync('GANTI_PASSWORD_KUAT', 10))"
-- Copy hash-nya ke kolom password_hash di bawah.

INSERT INTO residents (
  id, nama, username, no_hp, blok, lantai, nomor_unit,
  status, role, account_status, password_hash
) VALUES (
  'u-super-1',
  'Super Admin',
  'admin.master',
  '08123456789',
  'A', '01', '01',
  'Pemilik',
  'super_admin',
  'Aktif',
  '$2a$10$REPLACE_WITH_BCRYPT_HASH'
);
```

Login pakai `admin.master` (atau `08123456789`) + password yang Anda hash.
Lalu dari UI **Manajemen Warga**, tambah pengelola, petugas keuangan, petugas
keamanan, dan warga.

---

## 9. Update Aplikasi (deploy ulang)

```bash
cd /var/www/kstp-cakung
git pull
# Backend
cd backend
npm install
npm run build
pm2 restart kstp-backend
# Migrasi bila ada perubahan skema
npm run db:migrate
# Frontend
cd ..
npm install
npm run build
# Nginx auto-pickup file baru, tidak perlu restart
```

Tip: Buat script `deploy.sh` yang menjalankan urutan di atas.

---

## 10. Production Hardening

### A. Hapus seed demo dari production
Pastikan **tidak menjalankan** `npm run db:seed` di VPS production. Seed berisi
akun demo dengan password `password123` yang **harus tidak ada** di production.

### B. Kunci `.env`
```bash
chmod 600 /var/www/kstp-cakung/backend/.env
chmod 600 /var/www/kstp-cakung/.env
```

### C. Buat user non-root untuk pm2
Bila Anda menjalankan setup sebagai root, sebaiknya buat user khusus:
```bash
sudo adduser kstp --disabled-password
sudo chown -R kstp:kstp /var/www/kstp-cakung
sudo -u kstp pm2 start ...
```

### D. Backup harian Turso
Turso Cloud sudah punya snapshot built-in. Tetap, atur juga export
periodik dengan `turso db shell <db> ".dump" > backup-$(date +%F).sql`.

### E. Monitoring
```bash
pm2 install pm2-logrotate    # rotasi log otomatis
pm2 monit                    # dashboard real-time
```

---

## 11. Daftar Periksa Pra-Live

- [ ] `JWT_SECRET` di `backend/.env` adalah string random 32+ karakter (bukan default dev)
- [ ] `TURSO_AUTH_TOKEN` sudah dirotasi dari yang pernah dishare di chat
- [ ] `CORS_ORIGIN` di `backend/.env` adalah domain HTTPS production
- [ ] `VITE_API_URL` di frontend `.env` adalah HTTPS production
- [ ] `VITE_SHOW_DEMO` **tidak** diset (atau set `false`) di production
- [ ] `npm run db:seed` **tidak** dijalankan di production
- [ ] Akun super admin pertama dibuat manual via SQL
- [ ] HTTPS aktif via Let's Encrypt (`certbot`)
- [ ] `ufw` mengizinkan hanya 22, 80, 443
- [ ] Permissions `.env` adalah 600
- [ ] pm2 startup terdaftar (`pm2 startup` + `pm2 save`)
- [ ] Test: login admin, buat warga baru, generate kode, aktivasi dari device lain

---

## 12. Troubleshooting

**Backend 502 di Nginx?**
```bash
pm2 logs kstp-backend
# Periksa juga apakah port 4000 listen:
sudo ss -tlnp | grep 4000
```

**Frontend tampil tapi API gagal?**
- Periksa `VITE_API_URL` di `.env` cocok dengan domain
- Periksa CORS: `CORS_ORIGIN` di `backend/.env` cocok
- Buka browser DevTools → Network tab

**Database error?**
- Cek koneksi Turso: `curl https://YOUR_DB.turso.io`
- Cek `TURSO_AUTH_TOKEN` masih valid (cek dashboard Turso)
- Token write expire 1 tahun secara default

**Migrasi gagal di tabel yang sudah ada?**
- Skema migrate sudah idempotent — aman dijalankan ulang
- Bila kolom baru tidak ter-add, pakai `safeAddColumn` di `migrate.ts` sebagai contoh
