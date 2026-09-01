import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { CheckCircle2, Loader2, XCircle } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { EmptyState } from '@/components/shared/EmptyState'
import { useAuthStore } from '@/store/auth'
import { useReviewTimeOffRequest, useTimeOffRequests } from '@/hooks/useTimeOff'
import { formatDate, formatDateTime } from '@/lib/format'
import { ROLE_LABELS } from '@/lib/permissions'
import type { TimeOffRequest } from '@/types/domain'

export function TimeOffRequestsPanel() {
  const { t, i18n } = useTranslation()
  const profile = useAuthStore((s) => s.profile)
  const { data: requests = [], isLoading } = useTimeOffRequests()
  const review = useReviewTimeOffRequest()
  const [rejecting, setRejecting] = useState<TimeOffRequest | null>(null)

  const pending = requests.filter((r) => r.status === 'pending')
  const decided = requests.filter((r) => r.status !== 'pending').slice(0, 5)

  async function approve(request: TimeOffRequest) {
    try {
      await review.mutateAsync({ requestId: request.id, approve: true })
      toast.success(t('availability.approved'))
    } catch (e: any) {
      toast.error(e.message ?? t('common.error'))
    }
  }

  if (isLoading) return null

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('availability.requestsToReview')}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {pending.length === 0 ? (
            <EmptyState title={t('availability.noPendingRequests')} className="py-6" />
          ) : (
            pending.map((r) => {
              const isSelf = r.requesterId === profile?.id
              return (
                <div key={r.id} className="rounded-lg border border-border p-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium">{r.requesterName}</span>
                    <Badge variant="outline">{ROLE_LABELS[r.requesterRole][i18n.language === 'es' ? 'es' : 'en']}</Badge>
                    <Badge variant="warning">{t('availability.status.pending')}</Badge>
                  </div>
                  <p className="mt-1 text-sm">
                    {formatDate(r.startDate, i18n.language)}
                    {r.endDate !== r.startDate ? ` – ${formatDate(r.endDate, i18n.language)}` : ''}
                  </p>
                  {r.reason && <p className="mt-1 text-xs text-muted-foreground">{r.reason}</p>}
                  <p className="mt-1 text-xs text-muted-foreground">{formatDateTime(r.createdAt, i18n.language)}</p>

                  {isSelf ? (
                    <p className="mt-2 text-xs italic text-muted-foreground">{t('availability.awaitingOtherManager')}</p>
                  ) : (
                    <div className="mt-2 flex gap-2">
                      <Button size="sm" onClick={() => approve(r)} disabled={review.isPending}>
                        <CheckCircle2 className="h-3.5 w-3.5" /> {t('common.approve')}
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => setRejecting(r)} disabled={review.isPending}>
                        <XCircle className="h-3.5 w-3.5" /> {t('common.reject')}
                      </Button>
                    </div>
                  )}
                </div>
              )
            })
          )}

          {decided.length > 0 && (
            <div className="mt-2 flex flex-col gap-2 border-t border-border pt-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {t('availability.recentlyReviewed')}
              </p>
              {decided.map((r) => (
                <div key={r.id} className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">{r.requesterName}</span>
                  <Badge variant={r.status === 'approved' ? 'success' : 'destructive'}>
                    {t(`availability.status.${r.status}`)}
                  </Badge>
                  <span>
                    {formatDate(r.startDate, i18n.language)}
                    {r.endDate !== r.startDate ? ` – ${formatDate(r.endDate, i18n.language)}` : ''}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <RejectDialog request={rejecting} onClose={() => setRejecting(null)} />
    </>
  )
}

function RejectDialog({ request, onClose }: { request: TimeOffRequest | null; onClose: () => void }) {
  const { t } = useTranslation()
  const [note, setNote] = useState('')
  const review = useReviewTimeOffRequest()

  async function confirm() {
    if (!request) return
    try {
      await review.mutateAsync({ requestId: request.id, approve: false, reviewNote: note || undefined })
      toast.success(t('availability.rejected'))
      setNote('')
      onClose()
    } catch (e: any) {
      toast.error(e.message ?? t('common.error'))
    }
  }

  return (
    <Dialog open={!!request} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('availability.rejectRequest')}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-1.5">
          <Label>
            {t('availability.rejectReason')} <span className="text-muted-foreground">({t('common.optional')})</span>
          </Label>
          <Textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button variant="destructive" onClick={confirm} disabled={review.isPending}>
            {review.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            {t('common.reject')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
