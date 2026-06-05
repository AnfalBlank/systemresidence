import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { api } from '@/lib/api'
import { useApp } from '@/context/AppContext'
import type {
  ChatUnreadSummary,
  Notification,
  NotificationListResponse,
} from '@/types/notification'

interface NotificationState {
  notifications: Notification[]
  unread: number
  chatUnread: ChatUnreadSummary
  refresh: () => Promise<void>
  markRead: (id: string) => Promise<void>
  markAllRead: () => Promise<void>
  deleteOne: (id: string) => Promise<void>
  clearAll: () => Promise<void>
}

const NotificationContext = createContext<NotificationState | undefined>(undefined)

const POLL_MS = 15_000

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useApp()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unread, setUnread] = useState(0)
  const [chatUnread, setChatUnread] = useState<ChatUnreadSummary>({
    groups: 0, private: 0, total: 0,
  })
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const refresh = useCallback(async () => {
    try {
      const [notif, chat] = await Promise.all([
        api.get<NotificationListResponse>('/notifications'),
        api.get<ChatUnreadSummary>('/chat/unread-summary'),
      ])
      setNotifications(notif.items)
      setUnread(notif.unread)
      setChatUnread(chat)
    } catch {
      // silent — keep old state on transient errors
    }
  }, [])

  useEffect(() => {
    if (!isAuthenticated) {
      setNotifications([])
      setUnread(0)
      setChatUnread({ groups: 0, private: 0, total: 0 })
      if (intervalRef.current) clearInterval(intervalRef.current)
      return
    }
    refresh()
    intervalRef.current = setInterval(refresh, POLL_MS)
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [isAuthenticated, refresh])

  // Refresh when window regains focus
  useEffect(() => {
    if (!isAuthenticated) return
    const onFocus = () => refresh()
    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  }, [isAuthenticated, refresh])

  const markRead = async (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    )
    setUnread((u) => Math.max(0, u - 1))
    try { await api.post(`/notifications/${id}/read`) } catch { refresh() }
  }

  const markAllRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
    setUnread(0)
    try { await api.post('/notifications/read-all') } catch { refresh() }
  }

  const deleteOne = async (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id))
    try { await api.delete(`/notifications/${id}`) } catch { refresh() }
  }

  const clearAll = async () => {
    setNotifications([])
    setUnread(0)
    try { await api.delete('/notifications') } catch { refresh() }
  }

  return (
    <NotificationContext.Provider
      value={{ notifications, unread, chatUnread, refresh, markRead, markAllRead, deleteOne, clearAll }}
    >
      {children}
    </NotificationContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useNotifications(): NotificationState {
  const ctx = useContext(NotificationContext)
  if (!ctx) throw new Error('useNotifications must be used within NotificationProvider')
  return ctx
}
