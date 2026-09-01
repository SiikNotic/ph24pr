import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import {
  Navigation2,
  ShieldAlert,
  FileSignature,
  Package,
  Loader2,
  Play,
  CheckCircle2,
  KeyRound,
  Eye,
  Phone,
  MessageSquare,
  Timer,
  MapPinOff,
  MapPinCheck,
} from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { StatusBadge, PriorityBadge } from '@/components/shared/StatusBadge'
import { usePermissions } from '@/hooks/usePermissions'
import {
  useUpdateRouteStatus,
  useStartReturnWait,
  useReportDeliveryFailure,
  useReportAddressIssue,
  useUpdateStopAddress,
} from '@/hooks/useRoutes'
import { useDeliveryPin } from '@/hooks/useDelivery'
import { useOrgSettings } from '@/hooks/useSettings'
import { ReassignDriverDialog } from '@/components/routes/ReassignDriverDialog'
import { AssignmentHistoryList } from '@/components/routes/AssignmentHistoryList'
import { AddressHistoryList } from '@/components/routes/AddressHistoryList'
import { RETURN_REASONS } from '@/lib/returnReasons'
import type { DeliveryRoute, ReturnReason, RouteStop } from '@/types/domain'
import { formatDate, formatDateTime } from '@/lib/format'

export function RouteDetailSheet({
  route,
  open,
  onOpenChange,
}: {
  route: DeliveryRoute | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const { t, i18n } = useTranslation()
  const { can, isDriver } = usePermissions()
  const updateRouteStatus = useUpdateRouteStatus()
  const [issueStop, setIssueStop] = useState<RouteStop | null>(null)
  const [addressIssueStop, setAddressIssueStop] = useState<RouteStop | null>(null)
  const [editAddressStop, setEditAddressStop] = useState<RouteStop | null>(null)

  if (!route) return null

  const canManage = can('routes', 'assign')
  const canReassign = canManage && (route.status === 'scheduled' || route.status === 'in_progress')
  const canRunRoute = canManage || isDriver

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-lg">
          <SheetHeader>
            <div className="flex items-center gap-2">
              <SheetTitle>{route.name}</SheetTitle>
              <StatusBadge status={route.status} />
            </div>
            <SheetDescription>
              {formatDate(route.date, i18n.language)} · {route.stops.length} {t(route.stops.length === 1 ? 'routes.stop' : 'routes.stops')}
            </SheetDescription>
          </SheetHeader>

          {(canManage || canRunRoute) && (
            <div className="mt-4 flex flex-col gap-2 rounded-lg border border-border p-3">
              {canManage && <Label className="text-xs text-muted-foreground">{t('routes.driver')}</Label>}
              <div className="flex flex-wrap items-center gap-2">
                {canManage && <p className="flex-1 text-sm font-medium">{route.driverName ?? t('common.unassigned')}</p>}
                {canReassign && <ReassignDriverDialog route={route} />}
                {canRunRoute && route.status === 'scheduled' && (
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => updateRouteStatus.mutate({ routeId: route.id, status: 'in_progress' })}
                  >
                    <Play className="h-3.5 w-3.5" /> {t('routes.startRoute')}
                  </Button>
                )}
                {canRunRoute && route.status === 'in_progress' && (
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => updateRouteStatus.mutate({ routeId: route.id, status: 'completed' })}
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" /> {t('routes.completeRoute')}
                  </Button>
                )}
              </div>
              {canManage && <AssignmentHistoryList routeId={route.id} />}
            </div>
          )}

          <div className="mt-4 flex flex-col gap-3">
            {route.stops.map((stop) => (
              <div key={stop.id} className="rounded-lg border border-border p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2">
                    <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold">
                      {stop.sequence}
                    </span>
                    <div>
                      <p className="text-sm font-medium">{stop.customerName}</p>
                      <p className="text-xs text-muted-foreground">{stop.address}</p>
                    </div>
                  </div>
                  <StatusBadge status={stop.status} />
                </div>

                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  <PriorityBadge priority={stop.priority} />
                  <Badge variant="outline" className="gap-1">
                    <Package className="h-3 w-3" /> {stop.packageCount}
                  </Badge>
                  {stop.isControlledSubstance && (
                    <Badge variant="warning" className="gap-1">
                      <ShieldAlert className="h-3 w-3" /> {t('routes.controlled')}
                    </Badge>
                  )}
                  {stop.requiresSignature && (
                    <Badge variant="outline" className="gap-1">
                      <FileSignature className="h-3 w-3" /> {t('routes.signature')}
                    </Badge>
                  )}
                  {stop.deliveryMethod === 'pin_required' && (
                    <Badge variant="outline" className="gap-1">
                      <KeyRound className="h-3 w-3" /> {t('delivery.methods.pin_required')}
                    </Badge>
                  )}
                  {stop.returnWaitStartedAt && (stop.status === 'pending' || stop.status === 'en_route') && (
                    <Badge variant="warning" className="gap-1">
                      <Timer className="h-3 w-3" /> {t('failedDelivery.waiting')}
                    </Badge>
                  )}
                  {stop.addressIssueFlaggedAt && (
                    <Badge variant="warning" className="gap-1">
                      <MapPinOff className="h-3 w-3" /> {t('addressIssue.flagged')}
                    </Badge>
                  )}
                </div>

                {stop.status === 'delivered' && stop.signedBy && (
                  <p className="mt-2 text-xs text-success">
                    {t('routes.signedBy')}: {stop.signedBy}
                  </p>
                )}
                {stop.failureReason && <p className="mt-2 text-xs text-destructive">{stop.failureReason}</p>}

                {canManage && stop.deliveryMethod === 'pin_required' && stop.status !== 'delivered' && (
                  <RevealPin stopId={stop.id} />
                )}

                {isDriver && (stop.status === 'pending' || stop.status === 'en_route') && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button size="sm" variant="outline" asChild>
                      <a
                        href={`https://maps.google.com/?q=${encodeURIComponent(stop.address)}`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        <Navigation2 className="h-3.5 w-3.5" /> {t('routes.navigate')}
                      </a>
                    </Button>
                    <Button size="sm" asChild>
                      <Link to={`/routes/${route.id}/deliver/${stop.id}`}>
                        <CheckCircle2 className="h-3.5 w-3.5" /> {t('routes.markDelivered')}
                      </Link>
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => setIssueStop(stop)}>
                      <ShieldAlert className="h-3.5 w-3.5" /> {t('routes.markFailed')}
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setAddressIssueStop(stop)}>
                      <MapPinOff className="h-3.5 w-3.5" /> {t('addressIssue.reportIssue')}
                    </Button>
                  </div>
                )}

                {canManage && (stop.status === 'pending' || stop.status === 'en_route') && (
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <Button size="sm" variant="outline" onClick={() => setEditAddressStop(stop)}>
                      <MapPinCheck className="h-3.5 w-3.5" /> {t('addressIssue.updateAddress')}
                    </Button>
                  </div>
                )}
                {canManage && <AddressHistoryList stopId={stop.id} />}
              </div>
            ))}
          </div>
        </SheetContent>
      </Sheet>

      <FailedDeliveryDialog stop={issueStop} onClose={() => setIssueStop(null)} />
      <AddressIssueDialog stop={addressIssueStop} onClose={() => setAddressIssueStop(null)} />
      <UpdateAddressDialog stop={editAddressStop} onClose={() => setEditAddressStop(null)} />
    </>
  )
}

