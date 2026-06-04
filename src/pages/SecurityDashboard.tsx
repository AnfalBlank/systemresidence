import { useState } from 'react'
import {
  ShieldAlert,
  HeartPulse,
  Flame,
  DoorOpen,
  Check,
  Clock,
  AlertTriangle,
  Search,
} from 'lucide-react'
import { useApiQuery } from '@/hooks/useApi'
import { api } from '@/lib/api'
import { formatDate } from '@/lib/format'
import type { PanicAlert, Visitor, VisitorStatus } from '@/types'
import PageHeader from '@/components/ui/PageHeader'
import StatusChip from '@/components/ui/StatusChip'
import Modal from '@/components/ui/Modal'

const panicIconMap = {
  Medis: HeartPulse,
  Kebakaran: Flame,
  Keamanan: ShieldAlert,
}

function panicTone(status: PanicAlert['status']) {
  return status === 'Aktif' ? 'danger' : status === 'Ditangani' ? 'warning' : 'neutral'
}
function visitorTone(status: VisitorStatus) {
  return status === 'Di Dalam' ? 'success' : status === 'Menunggu' ? 'warning' : 'neutral'
}

export default function SecurityDashboard() {
  const { data: alerts, refetch: refetchAlerts } = useApiQuery<PanicAlert[]>(() =>
    api.get<PanicAlert[]>('/panic')
  )
  const { data: visitors, refetch: refetchVisitors } = useApiQuery<Visitor[]>(() =>
    api.get<Visitor[]>('/visitors')
  )
  const [tab, setTab] = useState<'panic' | 'visitor'>('panic')
  const [pinModal, setPinModal] = useState(false)
  const [pinInput, setPinInput] = useState('')
  const [pinResult, setPinResult] = useState<Visitor | null>(null)
  const [pinError, setPinError] = useState('')

  const handleAlertStatus = async (id: string, next: PanicAlert['status']) => {
    await api.patch(`/panic/${id}/status`, { status: next })
    await refetchAlerts()
  }

  const handleVisitorStatus = async (id: string, next: VisitorStatus) => {
    await api.patch(`/visitors/${id}/status`, { status: next })
    await refetchVisitors()
  }

  const verifyPin = async () => {
    setPinError('')
    setPinResult(null)
    try {
      const v = await api.post<Visitor>('/visitors/verify-pin', { pin: pinInput })
      setPinResult(v)
    } catch {
      setPinError('PIN tidak ditemukan atau sudah selesai.')
    }
  }

  const activeAlerts = (alerts ?? []).filter((a) => a.status === 'Aktif')

  return (
    <div>
      <PageHeader
        title="Dashboard Keamanan"
        subtitle="Kelola panic alert dan kunjungan tamu"
        action={
          <button onClick={() => { setPinModal(true); setPinInput(''); setPinError(''); setPinResult(null) }} className="btn-secondary px-base">
            <Search className="h-4 w-4" /><span className="hidden sm:inline">Verifikasi PIN</span>
          </button>
        }
      />

      {activeAlerts.length > 0 && (
        <div className="mb-lg rounded-md border border-primary bg-primary-disabled/30 p-base">
          <div className="flex items-center gap-sm">
            <AlertTriangle className="h-5 w-5 text-primary-error" />
            <p className="text-title-sm text-primary-error">
              {activeAlerts.length} Panic Alert Aktif
            </p>
          </div>
          {activeAlerts.map((a) => (
            <div key={a.id} className="mt-sm flex items-center justify-between gap-base">
              <p className="text-body-sm text-ink">{a.jenis} — {a.nama} · Unit {a.unit}</p>
              <button onClick={() => handleAlertStatus(a.id, 'Ditangani')} className="btn-primary px-base py-sm text-button-sm">
                Tangani
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="mb-lg flex border-b border-hairline">
        <TabBtn active={tab === 'panic'} onClick={() => setTab('panic')} label="Panic Alerts" />
        <TabBtn active={tab === 'visitor'} onClick={() => setTab('visitor')} label="Tamu Masuk" />
      </div>

      {tab === 'panic' ? (
        <div className="space-y-base">
          {(alerts ?? []).map((a) => {
            const Icon = panicIconMap[a.jenis]
            return (
              <div key={a.id} className="card p-base">
                <div className="flex items-start justify-between gap-base">
                  <div className="flex items-center gap-md">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary-disabled">
                      <Icon className="h-5 w-5 text-primary-error" />
                    </div>
                    <div>
                      <p className="text-title-sm text-ink">{a.jenis}</p>
                      <p className="text-body-sm text-muted">{a.nama} · Unit {a.unit}</p>
                      <p className="mt-xxs flex items-center gap-xs text-caption-sm text-muted">
                        <Clock className="h-3.5 w-3.5" />
                        {new Date(a.waktu).toLocaleString('id-ID')}
                      </p>
                    </div>
                  </div>
                  <StatusChip label={a.status} tone={panicTone(a.status)} />
                </div>
                {a.status !== 'Selesai' && (
                  <div className="mt-md flex gap-sm border-t border-hairline-soft pt-md">
                    {a.status === 'Aktif' && (
                      <button onClick={() => handleAlertStatus(a.id, 'Ditangani')} className="btn-primary flex-1">
                        Tandai Ditangani
                      </button>
                    )}
                    <button onClick={() => handleAlertStatus(a.id, 'Selesai')} className="btn-secondary flex-1">
                      <Check className="h-4 w-4" /> Selesai
                    </button>
                  </div>
                )}
              </div>
            )
          })}
          {(alerts ?? []).length === 0 && (
            <div className="py-section text-center">
              <ShieldAlert className="mx-auto h-10 w-10 text-muted" />
              <p className="mt-sm text-body-md text-muted">Tidak ada panic alert</p>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-base">
          {(visitors ?? []).map((v) => (
            <div key={v.id} className="card p-base">
              <div className="flex items-start justify-between gap-base">
                <div className="flex items-start gap-md">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-surface-soft">
                    <DoorOpen className="h-5 w-5 text-ink" />
                  </div>
                  <div>
                    <p className="text-title-sm text-ink">{v.nama}</p>
                    <p className="text-body-sm text-muted">{v.keperluan}</p>
                    <p className="mt-xxs flex items-center gap-xs text-caption-sm text-muted">
                      <Clock className="h-3.5 w-3.5" />
                      {formatDate(v.tanggal)} · {v.jam} → Unit {v.tujuanUnit}
                    </p>
                    <p className="mt-xxs text-caption-sm text-muted">
                      PIN: <span className="font-semibold tracking-wider">{v.pin}</span>
                    </p>
                  </div>
                </div>
                <StatusChip label={v.status} tone={visitorTone(v.status)} />
              </div>
              <div className="mt-md flex gap-sm border-t border-hairline-soft pt-md">
                {v.status === 'Menunggu' && (
                  <button onClick={() => handleVisitorStatus(v.id, 'Di Dalam')} className="btn-primary flex-1">
                    Izinkan Masuk
                  </button>
                )}
                {v.status === 'Di Dalam' && (
                  <button onClick={() => handleVisitorStatus(v.id, 'Selesai')} className="btn-secondary flex-1">
                    <Check className="h-4 w-4" /> Check-Out
                  </button>
                )}
                {v.status === 'Selesai' && <p className="text-body-sm text-muted">Kunjungan selesai</p>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Verify PIN modal */}
      <Modal
        open={pinModal}
        onClose={() => setPinModal(false)}
        title="Verifikasi PIN Tamu"
        footer={
          <button onClick={verifyPin} className="btn-primary w-full">Cek PIN</button>
        }
      >
        <div className="space-y-base">
          <div>
            <label className="field-label">PIN Tamu (4 digit)</label>
            <input
              type="text"
              maxLength={4}
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value)}
              className="field-input text-center text-display-sm tracking-[0.5em]"
              placeholder="0000"
            />
          </div>
          {pinError && <p className="text-body-sm text-primary-error">{pinError}</p>}
          {pinResult && (
            <div className="rounded-md bg-success-soft p-base">
              <p className="text-title-sm text-success">PIN Valid</p>
              <p className="mt-xxs text-body-md text-ink">{pinResult.nama}</p>
              <p className="text-body-sm text-muted">{pinResult.keperluan}</p>
              <p className="mt-xs text-caption-sm text-muted">
                Tujuan: Unit {pinResult.tujuanUnit} · {formatDate(pinResult.tanggal)} {pinResult.jam}
              </p>
              {pinResult.status === 'Menunggu' && (
                <button
                  onClick={async () => {
                    await handleVisitorStatus(pinResult.id, 'Di Dalam')
                    setPinModal(false)
                  }}
                  className="btn-primary mt-md w-full"
                >
                  Izinkan Masuk
                </button>
              )}
            </div>
          )}
        </div>
      </Modal>
    </div>
  )
}

function TabBtn({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
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
