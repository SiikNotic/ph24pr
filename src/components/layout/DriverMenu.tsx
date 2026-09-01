import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import {
  Route as RouteIcon,
  CalendarDays,
  Bell,
  HelpCircle,
  Phone,
  LogOut,
} from 'lucide-react'
import { SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { ThemeToggle } from '@/components/shared/ThemeToggle'
import { LanguageSwitcher } from '@/components/shared/LanguageSwitcher'
import { useAuthStore } from '@/store/auth'
import { useOrgSettings } from '@/hooks/useSettings'
import { initials } from '@/lib/format'

// The driver app's entire navigation — reached only through the top-left
// hamburger button (see DriverTopbar). There is deliberately no bottom
// tab bar and no admin sidebar: a driver's main screen stays focused on
// the current stop, and everything else lives one tap away in here.
export function DriverMenu({ onNavigate }: { onNavigate?: () => void }) {
  const { t } = useTranslation()
  const profile = useAuthStore((s) => s.profile)
  const signOut = useAuthStore((s) => s.signOut)
  const { data: orgSettings } = useOrgSettings()

  function contactDispatch() {
    if (orgSettings?.dispatchPhone) {
      window.location.href = `tel:${orgSettings.dispatchPhone}`
    } else {
      toast.info(t('driverMenu.noDispatchPhone'))
    }
    onNavigate?.()
  }

  const links = [
    { to: '/', icon: RouteIcon, label: t('driverMenu.currentStop') },
    { to: '/routes', icon: RouteIcon, label: t('driverMenu.myRouteAndStops') },
    { to: '/availability', icon: CalendarDays, label: t('nav.availability') },
    { to: '/notifications', icon: Bell, label: t('nav.notifications') },
  ]

  return (
    <SheetContent side="left" className="flex w-72 flex-col p-0">
      <SheetHeader className="border-b border-border p-4 text-left">
        <SheetTitle className="sr-only">{t('driverMenu.title')}</SheetTitle>
        {profile && (
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarFallback>{initials(profile.fullName)}</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="truncate font-display text-sm font-semibold">{profile.fullName}</p>
              <p className="truncate text-xs text-muted-foreground">{t('roles.driver')}</p>
            </div>
          </div>
        )}
      </SheetHeader>

      <nav className="flex-1 space-y-0.5 overflow-y-auto p-2.5">
        {links.map((link) => (
          <Link
            key={link.to}
            to={link.to}
            onClick={onNavigate}
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
          >
            <link.icon className="h-4 w-4 text-muted-foreground" />
            {link.label}
          </Link>
        ))}
        <button
          onClick={contactDispatch}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-foreground transition-colors hover:bg-muted"
        >
          <Phone className="h-4 w-4 text-muted-foreground" />
          {t('driverMenu.contactDispatch')}
        </button>
        <Link
          to="/help"
          onClick={onNavigate}
          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
        >
          <HelpCircle className="h-4 w-4 text-muted-foreground" />
          {t('nav.help')}
        </Link>
      </nav>

      <div className="border-t border-border p-2.5">
        <div className="mb-1.5 flex items-center justify-between rounded-lg px-1 py-1">
          <span className="pl-2 text-xs text-muted-foreground">{t('driverMenu.preferences')}</span>
          <div className="flex items-center gap-0.5">
            <LanguageSwitcher />
            <ThemeToggle />
          </div>
        </div>
        <Separator className="mb-1.5" />
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-destructive hover:bg-destructive/10 hover:text-destructive"
          onClick={() => signOut()}
        >
          <LogOut className="h-4 w-4" /> {t('common.signOut')}
        </Button>
      </div>
    </SheetContent>
  )
}
