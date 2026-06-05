import { useState } from 'react'
import { MapPin, Calendar, Home, Plus, Pencil, Trash2 } from 'lucide-react'
import { useApiQuery } from '@/hooks/useApi'
import { api, ApiError } from '@/lib/api'
import { useApp } from '@/context/AppContext'
import { formatDate } from '@/lib/format'
import type { Obituary } from '@/types'
import PageHeader from '@/components/ui/PageHeader'
import Modal from '@/components/ui/Modal'
import ConfirmDialog from '@/components/ui/ConfirmDialog'

const emptyForm = {
  namaAlmarhum: '', unit: '', lokasiRumahDuka: '', jadwalPemakaman: '', catatan: '',
}

export default function Obituaries() {
  const { user } = useApp()
  const canManage = user && ['super_admin', 'pengelola'].includes(user.role)
  const [open, setOpen] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const { data, refetch } = useApiQuery<Obituary[]>(() => api.get<Obituary[]>('/obituaries'))

  const openCreate = () => { setEditId(null); setForm(emptyForm); setError(''); setOpen(true) }
  const openEdit = (o: Obituary) => {
    setEditId(o.id)
    setForm({
      namaAlmarhum: o.namaAlmarhum, unit: o.unit, lokasiRumahDuka: o.lokasiRumahDuka,
      jadwalPemakaman: o.jadwalPemakaman, catatan: o.catatan ?? '',
    })
    setError('')
    setOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!form.namaAlmarhum.trim() || !form.unit.trim() || !form.lokasiRumahDuka.trim() || !form.jadwalPemakaman.trim()) {
      setError('Semua field wajib selain catatan.')
      return
    }
    setSubmitting(true)
    try {
      if (editId) {
        await api.patch(`/obituaries/${editId}`, form)
      } else {
        await api.post('/obituaries', form)
      }
      setForm(emptyForm)
      setEditId(null)
      setOpen(false)
      await refetch()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Gagal menyimpan.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    await api.delete(`/obituaries/${deleteId}`)
    setDeleteId(null)
    await refetch()
  }

  return (
    <div>
      <PageHeader
        title="Berita Duka"
        subtitle="Innalillahi wa inna ilaihi raji'un"
        action={
          canManage ? (
            <button onClick={openCreate} className="btn-primary px-base">
              <Plus className="h-4 w-4" /><span className="hidden sm:inline">Tambah</span>
            </button>
          ) : undefined
        }
      />

      <div className="space-y-base">
        {(data ?? []).map((o) => (
          <article key={o.id} className="card overflow-hidden">
            <div className="border-b border-hairline-soft bg-surface-soft px-base py-md text-center">
              <p className="text-caption-sm text-muted">Telah berpulang ke Rahmatullah</p>
              <h2 className="mt-xxs text-display-sm text-ink">{o.namaAlmarhum}</h2>
            </div>
            <div className="space-y-md p-base">
              <DetailRow icon={Home} label="Unit" value={o.unit} />
              <DetailRow icon={MapPin} label="Lokasi Rumah Duka" value={o.lokasiRumahDuka} />
              <DetailRow icon={Calendar} label="Jadwal Pemakaman" value={o.jadwalPemakaman} />
              {o.catatan && (
                <p className="rounded-sm bg-surface-soft p-md text-body-sm italic text-body">{o.catatan}</p>
              )}
              <div className="flex items-center justify-between">
                <p className="text-caption-sm text-muted">Diumumkan {formatDate(o.tanggal)}</p>
                {canManage && (
                  <div className="flex gap-xs">
                    <button onClick={() => openEdit(o)} className="flex items-center gap-xxs rounded-sm px-sm py-xs text-caption-sm text-muted hover:bg-surface-soft hover:text-ink">
                      <Pencil className="h-3.5 w-3.5" /> Edit
                    </button>
                    <button onClick={() => setDeleteId(o.id)} className="flex items-center gap-xxs rounded-sm px-sm py-xs text-caption-sm text-muted hover:bg-surface-soft hover:text-primary-error">
                      <Trash2 className="h-3.5 w-3.5" /> Hapus
                    </button>
                  </div>
                )}
              </div>
            </div>
          </article>
        ))}
        {(data ?? []).length === 0 && (
          <p className="py-section text-center text-body-md text-muted">Belum ada berita duka.</p>
        )}
      </div>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editId ? 'Edit Berita Duka' : 'Tambah Berita Duka'}
        footer={
          <button onClick={handleSubmit} disabled={submitting} className="btn-primary w-full">
            {submitting ? 'Menyimpan…' : editId ? 'Simpan Perubahan' : 'Publikasikan'}
          </button>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-base">
          <div>
            <label className="field-label">Nama Almarhum/Almarhumah</label>
            <input value={form.namaAlmarhum} onChange={(e) => setForm({ ...form, namaAlmarhum: e.target.value })} className="field-input" placeholder="Nama lengkap" />
          </div>
          <div>
            <label className="field-label">Unit</label>
            <input value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} className="field-input" placeholder="Contoh: A-02-08" />
          </div>
          <div>
            <label className="field-label">Lokasi Rumah Duka</label>
            <input value={form.lokasiRumahDuka} onChange={(e) => setForm({ ...form, lokasiRumahDuka: e.target.value })} className="field-input" />
          </div>
          <div>
            <label className="field-label">Jadwal Pemakaman</label>
            <input value={form.jadwalPemakaman} onChange={(e) => setForm({ ...form, jadwalPemakaman: e.target.value })} className="field-input" placeholder="Senin, 2 Juni 2026, 10.00 WIB" />
          </div>
          <div>
            <label className="field-label">Catatan (opsional)</label>
            <textarea value={form.catatan} onChange={(e) => setForm({ ...form, catatan: e.target.value })} rows={3} className="field-input resize-none py-md" />
          </div>
          {error && <p className="text-body-sm text-primary-error">{error}</p>}
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleteId}
        title="Hapus Berita Duka?"
        message="Data berita duka ini akan dihapus permanen."
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  )
}

function DetailRow({ icon: Icon, label, value }: { icon: typeof Home; label: string; value: string }) {
  return (
    <div className="flex items-start gap-md">
      <div className="mt-xxs flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface-soft">
        <Icon className="h-4 w-4 text-muted" />
      </div>
      <div>
        <p className="text-caption-sm text-muted">{label}</p>
        <p className="text-body-md text-ink">{value}</p>
      </div>
    </div>
  )
}
