import { useEffect, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { mapDriverLocation } from '@/lib/mappers'

// Polled by the dispatch fleet map — every back-office-visible driver's
// live/last-known GPS pin. RLS already scopes this to is_back_office()
// seeing everything (see driver_locations_select in schema-notes.md), so
// this is a plain select, no RPC needed. Polling (not a realtime channel)
// to match every other "live-ish" read in this app (DeliveryFlow's own
// 15s route poll) rather than introducing a new transport.
export function useDriverLocations() {
  return useQuery({
    queryKey: ['driver_locations'],
    refetchInterval: 8_000,
    queryFn: async () => {
      const { data, error } = await supabase.from('driver_locations').select('*')
      if (error) throw error
      return data.map(mapDriverLocation)
    },
  })
}

// Reports the browser's own geolocation up to update_driver_location()
// while `enabled` (the driver has a route actively in progress). Silent
// no-op if geolocation is unsupported or permission is denied — sharing a
// live position is a nice-to-have for dispatch, never a blocker for the
// driver's own delivery workflow.
export function useBroadcastDriverLocation(enabled: boolean) {
  const deniedRef = useRef(false)

  useEffect(() => {
    if (!enabled || typeof navigator === 'undefined' || !navigator.geolocation) return
    deniedRef.current = false

    const lastPosition = { current: null as GeolocationPosition | null }

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        lastPosition.current = pos
      },
      () => {
        deniedRef.current = true
      },
      { enableHighAccuracy: true, maximumAge: 10_000 },
    )

    async function push() {
      const pos = lastPosition.current
      if (!pos || deniedRef.current) return
      await supabase.rpc('update_driver_location', {
        p_lat: pos.coords.latitude,
        p_lng: pos.coords.longitude,
        p_heading: pos.coords.heading,
        p_speed: pos.coords.speed,
        p_accuracy: pos.coords.accuracy,
      })
    }

    // Push immediately once we have a first fix, then on a steady interval
    // — watchPosition itself can fire far more often than we want to
    // write to the database.
    const interval = setInterval(push, 8_000)
    const initialTimeout = setTimeout(push, 2_000)

    return () => {
      navigator.geolocation.clearWatch(watchId)
      clearInterval(interval)
      clearTimeout(initialTimeout)
    }
  }, [enabled])
}
