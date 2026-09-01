import { useTranslation } from 'react-i18next'
import { ArrowRight, ScrollText } from 'lucide-react'
import { useAuditLog } from '@/hooks/useRoutes'
import { Badge } from '@/components/ui/badge'
import { ROLE_LABELS } from '@/lib/permissions'
import { formatDateTime } from '@/lib/format'
import type { Role } from '@/types/domain'

// The unified, cross-entity audit trail for this route: driver changes,
// address changes, label reprints, delivery completions/failures, returns,
// and route status changes, all in one chronological feed. Nothing here is
// ever updated or deleted — it's a straight append-only record.
export function AuditLogList({ routeId }: { routeId: string }) {
  const { t, i18n } = useTranslation()
  const { data: events = [], isLoading } = useAuditLog(routeId)

  if (isLoading) return null
  if (events.length === 0) return null

  return (
    <div className="mt-4 flex flex-col gap-2">
      <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        <ScrollText className="h-3.5 w-3.5" /> {t('auditLog.title')}
      </p>
      <div className="flex flex-col gap-2">
        {events.map((event) => (
          <div key={event.id} className="rounded-lg border border-border p-2.5 text-xs">
            <div className="flex flex-wrap items-center gap-1.5">
              <Badge variant="outline">{t(`auditLog.actions.${event.action}`)}</Badge>
              {event.previousState && event.newState && (
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  {event.previousState}
                  <ArrowRight className="h-3 w-3" />
                  <span className="font-medium text-foreground">{event.newState}</span>
                </span>
              )}
            </div>
            {event.notes && <p className="mt-1">{event.notes}</p>}
            <p className="mt-1 text-muted-foreground">
              {t('auditLog.by', {
                user: event.actorName ?? t('common.unassigned'),
                role: event.actorRole ? ROLE_LABELS[event.actorRole as Role][i18n.language === 'es' ? 'es' : 'en'] : '',
                date: formatDateTime(event.createdAt, i18n.language),
              })}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
