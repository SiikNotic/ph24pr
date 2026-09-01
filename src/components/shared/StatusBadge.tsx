import { useTranslation } from 'react-i18next'
import type { LucideIcon } from 'lucide-react'
import {
  FileEdit,
  Tag,
  Printer,
  BadgeCheck,
  UserCheck,
  Zap,
  Undo2,
  CheckCircle2,
  Lock,
  XCircle,
  Clock,
  ScanLine,
  Truck,
  PackageCheck,
  AlertTriangle,
  RotateCcw,
  Moon,
  Coffee,
  CircleSlash,
  CircleDashed,
  PackagePlus,
  Trash2,
  CalendarOff,
  CalendarClock,
} from 'lucide-react'
import { Badge, type BadgeProps } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

type StatusMeta = { variant: NonNullable<BadgeProps['variant']>; icon: LucideIcon }

// Every status is recognizable through color + icon + label together —
// never color alone. Route lifecycle, package/delivery lifecycle, driver
// status, availability, and return resolution each get their own icon so
// the shape reads instantly even at a glance.
const STATUS_META: Record<string, StatusMeta> = {
  // Route lifecycle
  draft: { variant: 'secondary', icon: FileEdit },
  labels_pending: { variant: 'warning', icon: Tag },
  labels_printed: { variant: 'info', icon: Printer },
  confirmed: { variant: 'info', icon: BadgeCheck },
  assigned: { variant: 'info', icon: UserCheck },
  active: { variant: 'success', icon: Zap },
  returning_to_station: { variant: 'warning', icon: Undo2 },
  completed: { variant: 'success', icon: CheckCircle2 },
  closed: { variant: 'secondary', icon: Lock },
  canceled: { variant: 'destructive', icon: XCircle },
  // Package / delivery lifecycle
  pending: { variant: 'secondary', icon: Clock },
  scanned: { variant: 'info', icon: ScanLine },
  out_for_delivery: { variant: 'info', icon: Truck },
  delivered: { variant: 'success', icon: PackageCheck },
  failed: { variant: 'destructive', icon: AlertTriangle },
  pending_return: { variant: 'destructive', icon: RotateCcw },
  returned: { variant: 'warning', icon: Undo2 },
  // Driver status
  available: { variant: 'success', icon: CheckCircle2 },
  on_route: { variant: 'info', icon: Truck },
  off_duty: { variant: 'secondary', icon: Moon },
  break: { variant: 'warning', icon: Coffee },
  inactive: { variant: 'destructive', icon: CircleSlash },
  // Availability
  unavailable: { variant: 'destructive', icon: XCircle },
  time_off: { variant: 'warning', icon: CalendarOff },
  partial: { variant: 'warning', icon: CircleDashed },
  // Return resolution
  restocked: { variant: 'success', icon: PackagePlus },
  disposed: { variant: 'secondary', icon: Trash2 },
  redelivery_scheduled: { variant: 'info', icon: CalendarClock },
}

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  const { t } = useTranslation()
  const meta = STATUS_META[status]
  const Icon = meta?.icon
  return (
    <Badge variant={meta?.variant ?? 'outline'} className={cn('shrink-0', className)}>
      {Icon && <Icon className="h-3 w-3" strokeWidth={2.5} />}
      {t(`status.${status}`, status)}
    </Badge>
  )
}

const PRIORITY_VARIANT: Record<string, BadgeProps['variant']> = {
  standard: 'secondary',
  urgent: 'warning',
  stat: 'destructive',
}

export function PriorityBadge({ priority }: { priority: string }) {
  const { t } = useTranslation()
  return (
    <Badge variant={PRIORITY_VARIANT[priority] ?? 'outline'} dot={priority === 'stat'}>
      {t(`priority.${priority}`, priority)}
    </Badge>
  )
}
