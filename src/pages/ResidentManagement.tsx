import { useState } from 'react'
import { Plus, Copy, Check, RefreshCw, Search, X, Pencil, Trash2 } from 'lucide-react'
import { useApiQuery } from '@/hooks/useApi'
import { api, ApiError } from '@/lib/api'
import { useApp } from '@/context/AppContext'
import { unitToString } from '@/lib/format'
import type { AccountStatus, Resident, ResidentStatus, Role } from '@/types'
import PageHeader from '@/components/ui/PageHeader'
import StatusChip from '@/components/ui/StatusChip'
import Modal from '@/components/ui/Modal'
import Avatar from '@/components/ui/Avatar'
import ConfirmDialog from '@/components/ui/ConfirmDialog'

const roles: { value: Role; label: string }[] = [
  { value: 'warga', label: 'Warga' },
  { value: 'pengelola', label: 'Pengelola' },
  { value: 'petugas_keuangan', label: 'Petugas Keuangan' },
  { value: 'petugas_keamanan', label: 'Petugas Keamanan' },
  { value: 'super_admin', label: 'Super Admin' },
]

const accountStatuses: AccountStatus[] = ['Belum Aktivasi', 'Aktif', 'Nonaktif']

const emptyForm = {
  nama: '', noHp: '', email: '',
  status: 'Pemilik' as ResidentStatus,
  blok: '', lantai: '', nomor: '',
  role: 'warga' as Role,
}

