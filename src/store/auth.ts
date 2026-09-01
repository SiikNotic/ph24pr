import { create } from 'zustand'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import type { Profile, Driver } from '@/types/domain'

interface AuthState {
  session: Session | null
  profile: Profile | null
  driver: Driver | null
  loading: boolean
  error: string | null
  init: () => () => void
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

function mapProfile(row: any): Profile {
  return {
    id: row.id,
    email: row.email,
    fullName: row.full_name,
    role: row.role,
    phone: row.phone ?? undefined,
    avatarUrl: row.avatar_url ?? undefined,
    active: row.active,
    createdAt: row.created_at,
  }
}

function mapDriver(row: any): Driver {
  return {
    id: row.id,
    profileId: row.profile_id,
    fullName: row.profiles?.full_name ?? '',
    email: row.profiles?.email ?? '',
    phone: row.profiles?.phone ?? '',
    avatarUrl: row.profiles?.avatar_url ?? undefined,
    status: row.status,
    vehicleType: row.vehicle_type,
    vehiclePlate: row.vehicle_plate ?? undefined,
    licenseNumber: row.license_number ?? undefined,
    licenseExpiry: row.license_expiry ?? undefined,
    backgroundCheckOk: row.background_check_ok,
    hipaaCertified: row.hipaa_certified,
    rating: row.rating ?? undefined,
    createdAt: row.created_at,
  }
}

async function loadProfileAndDriver(userId: string) {
  const { data: profileRow, error: profileErr } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()
  if (profileErr) throw profileErr

  let driver: Driver | null = null
  if (profileRow.role === 'driver') {
    const { data: driverRow } = await supabase
      .from('drivers')
      .select('*, profiles(full_name, email, phone, avatar_url)')
      .eq('profile_id', userId)
      .maybeSingle()
    if (driverRow) driver = mapDriver(driverRow)
  }
  return { profile: mapProfile(profileRow), driver }
}

export const useAuthStore = create<AuthState>((set, get) => ({
  session: null,
  profile: null,
  driver: null,
  loading: true,
  error: null,

  init: () => {
    supabase.auth.getSession().then(async ({ data }) => {
      if (data.session) {
        try {
          const { profile, driver } = await loadProfileAndDriver(data.session.user.id)
          set({ session: data.session, profile, driver, loading: false })
        } catch {
          set({ session: data.session, loading: false })
        }
      } else {
        set({ loading: false })
      }
    })

    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session) {
        try {
          const { profile, driver } = await loadProfileAndDriver(session.user.id)
          set({ session, profile, driver, loading: false, error: null })
        } catch {
          set({ session, loading: false })
        }
      } else {
        set({ session: null, profile: null, driver: null, loading: false })
      }
    })

    return () => sub.subscription.unsubscribe()
  },

  signIn: async (email: string, password: string) => {
    set({ error: null, loading: true })
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      set({ error: error.message, loading: false })
      throw error
    }
  },

  signOut: async () => {
    await supabase.auth.signOut()
    set({ session: null, profile: null, driver: null })
  },

  refreshProfile: async () => {
    const session = get().session
    if (!session) return
    const { profile, driver } = await loadProfileAndDriver(session.user.id)
    set({ profile, driver })
  },
}))
