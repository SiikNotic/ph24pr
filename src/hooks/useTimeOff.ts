import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { mapTimeOffRequest } from '@/lib/mappers'
import { useAuthStore } from '@/store/auth'

// All pending + recently reviewed requests visible to Dispatch and above
// (RLS already scopes this to is_ops() for those roles, or to "my own
// requests" for everyone else — this hook is for the management review
// list, useMyTimeOffRequests below is for "my own requests").
export function useTimeOffRequests() {
  return useQuery({
    queryKey: ['time_off_requests'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('time_off_requests')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw error
      return data.map(mapTimeOffRequest)
    },
  })
}

export function useMyTimeOffRequests() {
  const userId = useAuthStore((s) => s.session?.user.id)
  return useQuery({
    queryKey: ['time_off_requests', 'mine', userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('time_off_requests')
        .select('*')
        .eq('requester_id', userId)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data.map(mapTimeOffRequest)
    },
  })
}

export function useCreateTimeOffRequest() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: { startDate: string; endDate: string; reason?: string }) => {
      const { data, error } = await supabase.rpc('create_time_off_request', {
        p_start_date: input.startDate,
        p_end_date: input.endDate,
        p_reason: input.reason || null,
      })
      if (error) throw error
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['time_off_requests'] })
      qc.invalidateQueries({ queryKey: ['notifications'] })
    },
  })
}

export function useReviewTimeOffRequest() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      requestId,
      approve,
      reviewNote,
    }: {
      requestId: string
      approve: boolean
      reviewNote?: string
    }) => {
      const { data, error } = await supabase.rpc('review_time_off_request', {
        p_request_id: requestId,
        p_approve: approve,
        p_review_note: reviewNote || null,
      })
      if (error) throw error
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['time_off_requests'] })
      qc.invalidateQueries({ queryKey: ['availability'] })
      qc.invalidateQueries({ queryKey: ['notifications'] })
    },
  })
}
