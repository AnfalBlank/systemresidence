# Manual Book — Sistem Informasi & Layanan Warga KSTP Cakung

Panduan lengkap penggunaan aplikasi untuk seluruh peran pengguna.

---

## Daftar Isi

1. [Pengenalan](#1-pengenalan)
2. [Memulai (Instalasi & Menjalankan)](#2-memulai)
3. [Akun Demo](#3-akun-demo)
4. [Peran Pengguna & Hak Akses](#4-peran-pengguna--hak-akses)
5. [Alur Aktivasi Akun (Warga Baru)](#5-alur-aktivasi-akun)
6. [Panduan Fitur untuk Warga](#6-panduan-fitur-untuk-warga)
7. [Panduan Pengelola / Super Admin](#7-panduan-pengelola--super-admin)
8. [Panduan Petugas Keuangan](#8-panduan-petugas-keuangan)
9. [Panduan Petugas Keamanan](#9-panduan-petugas-keamanan)
10. [Diagram Alur (Flow)](#10-diagram-alur-flow)
11. [Pertanyaan Umum (FAQ)](#11-faq)

---

## 1. Pengenalan

**KSTP Cakung** adalah platform digital terpadu untuk mengelola administrasi,
komunikasi, ekonomi, keamanan, dan aktivitas sosial warga **Kampung Susun Tumbuh
Produktif Cakung**.

Prinsip utama:
- Satu Akun = Satu Warga Terverifikasi
- Seluruh aktivitas terhubung ke unit hunian
- Transparansi keuangan
- Pemberdayaan ekonomi warga
- Komunikasi terpusat
- Keamanan lingkungan

**Teknologi:** React + Vite + Tailwind (frontend), Node.js + Express (backend),
Turso/libSQL (database), JWT + bcrypt (autentikasi).

---

## 2. Memulai

### Prasyarat
- Node.js 18+ dan npm
- Akun database Turso (sudah dikonfigurasi di `backend/.env`)

### Menjalankan Backend
```bash
cd backend
npm install
npm run db:migrate   # buat tabel (sekali saja / saat skema berubah)
npm run db:seed      # isi data demo
npm run dev          # API jalan di http://localhost:4000
```

### Menjalankan Frontend
```bash
# dari folder root
npm install
npm run dev          # app jalan di http://localhost:5173
```

Buka browser ke **http://localhost:5173**.

---

## 3. Akun Demo

Semua akun memakai password: **`password123`**

| Peran | Login (No HP) | Nama |
|---|---|---|
| Warga | `08123456789` | Ahmad Fauzi (B-04-12) |
| Pengelola | `08111111111` | Budi Hartono |
| Petugas Keuangan | `08222222222` | Rina Andriani |
| Petugas Keamanan | `08333333333` | Pak Joko Satpam |
| Super Admin | `08444444444` | Super Admin |

**Kode undangan demo (untuk uji aktivasi):** `KSTP-NEWUSR`

---

## 4. Peran Pengguna & Hak Akses

| Fitur | Warga | Pengelola | Keuangan | Keamanan | Super Admin |
|---|:--:|:--:|:--:|:--:|:--:|
| Dashboard | ✅ | ✅ | ✅ | ✅ | ✅ |
| Community Feed | ✅ | ✅ | – | – | ✅ |
| Pengumuman (lihat) | ✅ | ✅ | ✅ | ✅ | ✅ |
| Pengumuman (buat) | – | ✅ | – | – | ✅ |
| Berita Duka | ✅ lihat | ✅ kelola | – | – | ✅ kelola |
| Iuran (bayar) | ✅ | ✅ | ✅ | – | ✅ |
| Verifikasi Pembayaran | – | – | ✅ | – | ✅ |
| Generate Iuran | – | ✅ | ✅ | – | ✅ |
| Transparansi Keuangan | ✅ | ✅ | ✅ | – | ✅ |
| Marketplace | ✅ | ✅ | – | – | ✅ |
| Skill Directory | ✅ | ✅ | – | – | ✅ |
| Iklan UMKM | ✅ | ✅ | – | – | ✅ |
| Chat | ✅ | ✅ | ✅ | ✅ | ✅ |
| Event (RSVP) | ✅ | ✅ | – | – | ✅ |
| Event (buat) | – | ✅ | – | – | ✅ |
| Booking Fasilitas | ✅ ajukan | ✅ kelola | – | – | ✅ kelola |
| E-Voting (vote) | ✅ | ✅ | – | – | ✅ |
| E-Voting (buat) | – | ✅ | – | – | ✅ |
| Crowdfunding (donasi) | ✅ | ✅ | – | – | ✅ |
| Crowdfunding (buat) | – | ✅ | – | – | ✅ |
| Bank Sampah | ✅ | ✅ | – | – | ✅ |
| Pengaduan (buat) | ✅ | ✅ kelola | – | ✅ kelola | ✅ |
| Panic Button | ✅ | – | – | – | ✅ |
| Visitor Management | ✅ daftar | – | – | ✅ verifikasi | ✅ |
| Dashboard Keamanan | – | – | – | ✅ | ✅ |
| Broadcast Center | – | ✅ | – | – | ✅ |
| Manajemen Warga | – | ✅ | – | – | ✅ |

> Catatan: menu di sidebar otomatis menyesuaikan peran yang sedang login.

---

## 5. Alur Aktivasi Akun

**Tidak ada registrasi bebas.** Akun dibuat oleh pengelola terlebih dahulu.

1. **Pengelola** membuat data warga di menu **Manajemen Warga** → sistem otomatis
   membuat **Kode Undangan** (contoh: `KSTP-7HD82K`).
2. Kode dibagikan ke warga via WhatsApp / SMS / cetak.
3. Warga membuka aplikasi → halaman **Aktivasi Akun**.
4. Warga memasukkan kode undangan → sistem menampilkan data yang sudah dibuat.
5. Warga mengonfirmasi data, lalu membuat **password**.
6. Akun aktif → warga otomatis masuk ke dashboard.

Untuk login berikutnya, warga memakai **No HP + password** di halaman **Masuk**.

---

## 6. Panduan Fitur untuk Warga

### 6.1 Dashboard
Ringkasan: tagihan aktif, akses cepat, event terdekat, campaign aktif,
pengumuman terbaru, berita duka, marketplace, dan status pengaduan. Tombol
**Panic Button** selalu tersedia di atas.

### 6.2 Membayar Iuran
1. Buka **Iuran**.
2. Pilih tagihan berstatus *Belum Bayar* → **Bayar Sekarang**.
3. Pilih metode **Transfer Bank** atau **QRIS** (scan QR).
4. Lakukan pembayaran, lalu tekan **Saya Sudah Bayar**.
5. Status berubah jadi *Menunggu Verifikasi*. Setelah petugas keuangan
   memverifikasi, status menjadi *Lunas*.

### 6.3 Marketplace
- **Belanja:** buka **Marketplace** → klik produk → **Pesan** (membuat pesanan)
  atau **Chat Penjual** (membuka percakapan langsung dengan penjual).
- **Jual produk:** tombol **Jual** → isi nama, harga, stok, kategori, foto.

### 6.4 Skill Directory
- Cari jasa warga (tukang, teknisi AC, catering, dll.), lihat rating & portofolio.
- **Chat** untuk menghubungi, atau **Tulis Review** setelah memakai jasa.
- **Daftarkan Keahlian** untuk menawarkan jasa Anda sendiri.

### 6.5 Iklan UMKM
Lihat promo usaha warga. **Hubungi Penjual** membuka chat langsung ke pemilik
usaha. **Pasang Iklan** untuk mempromosikan usaha Anda.

### 6.6 Chat
- **Grup Komunitas:** grup utama (semua warga) + grup minat (PKK, Karang Taruna,
  UMKM, Bank Sampah, Pengajian, Jual Beli).
- **Pesan Pribadi:** cari nama warga di kolom pencarian untuk memulai chat baru.
- Pesan dari tombol "Chat Penjual" otomatis masuk ke tab Pesan Pribadi.

### 6.7 Event
RSVP untuk hadir, lihat kuota, dan tampilkan **QR Absensi** untuk discan panitia.

### 6.8 Booking Fasilitas
Pilih fasilitas (Aula, Lapangan, Gazebo, Ruang Serbaguna) → ajukan tanggal,
waktu, keperluan. Status awal *Pending* sampai disetujui pengelola.

### 6.9 E-Voting
Berlaku **1 Unit = 1 Suara**. Pilih opsi → kirim suara. Setelah memilih, Anda
hanya bisa melihat hasil (tidak bisa mengubah suara).

### 6.10 Crowdfunding
Pilih campaign → **Donasi** → pilih nominal & metode → konfirmasi. Progress dana
ter-update otomatis.

### 6.11 Bank Sampah
- **Setor:** pilih jenis sampah & berat → saldo bertambah otomatis.
- **Tarik:** ajukan penarikan saldo (tidak boleh melebihi saldo).

### 6.12 Pengaduan
Buat aduan (kategori, judul, deskripsi). Pantau status: Baru → Diproses → Selesai.

### 6.13 Panic Button
Untuk darurat: pilih jenis (Medis / Kebakaran / Keamanan) → konfirmasi. Data nama,
unit, dan waktu otomatis terkirim ke petugas keamanan.

### 6.14 Visitor Management
Daftarkan tamu → sistem membuat **QR + PIN**. Tamu menunjukkan QR/PIN ke petugas
di gerbang.

### 6.15 Profil & Kartu Warga Digital
Lihat data diri, tampilkan **Kartu Warga Digital** (QR), edit profil, ubah password.

### 6.16 Notifikasi
Ikon **lonceng** di atas (kanan) menampilkan jumlah notifikasi yang belum
dibaca. Setiap notifikasi terkait kejadian yang relevan untuk Anda:

- **Pengumuman** dan **Berita Duka** baru — semua warga
- **Tagihan iuran baru**, **pembayaran diverifikasi**, atau **ditolak** — warga terkait
- **Event baru**, **voting baru**, **campaign baru** — semua warga
- **Pengajuan booking baru** — pengelola; **booking disetujui/ditolak** — pemilik booking
- **Panic alert** — petugas keamanan
- **Pengaduan baru** — pengelola/keamanan; **status pengaduan diperbarui** — pelapor
- **Status tamu** (masuk/pulang) — pemilik unit yang mengundang
- **Broadcast** — sesuai segmen target

Klik notifikasi → otomatis diarahkan ke halaman terkait dan ditandai dibaca.

### 6.17 Chat Unread
Jumlah pesan yang belum dibaca tampil di:
- **Bottom tab bar** (badge merah di ikon Chat) di mobile
- **Sidebar** (badge di item Chat) di desktop
- **Setiap baris percakapan** di halaman Chat (badge di samping pesan terakhir)

Hitungan otomatis nol setelah Anda membuka percakapan tersebut.

---

## 7. Panduan Pengelola / Super Admin

### 7.1 Manajemen Warga (`/warga`)
- **Tambah Warga:** isi nama, no HP, unit (blok/lantai/nomor), status, role →
  sistem otomatis membuat kode undangan.
- **Edit Warga:** ubah nama, no HP, email, status penghuni, **role**, dan
  **status akun** (Aktif/Nonaktif) lewat ikon pensil.
- **Hapus Warga:** ikon tempat sampah (tidak bisa menghapus akun sendiri).
- **Salin / Generate ulang** kode undangan.
- Cari warga berdasarkan nama, unit, atau kode.

> Semua modul yang dikelola pengelola/admin kini mendukung CRUD penuh
> (Create, Read, Update, Delete): Pengumuman, Berita Duka, Event, Crowdfunding,
> E-Voting, Fasilitas, dan Warga. Setiap kartu memiliki tombol **Edit** dan
> **Hapus**, dengan dialog konfirmasi sebelum penghapusan.

### 7.2 Pengumuman
Tombol **Buat** → pilih kategori (Umum/Penting/Darurat), judul, isi. Setiap
pengumuman dapat di-**Edit** atau **Hapus**.

### 7.3 Berita Duka
Tombol **Tambah** → isi nama almarhum, unit, lokasi, jadwal pemakaman. Dapat
di-**Edit** atau **Hapus**.

### 7.4 Event
Tombol **Buat Event** → nama, tipe, tanggal, waktu, lokasi, kuota, foto. Setiap
event dapat di-**Edit** atau **Hapus** (beserta data RSVP-nya).

### 7.5 Booking Fasilitas
- **Kelola Fasilitas:** di tab Fasilitas, tombol **Tambah Fasilitas** dan ikon
  hapus pada tiap kartu fasilitas.
- **Approve/Reject** pengajuan booking di tab Booking, dan tandai **Selesai**.

### 7.6 E-Voting
Tombol **Buat Voting** → judul, tipe, tanggal berakhir, dan minimal 2 pilihan.
Voting dapat **Ditutup** (status jadi Selesai) atau **Dihapus**.

### 7.7 Crowdfunding
Tombol **Buat Campaign** → judul, tipe, target dana, tanggal berakhir, foto.
Campaign dapat di-**Edit** atau **Hapus**.

### 7.8 Broadcast Center (`/broadcast`)
Kirim pengumuman tersegmentasi: Seluruh Warga / Blok / Lantai / Unit / Kelompok.

---

## 8. Panduan Petugas Keuangan

### 8.1 Verifikasi Pembayaran (`/verifikasi`)
- Lihat daftar pembayaran berstatus *Menunggu Verifikasi*.
- **Verifikasi** → status jadi *Lunas* + transaksi pemasukan otomatis tercatat.
- **Tolak** → status kembali *Belum Bayar*.

### 8.2 Generate Iuran
Tombol **Generate Iuran** → buat tagihan untuk **semua warga aktif** sekaligus
(jenis, periode, jumlah, jatuh tempo). Warga yang sudah punya tagihan serupa
otomatis dilewati.

### 8.3 Transparansi Keuangan
Tambah transaksi pemasukan/pengeluaran, lihat ringkasan & filter bulanan/tahunan,
export CSV.

---

## 9. Panduan Petugas Keamanan

### 9.1 Dashboard Keamanan (`/keamanan`)
- **Tab Panic Alerts:** alert darurat masuk real-time. Tandai *Ditangani* lalu
  *Selesai*.
- **Tab Tamu Masuk:** izinkan tamu masuk (check-in) dan check-out.
- **Verifikasi PIN:** masukkan PIN tamu untuk memvalidasi di gerbang.

---

## 10. Diagram Alur (Flow)

### Alur Aktivasi & Login
```
Pengelola buat data warga ──> Sistem generate kode undangan
        │
        ▼
Kode dibagikan (WA/SMS/cetak)
        │
        ▼
Warga buka app ──> Aktivasi Akun ──> Masukkan kode
        │
        ▼
Konfirmasi data ──> Buat password ──> Akun aktif ──> Dashboard
        │
        ▼
(Login berikutnya: No HP + password)
```

### Alur Pembayaran Iuran
```
Warga: Iuran ──> Bayar Sekarang ──> pilih Transfer/QRIS
        │
        ▼
Tekan "Saya Sudah Bayar" ──> status: Menunggu Verifikasi
        │
        ▼
Petugas Keuangan: Verifikasi ──> status: Lunas
        │
        ▼
Transaksi pemasukan otomatis tercatat di Transparansi Keuangan
```

### Alur Marketplace + Chat
```
Warga A jual produk ──> tampil di Marketplace
        │
        ▼
Warga B klik produk ──> Pesan (buat order)  ATAU  Chat Penjual
                                                      │
                                                      ▼
                              Percakapan privat terbuka ke Warga A
                                                      │
                                                      ▼
                              Warga A lihat pesan di tab "Pesan Pribadi"
```

### Alur Booking Fasilitas
```
Warga ajukan booking ──> status: Pending
        │
        ▼
Pengelola: Approve / Reject
        │
        ▼
Approved ──> (setelah dipakai) Pengelola tandai Finished
```

### Alur E-Voting (1 unit = 1 suara)
```
Pengelola buat voting (judul + opsi)
        │
        ▼
Warga pilih opsi ──> kirim suara
        │
        ├── Unit belum vote ──> suara tercatat
        └── Unit sudah vote  ──> ditolak (sudah memilih)
        │
        ▼
Hasil ditampilkan sebagai persentase
```

### Alur Panic Button
```
Warga tekan Panic ──> pilih jenis (Medis/Kebakaran/Keamanan) ──> konfirmasi
        │
        ▼
Alert masuk ke Dashboard Keamanan (nama, unit, waktu otomatis)
        │
        ▼
Petugas: Tangani ──> Selesai
```

### Alur Visitor Management
```
Warga daftarkan tamu ──> sistem buat QR + PIN
        │
        ▼
Tamu tiba di gerbang ──> tunjukkan QR / sebutkan PIN
        │
        ▼
Petugas verifikasi PIN ──> Izinkan Masuk (check-in) ──> Check-Out
```

---

## 11. FAQ

**Q: Saya buat produk/iklan tapi tidak muncul?**
Produk tampil di halaman **Marketplace**, iklan tampil di halaman **Iklan UMKM**.
Pastikan filter kategori tidak menyembunyikannya. Semua user melihat item yang
dibuat.

**Q: Chat ke penjual tidak sampai?**
Gunakan tombol **Chat Penjual / Hubungi Penjual** di detail produk/iklan — ini
membuka percakapan langsung. Pesan akan muncul di tab **Pesan Pribadi** milik
penjual.

**Q: Kenapa menu saya berbeda dengan orang lain?**
Menu menyesuaikan peran (role). Warga, pengelola, petugas keuangan, dan petugas
keamanan punya menu berbeda.

**Q: Lupa password?**
Hubungi pengelola untuk reset (atau ubah via menu Profil bila masih bisa login).

**Q: Data hilang setelah refresh?**
Tidak. Semua data tersimpan di database Turso. Sesi login bertahan 7 hari.

---

*Dokumen ini bagian dari proyek KSTP Cakung. Lihat `README.md` untuk detail teknis.*
