import { useNavigate } from 'react-router-dom'
import {
  Phone,
  Mail,
  Home,
  BadgeCheck,
  LogOut,
  ChevronRight,
  Eye,
  EyeOff,
  Calendar,
  User,
} from 'lucide-react'
import { useState } from 'react'
import { useApp } from '@/context/AppContext'
import { api, ApiError } from '@/lib/api'
import { unitToString, formatDate } from '@/lib/format'
import Avatar from '@/components/ui/Avatar'
import StatusChip from '@/components/ui/StatusChip'
import PageHeader from '@/components/ui/PageHeader'
import QRDisplay from '@/components/ui/QRDisplay'
import Modal from '@/components/ui/Modal'

export default function Profile() {
  const { user, logout, refreshUser } = useApp()
  const navigate = useNavigate()
  const [showCard, setShowCard] = useState(false)
  const [showEdit, setShowEdit] = useState(false)
  const [showPwModal, setShowPwModal] = useState(false)
  const [pw, setPw] = useState('')
  const [pw2, setPw2] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [pwError, setPwError] = useState('')
  const [pwSuccess, setPwSuccess] = useState(false)
  const [editForm, setEditForm] = useState({
    nama: user?.nama ?? '',
    email: user?.email ?? '',
    tanggalLahir: user?.tanggalLahir ?? '',
    jenisKelamin: user?.jenisKelamin ?? 'Laki-laki' as 'Laki-laki' | 'Perempuan',
  })
  const [editError, setEditError] = useState('')
  const [editSuccess, setEditSuccess] = useState(false)

  if (!user) return null

  const qrValue = `KSTP:${user.id}:${unitToString(user.unit)}:${user.status}`

  const handleChangePw = async (e: React.FormEvent) => {
    e.preventDefault()
    setPwError('')
    if (pw.length < 6) { setPwError('Password minimal 6 karakter.'); return }
    if (pw !== pw2) { setPwError('Konfirmasi tidak cocok.'); return }
    try {
      await api.post('/auth/change-password', { newPassword: pw })
      setPwSuccess(true)
      setTimeout(() => { setShowPwModal(false); setPwSuccess(false); setPw(''); setPw2('') }, 1500)
    } catch (err) {
      setPwError(err instanceof ApiError ? err.message : 'Gagal mengubah password.')
    }
  }

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    setEditError('')
    try {
      await api.patch('/residents/me', {
        nama: editForm.nama || undefined,
        email: editForm.email || undefined,
        tanggalLahir: editForm.tanggalLahir || undefined,
        jenisKelamin: editForm.jenisKelamin || undefined,
      })
      await refreshUser()
      setEditSuccess(true)
      setTimeout(() => { setShowEdit(false); setEditSuccess(false) }, 1500)
    } catch (err) {
      setEditError(err instanceof ApiError ? err.message : 'Gagal menyimpan.')
    }
  }

  return (
    <div>
      <PageHeader title="Profil Saya" />

      <div className="card-float mb-lg overflow-hidden">
        <div className="bg-ink px-base py-lg text-white">
          <div className="flex items-center gap-base">
            <Avatar name={user.nama} src={user.foto} size="lg" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-display-sm">{user.nama}</p>
              <p className="text-body-sm text-white/80">Unit {unitToString(user.unit)}</p>
              <span className="mt-xs inline-flex items-center gap-xxs rounded-full bg-white/15 px-md py-xxs text-badge font-semibold">
                <BadgeCheck className="h-3.5 w-3.5" /> {user.status}
              </span>
            </div>
            <button onClick={() => setShowCard(true)} className="flex h-16 w-16 shrink-0 items-center justify-center rounded-md bg-white" aria-label="Tampilkan kartu warga digital">
              <QRDisplay value={qrValue} size={52} />
            </button>
          </div>
        </div>
        <div className="flex items-center justify-between px-base py-sm">
          <p className="text-caption-sm text-muted">Kartu Warga Digital · Tap QR untuk perbesar</p>
          <button onClick={() => setShowCard(true)} className="text-caption-sm text-primary">Lihat Kartu</button>
        </div>
      </div>

      <div className="card mb-lg divide-y divide-hairline-soft">
        <InfoRow icon={Phone} label="Nomor HP" value={user.noHp} />
        {user.email && <InfoRow icon={Mail} label="Email" value={user.email} />}
        <InfoRow icon={Home} label="Hunian" value={`Blok ${user.unit.blok} · Lantai ${user.unit.lantai} · No ${user.unit.nomor}`} />
        {user.tanggalLahir && <InfoRow icon={Calendar} label="Tanggal Lahir" value={formatDate(user.tanggalLahir)} />}
        {user.jenisKelamin && <InfoRow icon={User} label="Jenis Kelamin" value={user.jenisKelamin} />}
      </div>

      <div className="card mb-lg flex items-center justify-between p-base">
        <div>
          <p className="text-body-sm text-muted">Status Akun</p>
          <p className="text-title-sm text-ink">Akun aktif dan terverifikasi</p>
        </div>
        <StatusChip label={user.accountStatus} tone="success" />
      </div>

      <div className="card mb-lg divide-y divide-hairline-soft">
        <MenuRow label="Edit Profil" onClick={() => setShowEdit(true)} />
        <MenuRow label="Ubah Password" onClick={() => setShowPwModal(true)} />
      </div>

      <button onClick={() => { logout(); navigate('/login') }} className="btn-secondary w-full text-primary-error">
        <LogOut className="h-4 w-4" /> Keluar
      </button>

      <Modal open={showCard} onClose={() => setShowCard(false)} title="Kartu Warga Digital">
        <div className="flex flex-col items-center gap-base py-base text-center">
          <QRDisplay value={qrValue} size={220} label={user.nama} sublabel={`Unit ${unitToString(user.unit)} · ${user.status}`} />
          <div className="w-full rounded-md bg-surface-soft p-base text-left">
            <Row label="ID Warga" value={user.id} />
            <Row label="Unit" value={unitToString(user.unit)} />
            <Row label="Status" value={user.status} />
            <Row label="Akun" value={user.accountStatus} />
          </div>
          <p className="text-caption-sm text-muted">
            Gunakan kartu ini untuk absensi event, booking fasilitas, dan identifikasi warga.
          </p>
        </div>
      </Modal>

      <Modal
        open={showEdit}
        onClose={() => setShowEdit(false)}
        title="Edit Profil"
        footer={<button onClick={handleEdit} className="btn-primary w-full">Simpan</button>}
      >
        <form onSubmit={handleEdit} className="space-y-base">
          {editSuccess && <p className="rounded-sm bg-success-soft p-md text-body-sm text-success">Profil berhasil diperbarui.</p>}
          <div>
            <label className="field-label">Nama Lengkap</label>
            <input value={editForm.nama} onChange={(e) => setEditForm({ ...editForm, nama: e.target.value })} className="field-input" />
          </div>
          <div>
            <label className="field-label">Email</label>
            <input type="email" value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} className="field-input" />
          </div>
          <div>
            <label className="field-label">Tanggal Lahir</label>
            <input type="date" value={editForm.tanggalLahir} onChange={(e) => setEditForm({ ...editForm, tanggalLahir: e.target.value })} className="field-input" />
          </div>
          <div>
            <label className="field-label">Jenis Kelamin</label>
            <div className="grid grid-cols-2 gap-sm">
              {(['Laki-laki', 'Perempuan'] as const).map((g) => (
                <button key={g} type="button" onClick={() => setEditForm({ ...editForm, jenisKelamin: g })} className={`rounded-sm border px-md py-md text-button-sm font-medium transition-colors ${editForm.jenisKelamin === g ? 'border-ink bg-ink text-white' : 'border-hairline text-ink'}`}>
                  {g}
                </button>
              ))}
            </div>
          </div>
          {editError && <p className="text-body-sm text-primary-error">{editError}</p>}
        </form>
      </Modal>

      <Modal
        open={showPwModal}
        onClose={() => { setShowPwModal(false); setPwError(''); setPw(''); setPw2('') }}
        title="Ubah Password"
        footer={<button onClick={handleChangePw} className="btn-primary w-full">Simpan Password</button>}
      >
        <form onSubmit={handleChangePw} className="space-y-base">
          {pwSuccess && <p className="rounded-sm bg-success-soft p-md text-body-sm text-success">Password berhasil diubah.</p>}
          <div>
            <label htmlFor="pw-new" className="field-label">Password Baru</label>
            <div className="relative">
              <input id="pw-new" type={showPw ? 'text' : 'password'} value={pw} onChange={(e) => setPw(e.target.value)} className="field-input pr-xl" placeholder="Minimal 6 karakter" />
              <button type="button" onClick={() => setShowPw((v) => !v)} className="absolute right-md top-1/2 -translate-y-1/2 text-muted" aria-label={showPw ? 'Sembunyikan' : 'Tampilkan'}>
                {showPw ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>
          <div>
            <label htmlFor="pw-confirm" className="field-label">Konfirmasi Password</label>
            <input id="pw-confirm" type={showPw ? 'text' : 'password'} value={pw2} onChange={(e) => setPw2(e.target.value)} className="field-input" placeholder="Ulangi password baru" />
          </div>
          {pwError && <p className="text-body-sm text-primary-error">{pwError}</p>}
        </form>
      </Modal>
    </div>
  )
}

function InfoRow({ icon: Icon, label, value }: { icon: typeof Phone; label: string; value: string }) {
  return (
    <div className="flex items-center gap-md px-base py-md">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface-soft">
        <Icon className="h-5 w-5 text-muted" />
      </div>
      <div className="min-w-0">
        <p className="text-caption-sm text-muted">{label}</p>
        <p className="truncate text-body-md text-ink">{value}</p>
      </div>
    </div>
  )
}

function MenuRow({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex w-full items-center justify-between px-base py-md text-left transition-colors hover:bg-surface-soft">
      <span className="text-body-md text-ink">{label}</span>
      <ChevronRight className="h-5 w-5 text-muted" />
    </button>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-xs">
      <span className="text-body-sm text-muted">{label}</span>
      <span className="text-body-sm font-semibold text-ink">{value}</span>
    </div>
  )
}
