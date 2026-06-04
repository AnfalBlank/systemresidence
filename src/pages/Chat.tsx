import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  Search,
  Users,
  ArrowLeft,
  Send,
  Paperclip,
  Mic,
  Pin,
} from 'lucide-react'
import { useApiQuery } from '@/hooks/useApi'
import { api } from '@/lib/api'
import { getIcon } from '@/lib/icons'
import type { ChatGroup, ChatMessage, PrivateChat } from '@/types'
import Avatar from '@/components/ui/Avatar'

type Tab = 'private' | 'group'

interface ActiveConversation {
  id: string
  nama: string
  subtitle: string
  isGroup: boolean
}

export default function Chat() {
  const [searchParams, setSearchParams] = useSearchParams()
  const { data: groups } = useApiQuery<ChatGroup[]>(() => api.get<ChatGroup[]>('/chat/groups'))
  const { data: privateChats, refetch: refetchPrivate } = useApiQuery<PrivateChat[]>(
    () => api.get<PrivateChat[]>('/chat/private')
  )

  const [tab, setTab] = useState<Tab>('group')
  const [active, setActive] = useState<ActiveConversation | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [draft, setDraft] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<{ id: string; nama: string; unit: string }[]>([])
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Deep-link: open a private chat when ?peer= is provided (from Marketplace, Skills, UMKM)
  useEffect(() => {
    const peer = searchParams.get('peer')
    if (peer) {
      const nama = searchParams.get('nama') ?? 'Warga'
      const unit = searchParams.get('unit') ?? ''
      setActive({
        id: peer,
        nama,
        subtitle: unit ? `Unit ${unit}` : '',
        isGroup: false,
      })
      setTab('private')
      // Clear params so back button works naturally
      setSearchParams({}, { replace: true })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Load messages when active changes, and poll every 3s
  useEffect(() => {
    if (!active) return
    let cancelled = false
    const loadMessages = async () => {
      const path = active.isGroup
        ? `/chat/groups/${active.id}/messages`
        : `/chat/private/${active.id}/messages`
      const data = await api.get<ChatMessage[]>(path)
      if (!cancelled) setMessages(data)
    }
    loadMessages()
    const interval = setInterval(loadMessages, 3000)
    return () => { cancelled = true; clearInterval(interval) }
  }, [active])

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Search residents to start a new private chat
  useEffect(() => {
    if (searchQuery.length < 2) { setSearchResults([]); return }
    let cancelled = false
    const t = setTimeout(async () => {
      try {
        const res = await api.get<{ id: string; nama: string; unit: string }[]>('/chat/search', { query: { q: searchQuery } })
        if (!cancelled) setSearchResults(res)
      } catch { /* ignore */ }
    }, 250)
    return () => { cancelled = true; clearTimeout(t) }
  }, [searchQuery])

  const send = async () => {
    if (!draft.trim() || !active) return
    const text = draft.trim()
    setDraft('')
    const path = active.isGroup
      ? `/chat/groups/${active.id}/messages`
      : `/chat/private/${active.id}/messages`
    await api.post(path, { isi: text })
    // Refresh messages
    const data = await api.get<ChatMessage[]>(path)
    setMessages(data)
    if (!active.isGroup) await refetchPrivate()
  }

  // Conversation view
  if (active) {
    return (
      <div className="fixed inset-0 z-40 flex flex-col bg-canvas desktop:static desktop:z-auto desktop:h-[calc(100vh-10rem)] desktop:rounded-md desktop:border desktop:border-hairline">
        <div className="flex items-center gap-md border-b border-hairline px-base py-md">
          <button onClick={() => setActive(null)} aria-label="Kembali" className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-surface-soft">
            <ArrowLeft className="h-5 w-5 text-ink" />
          </button>
          {active.isGroup ? (
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-strong">
              <Users className="h-5 w-5 text-ink" />
            </div>
          ) : (
            <Avatar name={active.nama} size="md" />
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-title-sm text-ink">{active.nama}</p>
            <p className="truncate text-caption-sm text-muted">{active.subtitle}</p>
          </div>
        </div>

        {active.isGroup && (
          <div className="flex items-center gap-sm border-b border-hairline-soft bg-surface-soft px-base py-sm">
            <Pin className="h-4 w-4 text-muted" />
            <p className="truncate text-caption-sm text-muted">
              Selamat datang di grup. Mohon jaga kesopanan dalam berkomunikasi.
            </p>
          </div>
        )}

        <div className="flex-1 space-y-md overflow-y-auto px-base py-base">
          {messages.length === 0 ? (
            <p className="text-center text-body-sm text-muted">Belum ada pesan. Mulai percakapan!</p>
          ) : (
            messages.map((m) => (
              <div key={m.id} className={`flex ${m.isMe ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] ${m.isMe ? 'items-end' : ''}`}>
                  {!m.isMe && (
                    <p className="mb-xxs px-xs text-caption-sm text-muted">
                      {m.pengirim}
                      {m.unit && <span className="text-muted-soft"> · {m.unit}</span>}
                    </p>
                  )}
                  <div className={`rounded-md px-md py-sm text-body-md ${m.isMe ? 'rounded-br-xs bg-primary text-white' : 'rounded-bl-xs bg-surface-strong text-ink'}`}>
                    {m.isi}
                  </div>
                  <p className={`mt-xxs px-xs text-caption-sm text-muted ${m.isMe ? 'text-right' : ''}`}>
                    {m.waktu}
                  </p>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        <div
          className="flex items-center gap-sm border-t border-hairline px-base py-sm"
          style={{ paddingBottom: 'calc(0.5rem + var(--safe-bottom))' }}
        >
          <button aria-label="Lampiran" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full hover:bg-surface-soft">
            <Paperclip className="h-5 w-5 text-muted" />
          </button>
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && send()}
            placeholder="Tulis pesan..."
            className="h-11 flex-1 rounded-full bg-surface-soft px-base text-body-md text-ink placeholder:text-muted-soft focus:outline-none"
          />
          {draft.trim() ? (
            <button onClick={send} aria-label="Kirim" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary text-white active:bg-primary-active">
              <Send className="h-5 w-5" />
            </button>
          ) : (
            <button aria-label="Voice note" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-surface-strong text-ink">
              <Mic className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-lg">
        <h1 className="text-display-lg text-ink">Chat</h1>
        <p className="mt-xxs text-body-sm text-muted">Pesan pribadi dan grup komunitas warga</p>
      </div>

      <div className="mb-base flex items-center gap-sm rounded-full border border-hairline bg-canvas px-base">
        <Search className="h-5 w-5 text-muted" />
        <input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Cari warga untuk chat baru..."
          className="h-12 flex-1 bg-transparent text-body-md text-ink placeholder:text-muted-soft focus:outline-none"
        />
      </div>

      {searchResults.length > 0 && (
        <div className="card mb-base divide-y divide-hairline-soft">
          {searchResults.map((r) => (
            <button
              key={r.id}
              onClick={() => {
                setActive({ id: r.id, nama: r.nama, subtitle: `Unit ${r.unit}`, isGroup: false })
                setSearchQuery('')
                setSearchResults([])
              }}
              className="flex w-full items-center gap-md px-base py-md text-left transition-colors hover:bg-surface-soft"
            >
              <Avatar name={r.nama} size="md" />
              <div>
                <p className="text-title-sm text-ink">{r.nama}</p>
                <p className="text-caption-sm text-muted">Unit {r.unit}</p>
              </div>
            </button>
          ))}
        </div>
      )}

      <div className="mb-base flex border-b border-hairline">
        <TabButton active={tab === 'group'} onClick={() => setTab('group')} label="Grup Komunitas" />
        <TabButton active={tab === 'private'} onClick={() => setTab('private')} label="Pesan Pribadi" />
      </div>

      {tab === 'private' ? (
        <div className="card divide-y divide-hairline-soft">
          {(privateChats ?? []).length === 0 && (
            <p className="px-base py-lg text-center text-body-sm text-muted">
              Belum ada chat pribadi. Cari warga di atas untuk memulai.
            </p>
          )}
          {(privateChats ?? []).map((c) => (
            <button
              key={c.id}
              onClick={() => setActive({ id: c.id, nama: c.nama, subtitle: `Unit ${c.unit}${c.online ? ' · Online' : ''}`, isGroup: false })}
              className="flex w-full items-center gap-md px-base py-md text-left transition-colors hover:bg-surface-soft"
            >
              <div className="relative">
                <Avatar name={c.nama} src={c.foto} size="md" />
                {c.online && <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-canvas bg-success" />}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-sm">
                  <p className="truncate text-title-sm text-ink">{c.nama}</p>
                  <span className="shrink-0 text-caption-sm text-muted">{c.lastTime}</span>
                </div>
                <p className="truncate text-body-sm text-muted">{c.lastMessage}</p>
              </div>
            </button>
          ))}
        </div>
      ) : (
        <div className="card divide-y divide-hairline-soft">
          {(groups ?? []).map((g) => {
            const GroupIcon = getIcon(g.iconKey)
            return (
              <button
                key={g.id}
                onClick={() => setActive({ id: g.id, nama: g.nama, subtitle: `${g.anggota} anggota`, isGroup: true })}
                className="flex w-full items-center gap-md px-base py-md text-left transition-colors hover:bg-surface-soft"
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-surface-soft">
                  <GroupIcon className="h-5 w-5 text-ink" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-sm">
                    <p className="truncate text-title-sm text-ink">
                      {g.nama}
                      {g.isMain && (
                        <span className="ml-xs rounded-full bg-primary-disabled px-xs py-xxs text-uppercase-tag uppercase text-primary-error">
                          Utama
                        </span>
                      )}
                    </p>
                    <span className="shrink-0 text-caption-sm text-muted">{g.lastTime}</span>
                  </div>
                  <p className="truncate text-body-sm text-muted">{g.lastMessage}</p>
                </div>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

function TabButton({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
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
