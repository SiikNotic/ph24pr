import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Route as RouteIcon,
  PackageCheck,
  Clock,
  RotateCcw,
  Users,
  Truck,
  Plus,
  UserPlus,
  MapPin,
  AlertTriangle,
  ShieldAlert,
  ArrowRight,
} from 'lucide-react'
import { PageHeader } from '@/components/shared/PageHeader'
import { KpiCard } from '@/components/shared/KpiCard'
import { StatusBadge, PriorityBadge } from '@/components/shared/StatusBadge'
import { EmptyState } from '@/components/shared/EmptyState'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { useAuthStore } from '@/store/auth'
import { usePermissions } from '@/hooks/usePermissions'
import { useRoutes } from '@/hooks/useRoutes'
import { useReturns } from '@/hooks/useReturns'
import { useDrivers } from '@/hooks/useDrivers'
import { useNotifications } from '@/hooks/useNotifications'
import { todayISODate, formatRelativeTime, initials } from '@/lib/format'
import { NOTIFICATION_ICON } from '@/components/shared/notificationIcons'
import { cn } from '@/lib/utils'
import type { RouteStop } from '@/types/domain'

const DOT_TONE: Record<string, string> = {
  delivered: 'bg-success',
  scanned: 'bg-info',
  out_for_delivery: 'bg-info/60',
  pending: 'bg-muted-foreground/25',
  pending_return: 'bg-destructive',
  returned: 'bg-warning',
  failed: 'bg-destructive',
}

// A compact, at-a-glance sequence of a route's stops — the same shape
// language as the status badges (color communicates state) but built for
// scanning a whole route's progress in one horizontal glance.
function StopDots({ stops }: { stops: RouteStop[] }) {
  return (
    <div className="flex items-center gap-[3px]">
      {stops.slice(0, 24).map((s) => (
        <span key={s.id} className={cn('h-1.5 w-1.5 rounded-full', DOT_TONE[s.status] ?? 'bg-muted-foreground/25')} />
      ))}
      {stops.length > 24 && <span className="ml-0.5 text-[10px] text-muted-foreground">+{stops.length - 24}</span>}
    </div>
  )
}

const fadeUp = {
  hidden: { opacity: 0, y: 8 },
  show: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.04, duration: 0.35, ease: [0.19, 1, 0.22, 1] } }),
}

