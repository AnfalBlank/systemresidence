import { Link } from 'react-router-dom'
import { Users, ChevronRight } from 'lucide-react'
import { useApiQuery } from '@/hooks/useApi'
import { api } from '@/lib/api'
import { getIcon } from '@/lib/icons'
import type { ChatGroup } from '@/types'
import PageHeader from '@/components/ui/PageHeader'

export default function Community() {
  const { data } = useApiQuery<ChatGroup[]>(() => api.get<ChatGroup[]>('/chat/groups'))

  const groups = data ?? []

  return (
    <div>
      <PageHeader title="Grup Komunitas" subtitle="Gabung dan ikuti aktivitas kelompok warga" />

      {groups.filter((g) => g.isMain).map((g) => {
        const MainIcon = getIcon(g.iconKey)
        return (
          <Link
            key={g.id}
            to="/chat"
            className="mb-lg flex items-center gap-base rounded-md bg-ink p-base text-white transition-transform active:scale-[0.99]"
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/15">
              <MainIcon className="h-7 w-7" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-title-md">{g.nama}</p>
              <p className="mt-xxs text-body-sm text-white/80">
                {g.anggota} anggota · Semua warga otomatis bergabung
              </p>
            </div>
            <ChevronRight className="h-5 w-5 shrink-0" />
          </Link>
        )
      })}

      <h2 className="mb-md flex items-center gap-sm text-title-md text-ink">
        <Users className="h-5 w-5" /> Grup Berdasarkan Minat
      </h2>

      <div className="grid grid-cols-1 gap-base sm:grid-cols-2 desktop:grid-cols-3">
        {groups.filter((g) => !g.isMain).map((g) => {
          const GroupIcon = getIcon(g.iconKey)
          return (
            <Link key={g.id} to="/chat" className="card flex items-center gap-md p-base transition-shadow hover:shadow-float">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-surface-soft">
                <GroupIcon className="h-6 w-6 text-ink" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-title-sm text-ink">{g.nama}</p>
                <p className="truncate text-body-sm text-muted">{g.deskripsi}</p>
                <p className="mt-xxs text-caption-sm text-muted-soft">{g.anggota} anggota</p>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
