import { Link, useNavigate } from 'react-router-dom'
import { ShieldAlert, LogOut } from 'lucide-react'
import { useApp } from '@/context/AppContext'
import { unitToString } from '@/lib/format'
import type { Role } from '@/types'
import Avatar from '@/components/ui/Avatar'
import Logo from '@/components/layout/Logo'
import NotificationBell from '@/components/layout/NotificationBell'

const roleLabels: Record<Role, string> = {
  warga: 'Warga',
  pengelola: 'Pengelola',
  petugas_keuangan: 'Petugas Keuangan',
  petugas_keamanan: 'Petugas Keamanan',
  super_admin: 'Super Admin',
}

export default function TopBar() {
  const { user, logout } = useApp()
  const navigate = useNavigate()

  return (
    <header className="sticky top-0 z-20 border-b border-hairline bg-canvas/95 backdrop-blur">
      <div className="flex h-16 items-center justify-between gap-base px-base desktop:h-20 desktop:px-lg">
        <div className="desktop:hidden">
          <Logo compact />
        </div>

        <div className="hidden desktop:block">
          {user && (
            <div>
              <p className="text-title-md text-ink">
                Halo, {user.nama.split(' ')[0]}
              </p>
              <p className="text-body-sm text-muted">
                {roleLabels[user.role]} · Unit {unitToString(user.unit)} · {user.status}
              </p>
            </div>
          )}
        </div>

        <div className="flex items-center gap-sm">
          <Link
            to="/panic"
            className="flex items-center gap-xs rounded-full bg-primary px-md py-xs text-button-sm font-medium text-white transition-colors active:bg-primary-active"
            aria-label="Panic Button darurat"
          >
            <ShieldAlert className="h-4 w-4" />
            <span className="hidden sm:inline">Darurat</span>
          </Link>

          <NotificationBell />

          <Link to="/profil" aria-label="Profil">
            {user && <Avatar name={user.nama} src={user.foto} size="md" />}
          </Link>

          <button
            onClick={() => { logout(); navigate('/login') }}
            className="hidden h-10 w-10 items-center justify-center rounded-full border border-hairline transition-colors hover:bg-surface-soft desktop:flex"
            aria-label="Keluar"
          >
            <LogOut className="h-5 w-5 text-ink" />
          </button>
        </div>
      </div>
    </header>
  )
}
