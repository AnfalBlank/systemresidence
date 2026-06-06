import { useState } from 'react'
import { Users, Clock, CalendarCheck, Plus, Check, X, Trash2 } from 'lucide-react'
import { useApiQuery } from '@/hooks/useApi'
import { api, ApiError } from '@/lib/api'
import { useApp } from '@/context/AppContext'
import { formatDate } from '@/lib/format'
import type { Booking, BookingStatus, Facility, FacilityType } from '@/types'
import PageHeader from '@/components/ui/PageHeader'
import StatusChip from '@/components/ui/StatusChip'
import Modal from '@/components/ui/Modal'

function toneFor(status: BookingStatus) {
  return status === 'Approved' ? 'success' : status === 'Pending' ? 'warning' : status === 'Rejected' ? 'danger' : 'neutral'
}

const facilityTypes: FacilityType[] = ['Aula', 'Lapangan', 'Gazebo', 'Ruang Serbaguna']

export default function Booking() {
  const { user } = useApp()
  const canManage = user && ['super_admin', 'pengelola'].includes(user.role)
  const { data: facilities, refetch: refetchFacilities } = useApiQuery<Facility[]>(() => api.get<Facility[]>('/booking/facilities'))
  const { data: bookings, refetch } = useApiQuery<Booking[]>(() => api.get<Booking[]>('/booking'))
  const [tab, setTab] = useState<'fasilitas' | 'booking'>('fasilitas')
  const [selected, setSelected] = useState<Facility | null>(null)
  const [tanggal, setTanggal] = useState('')
  const [waktu, setWaktu] = useState('')
  const [keperluan, setKeperluan] = useState('')
  const [error, setError] = useState('')
  const [filterStatus, setFilterStatus] = useState<BookingStatus | 'Semua'>('Semua')

  // Facility management (admin)
  const [showFacilityForm, setShowFacilityForm] = useState(false)
  const [facForm, setFacForm] = useState({
    nama: '', tipe: 'Aula' as FacilityType, deskripsi: '', kapasitas: 50, foto: '', jamOperasional: '',
  })

  const submit = async () => {
    setError('')
    if (!selected || !tanggal || !waktu || !keperluan.trim()) {
      setError('Semua field wajib diisi.')
      return
    }
    try {
      await api.post('/booking', {
        facilityId: selected.id,
        tanggal,
        waktu,
        keperluan: keperluan.trim(),
      })
      setSelected(null)
      setTanggal(''); setWaktu(''); setKeperluan('')
      setTab('booking')
      await refetch()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Gagal mengajukan.')
    }
  }

  const updateStatus = async (id: string, status: BookingStatus) => {
    await api.patch(`/booking/${id}/status`, { status })
    await refetch()
  }

  const submitFacility = async () => {
    if (!facForm.nama.trim()) return
    try {
      await api.post('/booking/facilities', facForm)
      setFacForm({ nama: '', tipe: 'Aula', deskripsi: '', kapasitas: 50, foto: '', jamOperasional: '' })
      setShowFacilityForm(false)
      await refetchFacilities()
    } catch (err) {
      console.error(err)
    }
  }

  const deleteFacility = async (id: string) => {
    if (!confirm('Hapus fasilitas ini?')) return
    await api.delete(`/booking/facilities/${id}`)
    await refetchFacilities()
  }

  return (
    <div>
      <PageHeader
        title="Booking Fasilitas"
        subtitle="Pesan fasilitas bersama untuk kegiatan Anda"
        action={
          canManage && tab === 'fasilitas' ? (
            <button onClick={() => setShowFacilityForm(true)} className="btn-primary px-base">
              <Plus className="h-4 w-4" /><span className="hidden sm:inline">Tambah Fasilitas</span>
            </button>
          ) : undefined
        }
      />

      <div className="mb-lg flex border-b border-hairline">
        <TabButton active={tab === 'fasilitas'} onClick={() => setTab('fasilitas')} label="Fasilitas" />
        <TabButton active={tab === 'booking'} onClick={() => setTab('booking')} label={`Booking ${canManage ? 'Semua' : 'Saya'} (${bookings?.length ?? 0})`} />
      </div>

      {tab === 'fasilitas' ? (
        <div className="grid grid-cols-1 gap-base sm:grid-cols-2 desktop:grid-cols-3">
          {(facilities ?? []).map((f) => (
            <article key={f.id} className="card overflow-hidden">
              <img src={f.foto} alt={f.nama} className="aspect-video w-full object-cover" loading="lazy" />
              <div className="p-base">
                <div className="flex items-start justify-between gap-sm">
                  <h3 className="text-title-md text-ink">{f.nama}</h3>
                  {canManage && (
                    <button onClick={() => deleteFacility(f.id)} aria-label="Hapus fasilitas" className="text-muted hover:text-primary-error">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
                <p className="mt-xxs line-clamp-2 text-body-sm text-body">{f.deskripsi}</p>
                <div className="mt-md space-y-xs">
                  <div className="flex items-center gap-sm text-body-sm text-body">
                    <Users className="h-4 w-4 text-muted" /> Kapasitas {f.kapasitas} orang
                  </div>
                  <div className="flex items-center gap-sm text-body-sm text-body">
                    <Clock className="h-4 w-4 text-muted" /> {f.jamOperasional}
                  </div>
                </div>
                <button onClick={() => setSelected(f)} className="btn-primary mt-base w-full">
                  <Plus className="h-4 w-4" /> Ajukan Booking
                </button>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="space-y-base">
          <div className="flex flex-wrap gap-xs">
            {(['Semua', 'Pending', 'Approved', 'Rejected', 'Finished'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                className={`rounded-full border px-md py-xs text-button-sm font-medium transition-colors ${filterStatus === s ? 'border-ink bg-ink text-white' : 'border-hairline text-ink'}`}
              >
                {s}
              </button>
            ))}
          </div>
          {(bookings ?? []).filter((b) => filterStatus === 'Semua' || b.status === filterStatus).map((b) => (
            <div key={b.id} className="card p-base">
              <div className="flex items-start justify-between gap-base">
                <div>
                  <h3 className="text-title-md text-ink">{b.fasilitas}</h3>
                  <p className="mt-xxs text-body-sm text-body">{b.keperluan}</p>
                  <p className="mt-xs text-caption-sm text-muted">{formatDate(b.tanggal)} · {b.waktu}</p>
                </div>
                <StatusChip label={b.status} tone={toneFor(b.status)} />
              </div>
              {canManage && b.status === 'Pending' && (
                <div className="mt-md flex gap-sm border-t border-hairline-soft pt-md">
                  <button onClick={() => updateStatus(b.id, 'Approved')} className="btn-primary flex-1">
                    <Check className="h-4 w-4" /> Approve
                  </button>
                  <button onClick={() => updateStatus(b.id, 'Rejected')} className="btn-secondary flex-1">
                    <X className="h-4 w-4" /> Reject
                  </button>
                </div>
              )}
              {canManage && b.status === 'Approved' && (
                <div className="mt-md border-t border-hairline-soft pt-md">
                  <button onClick={() => updateStatus(b.id, 'Finished')} className="btn-secondary w-full">
                    Tandai Selesai
                  </button>
                </div>
              )}
            </div>
          ))}
          {(bookings ?? []).length === 0 && (
            <div className="py-section text-center">
              <CalendarCheck className="mx-auto h-10 w-10 text-muted" />
              <p className="mt-sm text-body-md text-muted">Belum ada pengajuan booking</p>
            </div>
          )}
        </div>
      )}

      <Modal
        open={!!selected}
        onClose={() => setSelected(null)}
        title={`Booking ${selected?.nama ?? ''}`}
        footer={<button onClick={submit} className="btn-primary w-full">Ajukan Booking</button>}
      >
        {selected && (
          <div className="space-y-base">
            <div className="rounded-md bg-surface-soft p-base">
              <p className="text-body-sm text-muted">
                {selected.deskripsi} · Kapasitas {selected.kapasitas} orang · Jam {selected.jamOperasional}
              </p>
            </div>
            <div>
              <label className="field-label">Tanggal</label>
              <input type="date" value={tanggal} onChange={(e) => setTanggal(e.target.value)} className="field-input" />
            </div>
            <div>
              <label className="field-label">Waktu</label>
              <input type="text" value={waktu} onChange={(e) => setWaktu(e.target.value)} placeholder="Contoh: 10.00 - 14.00" className="field-input" />
            </div>
            <div>
              <label className="field-label">Keperluan</label>
              <textarea value={keperluan} onChange={(e) => setKeperluan(e.target.value)} rows={3} className="field-input resize-none py-md" placeholder="Jelaskan keperluan booking..." />
            </div>
            {error && <p className="text-body-sm text-primary-error">{error}</p>}
            <p className="text-caption-sm text-muted">
              Pengajuan akan ditinjau pengelola. Status awal: Pending.
            </p>
          </div>
        )}
      </Modal>

      {/* Facility management modal (admin) */}
      <Modal
        open={showFacilityForm}
        onClose={() => setShowFacilityForm(false)}
        title="Tambah Fasilitas"
        footer={<button onClick={submitFacility} className="btn-primary w-full">Simpan Fasilitas</button>}
      >
        <div className="space-y-base">
          <div>
            <label className="field-label">Nama Fasilitas</label>
            <input value={facForm.nama} onChange={(e) => setFacForm({ ...facForm, nama: e.target.value })} className="field-input" />
          </div>
          <div>
            <label className="field-label">Tipe</label>
            <div className="grid grid-cols-2 gap-sm">
              {facilityTypes.map((t) => (
                <button key={t} type="button" onClick={() => setFacForm({ ...facForm, tipe: t })} className={`rounded-sm border px-md py-md text-button-sm font-medium transition-colors ${facForm.tipe === t ? 'border-ink bg-ink text-white' : 'border-hairline text-ink'}`}>
                  {t}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="field-label">Deskripsi</label>
            <textarea value={facForm.deskripsi} onChange={(e) => setFacForm({ ...facForm, deskripsi: e.target.value })} rows={2} className="field-input resize-none py-md" />
          </div>
          <div className="grid grid-cols-2 gap-base">
            <div>
              <label className="field-label">Kapasitas</label>
              <input type="number" value={facForm.kapasitas} onChange={(e) => setFacForm({ ...facForm, kapasitas: Number(e.target.value) })} className="field-input" />
            </div>
            <div>
              <label className="field-label">Jam Operasional</label>
              <input value={facForm.jamOperasional} onChange={(e) => setFacForm({ ...facForm, jamOperasional: e.target.value })} className="field-input" placeholder="08.00 - 22.00" />
            </div>
          </div>
          <div>
            <label className="field-label">URL Foto (opsional)</label>
            <input value={facForm.foto} onChange={(e) => setFacForm({ ...facForm, foto: e.target.value })} className="field-input" placeholder="https://..." />
          </div>
        </div>
      </Modal>
    </div>
  )
}

function TabButton({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`relative flex-1 pb-md text-center text-title-sm transition-colors ${active ? 'text-ink' : 'text-muted'}`}
    >
      {label}
      {active && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-ink" />}
    </button>
  )
}
