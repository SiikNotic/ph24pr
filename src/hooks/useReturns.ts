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
        notes: input.notes || null,
        is_controlled_substance: input.isControlledSubstance,
      })
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['returns'] }),
  })
}

export function useResolveReturn() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      id,
      status,
      resolvedBy,
    }: {
      id: string
      status: ReturnStatus
      resolvedBy: string
    }) => {
      const { error } = await supabase
        .from('returns')
        .update({ status, resolved_at: new Date().toISOString(), resolved_by: resolvedBy })
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['returns'] }),
  })
}
