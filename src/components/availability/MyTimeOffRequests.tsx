import { useTranslation } from 'react-i18next'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useMyTimeOffRequests } from '@/hooks/useTimeOff'
import { formatDate } from '@/lib/format'
import type { TimeOffStatus } from '@/types/domain'

const STATUS_VARIANT: Record<TimeOffStatus, 'warning' | 'success' | 'destructive'> = {
  pending: 'warning',
  approved: 'success',
  rejected: 'destructive',
}

export function MyTimeOffRequests() {
  const { t, i18n } = useTranslation()
  const { data: requests = [], isLoading } = useMyTimeOffRequests()

  if (isLoading || requests.length === 0) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{t('availability.myRequests')}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        {requests.map((r) => (
          <div key={r.id} className="rounded-lg border border-border p-3 text-sm">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-medium">
                {formatDate(r.startDate, i18n.language)}
                {r.endDate !== r.startDate ? ` – ${formatDate(r.endDate, i18n.language)}` : ''}
              </span>
              <Badge variant={STATUS_VARIANT[r.status]}>{t(`availability.status.${r.status}`)}</Badge>
            </div>
            {r.reason && <p className="mt-1 text-xs text-muted-foreground">{r.reason}</p>}
            {r.status !== 'pending' && (
              <p className="mt-1 text-xs text-muted-foreground">
                {t('availability.reviewedBy', { user: r.reviewedByName ?? '—', date: formatDate(r.reviewedAt ?? r.createdAt, i18n.language) })}
              </p>
            )}
            {r.reviewNote && <p className="mt-1 text-xs italic text-muted-foreground">"{r.reviewNote}"</p>}
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
