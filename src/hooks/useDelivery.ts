import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { mapStop } from '@/lib/mappers'

interface CompleteDeliveryInput {
  stopId: string
  routeId: string
  enteredPin?: string
  recipientName?: string
  signatureData?: string
  photoData?: string
  leaveLocation?: string
}

// The single path by which a delivery can be marked complete. The database
// re-validates everything the UI already checked — every package scanned,
// the right proof for the configured delivery method, the correct PIN —
// so none of those rules can be bypassed by calling the API directly.
export function useCompleteDelivery() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: CompleteDeliveryInput) => {
      const { data, error } = await supabase.rpc('complete_delivery', {
        p_stop_id: input.stopId,
        p_entered_pin: input.enteredPin || null,
        p_recipient_name: input.recipientName || null,
        p_signature_data: input.signatureData || null,
        p_photo_data: input.photoData || null,
        p_leave_location: input.leaveLocation || null,
      })
      if (error) throw error
      return mapStop(data)
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ['routes'] })
      qc.invalidateQueries({ queryKey: ['route', variables.routeId] })
    },
  })
}

// Back office only — lets dispatch/staff/managers relay the PIN to the
// recipient. Never fetched for a driver (the RPC itself refuses them).
export function useDeliveryPin(stopId: string | undefined, enabled: boolean) {
  return useQuery({
    queryKey: ['delivery_pin', stopId],
    enabled: !!stopId && enabled,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_delivery_pin', { p_stop_id: stopId })
      if (error) throw error
      return data as string | null
    },
  })
}
