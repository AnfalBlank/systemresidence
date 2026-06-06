import { useState } from 'react'
import {
  Calendar,
  MapPin,
  Users,
  Clock,
  Check,
  Plus,
  Pencil,
  Trash2,
} from 'lucide-react'
import { useApiQuery } from '@/hooks/useApi'
import { api, ApiError } from '@/lib/api'
import { useApp } from '@/context/AppContext'
import { formatDate } from '@/lib/format'
import type { CommunityEvent, EventType } from '@/types'
import PageHeader from '@/components/ui/PageHeader'
import Modal from '@/components/ui/Modal'
import QRDisplay from '@/components/ui/QRDisplay'
import ConfirmDialog from '@/components/ui/ConfirmDialog'

const eventTypes: EventType[] = ['Kerja Bakti', 'Bazar', 'Pengajian', 'Senam', 'Perlombaan']

const emptyForm = {
  nama: '', tipe: 'Kerja Bakti' as EventType, deskripsi: '', tanggal: '', waktu: '', lokasi: '', kuota: 50, foto: '',
}

export default function Events() {
  const { user } = useApp()
  const canManage = user && ['super_admin', 'pengelola'].includes(user.role)
  const { data, refetch } = useApiQuery<CommunityEvent[]>(() => api.get<CommunityEvent[]>('/events'))
  const [qrEvent, setQrEvent] = useState<CommunityEvent | null>(null)
  const [open, setOpen] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [error, setError] = useState('')
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [filterTipe, setFilterTipe] = useState<EventType | 'Semua'>('Semua')
  const [onlyUpcoming, setOnlyUpcoming] = useState(false)

  const todayStr = new Date().toISOString().slice(0, 10)
  const events = (data ?? []).filter(
    (e) =>
      (filterTipe === 'Semua' || e.tipe === filterTipe) &&
      (!onlyUpcoming || e.tanggal >= todayStr)
  )

  const openCreate = () => { setEditId(null); setForm(emptyForm); setError(''); setOpen(true) }
  const openEdit = (e: CommunityEvent) => {
    setEditId(e.id)
    setForm({
      nama: e.nama, tipe: e.tipe, deskripsi: e.deskripsi, tanggal: e.tanggal,
      waktu: e.waktu, lokasi: e.lokasi, kuota: e.kuota, foto: e.foto ?? '',
    })
    setError('')
    setOpen(true)
  }

  const toggleRsvp = async (id: string) => {
    try {
      await api.post(`/events/${id}/rsvp`)
      await refetch()
    } catch (err) {
      alert(err instanceof ApiError ? err.message : 'Gagal RSVP')
    }
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!form.nama.trim() || !form.tanggal || !form.waktu.trim() || !form.lokasi.trim()) {
      setError('Nama, tanggal, waktu, dan lokasi wajib diisi.')
      return
    }
    try {
      if (editId) {
        await api.patch(`/events/${editId}`, form)
      } else {
        await api.post('/events', form)
      }
      setForm(emptyForm)
      setEditId(null)
      setOpen(false)
      await refetch()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Gagal menyimpan event.')
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    await api.delete(`/events/${deleteId}`)
    setDeleteId(null)
    await refetch()
  }

  return (
    <div>
      <PageHeader
        title="Event"
        subtitle="Kegiatan dan acara warga KSTP Cakung"
        action={
          canManage ? (
            <button onClick={openCreate} className="btn-primary px-base">
              <Plus className="h-4 w-4" /><span className="hidden sm:inline">Buat Event</span>
            </button>
          ) : undefined
        }
      />

      <div className="mb-lg flex flex-wrap items-center gap-xs">
        {(['Semua', ...eventTypes] as const).map((t) => (
          <button
            key={t}
            onClick={() => setFilterTipe(t as EventType | 'Semua')}
            className={`rounded-full border px-md py-xs text-caption-sm font-medium transition-colors ${filterTipe === t ? 'border-ink bg-ink text-white' : 'border-hairline text-muted'}`}
          >
            {t}
          </button>
        ))}
        <span className="mx-xs h-5 w-px bg-hairline" />
        <button
          onClick={() => setOnlyUpcoming((v) => !v)}
          className={`rounded-full border px-md py-xs text-caption-sm font-medium transition-colors ${onlyUpcoming ? 'border-primary bg-primary-disabled text-primary-error' : 'border-hairline text-muted'}`}
        >
          Akan Datang
        </button>
      </div>

      <div className="grid grid-cols-1 gap-base sm:grid-cols-2 desktop:grid-cols-3">
        {events.map((e) => {
          const penuh = e.terdaftar >= e.kuota
          return (
            <article key={e.id} className="card overflow-hidden">
              {e.foto && (
                <div className="relative">
                  <img src={e.foto} alt={e.nama} className="aspect-video w-full object-cover" loading="lazy" />
                  <span className="absolute left-sm top-sm rounded-full bg-canvas px-md py-xxs text-badge font-semibold text-ink shadow-float">
                    {e.tipe}
                  </span>
                </div>
              )}
              <div className="p-base">
                <h3 className="text-title-md text-ink">{e.nama}</h3>
                <p className="mt-xxs line-clamp-2 text-body-sm text-body">{e.deskripsi}</p>

                <div className="mt-md space-y-xs">
                  <InfoLine icon={Calendar} text={formatDate(e.tanggal)} />
                  <InfoLine icon={Clock} text={e.waktu} />
                  <InfoLine icon={MapPin} text={e.lokasi} />
                  <InfoLine icon={Users} text={`${e.terdaftar} / ${e.kuota} terdaftar`} />
                </div>

                <div className="mt-sm h-1.5 overflow-hidden rounded-full bg-surface-strong">
                  <div className="h-full rounded-full bg-primary" style={{ width: `${Math.min((e.terdaftar / e.kuota) * 100, 100)}%` }} />
                </div>

                <div className="mt-base flex gap-sm">
                  <button
                    onClick={() => toggleRsvp(e.id)}
                    disabled={penuh && !e.rsvp}
                    className={e.rsvp ? 'btn-secondary flex-1' : 'btn-primary flex-1'}
                  >
                    {e.rsvp ? (<><Check className="h-4 w-4" /> Terdaftar</>) : penuh ? 'Kuota Penuh' : 'RSVP'}
                  </button>
                  {e.rsvp && (
                    <button onClick={() => setQrEvent(e)} className="btn-secondary px-base" aria-label="Tampilkan QR absensi">
                      QR
                    </button>
                  )}
                </div>

                {canManage && (
                  <div className="mt-sm flex gap-xs border-t border-hairline-soft pt-sm">
                    <button onClick={() => openEdit(e)} className="flex flex-1 items-center justify-center gap-xxs rounded-sm py-xs text-caption-sm text-muted hover:bg-surface-soft hover:text-ink">
                      <Pencil className="h-3.5 w-3.5" /> Edit
                    </button>
                    <button onClick={() => setDeleteId(e.id)} className="flex flex-1 items-center justify-center gap-xxs rounded-sm py-xs text-caption-sm text-muted hover:bg-surface-soft hover:text-primary-error">
                      <Trash2 className="h-3.5 w-3.5" /> Hapus
                    </button>
                  </div>
                )}
              </div>
            </article>
          )
        })}
        {events.length === 0 && (
          <p className="py-section text-center text-body-md text-muted desktop:col-span-3">Belum ada event.</p>
        )}
      </div>

      <Modal open={!!qrEvent} onClose={() => setQrEvent(null)} title="QR Absensi">
        {qrEvent && (
          <div className="flex flex-col items-center gap-base text-center">
            <QRDisplay
              value={`KSTP-EVENT:${qrEvent.id}:${user?.id}`}
              size={200}
              label={qrEvent.nama}
              sublabel={`${formatDate(qrEvent.tanggal)} · ${qrEvent.waktu}`}
            />
            <p className="text-body-sm text-muted">Tunjukkan QR ini kepada panitia untuk absensi kehadiran.</p>
          </div>
        )}
      </Modal>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editId ? 'Edit Event' : 'Buat Event Baru'}
        footer={<button onClick={submit} className="btn-primary w-full">{editId ? 'Simpan Perubahan' : 'Publikasikan Event'}</button>}
      >
        <form onSubmit={submit} className="space-y-base">
          <div>
            <label className="field-label">Nama Event</label>
            <input value={form.nama} onChange={(e) => setForm({ ...form, nama: e.target.value })} className="field-input" />
          </div>
          <div>
            <label className="field-label">Tipe</label>
            <div className="flex flex-wrap gap-sm">
              {eventTypes.map((t) => (
                <button key={t} type="button" onClick={() => setForm({ ...form, tipe: t })} className={`rounded-full border px-base py-sm text-button-sm font-medium transition-colors ${form.tipe === t ? 'border-ink bg-ink text-white' : 'border-hairline text-ink'}`}>
                  {t}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="field-label">Deskripsi</label>
            <textarea value={form.deskripsi} onChange={(e) => setForm({ ...form, deskripsi: e.target.value })} rows={2} className="field-input resize-none py-md" />
          </div>
          <div className="grid grid-cols-2 gap-base">
            <div>
              <label className="field-label">Tanggal</label>
              <input type="date" value={form.tanggal} onChange={(e) => setForm({ ...form, tanggal: e.target.value })} className="field-input" />
            </div>
            <div>
              <label className="field-label">Kuota</label>
              <input type="number" value={form.kuota} onChange={(e) => setForm({ ...form, kuota: Number(e.target.value) })} className="field-input" />
            </div>
          </div>
          <div>
            <label className="field-label">Waktu</label>
            <input value={form.waktu} onChange={(e) => setForm({ ...form, waktu: e.target.value })} className="field-input" placeholder="07.00 - 10.00 WIB" />
          </div>
          <div>
            <label className="field-label">Lokasi</label>
            <input value={form.lokasi} onChange={(e) => setForm({ ...form, lokasi: e.target.value })} className="field-input" />
          </div>
          <div>
            <label className="field-label">URL Foto (opsional)</label>
            <input value={form.foto} onChange={(e) => setForm({ ...form, foto: e.target.value })} className="field-input" placeholder="https://..." />
          </div>
          {error && <p className="text-body-sm text-primary-error">{error}</p>}
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleteId}
        title="Hapus Event?"
        message="Event ini beserta data RSVP-nya akan dihapus permanen."
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  )
}

function InfoLine({ icon: Icon, text }: { icon: typeof Calendar; text: string }) {
  return (
    <div className="flex items-center gap-sm text-body-sm text-body">
      <Icon className="h-4 w-4 shrink-0 text-muted" />
      <span>{text}</span>
    </div>
  )
}
