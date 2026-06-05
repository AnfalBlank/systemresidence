import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Bell,
  Megaphone,
  HeartHandshake,
  CalendarDays,
  Wallet,
  ShieldAlert,
  CalendarCheck,
  FileWarning,
  Radio,
  HandCoins,
  DoorOpen,
  MessageCircle,
  CheckCheck,
  Trash2,
  Inbox,
} from 'lucide-react'
import { useNotifications } from '@/context/NotificationContext'
import type { Notification, NotificationType } from '@/types/notification'

const iconFor: Record<NotificationType, typeof Bell> = {
  announcement: Megaphone,
  obituary: HeartHandshake,
  event: CalendarDays,
  dues_new: Wallet,
  dues_verified: Wallet,
  dues_rejected: Wallet,
  panic: ShieldAlert,
  booking_approved: CalendarCheck,
  booking_rejected: CalendarCheck,
  complaint_update: FileWarning,
  broadcast: Radio,
  campaign: HandCoins,
  visitor_status: DoorOpen,
  chat_private: MessageCircle,
  chat_group: MessageCircle,
}

const toneFor: Record<NotificationType, string> = {
  announcement: 'bg-info-soft text-info',
  obituary: 'bg-surface-strong text-ink',
  event: 'bg-info-soft text-info',
  dues_new: 'bg-warning-soft text-warning',
  dues_verified: 'bg-success-soft text-success',
  dues_rejected: 'bg-primary-disabled text-primary-error',
  panic: 'bg-primary-disabled text-primary-error',
  booking_approved: 'bg-success-soft text-success',
  booking_rejected: 'bg-primary-disabled text-primary-error',
  complaint_update: 'bg-warning-soft text-warning',
  broadcast: 'bg-info-soft text-info',
  campaign: 'bg-info-soft text-info',
  visitor_status: 'bg-info-soft text-info',
  chat_private: 'bg-info-soft text-info',
  chat_group: 'bg-info-soft text-info',
}

export default function NotificationBell() {
  const { notifications, unread, markRead, markAllRead, deleteOne, clearAll } = useNotifications()
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [open])

  const handleClick = async (n: Notification) => {
    setOpen(false)
    if (!n.read) await markRead(n.id)
    if (n.link) navigate(n.link)
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative flex h-10 w-10 items-center justify-center rounded-full border border-hairline transition-colors hover:bg-surface-soft"
        aria-label={`Notifikasi${unread > 0 ? ` (${unread} baru)` : ''}`}
      >
        <Bell className="h-5 w-5 text-ink" />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-xs text-badge font-semibold text-white">
            {unread > 99 ? '99+' : unread}
          </span>
        )}
      </button>

      {open && (
        <>
          {/* Mobile sheet from bottom; desktop dropdown */}
          <div className="fixed inset-0 z-40 desktop:hidden" onClick={() => setOpen(false)} />
          <div className="fixed bottom-0 left-0 right-0 z-50 max-h-[80vh] overflow-hidden rounded-t-lg bg-canvas shadow-float-lg desktop:absolute desktop:bottom-auto desktop:left-auto desktop:right-0 desktop:top-full desktop:mt-xs desktop:max-h-[28rem] desktop:w-96 desktop:rounded-md">
            <div className="flex items-center justify-between border-b border-hairline-soft px-base py-md">
              <p className="text-title-md text-ink">Notifikasi</p>
              <div className="flex items-center gap-xs">
                {unread > 0 && (
                  <button
                    onClick={() => markAllRead()}
                    className="flex items-center gap-xxs rounded-sm px-sm py-xs text-caption-sm text-muted hover:bg-surface-soft hover:text-ink"
                    aria-label="Tandai semua dibaca"
                  >
                    <CheckCheck className="h-3.5 w-3.5" /> Tandai dibaca
                  </button>
                )}
                {notifications.length > 0 && (
                  <button
                    onClick={() => clearAll()}
                    className="flex items-center gap-xxs rounded-sm px-sm py-xs text-caption-sm text-muted hover:bg-surface-soft hover:text-primary-error"
                    aria-label="Hapus semua"
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Hapus
                  </button>
                )}
              </div>
            </div>

            <div className="max-h-[60vh] overflow-y-auto desktop:max-h-80">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-xl text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-surface-soft">
                    <Inbox className="h-6 w-6 text-muted" />
                  </div>
                  <p className="mt-sm text-body-sm text-muted">Belum ada notifikasi</p>
                </div>
              ) : (
                <ul className="divide-y divide-hairline-soft">
                  {notifications.map((n) => {
                    const Icon = iconFor[n.type] ?? Bell
                    return (
                      <li key={n.id} className="group relative">
                        <button
                          onClick={() => handleClick(n)}
                          className={`flex w-full items-start gap-md px-base py-md text-left transition-colors hover:bg-surface-soft ${!n.read ? 'bg-info-soft/30' : ''}`}
                        >
                          <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${toneFor[n.type] ?? 'bg-surface-soft text-ink'}`}>
                            <Icon className="h-4 w-4" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-sm">
                              <p className={`truncate text-title-sm ${!n.read ? 'text-ink' : 'text-body'}`}>
                                {n.title}
                              </p>
                              {!n.read && <span className="mt-xs h-2 w-2 shrink-0 rounded-full bg-primary" />}
                            </div>
                            <p className="line-clamp-2 text-body-sm text-muted">{n.message}</p>
                            <p className="mt-xxs text-caption-sm text-muted-soft">{n.waktu}</p>
                          </div>
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); deleteOne(n.id) }}
                          className="absolute right-base top-1/2 hidden h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-muted hover:bg-canvas hover:text-primary-error group-hover:flex"
                          aria-label="Hapus notifikasi"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
