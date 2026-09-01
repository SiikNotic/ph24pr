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
        customerNoResponseWaitSeconds: (data.customer_no_response_wait_seconds as number) ?? 180,
        returnReasonOptions: (data.return_reason_options as string[]) ?? [],
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

// Configures the failed-delivery flow: how long the "customer does not
// respond" countdown runs, and the company's own extra "Other" return
// reasons a driver can pick from.
export function useUpdateFailedDeliverySettings() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: { customerNoResponseWaitSeconds: number; returnReasonOptions: string[] }) => {
      const { error } = await supabase
        .from('org_settings')
        .update({
          customer_no_response_wait_seconds: input.customerNoResponseWaitSeconds,
          return_reason_options: input.returnReasonOptions,
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

// Provisions a real Supabase Auth account for a new teammate — there's no
// self-service sign-up, so this is the only way an account comes to exist
// besides creating one by hand in Supabase. See invite_team_member() in
// supabase/schema-notes.md: security-definer, restricted to owner/general
// manager, inserts directly into auth.users/auth.identities.
export function useInviteTeamMember() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: { email: string; fullName: string; role: string; tempPassword: string; phone?: string }) => {
      const { data, error } = await supabase.rpc('invite_team_member', {
        p_email: input.email,
        p_full_name: input.fullName,
        p_role: input.role,
        p_temp_password: input.tempPassword,
        p_phone: input.phone || null,
      })
      if (error) throw error
      return data as string
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['team_members'] })
      qc.invalidateQueries({ queryKey: ['drivers'] })
    },
  })
}
