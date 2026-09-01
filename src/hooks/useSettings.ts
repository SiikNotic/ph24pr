import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export function useOrgSettings() {
  return useQuery({
    queryKey: ['org_settings'],
    queryFn: async () => {
      const { data, error } = await supabase.from('org_settings').select('*').single()
      if (error) throw error
      return {
        companyName: data.company_name as string,
        timezone: data.timezone as string,
        requirePhotoForInHand: data.require_photo_for_in_hand as boolean,
        leaveLocationOptions: (data.leave_location_options as string[]) ?? [],
      }
    },
  })
}

export function useUpdateOrgSettings() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: { companyName: string; timezone: string }) => {
      const { error } = await supabase
        .from('org_settings')
        .update({ company_name: input.companyName, timezone: input.timezone, updated_at: new Date().toISOString() })
        .eq('id', true)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['org_settings'] }),
  })
}

// Configures how proof-of-delivery works company-wide: whether an in-hand
// delivery also requires a photo, and which drop-off locations drivers can
// pick from for a "leave at location" delivery.
export function useUpdateDeliverySettings() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: { requirePhotoForInHand: boolean; leaveLocationOptions: string[] }) => {
      const { error } = await supabase
        .from('org_settings')
        .update({
          require_photo_for_in_hand: input.requirePhotoForInHand,
          leave_location_options: input.leaveLocationOptions,
          updated_at: new Date().toISOString(),
        })
        .eq('id', true)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['org_settings'] }),
  })
}

export function useTeamMembers() {
  return useQuery({
    queryKey: ['team_members'],
    queryFn: async () => {
      const { data, error } = await supabase.from('profiles').select('*').order('full_name')
      if (error) throw error
      return data
    },
  })
}

export function useUpdateMemberRole() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, role }: { id: string; role: string }) => {
      const { error } = await supabase.from('profiles').update({ role }).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['team_members'] }),
  })
}
