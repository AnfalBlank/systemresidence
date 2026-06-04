import { useState } from 'react'
import { Star, MessageCircle, Search, X, Plus } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useApiQuery } from '@/hooks/useApi'
import { api, ApiError } from '@/lib/api'
import { getIcon } from '@/lib/icons'
import { formatDate } from '@/lib/format'
import type { SkillProvider, SkillReview } from '@/types'
import PageHeader from '@/components/ui/PageHeader'
import Avatar from '@/components/ui/Avatar'
import Modal from '@/components/ui/Modal'

const skillCategories = [
  { label: 'Tukang Bangunan', iconKey: 'tukang' },
  { label: 'Teknisi AC', iconKey: 'ac' },
  { label: 'Teknisi Listrik', iconKey: 'listrik' },
  { label: 'Penjahit', iconKey: 'penjahit' },
  { label: 'Catering', iconKey: 'catering' },
  { label: 'Guru Les', iconKey: 'guru' },
  { label: 'Driver', iconKey: 'driver' },
  { label: 'Desainer', iconKey: 'desainer' },
  { label: 'Programmer', iconKey: 'programmer' },
  { label: 'Fotografer', iconKey: 'fotografer' },
  { label: 'Makeup Artist', iconKey: 'makeup' },
]

export default function Skills() {
  const navigate = useNavigate()
  const { data, refetch } = useApiQuery<SkillProvider[]>(() => api.get<SkillProvider[]>('/skill'))
  const [query, setQuery] = useState('')
  const [activeCat, setActiveCat] = useState<string | null>(null)
  const [selected, setSelected] = useState<SkillProvider | null>(null)
  const [reviews, setReviews] = useState<SkillReview[]>([])
  const [showRegister, setShowRegister] = useState(false)
  const [regForm, setRegForm] = useState({ kategori: 'Tukang Bangunan', deskripsi: '' })
  const [showReviewForm, setShowReviewForm] = useState(false)
  const [reviewRating, setReviewRating] = useState(5)
  const [reviewText, setReviewText] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const providers = data ?? []
  const filtered = providers.filter((s) => {
    const matchCat = !activeCat || s.kategori === activeCat
    const matchQuery =
      s.nama.toLowerCase().includes(query.toLowerCase()) ||
      s.kategori.toLowerCase().includes(query.toLowerCase())
    return matchCat && matchQuery
  })

  const openProvider = async (s: SkillProvider) => {
    setSelected(s)
    setShowReviewForm(false)
    const r = await api.get<SkillReview[]>(`/skill/${s.id}/reviews`)
    setReviews(r)
  }

  const submitRegister = async () => {
    if (!regForm.deskripsi.trim()) return
    setSubmitting(true)
    setError('')
    try {
      await api.post('/skill', regForm)
      setRegForm({ kategori: 'Tukang Bangunan', deskripsi: '' })
      setShowRegister(false)
      await refetch()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Gagal mendaftar.')
    } finally {
      setSubmitting(false)
    }
  }

  const submitReview = async () => {
    if (!selected) return
    try {
      await api.post(`/skill/${selected.id}/reviews`, { rating: reviewRating, komentar: reviewText })
      const r = await api.get<SkillReview[]>(`/skill/${selected.id}/reviews`)
      setReviews(r)
      setReviewText('')
      setReviewRating(5)
      setShowReviewForm(false)
      await refetch()
    } catch (err) {
      console.error(err)
    }
  }

  const chatProvider = (s: SkillProvider) => {
    navigate(
      `/chat?peer=${encodeURIComponent(s.residentId)}&nama=${encodeURIComponent(s.nama)}&unit=${encodeURIComponent(s.unit)}`
    )
  }

  return (
    <div>
      <PageHeader
        title="Skill Directory"
        subtitle="Temukan jasa dan keahlian dari warga KSTP"
        action={
          <button onClick={() => setShowRegister(true)} className="btn-primary px-base">
            <Plus className="h-4 w-4" /><span className="hidden sm:inline">Daftarkan Keahlian</span>
          </button>
        }
      />

      <div className="mb-lg flex items-center gap-sm rounded-full border border-hairline bg-canvas px-base shadow-float">
        <Search className="h-5 w-5 text-muted" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Cari keahlian atau nama..."
          className="h-12 flex-1 bg-transparent text-body-md text-ink placeholder:text-muted-soft focus:outline-none"
        />
        {query && <button onClick={() => setQuery('')} aria-label="Bersihkan"><X className="h-4 w-4 text-muted" /></button>}
      </div>

      <div className="-mx-base mb-lg flex gap-sm overflow-x-auto px-base pb-xs no-scrollbar desktop:mx-0 desktop:flex-wrap desktop:px-0">
        <button onClick={() => setActiveCat(null)} className={`shrink-0 rounded-full border px-base py-sm text-button-sm font-medium transition-colors ${!activeCat ? 'border-ink bg-ink text-white' : 'border-hairline bg-canvas text-ink hover:border-ink'}`}>
          Semua
        </button>
        {skillCategories.map((c) => {
          const CatIcon = getIcon(c.iconKey)
          return (
            <button
              key={c.label}
              onClick={() => setActiveCat(c.label)}
              className={`flex shrink-0 items-center gap-xs rounded-full border px-base py-sm text-button-sm font-medium transition-colors ${activeCat === c.label ? 'border-ink bg-ink text-white' : 'border-hairline bg-canvas text-ink hover:border-ink'}`}
            >
              <CatIcon className="h-4 w-4" />
              {c.label}
            </button>
          )
        })}
      </div>

      <div className="grid grid-cols-1 gap-base sm:grid-cols-2 desktop:grid-cols-3">
        {filtered.map((s) => (
          <button key={s.id} onClick={() => openProvider(s)} className="card p-base text-left transition-shadow hover:shadow-float">
            <div className="flex items-center gap-md">
              <Avatar name={s.nama} src={s.foto} size="lg" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-title-md text-ink">{s.nama}</p>
                <p className="truncate text-body-sm text-muted">{s.kategori}</p>
                <div className="mt-xxs flex items-center gap-xs">
                  <Star className="h-4 w-4 fill-ink text-ink" />
                  <span className="text-body-sm font-semibold text-ink">{s.rating.toFixed(1)}</span>
                  <span className="text-caption-sm text-muted">({s.jumlahReview})</span>
                </div>
              </div>
            </div>
            <p className="mt-md line-clamp-2 text-body-sm text-body">{s.deskripsi}</p>
            <div className="mt-md flex items-center justify-between">
              <span className="text-caption-sm text-muted">Unit {s.unit}</span>
              <span className={`chip ${s.available ? 'bg-success-soft text-success' : 'bg-surface-strong text-muted'}`}>
                {s.available ? 'Tersedia' : 'Sibuk'}
              </span>
            </div>
          </button>
        ))}
      </div>

      <Modal
        open={!!selected}
        onClose={() => setSelected(null)}
        title="Detail Penyedia Jasa"
        footer={
          <div className="flex gap-sm">
            <button onClick={() => selected && chatProvider(selected)} className="btn-secondary flex-1">
              <MessageCircle className="h-4 w-4" /> Chat
            </button>
            <button onClick={() => setShowReviewForm((v) => !v)} className="btn-primary flex-1">
              <Star className="h-4 w-4" /> Tulis Review
            </button>
          </div>
        }
      >
        {selected && (
          <div>
            <div className="flex items-center gap-base">
              <Avatar name={selected.nama} src={selected.foto} size="lg" />
              <div>
                <h2 className="text-display-sm text-ink">{selected.nama}</h2>
                <p className="text-body-sm text-muted">{selected.kategori} · Unit {selected.unit}</p>
                <div className="mt-xxs flex items-center gap-xs">
                  <Star className="h-4 w-4 fill-ink text-ink" />
                  <span className="text-body-sm font-semibold text-ink">{selected.rating.toFixed(1)}</span>
                  <span className="text-caption-sm text-muted">({selected.jumlahReview} review)</span>
                </div>
              </div>
            </div>

            <p className="mt-base text-body-md text-body">{selected.deskripsi}</p>

            {selected.portofolio.length > 0 && (
              <div className="mt-base">
                <h3 className="mb-sm text-title-sm text-ink">Portofolio</h3>
                <div className="flex gap-sm overflow-x-auto no-scrollbar">
                  {selected.portofolio.map((img, i) => (
                    <img key={i} src={img} alt="" className="h-28 w-28 shrink-0 rounded-md object-cover" loading="lazy" />
                  ))}
                </div>
              </div>
            )}

            {showReviewForm && (
              <div className="mt-base rounded-md border border-hairline p-base">
                <p className="text-title-sm text-ink">Tulis Review</p>
                <div className="mt-sm flex gap-xs">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button key={n} onClick={() => setReviewRating(n)} type="button">
                      <Star className={`h-6 w-6 ${n <= reviewRating ? 'fill-ink text-ink' : 'text-muted'}`} />
                    </button>
                  ))}
                </div>
                <textarea
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  placeholder="Ceritakan pengalaman Anda..."
                  rows={3}
                  className="field-input mt-sm resize-none py-md"
                />
                <button onClick={submitReview} className="btn-primary mt-sm w-full">Kirim Review</button>
              </div>
            )}

            <div className="mt-base">
              <h3 className="mb-sm text-title-sm text-ink">Review</h3>
              {reviews.length === 0 && <p className="text-body-sm text-muted">Belum ada review.</p>}
              <div className="space-y-md">
                {reviews.map((r) => (
                  <div key={r.id} className="border-b border-hairline-soft pb-md last:border-0">
                    <div className="flex items-center justify-between">
                      <p className="text-title-sm text-ink">{r.penulis}</p>
                      <div className="flex items-center gap-xxs">
                        {Array.from({ length: r.rating }).map((_, i) => (
                          <Star key={i} className="h-3.5 w-3.5 fill-ink text-ink" />
                        ))}
                      </div>
                    </div>
                    <p className="mt-xxs text-body-sm text-body">{r.komentar}</p>
                    <p className="mt-xxs text-caption-sm text-muted">{formatDate(r.tanggal)}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Register skill */}
      <Modal
        open={showRegister}
        onClose={() => setShowRegister(false)}
        title="Daftarkan Keahlian Anda"
        footer={<button onClick={submitRegister} disabled={submitting} className="btn-primary w-full">{submitting ? 'Menyimpan…' : 'Daftarkan'}</button>}
      >
        <div className="space-y-base">
          <div>
            <label className="field-label">Kategori Keahlian</label>
            <select value={regForm.kategori} onChange={(e) => setRegForm({ ...regForm, kategori: e.target.value })} className="field-input">
              {skillCategories.map((c) => (
                <option key={c.label} value={c.label}>{c.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="field-label">Deskripsi Layanan</label>
            <textarea value={regForm.deskripsi} onChange={(e) => setRegForm({ ...regForm, deskripsi: e.target.value })} rows={4} className="field-input resize-none py-md" placeholder="Jelaskan layanan, pengalaman, dan harga Anda..." />
          </div>
          {error && <p className="text-body-sm text-primary-error">{error}</p>}
        </div>
      </Modal>
    </div>
  )
}
