import { useState } from 'react'
import { Wallet, CreditCard, Tags, Check, Plus, Trash2, Power } from 'lucide-react'
import { useApiQuery } from '@/hooks/useApi'
import { api, ApiError } from '@/lib/api'
import { formatRupiah } from '@/lib/format'
import type { DuesSetting, ExpenseCategory, PaymentSettings } from '@/types/settings'
import PageHeader from '@/components/ui/PageHeader'

type Tab = 'iuran' | 'pembayaran' | 'kas'

export default function Settings() {
  const [tab, setTab] = useState<Tab>('iuran')

  return (
    <div>
      <PageHeader
        title="Pengaturan"
        subtitle="Konfigurasi iuran, pembayaran, dan kategori kas"
      />

      <div className="mb-lg flex gap-sm overflow-x-auto no-scrollbar">
        <TabBtn active={tab === 'iuran'} onClick={() => setTab('iuran')} icon={Wallet} label="Iuran" />
        <TabBtn active={tab === 'pembayaran'} onClick={() => setTab('pembayaran')} icon={CreditCard} label="Pembayaran" />
        <TabBtn active={tab === 'kas'} onClick={() => setTab('kas')} icon={Tags} label="Kategori Kas" />
      </div>

      {tab === 'iuran' && <DuesSettingsPanel />}
      {tab === 'pembayaran' && <PaymentSettingsPanel />}
      {tab === 'kas' && <ExpenseCategoryPanel />}
    </div>
  )
}

function TabBtn({ active, onClick, icon: Icon, label }: { active: boolean; onClick: () => void; icon: typeof Wallet; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`flex shrink-0 items-center gap-sm rounded-full border px-base py-sm text-button-sm font-medium transition-colors ${
        active ? 'border-ink bg-ink text-white' : 'border-hairline bg-canvas text-ink hover:border-ink'
      }`}
    >
      <Icon className="h-4 w-4" /> {label}
    </button>
  )
}

