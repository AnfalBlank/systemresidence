import { useState } from 'react'
import {
  ArrowUpRight,
  ArrowDownRight,
  Download,
  TrendingUp,
  Wallet,
} from 'lucide-react'
import { useApiQuery } from '@/hooks/useApi'
import { api } from '@/lib/api'
import { formatRupiah, formatDate } from '@/lib/format'
import type { Transaction } from '@/types'
import PageHeader from '@/components/ui/PageHeader'

type Period = 'Bulanan' | 'Tahunan'

interface FinanceData {
  transactions: Transaction[]
  summary: { pemasukan: number; pengeluaran: number; saldo: number }
  period: Period
}

export default function Finance() {
  const [period, setPeriod] = useState<Period>('Bulanan')

  const { data, loading } = useApiQuery<FinanceData>(
    () => api.get<FinanceData>('/finance/transactions', { query: { period } }),
    [period]
  )

  const handleExport = (format: 'PDF' | 'Excel') => {
    if (!data) return
    // Frontend-only export: build a CSV/HTML and trigger download.
    const rows = data.transactions
      .map((t) => [
        t.tanggal,
        t.keterangan.replace(/,/g, ' '),
        t.kategori,
        t.tipe,
        t.jumlah,
      ].join(','))
      .join('\n')
    const csv = `Tanggal,Keterangan,Kategori,Tipe,Jumlah\n${rows}`
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `laporan-keuangan-${period}-${Date.now()}.${format === 'Excel' ? 'csv' : 'csv'}`
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
          <button onClick={() => handleExport('Excel')} className="btn-secondary hidden px-base sm:inline-flex">
            <Download className="h-4 w-4" /> Export
          </button>
        }
      />

      <div className="mb-lg flex gap-sm">
        {(['Bulanan', 'Tahunan'] as Period[]).map((p) => (
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
        <SummaryCard label="Pemasukan" value={data.summary.pemasukan} icon={ArrowUpRight} tone="success" />
        <SummaryCard label="Pengeluaran" value={data.summary.pengeluaran} icon={ArrowDownRight} tone="danger" />
        <SummaryCard label="Saldo Kas" value={data.summary.saldo} icon={Wallet} tone="ink" />
      </div>

      <div className="mb-lg flex gap-sm sm:hidden">
        <button onClick={() => handleExport('PDF')} className="btn-secondary flex-1">
          <Download className="h-4 w-4" /> PDF
        </button>
        <button onClick={() => handleExport('Excel')} className="btn-secondary flex-1">
          <Download className="h-4 w-4" /> Excel
        </button>
      </div>

      <h2 className="mb-md flex items-center gap-sm text-title-md text-ink">
        <TrendingUp className="h-5 w-5" /> Riwayat Transaksi
        <span className="ml-auto text-body-sm font-normal text-muted">
          {period === 'Bulanan' ? 'Bulan ini' : 'Tahun ini'}
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
              <p className="text-caption-sm text-muted">
                {t.kategori} · {formatDate(t.tanggal)}
              </p>
            </div>
            <span
              className={`shrink-0 text-title-sm font-semibold ${
                t.tipe === 'pemasukan' ? 'text-success' : 'text-primary-error'
              }`}
            >
              {t.tipe === 'pemasukan' ? '+' : '−'}{formatRupiah(t.jumlah)}
            </span>
          </div>
        ))}
      </div>
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
