import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { mapRoute, mapAssignmentEvent } from '@/lib/mappers'
import type { ReassignmentReason, RouteStatus, StopStatus } from '@/types/domain'

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

// Step 1 of the route workflow: the manager just picks an internal name and
// a date. The route is created as 'draft' — deliveries, packages, and
// labels are all added afterwards in the route builder.
export function useCreateRouteShell() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: { name: string; date: string }) => {
      const { data, error } = await supabase
        .from('routes')
        .insert({ name: input.name, date: input.date, status: 'draft' })
        .select()
        .single()
      if (error) throw error
      return data as { id: string }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['routes'] }),
  })
}

// Confirms a route (draft -> scheduled). The database itself refuses this
// transition if any package's label hasn't been printed yet (see the
// routes_check_labels_before_confirm trigger), so this is defense in depth
// on top of the UI's own gating.
export function useConfirmRoute() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (routeId: string) => {
      const { error } = await supabase.from('routes').update({ status: 'scheduled' }).eq('id', routeId)
      if (error) throw error
    },
    onSuccess: (_data, routeId) => {
      qc.invalidateQueries({ queryKey: ['routes'] })
      qc.invalidateQueries({ queryKey: ['route', routeId] })
    },
  })
}

// The only way a route's driver ever changes — whether it's the first
// assignment after confirming a route, or reassigning a live route to a
// new driver. It never touches route_stops or packages: existing scanned
// packages, delivery history, and progress all carry over untouched. The
// database (reassign_route_driver RPC) atomically flips routes.driver_id,
// writes an audit row to route_assignment_history, and notifies both the
// outgoing and incoming driver — see supabase/schema-notes.md.
export function useReassignDriver() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      routeId,
      driverId,
      reason = 'operational_change',
      notes,
    }: {
      routeId: string
      driverId: string | null
      reason?: ReassignmentReason
      notes?: string
    }) => {
      const { data, error } = await supabase.rpc('reassign_route_driver', {
        p_route_id: routeId,
        p_new_driver_id: driverId,
        p_reason: reason,
        p_notes: notes || null,
      })
      if (error) throw error
      return data
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ['routes'] })
      qc.invalidateQueries({ queryKey: ['route', variables.routeId] })
      qc.invalidateQueries({ queryKey: ['notifications'] })
      qc.invalidateQueries({ queryKey: ['route_assignment_history', variables.routeId] })
    },
  })
}

export function useRouteAssignmentHistory(routeId: string | undefined) {
  return useQuery({
    queryKey: ['route_assignment_history', routeId],
    enabled: !!routeId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('route_assignment_history')
        .select('*')
        .eq('route_id', routeId)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data.map(mapAssignmentEvent)
    },
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
