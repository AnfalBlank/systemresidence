# KSTP Cakung — Sistem Informasi & Layanan Warga

Platform digital terpadu untuk **Kampung Susun Tumbuh Produktif Cakung**:
administrasi, komunikasi, ekonomi, keamanan, dan aktivitas sosial warga.

Full-stack:
- **Frontend** — React + Vite + TypeScript + Tailwind CSS (design Airbnb-style)
- **Backend** — Node.js + Express + TypeScript
- **Database** — Turso (libSQL)
- **Auth** — JWT + bcrypt, role-based access control

## Struktur Proyek

```
SmartResidence/
├── src/                 # Frontend React app
│   ├── components/      # layout + UI components
│   ├── config/          # navigasi
│   ├── context/         # AppContext (auth state)
│   ├── hooks/           # useApiQuery
│   ├── lib/             # api client, format, icons
│   ├── pages/           # satu file per fitur
│   └── types/           # tipe domain
├── backend/             # Express API
│   ├── src/
│   │   ├── db/          # schema.sql, client, migrate, seed
│   │   ├── middleware/  # auth (JWT + RBAC), error handling
│   │   ├── routes/      # endpoint per domain
│   │   ├── utils/       # auth, id, mappers
│   │   ├── config.ts
│   │   └── index.ts
│   └── .env             # konfigurasi (Turso, JWT) — TIDAK di-commit
└── .env                 # VITE_API_URL
```

## Menjalankan

### 1. Backend

```bash
cd backend
npm install
npm run db:migrate   # buat tabel di Turso
npm run db:seed      # isi data demo
npm run dev          # API di http://localhost:4000
```

### 2. Frontend

```bash
# dari root proyek
npm install
npm run dev          # app di http://localhost:5173
```

## Akun Demo

Semua akun memakai password **`password123`**. Login dengan nomor HP:

| Role | No HP | Nama |
|---|---|---|
| Warga | 08123456789 | Ahmad Fauzi (B-04-12) |
| Pengelola | 08111111111 | Budi Hartono |
| Petugas Keuangan | 08222222222 | Rina Andriani |
| Petugas Keamanan | 08333333333 | Pak Joko Satpam |
| Super Admin | 08444444444 | Super Admin |

**Alur aktivasi** (tanpa registrasi bebas, sesuai PRD): di halaman Aktivasi,
gunakan kode demo **`KSTP-NEWUSR`** lalu buat password.

## Fitur (semua terhubung ke backend + database)

**Phase 1:** Aktivasi kode undangan, Dashboard, Pengumuman, Berita Duka, Iuran
(bayar + verifikasi), Transparansi Keuangan, Marketplace (jual + pesan), Chat
(grup + pribadi real-time polling), Grup Komunitas, Panic Button, Pengaduan.

**Phase 2:** Skill Directory (+ review), Event (RSVP + QR absensi), Booking
Fasilitas (+ approval), E-Voting (1 unit = 1 suara, enforced di DB), Crowdfunding
(donasi), Bank Sampah (setor/tarik), Visitor Management (QR + PIN + verifikasi
gerbang), Community Feed (like + komentar + share), Iklan UMKM.

**Per Role:**
- **Pengelola** — Manajemen Warga (+ generate kode undangan), Broadcast Center,
  buat pengumuman/event/voting/campaign, approve booking.
- **Petugas Keuangan** — Verifikasi Pembayaran iuran (otomatis catat transaksi).
- **Petugas Keamanan** — Dashboard Keamanan (kelola panic alert, check-in/out
  tamu, verifikasi PIN).

## Keamanan

- Password di-hash dengan **bcrypt**.
- Sesi memakai **JWT** (berlaku 7 hari) disimpan di localStorage.
- Setiap endpoint sensitif dilindungi `requireAuth` + `requireRole`.
- E-Voting menerapkan **1 unit = 1 suara** lewat UNIQUE constraint di database.

### PENTING — Rotasi Token Turso

Token Turso sempat dikirim dalam plaintext saat setup. **Segera rotasi token
tersebut** di dashboard Turso, lalu perbarui `backend/.env`. File `.env` sudah
masuk `.gitignore` dan tidak akan ter-commit.

## Catatan Teknis

- Chat memakai polling tiap 3 detik (bukan websocket) untuk kesederhanaan.
- Upload foto (profil, produk, aduan) masih placeholder — perlu object storage.
- Export keuangan menghasilkan CSV di sisi klien.
