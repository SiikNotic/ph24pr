import type { DeliveryRoute, RouteStop } from '@/types/domain'

// A stop the driver still needs to act on — not yet delivered or closed
// out as a return. Shared by DriverHome (deciding what to show on the
// driver's home screen) and DeliveryFlow (auto-advancing to the next stop
// after completing one), so "what's left on this route" is defined in
// exactly one place.
const ACTIONABLE_STOP_STATUSES: RouteStop['status'][] = ['pending', 'out_for_delivery', 'scanned']

export function getRemainingStops(route: DeliveryRoute, excludeStopId?: string): RouteStop[] {
  return route.stops
    .filter((s) => s.id !== excludeStopId && ACTIONABLE_STOP_STATUSES.includes(s.status))
    .sort((a, b) => a.sequence - b.sequence)
}

export function getNextStop(route: DeliveryRoute, excludeStopId?: string): RouteStop | undefined {
  return getRemainingStops(route, excludeStopId)[0]
}

export function getRouteStopCounts(route: DeliveryRoute) {
  const total = route.stops.length
  const delivered = route.stops.filter((s) => s.status === 'delivered').length
  const returns = route.stops.filter((s) => s.status === 'pending_return' || s.status === 'returned').length
  const remaining = total - delivered - returns
  return { total, delivered, returns, remaining }
}
