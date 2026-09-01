import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

if (!url || !anonKey) {
  // eslint-disable-next-line no-console
  console.error('Missing Supabase environment variables. Check your .env file.')
}

export const supabase = createClient(url, anonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
})

export const DEMO_PASSWORD = 'Demo1234!'

export const DEMO_ACCOUNTS = [
  { role: 'owner', email: 'owner@medroute.demo' },
  { role: 'general_manager', email: 'gm@medroute.demo' },
  { role: 'dispatch', email: 'dispatch@medroute.demo' },
  { role: 'staff', email: 'staff@medroute.demo' },
  { role: 'driver', email: 'driver1@medroute.demo' },
] as const