export default function Dashboard() {
  const { t, i18n } = useTranslation()
  const profile = useAuthStore((s) => s.profile)
  const { isDriver, can } = usePermissions()
  const today = todayISODate()

  const { data: routes = [], isLoading: routesLoading } = useRoutes(today)
  const { data: returns = [] } = useReturns()
  const { data: drivers = [] } = useDrivers()
  const { data: notifications = [] } = useNotifications()

  if (isDriver) {
    const myRoute =
      routes.find((r) => r.status === 'active' || r.status === 'returning_to_station') ??
      routes.find((r) => r.status === 'assigned')
    const stops = myRoute?.stops ?? []
    const completed = stops.filter((s) => s.status === 'delivered').length
    const controlled = stops.filter((s) => s.isControlledSubstance).length

    return (
      <div>
        <PageHeader title={t('dashboard.welcome', { name: profile?.fullName?.split(' ')[0] })} subtitle={t('dashboard.subtitle')} />

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <KpiCard label={t('dashboard.kpi.myStopsToday')} value={stops.length} icon={RouteIcon} />
          <KpiCard label={t('dashboard.kpi.myCompleted')} value={completed} icon={PackageCheck} tone="success" />
          <KpiCard label={t('dashboard.kpi.controlledSubstances')} value={controlled} icon={Clock} tone="warning" />
        </div>

        <Card className="mt-4">
          <CardHeader className="flex-row items-center justify-between gap-2 space-y-0">
            <CardTitle className="font-display text-base">{t('dashboard.myRouteToday')}</CardTitle>
            {myRoute && <StatusBadge status={myRoute.status} />}
          </CardHeader>
          <CardContent>
            {!myRoute ? (
              <EmptyState icon={RouteIcon} title={t('dashboard.noActiveRoute')} />
            ) : (
              <div className="flex flex-col gap-3">
                <Progress value={stops.length ? (completed / stops.length) * 100 : 0} indicatorClassName="bg-success" />
                <div className="flex flex-col divide-y divide-border">
                  {stops.map((stop) => (
                    <div key={stop.id} className="flex flex-wrap items-center gap-x-3 gap-y-1.5 py-3">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted font-numeric text-xs font-semibold">
                        {stop.sequence}
                      </span>
                      <div className="min-w-[8rem] flex-1">
                        <p className="truncate text-sm font-medium">{stop.customerName}</p>
                        <p className="truncate text-xs text-muted-foreground">{stop.address}</p>
                      </div>
                      <div className="ml-auto flex shrink-0 items-center gap-1.5">
                        <PriorityBadge priority={stop.priority} />
                        <StatusBadge status={stop.status} />
                      </div>
                    </div>
                  ))}
                </div>
                <Button asChild className="mt-1 self-start">
                  <Link to="/routes">
                    <MapPin className="h-4 w-4" /> {t('routes.myRoutes')}
                  </Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <RecentActivity notifications={notifications} lang={i18n.language} />
      </div>
    )
  }

  const activeRoutes = routes.filter((r) => r.status === 'active' || r.status === 'assigned' || r.status === 'returning_to_station')
  const allStopsToday = routes.flatMap((r) => r.stops)
  const deliveredToday = allStopsToday.filter((s) => s.status === 'delivered').length
  const failedToday = allStopsToday.filter((s) => s.status === 'failed' || s.status === 'pending_return').length
  const onTimeRate = allStopsToday.length ? Math.round((deliveredToday / allStopsToday.length) * 100) : 0
  const openReturns = returns.filter((r) => r.status === 'pending_return').length
  const availableDrivers = drivers.filter((d) => d.status === 'available').length
  const pendingStops = allStopsToday.filter((s) => s.status === 'pending').length

  // Needs Attention: what an operator should look at right now, distinct
  // from the passive KPI counts above it.
  const attentionStops = allStopsToday
    .filter((s) => s.status === 'pending_return' || (s.priority === 'stat' && s.status !== 'delivered'))
    .slice(0, 5)
  const inactiveDrivers = drivers.filter((d) => d.status === 'inactive').slice(0, 3)

  return (
    <div>
      <PageHeader
        title={t('dashboard.welcome', { name: profile?.fullName?.split(' ')[0] })}
        subtitle={t('dashboard.subtitle')}
        actions={
          <>
            {can('routes', 'create') && (
              <Button size="sm" asChild>
                <Link to="/routes">
                  <Plus className="h-4 w-4" /> {t('dashboard.newRoute')}
                </Link>
              </Button>
            )}
            {can('customers', 'create') && (
              <Button size="sm" variant="outline" asChild>
                <Link to="/customers">
                  <UserPlus className="h-4 w-4" /> {t('dashboard.newCustomer')}
                </Link>
              </Button>
            )}
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
        {[
          { label: t('dashboard.kpi.activeRoutes'), value: activeRoutes.length, icon: RouteIcon, tone: 'default' as const },
          { label: t('dashboard.kpi.deliveriesToday'), value: deliveredToday, icon: PackageCheck, tone: 'success' as const },
          { label: t('dashboard.kpi.onTimeRate'), value: `${onTimeRate}%`, icon: Clock, tone: 'info' as const },
          { label: t('dashboard.kpi.openReturns'), value: openReturns, icon: RotateCcw, tone: 'warning' as const },
          { label: t('dashboard.kpi.availableDrivers'), value: availableDrivers, icon: Truck, tone: 'default' as const },
          {
            label: t('dashboard.kpi.pendingStops'),
            value: pendingStops,
            icon: Users,
            tone: failedToday > 0 ? ('destructive' as const) : ('default' as const),
          },
        ].map((kpi, i) => (
          <motion.div key={kpi.label} custom={i} initial="hidden" animate="show" variants={fadeUp}>
            <KpiCard label={kpi.label} value={kpi.value} icon={kpi.icon} tone={kpi.tone} />
          </motion.div>
        ))}
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="font-display text-base">{t('dashboard.routeProgress')}</CardTitle>
            <Link to="/routes" className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground">
              {t('common.viewAll')} <ArrowRight className="h-3 w-3" />
            </Link>
          </CardHeader>
          <CardContent className="flex flex-col gap-1.5">
            {routesLoading ? (
              <>
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </>
            ) : routes.length === 0 ? (
              <EmptyState icon={RouteIcon} title={t('routes.noRoutes')} />
            ) : (
              routes.map((route, i) => {
                const total = route.stops.length
                const done = route.stops.filter((s) => s.status === 'delivered').length
                return (
                  <motion.div key={route.id} custom={i} initial="hidden" animate="show" variants={fadeUp}>
                    <Link
                      to="/routes"
                      className="flex flex-col gap-2 rounded-lg px-2 py-2.5 transition-colors hover:bg-muted/50"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold">{route.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {route.driverName ?? t('common.unassigned')} · {total}{' '}
                            {t(total === 1 ? 'routes.stop' : 'routes.stops')}
                          </p>
                        </div>
                        <StatusBadge status={route.status} />
                      </div>
                      <div className="flex items-center gap-3">
                        <Progress
                          value={total ? (done / total) * 100 : 0}
                          className="h-1"
                          indicatorClassName={cn(route.status === 'returning_to_station' ? 'bg-warning' : 'bg-primary')}
                        />
                        <span className="font-numeric shrink-0 text-[11px] text-muted-foreground">
                          {done}/{total}
                        </span>
                      </div>
                      {total > 0 && <StopDots stops={route.stops} />}
                    </Link>
                  </motion.div>
                )
              })
            )}
          </CardContent>
        </Card>

        <div className="flex flex-col gap-4">
          <Card className={cn(attentionStops.length + inactiveDrivers.length > 0 && 'border-destructive/25')}>
            <CardHeader className="flex-row items-center gap-2 space-y-0">
              <ShieldAlert className={cn('h-4 w-4', attentionStops.length + inactiveDrivers.length > 0 ? 'text-destructive' : 'text-muted-foreground')} />
              <CardTitle className="font-display text-base">{t('dashboard.needsAttention')}</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col divide-y divide-border">
              {attentionStops.length === 0 && inactiveDrivers.length === 0 ? (
                <p className="py-3 text-sm text-muted-foreground">{t('dashboard.allClear')}</p>
              ) : (
                <>
                  {attentionStops.map((s) => (
                    <div key={s.id} className="flex items-center gap-2.5 py-2.5 first:pt-0">
                      <AlertTriangle
                        className={cn('h-4 w-4 shrink-0', s.status === 'pending_return' ? 'text-destructive' : 'text-warning')}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{s.customerName}</p>
                        <p className="truncate text-xs text-muted-foreground">{s.failureReason || t(`status.${s.status}`)}</p>
                      </div>
                    </div>
                  ))}
                  {inactiveDrivers.map((d) => (
                    <div key={d.id} className="flex items-center gap-2.5 py-2.5 first:pt-0">
                      <AlertTriangle className="h-4 w-4 shrink-0 text-muted-foreground" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{d.fullName}</p>
                        <p className="truncate text-xs text-muted-foreground">{t('status.inactive')}</p>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="font-display text-base">{t('dashboard.driverAvailabilityToday')}</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col divide-y divide-border">
              {drivers.slice(0, 5).map((d) => (
                <div key={d.id} className="flex items-center gap-3 py-2 first:pt-0 last:pb-0">
                  <div className="relative">
                    <Avatar className="h-7 w-7">
                      <AvatarFallback className="text-[10px]">{initials(d.fullName)}</AvatarFallback>
                    </Avatar>
                    <span
                      className={cn(
                        'absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full ring-2 ring-card',
                        d.status === 'available'
                          ? 'bg-success'
                          : d.status === 'on_route'
                            ? 'bg-info'
                            : d.status === 'break'
                              ? 'bg-warning'
                              : 'bg-muted-foreground/40',
                      )}
                    />
                  </div>
                  <p className="flex-1 truncate text-sm">{d.fullName}</p>
                  <StatusBadge status={d.status} />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      <RecentActivity notifications={notifications} lang={i18n.language} />
    </div>
  )
}

function RecentActivity({ notifications, lang }: { notifications: ReturnType<typeof useNotifications>['data']; lang: string }) {
  const { t } = useTranslation()
  const list = notifications ?? []
  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle className="font-display text-base">{t('dashboard.recentActivity')}</CardTitle>
      </CardHeader>
      <CardContent className="relative flex flex-col">
        {list.length === 0 ? (
          <EmptyState title={t('notifications.empty')} />
        ) : (
          <>
            <span className="absolute bottom-3 left-[26px] top-3 w-px bg-border" aria-hidden />
            {list.slice(0, 6).map((n) => {
              const Icon = NOTIFICATION_ICON[n.type]
              return (
                <div key={n.id} className="relative flex items-start gap-3 py-2.5">
                  <span className="relative z-10 mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-border bg-card text-muted-foreground">
                    <Icon className="h-3.5 w-3.5" />
                  </span>
                  <div className="min-w-0 flex-1 pt-0.5">
                    <p className="truncate text-sm font-medium">{n.title}</p>
                    <p className="truncate text-xs text-muted-foreground">{n.body}</p>
                  </div>
                  <span className="shrink-0 pt-0.5 text-xs text-muted-foreground">{formatRelativeTime(n.createdAt, lang)}</span>
                </div>
              )
            })}
          </>
        )}
      </CardContent>
    </Card>
  )
}
