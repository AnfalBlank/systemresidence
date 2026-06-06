// Domain types for Sistem Informasi & Layanan Warga KSTP Cakung

export type Role =
  | 'super_admin'
  | 'pengelola'
  | 'petugas_keuangan'
  | 'petugas_keamanan'
  | 'warga'

export type ResidentStatus = 'Pemilik' | 'Penyewa' | 'Keluarga'

export type AccountStatus = 'Belum Aktivasi' | 'Aktif' | 'Nonaktif'

export interface Unit {
  blok: string // A, B, C
  lantai: string // 01, 02, 03
  nomor: string // 12
}

export interface Resident {
  id: string
  nama: string
  username?: string
  foto?: string
  noHp: string
  email?: string
  tanggalLahir?: string
  jenisKelamin?: 'Laki-laki' | 'Perempuan'
  unit: Unit
  status: ResidentStatus
  accountStatus: AccountStatus
  role: Role
  invitationCode?: string
}

export type AnnouncementCategory = 'Umum' | 'Penting' | 'Darurat'

export interface Announcement {
  id: string
  judul: string
  isi: string
  kategori: AnnouncementCategory
  tanggal: string
  penulis: string
}

export interface Obituary {
  id: string
  namaAlmarhum: string
  unit: string
  lokasiRumahDuka: string
  jadwalPemakaman: string
  tanggal: string
  catatan?: string
}

export type DuesType = 'IPL' | 'Kebersihan' | 'Keamanan' | 'Dana Sosial'
export type DuesStatus = 'Belum Bayar' | 'Menunggu Verifikasi' | 'Lunas'

export interface Dues {
  id: string
  jenis: DuesType
  periode: string // e.g. "Juni 2026"
  jumlah: number
  status: DuesStatus
  jatuhTempo: string
}

export type TransactionType = 'pemasukan' | 'pengeluaran'

export interface Transaction {
  id: string
  tanggal: string
  keterangan: string
  kategori: string
  tipe: TransactionType
  jumlah: number
}

export type OrderStatus =
  | 'Menunggu Pembayaran'
  | 'Diproses'
  | 'Dikirim'
  | 'Selesai'

export interface Product {
  id: string
  nama: string
  foto: string
  harga: number
  stok: number
  deskripsi: string
  penjual: string
  sellerId: string
  sellerNoHp?: string
  unitPenjual: string
  kategori: string
}

export type ComplaintCategory =
  | 'Kebersihan'
  | 'Keamanan'
  | 'Infrastruktur'
  | 'Fasilitas'
export type ComplaintStatus = 'Baru' | 'Diproses' | 'Selesai'

export interface Complaint {
  id: string
  kategori: ComplaintCategory
  judul: string
  deskripsi: string
  status: ComplaintStatus
  tanggal: string
  pelapor: string
  unit: string
  foto?: string
}

export type PanicType = 'Medis' | 'Kebakaran' | 'Keamanan'

export interface PanicAlert {
  id: string
  jenis: PanicType
  nama: string
  unit: string
  waktu: string
  status: 'Aktif' | 'Ditangani' | 'Selesai'
}

export interface ChatGroup {
  id: string
  nama: string
  deskripsi: string
  anggota: number
  lastMessage: string
  lastTime: string
  unread: number
  iconKey: string
  isMain?: boolean
}

export interface ChatMessage {
  id: string
  pengirim: string
  unit?: string
  isi: string
  waktu: string
  isMe: boolean
}

export interface PrivateChat {
  id: string
  nama: string
  unit: string
  foto?: string
  lastMessage: string
  lastTime: string
  unread: number
  online: boolean
}

// ----- Phase 2 domain types -----

export type FeedCategory =
  | 'Informasi'
  | 'Jual Beli'
  | 'Kehilangan'
  | 'Lowongan Kerja'
  | 'Aktivitas Warga'

export interface FeedPost {
  id: string
  penulis: string
  unit: string
  foto?: string
  kategori: FeedCategory
  isi: string
  gambar?: string
  waktu: string
  likes: number
  komentar: number
  liked: boolean
}

export interface SkillProvider {
  id: string
  residentId: string
  noHp?: string
  nama: string
  unit: string
  kategori: string
  deskripsi: string
  rating: number
  jumlahReview: number
  foto?: string
  portofolio: string[]
  available: boolean
}

export interface SkillReview {
  id: string
  penulis: string
  rating: number
  komentar: string
  tanggal: string
}

export type EventType =
  | 'Kerja Bakti'
  | 'Bazar'
  | 'Pengajian'
  | 'Senam'
  | 'Perlombaan'

export interface CommunityEvent {
  id: string
  nama: string
  tipe: EventType
  deskripsi: string
  tanggal: string
  waktu: string
  lokasi: string
  kuota: number
  terdaftar: number
  foto?: string
  rsvp: boolean
}

export type FacilityType =
  | 'Aula'
  | 'Lapangan'
  | 'Gazebo'
  | 'Ruang Serbaguna'

export type BookingStatus = 'Pending' | 'Approved' | 'Rejected' | 'Finished'

export interface Facility {
  id: string
  nama: string
  tipe: FacilityType
  deskripsi: string
  kapasitas: number
  foto: string
  jamOperasional: string
}

export interface Booking {
  id: string
  fasilitas: string
  tanggal: string
  waktu: string
  status: BookingStatus
  keperluan: string
}

export type VoteType =
  | 'Pemilihan Ketua'
  | 'Musyawarah'
  | 'Persetujuan Program'

export interface VoteOption {
  id: string
  label: string
  suara: number
}

export interface Voting {
  id: string
  judul: string
  tipe: VoteType
  deskripsi: string
  status: 'Berlangsung' | 'Selesai'
  berakhir: string
  totalSuara: number
  sudahMemilih: boolean
  opsi: VoteOption[]
}

export type CampaignType =
  | 'Renovasi'
  | 'Bantuan Sosial'
  | 'Perbaikan Fasilitas'

export interface Campaign {
  id: string
  judul: string
  tipe: CampaignType
  deskripsi: string
  foto: string
  target: number
  terkumpul: number
  donatur: number
  berakhir: string
}

export interface WasteRecord {
  id: string
  tanggal: string
  jenis: string
  berat: number
  nilai: number
  tipe: 'setor' | 'tarik'
}

export type VisitorStatus = 'Menunggu' | 'Di Dalam' | 'Selesai'

export interface Visitor {
  id: string
  nama: string
  keperluan: string
  tujuanUnit: string
  tanggal: string
  jam: string
  pin: string
  status: VisitorStatus
}

export interface UmkmAd {
  id: string
  nama: string
  jenis: 'Produk' | 'Jasa'
  banner: string
  promo: string
  pemilik: string
  ownerId: string
  ownerNoHp?: string
  unit: string
  views: number
  clicks: number
  chats: number
}
