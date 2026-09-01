import { Outlet, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { AnimatePresence, motion } from 'framer-motion'
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
      <aside className="hidden w-64 shrink-0 lg:block">
        <div className="fixed h-svh w-64">
          <SidebarNav />
        </div>
      </aside>

      <div className="relative flex min-w-0 flex-1 flex-col">
        <div className="bg-grid pointer-events-none absolute inset-x-0 top-0 z-0 h-96" aria-hidden />
        <Topbar title={title} />
        <main className={cn('relative z-10 min-w-0 flex-1 p-4 sm:p-6 lg:p-8', isDriver && 'pb-24 lg:pb-8')}>
          <div className="mx-auto w-full max-w-[1400px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.22, ease: [0.19, 1, 0.22, 1] }}
              >
                <Outlet />
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>

      {isDriver && <DriverBottomNav />}
    </div>
  )
}
