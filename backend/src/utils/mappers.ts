// Convert libsql Row (which can have null/buffer/etc.) into typed JSON for the API.
// Field names follow the frontend's existing TypeScript types so we can keep the UI unchanged.

import type { Row } from '@libsql/client'

const s = (v: unknown): string => (v == null ? '' : String(v))
const sOpt = (v: unknown): string | undefined =>
  v == null ? undefined : String(v)
const n = (v: unknown): number => (v == null ? 0 : Number(v))

export function mapResident(row: Row): unknown {
  return {
    id: s(row.id),
    nama: s(row.nama),
    foto: sOpt(row.foto),
    noHp: s(row.no_hp),
    email: sOpt(row.email),
    tanggalLahir: sOpt(row.tanggal_lahir),
    jenisKelamin: sOpt(row.jenis_kelamin),
    unit: {
      blok: s(row.blok),
      lantai: s(row.lantai),
      nomor: s(row.nomor_unit),
    },
    status: s(row.status),
    accountStatus: s(row.account_status),
    role: s(row.role),
    invitationCode: sOpt(row.invitation_code),
  }
}

export function mapAnnouncement(row: Row) {
  return {
    id: s(row.id),
    judul: s(row.judul),
    isi: s(row.isi),
    kategori: s(row.kategori),
    tanggal: s(row.tanggal),
    penulis: s(row.penulis),
  }
}

export function mapObituary(row: Row) {
  return {
    id: s(row.id),
    namaAlmarhum: s(row.nama_almarhum),
    unit: s(row.unit),
    lokasiRumahDuka: s(row.lokasi_rumah_duka),
    jadwalPemakaman: s(row.jadwal_pemakaman),
    tanggal: s(row.tanggal),
    catatan: sOpt(row.catatan),
  }
}

export function mapDues(row: Row) {
  return {
    id: s(row.id),
    jenis: s(row.jenis),
    periode: s(row.periode),
    jumlah: n(row.jumlah),
    status: s(row.status),
    jatuhTempo: s(row.jatuh_tempo),
  }
}

export function mapTransaction(row: Row) {
  return {
    id: s(row.id),
    tanggal: s(row.tanggal),
    keterangan: s(row.keterangan),
    kategori: s(row.kategori),
    tipe: s(row.tipe),
    jumlah: n(row.jumlah),
  }
}

export function mapProduct(row: Row) {
  return {
    id: s(row.id),
    nama: s(row.nama),
    foto: s(row.foto),
    harga: n(row.harga),
    stok: n(row.stok),
    deskripsi: s(row.deskripsi),
    penjual: s(row.seller_nama),
    sellerId: s(row.seller_id),
    sellerNoHp: sOpt(row.seller_hp),
    unitPenjual: `${s(row.seller_blok)}-${s(row.seller_lantai)}-${s(row.seller_nomor)}`,
    kategori: s(row.kategori),
  }
}

export function mapComplaint(row: Row) {
  return {
    id: s(row.id),
    kategori: s(row.kategori),
    judul: s(row.judul),
    deskripsi: s(row.deskripsi),
    status: s(row.status),
    tanggal: s(row.tanggal),
    pelapor: s(row.pelapor),
    unit: `${s(row.blok)}-${s(row.lantai)}-${s(row.nomor_unit)}`,
    foto: sOpt(row.foto),
  }
}

export function mapPanicAlert(row: Row) {
  return {
    id: s(row.id),
    jenis: s(row.jenis),
    nama: s(row.nama),
    unit: `${s(row.blok)}-${s(row.lantai)}-${s(row.nomor_unit)}`,
    waktu: new Date(n(row.waktu) * 1000).toISOString(),
    status: s(row.status),
  }
}

export function mapEvent(row: Row) {
  return {
    id: s(row.id),
    nama: s(row.nama),
    tipe: s(row.tipe),
    deskripsi: s(row.deskripsi),
    tanggal: s(row.tanggal),
    waktu: s(row.waktu),
    lokasi: s(row.lokasi),
    kuota: n(row.kuota),
    terdaftar: n(row.terdaftar),
    foto: sOpt(row.foto),
    rsvp: Boolean(n(row.rsvp)),
  }
}

export function mapFacility(row: Row) {
  return {
    id: s(row.id),
    nama: s(row.nama),
    tipe: s(row.tipe),
    deskripsi: s(row.deskripsi),
    kapasitas: n(row.kapasitas),
    foto: s(row.foto),
    jamOperasional: s(row.jam_operasional),
  }
}

export function mapBooking(row: Row) {
  return {
    id: s(row.id),
    fasilitas: s(row.fasilitas),
    tanggal: s(row.tanggal),
    waktu: s(row.waktu),
    status: s(row.status),
    keperluan: s(row.keperluan),
  }
}

export function mapVisitor(row: Row) {
  return {
    id: s(row.id),
    nama: s(row.nama),
    keperluan: s(row.keperluan),
    tujuanUnit: `${s(row.blok)}-${s(row.lantai)}-${s(row.nomor_unit)}`,
    tanggal: s(row.tanggal),
    jam: s(row.jam),
    pin: s(row.pin),
    status: s(row.status),
  }
}

