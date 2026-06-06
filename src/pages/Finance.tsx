import { useState } from 'react'
import {
  ArrowUpRight,
  ArrowDownRight,
  Download,
  TrendingUp,
  Wallet,
  Plus,
  Trash2,
  Banknote,
} from 'lucide-react'
import { useApiQuery } from '@/hooks/useApi'
import { api, ApiError } from '@/lib/api'
import { useApp } from '@/context/AppContext'
import { formatRupiah, formatDate } from '@/lib/format'
import type { Transaction } from '@/types'
import type { ExpenseCategory } from '@/types/settings'
import PageHeader from '@/components/ui/PageHeader'
import Modal from '@/components/ui/Modal'

type Period = 'Bulanan' | 'Tahunan' | 'Semua'

interface FinanceData {
  transactions: Transaction[]
  summary: { pemasukan: number; pengeluaran: number; saldo: number; saldoKas: number }
  period: Period
}

export default function Finance() {
  const { user } = useApp()
  const canManage = user && ['super_admin', 'pengelola', 'petugas_keuangan'].includes(user.role)
  const [period, setPeriod] = useState<Period>('Bulanan')

  const { data, loading, refetch } = useApiQuery<FinanceData>(
    () => api.get<FinanceData>('/finance/transactions', { query: { period } }),
    [period]
  )
  const { data: categories } = useApiQuery<ExpenseCategory[]>(() =>
    api.get<ExpenseCategory[]>('/settings/expense-categories')
  )

  // Expense modal
  const [showExpense, setShowExpense] = useState(false)
  const [expForm, setExpForm] = useState({
    tanggal: new Date().toISOString().slice(0, 10),
    keterangan: '',
    kategori: '',
    jumlah: 0,
  })
  const [expError, setExpError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const submitExpense = async () => {
    setExpError('')
    if (!expForm.keterangan.trim() || !expForm.kategori || expForm.jumlah <= 0) {
      setExpError('Lengkapi keterangan, kategori, dan nominal.')
      return
    }
    setSubmitting(true)
    try {
      await api.post('/finance/expenses', expForm)
      setShowExpense(false)
      setExpForm({ tanggal: new Date().toISOString().slice(0, 10), keterangan: '', kategori: '', jumlah: 0 })
      await refetch()
    } catch (err) {
      setExpError(err instanceof ApiError ? err.message : 'Gagal mencatat pengeluaran.')
    } finally {
      setSubmitting(false)
    }
  }

  const deleteTx = async (id: string) => {
    if (!confirm('Hapus transaksi ini? Saldo kas akan disesuaikan.')) return
    await api.delete(`/finance/transactions/${id}`)
    await refetch()
  }

  const handleExport = () => {
    if (!data) return
    const rows = data.transactions
      .map((t) => [t.tanggal, t.keterangan.replace(/,/g, ' '), t.kategori, t.tipe, t.jumlah].join(','))
      .join('\n')
    const csv = `Tanggal,Keterangan,Kategori,Tipe,Jumlah\n${rows}`
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `laporan-keuangan-${period}-${Date.now()}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (loading || !data) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-hairline border-t-primary" />
      </div>
    )
  }

  return (
    <div>
      <PageHeader
        title="Transparansi Keuangan"
        subtitle="Laporan pemasukan, pengeluaran, dan saldo kas warga"
        action={
          canManage ? (
            <button onClick={() => { setShowExpense(true); setExpError('') }} className="btn-primary px-base">
              <Plus className="h-4 w-4" /><span className="hidden sm:inline">Penggunaan Kas</span>
            </button>
          ) : (
            <button onClick={handleExport} className="btn-secondary hidden px-base sm:inline-flex">
              <Download className="h-4 w-4" /> Export
            </button>
          )
        }
      />

      {/* All-time cash balance highlight */}
      <div className="card-float mb-lg flex items-center justify-between p-base">
        <div>
          <p className="text-body-sm text-muted">Saldo Kas Saat Ini (akumulasi)</p>
          <p className="mt-xxs text-rating-display leading-none text-ink" style={{ fontSize: '40px' }}>
            {formatRupiah(data.summary.saldoKas)}
          </p>
        </div>
        <div className="hidden h-14 w-14 items-center justify-center rounded-full bg-surface-soft sm:flex">
          <Banknote className="h-7 w-7 text-primary" />
        </div>
      </div>

      <div className="mb-lg flex gap-sm">
        {(['Bulanan', 'Tahunan', 'Semua'] as Period[]).map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`rounded-full border px-base py-sm text-button-sm font-medium transition-colors ${
              period === p ? 'border-ink bg-ink text-white' : 'border-hairline bg-canvas text-ink hover:border-ink'
            }`}
          >
            {p}
          </button>
        ))}
      </div>

      <div className="mb-lg grid grid-cols-1 gap-base sm:grid-cols-3">
        <SummaryCard label="Pemasukan (periode)" value={data.summary.pemasukan} icon={ArrowUpRight} tone="success" />
        <SummaryCard label="Pengeluaran (periode)" value={data.summary.pengeluaran} icon={ArrowDownRight} tone="danger" />
        <SummaryCard label="Selisih (periode)" value={data.summary.saldo} icon={Wallet} tone="ink" />
      </div>

      <div className="mb-lg flex gap-sm sm:hidden">
        <button onClick={handleExport} className="btn-secondary flex-1">
          <Download className="h-4 w-4" /> Export CSV
        </button>
      </div>

      <h2 className="mb-md flex items-center gap-sm text-title-md text-ink">
        <TrendingUp className="h-5 w-5" /> Riwayat Transaksi
        <span className="ml-auto text-body-sm font-normal text-muted">
          {period === 'Bulanan' ? 'Bulan ini' : period === 'Tahunan' ? 'Tahun ini' : 'Semua'}
        </span>
      </h2>
      <div className="card divide-y divide-hairline-soft">
        {data.transactions.length === 0 && (
          <p className="px-base py-lg text-center text-body-sm text-muted">
            Tidak ada transaksi pada periode ini.
          </p>
        )}
        {data.transactions.map((t) => (
          <div key={t.id} className="flex items-center gap-md px-base py-md">
            <div
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                t.tipe === 'pemasukan' ? 'bg-success-soft' : 'bg-primary-disabled'
              }`}
            >
              {t.tipe === 'pemasukan' ? (
                <ArrowUpRight className="h-5 w-5 text-success" />
              ) : (
                <ArrowDownRight className="h-5 w-5 text-primary-error" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-body-md text-ink">{t.keterangan}</p>
              <p className="text-caption-sm text-muted">{t.kategori} · {formatDate(t.tanggal)}</p>
            </div>
            <span
              className={`shrink-0 text-title-sm font-semibold ${
                t.tipe === 'pemasukan' ? 'text-success' : 'text-primary-error'
              }`}
            >
              {t.tipe === 'pemasukan' ? '+' : '−'}{formatRupiah(t.jumlah)}
            </span>
            {canManage && (
              <button onClick={() => deleteTx(t.id)} aria-label="Hapus transaksi" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted hover:bg-surface-soft hover:text-primary-error">
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Expense (penggunaan kas) modal */}
      <Modal
        open={showExpense}
        onClose={() => setShowExpense(false)}
        title="Catat Penggunaan Kas"
        footer={
          <button onClick={submitExpense} disabled={submitting} className="btn-primary w-full">
            {submitting ? 'Menyimpan…' : 'Catat Pengeluaran'}
          </button>
        }
      >
        <div className="space-y-base">
          <div className="rounded-md bg-surface-soft p-base">
            <p className="text-caption-sm text-muted">Saldo kas tersedia</p>
            <p className="text-title-md text-ink">{formatRupiah(data.summary.saldoKas)}</p>
          </div>
          <div>
            <label className="field-label">Tanggal</label>
            <input type="date" value={expForm.tanggal} onChange={(e) => setExpForm({ ...expForm, tanggal: e.target.value })} className="field-input" />
          </div>
          <div>
            <label className="field-label">Keterangan</label>
            <input value={expForm.keterangan} onChange={(e) => setExpForm({ ...expForm, keterangan: e.target.value })} className="field-input" placeholder="Contoh: Beli alat kebersihan" />
          </div>
          <div>
            <label className="field-label">Kategori</label>
            <select value={expForm.kategori} onChange={(e) => setExpForm({ ...expForm, kategori: e.target.value })} className="field-input">
              <option value="">— Pilih kategori —</option>
              {(categories ?? []).map((c) => (
                <option key={c.id} value={c.nama}>{c.nama}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="field-label">Jumlah (Rp)</label>
            <input type="number" value={expForm.jumlah || ''} onChange={(e) => setExpForm({ ...expForm, jumlah: Number(e.target.value) })} className="field-input" />
            {expForm.jumlah > 0 && <p className="mt-xxs text-caption-sm text-muted">{formatRupiah(expForm.jumlah)}</p>}
          </div>
          {expError && <p className="text-body-sm text-primary-error">{expError}</p>}
        </div>
      </Modal>
    </div>
  )
}

function SummaryCard({
  label, value, icon: Icon, tone,
}: {
  label: string; value: number; icon: typeof Wallet; tone: 'success' | 'danger' | 'ink'
}) {
  const toneClasses = {
    success: 'bg-success-soft text-success',
    danger: 'bg-primary-disabled text-primary-error',
    ink: 'bg-surface-strong text-ink',
  }[tone]

  return (
    <div className="card p-base">
      <div className="flex items-center justify-between">
        <p className="text-body-sm text-muted">{label}</p>
        <div className={`flex h-8 w-8 items-center justify-center rounded-full ${toneClasses}`}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <p className="mt-sm text-display-sm text-ink">{formatRupiah(value)}</p>
    </div>
  )
}
