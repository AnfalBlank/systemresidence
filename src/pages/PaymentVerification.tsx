import { useState } from 'react'
import { Check, X, ReceiptText, Clock, Plus } from 'lucide-react'
import { useApiQuery } from '@/hooks/useApi'
import { api, ApiError } from '@/lib/api'
import { formatRupiah, formatDate } from '@/lib/format'
import type { Dues, DuesStatus, DuesType } from '@/types'
import PageHeader from '@/components/ui/PageHeader'
import StatusChip from '@/components/ui/StatusChip'
import Modal from '@/components/ui/Modal'

interface AdminDues extends Dues {
  residentName: string
  residentUnit: string
}

const duesTypes: DuesType[] = ['IPL', 'Kebersihan', 'Keamanan', 'Dana Sosial']

function toneFor(status: DuesStatus) {
  return status === 'Lunas' ? 'success' : status === 'Menunggu Verifikasi' ? 'warning' : 'danger'
}

export default function PaymentVerification() {
  const { data, refetch } = useApiQuery<AdminDues[]>(() => api.get<AdminDues[]>('/dues/all'))
  const [filter, setFilter] = useState<'Menunggu Verifikasi' | 'Semua'>('Menunggu Verifikasi')
  const [filterJenis, setFilterJenis] = useState<DuesType | 'Semua'>('Semua')
  const [filterBlok, setFilterBlok] = useState<string>('Semua')
  const [processing, setProcessing] = useState<string | null>(null)
  const [showGenerate, setShowGenerate] = useState(false)
  const [genForm, setGenForm] = useState({
    jenis: 'IPL' as DuesType, periode: '', jumlah: 0, jatuhTempo: '',
  })
  const [genResult, setGenResult] = useState('')
  const [genError, setGenError] = useState('')

  const dues = data ?? []
  const blokOf = (unit: string) => unit.split('-')[0]?.trim() || unit
  const bloks = Array.from(new Set(dues.map((d) => blokOf(d.residentUnit)))).sort()
  const list = dues.filter(
    (d) =>
      (filter === 'Semua' || d.status === filter) &&
      (filterJenis === 'Semua' || d.jenis === filterJenis) &&
      (filterBlok === 'Semua' || blokOf(d.residentUnit) === filterBlok)
  )
  const pendingCount = dues.filter((d) => d.status === 'Menunggu Verifikasi').length

  const verify = async (id: string) => {
    setProcessing(id)
    try {
      await api.post(`/dues/${id}/verify`)
      await refetch()
    } finally {
      setProcessing(null)
    }
  }

  const reject = async (id: string) => {
    setProcessing(id)
    try {
      await api.post(`/dues/${id}/reject`)
      await refetch()
    } finally {
      setProcessing(null)
    }
  }

  const generateBulk = async () => {
    setGenError('')
    setGenResult('')
    if (!genForm.periode.trim() || genForm.jumlah <= 0 || !genForm.jatuhTempo) {
      setGenError('Semua field wajib diisi.')
      return
    }
    try {
      const res = await api.post<{ created: number; total: number }>('/dues/bulk', genForm)
      setGenResult(`${res.created} tagihan dibuat dari ${res.total} warga (sisanya sudah punya tagihan serupa).`)
      setGenForm({ jenis: 'IPL', periode: '', jumlah: 0, jatuhTempo: '' })
      await refetch()
    } catch (err) {
      setGenError(err instanceof ApiError ? err.message : 'Gagal membuat tagihan.')
    }
  }

  const generateFromSettings = async () => {
    setGenError('')
    setGenResult('')
    if (!genForm.periode.trim() || !genForm.jatuhTempo) {
      setGenError('Isi Periode dan Tanggal acuan terlebih dahulu.')
      return
    }
    try {
      const res = await api.post<{ summary: { jenis: string; created: number }[]; residents: number }>(
        '/dues/generate-from-settings',
        { periode: genForm.periode, dueDate: genForm.jatuhTempo }
      )
      const lines = res.summary.map((s) => `${s.jenis}: ${s.created}`).join(', ')
      setGenResult(`Tagihan dibuat untuk ${res.residents} warga aktif — ${lines}.`)
      await refetch()
    } catch (err) {
      setGenError(err instanceof ApiError ? err.message : 'Gagal generate dari pengaturan.')
    }
  }

  return (
    <div>
      <PageHeader
        title="Verifikasi Pembayaran"
        subtitle={`${pendingCount} pembayaran menunggu verifikasi`}
        action={
          <button onClick={() => setShowGenerate(true)} className="btn-primary px-base">
            <Plus className="h-4 w-4" /><span className="hidden sm:inline">Generate Iuran</span>
          </button>
        }
      />

      <div className="mb-lg flex flex-wrap items-center gap-sm">
        {(['Menunggu Verifikasi', 'Semua'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-full border px-base py-sm text-button-sm font-medium transition-colors ${filter === f ? 'border-ink bg-ink text-white' : 'border-hairline bg-canvas text-ink hover:border-ink'}`}
          >
            {f}
          </button>
        ))}
        <select value={filterJenis} onChange={(e) => setFilterJenis(e.target.value as DuesType | 'Semua')} className="h-10 rounded-full border border-hairline bg-canvas px-base text-button-sm text-ink">
          <option value="Semua">Semua Jenis</option>
          {duesTypes.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        <select value={filterBlok} onChange={(e) => setFilterBlok(e.target.value)} className="h-10 rounded-full border border-hairline bg-canvas px-base text-button-sm text-ink">
          <option value="Semua">Semua Blok</option>
          {bloks.map((b) => <option key={b} value={b}>Blok {b}</option>)}
        </select>
      </div>

      <div className="space-y-base">
        {list.map((d) => (
          <div key={d.id} className="card p-base">
            <div className="flex items-start justify-between gap-base">
              <div>
                <h3 className="text-title-md text-ink">{d.residentName}</h3>
                <p className="text-body-sm text-muted">
                  Unit {d.residentUnit} · {d.jenis} {d.periode}
                </p>
                <p className="mt-xs flex items-center gap-xs text-caption-sm text-muted">
                  <Clock className="h-3.5 w-3.5" /> Jatuh tempo {formatDate(d.jatuhTempo)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-title-md text-ink">{formatRupiah(d.jumlah)}</p>
                <div className="mt-xs">
                  <StatusChip label={d.status} tone={toneFor(d.status)} />
                </div>
              </div>
            </div>
            {d.status === 'Menunggu Verifikasi' && (
              <div className="mt-md flex gap-sm border-t border-hairline-soft pt-md">
                <button
                  onClick={() => verify(d.id)}
                  disabled={processing === d.id}
                  className="btn-primary flex-1"
                >
                  <Check className="h-4 w-4" /> Verifikasi (Lunas)
                </button>
                <button
                  onClick={() => reject(d.id)}
                  disabled={processing === d.id}
                  className="btn-secondary flex-1"
                >
                  <X className="h-4 w-4" /> Tolak
                </button>
              </div>
            )}
          </div>
        ))}
        {list.length === 0 && (
          <div className="py-section text-center">
            <ReceiptText className="mx-auto h-10 w-10 text-muted" />
            <p className="mt-sm text-body-md text-muted">
              {filter === 'Menunggu Verifikasi' ? 'Tidak ada pembayaran menunggu verifikasi' : 'Tidak ada data tagihan'}
            </p>
          </div>
        )}
      </div>

      {/* Generate dues modal */}
      <Modal
        open={showGenerate}
        onClose={() => { setShowGenerate(false); setGenResult(''); setGenError('') }}
        title="Generate Iuran Massal"
        footer={
          <div className="flex flex-col gap-sm">
            <button onClick={generateFromSettings} className="btn-primary w-full">
              Generate Semua Iuran Aktif (dari Pengaturan)
            </button>
            <button onClick={generateBulk} className="btn-secondary w-full">
              Generate Satu Jenis (manual di bawah)
            </button>
          </div>
        }
      >
        <div className="space-y-base">
          <p className="rounded-md bg-info-soft p-base text-body-sm text-body">
            <strong>Generate dari Pengaturan</strong> membuat tagihan untuk SEMUA
            jenis iuran yang aktif sekaligus, memakai nominal & tanggal jatuh
            tempo yang sudah dikonfigurasi. Cukup isi Periode + Tanggal acuan.
            Atur nominal di menu <strong>Pengaturan → Iuran</strong>.
          </p>
          <div>
            <label className="field-label">Periode</label>
            <input value={genForm.periode} onChange={(e) => setGenForm({ ...genForm, periode: e.target.value })} className="field-input" placeholder="Contoh: Juli 2026" />
          </div>
          <div>
            <label className="field-label">Tanggal Acuan (bulan & tahun)</label>
            <input type="date" value={genForm.jatuhTempo} onChange={(e) => setGenForm({ ...genForm, jatuhTempo: e.target.value })} className="field-input" />
            <p className="mt-xxs text-caption-sm text-muted">
              Tanggal hari akan mengikuti pengaturan jatuh tempo tiap iuran.
            </p>
          </div>

          {genResult && <p className="rounded-sm bg-success-soft p-md text-body-sm text-success">{genResult}</p>}
          {genError && <p className="text-body-sm text-primary-error">{genError}</p>}

          <details className="rounded-md border border-hairline-soft p-base">
            <summary className="cursor-pointer text-title-sm text-ink">Generate manual satu jenis</summary>
            <div className="mt-base space-y-base">
              <div>
                <label className="field-label">Jenis Iuran</label>
                <div className="grid grid-cols-2 gap-sm">
                  {duesTypes.map((t) => (
                    <button key={t} type="button" onClick={() => setGenForm({ ...genForm, jenis: t })} className={`rounded-sm border px-md py-md text-button-sm font-medium transition-colors ${genForm.jenis === t ? 'border-ink bg-ink text-white' : 'border-hairline text-ink'}`}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="field-label">Jumlah (Rp)</label>
                <input type="number" value={genForm.jumlah || ''} onChange={(e) => setGenForm({ ...genForm, jumlah: Number(e.target.value) })} className="field-input" />
              </div>
            </div>
          </details>
        </div>
      </Modal>
    </div>
  )
}
