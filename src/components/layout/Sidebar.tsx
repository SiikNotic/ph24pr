import { NavLink, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Waypoints, User as UserIcon, LogOut, ChevronsUpDown } from 'lucide-react'
import { NAV_ITEMS } from '@/config/nav'
import type { Section } from '@/lib/permissions'
import { usePermissions } from '@/hooks/usePermissions'
import { ROLE_LABELS } from '@/lib/permissions'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/store/auth'
import { initials } from '@/lib/format'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

// Groups the flat nav list into labeled clusters — real information
// hierarchy instead of one undifferentiated stack of links.
const GROUPS: { labelKey: string; sections: Section[] }[] = [
  { labelKey: 'nav.group.overview', sections: ['dashboard'] },
  { labelKey: 'nav.group.operations', sections: ['routes', 'customers', 'drivers', 'returns', 'availability'] },
  { labelKey: 'nav.group.insights', sections: ['notifications', 'reports'] },
  { labelKey: 'nav.group.system', sections: ['settings', 'help'] },
]

export function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const { t, i18n } = useTranslation()
  const { sections, role } = usePermissions()
  const profile = useAuthStore((s) => s.profile)
  const signOut = useAuthStore((s) => s.signOut)
  const visible = new Set(sections)

  return (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      <div className="flex h-16 items-center gap-2.5 px-5">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
          <Waypoints className="h-4.5 w-4.5" strokeWidth={2.25} />
        </div>
        <span className="font-display text-[15px] font-semibold tracking-tight">
          Med<span className="text-sidebar-primary">Route</span>
        </span>
      </div>

      <nav className="flex-1 space-y-5 overflow-y-auto px-3 pb-3 pt-1 scrollbar-thin">
        {GROUPS.map((group) => {
          const items = NAV_ITEMS.filter((item) => group.sections.includes(item.section) && visible.has(item.section))
          if (items.length === 0) return null
          return (
            <div key={group.labelKey}>
              <p className="mb-1.5 px-2.5 text-[10px] font-semibold uppercase tracking-[0.09em] text-sidebar-foreground/35">
                {t(group.labelKey)}
              </p>
              <div className="space-y-0.5">
                {items.map((item) => (
                  <NavLink
                    key={item.section}
                    to={item.path}
                    end={item.path === '/'}
                    onClick={onNavigate}
                    className={({ isActive }) =>
                      cn(
                        'group relative flex items-center gap-2.5 rounded-md py-2 pl-3.5 pr-3 text-[13.5px] font-medium transition-colors',
                        isActive
                          ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                          : 'text-sidebar-foreground/60 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground',
                      )
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <span
                          className={cn(
                            'absolute left-0 top-1/2 h-4 w-[3px] -translate-y-1/2 rounded-r-full bg-sidebar-primary transition-transform duration-200',
                            isActive ? 'scale-y-100' : 'scale-y-0',
                          )}
                        />
                        <item.icon
                          className={cn('h-4 w-4 shrink-0', isActive && 'text-sidebar-primary')}
                          strokeWidth={isActive ? 2.25 : 2}
                        />
                        <span className="truncate">{t(item.labelKey)}</span>
                      </>
                    )}
                  </NavLink>
                ))}
              </div>
            </div>
          )
        })}
      </nav>

      {profile && role && (
        <div className="border-t border-sidebar-border p-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex w-full items-center gap-2.5 rounded-lg bg-sidebar-accent/40 px-2.5 py-2 text-left outline-none transition-colors hover:bg-sidebar-accent/70 focus-visible:ring-2 focus-visible:ring-sidebar-primary/50">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sidebar-primary/20 text-xs font-semibold text-sidebar-primary">
                  {initials(profile.fullName)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-medium leading-tight text-sidebar-foreground">{profile.fullName}</p>
                  <p className="truncate text-[11px] leading-tight text-sidebar-foreground/50">
                    {ROLE_LABELS[role][i18n.language === 'es' ? 'es' : 'en']}
                  </p>
                </div>
                <ChevronsUpDown className="h-3.5 w-3.5 shrink-0 text-sidebar-foreground/40" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="top" align="start" className="w-56">
              <DropdownMenuItem asChild>
                <Link to="/settings" onClick={onNavigate}>
                  <UserIcon className="h-4 w-4" /> {t('common.profile')}
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => {
                  onNavigate?.()
                  signOut()
                }}
              >
                <LogOut className="h-4 w-4" /> {t('common.signOut')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
    </div>
  )
}
