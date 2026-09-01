import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import {
  Route as RouteIcon,
  PackageCheck,
  Clock,
  RotateCcw,
  Users,
  Truck,
  Plus,
  UserPlus,
  BarChart3,
  MapPin,
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
    const myRoute = routes.find((r) => r.status === 'in_progress') ?? routes.find((r) => r.status === 'scheduled')
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
            <CardTitle className="text-base">{t('dashboard.myRouteToday')}</CardTitle>
            {myRoute && <StatusBadge status={myRoute.status} />}
          </CardHeader>
          <CardContent>
            {!myRoute ? (
              <EmptyState icon={RouteIcon} title={t('dashboard.noActiveRoute')} />
            ) : (
              <div className="flex flex-col gap-3">
                <Progress value={stops.length ? (completed / stops.length) * 100 : 0} />
                <div className="flex flex-col divide-y divide-border">
                  {stops.map((stop) => (
                    <div key={stop.id} className="flex items-center gap-3 py-3">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold">
                        {stop.sequence}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{stop.customerName}</p>
                        <p className="truncate text-xs text-muted-foreground">{stop.address}</p>
                      </div>
                      <PriorityBadge priority={stop.priority} />
                      <StatusBadge status={stop.status} />
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

  const activeRoutes = routes.filter((r) => r.status === 'in_progress' || r.status === 'scheduled')
  const allStopsToday = routes.flatMap((r) => r.stops)
  const deliveredToday = allStopsToday.filter((s) => s.status === 'delivered').length
  const failedToday = allStopsToday.filter((s) => s.status === 'failed').length
  const onTimeRate = allStopsToday.length ? Math.round((deliveredToday / allStopsToday.length) * 100) : 0
  const openReturns = returns.filter((r) => r.status === 'pending_review').length
  const availableDrivers = drivers.filter((d) => d.status === 'available').length
  const pendingStops = allStopsToday.filter((s) => s.status === 'pending').length

  return (
    <div>
      <PageHeader title={t('dashboard.welcome', { name: profile?.fullName?.split(' ')[0] })} subtitle={t('dashboard.subtitle')} />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
        <KpiCard label={t('dashboard.kpi.activeRoutes')} value={activeRoutes.length} icon={RouteIcon} />
        <KpiCard label={t('dashboard.kpi.deliveriesToday')} value={deliveredToday} icon={PackageCheck} tone="success" />
        <KpiCard label={t('dashboard.kpi.onTimeRate')} value={`${onTimeRate}%`} icon={Clock} tone="info" />
        <KpiCard label={t('dashboard.kpi.openReturns')} value={openReturns} icon={RotateCcw} tone="warning" />
        <KpiCard label={t('dashboard.kpi.availableDrivers')} value={availableDrivers} icon={Truck} />
        <KpiCard label={t('dashboard.kpi.pendingStops')} value={pendingStops} icon={Users} tone={failedToday > 0 ? 'destructive' : 'default'} />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">{t('dashboard.routeProgress')}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {routesLoading ? (
              <>
                <Skeleton className="h-14 w-full" />
                <Skeleton className="h-14 w-full" />
              </>
            ) : routes.length === 0 ? (
              <EmptyState icon={RouteIcon} title={t('routes.noRoutes')} />
            ) : (
              routes.map((route) => {
                const total = route.stops.length
                const done = route.stops.filter((s) => s.status === 'delivered').length
                return (
                  <Link
                    key={route.id}
                    to="/routes"
                    className="flex flex-col gap-2 rounded-lg border border-border p-3 transition-colors hover:bg-accent/40"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{route.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {route.driverName ?? t('common.unassigned')} · {total} {t(total === 1 ? 'routes.stop' : 'routes.stops')}
                        </p>
                      </div>
                      <StatusBadge status={route.status} />
                    </div>
                    <Progress value={total ? (done / total) * 100 : 0} />
                  </Link>
                )
              })
            )}
          </CardContent>
        </Card>

        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t('dashboard.quickActions')}</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              {can('routes', 'create') && (
                <Button variant="outline" className="justify-start" asChild>
                  <Link to="/routes">
                    <Plus className="h-4 w-4" /> {t('dashboard.newRoute')}
                  </Link>
                </Button>
              )}
              {can('customers', 'create') && (
                <Button variant="outline" className="justify-start" asChild>
                  <Link to="/customers">
                    <UserPlus className="h-4 w-4" /> {t('dashboard.newCustomer')}
                  </Link>
                </Button>
              )}
              <Button variant="outline" className="justify-start" asChild>
                <Link to="/reports">
                  <BarChart3 className="h-4 w-4" /> {t('dashboard.viewReports')}
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t('dashboard.driverAvailabilityToday')}</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col divide-y divide-border">
              {drivers.slice(0, 5).map((d) => (
                <div key={d.id} className="flex items-center gap-3 py-2 first:pt-0 last:pb-0">
                  <Avatar className="h-7 w-7">
                    <AvatarFallback className="text-[10px]">{initials(d.fullName)}</AvatarFallback>
                  </Avatar>
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
        <CardTitle className="text-base">{t('dashboard.recentActivity')}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col divide-y divide-border">
        {list.length === 0 ? (
          <EmptyState title={t('notifications.empty')} />
        ) : (
          list.slice(0, 6).map((n) => {
            const Icon = NOTIFICATION_ICON[n.type]
            return (
              <div key={n.id} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
                <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                  <Icon className="h-3.5 w-3.5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{n.title}</p>
                  <p className="truncate text-xs text-muted-foreground">{n.body}</p>
                </div>
                <span className="shrink-0 text-xs text-muted-foreground">{formatRelativeTime(n.createdAt, lang)}</span>
              </div>
            )
          })
        )}
      </CardContent>
    </Card>
  )
}
