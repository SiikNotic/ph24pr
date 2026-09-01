import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Navigation2, ShieldAlert, FileSignature, Package, Loader2, Play, CheckCircle2 } from 'lucide-react'
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { StatusBadge, PriorityBadge } from '@/components/shared/StatusBadge'
import { usePermissions } from '@/hooks/usePermissions'
import { useAuthStore } from '@/store/auth'
import { useAssignDriver, useUpdateRouteStatus, useUpdateStop } from '@/hooks/useRoutes'
import { useCreateReturn } from '@/hooks/useReturns'
import { useDrivers } from '@/hooks/useDrivers'
import type { DeliveryRoute, ReturnReason, RouteStop } from '@/types/domain'
import { formatDate } from '@/lib/format'

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
  const { data: drivers = [] } = useDrivers()
  const assignDriver = useAssignDriver()
  const updateRouteStatus = useUpdateRouteStatus()
  const [issueStop, setIssueStop] = useState<RouteStop | null>(null)
  const [deliverStop, setDeliverStop] = useState<RouteStop | null>(null)

  if (!route) return null

  const canManage = can('routes', 'assign')

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

          {canManage && (
            <div className="mt-4 flex flex-col gap-2 rounded-lg border border-border p-3">
              <Label className="text-xs text-muted-foreground">{t('routes.assignDriver')}</Label>
              <div className="flex items-center gap-2">
                <Select
                  value={route.driverId ?? 'unassigned'}
                  onValueChange={(v) => assignDriver.mutate({ routeId: route.id, driverId: v === 'unassigned' ? null : v })}
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder={t('common.unassigned')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unassigned">{t('common.unassigned')}</SelectItem>
                    {drivers.map((d) => (
                      <SelectItem key={d.id} value={d.id}>
                        {d.fullName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {route.status === 'scheduled' && (
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => updateRouteStatus.mutate({ routeId: route.id, status: 'in_progress' })}
                  >
                    <Play className="h-3.5 w-3.5" /> {t('routes.startRoute')}
                  </Button>
                )}
                {route.status === 'in_progress' && (
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => updateRouteStatus.mutate({ routeId: route.id, status: 'completed' })}
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" /> {t('routes.completeRoute')}
                  </Button>
                )}
              </div>
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
                </div>

                {stop.status === 'delivered' && stop.signedBy && (
                  <p className="mt-2 text-xs text-success">
                    {t('routes.signedBy')}: {stop.signedBy}
                  </p>
                )}
                {stop.failureReason && <p className="mt-2 text-xs text-destructive">{stop.failureReason}</p>}

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
                    <Button size="sm" onClick={() => setDeliverStop(stop)}>
                      <CheckCircle2 className="h-3.5 w-3.5" /> {t('routes.markDelivered')}
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => setIssueStop(stop)}>
                      <ShieldAlert className="h-3.5 w-3.5" /> {t('routes.markFailed')}
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </SheetContent>
      </Sheet>

      <DeliverStopDialog stop={deliverStop} onClose={() => setDeliverStop(null)} />
      <ReportIssueDialog stop={issueStop} route={route} onClose={() => setIssueStop(null)} />
    </>
  )
}

function DeliverStopDialog({ stop, onClose }: { stop: RouteStop | null; onClose: () => void }) {
  const { t } = useTranslation()
  const [signedBy, setSignedBy] = useState('')
  const updateStop = useUpdateStop()

  async function confirm() {
    if (!stop) return
    try {
      await updateStop.mutateAsync({ stopId: stop.id, status: 'delivered', signedBy: signedBy || undefined })
      toast.success(t('routes.deliveryConfirmed'))
      setSignedBy('')
      onClose()
    } catch (e: any) {
      toast.error(e.message ?? t('common.error'))
    }
  }

  return (
    <Dialog open={!!stop} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('routes.markDelivered')}</DialogTitle>
        </DialogHeader>
        {stop?.requiresSignature && (
          <div className="flex flex-col gap-1.5">
            <Label>{t('routes.signedBy')}</Label>
            <Input value={signedBy} onChange={(e) => setSignedBy(e.target.value)} placeholder="Full name" />
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button onClick={confirm} disabled={updateStop.isPending}>
            {updateStop.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            {t('common.confirm')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

const REASONS: ReturnReason[] = ['customer_unavailable', 'refused', 'wrong_address', 'damaged', 'expired', 'other']

function ReportIssueDialog({
  stop,
  route,
  onClose,
}: {
  stop: RouteStop | null
  route: DeliveryRoute
  onClose: () => void
}) {
  const { t } = useTranslation()
  const profile = useAuthStore((s) => s.profile)
  const driver = useAuthStore((s) => s.driver)
  const [reason, setReason] = useState<ReturnReason>('customer_unavailable')
  const [notes, setNotes] = useState('')
  const updateStop = useUpdateStop()
  const createReturn = useCreateReturn()

  async function confirm() {
    if (!stop) return
    try {
      await updateStop.mutateAsync({ stopId: stop.id, status: 'failed', failureReason: t(`returns.reasons.${reason}`), notes })
      await createReturn.mutateAsync({
        stopId: stop.id,
        routeId: route.id,
        customerId: stop.customerId,
        customerName: stop.customerName,
        driverId: driver?.id,
        driverName: profile?.fullName,
        reason,
        notes,
        isControlledSubstance: stop.isControlledSubstance,
      })
      toast.success(t('common.success'))
      setNotes('')
      onClose()
    } catch (e: any) {
      toast.error(e.message ?? t('common.error'))
    }
  }

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
                {REASONS.map((r) => (
                  <SelectItem key={r} value={r}>
                    {t(`returns.reasons.${r}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>{t('common.notes')}</Label>
            <Input value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button variant="destructive" onClick={confirm} disabled={updateStop.isPending || createReturn.isPending}>
            {(updateStop.isPending || createReturn.isPending) && <Loader2 className="h-4 w-4 animate-spin" />}
            {t('common.confirm')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