// ---- Iuran ----
function DuesSettingsPanel() {
  const { data, refetch } = useApiQuery<DuesSetting[]>(() => api.get<DuesSetting[]>('/settings/dues'))
  const [savingJenis, setSavingJenis] = useState<string | null>(null)
  const [drafts, setDrafts] = useState<Record<string, { defaultAmount: number; dueDay: number }>>({})

  const items = data ?? []

  const getDraft = (s: DuesSetting) => drafts[s.jenis] ?? { defaultAmount: s.defaultAmount, dueDay: s.dueDay }

  const toggle = async (s: DuesSetting) => {
    setSavingJenis(s.jenis)
    try {
      await api.patch(`/settings/dues/${encodeURIComponent(s.jenis)}`, { enabled: !s.enabled })
      await refetch()
    } finally {
      setSavingJenis(null)
    }
  }

  const save = async (s: DuesSetting) => {
    const d = getDraft(s)
    setSavingJenis(s.jenis)
    try {
      await api.patch(`/settings/dues/${encodeURIComponent(s.jenis)}`, {
        defaultAmount: d.defaultAmount,
        dueDay: d.dueDay,
      })
      setDrafts((prev) => { const n = { ...prev }; delete n[s.jenis]; return n })
      await refetch()
    } finally {
      setSavingJenis(null)
    }
  }

  return (
    <div className="space-y-base">
      <p className="text-body-sm text-muted">
        Aktifkan/nonaktifkan jenis iuran, atur nominal default dan tanggal jatuh
        tempo. Iuran yang nonaktif tidak bisa di-generate massal.
      </p>
      {items.map((s) => {
        const d = getDraft(s)
        const dirty = drafts[s.jenis] !== undefined
        return (
          <div key={s.jenis} className={`card p-base ${!s.enabled ? 'opacity-70' : ''}`}>
            <div className="flex items-start justify-between gap-base">
              <div>
                <div className="flex items-center gap-sm">
                  <h3 className="text-title-md text-ink">{s.jenis}</h3>
                  <span className={`chip ${s.enabled ? 'bg-success-soft text-success' : 'bg-surface-strong text-muted'}`}>
                    {s.enabled ? 'Aktif' : 'Nonaktif'}
                  </span>
                </div>
                <p className="mt-xxs text-body-sm text-muted">{s.deskripsi}</p>
              </div>
              <button
                onClick={() => toggle(s)}
                disabled={savingJenis === s.jenis}
                className={`flex items-center gap-xs rounded-full border px-md py-sm text-button-sm font-medium transition-colors ${
                  s.enabled ? 'border-hairline text-primary-error hover:bg-surface-soft' : 'border-ink bg-ink text-white'
                }`}
              >
                <Power className="h-4 w-4" />
                {s.enabled ? 'Nonaktifkan' : 'Aktifkan'}
              </button>
            </div>

            <div className="mt-base grid grid-cols-1 gap-base sm:grid-cols-2">
              <div>
                <label className="field-label">Nominal Default</label>
                <input
                  type="number"
                  value={d.defaultAmount}
                  onChange={(e) => setDrafts((prev) => ({ ...prev, [s.jenis]: { ...d, defaultAmount: Number(e.target.value) } }))}
                  className="field-input"
                />
                <p className="mt-xxs text-caption-sm text-muted">{formatRupiah(d.defaultAmount)}</p>
              </div>
              <div>
                <label className="field-label">Tanggal Jatuh Tempo (1-28)</label>
                <input
                  type="number"
                  min={1}
                  max={28}
                  value={d.dueDay}
                  onChange={(e) => setDrafts((prev) => ({ ...prev, [s.jenis]: { ...d, dueDay: Number(e.target.value) } }))}
                  className="field-input"
                />
                <p className="mt-xxs text-caption-sm text-muted">Setiap tanggal {d.dueDay}</p>
              </div>
            </div>

            {dirty && (
              <button onClick={() => save(s)} disabled={savingJenis === s.jenis} className="btn-primary mt-base w-full">
                <Check className="h-4 w-4" /> Simpan Perubahan
              </button>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ---- Pembayaran ----
function PaymentSettingsPanel() {
  const { data, refetch } = useApiQuery<PaymentSettings>(() => api.get<PaymentSettings>('/settings/payment'))
  const [form, setForm] = useState<PaymentSettings | null>(null)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  const current = form ?? data ?? {
    bankName: '', bankAccountNumber: '', bankAccountHolder: '', qrisImageUrl: '', paymentNote: '',
  }

  const update = (patch: Partial<PaymentSettings>) => setForm({ ...current, ...patch })

  const save = async () => {
    setError('')
    try {
      await api.patch('/settings/payment', current)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
      await refetch()
      setForm(null)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Gagal menyimpan.')
    }
  }

  return (
    <div className="space-y-base">
      <p className="text-body-sm text-muted">
        Rekening dan QRIS ini yang akan ditampilkan ke warga saat membayar iuran,
        donasi, dan pesanan marketplace.
      </p>
      <div className="card space-y-base p-base">
        <div>
          <label className="field-label">Nama Bank</label>
          <input value={current.bankName} onChange={(e) => update({ bankName: e.target.value })} className="field-input" placeholder="Bank BCA" />
        </div>
        <div className="grid grid-cols-1 gap-base sm:grid-cols-2">
          <div>
            <label className="field-label">Nomor Rekening</label>
            <input value={current.bankAccountNumber} onChange={(e) => update({ bankAccountNumber: e.target.value })} className="field-input" placeholder="1234567890" />
          </div>
          <div>
            <label className="field-label">Atas Nama</label>
            <input value={current.bankAccountHolder} onChange={(e) => update({ bankAccountHolder: e.target.value })} className="field-input" placeholder="Kas KSTP Cakung" />
          </div>
        </div>
        <div>
          <label className="field-label">URL Gambar QRIS (opsional)</label>
          <input value={current.qrisImageUrl} onChange={(e) => update({ qrisImageUrl: e.target.value })} className="field-input" placeholder="https://..." />
          <p className="mt-xxs text-caption-sm text-muted">
            Kosongkan untuk memakai QRIS dinamis (di-generate otomatis dari nominal).
          </p>
        </div>
        <div>
          <label className="field-label">Catatan Pembayaran</label>
          <textarea value={current.paymentNote} onChange={(e) => update({ paymentNote: e.target.value })} rows={2} className="field-input resize-none py-md" />
        </div>
        {error && <p className="text-body-sm text-primary-error">{error}</p>}
        <button onClick={save} className="btn-primary w-full">
          {saved ? (<><Check className="h-4 w-4" /> Tersimpan</>) : 'Simpan Konfigurasi'}
        </button>
      </div>

      {/* Preview */}
      {current.bankAccountNumber && (
        <div className="card p-base">
          <p className="text-caption-sm text-muted">Pratinjau yang dilihat warga</p>
          <div className="mt-sm rounded-md bg-surface-soft p-base">
            <p className="text-caption-sm text-muted">{current.bankName}</p>
            <p className="text-title-md text-ink">a.n. {current.bankAccountHolder}</p>
            <p className="mt-xs text-display-md tracking-wider text-ink">{current.bankAccountNumber}</p>
          </div>
        </div>
      )}
    </div>
  )
}

// ---- Kategori Kas ----
function ExpenseCategoryPanel() {
  const { data, refetch } = useApiQuery<ExpenseCategory[]>(() => api.get<ExpenseCategory[]>('/settings/expense-categories'))
  const [nama, setNama] = useState('')
  const [error, setError] = useState('')

  const add = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!nama.trim()) return
    try {
      await api.post('/settings/expense-categories', { nama: nama.trim() })
      setNama('')
      await refetch()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Gagal menambah.')
    }
  }

  const remove = async (id: string) => {
    await api.delete(`/settings/expense-categories/${id}`)
    await refetch()
  }

  return (
    <div className="space-y-base">
      <p className="text-body-sm text-muted">
        Kategori untuk pencatatan penggunaan kas (pengeluaran) di Transparansi Keuangan.
      </p>
      <form onSubmit={add} className="flex gap-sm">
        <input value={nama} onChange={(e) => setNama(e.target.value)} className="field-input flex-1" placeholder="Nama kategori baru" />
        <button type="submit" className="btn-primary px-base"><Plus className="h-4 w-4" /> Tambah</button>
      </form>
      {error && <p className="text-body-sm text-primary-error">{error}</p>}

      <div className="card divide-y divide-hairline-soft">
        {(data ?? []).map((c) => (
          <div key={c.id} className="flex items-center justify-between px-base py-md">
            <span className="text-body-md text-ink">{c.nama}</span>
            <button onClick={() => remove(c.id)} aria-label="Hapus kategori" className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-surface-soft hover:text-primary-error">
              <Trash2 className="h-4 w-4 text-muted" />
            </button>
          </div>
        ))}
        {(data ?? []).length === 0 && (
          <p className="px-base py-lg text-center text-body-sm text-muted">Belum ada kategori.</p>
        )}
      </div>
    </div>
  )
}
