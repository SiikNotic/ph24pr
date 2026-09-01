import { NavLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { NAV_ITEMS, DRIVER_BOTTOM_NAV } from '@/config/nav'
import { cn } from '@/lib/utils'

export function DriverBottomNav() {
  const { t } = useTranslation()
  const items = NAV_ITEMS.filter((item) => DRIVER_BOTTOM_NAV.includes(item.section))

  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 flex h-16 items-stretch border-t border-border bg-background/95 backdrop-blur safe-bottom lg:hidden">
      {items.map((item) => (
        <NavLink
          key={item.section}
          to={item.path}
          end={item.path === '/'}
          className={({ isActive }) =>
            cn(
              'flex flex-1 flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors',
              isActive ? 'text-primary' : 'text-muted-foreground',
            )
          }
        >
          {({ isActive }) => (
            <>
              <item.icon className={cn('h-5 w-5', isActive && 'stroke-[2.5]')} />
              {t(item.labelKey)}
            </>
          )}
        </NavLink>
      ))}
    </nav>
  )
}
