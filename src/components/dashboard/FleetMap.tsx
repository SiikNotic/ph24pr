import { useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { Satellite, Truck } from 'lucide-react'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { RouteMiniTrack } from '@/components/routes/RouteMiniTrack'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { driverDivIcon } from '@/lib/leafletIcons'
import { useDriverLocations } from '@/hooks/useDriverLocations'
import { useDrivers } from '@/hooks/useDrivers'
import { useRoutes } from '@/hooks/useRoutes'
import { formatRelativeTime, initials } from '@/lib/format'
import { cn } from '@/lib/utils'

// Puerto Rico's rough centroid — the map's default framing whenever no
// driver has reported a live location yet.
const PR_CENTER: [number, number] = [18.2208, -66.5901]

function FitToDrivers({ points }: { points: [number, number][] }) {
  const map = useMap()
  const key = points.map((p) => p.join(',')).join('|')

  useEffect(() => {
    if (points.length === 0) return
    if (points.length === 1) {
      map.setView(points[0], 13, { animate: true })
      return
    }
    map.fitBounds(L.latLngBounds(points), { padding: [48, 48], maxZoom: 14 })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  return null
}

// The dispatch dashboard's live fleet map — a driver marker per reported
// GPS pin, each carrying name/status/active route/progress in its popup,
// plus a synced list alongside it. Deliberately does NOT attempt to plot
// stop-to-stop route lines: customer addresses in this app are text-only
// (no geocoding pipeline — see supabase/schema-notes.md), so there are no
// stop coordinates to draw a path through. Only real, reported driver GPS
// positions are ever shown here.
export function FleetMap({ className }: { className?: string }) {
  const { t, i18n } = useTranslation()
  const { data: locations = [] } = useDriverLocations()
  const { data: drivers = [] } = useDrivers()
  const { data: routes = [] } = useRoutes()

  const driverById = useMemo(() => new Map(drivers.map((d) => [d.id, d])), [drivers])
  const routeById = useMemo(() => new Map(routes.map((r) => [r.id, r])), [routes])
  const points = useMemo<[number, number][]>(() => locations.map((l) => [l.lat, l.lng]), [locations])

  const rows = locations
    .map((loc) => ({ loc, driver: driverById.get(loc.driverId) }))
    .filter((r): r is { loc: (typeof locations)[number]; driver: NonNullable<typeof r.driver> } => !!r.driver)
    .sort((a, b) => a.driver.fullName.localeCompare(b.driver.fullName))

  return (
    <div className={cn('flex flex-col overflow-hidden rounded-xl border border-border lg:flex-row', className)}>
      <div className="medroute-map relative min-h-[280px] flex-1">
        <MapContainer
          center={PR_CENTER}
          zoom={9}
          scrollWheelZoom
          className="h-full w-full"
          style={{ background: 'var(--color-muted)' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <FitToDrivers points={points} />
          {rows.map(({ loc, driver }) => {
            const route = loc.routeId ? routeById.get(loc.routeId) : undefined
            const done = route ? route.stops.filter((s) => s.status === 'delivered').length : 0
            const total = route ? route.stops.length : 0
            return (
              <Marker
                key={loc.driverId}
                position={[loc.lat, loc.lng]}
                icon={driverDivIcon(initials(driver.fullName), driver.status === 'on_route' ? 'primary' : 'muted')}
              >
                <Popup>
                  <div className="flex min-w-[170px] flex-col gap-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold">{driver.fullName}</p>
                      <StatusBadge status={driver.status} />
                    </div>
                    {route ? (
                      <>
                        <p className="text-xs text-muted-foreground">{route.name}</p>
                        <RouteMiniTrack done={done} total={total} />
                        <p className="font-numeric text-[11px] text-muted-foreground">
                          {done}/{total} {t('routes.stops')}
                        </p>
                      </>
                    ) : (
                      <p className="text-xs text-muted-foreground">{t('fleetMap.noActiveRoute')}</p>
                    )}
                    <p className="text-[11px] text-muted-foreground">{formatRelativeTime(loc.updatedAt, i18n.language)}</p>
                  </div>
                </Popup>
              </Marker>
            )
          })}
        </MapContainer>

        {rows.length === 0 && (
          <div className="pointer-events-none absolute inset-x-0 bottom-3 flex justify-center px-4">
            <div className="pointer-events-auto flex items-center gap-2 rounded-full border border-border bg-card/95 px-3.5 py-2 text-xs text-muted-foreground shadow-elevate backdrop-blur-md">
              <Satellite className="h-3.5 w-3.5" /> {t('fleetMap.noLiveLocations')}
            </div>
          </div>
        )}
      </div>

      <div className="flex w-full shrink-0 flex-col border-t border-border bg-card lg:w-64 lg:border-l lg:border-t-0">
        <div className="flex items-center gap-1.5 border-b border-border px-3.5 py-2.5">
          <Truck className="h-3.5 w-3.5 text-muted-foreground" />
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {t('fleetMap.onTheRoad')} ({rows.length})
          </p>
        </div>
        <div className="flex max-h-[220px] flex-col divide-y divide-border overflow-y-auto scrollbar-thin lg:max-h-none lg:flex-1">
          {rows.length === 0 ? (
            <p className="px-3.5 py-4 text-xs text-muted-foreground">{t('fleetMap.noLiveLocations')}</p>
          ) : (
            rows.map(({ loc, driver }) => {
              const route = loc.routeId ? routeById.get(loc.routeId) : undefined
              return (
                <div key={loc.driverId} className="flex items-center gap-2.5 px-3.5 py-2.5">
                  <Avatar className="h-7 w-7 shrink-0">
                    <AvatarFallback className="text-[10px]">{initials(driver.fullName)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{driver.fullName}</p>
                    <p className="truncate text-[11px] text-muted-foreground">
                      {route?.name ?? t('fleetMap.noActiveRoute')}
                    </p>
                  </div>
                  <StatusBadge status={driver.status} className="shrink-0" />
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
