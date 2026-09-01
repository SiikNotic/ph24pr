// Row (snake_case, as returned by Supabase) <-> domain object (camelCase) mappers.
import type {
  Customer,
  Driver,
  DeliveryRoute,
  RouteStop,
  ReturnItem,
  AvailabilityEntry,
  AppNotification,
  HelpArticle,
} from '@/types/domain'

export function mapCustomer(row: any): Customer {
  return {
    id: row.id,
    name: row.name,
    type: row.type,
    address: row.address,
    city: row.city,
    state: row.state,
    zip: row.zip,
    lat: row.lat ?? undefined,
    lng: row.lng ?? undefined,
    contactName: row.contact_name ?? undefined,
    contactPhone: row.contact_phone ?? undefined,
    contactEmail: row.contact_email ?? undefined,
    requiresSignature: row.requires_signature,
    handlesControlledSubstances: row.handles_controlled_substances,
    deliveryNotes: row.delivery_notes ?? undefined,
    active: row.active,
    createdAt: row.created_at,
  }
}

export function mapDriver(row: any): Driver {
  const profile = row.profiles ?? {}
  return {
    id: row.id,
    profileId: row.profile_id,
    fullName: profile.full_name ?? row.full_name ?? '',
    email: profile.email ?? row.email ?? '',
    phone: profile.phone ?? row.phone ?? '',
    avatarUrl: profile.avatar_url ?? undefined,
    status: row.status,
    vehicleType: row.vehicle_type,
    vehiclePlate: row.vehicle_plate ?? undefined,
    licenseNumber: row.license_number ?? undefined,
    licenseExpiry: row.license_expiry ?? undefined,
    backgroundCheckOk: row.background_check_ok,
    hipaaCertified: row.hipaa_certified,
    rating: row.rating ?? undefined,
    activeRouteId: row.active_route_id ?? null,
    createdAt: row.created_at,
  }
}

export function mapStop(row: any): RouteStop {
  return {
    id: row.id,
    routeId: row.route_id,
    sequence: row.sequence,
    customerId: row.customer_id,
    customerName: row.customer_name,
    address: row.address,
    priority: row.priority,
    status: row.status,
    packageCount: row.package_count,
    isControlledSubstance: row.is_controlled_substance,
    requiresSignature: row.requires_signature,
    scheduledWindowStart: row.scheduled_window_start ?? undefined,
    scheduledWindowEnd: row.scheduled_window_end ?? undefined,
    deliveredAt: row.delivered_at ?? undefined,
    signedBy: row.signed_by ?? undefined,
    notes: row.notes ?? undefined,
    failureReason: row.failure_reason ?? undefined,
  }
}

export function mapRoute(row: any): DeliveryRoute {
  const driverProfile = row.drivers?.profiles
  return {
    id: row.id,
    name: row.name,
    date: row.date,
    status: row.status,
    driverId: row.driver_id ?? null,
    driverName: driverProfile?.full_name ?? null,
    stops: (row.route_stops ?? []).map(mapStop).sort((a: RouteStop, b: RouteStop) => a.sequence - b.sequence),
    createdAt: row.created_at,
    startedAt: row.started_at ?? undefined,
    completedAt: row.completed_at ?? undefined,
    estimatedDistanceKm: row.estimated_distance_km ?? undefined,
    estimatedDurationMin: row.estimated_duration_min ?? undefined,
  }
}

export function mapReturn(row: any): ReturnItem {
  return {
    id: row.id,
    stopId: row.stop_id ?? '',
    routeId: row.route_id ?? '',
    customerId: row.customer_id ?? '',
    customerName: row.customer_name,
    driverId: row.driver_id ?? undefined,
    driverName: row.driver_name ?? undefined,
    reason: row.reason,
    status: row.status,
    notes: row.notes ?? undefined,
    isControlledSubstance: row.is_controlled_substance,
    createdAt: row.created_at,
    resolvedAt: row.resolved_at ?? undefined,
    resolvedBy: row.resolved_by ?? undefined,
  }
}

export function mapAvailability(row: any): AvailabilityEntry {
  const profile = row.drivers?.profiles
  return {
    id: row.id,
    driverId: row.driver_id,
    driverName: profile?.full_name ?? '',
    date: row.date,
    status: row.status,
    startTime: row.start_time ?? undefined,
    endTime: row.end_time ?? undefined,
    note: row.note ?? undefined,
  }
}

export function mapNotification(row: any): AppNotification {
  return {
    id: row.id,
    type: row.type,
    title: row.title,
    body: row.body,
    read: row.read,
    createdAt: row.created_at,
    link: row.link ?? undefined,
    actorName: row.actor_name ?? undefined,
    targetRoles: row.target_roles ?? undefined,
  }
}

export function mapHelpArticle(row: any): HelpArticle {
  return {
    id: row.id,
    category: row.category,
    title: row.title,
    body: row.body,
    roles: row.roles ?? undefined,
  }
}
