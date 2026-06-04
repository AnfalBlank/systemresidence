import { NavLink } from 'react-router-dom'
import { primaryNavItems, moreNavItem } from '@/config/nav'

const items = [...primaryNavItems, moreNavItem]

export default function BottomNav() {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-30 border-t border-hairline bg-canvas desktop:hidden"
      style={{ paddingBottom: 'var(--safe-bottom)' }}
      aria-label="Navigasi utama"
    >
      <div className="grid grid-cols-5">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center gap-xxs py-sm text-badge transition-colors ${
                isActive ? 'text-primary' : 'text-muted'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <item.icon className="h-6 w-6" strokeWidth={isActive ? 2.4 : 1.8} />
                <span className="font-medium">{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
