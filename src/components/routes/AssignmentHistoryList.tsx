import { useTranslation } from 'react-i18next'
import { ArrowRight, History } from 'lucide-react'
import { useRouteAssignmentHistory } from '@/hooks/useRoutes'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { Badge } from '@/components/ui/badge'
import { formatDateTime } from '@/lib/format'

export function AssignmentHistoryList({ routeId }: { routeId: string }) {
  const { t, i18n } = useTranslation()
  const { data: history = [], isLoading } = useRouteAssignmentHistory(routeId)

  if (isLoading) return null
  if (history.length === 0) return null

  return (
    <div className="mt-4 flex flex-col gap-2">
      <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        <History className="h-3.5 w-3.5" /> {t('reassignment.history')}
      </p>
      <div className="flex flex-col gap-2">
        {history.map((event) => (
          <div key={event.id} className="rounded-lg border border-border p-3 text-sm">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="font-medium">{event.previousDriverName ?? t('common.unassigned')}</span>
              <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="font-medium">{event.newDriverName ?? t('common.unassigned')}</span>
              <StatusBadge status={event.routeStatus} />
              {event.reason !== 'initial_assignment' && (
                <Badge variant="outline">{t(`reassignment.reasons.${event.reason}`)}</Badge>
              )}
            </div>
            {event.notes && <p className="mt-1 text-xs text-muted-foreground">{event.notes}</p>}
            <p className="mt-1 text-xs text-muted-foreground">
              {t('reassignment.changedBy', {
                user: event.changedByName ?? t('common.unassigned'),
                date: formatDateTime(event.createdAt, i18n.language),
              })}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
