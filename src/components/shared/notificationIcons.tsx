import { Truck, CheckCircle2, XCircle, RotateCcw, CalendarClock, Info, AlertTriangle } from 'lucide-react'
import type { NotificationType } from '@/types/domain'

export const NOTIFICATION_ICON: Record<NotificationType, typeof Truck> = {
  route_assigned: Truck,
  delivery_completed: CheckCircle2,
  delivery_failed: XCircle,
  return_created: RotateCcw,
  availability_change: CalendarClock,
  system: Info,
  urgent: AlertTriangle,
}
