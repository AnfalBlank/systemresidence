import { useState } from 'react'
import { HeartPulse, Flame, ShieldAlert, Check, Phone, X } from 'lucide-react'
import { useApp } from '@/context/AppContext'
import { api, ApiError } from '@/lib/api'
import { unitToString } from '@/lib/format'
import type { PanicType } from '@/types'
import PageHeader from '@/components/ui/PageHeader'

const panicTypes: { type: PanicType; icon: typeof HeartPulse; desc: string }[] = [
  { type: 'Medis', icon: HeartPulse, desc: 'Butuh bantuan medis darurat' },
  { type: 'Kebakaran', icon: Flame, desc: 'Ada kebakaran atau asap' },
  { type: 'Keamanan', icon: ShieldAlert, desc: 'Gangguan keamanan / kriminal' },
]

export default function Panic() {
  const { user } = useApp()
  const [confirming, setConfirming] = useState<PanicType | null>(null)
  const [sent, setSent] = useState<PanicType | null>(null)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const trigger = async (type: PanicType) => {
    setError('')
    setSubmitting(true)
    try {
      await api.post('/panic', { jenis: type })
      setConfirming(null)
      setSent(type)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Gagal mengirim sinyal.')
    } finally {
      setSubmitting(false)
    }
  }

  if (sent) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-success-soft">
          <Check className="h-10 w-10 text-success" />
        </div>
        <h1 className="mt-lg text-display-lg text-ink">Sinyal Terkirim</h1>
        <p className="mt-sm max-w-sm text-body-md text-muted">
          Petugas keamanan telah menerima notifikasi darurat{' '}
          <span className="font-semibold text-ink">{sent}</span> Anda. Bantuan
          sedang dalam perjalanan.
        </p>

        <div className="mt-lg w-full max-w-sm rounded-md bg-surface-soft p-base text-left">
          <DetailLine label="Nama" value={user?.nama ?? '-'} />
          <DetailLine label="Unit" value={user ? unitToString(user.unit) : '-'} />
          <DetailLine label="Waktu" value={new Date().toLocaleTimeString('id-ID')} />
        </div>

        <a href="tel:112" className="btn-secondary mt-lg w-full max-w-sm">
          <Phone className="h-4 w-4" /> Telepon Darurat 112
        </a>
        <button onClick={() => setSent(null)} className="btn-tertiary mt-md">Kembali</button>
      </div>
    )
  }

  return (
    <div>
      <PageHeader title="Panic Button" subtitle="Tekan tombol sesuai keadaan darurat Anda" />

      <div className="mb-lg rounded-md bg-surface-soft p-base">
        <p className="text-body-sm text-muted">
          Saat tombol ditekan, data berikut otomatis dikirim ke petugas:
        </p>
        <p className="mt-xxs text-body-md text-ink">
          {user?.nama} · Unit {user && unitToString(user.unit)} · Waktu kejadian
        </p>
      </div>

      <div className="space-y-base">
        {panicTypes.map(({ type, icon: Icon, desc }) => (
          <button
            key={type}
            onClick={() => setConfirming(type)}
            className="flex w-full items-center gap-base rounded-md border border-hairline bg-canvas p-base text-left transition-colors hover:border-primary"
          >
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary-disabled">
              <Icon className="h-7 w-7 text-primary-error" />
            </div>
            <div className="flex-1">
              <p className="text-title-md text-ink">{type}</p>
              <p className="text-body-sm text-muted">{desc}</p>
            </div>
            <ShieldAlert className="h-5 w-5 text-primary" />
          </button>
        ))}
      </div>

      {confirming && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-base">
          <div className="absolute inset-0 bg-black/50" onClick={() => setConfirming(null)} />
          <div className="relative z-10 w-full max-w-sm rounded-lg bg-canvas p-lg text-center shadow-float-lg">
            <button
              onClick={() => setConfirming(null)}
              className="absolute right-base top-base flex h-8 w-8 items-center justify-center rounded-full hover:bg-surface-soft"
              aria-label="Batal"
            >
              <X className="h-5 w-5 text-ink" />
            </button>
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary-disabled">
              <ShieldAlert className="h-8 w-8 text-primary-error" />
            </div>
            <h2 className="mt-base text-display-sm text-ink">Kirim Sinyal {confirming}?</h2>
            <p className="mt-xs text-body-sm text-muted">
              Pastikan ini benar-benar keadaan darurat. Petugas akan segera dihubungi.
            </p>
            {error && <p className="mt-sm text-body-sm text-primary-error">{error}</p>}
            <button onClick={() => trigger(confirming)} disabled={submitting} className="btn-primary mt-lg w-full">
              {submitting ? 'Mengirim…' : 'Ya, Kirim Sekarang'}
            </button>
            <button onClick={() => setConfirming(null)} className="btn-tertiary mt-md w-full">Batal</button>
          </div>
        </div>
      )}
    </div>
  )
}

function DetailLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-xs">
      <span className="text-body-sm text-muted">{label}</span>
      <span className="text-body-sm font-semibold text-ink">{value}</span>
    </div>
  )
}
