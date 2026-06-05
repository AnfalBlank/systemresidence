import { NavLink } from 'react-router-dom'
import { primaryNavItems, moreNavItem } from '@/config/nav'
import { useNotifications } from '@/context/NotificationContext'

const items = [...primaryNavItems, moreNavItem]

export default function BottomNav() {
  const { chatUnread } = useNotifications()

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-30 border-t border-hairline bg-canvas desktop:hidden"
      style={{ paddingBottom: 'var(--safe-bottom)' }}
      aria-label="Navigasi utama"
    >
      <div className="grid grid-cols-5">
        {items.map((item) => {
          const isChat = item.to === '/chat'
          const badge = isChat && chatUnread.total > 0 ? chatUnread.total : 0
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `relative flex flex-col items-center justify-center gap-xxs py-sm text-badge transition-colors ${
                  isActive ? 'text-primary' : 'text-muted'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <div className="relative">
                    <item.icon className="h-6 w-6" strokeWidth={isActive ? 2.4 : 1.8} />
                    {badge > 0 && (
                      <span className="absolute -right-2 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-xxs text-uppercase-tag font-semibold text-white">
                        {badge > 9 ? '9+' : badge}
                      </span>
                    )}
                  </div>
                  <span className="font-medium">{item.label}</span>
                </>
              )}
            </NavLink>
          )
        })}
      </div>
    </nav>
  )
}
