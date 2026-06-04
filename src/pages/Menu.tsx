import { Link, useNavigate } from 'react-router-dom'
import { ChevronRight, LogOut, ShieldAlert } from 'lucide-react'
import { navSections } from '@/config/nav'
import { useApp } from '@/context/AppContext'
import { unitToString } from '@/lib/format'
import type { Role } from '@/types'
import Avatar from '@/components/ui/Avatar'

const roleAllowList: Record<Role, string[]> = {
  warga: ['/feed', '/pengumuman', '/berita-duka', '/iuran', '/keuangan', '/crowdfunding', '/bank-sampah', '/marketplace', '/skill', '/umkm', '/komunitas', '/event', '/booking', '/voting', '/pengaduan', '/tamu', '/panic'],
  pengelola: ['/feed', '/pengumuman', '/berita-duka', '/iuran', '/keuangan', '/crowdfunding', '/bank-sampah', '/marketplace', '/skill', '/umkm', '/komunitas', '/event', '/booking', '/voting', '/pengaduan', '/tamu', '/panic', '/broadcast', '/warga'],
  petugas_keuangan: ['/iuran', '/keuangan', '/pengumuman', '/verifikasi'],
  petugas_keamanan: ['/panic', '/keamanan', '/tamu', '/pengumuman'],
  super_admin: ['/feed', '/pengumuman', '/berita-duka', '/iuran', '/keuangan', '/crowdfunding', '/bank-sampah', '/marketplace', '/skill', '/umkm', '/komunitas', '/event', '/booking', '/voting', '/pengaduan', '/tamu', '/panic', '/broadcast', '/keamanan', '/warga', '/verifikasi'],
}

export default function Menu() {
  const { user, logout } = useApp()
  const navigate = useNavigate()
  const allowed = user ? roleAllowList[user.role] : []

  return (
    <div>
      <Link to="/profil" className="card mb-lg flex items-center gap-base p-base transition-shadow hover:shadow-float">
        {user && <Avatar name={user.nama} src={user.foto} size="lg" />}
        <div className="min-w-0 flex-1">
          <p className="truncate text-title-md text-ink">{user?.nama}</p>
          <p className="text-body-sm text-muted">
            Unit {user && unitToString(user.unit)} · {user?.status}
          </p>
        </div>
        <ChevronRight className="h-5 w-5 text-muted" />
      </Link>

      <Link to="/panic" className="mb-lg flex items-center gap-md rounded-md bg-primary p-base text-white">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20">
          <ShieldAlert className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <p className="text-title-sm">Panic Button</p>
          <p className="text-body-sm text-white/85">Keadaan darurat</p>
        </div>
        <ChevronRight className="h-5 w-5" />
      </Link>

      {navSections.map((section) => {
        const items = section.items.filter((i) => i.to !== '/' && allowed.includes(i.to))
        if (items.length === 0) return null
        return (
          <div key={section.title} className="mb-lg">
            <h2 className="mb-md text-title-md text-ink">{section.title}</h2>
            <div className="grid grid-cols-3 gap-base sm:grid-cols-4">
              {items.map((item) => (
                <Link key={item.to} to={item.to} className="flex flex-col items-center gap-xs text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-md bg-surface-soft transition-colors hover:bg-surface-strong">
                    <item.icon className="h-6 w-6 text-ink" strokeWidth={1.8} />
                  </div>
                  <span className="text-caption-sm leading-tight text-body">{item.label}</span>
                </Link>
              ))}
            </div>
          </div>
        )
      })}

      <button onClick={() => { logout(); navigate('/login') }} className="btn-secondary w-full text-primary-error">
        <LogOut className="h-4 w-4" /> Keluar
      </button>
    </div>
  )
}
