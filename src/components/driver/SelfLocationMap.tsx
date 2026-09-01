import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import { LocateFixed } from 'lucide-react'
import { selfLocationDivIcon } from '@/lib/leafletIcons'

function Recenter({ position }: { position: [number, number] }) {
  const map = useMap()
  useEffect(() => {
    map.setView(position, map.getZoom() < 14 ? 15 : map.getZoom(), { animate: true })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [position[0], position[1]])
  return null
}

// A small "you are here" map on the current-stop screen — deliberately
// not a route/destination map: this app has no coordinates for customer
// addresses (text-only, see supabase/schema-notes.md), only the driver's
// own live GPS. Real turn-by-turn goes through the device's own maps app
// via the "Navigate" button instead of being reimplemented here.
export function SelfLocationMap({ className }: { className?: string }) {
  const { t } = useTranslation()
  const [position, setPosition] = useState<[number, number] | null>(null)
  const [denied, setDenied] = useState(false)

  useEffect(() => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setDenied(true)
      return
    }
    const watchId = navigator.geolocation.watchPosition(
      (pos) => setPosition([pos.coords.latitude, pos.coords.longitude]),
      () => setDenied(true),
      { enableHighAccuracy: true, maximumAge: 10_000 },
    )
    return () => navigator.geolocation.clearWatch(watchId)
  }, [])

  if (denied || !position) {
    return (
      <div className={`medroute-map flex items-center justify-center gap-2 rounded-xl border border-border bg-muted/40 text-xs text-muted-foreground ${className ?? ''}`}>
        <LocateFixed className="h-4 w-4" /> {t('delivery.locationUnavailable')}
      </div>
    )
  }

  return (
    <div className={`medroute-map overflow-hidden rounded-xl border border-border ${className ?? ''}`}>
      <MapContainer center={position} zoom={15} zoomControl={false} dragging={false} scrollWheelZoom={false} doubleClickZoom={false} className="h-full w-full">
        <TileLayer
          attribution='&copy; OpenStreetMap'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Recenter position={position} />
        <Marker position={position} icon={selfLocationDivIcon()} />
      </MapContainer>
    </div>
  )
}
