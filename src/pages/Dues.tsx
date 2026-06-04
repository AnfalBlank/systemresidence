import { useState } from 'react'
import { Building2, Copy, Check, Wallet, QrCode } from 'lucide-react'
import { useApiQuery } from '@/hooks/useApi'
import { api, ApiError } from '@/lib/api'
import { formatRupiah, formatDate } from '@/lib/format'
import type { Dues as DuesItem, DuesStatus } from '@/types'
import PageHeader from '@/components/ui/PageHeader'
import StatusChip from '@/components/ui/StatusChip'
import Modal from '@/components/ui/Modal'
import QRDisplay from '@/components/ui/QRDisplay'

function toneFor(status: DuesStatus) {
  return status === 'Lunas'
    ? 'success'
    : status === 'Menunggu Verifikasi'
      ? 'warning'
      : 'danger'
}

export default function Dues() {
  const { data, loading, refetch } = useApiQuery<DuesItem[]>(() =>
    api.get<DuesItem[]>('/dues')
  )
  const [payTarget, setPayTarget] = useState<DuesItem | null>(null)
  const [method, setMethod] = useState<'transfer' | 'qris'>('transfer')
  const [copied, setCopied] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const dues = data ?? []
  const unpaid = dues.filter((d) => d.status === 'Belum Bayar')
  const totalUnpaid = unpaid.reduce((s, d) => s + d.jumlah, 0)

  const copyAccount = () => {
    navigator.clipboard?.writeText('1234567890')
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  const confirmPayment = async () => {
    if (!payTarget) return
    setError('')
    setSubmitting(true)
    try {
      await api.post(`/dues/${payTarget.id}/pay`, { method })
      setPayTarget(null)
      await refetch()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Gagal memproses pembayaran.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-hairline border-t-primary" />
      </div>
    )
  }

  return (
    <div>
      <PageHeader title="Iuran" subtitle="IPL, Kebersihan, Keamanan, dan Dana Sosial" />

      <div className="card-float mb-lg flex items-center justify-between p-base">
        <div>
          <p className="text-body-sm text-muted">Total tagihan belum dibayar</p>
          <p className="mt-xxs text-display-md text-ink">{formatRupiah(totalUnpaid)}</p>
          <p className="mt-xxs text-caption-sm text-muted">
            {unpaid.length} tagihan menunggu pembayaran
          </p>
        </div>
        <div className="hidden h-14 w-14 items-center justify-center rounded-full bg-surface-soft sm:flex">
          <Wallet className="h-7 w-7 text-primary" />
        </div>
      </div>

      <div className="space-y-base">
        {dues.map((d) => (
          <div key={d.id} className="card p-base">
            <div className="flex items-start justify-between gap-base">
              <div>
                <h3 className="text-title-md text-ink">{d.jenis}</h3>
                <p className="mt-xxs text-body-sm text-muted">{d.periode}</p>
                <p className="mt-xs text-caption-sm text-muted">
                  Jatuh tempo {formatDate(d.jatuhTempo)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-title-md text-ink">{formatRupiah(d.jumlah)}</p>
                <div className="mt-xs">
                  <StatusChip label={d.status} tone={toneFor(d.status)} />
                </div>
              </div>
            </div>
            {d.status === 'Belum Bayar' && (
              <button
                onClick={() => { setPayTarget(d); setMethod('transfer'); setError('') }}
                className="btn-primary mt-base w-full"
              >
                Bayar Sekarang
              </button>
            )}
          </div>
        ))}
        {dues.length === 0 && (
          <p className="py-section text-center text-body-md text-muted">
            Tidak ada tagihan saat ini.
          </p>
        )}
      </div>

      <Modal
        open={!!payTarget}
        onClose={() => setPayTarget(null)}
        title="Pembayaran Iuran"
        footer={
          <button onClick={confirmPayment} disabled={submitting} className="btn-primary w-full">
            {submitting ? 'Memproses…' : 'Saya Sudah Bayar'}
          </button>
        }
      >
        {payTarget && (
          <div>
            <div className="mb-base rounded-md bg-surface-soft p-base text-center">
              <p className="text-body-sm text-muted">{payTarget.jenis} · {payTarget.periode}</p>
              <p className="mt-xxs text-display-md text-ink">{formatRupiah(payTarget.jumlah)}</p>
            </div>

            <div className="mb-base grid grid-cols-2 gap-sm">
              <MethodButton active={method === 'transfer'} onClick={() => setMethod('transfer')} icon={Building2} label="Transfer Bank" />
              <MethodButton active={method === 'qris'} onClick={() => setMethod('qris')} icon={QrCode} label="QRIS" />
            </div>

            {method === 'transfer' ? (
              <div className="space-y-sm">
                <div className="card p-base">
                  <p className="text-caption-sm text-muted">Bank BCA</p>
                  <p className="text-title-md text-ink">a.n. Kas KSTP Cakung</p>
                  <div className="mt-sm flex items-center justify-between rounded-sm bg-surface-soft px-md py-sm">
                    <span className="text-title-md tracking-wider text-ink">1234567890</span>
                    <button
                      onClick={copyAccount}
                      className="flex items-center gap-xxs text-button-sm text-primary"
                    >
                      {copied ? (<><Check className="h-4 w-4" /> Tersalin</>) : (<><Copy className="h-4 w-4" /> Salin</>)}
                    </button>
                  </div>
                </div>
                <p className="text-caption-sm text-muted">
                  Transfer sesuai nominal, lalu tekan "Saya Sudah Bayar".
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <QRDisplay
                  value={`KSTP-IURAN:${payTarget.id}:${payTarget.jumlah}`}
                  size={180}
                  sublabel="Scan dengan e-wallet atau m-banking"
                />
              </div>
            )}

            {error && <p className="mt-sm text-body-sm text-primary-error">{error}</p>}
          </div>
        )}
      </Modal>
    </div>
  )
}

function MethodButton({
  active, onClick, icon: Icon, label,
}: {
  active: boolean; onClick: () => void; icon: typeof Building2; label: string
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center justify-center gap-sm rounded-sm border px-md py-md text-button-sm font-medium transition-colors ${
        active ? 'border-ink bg-ink text-white' : 'border-hairline text-ink'
      }`}
    >
      <Icon className="h-4 w-4" /> {label}
    </button>
  )
}
