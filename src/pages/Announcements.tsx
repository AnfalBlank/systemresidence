import { useState } from 'react'
import { Megaphone, Plus } from 'lucide-react'
import { useApiQuery } from '@/hooks/useApi'
import { api, ApiError } from '@/lib/api'
import { useApp } from '@/context/AppContext'
import { formatDate } from '@/lib/format'
import type { Announcement, AnnouncementCategory } from '@/types'
import PageHeader from '@/components/ui/PageHeader'
import StatusChip from '@/components/ui/StatusChip'
import Modal from '@/components/ui/Modal'

const filters: (AnnouncementCategory | 'Semua')[] = [
  'Semua',
  'Umum',
  'Penting',
  'Darurat',
]

function toneFor(kategori: AnnouncementCategory) {
  return kategori === 'Darurat'
    ? 'danger'
    : kategori === 'Penting'
      ? 'warning'
      : 'info'
}

export default function Announcements() {
  const { user } = useApp()
  const canManage = user && ['super_admin', 'pengelola'].includes(user.role)
  const [active, setActive] = useState<(typeof filters)[number]>('Semua')
  const [open, setOpen] = useState(false)
  const [judul, setJudul] = useState('')
  const [isi, setIsi] = useState('')
  const [kategori, setKategori] = useState<AnnouncementCategory>('Umum')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const { data, refetch } = useApiQuery<Announcement[]>(() =>
    api.get<Announcement[]>('/announcements')
  )

  const list = (data ?? []).filter((a) =>
    active === 'Semua' ? true : a.kategori === active
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!judul.trim() || !isi.trim()) {
      setError('Judul dan isi harus diisi.')
      return
    }
    setSubmitting(true)
    try {
      await api.post('/announcements', {
        judul: judul.trim(),
        isi: isi.trim(),
        kategori,
      })
      setJudul('')
      setIsi('')
      setKategori('Umum')
      setOpen(false)
      await refetch()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Gagal menyimpan.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div>
      <PageHeader
        title="Pengumuman"
        subtitle="Informasi resmi dari pengelola dan kelompok warga"
        action={
          canManage ? (
            <button onClick={() => setOpen(true)} className="btn-primary px-base">
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Buat</span>
            </button>
          ) : undefined
        }
      />

      {/* Filter strip */}
      <div className="-mx-base mb-lg flex gap-sm overflow-x-auto px-base pb-xs no-scrollbar desktop:mx-0 desktop:px-0">
        {filters.map((f) => (
          <button
            key={f}
            onClick={() => setActive(f)}
            className={`shrink-0 rounded-full border px-base py-sm text-button-sm font-medium transition-colors ${
              active === f
                ? 'border-ink bg-ink text-white'
                : 'border-hairline bg-canvas text-ink hover:border-ink'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="space-y-base">
        {list.map((a) => (
          <article
            key={a.id}
            className="card p-base transition-shadow hover:shadow-float"
          >
            <div className="mb-sm flex items-center gap-sm">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-soft">
                <Megaphone className="h-4 w-4 text-ink" />
              </div>
              <div className="flex-1">
                <StatusChip label={a.kategori} tone={toneFor(a.kategori)} />
              </div>
              <span className="text-caption-sm text-muted">
                {formatDate(a.tanggal)}
              </span>
            </div>
            <h2 className="text-title-md text-ink">{a.judul}</h2>
            <p className="mt-xs text-body-md text-body">{a.isi}</p>
            <p className="mt-sm text-caption-sm text-muted">— {a.penulis}</p>
          </article>
        ))}
        {list.length === 0 && (
          <p className="py-section text-center text-body-md text-muted">
            Belum ada pengumuman pada kategori ini.
          </p>
        )}
      </div>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Buat Pengumuman"
        footer={
          <button onClick={handleSubmit} disabled={submitting} className="btn-primary w-full">
            {submitting ? 'Menyimpan…' : 'Publikasikan'}
          </button>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-base">
          <div>
            <label className="field-label">Kategori</label>
            <div className="grid grid-cols-3 gap-sm">
              {(['Umum', 'Penting', 'Darurat'] as AnnouncementCategory[]).map((c) => (
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
            <input id="judul" value={judul} onChange={(e) => setJudul(e.target.value)} className="field-input" placeholder="Judul pengumuman" />
          </div>
          <div>
            <label htmlFor="isi" className="field-label">Isi</label>
            <textarea id="isi" value={isi} onChange={(e) => setIsi(e.target.value)} rows={5} className="field-input resize-none py-md" placeholder="Tulis pengumuman..." />
          </div>
          {error && <p className="text-body-sm text-primary-error">{error}</p>}
        </form>
      </Modal>
    </div>
  )
}