export default function ResidentManagement() {
  const { user } = useApp()
  const { data, refetch } = useApiQuery<Resident[]>(() => api.get<Resident[]>('/residents'))
  const [showCreate, setShowCreate] = useState(false)
  const [createdResident, setCreatedResident] = useState<Resident | null>(null)
  const [copied, setCopied] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [form, setForm] = useState(emptyForm)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Resident | null>(null)

  // Edit modal
  const [editTarget, setEditTarget] = useState<Resident | null>(null)
  const [editForm, setEditForm] = useState({
    nama: '', noHp: '', email: '', status: 'Pemilik' as ResidentStatus,
    role: 'warga' as Role, accountStatus: 'Aktif' as AccountStatus,
  })
  const [editError, setEditError] = useState('')

  const residents = data ?? []
  const filtered = residents.filter((r) => {
    const q = query.toLowerCase()
    return (
      r.nama.toLowerCase().includes(q) ||
      r.noHp.includes(q) ||
      unitToString(r.unit).toLowerCase().includes(q) ||
      (r.invitationCode ?? '').toLowerCase().includes(q)
    )
  })

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!form.nama.trim() || !form.noHp.trim() || !form.blok || !form.lantai || !form.nomor) {
      setError('Field wajib belum diisi.'); return
    }
    setSubmitting(true)
    try {
      const created = await api.post<Resident>('/residents', form)
      setCreatedResident(created)
      setForm(emptyForm)
      setShowCreate(false)
      await refetch()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Gagal menambah warga.')
    } finally {
      setSubmitting(false)
    }
  }

  const openEdit = (r: Resident) => {
    setEditTarget(r)
    setEditForm({
      nama: r.nama, noHp: r.noHp, email: r.email ?? '',
      status: r.status, role: r.role, accountStatus: r.accountStatus,
    })
    setEditError('')
  }

  const submitEdit = async () => {
    if (!editTarget) return
    setEditError('')
    try {
      await api.patch(`/residents/${editTarget.id}`, editForm)
      setEditTarget(null)
      await refetch()
    } catch (err) {
      setEditError(err instanceof ApiError ? err.message : 'Gagal menyimpan.')
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      await api.delete(`/residents/${deleteTarget.id}`)
      setDeleteTarget(null)
      await refetch()
    } catch (err) {
      alert(err instanceof ApiError ? err.message : 'Gagal menghapus.')
      setDeleteTarget(null)
    }
  }

  const regenerateCode = async (id: string) => {
    try {
      const res = await api.post<{ invitationCode: string }>(`/residents/${id}/regenerate-code`)
      // Find the resident from list and pretend it's a freshly-created result for the modal
      const r = (data ?? []).find((x) => x.id === id)
      if (r) setCreatedResident({ ...r, invitationCode: res.invitationCode })
      await refetch()
    } catch (err) {
      console.error(err)
    }
  }

  const copyText = (key: string, value: string) => {
    navigator.clipboard?.writeText(value)
    setCopied(key)
    setTimeout(() => setCopied(null), 1500)
  }

  return (
    <div>
      <PageHeader
        title="Manajemen Warga"
        subtitle="Kelola data warga, role, dan kode undangan"
        action={
          <button onClick={() => { setForm(emptyForm); setError(''); setShowCreate(true) }} className="btn-primary px-base">
            <Plus className="h-4 w-4" /><span className="hidden sm:inline">Tambah Warga</span>
          </button>
        }
      />

      <div className="mb-lg flex items-center gap-sm rounded-full border border-hairline bg-canvas px-base">
        <Search className="h-5 w-5 text-muted" />
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Cari nama, unit, atau kode..." className="h-12 flex-1 bg-transparent text-body-md text-ink placeholder:text-muted-soft focus:outline-none" />
        {query && <button onClick={() => setQuery('')}><X className="h-4 w-4 text-muted" /></button>}
      </div>

      <p className="mb-sm text-caption-sm text-muted">{filtered.length} warga</p>

      <div className="card divide-y divide-hairline-soft">
        {filtered.map((r) => (
          <div key={r.id} className="flex items-center gap-md px-base py-md">
            <Avatar name={r.nama} src={r.foto} size="md" />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-sm">
                <p className="truncate text-title-sm text-ink">{r.nama}</p>
                <span className="rounded-full bg-surface-soft px-md py-xxs text-badge font-semibold text-ink">
                  {roles.find((x) => x.value === r.role)?.label ?? r.role}
                </span>
              </div>
              <p className="text-caption-sm text-muted">
                Unit {unitToString(r.unit)} · {r.status} · {r.noHp}
              </p>
              {r.invitationCode && r.accountStatus !== 'Aktif' && (
                <div className="mt-xxs flex flex-wrap items-center gap-xs">
                  {r.username && (
                    <code className="rounded-sm bg-surface-soft px-xs py-xxs text-caption-sm font-semibold text-ink" title="Username">
                      {r.username}
                    </code>
                  )}
                  <code className="rounded-sm bg-surface-soft px-xs py-xxs text-caption-sm font-semibold text-ink" title="Kode undangan">
                    {r.invitationCode}
                  </code>
                  <button onClick={() => copyText(`code-${r.id}`, r.invitationCode!)} className="text-caption-sm text-primary" aria-label="Salin kode">
                    {copied === `code-${r.id}` ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  </button>
                  <button onClick={() => regenerateCode(r.id)} className="text-caption-sm text-muted hover:text-ink" aria-label="Generate ulang kode">
                    <RefreshCw className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
              {r.username && r.accountStatus === 'Aktif' && (
                <p className="mt-xxs text-caption-sm text-muted">
                  username: <span className="font-semibold text-ink">{r.username}</span>
                </p>
              )}
            </div>
            <div className="flex flex-col items-end gap-sm">
              <StatusChip
                label={r.accountStatus}
                tone={r.accountStatus === 'Aktif' ? 'success' : r.accountStatus === 'Belum Aktivasi' ? 'warning' : 'neutral'}
              />
              <div className="flex gap-xs">
                <button onClick={() => openEdit(r)} className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-surface-soft" aria-label="Edit warga">
                  <Pencil className="h-4 w-4 text-muted" />
                </button>
                {r.id !== user?.id && (
                  <button onClick={() => setDeleteTarget(r)} className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-surface-soft" aria-label="Hapus warga">
                    <Trash2 className="h-4 w-4 text-muted" />
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <p className="px-base py-lg text-center text-body-sm text-muted">Tidak ada warga ditemukan.</p>
        )}
      </div>

      {/* Create resident modal */}
      <Modal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        title="Tambah Warga Baru"
        footer={<button onClick={submit} disabled={submitting} className="btn-primary w-full">
          {submitting ? 'Menyimpan…' : 'Buat & Generate Kode'}
        </button>}
      >
        <form onSubmit={submit} className="space-y-base">
          <div>
            <label className="field-label">Nama Lengkap</label>
            <input value={form.nama} onChange={(e) => setForm({ ...form, nama: e.target.value })} className="field-input" />
          </div>
          <div>
            <label className="field-label">Nomor HP</label>
            <input value={form.noHp} onChange={(e) => setForm({ ...form, noHp: e.target.value })} className="field-input" placeholder="08..." />
          </div>
          <div>
            <label className="field-label">Email (opsional)</label>
            <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="field-input" />
          </div>
          <div className="grid grid-cols-3 gap-base">
            <div>
              <label className="field-label">Blok</label>
              <input value={form.blok} onChange={(e) => setForm({ ...form, blok: e.target.value.toUpperCase() })} className="field-input" placeholder="A" />
            </div>
            <div>
              <label className="field-label">Lantai</label>
              <input value={form.lantai} onChange={(e) => setForm({ ...form, lantai: e.target.value })} className="field-input" placeholder="03" />
            </div>
            <div>
              <label className="field-label">Nomor</label>
              <input value={form.nomor} onChange={(e) => setForm({ ...form, nomor: e.target.value })} className="field-input" placeholder="12" />
            </div>
          </div>
          <div>
            <label className="field-label">Status Penghuni</label>
            <div className="grid grid-cols-3 gap-sm">
              {(['Pemilik', 'Penyewa', 'Keluarga'] as ResidentStatus[]).map((s) => (
                <button key={s} type="button" onClick={() => setForm({ ...form, status: s })} className={`rounded-sm border px-md py-md text-button-sm font-medium transition-colors ${form.status === s ? 'border-ink bg-ink text-white' : 'border-hairline text-ink'}`}>
                  {s}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="field-label">Role</label>
            <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as Role })} className="field-input">
              {roles.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
          </div>
          {error && <p className="text-body-sm text-primary-error">{error}</p>}
        </form>
      </Modal>

      {/* Edit resident modal */}
      <Modal
        open={!!editTarget}
        onClose={() => setEditTarget(null)}
        title="Edit Warga"
        footer={<button onClick={submitEdit} className="btn-primary w-full">Simpan Perubahan</button>}
      >
        {editTarget && (
          <div className="space-y-base">
            <div className="rounded-md bg-surface-soft p-base">
              <p className="text-caption-sm text-muted">Unit (tidak dapat diubah)</p>
              <p className="text-title-sm text-ink">{unitToString(editTarget.unit)}</p>
            </div>
            <div>
              <label className="field-label">Nama Lengkap</label>
              <input value={editForm.nama} onChange={(e) => setEditForm({ ...editForm, nama: e.target.value })} className="field-input" />
            </div>
            <div>
              <label className="field-label">Nomor HP</label>
              <input value={editForm.noHp} onChange={(e) => setEditForm({ ...editForm, noHp: e.target.value })} className="field-input" />
            </div>
            <div>
              <label className="field-label">Email</label>
              <input type="email" value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} className="field-input" />
            </div>
            <div>
              <label className="field-label">Status Penghuni</label>
              <div className="grid grid-cols-3 gap-sm">
                {(['Pemilik', 'Penyewa', 'Keluarga'] as ResidentStatus[]).map((s) => (
                  <button key={s} type="button" onClick={() => setEditForm({ ...editForm, status: s })} className={`rounded-sm border px-md py-md text-button-sm font-medium transition-colors ${editForm.status === s ? 'border-ink bg-ink text-white' : 'border-hairline text-ink'}`}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="field-label">Role</label>
              <select value={editForm.role} onChange={(e) => setEditForm({ ...editForm, role: e.target.value as Role })} className="field-input">
                {roles.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
            </div>
            <div>
              <label className="field-label">Status Akun</label>
              <select value={editForm.accountStatus} onChange={(e) => setEditForm({ ...editForm, accountStatus: e.target.value as AccountStatus })} className="field-input">
                {accountStatuses.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            {editError && <p className="text-body-sm text-primary-error">{editError}</p>}
          </div>
        )}
      </Modal>

      {/* Show generated credentials modal */}
      <Modal open={!!createdResident} onClose={() => setCreatedResident(null)} title="Kredensial Akun Warga">
        {createdResident && (
          <div>
            <p className="rounded-md bg-success-soft p-base text-body-sm text-success">
              Akun <strong>{createdResident.nama}</strong> berhasil dibuat. Bagikan
              kode undangan di bawah ke warga via WhatsApp / SMS / cetak. Warga
              hanya perlu memasukkan kode + membuat password sendiri untuk login.
            </p>

            <div className="mt-base space-y-md">
              <CredRow
                label="Username (otomatis)"
                value={createdResident.username ?? '-'}
                copyKey="username"
                copied={copied === 'username'}
                onCopy={() => copyText('username', createdResident.username ?? '')}
              />
              <CredRow
                label="Kode Undangan"
                value={createdResident.invitationCode ?? '-'}
                copyKey="code"
                copied={copied === 'code'}
                onCopy={() => copyText('code', createdResident.invitationCode ?? '')}
                emphasize
              />
            </div>

            <div className="mt-base rounded-md bg-surface-soft p-base">
              <p className="text-caption-sm text-muted">Cara aktivasi untuk warga:</p>
              <ol className="mt-xs list-decimal pl-base text-body-sm text-body">
                <li>Buka aplikasi → klik <strong>Aktivasi Akun</strong></li>
                <li>Masukkan kode undangan di atas</li>
                <li>Konfirmasi data lalu buat password</li>
                <li>Setelah aktif, login dengan username, no HP, atau kode + password</li>
              </ol>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Hapus Warga?"
        message={deleteTarget ? `Data warga "${deleteTarget.nama}" (${unitToString(deleteTarget.unit)}) beserta seluruh aktivitasnya akan dihapus permanen.` : ''}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}

function CredRow({
  label, value, copied, onCopy, emphasize,
}: {
  label: string
  value: string
  copyKey: string
  copied: boolean
  onCopy: () => void
  emphasize?: boolean
}) {
  return (
    <div>
      <p className="text-caption-sm text-muted">{label}</p>
      <div className="mt-xxs flex items-center justify-between gap-sm rounded-sm bg-surface-soft px-md py-sm">
        <code className={`flex-1 truncate font-semibold text-ink ${emphasize ? 'text-display-md tracking-wider' : 'text-title-md'}`}>
          {value}
        </code>
        <button onClick={onCopy} className="flex items-center gap-xxs rounded-sm px-md py-xs text-button-sm font-medium text-primary hover:bg-canvas">
          {copied ? <><Check className="h-4 w-4" /> Tersalin</> : <><Copy className="h-4 w-4" /> Salin</>}
        </button>
      </div>
    </div>
  )
}
