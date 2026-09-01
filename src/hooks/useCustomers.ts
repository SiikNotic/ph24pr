import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { mapCustomer } from '@/lib/mappers'
import type { Customer } from '@/types/domain'

export function useCustomers() {
  return useQuery({
    queryKey: ['customers'],
    queryFn: async () => {
      const { data, error } = await supabase.from('customers').select('*').order('name')
      if (error) throw error
      return data.map(mapCustomer)
    },
  })
}

type CustomerInput = Omit<Customer, 'id' | 'createdAt'>

function toRow(input: Partial<CustomerInput>) {
  return {
    name: input.name,
    type: input.type,
    address: input.address,
    city: input.city,
    state: input.state,
    zip: input.zip,
    contact_name: input.contactName || null,
    contact_phone: input.contactPhone || null,
    contact_email: input.contactEmail || null,
    requires_signature: input.requiresSignature,
    handles_controlled_substances: input.handlesControlledSubstances,
    delivery_notes: input.deliveryNotes || null,
    active: input.active,
  }
}

export function useCreateCustomer() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: CustomerInput) => {
      const { data, error } = await supabase.from('customers').insert(toRow(input)).select().single()
      if (error) throw error
      return mapCustomer(data)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['customers'] }),
  })
}

export function useUpdateCustomer() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input: Partial<CustomerInput> }) => {
      const { error } = await supabase.from('customers').update(toRow(input)).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['customers'] }),
  })
}

export function useDeleteCustomer() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('customers').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['customers'] }),
  })
}
