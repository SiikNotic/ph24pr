import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { mapPackage } from '@/lib/mappers'
import { generatePackageIdentity } from '@/lib/packageCode'
import { STOP_COLUMNS } from '@/hooks/useRoutes'
import type { DeliveryMethod, Priority } from '@/types/domain'

export function usePackages(routeId: string | undefined) {
  return useQuery({
    queryKey: ['packages', routeId],
    enabled: !!routeId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('packages')
        .select('*')
        .eq('route_id', routeId)
        .order('created_at')
      if (error) throw error
      return data.map(mapPackage)
    },
  })
}

function generateDeliveryPin() {
  return String(Math.floor(1000 + Math.random() * 9000))
}

interface AddDeliveryInput {
  routeId: string
  sequence: number
  customerId: string
  customerName: string
  customerPhone?: string
  address: string
  priority: Priority
  packageCount: number
  isControlledSubstance: boolean
  requiresSignature: boolean
  deliveryMethod: DeliveryMethod
}

// Adds one delivery (a route_stop) to a route and mints a uniquely
// identified package — with its own code + QR payload — for every unit in
// packageCount. These identities are generated once, here, and never
// change again: reprinting a label later must reuse them exactly. When the
// configured delivery method is a PIN, one is generated here too — known
// to whoever creates the delivery (so they can relay it to the recipient),
// never to the driver.
export function useAddDelivery() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: AddDeliveryInput) => {
      const { data: stop, error: stopError } = await supabase
        .from('route_stops')
        .insert({
          route_id: input.routeId,
          sequence: input.sequence,
          customer_id: input.customerId,
          customer_name: input.customerName,
          customer_phone: input.customerPhone || null,
          address: input.address,
          priority: input.priority,
          package_count: input.packageCount,
          is_controlled_substance: input.isControlledSubstance,
          requires_signature: input.requiresSignature,
          delivery_method: input.deliveryMethod,
          delivery_pin: input.deliveryMethod === 'pin_required' ? generateDeliveryPin() : null,
        })
        // Explicit columns — never `*` — since authenticated has no SELECT
        // grant on delivery_pin (see supabase/schema-notes.md). We just set
        // it above; PostgREST would otherwise try to return it and fail.
        // (Cast: a dynamic column-list string defeats supabase-js's
        // literal-type row inference.)
        .select(STOP_COLUMNS)
        .single<{ id: string }>()
      if (stopError) throw stopError

      const packageRows = Array.from({ length: input.packageCount }, (_, i) => {
        const identity = generatePackageIdentity()
        return {
          id: identity.id,
          route_id: input.routeId,
          stop_id: stop.id,
          sequence: i + 1,
          code: identity.code,
          qr_payload: identity.qrPayload,
        }
      })
      const { error: pkgError } = await supabase.from('packages').insert(packageRows)
      if (pkgError) throw pkgError

      return stop
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ['route', variables.routeId] })
      qc.invalidateQueries({ queryKey: ['packages', variables.routeId] })
      qc.invalidateQueries({ queryKey: ['routes'] })
    },
  })
}

export function useRemoveDelivery() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ stopId }: { stopId: string; routeId: string }) => {
      // packages cascade-delete with the stop
      const { error } = await supabase.from('route_stops').delete().eq('id', stopId)
      if (error) throw error
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ['route', variables.routeId] })
      qc.invalidateQueries({ queryKey: ['packages', variables.routeId] })
      qc.invalidateQueries({ queryKey: ['routes'] })
    },
  })
}

// Printing and reprinting are the exact same operation: stamp the existing
// package row as printed and bump the counter. Nothing is ever inserted
// here, so a failed or damaged label can be reprinted any number of times
// without ever creating a duplicate package.
export function usePrintLabel() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ packageId }: { packageId: string; routeId: string }) => {
      // Atomic server-side increment so concurrent print clicks can never
      // race each other into an inconsistent print_count.
      const { error } = await supabase.rpc('increment_package_print', { p_package_id: packageId })
      if (error) throw error
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ['packages', variables.routeId] })
    },
  })
}

// The driver must scan every package for a stop before completing it. The
// RPC verifies the scanned QR payload actually matches this package and
// that the caller is that route's assigned driver — it never trusts the
// client's own judgement of what was scanned.
export function useScanPackage() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ packageId, qrPayload }: { packageId: string; qrPayload: string; routeId: string }) => {
      const { data, error } = await supabase.rpc('scan_package', {
        p_package_id: packageId,
        p_qr_payload: qrPayload,
      })
      if (error) throw error
      return mapPackage(data)
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ['packages', variables.routeId] })
    },
  })
}
