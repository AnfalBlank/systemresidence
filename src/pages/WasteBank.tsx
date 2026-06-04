import { useState } from 'react'
import {
  Recycle,
  ArrowDownToLine,
  ArrowUpFromLine,
  Wallet,
  Check,
} from 'lucide-react'
import { useApiQuery } from '@/hooks/useApi'
import { api, ApiError } from '@/lib/api'
import { formatRupiah, formatDate } from '@/lib/format'
import type { WasteRecord } from '@/types'
import PageHeader from '@/components/ui/PageHeader'
import Modal from '@/components/ui/Modal'

const wasteTypes = ['Plastik', 'Kertas', 'Logam', 'Botol Kaca']
const pricePerKg: Record<string, number> = {
  Plastik: 3000, Kertas: 1500, Logam: 6000, 'Botol Kaca': 1500,
}

interface WasteData {
  records: WasteRecord[]
  balance: number
}

export default function WasteBank() {
  const { data, refetch } = useApiQuery<WasteData>(() => api.get<WasteData>('/waste-bank'))
  const [action, setAction] = useState<'setor' | 'tarik' | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const [jenisSetor, setJenisSetor] = useState('Plastik')
  const [beratSetor, setBeratSetor] = useState('')
  const [nominalTarik, setNominalTarik] = useState('')

  const records = data?.records ?? []
  const balance = data?.balance ?? 0
  const totalBerat = records.filter((r) => r.tipe === 'setor').reduce((s, r) => s + r.berat, 0)

  const handleSetor = async () => {
    const berat = parseFloat(beratSetor)
    if (!berat || berat <= 0) return
    setError('')
    setSubmitting(true)
    try {
      const res = await api.post<{ nilai: number }>('/waste-bank/setor', { jenis: jenisSetor, berat })
      setBeratSetor('')
      setAction(null)
      setSuccess(`Setoran ${jenisSetor} ${berat} kg berhasil. Saldo bertambah ${formatRupiah(res.nilai)}.`)
      setTimeout(() => setSuccess(null), 4000)
      await refetch()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Gagal mencatat setoran.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleTarik = async () => {
    const nominal = parseInt(nominalTarik)
    if (!nominal || nominal <= 0 || nominal > balance) return
    setError('')
    setSubmitting(true)
    try {
      await api.post('/waste-bank/tarik', { nominal })
      setNominalTarik('')
      setAction(null)
      setSuccess(`Penarikan ${formatRupiah(nominal)} berhasil diajukan.`)
      setTimeout(() => setSuccess(null), 4000)
      await refetch()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Gagal melakukan penarikan.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div>
      <PageHeader title="Bank Sampah Digital" subtitle="Tukar sampah jadi saldo bermanfaat" />

      {success && (
        <div className="mb-base flex items-center gap-sm rounded-md bg-success-soft p-base text-body-sm text-success">
          <Check className="h-5 w-5 shrink-0" />
          {success}
        </div>
      )}

      <div className="card-float mb-lg overflow-hidden">
        <div className="bg-ink p-base text-white">
          <p className="text-body-sm text-white/80">Saldo Bank Sampah</p>
          <p className="mt-xxs text-display-xl font-bold leading-none">{formatRupiah(balance)}</p>
          <p className="mt-sm text-body-sm text-white/80">Total {totalBerat.toFixed(1)} kg sampah disetor</p>
        </div>
        <div className="grid grid-cols-2 divide-x divide-hairline-soft">
          <button
            onClick={() => { setAction('setor'); setError('') }}
            className="flex items-center justify-center gap-sm py-base text-button-md font-medium text-ink transition-colors hover:bg-surface-soft"
          >
            <ArrowDownToLine className="h-5 w-5 text-success" /> Setor
          </button>
          <button
            onClick={() => { setAction('tarik'); setError('') }}
            className="flex items-center justify-center gap-sm py-base text-button-md font-medium text-ink transition-colors hover:bg-surface-soft"
          >
            <ArrowUpFromLine className="h-5 w-5 text-primary" /> Tarik
          </button>
        </div>
      </div>

      <h2 className="mb-md flex items-center gap-sm text-title-md text-ink">
        <Recycle className="h-5 w-5" /> Riwayat
      </h2>
      <div className="card divide-y divide-hairline-soft">
        {records.map((r) => (
          <div key={r.id} className="flex items-center gap-md px-base py-md">
            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${r.tipe === 'setor' ? 'bg-success-soft' : 'bg-primary-disabled'}`}>
              {r.tipe === 'setor' ? <ArrowDownToLine className="h-5 w-5 text-success" /> : <ArrowUpFromLine className="h-5 w-5 text-primary-error" />}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-body-md text-ink">{r.jenis}</p>
              <p className="text-caption-sm text-muted">
                {formatDate(r.tanggal)}{r.berat > 0 && ` · ${r.berat} kg`}
              </p>
            </div>
            <span className={`shrink-0 text-title-sm font-semibold ${r.tipe === 'setor' ? 'text-success' : 'text-primary-error'}`}>
              {r.tipe === 'setor' ? '+' : '−'}{formatRupiah(r.nilai)}
            </span>
          </div>
        ))}
        {records.length === 0 && (
          <p className="px-base py-lg text-center text-body-sm text-muted">Belum ada riwayat.</p>
        )}
      </div>

      <Modal
        open={action === 'setor'}
        onClose={() => setAction(null)}
        title="Setor Sampah"
        footer={
          <button onClick={handleSetor} disabled={!beratSetor || parseFloat(beratSetor) <= 0 || submitting} className="btn-primary w-full">
            {submitting ? 'Memproses…' : 'Ajukan Setoran'}
          </button>
        }
      >
        <div className="space-y-base">
          <div className="rounded-md bg-surface-soft p-base text-body-sm text-muted">
            Datang ke titik bank sampah saat jadwal setoran (Sabtu pagi). Petugas akan menimbang dan mencatat setoran Anda.
          </div>
          <div>
            <label className="field-label">Jenis Sampah</label>
            <div className="grid grid-cols-2 gap-sm">
              {wasteTypes.map((t) => (
                <button key={t} type="button" onClick={() => setJenisSetor(t)} className={`rounded-sm border px-md py-md text-button-sm font-medium transition-colors ${jenisSetor === t ? 'border-ink bg-ink text-white' : 'border-hairline text-ink'}`}>
                  {t}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label htmlFor="berat" className="field-label">Perkiraan Berat (kg)</label>
            <input id="berat" type="number" min="0.1" step="0.1" value={beratSetor} onChange={(e) => setBeratSetor(e.target.value)} className="field-input" placeholder="0.0" />
          </div>
          {beratSetor && parseFloat(beratSetor) > 0 && (
            <div className="rounded-sm bg-success-soft p-md text-body-sm text-success">
              Estimasi nilai: <strong>{formatRupiah(Math.round(parseFloat(beratSetor) * (pricePerKg[jenisSetor] ?? 2000)))}</strong>
            </div>
          )}
          {error && <p className="text-body-sm text-primary-error">{error}</p>}
        </div>
      </Modal>

      <Modal
        open={action === 'tarik'}
        onClose={() => setAction(null)}
        title="Tarik Saldo"
        footer={
          <button
            onClick={handleTarik}
            disabled={!nominalTarik || parseInt(nominalTarik) <= 0 || parseInt(nominalTarik) > balance || submitting}
            className="btn-primary w-full"
          >
            {submitting ? 'Memproses…' : 'Tarik Saldo'}
          </button>
        }
      >
        <div className="space-y-base">
          <div className="flex items-center gap-md rounded-md bg-surface-soft p-base">
            <Wallet className="h-6 w-6 text-ink" />
            <div>
              <p className="text-caption-sm text-muted">Saldo tersedia</p>
              <p className="text-title-md text-ink">{formatRupiah(balance)}</p>
            </div>
          </div>
          <div>
            <label htmlFor="nominal" className="field-label">Nominal Penarikan (Rp)</label>
            <input id="nominal" type="number" min="1000" value={nominalTarik} onChange={(e) => setNominalTarik(e.target.value)} className="field-input" placeholder="Masukkan nominal" />
            {nominalTarik && parseInt(nominalTarik) > balance && (
              <p className="mt-xs text-body-sm text-primary-error">Nominal melebihi saldo tersedia.</p>
            )}
          </div>
          {error && <p className="text-body-sm text-primary-error">{error}</p>}
          <p className="text-caption-sm text-muted">Saldo dapat ditarik tunai melalui petugas bank sampah.</p>
        </div>
      </Modal>
    </div>
  )
}
