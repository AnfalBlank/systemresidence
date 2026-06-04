import { useState } from 'react'
import {
  Megaphone,
  Users,
  Building2,
  Layers,
  Home,
  Check,
  Send,
} from 'lucide-react'
import { useApiQuery } from '@/hooks/useApi'
import { api, ApiError } from '@/lib/api'
import PageHeader from '@/components/ui/PageHeader'

type Target = 'Seluruh Warga' | 'Blok' | 'Lantai' | 'Unit' | 'Kelompok'

const targets: { value: Target; icon: typeof Users; desc: string }[] = [
  { value: 'Seluruh Warga', icon: Users, desc: 'Kirim ke semua warga aktif' },
  { value: 'Blok', icon: Building2, desc: 'Pilih blok tertentu (A, B, C)' },
  { value: 'Lantai', icon: Layers, desc: 'Pilih lantai tertentu' },
  { value: 'Unit', icon: Home, desc: 'Kirim ke unit spesifik' },
  { value: 'Kelompok', icon: Users, desc: 'Grup komunitas tertentu' },
]

interface Broadcast {
  id: string
  judul: string
  pesan: string
  target: string
  waktu: string
}

const bloks = ['A', 'B', 'C']
const lantais = ['01', '02', '03', '04', '05']
const kelompoks = ['PKK', 'Karang Taruna', 'Bank Sampah', 'Pengajian', 'UMKM']

export default function Broadcast() {
  const { data, refetch } = useApiQuery<Broadcast[]>(() => api.get<Broadcast[]>('/broadcast'))
  const [target, setTarget] = useState<Target>('Seluruh Warga')
  const [blok, setBlok] = useState('A')
  const [lantai, setLantai] = useState('01')
  const [unit, setUnit] = useState('')
  const [kelompok, setKelompok] = useState('PKK')
  const [judul, setJudul] = useState('')
  const [pesan, setPesan] = useState('')
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')

  const getTargetValue = () => {
    if (target === 'Blok') return blok
    if (target === 'Lantai') return lantai
    if (target === 'Unit') return unit
    if (target === 'Kelompok') return kelompok
    return null
  }

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!judul.trim() || !pesan.trim()) return
    try {
      await api.post('/broadcast', {
        judul: judul.trim(),
        pesan: pesan.trim(),
        targetType: target,
        targetValue: getTargetValue(),
      })
      setJudul('')
      setPesan('')
      setSuccess(`Broadcast berhasil dikirim.`)
      setTimeout(() => setSuccess(''), 3000)
      await refetch()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Gagal mengirim.')
    }
  }

  return (
    <div>
      <PageHeader title="Broadcast Center" subtitle="Kirim pengumuman ke warga berdasarkan segmen" />

      <div className="grid gap-lg desktop:grid-cols-2">
        <div>
          <h2 className="mb-md text-title-md text-ink">Buat Broadcast</h2>
          <form onSubmit={handleSend} className="space-y-base">
            <div>
              <label className="field-label">Kirim Ke</label>
              <div className="space-y-sm">
                {targets.map((t) => (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => setTarget(t.value)}
                    className={`flex w-full items-center gap-md rounded-sm border px-base py-md text-left transition-colors ${target === t.value ? 'border-ink bg-surface-soft' : 'border-hairline hover:border-ink'}`}
                  >
                    <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${target === t.value ? 'bg-ink text-white' : 'bg-surface-strong text-muted'}`}>
                      <t.icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <p className="text-title-sm text-ink">{t.value}</p>
                      <p className="text-caption-sm text-muted">{t.desc}</p>
                    </div>
                    {target === t.value && <Check className="h-5 w-5 shrink-0 text-ink" />}
                  </button>
                ))}
              </div>
            </div>

            {target === 'Blok' && (
              <div>
                <label className="field-label">Pilih Blok</label>
                <div className="flex gap-sm">
                  {bloks.map((b) => (
                    <button key={b} type="button" onClick={() => setBlok(b)} className={`flex-1 rounded-sm border py-md text-button-md font-semibold transition-colors ${blok === b ? 'border-ink bg-ink text-white' : 'border-hairline text-ink'}`}>
                      {b}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {target === 'Lantai' && (
              <div>
                <label className="field-label">Pilih Lantai</label>
                <div className="flex flex-wrap gap-sm">
                  {lantais.map((l) => (
                    <button key={l} type="button" onClick={() => setLantai(l)} className={`rounded-sm border px-base py-md text-button-sm font-medium transition-colors ${lantai === l ? 'border-ink bg-ink text-white' : 'border-hairline text-ink'}`}>
                      Lt. {l}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {target === 'Unit' && (
              <div>
                <label htmlFor="unit-input" className="field-label">Nomor Unit</label>
                <input id="unit-input" value={unit} onChange={(e) => setUnit(e.target.value)} className="field-input" placeholder="Contoh: B-04-12" />
              </div>
            )}

            {target === 'Kelompok' && (
              <div>
                <label className="field-label">Pilih Kelompok</label>
                <div className="flex flex-wrap gap-sm">
                  {kelompoks.map((k) => (
                    <button key={k} type="button" onClick={() => setKelompok(k)} className={`rounded-full border px-base py-sm text-button-sm font-medium transition-colors ${kelompok === k ? 'border-ink bg-ink text-white' : 'border-hairline text-ink'}`}>
                      {k}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div>
              <label htmlFor="bc-judul" className="field-label">Judul</label>
              <input id="bc-judul" value={judul} onChange={(e) => setJudul(e.target.value)} className="field-input" placeholder="Judul pengumuman" />
            </div>

            <div>
              <label htmlFor="bc-pesan" className="field-label">Pesan</label>
              <textarea id="bc-pesan" value={pesan} onChange={(e) => setPesan(e.target.value)} rows={4} className="field-input resize-none py-md" placeholder="Tulis isi broadcast..." />
            </div>

            {success && (
              <div className="flex items-center gap-sm rounded-sm bg-success-soft p-md text-body-sm text-success">
                <Check className="h-4 w-4 shrink-0" />
                {success}
              </div>
            )}
            {error && <p className="text-body-sm text-primary-error">{error}</p>}

            <button type="submit" className="btn-primary w-full">
              <Send className="h-4 w-4" /> Kirim Broadcast
            </button>
          </form>
        </div>

        <div>
          <h2 className="mb-md text-title-md text-ink">Riwayat Broadcast</h2>
          {(data ?? []).length === 0 ? (
            <div className="rounded-md border border-dashed border-hairline py-section text-center">
              <Megaphone className="mx-auto h-8 w-8 text-muted" />
              <p className="mt-sm text-body-sm text-muted">Belum ada broadcast dikirim</p>
            </div>
          ) : (
            <div className="space-y-base">
              {(data ?? []).map((b) => (
                <div key={b.id} className="card p-base">
                  <div className="flex items-start justify-between gap-base">
                    <div className="flex items-center gap-sm">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-soft">
                        <Megaphone className="h-4 w-4 text-ink" />
                      </div>
                      <div>
                        <p className="text-title-sm text-ink">{b.judul}</p>
                        <p className="text-caption-sm text-muted">{b.target} · {b.waktu}</p>
                      </div>
                    </div>
                  </div>
                  <p className="mt-sm text-body-sm text-body">{b.pesan}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
