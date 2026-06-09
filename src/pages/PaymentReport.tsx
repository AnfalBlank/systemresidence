import { useMemo, useState } from 'react'
import { FileSpreadsheet, FileText, CheckCircle2, Wallet } from 'lucide-react'
import { useApiQuery } from '@/hooks/useApi'
import { api } from '@/lib/api'
import { formatRupiah, formatDate } from '@/lib/format'
import type { DuesStatus, DuesType } from '@/types'
import PageHeader from '@/components/ui/PageHeader'
import StatusChip from '@/components/ui/StatusChip'
import { exportToExcel, exportToPdf, type ExportColumn } from '@/lib/export'

interface AdminDues {
  id: string
  jenis: DuesType
  periode: string
  jumlah: number
  status: DuesStatus
  jatuhTempo: string
  residentName: string
  residentUnit: string
  blok: string
  paymentMethod: string | null
  paidAt: number | null
  verifiedAt: number | null
  verifiedBy: string | null
}

const duesTypes: DuesType[] = ['IPL', 'Kebersihan', 'Keamanan', 'Dana Sosial']

function tsToDate(ts: number | null): string {
  if (!ts) return '-'
  return formatDate(new Date(ts * 1000).toISOString())
}

function toneFor(status: DuesStatus) {
  return status === 'Lunas' ? 'success' : status === 'Menunggu Verifikasi' ? 'warning' : 'danger'
}

