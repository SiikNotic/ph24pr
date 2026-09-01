import { NavLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { NAV_ITEMS, DRIVER_BOTTOM_NAV } from '@/config/nav'
import { cn } from '@/lib/utils'

export function DriverBottomNav() {
  const { t } = useTranslation()
  const items = NAV_ITEMS.filter((item) => DRIVER_BOTTOM_NAV.includes(item.section))

  return (
    <nav className="safe-bottom fixed inset-x-0 bottom-0 z-30 border-t border-border bg-card/90 backdrop-blur-md lg:hidden">
      <div className="flex h-[68px] items-stretch px-1.5 pt-1.5">
        {items.map((item) => (
          <NavLink
            key={item.section}
            to={item.path}
            end={item.path === '/'}
            className="flex flex-1 items-center justify-center"
          >
            {({ isActive }) => (
              <span
                className={cn(
                  'flex flex-col items-center gap-1 rounded-xl px-3.5 py-1.5 text-[10.5px] font-semibold tracking-tight transition-colors',
                  isActive ? 'bg-primary/12 text-primary' : 'text-muted-foreground',
                )}
              >
                <item.icon className="h-5 w-5" strokeWidth={isActive ? 2.4 : 2} />
                {t(item.labelKey)}
              </span>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
