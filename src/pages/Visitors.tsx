import { useState } from 'react'
import { DoorOpen, Plus, KeyRound, Clock } from 'lucide-react'
import { useApiQuery } from '@/hooks/useApi'
import { api, ApiError } from '@/lib/api'
import { formatDate } from '@/lib/format'
import type { Visitor, VisitorStatus } from '@/types'
import PageHeader from '@/components/ui/PageHeader'
import StatusChip from '@/components/ui/StatusChip'
import Modal from '@/components/ui/Modal'
import QRDisplay from '@/components/ui/QRDisplay'

function toneFor(status: VisitorStatus) {
  return status === 'Di Dalam' ? 'success' : status === 'Menunggu' ? 'warning' : 'neutral'
}

export default function Visitors() {
  const { data, refetch } = useApiQuery<Visitor[]>(() => api.get<Visitor[]>('/visitors'))
  const [open, setOpen] = useState(false)
  const [qrVisitor, setQrVisitor] = useState<Visitor | null>(null)
  const [form, setForm] = useState({ nama: '', keperluan: '', tanggal: '', jam: '' })
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const list = data ?? []

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!form.nama.trim() || !form.keperluan.trim() || !form.tanggal) {
      setError('Nama, keperluan, dan tanggal wajib diisi.')
      return
    }
    setSubmitting(true)
    try {
      const created = await api.post<Visitor>('/visitors', form)
      setForm({ nama: '', keperluan: '', tanggal: '', jam: '' })
      setOpen(false)
      setQrVisitor(created)
      await refetch()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Gagal mendaftarkan tamu.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div>
      <PageHeader
        title="Visitor Management"
        subtitle="Daftarkan tamu dan kelola kunjungan"
        action={
          <button onClick={() => setOpen(true)} className="btn-primary px-base">
            <Plus className="h-4 w-4" /><span className="hidden sm:inline">Daftar Tamu</span>
          </button>
        }
      />

      <h2 className="mb-md text-title-md text-ink">Riwayat Kunjungan</h2>
      <div className="space-y-base">
        {list.map((v) => (
          <div key={v.id} className="card p-base">
            <div className="flex items-start justify-between gap-base">
              <div className="flex items-start gap-md">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-surface-soft">
                  <DoorOpen className="h-5 w-5 text-ink" />
                </div>
                <div>
                  <p className="text-title-sm text-ink">{v.nama}</p>
                  <p className="text-body-sm text-muted">{v.keperluan}</p>
                  <p className="mt-xxs flex items-center gap-xs text-caption-sm text-muted">
                    <Clock className="h-3.5 w-3.5" />
                    {formatDate(v.tanggal)} · {v.jam} · Unit {v.tujuanUnit}
                  </p>
                </div>
              </div>
              <StatusChip label={v.status} tone={toneFor(v.status)} />
            </div>
            <div className="mt-md flex items-center justify-between border-t border-hairline-soft pt-md">
              <div className="flex items-center gap-xs text-body-sm text-ink">
                <KeyRound className="h-4 w-4 text-muted" />
                PIN: <span className="font-semibold tracking-wider">{v.pin}</span>
              </div>
              <button onClick={() => setQrVisitor(v)} className="btn-tertiary text-button-sm">
                Lihat QR
              </button>
            </div>
          </div>
        ))}
        {list.length === 0 && (
          <div className="py-section text-center">
            <DoorOpen className="mx-auto h-10 w-10 text-muted" />
            <p className="mt-sm text-body-md text-muted">Belum ada tamu terdaftar</p>
          </div>
        )}
      </div>

      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-24 right-base z-20 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-white shadow-float-lg active:bg-primary-active desktop:hidden"
        aria-label="Daftar tamu"
      >
        <Plus className="h-6 w-6" />
      </button>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Registrasi Tamu"
        footer={
          <button onClick={submit} disabled={submitting} className="btn-primary w-full">
            {submitting ? 'Menyimpan…' : 'Buat Undangan Tamu'}
          </button>
        }
      >
        <div className="space-y-base">
          <div>
            <label className="field-label">Nama Tamu</label>
            <input value={form.nama} onChange={(e) => setForm({ ...form, nama: e.target.value })} className="field-input" placeholder="Nama lengkap tamu" />
          </div>
          <div>
            <label className="field-label">Keperluan</label>
            <input value={form.keperluan} onChange={(e) => setForm({ ...form, keperluan: e.target.value })} className="field-input" placeholder="Contoh: Kunjungan keluarga" />
          </div>
          <div className="grid grid-cols-2 gap-base">
            <div>
              <label className="field-label">Tanggal</label>
              <input type="date" value={form.tanggal} onChange={(e) => setForm({ ...form, tanggal: e.target.value })} className="field-input" />
            </div>
            <div>
              <label className="field-label">Jam</label>
              <input type="text" value={form.jam} onChange={(e) => setForm({ ...form, jam: e.target.value })} placeholder="14.00" className="field-input" />
            </div>
          </div>
          {error && <p className="text-body-sm text-primary-error">{error}</p>}
        </div>
      </Modal>

      <Modal open={!!qrVisitor} onClose={() => setQrVisitor(null)} title="QR & PIN Tamu">
        {qrVisitor && (
          <div className="flex flex-col items-center gap-base text-center">
            <QRDisplay
              value={`KSTP-VISITOR:${qrVisitor.id}:${qrVisitor.pin}:${qrVisitor.tujuanUnit}`}
              size={200}
              label={qrVisitor.nama}
              sublabel={qrVisitor.keperluan}
            />
            <div className="rounded-md bg-surface-soft px-lg py-md">
              <p className="text-caption-sm text-muted">PIN Tamu</p>
              <p className="text-display-md tracking-[0.3em] text-ink">{qrVisitor.pin}</p>
            </div>
            <p className="text-body-sm text-muted">
              Tunjukkan QR atau sebutkan PIN ke petugas keamanan di gerbang.
            </p>
          </div>
        )}
      </Modal>
    </div>
  )
}
