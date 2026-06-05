import { useState } from 'react'
import { Vote as VoteIcon, Check, Clock, Info, Plus, X, Trash2, Lock } from 'lucide-react'
import { useApiQuery } from '@/hooks/useApi'
import { api, ApiError } from '@/lib/api'
import { useApp } from '@/context/AppContext'
import { formatDate } from '@/lib/format'
import type { Voting as VotingItem, VoteType } from '@/types'
import PageHeader from '@/components/ui/PageHeader'
import StatusChip from '@/components/ui/StatusChip'
import Modal from '@/components/ui/Modal'
import ConfirmDialog from '@/components/ui/ConfirmDialog'

const voteTypes: VoteType[] = ['Pemilihan Ketua', 'Musyawarah', 'Persetujuan Program']

export default function Voting() {
  const { user } = useApp()
  const canManage = user && ['super_admin', 'pengelola'].includes(user.role)
  const { data, refetch } = useApiQuery<VotingItem[]>(() => api.get<VotingItem[]>('/voting'))
  const [active, setActive] = useState<VotingItem | null>(null)
  const [choice, setChoice] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [createOpen, setCreateOpen] = useState(false)
  const [createForm, setCreateForm] = useState({
    judul: '', tipe: 'Musyawarah' as VoteType, deskripsi: '', berakhir: '', opsi: ['', ''],
  })
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const votings = data ?? []

  const openVote = (v: VotingItem) => { setActive(v); setChoice(null); setError('') }

  const closeVoting = async (id: string) => {
    await api.patch(`/voting/${id}/close`)
    await refetch()
  }

  const handleDelete = async () => {
    if (!deleteId) return
    await api.delete(`/voting/${deleteId}`)
    setDeleteId(null)
    await refetch()
  }

  const submitVote = async () => {
    if (!active || !choice) return
    setError('')
    try {
      await api.post(`/voting/${active.id}/vote`, { optionId: choice })
      setActive(null)
      setChoice(null)
      await refetch()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Gagal mengirim suara.')
    }
  }

  const submitCreate = async () => {
    const opsiClean = createForm.opsi.map((o) => o.trim()).filter(Boolean)
    if (opsiClean.length < 2 || !createForm.judul.trim() || !createForm.berakhir) return
    try {
      await api.post('/voting', {
        judul: createForm.judul.trim(),
        tipe: createForm.tipe,
        deskripsi: createForm.deskripsi.trim(),
        berakhir: createForm.berakhir,
        opsi: opsiClean,
      })
      setCreateForm({ judul: '', tipe: 'Musyawarah', deskripsi: '', berakhir: '', opsi: ['', ''] })
      setCreateOpen(false)
      await refetch()
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <div>
      <PageHeader
        title="E-Voting"
        subtitle="Satu unit, satu suara. Suara Anda menentukan."
        action={
          canManage ? (
            <button onClick={() => setCreateOpen(true)} className="btn-primary px-base">
              <Plus className="h-4 w-4" /><span className="hidden sm:inline">Buat Voting</span>
            </button>
          ) : undefined
        }
      />

      <div className="mb-lg flex items-start gap-sm rounded-md bg-info-soft p-base">
        <Info className="h-5 w-5 shrink-0 text-info" />
        <p className="text-body-sm text-body">
          Berlaku aturan <strong>1 Unit = 1 Suara</strong>. Pastikan pilihan Anda sudah benar.
        </p>
      </div>

      <div className="space-y-base">
        {votings.map((v) => {
          const showResult = v.sudahMemilih || v.status === 'Selesai'
          return (
            <article key={v.id} className="card p-base">
              <div className="flex items-start justify-between gap-base">
                <div className="min-w-0">
                  <span className="text-caption-sm text-muted">{v.tipe}</span>
                  <h3 className="mt-xxs text-title-md text-ink">{v.judul}</h3>
                </div>
                <StatusChip label={v.status} tone={v.status === 'Berlangsung' ? 'success' : 'neutral'} />
              </div>
              <p className="mt-xs text-body-sm text-body">{v.deskripsi}</p>

              <div className="mt-md flex items-center gap-md text-caption-sm text-muted">
                <span className="flex items-center gap-xxs">
                  <Clock className="h-4 w-4" />
                  {v.status === 'Berlangsung' ? `Berakhir ${formatDate(v.berakhir)}` : `Selesai ${formatDate(v.berakhir)}`}
                </span>
                <span>{v.totalSuara} suara</span>
              </div>

              {showResult ? (
                <div className="mt-base space-y-sm">
                  {v.opsi.map((o) => {
                    const pct = v.totalSuara ? Math.round((o.suara / v.totalSuara) * 100) : 0
                    return (
                      <div key={o.id}>
                        <div className="mb-xxs flex items-center justify-between text-body-sm">
                          <span className="text-ink">{o.label}</span>
                          <span className="font-semibold text-ink">{pct}%</span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-surface-strong">
                          <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    )
                  })}
                  {v.sudahMemilih && (
                    <p className="flex items-center gap-xs pt-xs text-caption-sm text-success">
                      <Check className="h-4 w-4" /> Anda sudah memberikan suara
                    </p>
                  )}
                </div>
              ) : (
                <button onClick={() => openVote(v)} className="btn-primary mt-base w-full">
                  <VoteIcon className="h-4 w-4" /> Beri Suara
                </button>
              )}

              {canManage && (
                <div className="mt-sm flex gap-xs border-t border-hairline-soft pt-sm">
                  {v.status === 'Berlangsung' && (
                    <button onClick={() => closeVoting(v.id)} className="flex flex-1 items-center justify-center gap-xxs rounded-sm py-xs text-caption-sm text-muted hover:bg-surface-soft hover:text-ink">
                      <Lock className="h-3.5 w-3.5" /> Tutup Voting
                    </button>
                  )}
                  <button onClick={() => setDeleteId(v.id)} className="flex flex-1 items-center justify-center gap-xxs rounded-sm py-xs text-caption-sm text-muted hover:bg-surface-soft hover:text-primary-error">
                    <Trash2 className="h-3.5 w-3.5" /> Hapus
                  </button>
                </div>
              )}
            </article>
          )
        })}
        {votings.length === 0 && (
          <p className="py-section text-center text-body-md text-muted">Belum ada voting.</p>
        )}
      </div>

      <Modal
        open={!!active}
        onClose={() => setActive(null)}
        title="Beri Suara"
        footer={
          <button onClick={submitVote} disabled={!choice} className="btn-primary w-full">Kirim Suara</button>
        }
      >
        {active && (
          <div>
            <h3 className="text-title-md text-ink">{active.judul}</h3>
            <p className="mt-xxs text-body-sm text-muted">{active.deskripsi}</p>
            <div className="mt-base space-y-sm">
              {active.opsi.map((o) => (
                <button
                  key={o.id}
                  onClick={() => setChoice(o.id)}
                  className={`flex w-full items-center justify-between rounded-md border px-base py-md text-left transition-colors ${
                    choice === o.id ? 'border-primary bg-primary-disabled/30' : 'border-hairline hover:border-ink'
                  }`}
                >
                  <span className="text-body-md text-ink">{o.label}</span>
                  <span
                    className={`flex h-5 w-5 items-center justify-center rounded-full border ${
                      choice === o.id ? 'border-primary bg-primary text-white' : 'border-border-strong'
                    }`}
                  >
                    {choice === o.id && <Check className="h-3 w-3" />}
                  </span>
                </button>
              ))}
            </div>
            {error && <p className="mt-sm text-body-sm text-primary-error">{error}</p>}
          </div>
        )}
      </Modal>

      {/* Create voting modal */}
      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Buat Voting"
        footer={<button onClick={submitCreate} className="btn-primary w-full">Publikasikan</button>}
      >
        <div className="space-y-base">
          <div>
            <label className="field-label">Judul</label>
            <input value={createForm.judul} onChange={(e) => setCreateForm({ ...createForm, judul: e.target.value })} className="field-input" />
          </div>
          <div>
            <label className="field-label">Tipe</label>
            <div className="grid grid-cols-3 gap-sm">
              {voteTypes.map((t) => (
                <button key={t} type="button" onClick={() => setCreateForm({ ...createForm, tipe: t })} className={`rounded-sm border px-sm py-md text-button-sm font-medium transition-colors ${createForm.tipe === t ? 'border-ink bg-ink text-white' : 'border-hairline text-ink'}`}>
                  {t}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="field-label">Deskripsi</label>
            <textarea value={createForm.deskripsi} onChange={(e) => setCreateForm({ ...createForm, deskripsi: e.target.value })} rows={2} className="field-input resize-none py-md" />
          </div>
          <div>
            <label className="field-label">Tanggal Berakhir</label>
            <input type="date" value={createForm.berakhir} onChange={(e) => setCreateForm({ ...createForm, berakhir: e.target.value })} className="field-input" />
          </div>
          <div>
            <label className="field-label">Pilihan (minimal 2)</label>
            <div className="space-y-sm">
              {createForm.opsi.map((o, i) => (
                <div key={i} className="flex gap-sm">
                  <input
                    value={o}
                    onChange={(e) => {
                      const next = [...createForm.opsi]
                      next[i] = e.target.value
                      setCreateForm({ ...createForm, opsi: next })
                    }}
                    className="field-input flex-1"
                    placeholder={`Pilihan ${i + 1}`}
                  />
                  {createForm.opsi.length > 2 && (
                    <button
                      type="button"
                      onClick={() => setCreateForm({ ...createForm, opsi: createForm.opsi.filter((_, j) => j !== i) })}
                      className="flex h-14 w-14 items-center justify-center rounded-sm border border-hairline"
                      aria-label="Hapus"
                    >
                      <X className="h-4 w-4 text-muted" />
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={() => setCreateForm({ ...createForm, opsi: [...createForm.opsi, ''] })}
                className="btn-secondary w-full"
              >
                <Plus className="h-4 w-4" /> Tambah Pilihan
              </button>
            </div>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleteId}
        title="Hapus Voting?"
        message="Voting beserta seluruh suara yang masuk akan dihapus permanen."
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  )
}
