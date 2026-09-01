// Row (snake_case, as returned by Supabase) <-> domain object (camelCase) mappers.
import type {
  Customer,
  Driver,
  DeliveryRoute,
  RouteStop,
  Package,
  RouteAssignmentEvent,
  ReturnItem,
  StopAddressHistoryEvent,
  AuditLogEvent,
  AvailabilityEntry,
  AppNotification,
  HelpArticle,
  TimeOffRequest,
  DriverLocation,
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
    customerPhone: row.customer_phone ?? undefined,
    address: row.address,
    priority: row.priority,
    status: row.status,
    packageCount: row.package_count,
    isControlledSubstance: row.is_controlled_substance,
    requiresSignature: row.requires_signature,
    deliveryMethod: row.delivery_method ?? 'in_hand',
    scheduledWindowStart: row.scheduled_window_start ?? undefined,
    scheduledWindowEnd: row.scheduled_window_end ?? undefined,
    deliveredAt: row.delivered_at ?? undefined,
    signedBy: row.signed_by ?? undefined,
    notes: row.notes ?? undefined,
    failureReason: row.failure_reason ?? undefined,
    recipientName: row.recipient_name ?? undefined,
    deliveryPhotoData: row.delivery_photo_data ?? undefined,
    deliveryLeaveLocation: row.delivery_leave_location ?? undefined,
    deliverySignatureData: row.delivery_signature_data ?? undefined,
    returnWaitStartedAt: row.return_wait_started_at ?? undefined,
    addressIssueFlaggedAt: row.address_issue_flagged_at ?? undefined,
    addressIssueNotes: row.address_issue_notes ?? undefined,
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

export function mapPackage(row: any): Package {
  return {
    id: row.id,
    routeId: row.route_id,
    stopId: row.stop_id,
    sequence: row.sequence,
    code: row.code,
    qrPayload: row.qr_payload,
    labelPrinted: row.label_printed,
    printedAt: row.printed_at ?? undefined,
    printCount: row.print_count,
    scannedAt: row.scanned_at ?? undefined,
    status: row.status,
    createdAt: row.created_at,
    loadIssueReportedAt: row.load_issue_reported_at ?? undefined,
    loadIssueReason: row.load_issue_reason ?? undefined,
    loadIssueNotes: row.load_issue_notes ?? undefined,
  }
}

export function mapDriverLocation(row: any): DriverLocation {
  return {
    driverId: row.driver_id,
    routeId: row.route_id ?? undefined,
    lat: row.lat,
    lng: row.lng,
    heading: row.heading ?? undefined,
    speed: row.speed ?? undefined,
    accuracy: row.accuracy ?? undefined,
    updatedAt: row.updated_at,
  }
}

export function mapAuditLogEvent(row: any): AuditLogEvent {
  return {
    id: row.id,
    entityType: row.entity_type,
    entityId: row.entity_id,
    routeId: row.route_id ?? undefined,
    action: row.action,
    previousState: row.previous_state ?? undefined,
    newState: row.new_state ?? undefined,
    actorId: row.actor_id ?? undefined,
    actorName: row.actor_name ?? undefined,
    actorRole: row.actor_role ?? undefined,
    notes: row.notes ?? undefined,
    createdAt: row.created_at,
  }
}

export function mapAssignmentEvent(row: any): RouteAssignmentEvent {
  return {
    id: row.id,
    routeId: row.route_id,
    previousDriverId: row.previous_driver_id ?? undefined,
    previousDriverName: row.previous_driver_name ?? undefined,
    newDriverId: row.new_driver_id ?? undefined,
    newDriverName: row.new_driver_name ?? undefined,
    changedBy: row.changed_by ?? undefined,
    changedByName: row.changed_by_name ?? undefined,
    routeStatus: row.route_status,
    reason: row.reason,
    notes: row.notes ?? undefined,
    createdAt: row.created_at,
  }
}

export function mapAddressHistoryEvent(row: any): StopAddressHistoryEvent {
  return {
    id: row.id,
    stopId: row.stop_id,
    routeId: row.route_id,
    previousAddress: row.previous_address,
    newAddress: row.new_address,
    changedBy: row.changed_by ?? undefined,
    changedByName: row.changed_by_name ?? undefined,
    reason: row.reason ?? undefined,
    notes: row.notes ?? undefined,
    createdAt: row.created_at,
  }
}

export function mapTimeOffRequest(row: any): TimeOffRequest {
  return {
    id: row.id,
    requesterId: row.requester_id,
    requesterName: row.requester_name,
    requesterRole: row.requester_role,
    startDate: row.start_date,
    endDate: row.end_date,
    reason: row.reason ?? undefined,
    status: row.status,
    reviewedBy: row.reviewed_by ?? undefined,
    reviewedByName: row.reviewed_by_name ?? undefined,
    reviewedAt: row.reviewed_at ?? undefined,
    reviewNote: row.review_note ?? undefined,
    createdAt: row.created_at,
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
    customReason: row.custom_reason ?? undefined,
    status: row.status,
    notes: row.notes ?? undefined,
    isControlledSubstance: row.is_controlled_substance,
    createdAt: row.created_at,
    receivedAt: row.received_at ?? undefined,
    receivedByName: row.received_by_name ?? undefined,
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
