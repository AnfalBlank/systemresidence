import { useState } from 'react'
import {
  Users,
  Clock,
  Building2,
  QrCode,
  HandCoins,
  Check,
  Plus,
} from 'lucide-react'
import { useApiQuery } from '@/hooks/useApi'
import { api, ApiError } from '@/lib/api'
import { useApp } from '@/context/AppContext'
import { formatRupiah, formatDate } from '@/lib/format'
import type { Campaign, CampaignType } from '@/types'
import PageHeader from '@/components/ui/PageHeader'
import Modal from '@/components/ui/Modal'
import QRDisplay from '@/components/ui/QRDisplay'

const quickAmounts = [10000, 25000, 50000, 100000]
const campaignTypes: CampaignType[] = ['Renovasi', 'Bantuan Sosial', 'Perbaikan Fasilitas']

export default function Crowdfunding() {
  const { user } = useApp()
  const canManage = user && ['super_admin', 'pengelola'].includes(user.role)
  const { data, refetch } = useApiQuery<Campaign[]>(() => api.get<Campaign[]>('/crowdfunding'))
  const [selected, setSelected] = useState<Campaign | null>(null)
  const [amount, setAmount] = useState<number>(0)
  const [method, setMethod] = useState<'transfer' | 'qris'>('transfer')
  const [step, setStep] = useState<'form' | 'payment' | 'done'>('form')
  const [error, setError] = useState('')
  const [createOpen, setCreateOpen] = useState(false)
  const [createForm, setCreateForm] = useState({
    judul: '', tipe: 'Renovasi' as CampaignType, deskripsi: '', foto: '', target: 0, berakhir: '',
  })

  const campaigns = data ?? []

  const openDonate = (c: Campaign) => {
    setSelected(c); setAmount(0); setMethod('transfer'); setStep('form'); setError('')
  }

  const confirmDonate = async () => {
    if (!selected || amount <= 0) return
    setError('')
    try {
      await api.post(`/crowdfunding/${selected.id}/donate`, { jumlah: amount, metode: method })
      setStep('done')
      await refetch()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Gagal mengirim donasi.')
    }
  }

  const submitCreate = async () => {
    if (!createForm.judul.trim() || createForm.target <= 0 || !createForm.berakhir) return
    try {
      await api.post('/crowdfunding', createForm)
      setCreateForm({ judul: '', tipe: 'Renovasi', deskripsi: '', foto: '', target: 0, berakhir: '' })
      setCreateOpen(false)
      await refetch()
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <div>
      <PageHeader
        title="Crowdfunding"
        subtitle="Galang dana untuk kebaikan bersama"
        action={
          canManage ? (
            <button onClick={() => setCreateOpen(true)} className="btn-primary px-base">
              <Plus className="h-4 w-4" /><span className="hidden sm:inline">Buat Campaign</span>
            </button>
          ) : undefined
        }
      />

      <div className="grid grid-cols-1 gap-base sm:grid-cols-2 desktop:grid-cols-3">
        {campaigns.map((c) => {
          const pct = Math.min(Math.round((c.terkumpul / c.target) * 100), 100)
          return (
            <article key={c.id} className="card overflow-hidden">
              <div className="relative">
                <img src={c.foto} alt={c.judul} className="aspect-video w-full object-cover" loading="lazy" />
                <span className="absolute left-sm top-sm rounded-full bg-canvas px-md py-xxs text-badge font-semibold text-ink shadow-float">
                  {c.tipe}
                </span>
              </div>
              <div className="p-base">
                <h3 className="text-title-md text-ink">{c.judul}</h3>
                <p className="mt-xxs line-clamp-2 text-body-sm text-body">{c.deskripsi}</p>
                <div className="mt-md h-2 overflow-hidden rounded-full bg-surface-strong">
                  <div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${pct}%` }} />
                </div>
                <div className="mt-sm flex items-baseline justify-between">
                  <span className="text-title-sm font-semibold text-ink">{formatRupiah(c.terkumpul)}</span>
                  <span className="text-caption-sm text-muted">{pct}% dari {formatRupiah(c.target)}</span>
                </div>
                <div className="mt-sm flex items-center gap-md text-caption-sm text-muted">
                  <span className="flex items-center gap-xxs"><Users className="h-4 w-4" /> {c.donatur} donatur</span>
                  <span className="flex items-center gap-xxs"><Clock className="h-4 w-4" /> s/d {formatDate(c.berakhir)}</span>
                </div>
                <button onClick={() => openDonate(c)} className="btn-primary mt-base w-full">
                  <HandCoins className="h-4 w-4" /> Donasi
                </button>
              </div>
            </article>
          )
        })}
      </div>

      <Modal
        open={!!selected}
        onClose={() => setSelected(null)}
        title={step === 'done' ? 'Donasi Berhasil' : 'Donasi'}
        footer={
          step === 'form' ? (
            <button onClick={() => setStep('payment')} disabled={amount <= 0} className="btn-primary w-full">
              Lanjut ke Pembayaran
            </button>
          ) : step === 'payment' ? (
            <button onClick={confirmDonate} className="btn-primary w-full">Konfirmasi Sudah Bayar</button>
          ) : (
            <button onClick={() => setSelected(null)} className="btn-primary w-full">Selesai</button>
          )
        }
      >
        {selected && step === 'form' && (
          <div className="space-y-base">
            <div className="rounded-md bg-surface-soft p-base">
              <p className="text-title-sm text-ink">{selected.judul}</p>
              <p className="mt-xxs text-caption-sm text-muted">{selected.tipe}</p>
            </div>
            <div>
              <label className="field-label">Nominal Donasi</label>
              <div className="mb-sm grid grid-cols-4 gap-sm">
                {quickAmounts.map((a) => (
                  <button
                    key={a}
                    onClick={() => setAmount(a)}
                    className={`rounded-sm border py-sm text-button-sm font-medium transition-colors ${amount === a ? 'border-ink bg-ink text-white' : 'border-hairline text-ink'}`}
                  >
                    {a >= 1000 ? `${a / 1000}rb` : a}
                  </button>
                ))}
              </div>
              <input type="number" value={amount || ''} onChange={(e) => setAmount(Number(e.target.value))} placeholder="Nominal lain (Rp)" className="field-input" />
            </div>
            <div>
              <label className="field-label">Metode Pembayaran</label>
              <div className="grid grid-cols-2 gap-sm">
                <MethodBtn active={method === 'transfer'} onClick={() => setMethod('transfer')} icon={Building2} label="Transfer" />
                <MethodBtn active={method === 'qris'} onClick={() => setMethod('qris')} icon={QrCode} label="QRIS" />
              </div>
            </div>
          </div>
        )}

        {selected && step === 'payment' && (
          <div className="space-y-base">
            <div className="rounded-md bg-surface-soft p-base text-center">
              <p className="text-body-sm text-muted">{selected.judul}</p>
              <p className="mt-xxs text-display-md text-ink">{formatRupiah(amount)}</p>
            </div>
            {method === 'transfer' ? (
              <div className="card p-base">
                <p className="text-caption-sm text-muted">Bank BCA · a.n. Kas KSTP Cakung</p>
                <p className="mt-sm text-title-md tracking-wider text-ink">1234567890</p>
                <p className="mt-sm text-caption-sm text-muted">Transfer tepat {formatRupiah(amount)}, lalu konfirmasi.</p>
              </div>
            ) : (
              <div className="flex justify-center">
                <QRDisplay value={`KSTP-CF:${selected.id}:${amount}`} size={180} sublabel="Scan dengan e-wallet atau m-banking" />
              </div>
            )}
            {error && <p className="text-body-sm text-primary-error">{error}</p>}
          </div>
        )}

        {selected && step === 'done' && (
          <div className="flex flex-col items-center gap-base py-base text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-success-soft">
              <Check className="h-8 w-8 text-success" />
            </div>
            <p className="text-display-sm text-ink">Terima kasih!</p>
            <p className="text-body-md text-muted">
              Donasi <strong>{formatRupiah(amount)}</strong> untuk{' '}
              <strong>{selected.judul}</strong> telah dicatat.
            </p>
          </div>
        )}
      </Modal>

      {/* Create campaign modal */}
      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Buat Campaign"
        footer={<button onClick={submitCreate} className="btn-primary w-full">Publikasikan</button>}
      >
        <div className="space-y-base">
          <div>
            <label className="field-label">Judul</label>
            <input value={createForm.judul} onChange={(e) => setCreateForm({ ...createForm, judul: e.target.value })} className="field-input" />
          </div>
          <div>
            <label className="field-label">Tipe</label>
            <div className="grid grid-cols-3 gap-sm">
              {campaignTypes.map((t) => (
                <button key={t} type="button" onClick={() => setCreateForm({ ...createForm, tipe: t })} className={`rounded-sm border px-sm py-md text-button-sm font-medium transition-colors ${createForm.tipe === t ? 'border-ink bg-ink text-white' : 'border-hairline text-ink'}`}>
                  {t}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="field-label">Deskripsi</label>
            <textarea value={createForm.deskripsi} onChange={(e) => setCreateForm({ ...createForm, deskripsi: e.target.value })} rows={3} className="field-input resize-none py-md" />
          </div>
          <div>
            <label className="field-label">URL Foto</label>
            <input value={createForm.foto} onChange={(e) => setCreateForm({ ...createForm, foto: e.target.value })} className="field-input" placeholder="https://..." />
          </div>
          <div className="grid grid-cols-2 gap-base">
            <div>
              <label className="field-label">Target (Rp)</label>
              <input type="number" value={createForm.target || ''} onChange={(e) => setCreateForm({ ...createForm, target: Number(e.target.value) })} className="field-input" />
            </div>
            <div>
              <label className="field-label">Berakhir</label>
              <input type="date" value={createForm.berakhir} onChange={(e) => setCreateForm({ ...createForm, berakhir: e.target.value })} className="field-input" />
            </div>
          </div>
        </div>
      </Modal>
    </div>
  )
}

function MethodBtn({
  active, onClick, icon: Icon, label,
}: {
  active: boolean; onClick: () => void; icon: typeof Building2; label: string
}) {
  return (
    <button onClick={onClick} className={`flex items-center justify-center gap-sm rounded-sm border px-md py-md text-button-sm font-medium transition-colors ${active ? 'border-ink bg-ink text-white' : 'border-hairline text-ink'}`}>
      <Icon className="h-4 w-4" /> {label}
    </button>
  )
}
