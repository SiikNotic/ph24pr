import { useTranslation } from 'react-i18next'
import { Badge, type BadgeProps } from '@/components/ui/badge'

const VARIANT_MAP: Record<string, BadgeProps['variant']> = {
  draft: 'secondary',
  scheduled: 'info',
  in_progress: 'info',
  completed: 'success',
  canceled: 'destructive',
  pending: 'secondary',
  en_route: 'info',
  delivered: 'success',
  failed: 'destructive',
  returned: 'warning',
  available: 'success',
  on_route: 'info',
  off_duty: 'secondary',
  break: 'warning',
  inactive: 'destructive',
  unavailable: 'destructive',
  time_off: 'warning',
  partial: 'warning',
  pending_review: 'warning',
  restocked: 'success',
  disposed: 'secondary',
  redelivery_scheduled: 'info',
}

export function StatusBadge({ status }: { status: string }) {
  const { t } = useTranslation()
  return <Badge variant={VARIANT_MAP[status] ?? 'outline'}>{t(`status.${status}`, status)}</Badge>
}

const PRIORITY_VARIANT: Record<string, BadgeProps['variant']> = {
  standard: 'secondary',
  urgent: 'warning',
  stat: 'destructive',
}

export function PriorityBadge({ priority }: { priority: string }) {
  const { t } = useTranslation()
  return <Badge variant={PRIORITY_VARIANT[priority] ?? 'outline'}>{t(`priority.${priority}`, priority)}</Badge>
}
