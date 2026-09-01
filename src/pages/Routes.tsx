import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'framer-motion'
import { Route as RouteIcon, Trash2, ArrowRight, Search, ShieldAlert } from 'lucide-react'
import { toast } from 'sonner'
import { PageHeader } from '@/components/shared/PageHeader'
import { EmptyState } from '@/components/shared/EmptyState'
import { StatusBadge, PriorityBadge } from '@/components/shared/StatusBadge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { RouteMiniTrack } from '@/components/routes/RouteMiniTrack'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { usePermissions } from '@/hooks/usePermissions'
import { useRoutes, useDeleteRoute } from '@/hooks/useRoutes'
import { CreateRouteDialog } from '@/components/routes/CreateRouteDialog'
import { RouteDetailSheet } from '@/components/routes/RouteDetailSheet'
import { todayISODate, formatDate, initials } from '@/lib/format'
import { BUILDING_ROUTE_STATUSES } from '@/types/domain'
import type { DeliveryRoute, RouteStatus } from '@/types/domain'
import { cn } from '@/lib/utils'

const STATUS_FILTERS: (RouteStatus | 'all')[] = [
  'all',
  'draft',
  'labels_pending',
  'labels_printed',
  'confirmed',
  'assigned',
  'active',
  'returning_to_station',
  'completed',
  'closed',
]

export default function RoutesPage() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const { can, isDriver } = usePermissions()
  const [date, setDate] = useState(todayISODate())
  const [showAllDates, setShowAllDates] = useState(false)
  const [statusFilter, setStatusFilter] = useState<RouteStatus | 'all'>('all')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<DeliveryRoute | null>(null)

  const { data: routes = [], isLoading } = useRoutes(showAllDates ? undefined : date)
  const deleteRoute = useDeleteRoute()

  const filtered = useMemo(() => {
    let list = statusFilter === 'all' ? routes : routes.filter((r) => r.status === statusFilter)
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      list = list.filter((r) => r.name.toLowerCase().includes(q) || r.driverName?.toLowerCase().includes(q))
    }
    return list
  }, [routes, statusFilter, search])

  return (
    <div>
      <PageHeader
        title={isDriver ? t('routes.myRoutes') : t('routes.title')}
        subtitle={t('routes.subtitle')}
        actions={can('routes', 'create') ? <CreateRouteDialog /> : undefined}
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('common.search')}
            className="w-44 pl-8"
          />
        </div>
        <Input
          type="date"
          value={date}
          onChange={(e) => {
            setDate(e.target.value)
            setShowAllDates(false)
          }}
          className="w-40"
        />
        <Button variant={showAllDates ? 'secondary' : 'outline'} size="sm" onClick={() => setShowAllDates((v) => !v)}>
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
        <span className="font-numeric ml-auto text-xs text-muted-foreground">
          {filtered.length} {t('routes.title')}
        </span>
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-[72px] w-full rounded-xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={RouteIcon} title={t('routes.noRoutes')} />
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <AnimatePresence initial={false}>
            {filtered.map((route, i) => {
              const total = route.stops.length
              const done = route.stops.filter((s) => s.status === 'delivered').length
              const stat = route.stops.filter((s) => s.priority === 'stat').length
              const controlled = route.stops.filter((s) => s.isControlledSubstance).length
              const isBuilding = BUILDING_ROUTE_STATUSES.includes(route.status)

              return (
                <motion.div
                  key={route.id}
                  layout
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1, transition: { delay: Math.min(i, 8) * 0.03 } }}
                  exit={{ opacity: 0 }}
                  className={cn(
                    'group relative flex cursor-pointer flex-wrap items-center gap-x-4 gap-y-2 border-border px-4 py-3.5 transition-colors hover:bg-muted/40',
                    i !== 0 && 'border-t',
                  )}
                  onClick={() =>
                    isBuilding && can('routes', 'create') ? navigate(`/routes/${route.id}/build`) : setSelected(route)
                  }
                >
                  <span
                    className={cn(
                      'h-9 w-[3px] shrink-0 rounded-full',
                      route.status === 'active'
                        ? 'bg-success'
                        : route.status === 'returning_to_station'
                          ? 'bg-warning'
                          : route.status === 'completed' || route.status === 'closed'
                            ? 'bg-muted-foreground/30'
                            : 'bg-info',
                    )}
                  />

                  <div className="min-w-[9rem] flex-1 sm:w-56 sm:flex-none">
                    <p className="truncate font-display text-[15px] font-semibold leading-tight">{route.name}</p>
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">{formatDate(route.date, i18n.language)}</p>
                  </div>

                  <div className="hidden w-40 shrink-0 items-center gap-2 sm:flex">
                    <Avatar className="h-6 w-6">
                      <AvatarFallback className="text-[9px]">
                        {route.driverName ? initials(route.driverName) : '—'}
                      </AvatarFallback>
                    </Avatar>
                    <span className="truncate text-sm text-muted-foreground">{route.driverName ?? t('common.unassigned')}</span>
                  </div>

                  <div className="hidden min-w-0 flex-1 items-center gap-3 md:flex">
                    <RouteMiniTrack done={done} total={total} className="flex-1" />
                    <span className="font-numeric shrink-0 text-xs tabular-nums text-muted-foreground">
                      {done}/{total}
                    </span>
                  </div>

                  <div className="hidden shrink-0 items-center gap-1.5 lg:flex">
                    {stat > 0 && <PriorityBadge priority="stat" />}
                    {controlled > 0 && (
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <ShieldAlert className="h-3 w-3" /> {controlled}
                      </span>
                    )}
                  </div>

                  <div className="ml-auto flex shrink-0 items-center gap-1.5">
                    <StatusBadge status={route.status} className="shrink-0" />

                    {isBuilding && can('routes', 'create') ? (
                      <ArrowRight className="h-4 w-4 shrink-0 text-primary transition-transform group-hover:translate-x-0.5" />
                    ) : can('routes', 'delete') ? (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 shrink-0 text-muted-foreground opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100"
                        onClick={(e) => {
                          e.stopPropagation()
                          deleteRoute.mutate(route.id, {
                            onSuccess: () => toast.success(t('common.success')),
                            onError: (err: any) => toast.error(err.message ?? t('common.error')),
                          })
                        }}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    ) : (
                      <span className="w-8 shrink-0" />
                    )}
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>
      )}

      <RouteDetailSheet route={selected} open={!!selected} onOpenChange={(o) => !o && setSelected(null)} />
    </div>
  )
}
