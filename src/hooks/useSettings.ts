import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export function useOrgSettings() {
  return useQuery({
    queryKey: ['org_settings'],
    queryFn: async () => {
      const { data, error } = await supabase.from('org_settings').select('*').single()
      if (error) throw error
      return { companyName: data.company_name as string, timezone: data.timezone as string }
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
