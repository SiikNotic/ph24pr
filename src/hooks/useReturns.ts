import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { mapReturn } from '@/lib/mappers'
import type { ReturnReason, ReturnStatus } from '@/types/domain'

export function useReturns() {
  return useQuery({
    queryKey: ['returns'],
    queryFn: async () => {
      const { data, error } = await supabase.from('returns').select('*').order('created_at', { ascending: false })
      if (error) throw error
      return data.map(mapReturn)
    },
  })
}

// Manual, back-office-only return entry (not tied to a driver's failed-
// delivery report -- that always goes through report_delivery_failure()
// instead, which enforces the "customer does not respond" countdown).
export function useCreateReturn() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: {
      stopId?: string
      routeId?: string
      customerId?: string
      customerName: string
      driverId?: string
      driverName?: string
      reason: ReturnReason
      customReason?: string
      notes?: string
      isControlledSubstance: boolean
    }) => {
      const { error } = await supabase.from('returns').insert({
        stop_id: input.stopId || null,
        route_id: input.routeId || null,
        customer_id: input.customerId || null,
        customer_name: input.customerName,
        driver_id: input.driverId || null,
        driver_name: input.driverName || null,
        reason: input.reason,
        custom_reason: input.customReason || null,
        status: 'pending_return',
        notes: input.notes || null,
        is_controlled_substance: input.isControlledSubstance,
      })
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['returns'] }),
  })
}

// The only path from "Pending Return" to "Returned" -- records that the
// package has physically come back to the station, and closes out the
// linked stop too.
export function useMarkReturnReceived() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, notes }: { id: string; notes?: string }) => {
      const { error } = await supabase.rpc('mark_return_received', { p_return_id: id, p_notes: notes || null })
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['returns'] })
      qc.invalidateQueries({ queryKey: ['routes'] })
    },
  })
}

// The only path from 'returned' to a final resolution -- you can't restock,
// dispose, or reschedule redelivery for a package the driver still
// physically has. Logged to the unified audit trail.
export function useResolveReturn() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, status, notes }: { id: string; status: ReturnStatus; notes?: string }) => {
      const { error } = await supabase.rpc('resolve_return', { p_return_id: id, p_status: status, p_notes: notes || null })
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['returns'] }),
  })
}
