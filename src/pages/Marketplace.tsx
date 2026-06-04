import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Store, MessageCircle, ShoppingCart, X, Plus, Check } from 'lucide-react'
import { useApiQuery } from '@/hooks/useApi'
import { api, ApiError } from '@/lib/api'
import { formatRupiah } from '@/lib/format'
import type { Product } from '@/types'
import PageHeader from '@/components/ui/PageHeader'
import Modal from '@/components/ui/Modal'

const categories = ['Semua', 'Makanan', 'Kebutuhan', 'Jasa']

export default function Marketplace() {
  const navigate = useNavigate()
  const { data, refetch } = useApiQuery<Product[]>(() => api.get<Product[]>('/marketplace/products'))
  const [query, setQuery] = useState('')
  const [cat, setCat] = useState('Semua')
  const [selected, setSelected] = useState<Product | null>(null)
  const [orderState, setOrderState] = useState<'idle' | 'submitting' | 'done'>('idle')
  const [orderError, setOrderError] = useState('')
  const [showSell, setShowSell] = useState(false)
  const [sellForm, setSellForm] = useState({
    nama: '', foto: '', harga: '', stok: '', deskripsi: '', kategori: 'Makanan',
  })
  const [sellSubmitting, setSellSubmitting] = useState(false)

  const products = data ?? []
  const filtered = products.filter((p) => {
    const matchCat = cat === 'Semua' || p.kategori === cat
    const matchQuery = p.nama.toLowerCase().includes(query.toLowerCase())
    return matchCat && matchQuery
  })

  const placeOrder = async () => {
    if (!selected) return
    setOrderError('')
    setOrderState('submitting')
    try {
      await api.post('/marketplace/orders', { productId: selected.id, jumlah: 1 })
      setOrderState('done')
      await refetch()
    } catch (err) {
      setOrderError(err instanceof ApiError ? err.message : 'Gagal memesan.')
      setOrderState('idle')
    }
  }

  const chatSeller = (p: Product) => {
    navigate(
      `/chat?peer=${encodeURIComponent(p.sellerId)}&nama=${encodeURIComponent(p.penjual)}&unit=${encodeURIComponent(p.unitPenjual)}`
    )
  }

  const submitSellForm = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!sellForm.nama.trim() || !sellForm.harga) return
    setSellSubmitting(true)
    try {
      await api.post('/marketplace/products', {
        nama: sellForm.nama.trim(),
        foto: sellForm.foto.trim(),
        harga: Number(sellForm.harga),
        stok: Number(sellForm.stok || 0),
        deskripsi: sellForm.deskripsi.trim(),
        kategori: sellForm.kategori,
      })
      setSellForm({ nama: '', foto: '', harga: '', stok: '', deskripsi: '', kategori: 'Makanan' })
      setShowSell(false)
      await refetch()
    } catch (err) {
      console.error(err)
    } finally {
      setSellSubmitting(false)
    }
  }

  return (
    <div>
      <PageHeader
        title="Marketplace Warga"
        subtitle="Produk dan jasa dari warga KSTP Cakung"
        action={
          <button onClick={() => setShowSell(true)} className="btn-primary px-base">
            <Plus className="h-4 w-4" /><span className="hidden sm:inline">Jual</span>
          </button>
        }
      />

      <div className="mb-base flex items-center gap-sm rounded-full border border-hairline bg-canvas px-base shadow-float">
        <Search className="h-5 w-5 text-muted" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Cari produk atau jasa..."
          className="h-12 flex-1 bg-transparent text-body-md text-ink placeholder:text-muted-soft focus:outline-none"
        />
        {query && (
          <button onClick={() => setQuery('')} aria-label="Bersihkan">
            <X className="h-4 w-4 text-muted" />
          </button>
        )}
      </div>

      <div className="-mx-base mb-lg flex gap-sm overflow-x-auto px-base pb-xs no-scrollbar desktop:mx-0 desktop:px-0">
        {categories.map((c) => (
          <button
            key={c}
            onClick={() => setCat(c)}
            className={`shrink-0 rounded-full border px-base py-sm text-button-sm font-medium transition-colors ${
              cat === c ? 'border-ink bg-ink text-white' : 'border-hairline bg-canvas text-ink hover:border-ink'
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-base sm:grid-cols-3 desktop:grid-cols-4">
        {filtered.map((p) => (
          <button
            key={p.id}
            onClick={() => { setSelected(p); setOrderState('idle'); setOrderError('') }}
            className="group text-left"
          >
            <div className="relative overflow-hidden rounded-md">
              {p.foto ? (
                <img
                  src={p.foto}
                  alt={p.nama}
                  className="aspect-square w-full object-cover transition-transform group-hover:scale-105"
                  loading="lazy"
                />
              ) : (
                <div className="flex aspect-square w-full items-center justify-center bg-surface-soft">
                  <Store className="h-10 w-10 text-muted" />
                </div>
              )}
              <span className="absolute left-sm top-sm rounded-full bg-canvas px-md py-xxs text-badge font-semibold text-ink shadow-float">
                {p.kategori}
              </span>
            </div>
            <h3 className="mt-sm line-clamp-1 text-title-sm text-ink">{p.nama}</h3>
            <p className="line-clamp-1 text-caption-sm text-muted">
              {p.penjual} · {p.unitPenjual}
            </p>
            <p className="mt-xxs text-title-sm font-semibold text-ink">{formatRupiah(p.harga)}</p>
          </button>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="py-section text-center">
          <Store className="mx-auto h-10 w-10 text-muted" />
          <p className="mt-sm text-body-md text-muted">Tidak ada produk yang cocok</p>
        </div>
      )}

      {/* Detail / order modal */}
      <Modal
        open={!!selected}
        onClose={() => setSelected(null)}
        title={orderState === 'done' ? 'Pesanan Dibuat' : 'Detail Produk'}
        footer={
          selected && orderState === 'idle' ? (
            <div className="flex gap-sm">
              <button
                onClick={() => chatSeller(selected)}
                className="btn-secondary flex-1"
              >
                <MessageCircle className="h-4 w-4" /> Chat Penjual
              </button>
              <button onClick={placeOrder} className="btn-primary flex-1">
                <ShoppingCart className="h-4 w-4" /> Pesan
              </button>
            </div>
          ) : orderState === 'done' ? (
            <div className="flex gap-sm">
              <button onClick={() => selected && chatSeller(selected)} className="btn-secondary flex-1">
                <MessageCircle className="h-4 w-4" /> Chat Penjual
              </button>
              <button onClick={() => setSelected(null)} className="btn-primary flex-1">Selesai</button>
            </div>
          ) : (
            <button disabled className="btn-primary w-full">Memproses…</button>
          )
        }
      >
        {selected && orderState !== 'done' && (
          <div>
            {selected.foto && (
              <img src={selected.foto} alt={selected.nama} className="aspect-video w-full rounded-md object-cover" />
            )}
            <div className="mt-base flex items-start justify-between gap-base">
              <div>
                <h2 className="text-display-sm text-ink">{selected.nama}</h2>
                <p className="mt-xxs text-body-sm text-muted">
                  {selected.penjual} · Unit {selected.unitPenjual}
                </p>
              </div>
              <span className="shrink-0 rounded-full bg-surface-soft px-md py-xxs text-badge font-semibold text-ink">
                Stok {selected.stok}
              </span>
            </div>
            <p className="mt-base text-display-md text-primary">{formatRupiah(selected.harga)}</p>
            <p className="mt-base text-body-md text-body">{selected.deskripsi}</p>
            <div className="mt-base rounded-md bg-surface-soft p-base">
              <p className="text-caption-sm text-muted">Metode pembayaran</p>
              <p className="mt-xxs text-body-sm text-ink">Transfer Bank · QRIS Static</p>
            </div>
            {orderError && <p className="mt-sm text-body-sm text-primary-error">{orderError}</p>}
          </div>
        )}
        {orderState === 'done' && selected && (
          <div className="flex flex-col items-center gap-base py-base text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-success-soft">
              <Check className="h-8 w-8 text-success" />
            </div>
            <p className="text-display-sm text-ink">Pesanan Berhasil</p>
            <p className="text-body-md text-muted">
              Pesanan untuk <strong>{selected.nama}</strong> telah dibuat dengan
              status <strong>Menunggu Pembayaran</strong>. Silakan transfer dan
              hubungi penjual untuk konfirmasi.
            </p>
          </div>
        )}
      </Modal>

      {/* Sell new product modal */}
      <Modal
        open={showSell}
        onClose={() => setShowSell(false)}
        title="Jual Produk Baru"
        footer={
          <button onClick={submitSellForm} disabled={sellSubmitting} className="btn-primary w-full">
            {sellSubmitting ? 'Menyimpan…' : 'Publikasikan Produk'}
          </button>
        }
      >
        <form onSubmit={submitSellForm} className="space-y-base">
          <div>
            <label className="field-label">Nama Produk</label>
            <input value={sellForm.nama} onChange={(e) => setSellForm({ ...sellForm, nama: e.target.value })} className="field-input" />
          </div>
          <div>
            <label className="field-label">URL Foto (opsional)</label>
            <input value={sellForm.foto} onChange={(e) => setSellForm({ ...sellForm, foto: e.target.value })} className="field-input" placeholder="https://..." />
          </div>
          <div className="grid grid-cols-2 gap-base">
            <div>
              <label className="field-label">Harga (Rp)</label>
              <input type="number" value={sellForm.harga} onChange={(e) => setSellForm({ ...sellForm, harga: e.target.value })} className="field-input" />
            </div>
            <div>
              <label className="field-label">Stok</label>
              <input type="number" value={sellForm.stok} onChange={(e) => setSellForm({ ...sellForm, stok: e.target.value })} className="field-input" />
            </div>
          </div>
          <div>
            <label className="field-label">Kategori</label>
            <div className="grid grid-cols-3 gap-sm">
              {['Makanan', 'Kebutuhan', 'Jasa'].map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setSellForm({ ...sellForm, kategori: c })}
                  className={`rounded-sm border px-md py-md text-button-sm font-medium transition-colors ${
                    sellForm.kategori === c ? 'border-ink bg-ink text-white' : 'border-hairline text-ink'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="field-label">Deskripsi</label>
            <textarea value={sellForm.deskripsi} onChange={(e) => setSellForm({ ...sellForm, deskripsi: e.target.value })} rows={3} className="field-input resize-none py-md" />
          </div>
        </form>
      </Modal>
    </div>
  )
}
