// Core domain types for the pharmacy/medical delivery management system.
// These mirror the Supabase schema (see supabase/migrations) so the frontend
// and database stay in lockstep.

export type Role = 'owner' | 'general_manager' | 'dispatch' | 'staff' | 'driver'

export interface Profile {
  id: string
  email: string
  fullName: string
  role: Role
  phone?: string
  avatarUrl?: string
  active: boolean
  createdAt: string
}

export type CustomerType = 'pharmacy' | 'clinic' | 'hospital' | 'nursing_home' | 'patient'

export interface Customer {
  id: string
  name: string
  type: CustomerType
  address: string
  city: string
  state: string
  zip: string
  lat?: number
  lng?: number
  contactName?: string
  contactPhone?: string
  contactEmail?: string
  requiresSignature: boolean
  handlesControlledSubstances: boolean
  deliveryNotes?: string
  active: boolean
  createdAt: string
}

export type DriverStatus = 'available' | 'on_route' | 'off_duty' | 'break' | 'inactive'
export type VehicleType = 'car' | 'van' | 'motorcycle' | 'bike'

export interface Driver {
  id: string
  profileId: string
  fullName: string
  email: string
  phone: string
  avatarUrl?: string
  status: DriverStatus
  vehicleType: VehicleType
  vehiclePlate?: string
  licenseNumber?: string
  licenseExpiry?: string
  backgroundCheckOk: boolean
  hipaaCertified: boolean
  rating?: number
  activeRouteId?: string | null
  createdAt: string
}

export type RouteStatus = 'draft' | 'scheduled' | 'in_progress' | 'completed' | 'canceled'
export type StopStatus = 'pending' | 'en_route' | 'delivered' | 'failed' | 'returned'
export type Priority = 'standard' | 'urgent' | 'stat'

export interface RouteStop {
  id: string
  routeId: string
  sequence: number
  customerId: string
  customerName: string
  address: string
  priority: Priority
  status: StopStatus
  packageCount: number
  isControlledSubstance: boolean
  requiresSignature: boolean
  scheduledWindowStart?: string
  scheduledWindowEnd?: string
  deliveredAt?: string
  signedBy?: string
  notes?: string
  failureReason?: string
}

export interface Package {
  id: string
  routeId: string
  stopId: string
  sequence: number
  code: string
  qrPayload: string
  labelPrinted: boolean
  printedAt?: string
  printCount: number
  createdAt: string
}

export type ReassignmentReason =
  | 'initial_assignment'
  | 'driver_unavailable'
  | 'shift_ended'
  | 'early_leave'
  | 'route_abandoned'
  | 'operational_change'
  | 'other'

export interface RouteAssignmentEvent {
  id: string
  routeId: string
  previousDriverId?: string
  previousDriverName?: string
  newDriverId?: string
  newDriverName?: string
  changedBy?: string
  changedByName?: string
  routeStatus: RouteStatus
  reason: ReassignmentReason
  notes?: string
  createdAt: string
}

export interface DeliveryRoute {
  id: string
  name: string
  date: string
  status: RouteStatus
  driverId?: string | null
  driverName?: string | null
  stops: RouteStop[]
  createdAt: string
  startedAt?: string
  completedAt?: string
  estimatedDistanceKm?: number
  estimatedDurationMin?: number
}

export type ReturnReason =
  | 'customer_unavailable'
  | 'refused'
  | 'wrong_address'
  | 'damaged'
  | 'expired'
  | 'other'

export type ReturnStatus = 'pending_review' | 'restocked' | 'disposed' | 'redelivery_scheduled'

export interface ReturnItem {
  id: string
  stopId: string
  routeId: string
  customerId: string
  customerName: string
  driverId?: string
  driverName?: string
  reason: ReturnReason
  status: ReturnStatus
  notes?: string
  isControlledSubstance: boolean
  createdAt: string
  resolvedAt?: string
  resolvedBy?: string
}

export type AvailabilityStatus = 'available' | 'unavailable' | 'time_off' | 'partial'

export interface AvailabilityEntry {
  id: string
  driverId: string
  driverName: string
  date: string
  status: AvailabilityStatus
  startTime?: string
  endTime?: string
  note?: string
}

export type TimeOffStatus = 'pending' | 'approved' | 'rejected'

export interface TimeOffRequest {
  id: string
  requesterId: string
  requesterName: string
  requesterRole: Role
  startDate: string
  endDate: string
  reason?: string
  status: TimeOffStatus
  reviewedBy?: string
  reviewedByName?: string
  reviewedAt?: string
  reviewNote?: string
  createdAt: string
}

export type NotificationType =
  | 'route_assigned'
  | 'delivery_completed'
  | 'delivery_failed'
  | 'return_created'
  | 'availability_change'
  | 'system'
  | 'urgent'

export interface AppNotification {
  id: string
  type: NotificationType
  title: string
  body: string
  read: boolean
  createdAt: string
  link?: string
  actorName?: string
  targetRoles?: Role[]
}

export interface KPI {
  label: string
  value: string | number
  delta?: number
  trend?: 'up' | 'down' | 'flat'
}

export interface HelpArticle {
  id: string
  category: string
  title: string
  body: string
  roles?: Role[]
}
