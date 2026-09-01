import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Navigate } from 'react-router-dom'
import { toast } from 'sonner'
import { CheckCircle2, PackageSearch, Route as RouteIcon, Undo2 } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { DriverEmptyScreen } from '@/components/driver/DriverEmptyScreen'
import { RouteAssignedSummary } from '@/components/driver/RouteAssignedSummary'
import { PackageLoadingScreen } from '@/components/driver/PackageLoadingScreen'
import { useRoutes, useUpdateRouteStatus } from '@/hooks/useRoutes'
import { usePackages } from '@/hooks/usePackages'
import { useBroadcastDriverLocation } from '@/hooks/useDriverLocations'
import { getNextStop, getRouteStopCounts } from '@/lib/routeProgress'
import { todayISODate } from '@/lib/format'
import type { DeliveryRoute } from '@/types/domain'

// The driver's entire home screen — a state machine over today's assigned
// route rather than a dashboard. See requirements: no route -> a clean
// empty state; assigned -> summary then package loading; active -> jump
// straight to the current stop (DeliveryFlow); all stops done -> a
// return-to-station wrap-up. There is deliberately no "driver dashboard"
// view here at all.
export default function DriverHome() {
  const { t } = useTranslation()
  const { data: routes = [], isLoading } = useRoutes(todayISODate())

  const myRoute =
    routes.find((r) => r.status === 'active' || r.status === 'returning_to_station') ??
    routes.find((r) => r.status === 'assigned') ??
    routes.find((r) => r.status === 'completed' || r.status === 'closed')

  useBroadcastDriverLocation(myRoute?.status === 'active' || myRoute?.status === 'returning_to_station')

  if (isLoading) {
    return (
      <div className="flex flex-col gap-3 pt-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 w-full" />
      </div>
    )
  }

  if (!myRoute) {
    return (
      <DriverEmptyScreen
        icon={RouteIcon}
        title={t('driverHome.noRouteTitle')}
        subtitle={t('driverHome.noRouteSubtitle')}
        hint={t('driverHome.noRouteHint')}
      />
    )
  }

  if (myRoute.status === 'assigned') {
    return <RouteAssignedFlow route={myRoute} />
  }

  if (myRoute.status === 'active') {
    const nextStop = getNextStop(myRoute)
    if (nextStop) {
      return <Navigate to={`/routes/${myRoute.id}/deliver/${nextStop.id}`} replace />
    }
    return <ReturnToStationScreen route={myRoute} />
  }

  if (myRoute.status === 'returning_to_station') {
    return <ReturnToStationScreen route={myRoute} />
  }

  // completed / closed today
  return (
    <DriverEmptyScreen
      icon={CheckCircle2}
      tone="success"
      title={t('driverHome.routeCompleteTitle')}
      subtitle={t('driverHome.routeCompleteSubtitle')}
    />
  )
}

// Route is 'assigned' — summary first, then package loading. Once any
// package has been scanned or reported missing, the loading screen is
// what a page refresh resumes into (derived from real data, not local-only
// state), so progress can never be lost by navigating away.
function RouteAssignedFlow({ route }: { route: DeliveryRoute }) {
  const { data: packages = [] } = usePackages(route.id)
  const [startedLoading, setStartedLoading] = useState(false)

  useEffect(() => {
    if (!startedLoading && packages.some((p) => p.scannedAt || p.loadIssueReportedAt)) {
      setStartedLoading(true)
    }
  }, [packages, startedLoading])

  if (!startedLoading) {
    return (
      <RouteAssignedSummary route={route} packageCount={packages.length} onStart={() => setStartedLoading(true)} />
    )
  }

  return <PackageLoadingScreen route={route} packages={packages} />
}

// Every stop has been attempted (delivered or returned) — the wrap-up
// screen that replaces digging into the admin route sheet just to mark
// "heading back" / "route complete".
function ReturnToStationScreen({ route }: { route: DeliveryRoute }) {
  const { t } = useTranslation()
  const updateRouteStatus = useUpdateRouteStatus()
  const { delivered, returns, total } = getRouteStopCounts(route)

  async function markReturning() {
    try {
      await updateRouteStatus.mutateAsync({ routeId: route.id, status: 'returning_to_station' })
    } catch (e: any) {
      toast.error(e.message ?? t('common.error'))
    }
  }

  async function completeRoute() {
    try {
      await updateRouteStatus.mutateAsync({ routeId: route.id, status: 'completed' })
      toast.success(t('common.success'))
    } catch (e: any) {
      toast.error(e.message ?? t('common.error'))
    }
  }

  const isReturning = route.status === 'returning_to_station'

  return (
    <DriverEmptyScreen
      icon={isReturning ? Undo2 : PackageSearch}
      tone="success"
      title={t('driverHome.returningTitle')}
      subtitle={t('driverHome.returningSubtitle')}
      hint={t('driverHome.assignedStops', { count: total }) + ` · ${delivered} ${t('status.delivered')} · ${returns} ${t('status.pending_return')}`}
      action={
        isReturning
          ? { label: t('routes.completeRoute'), onClick: completeRoute, loading: updateRouteStatus.isPending }
          : { label: t('routes.returningToStation'), onClick: markReturning, loading: updateRouteStatus.isPending }
      }
    />
  )
}
