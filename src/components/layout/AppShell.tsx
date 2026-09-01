import { Outlet, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { SidebarNav } from '@/components/layout/Sidebar'
import { Topbar } from '@/components/layout/Topbar'
import { DriverBottomNav } from '@/components/layout/DriverBottomNav'
import { NAV_ITEMS } from '@/config/nav'
import { usePermissions } from '@/hooks/usePermissions'
import { cn } from '@/lib/utils'

export function AppShell() {
  const { t } = useTranslation()
  const { isDriver } = usePermissions()
  const location = useLocation()

  const activeItem = NAV_ITEMS.find((item) =>
    item.path === '/' ? location.pathname === '/' : location.pathname.startsWith(item.path),
  )
  const title = activeItem ? t(activeItem.labelKey) : t('app.name')

  return (
    <div className="flex min-h-svh bg-background">
      <aside className="hidden w-60 shrink-0 border-r border-sidebar-border lg:block">
        <div className="fixed h-svh w-60">
          <SidebarNav />
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar title={title} />
        <main className={cn('min-w-0 flex-1 p-4 sm:p-6', isDriver && 'pb-24 lg:pb-6')}>
          <Outlet />
        </main>
      </div>

      {isDriver && <DriverBottomNav />}
    </div>
  )
}