function RevealPin({ stopId }: { stopId: string }) {
  const { t } = useTranslation()
  const [reveal, setReveal] = useState(false)
  const { data: pin, isLoading } = useDeliveryPin(stopId, reveal)

  if (!reveal) {
    return (
      <Button variant="ghost" size="sm" className="mt-2" onClick={() => setReveal(true)}>
        <Eye className="h-3.5 w-3.5" /> {t('delivery.revealPin')}
      </Button>
    )
  }

  return (
    <p className="mt-2 flex items-center gap-1.5 text-sm">
      <KeyRound className="h-3.5 w-3.5 text-muted-foreground" />
      {t('delivery.deliveryPin')}:{' '}
      <span className="font-mono font-semibold tracking-widest">{isLoading ? '····' : pin}</span>
    </p>
  )
}

// The full failed-delivery flow. Every reason ends in "Pending Return" (the
// driver still has the package) via report_delivery_failure(), which is the
// only place that ever creates the return record. "Customer Does Not
// Respond" additionally requires the company-configured countdown to run
// out first -- enforced server-side, not just by disabling this button.
function FailedDeliveryDialog({
  stop,
  onClose,
}: {
  stop: RouteStop | null
  onClose: () => void
}) {
  const { t } = useTranslation()
  const { data: org } = useOrgSettings()
  const [reason, setReason] = useState<ReturnReason>('refused')
  const [customReason, setCustomReason] = useState('')
  const [notes, setNotes] = useState('')
  const [waitStartedAt, setWaitStartedAt] = useState<string | undefined>(undefined)
  const [, forceTick] = useState(0)
  const startWait = useStartReturnWait()
  const reportFailure = useReportDeliveryFailure()

  // Reset per-stop state when a new stop is opened, resuming any countdown
  // that was already running (e.g. the dialog was closed and reopened).
  useEffect(() => {
    setReason('refused')
    setCustomReason('')
    setNotes('')
    setWaitStartedAt(stop?.returnWaitStartedAt)
  }, [stop?.id, stop?.returnWaitStartedAt])

  const waitSeconds = org?.customerNoResponseWaitSeconds ?? 180
  const remainingSeconds = waitStartedAt
    ? Math.max(0, waitSeconds - Math.floor((Date.now() - new Date(waitStartedAt).getTime()) / 1000))
    : waitSeconds
  const waitDone = !!waitStartedAt && remainingSeconds <= 0

  // Ticks the countdown display every second while it's actually running.
  useEffect(() => {
    if (reason !== 'no_response' || !waitStartedAt || waitDone) return
    const id = setInterval(() => forceTick((x) => x + 1), 1000)
    return () => clearInterval(id)
  }, [reason, waitStartedAt, waitDone])

  const configuredReasons = org?.returnReasonOptions ?? []
  const otherReasonReady = reason !== 'other' || customReason.trim().length > 0
  const noResponseReady = reason !== 'no_response' || waitDone
  const canConfirm = otherReasonReady && noResponseReady

  async function handleStartWait() {
    if (!stop) return
    try {
      const updated = await startWait.mutateAsync(stop.id)
      setWaitStartedAt(updated.returnWaitStartedAt)
    } catch (e: any) {
      toast.error(e.message ?? t('common.error'))
    }
  }

  async function confirm() {
    if (!stop) return
    try {
      await reportFailure.mutateAsync({
        stopId: stop.id,
        reason,
        customReason: reason === 'other' ? customReason.trim() : undefined,
        notes: notes.trim() || undefined,
      })
      toast.success(t('common.success'))
      onClose()
    } catch (e: any) {
      toast.error(e.message ?? t('common.error'))
    }
  }

  const minutes = String(Math.floor(remainingSeconds / 60)).padStart(2, '0')
  const seconds = String(remainingSeconds % 60).padStart(2, '0')

  return (
    <Dialog open={!!stop} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('routes.reportReturn')}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label>{t('returns.reason')}</Label>
            <Select value={reason} onValueChange={(v) => setReason(v as ReturnReason)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {RETURN_REASONS.map((r) => (
                  <SelectItem key={r} value={r}>
                    {t(`returns.reasons.${r}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {reason === 'no_response' && (
            <div className="flex flex-col gap-2 rounded-lg border border-border p-3">
              {stop?.customerPhone ? (
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" asChild>
                    <a href={`tel:${stop.customerPhone}`}>
                      <Phone className="h-3.5 w-3.5" /> {t('failedDelivery.callCustomer')}
                    </a>
                  </Button>
                  <Button size="sm" variant="outline" asChild>
                    <a href={`sms:${stop.customerPhone}`}>
                      <MessageSquare className="h-3.5 w-3.5" /> {t('failedDelivery.messageCustomer')}
                    </a>
                  </Button>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">{t('failedDelivery.noPhone')}</p>
              )}

              {!waitStartedAt ? (
                <Button size="sm" onClick={handleStartWait} disabled={startWait.isPending}>
                  {startWait.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Timer className="h-3.5 w-3.5" />}
                  {t('failedDelivery.startWait')}
                </Button>
              ) : waitDone ? (
                <p className="flex items-center gap-1.5 text-sm text-success">
                  <CheckCircle2 className="h-4 w-4" /> {t('failedDelivery.waitComplete')}
                </p>
              ) : (
                <div className="flex flex-col gap-1">
                  <p className="flex items-center gap-1.5 text-sm font-medium tabular-nums">
                    <Timer className="h-4 w-4 text-warning" />
                    {t('failedDelivery.timeRemaining', { time: `${minutes}:${seconds}` })}
                  </p>
                  <p className="text-xs text-muted-foreground">{t('failedDelivery.waitHint')}</p>
                </div>
              )}
            </div>
          )}

          {reason === 'other' && (
            <div className="flex flex-col gap-1.5">
              <Label>{t('returns.customReasonLabel')}</Label>
              {configuredReasons.length > 0 ? (
                <Select value={customReason} onValueChange={setCustomReason}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('returns.selectReason')} />
                  </SelectTrigger>
                  <SelectContent>
                    {configuredReasons.map((r) => (
                      <SelectItem key={r} value={r}>
                        {r}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                  placeholder={t('returns.otherReasonPlaceholder')}
                />
              )}
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <Label>{t('common.notes')}</Label>
            <Input value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button variant="destructive" onClick={confirm} disabled={!canConfirm || reportFailure.isPending}>
            {reportFailure.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            {reason === 'no_response' ? t('failedDelivery.confirmPendingReturn') : t('common.confirm')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// Driver-side: raises "Incorrect Address / Address Not Found" to dispatch.
// Drivers can never change the address themselves -- this only flags it;
// report_address_issue() is the only writer of the flag/notes columns.
export function AddressIssueDialog({ stop, onClose }: { stop: RouteStop | null; onClose: () => void }) {
  const { t, i18n } = useTranslation()
  const [notes, setNotes] = useState('')
  const reportIssue = useReportAddressIssue()

  useEffect(() => {
    setNotes(stop?.addressIssueNotes ?? '')
  }, [stop?.id])

  async function confirm() {
    if (!stop) return
    try {
      await reportIssue.mutateAsync({ stopId: stop.id, notes: notes.trim() || undefined })
      toast.success(t('common.success'))
      onClose()
    } catch (e: any) {
      toast.error(e.message ?? t('common.error'))
    }
  }

  return (
    <Dialog open={!!stop} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('addressIssue.reportIssue')}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          <p className="text-sm text-muted-foreground">{t('addressIssue.reportHint')}</p>
          {stop && (
            <div className="rounded-lg border border-border p-3 text-sm">
              <p className="font-medium">{stop.customerName}</p>
              <p className="text-muted-foreground">{stop.address}</p>
            </div>
          )}
          {stop?.addressIssueFlaggedAt && (
            <p className="text-xs text-muted-foreground">
              {t('addressIssue.alreadyFlagged', { date: formatDateTime(stop.addressIssueFlaggedAt, i18n.language) })}
            </p>
          )}
          <div className="flex flex-col gap-1.5">
            <Label>{t('common.notes')}</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t('addressIssue.notesPlaceholder')}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button onClick={confirm} disabled={reportIssue.isPending}>
            {reportIssue.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            {t('addressIssue.sendToDispatch')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// Dispatch-side: the only path that ever changes a stop's delivery address.
// Never touches packages or creates a new stop/route; the original address
// stays on record in stop_address_history (see AddressHistoryList).
function UpdateAddressDialog({ stop, onClose }: { stop: RouteStop | null; onClose: () => void }) {
  const { t, i18n } = useTranslation()
  const [newAddress, setNewAddress] = useState('')
  const [reason, setReason] = useState('')
  const [notes, setNotes] = useState('')
  const updateAddress = useUpdateStopAddress()

  useEffect(() => {
    setNewAddress(stop?.address ?? '')
    setReason('')
    setNotes('')
  }, [stop?.id])

  const canSave = newAddress.trim().length > 0 && newAddress.trim() !== stop?.address && reason.trim().length > 0

  async function confirm() {
    if (!stop) return
    try {
      await updateAddress.mutateAsync({ stopId: stop.id, newAddress: newAddress.trim(), reason: reason.trim(), notes: notes.trim() || undefined })
      toast.success(t('common.success'))
      onClose()
    } catch (e: any) {
      toast.error(e.message ?? t('common.error'))
    }
  }

  return (
    <Dialog open={!!stop} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('addressIssue.updateAddress')}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          {stop?.addressIssueFlaggedAt && (
            <div className="rounded-lg border border-warning/40 bg-warning/10 p-3 text-sm">
              <p className="flex items-center gap-1.5 font-medium">
                <MapPinOff className="h-3.5 w-3.5" /> {t('addressIssue.flaggedBy', { date: formatDateTime(stop.addressIssueFlaggedAt, i18n.language) })}
              </p>
              {stop.addressIssueNotes && <p className="mt-1 text-muted-foreground">{stop.addressIssueNotes}</p>}
            </div>
          )}
          <div className="flex flex-col gap-1.5">
            <Label>{t('addressIssue.originalAddress')}</Label>
            <p className="rounded-md border border-border bg-muted/50 px-3 py-2 text-sm text-muted-foreground">{stop?.address}</p>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>{t('addressIssue.newAddress')}</Label>
            <Textarea value={newAddress} onChange={(e) => setNewAddress(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>{t('addressIssue.reasonForChange')}</Label>
            <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder={t('addressIssue.reasonPlaceholder')} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>{t('common.notes')}</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button onClick={confirm} disabled={!canSave || updateAddress.isPending}>
            {updateAddress.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            {t('common.saveChanges')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
