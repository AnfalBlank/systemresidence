import { useState } from 'react'
import { Plus, Copy, Check, RefreshCw, Search, X } from 'lucide-react'
import { useApiQuery } from '@/hooks/useApi'
import { api, ApiError } from '@/lib/api'
import { unitToString } from '@/lib/format'
import type { Resident, ResidentStatus, Role } from '@/types'
import PageHeader from '@/components/ui/PageHeader'
import StatusChip from '@/components/ui/StatusChip'
import Modal from '@/components/ui/Modal'
import Avatar from '@/components/ui/Avatar'

const roles: { value: Role; label: string }[] = [
  { value: 'warga', label: 'Warga' },
  { value: 'pengelola', label: 'Pengelola' },
  { value: 'petugas_keuangan', label: 'Petugas Keuangan' },
  { value: 'petugas_keamanan', label: 'Petugas Keamanan' },
  { value: 'super_admin', label: 'Super Admin' },
]

export default function ResidentManagement() {
  const { data, refetch } = useApiQuery<Resident[]>(() => api.get<Resident[]>('/residents'))
  const [showCreate, setShowCreate] = useState(false)
  const [createdCode, setCreatedCode] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [query, setQuery] = useState('')
  const [form, setForm] = useState({
    nama: '', noHp: '', email: '',
    status: 'Pemilik' as ResidentStatus,
    blok: '', lantai: '', nomor: '',
    role: 'warga' as Role,
  })
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

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
      setCreatedCode(created.invitationCode ?? null)
      setForm({ nama: '', noHp: '', email: '', status: 'Pemilik', blok: '', lantai: '', nomor: '', role: 'warga' })
      setShowCreate(false)
      await refetch()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Gagal menambah warga.')
    } finally {
      setSubmitting(false)
    }
  }

  const regenerateCode = async (id: string) => {
    if (!confirm('Generate kode undangan baru? Kode lama akan tidak berlaku.')) return
    try {
      const res = await api.post<{ invitationCode: string }>(`/residents/${id}/regenerate-code`)
      setCreatedCode(res.invitationCode)
      await refetch()
    } catch (err) {
      console.error(err)
    }
  }

  const copyCode = (code: string) => {
    navigator.clipboard?.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div>
      <PageHeader
        title="Manajemen Warga"
        subtitle="Kelola data warga dan generate kode undangan"
        action={
          <button onClick={() => setShowCreate(true)} className="btn-primary px-base">
            <Plus className="h-4 w-4" /><span className="hidden sm:inline">Tambah Warga</span>
          </button>
        }
      />

      <div className="mb-lg flex items-center gap-sm rounded-full border border-hairline bg-canvas px-base">
        <Search className="h-5 w-5 text-muted" />
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Cari nama, unit, atau kode..." className="h-12 flex-1 bg-transparent text-body-md text-ink placeholder:text-muted-soft focus:outline-none" />
        {query && <button onClick={() => setQuery('')}><X className="h-4 w-4 text-muted" /></button>}
      </div>

      <div className="card divide-y divide-hairline-soft">
        {filtered.map((r) => (
          <div key={r.id} className="flex items-center gap-md px-base py-md">
            <Avatar name={r.nama} size="md" />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-sm">
                <p className="truncate text-title-sm text-ink">{r.nama}</p>
                <span className="rounded-full bg-surface-soft px-md py-xxs text-badge font-semibold text-ink">
                  {roles.find((x) => x.value === r.role)?.label ?? r.role}
                </span>
              </div>
              <p className="text-caption-sm text-muted">
                Unit {unitToString(r.unit)} · {r.status} · {r.noHp}
              </p>
              {r.invitationCode && r.accountStatus !== 'Aktif' && (
                <div className="mt-xxs flex items-center gap-xs">
                  <code className="rounded-sm bg-surface-soft px-xs py-xxs text-caption-sm font-semibold text-ink">{r.invitationCode}</code>
                  <button onClick={() => copyCode(r.invitationCode!)} className="text-caption-sm text-primary">
                    {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  </button>
                  <button onClick={() => regenerateCode(r.id)} className="text-caption-sm text-muted hover:text-ink" aria-label="Generate ulang">
                    <RefreshCw className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
            </div>
            <StatusChip
              label={r.accountStatus}
              tone={r.accountStatus === 'Aktif' ? 'success' : r.accountStatus === 'Belum Aktivasi' ? 'warning' : 'neutral'}
            />
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
            <label className="field-label">Status</label>
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

      {/* Show generated code modal */}
      <Modal
        open={!!createdCode}
        onClose={() => setCreatedCode(null)}
        title="Kode Undangan"
      >
        {createdCode && (
          <div className="text-center">
            <p className="text-body-sm text-muted">Kode undangan berhasil dibuat.</p>
            <p className="mt-base text-display-md tracking-wider text-ink">{createdCode}</p>
            <button
              onClick={() => copyCode(createdCode)}
              className="btn-secondary mt-base"
            >
              {copied ? <><Check className="h-4 w-4" /> Tersalin</> : <><Copy className="h-4 w-4" /> Salin Kode</>}
            </button>
            <p className="mt-base text-caption-sm text-muted">
              Bagikan kode ini ke warga via WhatsApp, SMS, atau cetak manual untuk aktivasi.
            </p>
          </div>
        )}
      </Modal>
    </div>
  )
}
