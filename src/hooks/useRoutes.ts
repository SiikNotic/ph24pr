import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { mapRoute } from '@/lib/mappers'
import type { RouteStatus, StopStatus } from '@/types/domain'

const ROUTE_SELECT = '*, drivers(id, profiles(full_name)), route_stops(*)'

export function useRoutes(date?: string) {
  return useQuery({
    queryKey: ['routes', date ?? 'all'],
    queryFn: async () => {
      let query = supabase.from('routes').select(ROUTE_SELECT).order('date', { ascending: false })
      if (date) query = query.eq('date', date)
      const { data, error } = await query
      if (error) throw error
      return data.map(mapRoute)
    },
  })
}

export function useRoute(id: string | undefined) {
  return useQuery({
    queryKey: ['route', id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase.from('routes').select(ROUTE_SELECT).eq('id', id).single()
      if (error) throw error
      return mapRoute(data)
    },
  })
}

interface NewStopInput {
  customerId: string
  customerName: string
  address: string
  priority: string
  packageCount: number
  isControlledSubstance: boolean
  requiresSignature: boolean
}

export function useCreateRoute() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: { name: string; date: string; driverId?: string | null; stops: NewStopInput[] }) => {
      const { data: route, error } = await supabase
        .from('routes')
        .insert({ name: input.name, date: input.date, driver_id: input.driverId || null, status: 'scheduled' })
        .select()
        .single()
      if (error) throw error
      if (input.stops.length) {
        const rows = input.stops.map((s, i) => ({
          route_id: route.id,
          sequence: i + 1,
          customer_id: s.customerId,
          customer_name: s.customerName,
          address: s.address,
          priority: s.priority,
          package_count: s.packageCount,
          is_controlled_substance: s.isControlledSubstance,
          requires_signature: s.requiresSignature,
        }))
        const { error: stopsError } = await supabase.from('route_stops').insert(rows)
        if (stopsError) throw stopsError
      }
      return route
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['routes'] }),
  })
}

export function useAssignDriver() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ routeId, driverId }: { routeId: string; driverId: string | null }) => {
      const { error } = await supabase.from('routes').update({ driver_id: driverId }).eq('id', routeId)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['routes'] }),
  })
}

export function useUpdateRouteStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ routeId, status }: { routeId: string; status: RouteStatus }) => {
      const patch: Record<string, any> = { status }
      if (status === 'in_progress') patch.started_at = new Date().toISOString()
      if (status === 'completed') patch.completed_at = new Date().toISOString()
      const { error } = await supabase.from('routes').update(patch).eq('id', routeId)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['routes'] }),
  })
}

export function useUpdateStop() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      stopId,
      status,
      signedBy,
      failureReason,
      notes,
    }: {
      stopId: string
      status: StopStatus
      signedBy?: string
      failureReason?: string
      notes?: string
    }) => {
      const patch: Record<string, any> = { status }
      if (status === 'delivered') {
        patch.delivered_at = new Date().toISOString()
        if (signedBy) patch.signed_by = signedBy
      }
      if (status === 'failed' || status === 'returned') {
        if (failureReason) patch.failure_reason = failureReason
      }
      if (notes) patch.notes = notes
      const { error } = await supabase.from('route_stops').update(patch).eq('id', stopId)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['routes'] })
      qc.invalidateQueries({ queryKey: ['returns'] })
    },
  })
}

export function useDeleteRoute() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('routes').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['routes'] }),
  })
}
