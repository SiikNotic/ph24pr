import { useTranslation } from 'react-i18next'
import { ArrowRight, History } from 'lucide-react'
import { useStopAddressHistory } from '@/hooks/useRoutes'
import { formatDateTime } from '@/lib/format'

export function AddressHistoryList({ stopId }: { stopId: string }) {
  const { t, i18n } = useTranslation()
  const { data: history = [], isLoading } = useStopAddressHistory(stopId)

  if (isLoading) return null
  if (history.length === 0) return null

  return (
    <div className="mt-2 flex flex-col gap-2">
      <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        <History className="h-3.5 w-3.5" /> {t('addressIssue.history')}
      </p>
      <div className="flex flex-col gap-2">
        {history.map((event) => (
          <div key={event.id} className="rounded-lg border border-border p-2.5 text-xs">
            <div className="flex flex-wrap items-start gap-1.5">
              <span className="text-muted-foreground line-through">{event.previousAddress}</span>
              <ArrowRight className="mt-0.5 h-3 w-3 shrink-0 text-muted-foreground" />
              <span className="font-medium">{event.newAddress}</span>
            </div>
            {event.reason && <p className="mt-1">{event.reason}</p>}
            {event.notes && <p className="mt-1 text-muted-foreground">{event.notes}</p>}
            <p className="mt-1 text-muted-foreground">
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
