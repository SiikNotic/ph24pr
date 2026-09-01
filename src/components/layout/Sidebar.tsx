import { NavLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Truck } from 'lucide-react'
import { NAV_ITEMS } from '@/config/nav'
import { usePermissions } from '@/hooks/usePermissions'
import { ROLE_LABELS } from '@/lib/permissions'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/store/auth'

export function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const { t, i18n } = useTranslation()
  const { sections, role } = usePermissions()
  const profile = useAuthStore((s) => s.profile)
  const items = NAV_ITEMS.filter((item) => sections.includes(item.section))

  return (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      <div className="flex h-14 items-center gap-2 border-b border-sidebar-border px-4">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
          <Truck className="h-4 w-4" />
        </div>
        <span className="font-semibold tracking-tight">{t('app.name')}</span>
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto p-3">
        {items.map((item) => (
          <NavLink
            key={item.section}
            to={item.path}
            end={item.path === '/'}
            onClick={onNavigate}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                  : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground',
              )
            }
          >
            <item.icon className="h-4 w-4 shrink-0" />
            <span className="truncate">{t(item.labelKey)}</span>
          </NavLink>
        ))}
      </nav>

      {profile && role && (
        <div className="border-t border-sidebar-border p-3">
          <div className="rounded-lg bg-sidebar-accent/50 px-3 py-2 text-xs">
            <p className="font-medium text-sidebar-foreground">{profile.fullName}</p>
            <p className="text-sidebar-foreground/60">{ROLE_LABELS[role][i18n.language === 'es' ? 'es' : 'en']}</p>
          </div>
        </div>
      )}
    </div>
  )
}
