import { NavLink } from 'react-router-dom'
import { navSections } from '@/config/nav'
import { useApp } from '@/context/AppContext'
import Logo from '@/components/layout/Logo'
import type { Role } from '@/types'

// Which routes each role can access (warga gets everything except admin-only)
const roleAllowList: Record<Role, string[]> = {
  warga: [
    '/', '/feed', '/pengumuman', '/berita-duka',
    '/iuran', '/keuangan', '/crowdfunding', '/bank-sampah',
    '/marketplace', '/skill', '/umkm',
    '/chat', '/komunitas', '/event', '/booking', '/voting',
    '/pengaduan', '/tamu', '/panic',
  ],
  pengelola: [
    '/', '/feed', '/pengumuman', '/berita-duka',
    '/iuran', '/keuangan', '/crowdfunding', '/bank-sampah',
    '/marketplace', '/skill', '/umkm',
    '/chat', '/komunitas', '/event', '/booking', '/voting',
    '/pengaduan', '/tamu', '/panic',
    '/broadcast', '/warga',
  ],
  petugas_keuangan: [
    '/', '/iuran', '/keuangan', '/pengumuman', '/chat', '/verifikasi',
  ],
  petugas_keamanan: [
    '/', '/panic', '/keamanan', '/tamu', '/pengumuman', '/chat',
  ],
  super_admin: [
    '/', '/feed', '/pengumuman', '/berita-duka',
    '/iuran', '/keuangan', '/crowdfunding', '/bank-sampah',
    '/marketplace', '/skill', '/umkm',
    '/chat', '/komunitas', '/event', '/booking', '/voting',
    '/pengaduan', '/tamu', '/panic',
    '/broadcast', '/keamanan', '/warga', '/verifikasi',
  ],
}

export default function Sidebar() {
  const { user } = useApp()
  const allowed = user ? roleAllowList[user.role] : roleAllowList.warga

  return (
    <aside className="fixed left-0 top-0 z-30 hidden h-screen w-64 flex-col border-r border-hairline bg-canvas desktop:flex">
      <div className="flex h-20 shrink-0 items-center px-lg">
        <Logo />
      </div>
      <nav
        className="flex-1 overflow-y-auto px-md py-base no-scrollbar"
        aria-label="Menu samping"
      >
        {navSections.map((section) => {
          const visibleItems = section.items.filter((item) =>
            allowed.includes(item.to)
          )
          if (visibleItems.length === 0) return null
          return (
            <div key={section.title} className="mb-base">
              <p className="px-md pb-xs text-uppercase-tag uppercase text-muted-soft">
                {section.title}
              </p>
              <ul className="space-y-xxs">
                {visibleItems.map((item) => (
                  <li key={item.to}>
                    <NavLink
                      to={item.to}
                      end={item.to === '/'}
                      className={({ isActive }) =>
                        `flex items-center gap-md rounded-sm px-md py-sm text-title-sm transition-colors ${
                          isActive
                            ? 'bg-surface-soft text-ink'
                            : 'text-body hover:bg-surface-soft'
                        }`
                      }
                    >
                      {({ isActive }) => (
                        <>
                          <item.icon
                            className="h-5 w-5 shrink-0"
                            strokeWidth={isActive ? 2.4 : 1.8}
                          />
                          <span className="truncate">{item.label}</span>
                        </>
                      )}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>
          )
        })}
      </nav>
    </aside>
  )
}