export default function PaymentReport() {
  const { data } = useApiQuery<AdminDues[]>(() => api.get<AdminDues[]>('/dues/all'))
  const [filterStatus, setFilterStatus] = useState<DuesStatus | 'Semua'>('Lunas')
  const [filterJenis, setFilterJenis] = useState<DuesType | 'Semua'>('Semua')
  const [filterBlok, setFilterBlok] = useState<string>('Semua')
  const [filterPeriode, setFilterPeriode] = useState<string>('Semua')
  const [query, setQuery] = useState('')

  const all = data ?? []

  const bloks = useMemo(
    () => Array.from(new Set(all.map((d) => d.blok))).sort(),
    [all],
  )
  const periodes = useMemo(
    () => Array.from(new Set(all.map((d) => d.periode))).sort(),
    [all],
  )

  const filtered = useMemo(() => {
    const q = query.toLowerCase()
    return all.filter(
      (d) =>
        (filterStatus === 'Semua' || d.status === filterStatus) &&
        (filterJenis === 'Semua' || d.jenis === filterJenis) &&
        (filterBlok === 'Semua' || d.blok === filterBlok) &&
        (filterPeriode === 'Semua' || d.periode === filterPeriode) &&
        (q === '' ||
          d.residentName.toLowerCase().includes(q) ||
          d.residentUnit.toLowerCase().includes(q)),
    )
  }, [all, filterStatus, filterJenis, filterBlok, filterPeriode, query])

  // Group by blok for display
  const grouped = useMemo(() => {
    const map = new Map<string, AdminDues[]>()
    for (const d of filtered) {
      if (!map.has(d.blok)) map.set(d.blok, [])
      map.get(d.blok)!.push(d)
    }
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b))
  }, [filtered])

  const totalNominal = filtered.reduce((sum, d) => sum + d.jumlah, 0)
  const lunasCount = filtered.filter((d) => d.status === 'Lunas').length

  const filterLabel = () => {
    const parts: string[] = []
    parts.push(`Status: ${filterStatus}`)
    if (filterJenis !== 'Semua') parts.push(`Jenis: ${filterJenis}`)
    if (filterBlok !== 'Semua') parts.push(`Blok: ${filterBlok}`)
    if (filterPeriode !== 'Semua') parts.push(`Periode: ${filterPeriode}`)
    return parts.join(' · ')
  }

  const columns: ExportColumn<AdminDues>[] = [
    { header: 'Nama Warga', value: (d) => d.residentName },
    { header: 'Blok', value: (d) => d.blok },
    { header: 'Unit', value: (d) => d.residentUnit },
    { header: 'Jenis', value: (d) => d.jenis },
    { header: 'Periode', value: (d) => d.periode },
    { header: 'Jumlah', value: (d) => d.jumlah, align: 'right' },
    { header: 'Status', value: (d) => d.status },
    { header: 'Metode', value: (d) => (d.paymentMethod ? d.paymentMethod.toUpperCase() : '-') },
    { header: 'Tgl Bayar', value: (d) => tsToDate(d.paidAt) },
    { header: 'Tgl Verifikasi', value: (d) => tsToDate(d.verifiedAt) },
    { header: 'Diverifikasi Oleh', value: (d) => d.verifiedBy ?? '-' },
  ]

  const meta = [
    `Filter: ${filterLabel()}`,
    `Jumlah data: ${filtered.length} tagihan (Lunas: ${lunasCount})`,
    `Total nominal: ${formatRupiah(totalNominal)}`,
    `Dibuat: ${formatDate(new Date().toISOString())}`,
  ]

  const stamp = new Date().toISOString().slice(0, 10)

  const doExcel = () =>
    exportToExcel(`laporan-pembayaran-${stamp}`, columns, filtered, {
      title: 'Laporan Pembayaran Iuran — KSTP Cakung',
      meta,
    })

  const doPdf = () =>
    exportToPdf(columns, filtered, {
      title: 'Laporan Pembayaran Iuran — KSTP Cakung',
      subtitle: filterLabel(),
      meta: meta.slice(1),
    })

  return (
    <div>
      <PageHeader
        title="Laporan Pembayaran"
        subtitle="Rekap warga yang sudah membayar per blok"
        action={
          <div className="flex gap-sm">
            <button onClick={doExcel} className="btn-secondary px-base" disabled={filtered.length === 0}>
              <FileSpreadsheet className="h-4 w-4" /><span className="hidden sm:inline">Excel</span>
            </button>
            <button onClick={doPdf} className="btn-primary px-base" disabled={filtered.length === 0}>
              <FileText className="h-4 w-4" /><span className="hidden sm:inline">PDF</span>
            </button>
          </div>
        }
      />

      {/* Summary */}
      <div className="mb-lg grid grid-cols-1 gap-base sm:grid-cols-3">
        <div className="card p-base">
          <div className="flex items-center justify-between">
            <p className="text-body-sm text-muted">Total Tagihan (filter)</p>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-strong text-ink">
              <Wallet className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-sm text-display-sm text-ink">{filtered.length}</p>
        </div>
        <div className="card p-base">
          <div className="flex items-center justify-between">
            <p className="text-body-sm text-muted">Sudah Lunas</p>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-success-soft text-success">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-sm text-display-sm text-ink">{lunasCount}</p>
        </div>
        <div className="card p-base">
          <div className="flex items-center justify-between">
            <p className="text-body-sm text-muted">Total Nominal</p>
          </div>
          <p className="mt-sm text-display-sm text-ink">{formatRupiah(totalNominal)}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-md grid gap-sm sm:grid-cols-2 desktop:grid-cols-4">
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as DuesStatus | 'Semua')} className="field-input">
          <option value="Semua">Semua Status</option>
          <option value="Lunas">Lunas</option>
          <option value="Menunggu Verifikasi">Menunggu Verifikasi</option>
          <option value="Belum Bayar">Belum Bayar</option>
        </select>
        <select value={filterJenis} onChange={(e) => setFilterJenis(e.target.value as DuesType | 'Semua')} className="field-input">
          <option value="Semua">Semua Jenis</option>
          {duesTypes.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        <select value={filterBlok} onChange={(e) => setFilterBlok(e.target.value)} className="field-input">
          <option value="Semua">Semua Blok</option>
          {bloks.map((b) => <option key={b} value={b}>Blok {b}</option>)}
        </select>
        <select value={filterPeriode} onChange={(e) => setFilterPeriode(e.target.value)} className="field-input">
          <option value="Semua">Semua Periode</option>
          {periodes.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
      </div>

      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Cari nama atau unit..."
        className="field-input mb-md"
      />

      {/* Grouped list */}
      <div className="space-y-lg">
        {grouped.map(([blok, list]) => {
          const subtotal = list.reduce((s, d) => s + d.jumlah, 0)
          return (
            <div key={blok}>
              <div className="mb-sm flex items-center justify-between">
                <div className="flex items-center gap-sm">
                  <h3 className="text-title-sm text-ink">Blok {blok}</h3>
                  <span className="rounded-full bg-surface-soft px-md py-xxs text-badge font-semibold text-muted">{list.length}</span>
                </div>
                <span className="text-caption-sm text-muted">{formatRupiah(subtotal)}</span>
              </div>
              <div className="card divide-y divide-hairline-soft">
                {list.map((d) => (
                  <div key={d.id} className="flex items-center gap-md px-base py-md">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-title-sm text-ink">{d.residentName}</p>
                      <p className="text-caption-sm text-muted">
                        Unit {d.residentUnit} · {d.jenis} {d.periode}
                      </p>
                      {d.status === 'Lunas' && d.verifiedAt && (
                        <p className="mt-xxs text-caption-sm text-success">
                          Lunas {tsToDate(d.verifiedAt)}
                          {d.paymentMethod ? ` · ${d.paymentMethod.toUpperCase()}` : ''}
                          {d.verifiedBy ? ` · oleh ${d.verifiedBy}` : ''}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-title-sm text-ink">{formatRupiah(d.jumlah)}</p>
                      <div className="mt-xxs">
                        <StatusChip label={d.status} tone={toneFor(d.status)} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
        {filtered.length === 0 && (
          <div className="card px-base py-lg text-center text-body-sm text-muted">
            Tidak ada data pembayaran sesuai filter.
          </div>
        )}
      </div>
    </div>
  )
}
