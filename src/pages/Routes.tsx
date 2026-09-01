import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Route as RouteIcon, Trash2, ArrowRight } from 'lucide-react'
import { toast } from 'sonner'
import { PageHeader } from '@/components/shared/PageHeader'
import { EmptyState } from '@/components/shared/EmptyState'
import { StatusBadge, PriorityBadge } from '@/components/shared/StatusBadge'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { usePermissions } from '@/hooks/usePermissions'
import { useRoutes, useDeleteRoute } from '@/hooks/useRoutes'
import { CreateRouteDialog } from '@/components/routes/CreateRouteDialog'
import { RouteDetailSheet } from '@/components/routes/RouteDetailSheet'
import { todayISODate, formatDate } from '@/lib/format'
import type { DeliveryRoute, RouteStatus } from '@/types/domain'

const STATUS_FILTERS: (RouteStatus | 'all')[] = ['all', 'draft', 'scheduled', 'in_progress', 'completed', 'canceled']

export default function RoutesPage() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const { can, isDriver } = usePermissions()
  const [date, setDate] = useState(todayISODate())
  const [showAllDates, setShowAllDates] = useState(false)
  const [statusFilter, setStatusFilter] = useState<RouteStatus | 'all'>('all')
  const [selected, setSelected] = useState<DeliveryRoute | null>(null)

  const { data: routes = [], isLoading } = useRoutes(showAllDates ? undefined : date)
  const deleteRoute = useDeleteRoute()

  const filtered = useMemo(
    () => (statusFilter === 'all' ? routes : routes.filter((r) => r.status === statusFilter)),
    [routes, statusFilter],
  )

  return (
    <div>
      <PageHeader
        title={isDriver ? t('routes.myRoutes') : t('routes.title')}
        subtitle={t('routes.subtitle')}
        actions={can('routes', 'create') ? <CreateRouteDialog /> : undefined}
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Input
          type="date"
          value={date}
          onChange={(e) => {
            setDate(e.target.value)
            setShowAllDates(false)
          }}
          className="w-40"
        />
        <Button
          variant={showAllDates ? 'secondary' : 'outline'}
          size="sm"
          onClick={() => setShowAllDates((v) => !v)}
        >
          {t('common.all')}
        </Button>
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as RouteStatus | 'all')}>
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUS_FILTERS.map((s) => (
              <SelectItem key={s} value={s}>
                {s === 'all' ? t('common.all') : t(`status.${s}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-40 w-full" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={RouteIcon} title={t('routes.noRoutes')} />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((route) => {
            const total = route.stops.length
            const done = route.stops.filter((s) => s.status === 'delivered').length
            const controlled = route.stops.filter((s) => s.isControlledSubstance).length
            const stat = route.stops.filter((s) => s.priority === 'stat').length
            return (
              <Card
                key={route.id}
                className="cursor-pointer transition-shadow hover:shadow-md"
                onClick={() =>
                  route.status === 'draft' && can('routes', 'create')
                    ? navigate(`/routes/${route.id}/build`)
                    : setSelected(route)
                }
              >
                <CardContent className="flex flex-col gap-3 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate font-semibold">{route.name}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(route.date, i18n.language)}</p>
                    </div>
                    <StatusBadge status={route.status} />
                  </div>

                  <p className="text-sm text-muted-foreground">
                    {route.driverName ?? t('common.unassigned')} · {total} {t(total === 1 ? 'routes.stop' : 'routes.stops')}
                  </p>

                  <Progress value={total ? (done / total) * 100 : 0} />

                  <div className="flex flex-wrap items-center gap-1.5">
                    {stat > 0 && <PriorityBadge priority="stat" />}
                    {controlled > 0 && (
                      <span className="text-xs text-muted-foreground">
                        {controlled} {t('routes.controlled').toLowerCase()}
                      </span>
                    )}
                  </div>

                  {route.status === 'draft' && can('routes', 'create') && (
                    <p className="flex items-center gap-1 text-xs font-medium text-primary">
                      {t('routeBuilder.continueSetup')} <ArrowRight className="h-3 w-3" />
                    </p>
                  )}

                  {can('routes', 'delete') && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="self-start text-destructive hover:text-destructive"
                      onClick={(e) => {
                        e.stopPropagation()
                        deleteRoute.mutate(route.id, {
                          onSuccess: () => toast.success(t('common.success')),
                          onError: (err: any) => toast.error(err.message ?? t('common.error')),
                        })
                      }}
                    >
                      <Trash2 className="h-3.5 w-3.5" /> {t('common.delete')}
                    </Button>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      <RouteDetailSheet route={selected} open={!!selected} onOpenChange={(o) => !o && setSelected(null)} />
    </div>
  )
}
