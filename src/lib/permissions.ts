import type { Role } from '@/types/domain'

export type Section =
  | 'dashboard'
  | 'routes'
  | 'customers'
  | 'drivers'
  | 'returns'
  | 'availability'
  | 'notifications'
  | 'reports'
  | 'settings'
  | 'help'

export type Action =
  | 'view'
  | 'create'
  | 'edit'
  | 'delete'
  | 'assign'
  | 'export'
  | 'manage_users'
  | 'manage_roles'
  | 'manage_org'
  | 'manage_integrations'
  | 'resolve'
  | 'request'
  | 'approve'

// Row-level scoping applied on top of section access: 'all' sees every
// record, 'own' is restricted to records tied to the signed-in user
// (a driver only ever sees their own routes/availability/notifications).
export type Scope = 'all' | 'own'

type SectionGrant = {
  actions: Action[]
  scope: Scope
}

const R: Record<Role, Partial<Record<Section, SectionGrant>>> = {
  owner: {
    dashboard: { actions: ['view', 'export'], scope: 'all' },
    routes: { actions: ['view', 'create', 'edit', 'delete', 'assign', 'export'], scope: 'all' },
    customers: { actions: ['view', 'create', 'edit', 'delete', 'export'], scope: 'all' },
    drivers: { actions: ['view', 'create', 'edit', 'delete', 'export'], scope: 'all' },
    returns: { actions: ['view', 'create', 'edit', 'delete', 'resolve', 'export'], scope: 'all' },
    availability: { actions: ['view', 'create', 'edit', 'delete', 'approve'], scope: 'all' },
    notifications: { actions: ['view', 'create', 'delete'], scope: 'all' },
    reports: { actions: ['view', 'export'], scope: 'all' },
    settings: {
      actions: ['view', 'edit', 'manage_users', 'manage_roles', 'manage_org', 'manage_integrations'],
      scope: 'all',
    },
    help: { actions: ['view', 'create', 'edit'], scope: 'all' },
  },
  general_manager: {
    dashboard: { actions: ['view', 'export'], scope: 'all' },
    routes: { actions: ['view', 'create', 'edit', 'delete', 'assign', 'export'], scope: 'all' },
    customers: { actions: ['view', 'create', 'edit', 'delete', 'export'], scope: 'all' },
    drivers: { actions: ['view', 'create', 'edit', 'delete', 'export'], scope: 'all' },
    returns: { actions: ['view', 'create', 'edit', 'resolve', 'export'], scope: 'all' },
    availability: { actions: ['view', 'create', 'edit', 'delete', 'approve'], scope: 'all' },
    notifications: { actions: ['view', 'create'], scope: 'all' },
    reports: { actions: ['view', 'export'], scope: 'all' },
    settings: { actions: ['view', 'edit', 'manage_users', 'manage_integrations'], scope: 'all' },
    help: { actions: ['view', 'create', 'edit'], scope: 'all' },
  },
  dispatch: {
    dashboard: { actions: ['view'], scope: 'all' },
    routes: { actions: ['view', 'create', 'edit', 'assign', 'export'], scope: 'all' },
    customers: { actions: ['view', 'create', 'edit'], scope: 'all' },
    drivers: { actions: ['view'], scope: 'all' },
    returns: { actions: ['view', 'create', 'edit', 'resolve'], scope: 'all' },
    availability: { actions: ['view', 'approve'], scope: 'all' },
    notifications: { actions: ['view', 'create'], scope: 'all' },
    reports: { actions: ['view'], scope: 'all' },
    help: { actions: ['view'], scope: 'all' },
  },
  staff: {
    dashboard: { actions: ['view'], scope: 'all' },
    routes: { actions: ['view'], scope: 'all' },
    customers: { actions: ['view', 'create', 'edit'], scope: 'all' },
    drivers: { actions: ['view'], scope: 'all' },
    returns: { actions: ['view', 'create'], scope: 'all' },
    availability: { actions: ['view', 'request'], scope: 'all' },
    notifications: { actions: ['view'], scope: 'all' },
    help: { actions: ['view'], scope: 'all' },
  },
  driver: {
    dashboard: { actions: ['view'], scope: 'own' },
    routes: { actions: ['view', 'edit'], scope: 'own' },
    returns: { actions: ['view', 'create'], scope: 'own' },
    availability: { actions: ['view', 'create', 'edit', 'request'], scope: 'own' },
    notifications: { actions: ['view'], scope: 'own' },
    help: { actions: ['view'], scope: 'all' },
  },
}

export function getGrant(role: Role, section: Section): SectionGrant | undefined {
  return R[role]?.[section]
}

export function canView(role: Role, section: Section): boolean {
  return !!getGrant(role, section)?.actions.includes('view')
}

export function can(role: Role, section: Section, action: Action): boolean {
  return !!getGrant(role, section)?.actions.includes(action)
}

export function scopeFor(role: Role, section: Section): Scope {
  return getGrant(role, section)?.scope ?? 'own'
}

export const ALL_SECTIONS: Section[] = [
  'dashboard',
  'routes',
  'customers',
  'drivers',
  'returns',
  'availability',
  'notifications',
  'reports',
  'settings',
  'help',
]

export function visibleSections(role: Role): Section[] {
  return ALL_SECTIONS.filter((s) => canView(role, s))
}

export const ROLE_LABELS: Record<Role, { en: string; es: string }> = {
  owner: { en: 'Owner', es: 'Propietario' },
  general_manager: { en: 'General Manager', es: 'Gerente General' },
  dispatch: { en: 'Dispatch', es: 'Despacho' },
  staff: { en: 'Staff', es: 'Personal' },
  driver: { en: 'Driver', es: 'Conductor' },
}
