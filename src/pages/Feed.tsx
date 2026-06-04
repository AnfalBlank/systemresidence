import { useState } from 'react'
import {
  Heart,
  MessageCircle,
  Share2,
  Plus,
  Image as ImageIcon,
  Send,
} from 'lucide-react'
import { useApiQuery } from '@/hooks/useApi'
import { api, ApiError } from '@/lib/api'
import type { FeedCategory, FeedPost } from '@/types'
import PageHeader from '@/components/ui/PageHeader'
import Avatar from '@/components/ui/Avatar'
import Modal from '@/components/ui/Modal'

const categories: FeedCategory[] = [
  'Informasi', 'Jual Beli', 'Kehilangan', 'Lowongan Kerja', 'Aktivitas Warga',
]

interface Comment {
  id: string
  nama: string
  unit: string
  isi: string
  waktu: string
}

export default function Feed() {
  const { data, refetch } = useApiQuery<FeedPost[]>(() => api.get<FeedPost[]>('/feed'))
  const [filter, setFilter] = useState<FeedCategory | 'Semua'>('Semua')
  const [open, setOpen] = useState(false)
  const [kategori, setKategori] = useState<FeedCategory>('Informasi')
  const [isi, setIsi] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Comments
  const [commentPostId, setCommentPostId] = useState<string | null>(null)
  const [comments, setComments] = useState<Comment[]>([])
  const [draftComment, setDraftComment] = useState('')

  const posts = data ?? []
  const list = filter === 'Semua' ? posts : posts.filter((p) => p.kategori === filter)

  const toggleLike = async (id: string) => {
    try {
      await api.post(`/feed/${id}/like`)
      await refetch()
    } catch (err) {
      console.error(err)
    }
  }

  const submit = async () => {
    setError('')
    if (!isi.trim()) return
    setSubmitting(true)
    try {
      await api.post('/feed', { kategori, isi: isi.trim() })
      setIsi('')
      setKategori('Informasi')
      setOpen(false)
      await refetch()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Gagal posting.')
    } finally {
      setSubmitting(false)
    }
  }

  const openComments = async (postId: string) => {
    setCommentPostId(postId)
    setDraftComment('')
    const data = await api.get<Comment[]>(`/feed/${postId}/comments`)
    setComments(data)
  }

  const sendComment = async () => {
    if (!commentPostId || !draftComment.trim()) return
    await api.post(`/feed/${commentPostId}/comments`, { isi: draftComment.trim() })
    setDraftComment('')
    const data = await api.get<Comment[]>(`/feed/${commentPostId}/comments`)
    setComments(data)
    await refetch()
  }

  const sharePost = async (post: FeedPost) => {
    const shareData = {
      title: `Postingan dari ${post.penulis}`,
      text: post.isi,
      url: window.location.origin + '/feed',
    }
    if (navigator.share) {
      try { await navigator.share(shareData) } catch { /* user dismissed */ }
    } else {
      navigator.clipboard?.writeText(`${shareData.title}\n${shareData.text}\n${shareData.url}`)
      alert('Tautan disalin ke clipboard.')
    }
  }

  return (
    <div>
      <PageHeader
        title="Community Feed"
        subtitle="Berbagi informasi dan aktivitas antar warga"
        action={
          <button onClick={() => setOpen(true)} className="btn-primary px-base">
            <Plus className="h-4 w-4" /><span className="hidden sm:inline">Buat Posting</span>
          </button>
        }
      />

      <div className="-mx-base mb-lg flex gap-sm overflow-x-auto px-base pb-xs no-scrollbar desktop:mx-0 desktop:px-0">
        {(['Semua', ...categories] as const).map((c) => (
          <button
            key={c}
            onClick={() => setFilter(c)}
            className={`shrink-0 rounded-full border px-base py-sm text-button-sm font-medium transition-colors ${filter === c ? 'border-ink bg-ink text-white' : 'border-hairline bg-canvas text-ink hover:border-ink'}`}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="mx-auto max-w-listing space-y-base">
        {list.map((p) => (
          <article key={p.id} className="card overflow-hidden">
            <div className="flex items-center gap-md px-base pt-base">
              <Avatar name={p.penulis} src={p.foto} size="md" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-title-sm text-ink">{p.penulis}</p>
                <p className="text-caption-sm text-muted">Unit {p.unit} · {p.waktu}</p>
              </div>
              <span className="shrink-0 rounded-full bg-surface-soft px-md py-xxs text-badge font-semibold text-ink">{p.kategori}</span>
            </div>

            <p className="px-base py-md text-body-md text-body">{p.isi}</p>
            {p.gambar && <img src={p.gambar} alt="" className="max-h-96 w-full object-cover" loading="lazy" />}

            <div className="flex items-center gap-lg border-t border-hairline-soft px-base py-sm">
              <button
                onClick={() => toggleLike(p.id)}
                className={`flex items-center gap-xs text-body-sm transition-colors ${p.liked ? 'text-primary' : 'text-muted hover:text-ink'}`}
              >
                <Heart className="h-5 w-5" fill={p.liked ? 'currentColor' : 'none'} />
                {p.likes}
              </button>
              <button onClick={() => openComments(p.id)} className="flex items-center gap-xs text-body-sm text-muted hover:text-ink">
                <MessageCircle className="h-5 w-5" /> {p.komentar}
              </button>
              <button onClick={() => sharePost(p)} className="flex items-center gap-xs text-body-sm text-muted hover:text-ink">
                <Share2 className="h-5 w-5" /> Bagikan
              </button>
            </div>
          </article>
        ))}
        {list.length === 0 && (
          <p className="py-section text-center text-body-md text-muted">Belum ada posting.</p>
        )}
      </div>

      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-24 right-base z-20 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-white shadow-float-lg active:bg-primary-active desktop:hidden"
        aria-label="Buat posting"
      >
        <Plus className="h-6 w-6" />
      </button>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Buat Posting"
        footer={<button onClick={submit} disabled={submitting} className="btn-primary w-full">{submitting ? 'Memposting…' : 'Posting'}</button>}
      >
        <div className="space-y-base">
          <div>
            <label className="field-label">Kategori</label>
            <div className="flex flex-wrap gap-sm">
              {categories.map((c) => (
                <button key={c} type="button" onClick={() => setKategori(c)} className={`rounded-full border px-md py-sm text-button-sm font-medium transition-colors ${kategori === c ? 'border-ink bg-ink text-white' : 'border-hairline text-ink'}`}>
                  {c}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label htmlFor="isi" className="field-label">Apa yang ingin Anda bagikan?</label>
            <textarea id="isi" value={isi} onChange={(e) => setIsi(e.target.value)} rows={4} className="field-input resize-none py-md" placeholder="Tulis sesuatu..." />
          </div>
          <button type="button" className="flex w-full items-center justify-center gap-sm rounded-sm border border-dashed border-hairline py-base text-body-sm text-muted hover:border-ink hover:text-ink">
            <ImageIcon className="h-5 w-5" /> Tambah Foto (segera hadir)
          </button>
          {error && <p className="text-body-sm text-primary-error">{error}</p>}
        </div>
      </Modal>

      {/* Comments modal */}
      <Modal
        open={!!commentPostId}
        onClose={() => setCommentPostId(null)}
        title="Komentar"
        footer={
          <div className="flex gap-sm">
            <input
              value={draftComment}
              onChange={(e) => setDraftComment(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendComment()}
              className="field-input flex-1"
              placeholder="Tulis komentar..."
            />
            <button onClick={sendComment} disabled={!draftComment.trim()} className="btn-primary px-base">
              <Send className="h-4 w-4" />
            </button>
          </div>
        }
      >
        <div className="space-y-md">
          {comments.length === 0 && (
            <p className="py-base text-center text-body-sm text-muted">Belum ada komentar.</p>
          )}
          {comments.map((c) => (
            <div key={c.id} className="flex items-start gap-sm">
              <Avatar name={c.nama} size="sm" />
              <div className="flex-1 rounded-md bg-surface-soft p-md">
                <p className="text-title-sm text-ink">{c.nama}</p>
                <p className="text-caption-sm text-muted">Unit {c.unit} · {c.waktu}</p>
                <p className="mt-xs text-body-sm text-body">{c.isi}</p>
              </div>
            </div>
          ))}
        </div>
      </Modal>
    </div>
  )
}
