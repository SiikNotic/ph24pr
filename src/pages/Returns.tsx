import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { RotateCcw, ShieldAlert } from 'lucide-react'
import { toast } from 'sonner'
import { PageHeader } from '@/components/shared/PageHeader'
import { EmptyState } from '@/components/shared/EmptyState'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { usePermissions } from '@/hooks/usePermissions'
import { useAuthStore } from '@/store/auth'
import { useReturns, useResolveReturn } from '@/hooks/useReturns'
import { CreateReturnDialog } from '@/components/returns/CreateReturnDialog'
import { formatDateTime } from '@/lib/format'
import type { ReturnStatus } from '@/types/domain'

const STATUS_FILTERS: (ReturnStatus | 'all')[] = ['all', 'pending_review', 'restocked', 'disposed', 'redelivery_scheduled']
const RESOLUTIONS: ReturnStatus[] = ['restocked', 'disposed', 'redelivery_scheduled']

export default function Returns() {
  const { t, i18n } = useTranslation()
  const { can } = usePermissions()
  const profile = useAuthStore((s) => s.profile)
  const [statusFilter, setStatusFilter] = useState<ReturnStatus | 'all'>('all')

  const { data: returns = [], isLoading } = useReturns()
  const resolveReturn = useResolveReturn()

  const filtered = useMemo(
    () => (statusFilter === 'all' ? returns : returns.filter((r) => r.status === statusFilter)),
    [returns, statusFilter],
  )

  return (
    <div>
      <PageHeader
        title={t('returns.title')}
        subtitle={t('returns.subtitle')}
        actions={can('returns', 'create') ? <CreateReturnDialog /> : undefined}
      />

      <div className="mb-4">
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as ReturnStatus | 'all')}>
          <SelectTrigger className="w-56">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUS_FILTERS.map((s) => (
              <SelectItem key={s} value={s}>
                {s === 'all' ? t('common.all') : t(`status.${s}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={RotateCcw} title={t('returns.noReturns')} />
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((r) => (
            <Card key={r.id}>
              <CardContent className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold">{r.customerName}</p>
                    <StatusBadge status={r.status} />
                    {r.isControlledSubstance && (
                      <Badge variant="warning" className="gap-1">
                        <ShieldAlert className="h-3 w-3" /> {t('customers.controlledSubstances')}
                      </Badge>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {t(`returns.reasons.${r.reason}`)}
                    {r.driverName ? ` · ${r.driverName}` : ''} · {formatDateTime(r.createdAt, i18n.language)}
                  </p>
                  {r.notes && <p className="mt-1 text-sm">{r.notes}</p>}
                </div>

                {can('returns', 'resolve') && r.status === 'pending_review' && (
                  <Select
                    onValueChange={(v) =>
                      resolveReturn.mutate(
                        { id: r.id, status: v as ReturnStatus, resolvedBy: profile?.id ?? '' },
                        {
                          onSuccess: () => toast.success(t('common.success')),
                          onError: (e: any) => toast.error(e.message ?? t('common.error')),
                        },
                      )
                    }
                  >
                    <SelectTrigger className="w-full sm:w-56">
                      <SelectValue placeholder={t('returns.resolve')} />
                    </SelectTrigger>
                    <SelectContent>
                      {RESOLUTIONS.map((s) => (
                        <SelectItem key={s} value={s}>
                          {t(`status.${s}`)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