export function mapCampaign(row: Row) {
  return {
    id: s(row.id),
    judul: s(row.judul),
    tipe: s(row.tipe),
    deskripsi: s(row.deskripsi),
    foto: s(row.foto),
    target: n(row.target),
    terkumpul: n(row.terkumpul),
    donatur: n(row.donatur),
    berakhir: s(row.berakhir),
  }
}

export function mapWasteRecord(row: Row) {
  return {
    id: s(row.id),
    tanggal: s(row.tanggal),
    jenis: s(row.jenis),
    berat: Number(row.berat ?? 0),
    nilai: n(row.nilai),
    tipe: s(row.tipe),
  }
}

export function mapUmkmAd(row: Row) {
  return {
    id: s(row.id),
    nama: s(row.nama),
    jenis: s(row.jenis),
    banner: s(row.banner),
    promo: s(row.promo),
    pemilik: s(row.pemilik),
    ownerId: s(row.owner_id),
    ownerNoHp: sOpt(row.owner_hp),
    unit: `${s(row.blok)}-${s(row.lantai)}-${s(row.nomor_unit)}`,
    views: n(row.views),
    clicks: n(row.clicks),
    chats: n(row.chats),
  }
}

export function mapFeedPost(row: Row) {
  return {
    id: s(row.id),
    penulis: s(row.penulis),
    unit: `${s(row.blok)}-${s(row.lantai)}-${s(row.nomor_unit)}`,
    foto: sOpt(row.author_foto),
    kategori: s(row.kategori),
    isi: s(row.isi),
    gambar: sOpt(row.gambar),
    waktu: relativeTime(n(row.created_at)),
    likes: n(row.likes),
    komentar: n(row.komentar),
    liked: Boolean(n(row.liked)),
  }
}

export function mapChatGroup(row: Row) {
  return {
    id: s(row.id),
    nama: s(row.nama),
    deskripsi: s(row.deskripsi),
    anggota: n(row.anggota),
    lastMessage: s(row.last_message),
    lastTime: row.last_time
      ? relativeTime(n(row.last_time))
      : '',
    unread: 0,
    iconKey: s(row.icon_key),
    isMain: Boolean(n(row.is_main)),
  }
}

export function mapPrivateChat(row: Row) {
  return {
    id: s(row.peer_id),
    nama: s(row.nama),
    unit: `${s(row.blok)}-${s(row.lantai)}-${s(row.nomor_unit)}`,
    foto: sOpt(row.foto),
    lastMessage: s(row.last_message),
    lastTime: row.last_time ? relativeTime(n(row.last_time)) : '',
    unread: 0,
    online: false,
  }
}

export function mapMessage(row: Row, currentUserId: string) {
  return {
    id: s(row.id),
    pengirim: s(row.pengirim),
    unit: `${s(row.blok)}-${s(row.lantai)}-${s(row.nomor_unit)}`,
    isi: s(row.isi),
    waktu: new Date(n(row.created_at) * 1000).toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
    }),
    isMe: s(row.sender_id) === currentUserId,
  }
}

export function mapBroadcast(row: Row) {
  return {
    id: s(row.id),
    judul: s(row.judul),
    pesan: s(row.pesan),
    target: row.target_value
      ? `${s(row.target_type)}: ${s(row.target_value)}`
      : s(row.target_type),
    waktu: new Date(n(row.created_at) * 1000).toLocaleString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      day: 'numeric',
      month: 'short',
    }),
  }
}

export function mapVoting(row: Row) {
  return {
    id: s(row.id),
    judul: s(row.judul),
    tipe: s(row.tipe),
    deskripsi: s(row.deskripsi),
    status: s(row.status),
    berakhir: s(row.berakhir),
    totalSuara: n(row.total_suara),
    sudahMemilih: Boolean(n(row.sudah_memilih)),
    opsi: [], // populated separately
  }
}

export function mapVotingOption(row: Row) {
  return {
    id: s(row.id),
    label: s(row.label),
    suara: n(row.suara),
  }
}

export function mapSkillProvider(row: Row) {
  return {
    id: s(row.id),
    residentId: s(row.resident_id),
    noHp: sOpt(row.no_hp),
    nama: s(row.nama),
    unit: `${s(row.blok)}-${s(row.lantai)}-${s(row.nomor_unit)}`,
    kategori: s(row.kategori),
    deskripsi: s(row.deskripsi),
    rating: Number(row.rating ?? 0),
    jumlahReview: n(row.jumlah_review),
    foto: sOpt(row.foto),
    portofolio: row.portofolio
      ? String(row.portofolio).split('|').filter(Boolean)
      : [],
    available: Boolean(n(row.available)),
  }
}

function relativeTime(epochSeconds: number): string {
  if (!epochSeconds) return ''
  const now = Math.floor(Date.now() / 1000)
  const diff = now - epochSeconds
  if (diff < 60) return 'Baru saja'
  if (diff < 3600) return `${Math.floor(diff / 60)} menit lalu`
  if (diff < 86400) return `${Math.floor(diff / 3600)} jam lalu`
  if (diff < 7 * 86400) return `${Math.floor(diff / 86400)} hari lalu`
  return new Date(epochSeconds * 1000).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
  })
}
