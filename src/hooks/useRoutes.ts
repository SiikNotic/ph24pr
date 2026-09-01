import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { mapRoute, mapAssignmentEvent, mapStop, mapAddressHistoryEvent } from '@/lib/mappers'
import type { ReassignmentReason, ReturnReason, RouteStatus } from '@/types/domain'

// Explicit column list (never `*`) so this never touches route_stops's
// delivery_pin column, which has no SELECT grant for authenticated/anon —
// a driver is never meant to see the PIN, only compare against it via the
// complete_delivery() RPC.
export const STOP_COLUMNS =
  'id, route_id, sequence, customer_id, customer_name, customer_phone, address, priority, status, package_count, ' +
  'is_controlled_substance, requires_signature, scheduled_window_start, scheduled_window_end, ' +
  'delivered_at, signed_by, notes, failure_reason, delivery_method, delivery_photo_data, ' +
  'delivery_leave_location, delivery_signature_data, recipient_name, return_wait_started_at, ' +
  'address_issue_flagged_at, address_issue_notes'

const ROUTE_SELECT = `*, drivers(id, profiles(full_name)), route_stops(${STOP_COLUMNS})`

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

// `refetchInterval` is used by the driver's active DeliveryFlow screen so a
// dispatch-corrected address (or any other change) shows up automatically
// without the driver having to back out and reopen the stop.
export function useRoute(id: string | undefined, options?: { refetchInterval?: number }) {
  return useQuery({
    queryKey: ['route', id],
    enabled: !!id,
    refetchInterval: options?.refetchInterval,
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

// Starts (or resumes) the "customer does not respond" countdown for a stop.
// Idempotent server-side: calling it again after the app reloads just
// returns the original start time rather than restarting the clock.
export function useStartReturnWait() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (stopId: string) => {
      const { data, error } = await supabase.rpc('start_return_wait', { p_stop_id: stopId })
      if (error) throw error
      return mapStop(data)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['routes'] }),
  })
}

// The only path that turns a delivery into "Pending Return". The database
// re-validates the "customer does not respond" wait itself -- it cannot be
// completed before the company-configured countdown has actually elapsed,
// no matter what the client sends.
export function useReportDeliveryFailure() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      stopId,
      reason,
      customReason,
      notes,
    }: {
      stopId: string
      reason: ReturnReason
      customReason?: string
      notes?: string
    }) => {
      const { data, error } = await supabase.rpc('report_delivery_failure', {
        p_stop_id: stopId,
        p_reason: reason,
        p_custom_reason: customReason || null,
        p_notes: notes || null,
      })
      if (error) throw error
      return mapStop(data)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['routes'] })
      qc.invalidateQueries({ queryKey: ['returns'] })
      qc.invalidateQueries({ queryKey: ['notifications'] })
    },
  })
}

// Driver flags "Incorrect Address / Address Not Found" for a stop. Drivers
// can never change the address itself — this only raises the issue to
// dispatch (report_address_issue() is the only writer of these two columns;
// direct client writes are blocked by a column-level revoke).
export function useReportAddressIssue() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ stopId, notes }: { stopId: string; notes?: string }) => {
      const { data, error } = await supabase.rpc('report_address_issue', {
        p_stop_id: stopId,
        p_notes: notes || null,
      })
      if (error) throw error
      return mapStop(data)
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['routes'] })
      qc.invalidateQueries({ queryKey: ['route', data.routeId] })
      qc.invalidateQueries({ queryKey: ['notifications'] })
    },
  })
}

// The only path that ever changes a stop's delivery address — restricted to
// dispatch and above. Never touches packages or creates a new stop/route;
// the original address is preserved in stop_address_history.
export function useUpdateStopAddress() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      stopId,
      newAddress,
      reason,
      notes,
    }: {
      stopId: string
      newAddress: string
      reason?: string
      notes?: string
    }) => {
      const { data, error } = await supabase.rpc('update_stop_address', {
        p_stop_id: stopId,
        p_new_address: newAddress,
        p_reason: reason || null,
        p_notes: notes || null,
      })
      if (error) throw error
      return mapStop(data)
    },
    onSuccess: (data, variables) => {
      qc.invalidateQueries({ queryKey: ['routes'] })
      qc.invalidateQueries({ queryKey: ['route', data.routeId] })
      qc.invalidateQueries({ queryKey: ['notifications'] })
      qc.invalidateQueries({ queryKey: ['stop_address_history', variables.stopId] })
    },
  })
}

export function useStopAddressHistory(stopId: string | undefined) {
  return useQuery({
    queryKey: ['stop_address_history', stopId],
    enabled: !!stopId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('stop_address_history')
        .select('*')
        .eq('stop_id', stopId)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data.map(mapAddressHistoryEvent)
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
