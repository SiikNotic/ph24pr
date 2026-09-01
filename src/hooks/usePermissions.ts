import { useAuthStore } from '@/store/auth'
import { can, canView, scopeFor, visibleSections, type Action, type Section } from '@/lib/permissions'

export function usePermissions() {
  const role = useAuthStore((s) => s.profile?.role)

  return {
    role,
    canView: (section: Section) => (role ? canView(role, section) : false),
    can: (section: Section, action: Action) => (role ? can(role, section, action) : false),
    scope: (section: Section) => (role ? scopeFor(role, section) : 'own'),
    sections: role ? visibleSections(role) : [],
    isDriver: role === 'driver',
    isManager: role === 'owner' || role === 'general_manager',
    isOwner: role === 'owner',
  }
}
