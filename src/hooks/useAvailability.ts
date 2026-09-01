import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { mapAvailability } from '@/lib/mappers'
import type { AvailabilityStatus } from '@/types/domain'

export function useAvailability(startDate: string, endDate: string) {
  return useQuery({
    queryKey: ['availability', startDate, endDate],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('availability')
        .select('*, drivers(profiles(full_name))')
        .gte('date', startDate)
        .lte('date', endDate)
      if (error) throw error
      return data.map(mapAvailability)
    },
  })
}

export function useUpsertAvailability() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: {
      driverId: string
      date: string
      status: AvailabilityStatus
      startTime?: string
      endTime?: string
      note?: string
    }) => {
      const { error } = await supabase.from('availability').upsert(
        {
          driver_id: input.driverId,
          date: input.date,
          status: input.status,
          start_time: input.startTime || null,
          end_time: input.endTime || null,
          note: input.note || null,
        },
        { onConflict: 'driver_id,date' },
      )
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['availability'] }),
  })
}
