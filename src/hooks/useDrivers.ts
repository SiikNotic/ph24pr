import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { mapDriver } from '@/lib/mappers'
import type { DriverStatus } from '@/types/domain'

export function useDrivers() {
  return useQuery({
    queryKey: ['drivers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('drivers')
        .select('*, profiles(full_name, email, phone, avatar_url)')
        .order('created_at')
      if (error) throw error
      return data.map(mapDriver)
    },
  })
}

export function useUpdateDriverStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: DriverStatus }) => {
      const { error } = await supabase.from('drivers').update({ status }).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['drivers'] })
      qc.invalidateQueries({ queryKey: ['routes'] })
    },
  })
}

export function useUpdateDriver() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input: Record<string, any> }) => {
      const { error } = await supabase.from('drivers').update(input).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['drivers'] }),
  })
}
