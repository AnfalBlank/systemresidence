import { useState } from 'react'
import { Eye, MousePointerClick, MessageCircle, Store, Plus, Trash2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useApiQuery } from '@/hooks/useApi'
import { api, ApiError } from '@/lib/api'
import { useApp } from '@/context/AppContext'
import type { UmkmAd } from '@/types'
import PageHeader from '@/components/ui/PageHeader'
import Modal from '@/components/ui/Modal'

function formatStat(n: number): string {
  return n >= 1000 ? `${(n / 1000).toFixed(1)}rb` : String(n)
}

export default function Umkm() {
  const navigate = useNavigate()
  const { user } = useApp()
  const canModerate = user && ['super_admin', 'pengelola'].includes(user.role)
  const { data, refetch } = useApiQuery<UmkmAd[]>(() => api.get<UmkmAd[]>('/umkm'))
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ nama: '', jenis: 'Produk' as 'Produk' | 'Jasa', banner: '', promo: '' })
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const ads = data ?? []

  const handleDelete = async (ad: UmkmAd) => {
    if (!confirm(`Hapus iklan "${ad.nama}"?`)) return
    try {
      await api.delete(`/umkm/${ad.id}`)
      await refetch()
    } catch (err) {
      alert(err instanceof ApiError ? err.message : 'Gagal menghapus iklan.')
    }
  }

  const handleClick = async (ad: UmkmAd) => {
    try { await api.post(`/umkm/${ad.id}/track`, { event: 'click' }) } catch { /* ignore */ }
  }
  const handleChat = async (ad: UmkmAd) => {
    try { await api.post(`/umkm/${ad.id}/track`, { event: 'chat' }) } catch { /* ignore */ }
    navigate(
      `/chat?peer=${encodeURIComponent(ad.ownerId)}&nama=${encodeURIComponent(ad.pemilik)}&unit=${encodeURIComponent(ad.unit)}`
    )
  }

  const submit = async () => {
    setError('')
    if (!form.nama.trim() || !form.promo.trim()) { setError('Nama dan promo wajib diisi.'); return }
    setSubmitting(true)
    try {
      await api.post('/umkm', form)
      setForm({ nama: '', jenis: 'Produk', banner: '', promo: '' })
      setOpen(false)
      await refetch()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Gagal pasang iklan.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div>
      <PageHeader
        title="Iklan UMKM"
        subtitle="Promosi produk dan jasa usaha warga"
        action={
          <button onClick={() => setOpen(true)} className="btn-primary px-base">
            <Plus className="h-4 w-4" /><span className="hidden sm:inline">Pasang Iklan</span>
          </button>
        }
      />

      <div className="grid grid-cols-1 gap-lg desktop:grid-cols-2">
        {ads.map((ad) => (
          <article key={ad.id} className="card overflow-hidden">
            <div className="relative">
              {ad.banner && <img src={ad.banner} alt={ad.nama} className="aspect-[2/1] w-full object-cover" loading="lazy" />}
              <span className="absolute left-sm top-sm rounded-full bg-canvas px-md py-xxs text-badge font-semibold text-ink shadow-float">{ad.jenis}</span>
              {(canModerate || ad.ownerId === user?.id) && (
                <button
                  onClick={() => handleDelete(ad)}
                  aria-label="Hapus iklan"
                  className="absolute right-sm top-sm flex h-8 w-8 items-center justify-center rounded-full bg-canvas text-muted shadow-float hover:text-primary-error"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
            <div className="p-base">
              <div className="flex items-center gap-sm">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-soft">
                  <Store className="h-4 w-4 text-ink" />
                </div>
                <div>
                  <p className="text-title-sm text-ink">{ad.nama}</p>
                  <p className="text-caption-sm text-muted">Unit {ad.unit}</p>
                </div>
              </div>
              <p onClick={() => handleClick(ad)} className="mt-md cursor-pointer rounded-sm bg-primary-disabled/40 px-md py-sm text-body-sm text-primary-error">
                {ad.promo}
              </p>
              <div className="mt-md grid grid-cols-3 gap-sm">
                <Stat icon={Eye} label="View" value={formatStat(ad.views)} />
                <Stat icon={MousePointerClick} label="Click" value={formatStat(ad.clicks)} />
                <Stat icon={MessageCircle} label="Chat" value={formatStat(ad.chats)} />
              </div>
              <button onClick={() => handleChat(ad)} className="btn-primary mt-base w-full">
                <MessageCircle className="h-4 w-4" /> Hubungi Penjual
              </button>
            </div>
          </article>
        ))}
        {ads.length === 0 && (
          <p className="py-section text-center text-body-md text-muted desktop:col-span-2">Belum ada iklan.</p>
        )}
      </div>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Pasang Iklan UMKM"
        footer={<button onClick={submit} disabled={submitting} className="btn-primary w-full">{submitting ? 'Menyimpan…' : 'Pasang Iklan'}</button>}
      >
        <div className="space-y-base">
          <div>
            <label className="field-label">Nama UMKM</label>
            <input value={form.nama} onChange={(e) => setForm({ ...form, nama: e.target.value })} className="field-input" />
          </div>
          <div>
            <label className="field-label">Jenis</label>
            <div className="grid grid-cols-2 gap-sm">
              {(['Produk', 'Jasa'] as const).map((t) => (
                <button key={t} type="button" onClick={() => setForm({ ...form, jenis: t })} className={`rounded-sm border px-md py-md text-button-sm font-medium transition-colors ${form.jenis === t ? 'border-ink bg-ink text-white' : 'border-hairline text-ink'}`}>
                  {t}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="field-label">URL Banner (opsional)</label>
            <input value={form.banner} onChange={(e) => setForm({ ...form, banner: e.target.value })} className="field-input" placeholder="https://..." />
          </div>
          <div>
            <label className="field-label">Promo</label>
            <textarea value={form.promo} onChange={(e) => setForm({ ...form, promo: e.target.value })} rows={3} className="field-input resize-none py-md" placeholder="Diskon 10%..." />
          </div>
          {error && <p className="text-body-sm text-primary-error">{error}</p>}
        </div>
      </Modal>
    </div>
  )
}

function Stat({ icon: Icon, label, value }: { icon: typeof Eye; label: string; value: string }) {
  return (
    <div className="rounded-sm bg-surface-soft px-sm py-md text-center">
      <Icon className="mx-auto h-4 w-4 text-muted" />
      <p className="mt-xxs text-title-sm text-ink">{value}</p>
      <p className="text-caption-sm text-muted">{label}</p>
    </div>
  )
}
