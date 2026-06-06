import { db } from './client.js'
import { hashPassword } from '../utils/auth.js'
import { newId } from '../utils/id.js'

async function clearTables() {
  const tables = [
    'broadcasts',
    'umkm_ads',
    'visitors',
    'waste_records',
    'donations',
    'campaigns',
    'voting_ballots',
    'voting_options',
    'votings',
    'bookings',
    'facilities',
    'event_rsvp',
    'events',
    'feed_comments',
    'feed_likes',
    'feed_posts',
    'skill_portfolios',
    'skill_reviews',
    'skill_providers',
    'chat_messages',
    'chat_group_members',
    'chat_groups',
    'panic_alerts',
    'complaints',
    'orders',
    'products',
    'transactions',
    'dues',
    'obituaries',
    'announcements',
    'residents',
  ]
  for (const t of tables) {
    await db.execute(`DELETE FROM ${t}`)
  }
}

async function seed() {
  console.log('Seeding database…')
  await clearTables()

  // ----- Residents -----
  const passwordHash = await hashPassword('password123')

  const residents = [
    // Demo warga (kept compatible with existing frontend expectations)
    {
      id: 'u-ahmad',
      nama: 'Ahmad Fauzi',
      no_hp: '08123456789',
      email: 'ahmad.fauzi@email.com',
      tanggal_lahir: '1988-05-12',
      jenis_kelamin: 'Laki-laki',
      blok: 'B', lantai: '04', nomor_unit: '12',
      status: 'Pemilik', role: 'warga',
      account_status: 'Aktif',
      invitation_code: 'KSTP-7HD82K',
      password_hash: passwordHash,
    },
    // Pengelola
    {
      id: 'u-pengelola',
      nama: 'Budi Hartono',
      no_hp: '08111111111',
      email: 'pengelola@kstp.id',
      blok: 'A', lantai: '01', nomor_unit: '01',
      status: 'Pemilik', role: 'pengelola',
      account_status: 'Aktif',
      invitation_code: 'KSTP-PNGLLA',
      password_hash: passwordHash,
    },
    // Petugas keuangan
    {
      id: 'u-keuangan',
      nama: 'Rina Andriani',
      no_hp: '08222222222',
      blok: 'A', lantai: '01', nomor_unit: '02',
      status: 'Pemilik', role: 'petugas_keuangan',
      account_status: 'Aktif',
      invitation_code: 'KSTP-KEUNGN',
      password_hash: passwordHash,
    },
    // Petugas keamanan
    {
      id: 'u-keamanan',
      nama: 'Pak Joko Satpam',
      no_hp: '08333333333',
      blok: 'A', lantai: '01', nomor_unit: '03',
      status: 'Pemilik', role: 'petugas_keamanan',
      account_status: 'Aktif',
      invitation_code: 'KSTP-SECRTY',
      password_hash: passwordHash,
    },
    // Super admin
    {
      id: 'u-admin',
      nama: 'Super Admin',
      no_hp: '08444444444',
      email: 'admin@kstp.id',
      blok: 'A', lantai: '01', nomor_unit: '04',
      status: 'Pemilik', role: 'super_admin',
      account_status: 'Aktif',
      invitation_code: 'KSTP-ADMIN1',
      password_hash: passwordHash,
    },
    // Other warga
    { id: 'u-sari', nama: 'Sari Dewi', no_hp: '08555555555', blok: 'A', lantai: '03', nomor_unit: '05', status: 'Pemilik', role: 'warga', account_status: 'Aktif', invitation_code: 'KSTP-SARI01', password_hash: passwordHash },
    { id: 'u-eko', nama: 'Eko Prasetyo', no_hp: '08666666666', blok: 'C', lantai: '04', nomor_unit: '01', status: 'Penyewa', role: 'warga', account_status: 'Aktif', invitation_code: 'KSTP-EKO001', password_hash: passwordHash },
    { id: 'u-rizki', nama: 'Rizki Pratama', no_hp: '08777777777', blok: 'C', lantai: '03', nomor_unit: '09', status: 'Pemilik', role: 'warga', account_status: 'Aktif', invitation_code: 'KSTP-RIZKI1', password_hash: passwordHash },
    { id: 'u-tini', nama: 'Tini Suryani', no_hp: '08888888888', blok: 'B', lantai: '03', nomor_unit: '07', status: 'Pemilik', role: 'warga', account_status: 'Aktif', invitation_code: 'KSTP-TINI01', password_hash: passwordHash },
    { id: 'u-hendra', nama: 'Hendra Wijaya', no_hp: '08999999999', blok: 'B', lantai: '02', nomor_unit: '01', status: 'Pemilik', role: 'warga', account_status: 'Aktif', invitation_code: 'KSTP-HNDR01', password_hash: passwordHash },
    // Unactivated warga (for activation demo)
    { id: 'u-baru', nama: 'Warga Baru', no_hp: '08000000001', blok: 'C', lantai: '02', nomor_unit: '08', status: 'Pemilik', role: 'warga', account_status: 'Belum Aktivasi', invitation_code: 'KSTP-NEWUSR' },
  ]

  for (const r of residents) {
    const username = (r.nama
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .join('.')) +
      `.${r.blok.toLowerCase()}${r.lantai}${r.nomor_unit}`
    await db.execute({
      sql: `INSERT INTO residents (id, nama, username, no_hp, email, tanggal_lahir, jenis_kelamin, blok, lantai, nomor_unit, status, role, account_status, invitation_code, password_hash)
            VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      args: [
        r.id, r.nama, username, r.no_hp, r.email ?? null, r.tanggal_lahir ?? null, r.jenis_kelamin ?? null,
        r.blok, r.lantai, r.nomor_unit, r.status, r.role, r.account_status, r.invitation_code, r.password_hash ?? null,
      ],
    })
  }

  // ----- Announcements -----
  const announcements = [
    { id: 'a-001', judul: 'Pemadaman Listrik Terjadwal Blok A & B', isi: 'Akan ada pemeliharaan jaringan listrik pada hari Sabtu, 6 Juni 2026, pukul 09.00–12.00 WIB.', kategori: 'Penting', tanggal: '2026-06-01', penulis: 'Pengelola KSTP' },
    { id: 'a-002', judul: 'Kerja Bakti Bulanan', isi: 'Mari bergotong royong membersihkan lingkungan bersama pada Minggu, 7 Juni 2026 pukul 07.00 WIB.', kategori: 'Umum', tanggal: '2026-05-30', penulis: 'Karang Taruna' },
    { id: 'a-003', judul: 'Peringatan: Kebocoran Pipa Air Lantai 3 Blok C', isi: 'Sedang dilakukan perbaikan darurat pada pipa utama. Suplai air di Blok C dapat terganggu sementara.', kategori: 'Darurat', tanggal: '2026-06-01', penulis: 'Petugas Teknis' },
    { id: 'a-004', judul: 'Pembukaan Pendaftaran Bazar UMKM', isi: 'Pelaku UMKM warga dapat mendaftar untuk Bazar Ramah Warga.', kategori: 'Umum', tanggal: '2026-05-28', penulis: 'Pengelola KSTP' },
  ]
  for (const a of announcements) {
    await db.execute({
      sql: 'INSERT INTO announcements (id, judul, isi, kategori, tanggal, penulis) VALUES (?,?,?,?,?,?)',
      args: [a.id, a.judul, a.isi, a.kategori, a.tanggal, a.penulis],
    })
  }

  // ----- Obituaries -----
  await db.execute({
    sql: 'INSERT INTO obituaries (id, nama_almarhum, unit, lokasi_rumah_duka, jadwal_pemakaman, tanggal, catatan) VALUES (?,?,?,?,?,?,?)',
    args: ['o-001', 'Hj. Siti Aminah', 'A-02-08', 'Unit A-02-08, Blok A Lantai 2', 'Senin, 2 Juni 2026, 10.00 WIB', '2026-06-01', 'Mohon doa untuk almarhumah.'],
  })
  await db.execute({
    sql: 'INSERT INTO obituaries (id, nama_almarhum, unit, lokasi_rumah_duka, jadwal_pemakaman, tanggal) VALUES (?,?,?,?,?,?)',
    args: ['o-002', 'Bapak Sutrisno', 'C-01-03', 'Masjid Al-Ikhlas KSTP', 'Sudah dimakamkan, 29 Mei 2026', '2026-05-29'],
  })

  // ----- Dues for ahmad -----
  const dues = [
    { id: 'd-001', resident_id: 'u-ahmad', jenis: 'IPL', periode: 'Juni 2026', jumlah: 150000, status: 'Belum Bayar', jatuh_tempo: '2026-06-10' },
    { id: 'd-002', resident_id: 'u-ahmad', jenis: 'Kebersihan', periode: 'Juni 2026', jumlah: 50000, status: 'Belum Bayar', jatuh_tempo: '2026-06-10' },
    { id: 'd-003', resident_id: 'u-ahmad', jenis: 'Keamanan', periode: 'Juni 2026', jumlah: 75000, status: 'Menunggu Verifikasi', jatuh_tempo: '2026-06-10' },
    { id: 'd-004', resident_id: 'u-ahmad', jenis: 'IPL', periode: 'Mei 2026', jumlah: 150000, status: 'Lunas', jatuh_tempo: '2026-05-10' },
    { id: 'd-005', resident_id: 'u-ahmad', jenis: 'Dana Sosial', periode: 'Mei 2026', jumlah: 25000, status: 'Lunas', jatuh_tempo: '2026-05-10' },
  ]
  for (const d of dues) {
    await db.execute({
      sql: 'INSERT INTO dues (id, resident_id, jenis, periode, jumlah, status, jatuh_tempo) VALUES (?,?,?,?,?,?,?)',
      args: [d.id, d.resident_id, d.jenis, d.periode, d.jumlah, d.status, d.jatuh_tempo],
    })
  }
  // dues for other residents (so admin sees a list)
  for (const r of ['u-sari', 'u-eko', 'u-rizki', 'u-tini', 'u-hendra']) {
    await db.execute({
      sql: 'INSERT INTO dues (id, resident_id, jenis, periode, jumlah, status, jatuh_tempo) VALUES (?,?,?,?,?,?,?)',
      args: [newId('d'), r, 'IPL', 'Juni 2026', 150000, 'Belum Bayar', '2026-06-10'],
    })
  }

  // ----- Transactions -----
  const txs = [
    { tanggal: '2026-05-28', keterangan: 'Iuran IPL Mei 2026 (142 unit)', kategori: 'Iuran', tipe: 'pemasukan', jumlah: 21300000 },
    { tanggal: '2026-05-25', keterangan: 'Gaji petugas keamanan', kategori: 'Operasional', tipe: 'pengeluaran', jumlah: 6000000 },
    { tanggal: '2026-05-20', keterangan: 'Pembelian alat kebersihan', kategori: 'Kebersihan', tipe: 'pengeluaran', jumlah: 1250000 },
    { tanggal: '2026-05-18', keterangan: 'Donasi crowdfunding renovasi gazebo', kategori: 'Crowdfunding', tipe: 'pemasukan', jumlah: 4500000 },
    { tanggal: '2026-05-15', keterangan: 'Pembayaran tagihan listrik area umum', kategori: 'Utilitas', tipe: 'pengeluaran', jumlah: 3200000 },
    { tanggal: '2026-05-10', keterangan: 'Iuran Keamanan Mei 2026', kategori: 'Iuran', tipe: 'pemasukan', jumlah: 10650000 },
    { tanggal: '2026-06-01', keterangan: 'Pembayaran tagihan air bulanan', kategori: 'Utilitas', tipe: 'pengeluaran', jumlah: 1800000 },
    { tanggal: '2026-06-02', keterangan: 'Iuran IPL Juni 2026 (parsial)', kategori: 'Iuran', tipe: 'pemasukan', jumlah: 8500000 },
  ]
  for (const t of txs) {
    await db.execute({
      sql: 'INSERT INTO transactions (id, tanggal, keterangan, kategori, tipe, jumlah) VALUES (?,?,?,?,?,?)',
      args: [newId('t'), t.tanggal, t.keterangan, t.kategori, t.tipe, t.jumlah],
    })
  }

  // ----- Products -----
  const products = [
    { id: 'p-001', seller: 'u-sari', nama: 'Nasi Uduk Komplit Bu Sari', foto: 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=600&q=80', harga: 15000, stok: 20, deskripsi: 'Nasi uduk dengan ayam goreng, tempe orek, dan sambal khas.', kategori: 'Makanan' },
    { id: 'p-002', seller: 'u-eko', nama: 'Servis & Cuci AC', foto: 'https://images.unsplash.com/photo-1631545806609-c2b69bbe8d4f?w=600&q=80', harga: 85000, stok: 99, deskripsi: 'Teknisi AC berpengalaman, warga KSTP sendiri. Garansi pengerjaan.', kategori: 'Jasa' },
    { id: 'p-003', seller: 'u-tini', nama: 'Sayur Mayur Segar Paket', foto: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=600&q=80', harga: 35000, stok: 15, deskripsi: 'Paket sayur segar untuk seminggu. Langsung dari pasar pagi.', kategori: 'Kebutuhan' },
    { id: 'p-004', seller: 'u-sari', nama: 'Kue Kering Lebaran (Toples)', foto: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=600&q=80', harga: 65000, stok: 12, deskripsi: 'Nastar, kastengel, dan putri salju homemade.', kategori: 'Makanan' },
    { id: 'p-005', seller: 'u-rizki', nama: 'Galon Air Mineral Antar', foto: 'https://images.unsplash.com/photo-1616118132534-381148898bb4?w=600&q=80', harga: 20000, stok: 50, deskripsi: 'Isi ulang galon diantar ke depan pintu unit.', kategori: 'Kebutuhan' },
    { id: 'p-006', seller: 'u-hendra', nama: 'Jasa Laundry Kiloan', foto: 'https://images.unsplash.com/photo-1545173168-9f1947eebb7f?w=600&q=80', harga: 7000, stok: 99, deskripsi: 'Cuci kering lipat per kg. Selesai 2 hari.', kategori: 'Jasa' },
  ]
  for (const p of products) {
    await db.execute({
      sql: 'INSERT INTO products (id, seller_id, nama, foto, harga, stok, deskripsi, kategori) VALUES (?,?,?,?,?,?,?,?)',
      args: [p.id, p.seller, p.nama, p.foto, p.harga, p.stok, p.deskripsi, p.kategori],
    })
  }

  // ----- Complaints -----
  await db.execute({
    sql: 'INSERT INTO complaints (id, resident_id, kategori, judul, deskripsi, status, tanggal) VALUES (?,?,?,?,?,?,?)',
    args: ['c-001', 'u-ahmad', 'Kebersihan', 'Sampah menumpuk di TPS Blok B', 'Sampah belum diangkut sejak 3 hari lalu, mulai menimbulkan bau.', 'Diproses', '2026-05-30'],
  })
  await db.execute({
    sql: 'INSERT INTO complaints (id, resident_id, kategori, judul, deskripsi, status, tanggal) VALUES (?,?,?,?,?,?,?)',
    args: ['c-002', 'u-ahmad', 'Infrastruktur', 'Lampu koridor lantai 4 mati', 'Sudah 2 lampu mati di koridor, gelap di malam hari.', 'Baru', '2026-06-01'],
  })
  await db.execute({
    sql: 'INSERT INTO complaints (id, resident_id, kategori, judul, deskripsi, status, tanggal) VALUES (?,?,?,?,?,?,?)',
    args: ['c-003', 'u-ahmad', 'Fasilitas', 'Keran air taman bocor', 'Keran di taman bermain anak bocor terus menerus.', 'Selesai', '2026-05-22'],
  })

  // ----- Chat groups -----
  const groups = [
    { id: 'g-001', nama: 'Kampung Susun Tumbuh Produktif Cakung', deskripsi: 'Grup utama seluruh warga', icon_key: 'home', is_main: 1 },
    { id: 'g-002', nama: 'Grup UMKM', deskripsi: 'Pelaku usaha warga', icon_key: 'cart', is_main: 0 },
    { id: 'g-003', nama: 'Karang Taruna', deskripsi: 'Pemuda KSTP', icon_key: 'trophy', is_main: 0 },
    { id: 'g-004', nama: 'PKK', deskripsi: 'Ibu-ibu PKK', icon_key: 'flower', is_main: 0 },
    { id: 'g-005', nama: 'Bank Sampah', deskripsi: 'Pengelolaan sampah digital', icon_key: 'recycle', is_main: 0 },
    { id: 'g-006', nama: 'Pengajian', deskripsi: 'Majelis taklim warga', icon_key: 'moon', is_main: 0 },
    { id: 'g-007', nama: 'Jual Beli', deskripsi: 'Lapak jual beli warga', icon_key: 'coins', is_main: 0 },
  ]
  for (const g of groups) {
    await db.execute({
      sql: 'INSERT INTO chat_groups (id, nama, deskripsi, icon_key, is_main) VALUES (?,?,?,?,?)',
      args: [g.id, g.nama, g.deskripsi, g.icon_key, g.is_main],
    })
    // Auto-add all residents to main group
    if (g.is_main) {
      for (const r of residents.filter((r) => r.account_status === 'Aktif')) {
        await db.execute({
          sql: 'INSERT INTO chat_group_members (group_id, resident_id) VALUES (?,?)',
          args: [g.id, r.id],
        })
      }
    }
  }

  // Sample group messages
  await db.execute({
    sql: 'INSERT INTO chat_messages (id, group_id, sender_id, isi, created_at) VALUES (?,?,?,?, unixepoch() - 3600)',
    args: ['m-001', 'g-001', 'u-pengelola', 'Selamat pagi warga. Jangan lupa kerja bakti besok pukul 07.00 di taman tengah.'],
  })
  await db.execute({
    sql: 'INSERT INTO chat_messages (id, group_id, sender_id, isi, created_at) VALUES (?,?,?,?, unixepoch() - 1800)',
    args: ['m-002', 'g-001', 'u-rizki', 'Siap pak, karang taruna hadir!'],
  })
  await db.execute({
    sql: 'INSERT INTO chat_messages (id, group_id, sender_id, isi, created_at) VALUES (?,?,?,?, unixepoch() - 900)',
    args: ['m-003', 'g-001', 'u-ahmad', 'Hadir juga, saya bawa peralatan kebun.'],
  })

  // Private messages between Ahmad and Sari (so private chat list shows up)
  await db.execute({
    sql: 'INSERT INTO chat_messages (id, sender_id, recipient_id, isi, created_at) VALUES (?,?,?,?, unixepoch() - 7200)',
    args: ['m-p1', 'u-ahmad', 'u-sari', 'Bu, nasi uduknya masih ada?'],
  })
  await db.execute({
    sql: 'INSERT INTO chat_messages (id, sender_id, recipient_id, isi, created_at) VALUES (?,?,?,?, unixepoch() - 6900)',
    args: ['m-p2', 'u-sari', 'u-ahmad', 'Masih pak, mau berapa porsi?'],
  })
  await db.execute({
    sql: 'INSERT INTO chat_messages (id, sender_id, recipient_id, isi, created_at) VALUES (?,?,?,?, unixepoch() - 14400)',
    args: ['m-p3', 'u-ahmad', 'u-eko', 'Mas Eko, AC saya kurang dingin nih.'],
  })
  await db.execute({
    sql: 'INSERT INTO chat_messages (id, sender_id, recipient_id, isi, created_at) VALUES (?,?,?,?, unixepoch() - 14000)',
    args: ['m-p4', 'u-eko', 'u-ahmad', 'Nanti sore saya ke unit ya pak.'],
  })

  // ----- Feed posts -----
  await db.execute({
    sql: 'INSERT INTO feed_posts (id, author_id, kategori, isi, gambar, created_at) VALUES (?,?,?,?,?, unixepoch() - 7200)',
    args: ['f-001', 'u-rizki', 'Aktivitas Warga', 'Terima kasih untuk semua yang ikut kerja bakti minggu lalu! Lingkungan jadi jauh lebih bersih.', 'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?w=600&q=80'],
  })
  await db.execute({
    sql: 'INSERT INTO feed_posts (id, author_id, kategori, isi, gambar, created_at) VALUES (?,?,?,?,?, unixepoch() - 18000)',
    args: ['f-002', 'u-tini', 'Jual Beli', 'Dijual sepeda anak masih bagus, jarang dipakai. Harga nego untuk warga.', 'https://images.unsplash.com/photo-1532330393533-443990a51d10?w=600&q=80'],
  })
  await db.execute({
    sql: 'INSERT INTO feed_posts (id, author_id, kategori, isi, created_at) VALUES (?,?,?,?, unixepoch() - 86400)',
    args: ['f-003', 'u-hendra', 'Kehilangan', 'Kehilangan kunci motor di area parkir Blok B sekitar jam 4 sore. Gantungan warna merah.'],
  })
  await db.execute({
    sql: 'INSERT INTO feed_posts (id, author_id, kategori, isi, created_at) VALUES (?,?,?,?, unixepoch() - 172800)',
    args: ['f-004', 'u-sari', 'Lowongan Kerja', 'Warung saya butuh 1 orang untuk bantu jaga sore hari. Diutamakan warga KSTP.'],
  })

  // ----- Skills -----
  const skills = [
    { id: 's-001', resident: 'u-eko', kategori: 'Teknisi AC', deskripsi: 'Servis, cuci, dan isi freon AC. Garansi pengerjaan 1 bulan.' },
    { id: 's-002', resident: 'u-sari', kategori: 'Catering', deskripsi: 'Catering harian, nasi kotak, dan tumpeng untuk acara.' },
    { id: 's-003', resident: 'u-rizki', kategori: 'Programmer', deskripsi: 'Pembuatan website dan aplikasi untuk UMKM warga.' },
    { id: 's-004', resident: 'u-hendra', kategori: 'Tukang Bangunan', deskripsi: 'Renovasi, pasang keramik, cat. Berpengalaman 15 tahun.' },
  ]
  for (const s of skills) {
    await db.execute({
      sql: 'INSERT INTO skill_providers (id, resident_id, kategori, deskripsi) VALUES (?,?,?,?)',
      args: [s.id, s.resident, s.kategori, s.deskripsi],
    })
  }
  // Reviews
  await db.execute({ sql: 'INSERT INTO skill_reviews (id, provider_id, reviewer_id, rating, komentar) VALUES (?,?,?,?,?)', args: [newId('sr'), 's-001', 'u-ahmad', 5, 'Kerjanya rapi dan tepat waktu.'] })
  await db.execute({ sql: 'INSERT INTO skill_reviews (id, provider_id, reviewer_id, rating, komentar) VALUES (?,?,?,?,?)', args: [newId('sr'), 's-001', 'u-tini', 5, 'AC jadi dingin maksimal lagi.'] })
  await db.execute({ sql: 'INSERT INTO skill_reviews (id, provider_id, reviewer_id, rating, komentar) VALUES (?,?,?,?,?)', args: [newId('sr'), 's-002', 'u-rizki', 5, 'Catering Bu Sari rasanya juara.'] })
  await db.execute({ sql: 'INSERT INTO skill_reviews (id, provider_id, reviewer_id, rating, komentar) VALUES (?,?,?,?,?)', args: [newId('sr'), 's-003', 'u-pengelola', 5, 'Mas Rizki bantu bikin website pengumuman warga.'] })
  // Portfolio
  await db.execute({ sql: 'INSERT INTO skill_portfolios (id, provider_id, url) VALUES (?,?,?)', args: [newId('sp'), 's-001', 'https://images.unsplash.com/photo-1631545806609-c2b69bbe8d4f?w=400&q=80'] })
  await db.execute({ sql: 'INSERT INTO skill_portfolios (id, provider_id, url) VALUES (?,?,?)', args: [newId('sp'), 's-002', 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=400&q=80'] })
  await db.execute({ sql: 'INSERT INTO skill_portfolios (id, provider_id, url) VALUES (?,?,?)', args: [newId('sp'), 's-004', 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=400&q=80'] })

  // ----- Events -----
  const events = [
    { id: 'e-001', nama: 'Kerja Bakti Bulanan', tipe: 'Kerja Bakti', deskripsi: 'Gotong royong membersihkan lingkungan dan taman bersama.', tanggal: '2026-06-07', waktu: '07.00 - 10.00 WIB', lokasi: 'Taman Tengah KSTP', kuota: 100, foto: 'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?w=600&q=80' },
    { id: 'e-002', nama: 'Bazar Ramah Warga', tipe: 'Bazar', deskripsi: 'Bazar UMKM warga dengan aneka produk makanan dan kerajinan.', tanggal: '2026-06-15', waktu: '08.00 - 16.00 WIB', lokasi: 'Lapangan Utama', kuota: 50, foto: 'https://images.unsplash.com/photo-1556740738-b6a63e27c4df?w=600&q=80' },
    { id: 'e-003', nama: 'Senam Sehat Bersama', tipe: 'Senam', deskripsi: 'Senam pagi untuk semua usia. Dipandu instruktur profesional.', tanggal: '2026-06-08', waktu: '06.00 - 07.30 WIB', lokasi: 'Lapangan Utama', kuota: 80, foto: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=600&q=80' },
    { id: 'e-004', nama: 'Lomba 17 Agustus', tipe: 'Perlombaan', deskripsi: 'Aneka lomba seru untuk anak dan dewasa.', tanggal: '2026-08-17', waktu: '08.00 - 12.00 WIB', lokasi: 'Lapangan Utama', kuota: 200, foto: 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=600&q=80' },
  ]
  for (const e of events) {
    await db.execute({
      sql: 'INSERT INTO events (id, nama, tipe, deskripsi, tanggal, waktu, lokasi, kuota, foto) VALUES (?,?,?,?,?,?,?,?,?)',
      args: [e.id, e.nama, e.tipe, e.deskripsi, e.tanggal, e.waktu, e.lokasi, e.kuota, e.foto],
    })
  }
  // Sample RSVPs
  await db.execute({ sql: 'INSERT INTO event_rsvp (event_id, resident_id) VALUES (?,?)', args: ['e-002', 'u-ahmad'] })
  await db.execute({ sql: 'INSERT INTO event_rsvp (event_id, resident_id) VALUES (?,?)', args: ['e-001', 'u-rizki'] })
  await db.execute({ sql: 'INSERT INTO event_rsvp (event_id, resident_id) VALUES (?,?)', args: ['e-001', 'u-tini'] })

  // ----- Facilities -----
  const facilities = [
    { id: 'fac-001', nama: 'Aula Serbaguna', tipe: 'Aula', deskripsi: 'Ruang besar untuk acara, rapat, dan resepsi.', kapasitas: 150, foto: 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=600&q=80', jam_operasional: '08.00 - 22.00' },
    { id: 'fac-002', nama: 'Lapangan Olahraga', tipe: 'Lapangan', deskripsi: 'Lapangan multifungsi untuk futsal, voli, dan badminton.', kapasitas: 50, foto: 'https://images.unsplash.com/photo-1577223625816-7546f13df25d?w=600&q=80', jam_operasional: '06.00 - 21.00' },
    { id: 'fac-003', nama: 'Gazebo Taman', tipe: 'Gazebo', deskripsi: 'Tempat santai dan kumpul kecil di area taman.', kapasitas: 15, foto: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&q=80', jam_operasional: '06.00 - 22.00' },
    { id: 'fac-004', nama: 'Ruang Serbaguna Lt. 1', tipe: 'Ruang Serbaguna', deskripsi: 'Ruang untuk pertemuan kecil, kelas, dan kegiatan PKK.', kapasitas: 40, foto: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=600&q=80', jam_operasional: '08.00 - 20.00' },
  ]
  for (const f of facilities) {
    await db.execute({
      sql: 'INSERT INTO facilities (id, nama, tipe, deskripsi, kapasitas, foto, jam_operasional) VALUES (?,?,?,?,?,?,?)',
      args: [f.id, f.nama, f.tipe, f.deskripsi, f.kapasitas, f.foto, f.jam_operasional],
    })
  }
  // Sample bookings for ahmad
  await db.execute({
    sql: 'INSERT INTO bookings (id, facility_id, resident_id, tanggal, waktu, keperluan, status) VALUES (?,?,?,?,?,?,?)',
    args: ['b-001', 'fac-001', 'u-ahmad', '2026-06-20', '10.00 - 14.00', 'Acara arisan PKK', 'Approved'],
  })
  await db.execute({
    sql: 'INSERT INTO bookings (id, facility_id, resident_id, tanggal, waktu, keperluan, status) VALUES (?,?,?,?,?,?,?)',
    args: ['b-002', 'fac-003', 'u-ahmad', '2026-06-12', '16.00 - 18.00', 'Kumpul karang taruna', 'Pending'],
  })

  // ----- Votings -----
  await db.execute({
    sql: 'INSERT INTO votings (id, judul, tipe, deskripsi, status, berakhir) VALUES (?,?,?,?,?,?)',
    args: ['v-001', 'Pemilihan Ketua RW Periode 2026-2029', 'Pemilihan Ketua', 'Pilih calon ketua RW untuk periode tiga tahun ke depan.', 'Berlangsung', '2026-06-10'],
  })
  await db.execute({ sql: 'INSERT INTO voting_options (id, voting_id, label) VALUES (?,?,?)', args: ['vo-1', 'v-001', 'Bapak Suryanto (A-02-01)'] })
  await db.execute({ sql: 'INSERT INTO voting_options (id, voting_id, label) VALUES (?,?,?)', args: ['vo-2', 'v-001', 'Bapak Hendra (B-02-01)'] })
  await db.execute({ sql: 'INSERT INTO voting_options (id, voting_id, label) VALUES (?,?,?)', args: ['vo-3', 'v-001', 'Ibu Maryam (C-01-05)'] })

  await db.execute({
    sql: 'INSERT INTO votings (id, judul, tipe, deskripsi, status, berakhir) VALUES (?,?,?,?,?,?)',
    args: ['v-002', 'Persetujuan Pembangunan Taman Bermain Anak', 'Persetujuan Program', 'Setujukah Anda dengan rencana pembangunan taman bermain?', 'Berlangsung', '2026-06-08'],
  })
  await db.execute({ sql: 'INSERT INTO voting_options (id, voting_id, label) VALUES (?,?,?)', args: ['vo-4', 'v-002', 'Setuju'] })
  await db.execute({ sql: 'INSERT INTO voting_options (id, voting_id, label) VALUES (?,?,?)', args: ['vo-5', 'v-002', 'Tidak Setuju'] })

  // Some sample ballots
  await db.execute({ sql: 'INSERT INTO voting_ballots (id, voting_id, option_id, unit_key, resident_id) VALUES (?,?,?,?,?)', args: [newId('vb'), 'v-001', 'vo-2', 'A-03-05', 'u-sari'] })
  await db.execute({ sql: 'INSERT INTO voting_ballots (id, voting_id, option_id, unit_key, resident_id) VALUES (?,?,?,?,?)', args: [newId('vb'), 'v-001', 'vo-1', 'C-04-01', 'u-eko'] })
  await db.execute({ sql: 'INSERT INTO voting_ballots (id, voting_id, option_id, unit_key, resident_id) VALUES (?,?,?,?,?)', args: [newId('vb'), 'v-002', 'vo-4', 'B-03-07', 'u-tini'] })

  // ----- Crowdfunding campaigns -----
  const campaigns = [
    { id: 'cf-001', judul: 'Renovasi Musholla KSTP', tipe: 'Renovasi', deskripsi: 'Perbaikan atap dan perluasan area wudhu musholla warga.', foto: 'https://images.unsplash.com/photo-1564769662533-4f00a87b4056?w=600&q=80', target: 25000000, berakhir: '2026-06-30' },
    { id: 'cf-002', judul: 'Bantuan untuk Keluarga Pak Sutrisno', tipe: 'Bantuan Sosial', deskripsi: 'Penggalangan dana untuk keluarga warga yang sedang berduka.', foto: 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=600&q=80', target: 10000000, berakhir: '2026-06-15' },
    { id: 'cf-003', judul: 'Perbaikan Lampu Jalan Lingkungan', tipe: 'Perbaikan Fasilitas', deskripsi: 'Penggantian lampu jalan yang rusak di sepanjang area parkir.', foto: 'https://images.unsplash.com/photo-1542332213-9b5a5a3fad35?w=600&q=80', target: 5000000, berakhir: '2026-07-05' },
  ]
  for (const c of campaigns) {
    await db.execute({
      sql: 'INSERT INTO campaigns (id, judul, tipe, deskripsi, foto, target, berakhir) VALUES (?,?,?,?,?,?,?)',
      args: [c.id, c.judul, c.tipe, c.deskripsi, c.foto, c.target, c.berakhir],
    })
  }
  // Sample donations
  await db.execute({ sql: 'INSERT INTO donations (id, campaign_id, donor_id, jumlah, metode) VALUES (?,?,?,?,?)', args: [newId('dn'), 'cf-001', 'u-ahmad', 500000, 'transfer'] })
  await db.execute({ sql: 'INSERT INTO donations (id, campaign_id, donor_id, jumlah, metode) VALUES (?,?,?,?,?)', args: [newId('dn'), 'cf-001', 'u-sari', 200000, 'qris'] })
  await db.execute({ sql: 'INSERT INTO donations (id, campaign_id, donor_id, jumlah, metode) VALUES (?,?,?,?,?)', args: [newId('dn'), 'cf-002', 'u-rizki', 100000, 'transfer'] })
  await db.execute({ sql: 'INSERT INTO donations (id, campaign_id, donor_id, jumlah, metode) VALUES (?,?,?,?,?)', args: [newId('dn'), 'cf-002', 'u-tini', 250000, 'qris'] })

  // ----- Waste records for Ahmad -----
  const waste = [
    { tanggal: '2026-05-31', jenis: 'Plastik', berat: 3.5, nilai: 10500, tipe: 'setor' },
    { tanggal: '2026-05-24', jenis: 'Kertas', berat: 5.0, nilai: 7500, tipe: 'setor' },
    { tanggal: '2026-05-20', jenis: 'Penarikan saldo', berat: 0, nilai: 15000, tipe: 'tarik' },
    { tanggal: '2026-05-17', jenis: 'Logam', berat: 2.0, nilai: 12000, tipe: 'setor' },
    { tanggal: '2026-05-10', jenis: 'Botol Kaca', berat: 4.2, nilai: 6300, tipe: 'setor' },
  ]
  for (const w of waste) {
    await db.execute({
      sql: 'INSERT INTO waste_records (id, resident_id, tanggal, jenis, berat, nilai, tipe) VALUES (?,?,?,?,?,?,?)',
      args: [newId('w'), 'u-ahmad', w.tanggal, w.jenis, w.berat, w.nilai, w.tipe],
    })
  }

  // ----- Visitors -----
  await db.execute({
    sql: 'INSERT INTO visitors (id, host_id, nama, keperluan, tanggal, jam, pin, status) VALUES (?,?,?,?,?,?,?,?)',
    args: ['vis-001', 'u-ahmad', 'Budi Santoso', 'Mengantar paket', '2026-06-01', '14.30', '4821', 'Di Dalam'],
  })
  await db.execute({
    sql: 'INSERT INTO visitors (id, host_id, nama, keperluan, tanggal, jam, pin, status) VALUES (?,?,?,?,?,?,?,?)',
    args: ['vis-002', 'u-rizki', 'Teknisi Internet', 'Pemasangan WiFi', '2026-06-02', '09.00', '1567', 'Menunggu'],
  })
  await db.execute({
    sql: 'INSERT INTO visitors (id, host_id, nama, keperluan, tanggal, jam, pin, status) VALUES (?,?,?,?,?,?,?,?)',
    args: ['vis-003', 'u-ahmad', 'Keluarga Bu Wati', 'Kunjungan keluarga', '2026-06-01', '11.00', '7390', 'Selesai'],
  })

  // ----- Panic alerts -----
  await db.execute({
    sql: "INSERT INTO panic_alerts (id, resident_id, jenis, status, waktu) VALUES (?,?,?, 'Ditangani', unixepoch() - 7200)",
    args: ['pa-001', 'u-tini', 'Medis'],
  })

  // ----- UMKM Ads -----
  const ads = [
    { id: 'ad-001', owner: 'u-rizki', nama: 'Warung Pak Rizki', jenis: 'Produk', banner: 'https://images.unsplash.com/photo-1604719312566-8912e9227c6a?w=800&q=80', promo: 'Diskon 10% pembelian sembako di atas Rp50.000' },
    { id: 'ad-002', owner: 'u-sari', nama: 'Dapur Bu Sari', jenis: 'Produk', banner: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=800&q=80', promo: 'Promo kue kering, beli 2 toples gratis 1 kecil' },
    { id: 'ad-003', owner: 'u-eko', nama: 'Mas Eko Teknik', jenis: 'Jasa', banner: 'https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=800&q=80', promo: 'Cuci AC hanya Rp65.000 khusus warga KSTP' },
  ]
  for (const a of ads) {
    await db.execute({
      sql: 'INSERT INTO umkm_ads (id, owner_id, nama, jenis, banner, promo, views, clicks, chats) VALUES (?,?,?,?,?,?,?,?,?)',
      args: [a.id, a.owner, a.nama, a.jenis, a.banner, a.promo, Math.floor(Math.random() * 1000) + 500, Math.floor(Math.random() * 200) + 50, Math.floor(Math.random() * 50) + 20],
    })
  }

  console.log('✓ Seed complete.')
  console.log('\nDemo accounts (password: password123):')
  console.log('  Warga             — phone 08123456789  (Ahmad Fauzi, B-04-12)')
  console.log('  Pengelola         — phone 08111111111  (Budi Hartono)')
  console.log('  Petugas Keuangan  — phone 08222222222  (Rina Andriani)')
  console.log('  Petugas Keamanan  — phone 08333333333  (Pak Joko Satpam)')
  console.log('  Super Admin       — phone 08444444444  (Super Admin)')
  console.log('\nUnactivated demo code: KSTP-NEWUSR  (Warga Baru, C-02-08)')
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
