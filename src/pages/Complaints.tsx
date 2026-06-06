import { useState } from 'react'
import { Plus, Camera, FileWarning } from 'lucide-react'
import { useApiQuery } from '@/hooks/useApi'
import { api, ApiError } from '@/lib/api'
import { useApp } from '@/context/AppContext'
import { formatDate } from '@/lib/format'
import type { Complaint, ComplaintCategory, ComplaintStatus } from '@/types'
import PageHeader from '@/components/ui/PageHeader'
import StatusChip from '@/components/ui/StatusChip'
import Modal from '@/components/ui/Modal'

const categories: ComplaintCategory[] = ['Kebersihan', 'Keamanan', 'Infrastruktur', 'Fasilitas']

function toneFor(status: ComplaintStatus) {
  return status === 'Selesai' ? 'success' : status === 'Diproses' ? 'warning' : 'info'
}

export default function Complaints() {
  const { user } = useApp()
  const canManage = user && ['super_admin', 'pengelola'].includes(user.role)
  const { data, refetch } = useApiQuery<Complaint[]>(() => api.get<Complaint[]>('/complaints'))
  const [open, setOpen] = useState(false)
  const [kategori, setKategori] = useState<ComplaintCategory>('Kebersihan')
  const [judul, setJudul] = useState('')
  const [deskripsi, setDeskripsi] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [filterStatus, setFilterStatus] = useState<ComplaintStatus | 'Semua'>('Semua')
  const [filterKategori, setFilterKategori] = useState<ComplaintCategory | 'Semua'>('Semua')

  const all = data ?? []
  const list = all.filter(
    (c) =>
      (filterStatus === 'Semua' || c.status === filterStatus) &&
      (filterKategori === 'Semua' || c.kategori === filterKategori)
  )

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!judul.trim() || !deskripsi.trim()) {
      setError('Judul dan deskripsi wajib diisi.')
      return
    }
    setSubmitting(true)
    try {
      await api.post('/complaints', { kategori, judul: judul.trim(), deskripsi: deskripsi.trim() })
      setJudul('')
      setDeskripsi('')
      setKategori('Kebersihan')
      setOpen(false)
      await refetch()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Gagal mengirim aduan.')
    } finally {
      setSubmitting(false)
    }
  }

  const updateStatus = async (id: string, status: ComplaintStatus) => {
    await api.patch(`/complaints/${id}/status`, { status })
    await refetch()
  }

  return (
    <div>
      <PageHeader
        title="Pengaduan"
        subtitle="Laporkan masalah lingkungan dan fasilitas"
        action={
          <button onClick={() => setOpen(true)} className="btn-primary px-base">
            <Plus className="h-4 w-4" /><span className="hidden sm:inline">Buat Aduan</span>
          </button>
        }
      />

      <div className="mb-base space-y-sm">
        <div className="flex flex-wrap gap-xs">
          {(['Semua', 'Baru', 'Diproses', 'Selesai'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`rounded-full border px-md py-xs text-button-sm font-medium transition-colors ${filterStatus === s ? 'border-ink bg-ink text-white' : 'border-hairline text-ink'}`}
            >
              {s}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-xs">
          {(['Semua', ...categories] as const).map((c) => (
            <button
              key={c}
              onClick={() => setFilterKategori(c as ComplaintCategory | 'Semua')}
              className={`rounded-full border px-md py-xs text-caption-sm font-medium transition-colors ${filterKategori === c ? 'border-primary bg-primary-disabled text-primary-error' : 'border-hairline text-muted'}`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-base">
        {list.map((c) => (
          <article key={c.id} className="card p-base">
            <div className="flex items-start justify-between gap-base">
              <div className="min-w-0">
                <span className="text-caption-sm text-muted">{c.kategori}</span>
                <h3 className="mt-xxs text-title-md text-ink">{c.judul}</h3>
              </div>
              <StatusChip label={c.status} tone={toneFor(c.status)} />
            </div>
            <p className="mt-xs text-body-md text-body">{c.deskripsi}</p>
            <p className="mt-sm text-caption-sm text-muted">
              {c.pelapor} · Unit {c.unit} · {formatDate(c.tanggal)}
            </p>
            {canManage && c.status !== 'Selesai' && (
              <div className="mt-md flex gap-sm border-t border-hairline-soft pt-md">
                {c.status === 'Baru' && (
                  <button onClick={() => updateStatus(c.id, 'Diproses')} className="btn-secondary flex-1">
                    Tandai Diproses
                  </button>
                )}
                <button onClick={() => updateStatus(c.id, 'Selesai')} className="btn-primary flex-1">
                  Tandai Selesai
                </button>
              </div>
            )}
          </article>
        ))}
        {list.length === 0 && (
          <div className="py-section text-center">
            <FileWarning className="mx-auto h-10 w-10 text-muted" />
            <p className="mt-sm text-body-md text-muted">Belum ada pengaduan</p>
          </div>
        )}
      </div>

      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-24 right-base z-20 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-white shadow-float-lg active:bg-primary-active desktop:hidden"
        aria-label="Buat aduan baru"
      >
        <Plus className="h-6 w-6" />
      </button>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Buat Pengaduan"
        footer={
          <button onClick={submit} disabled={submitting} className="btn-primary w-full">
            {submitting ? 'Mengirim…' : 'Kirim Pengaduan'}
          </button>
        }
      >
        <form onSubmit={submit} className="space-y-base">
          <div>
            <label className="field-label">Kategori</label>
            <div className="grid grid-cols-2 gap-sm">
              {categories.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setKategori(c)}
                  className={`rounded-sm border px-md py-md text-button-sm font-medium transition-colors ${
                    kategori === c ? 'border-ink bg-ink text-white' : 'border-hairline text-ink'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label htmlFor="judul" className="field-label">Judul</label>
            <input id="judul" value={judul} onChange={(e) => setJudul(e.target.value)} className="field-input" placeholder="Contoh: Lampu koridor mati" />
          </div>
          <div>
            <label htmlFor="deskripsi" className="field-label">Deskripsi</label>
            <textarea id="deskripsi" value={deskripsi} onChange={(e) => setDeskripsi(e.target.value)} rows={4} className="field-input resize-none py-md" placeholder="Jelaskan detail masalah..." />
          </div>
          <button type="button" className="flex w-full items-center justify-center gap-sm rounded-sm border border-dashed border-hairline py-base text-body-sm text-muted hover:border-ink hover:text-ink">
            <Camera className="h-5 w-5" /> Tambah Foto (segera hadir)
          </button>
          {error && <p className="text-body-sm text-primary-error">{error}</p>}
        </form>
      </Modal>
    </div>
  )
}
