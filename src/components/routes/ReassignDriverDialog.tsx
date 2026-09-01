import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AlertTriangle, Loader2, UserCog } from 'lucide-react'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useDrivers } from '@/hooks/useDrivers'
import { useReassignDriver } from '@/hooks/useRoutes'
import { useUnavailableDriverIds } from '@/hooks/useAvailability'
import type { DeliveryRoute, ReassignmentReason } from '@/types/domain'

const REASONS: ReassignmentReason[] = [
  'driver_unavailable',
  'shift_ended',
  'early_leave',
  'route_abandoned',
  'operational_change',
  'other',
]

export function ReassignDriverDialog({ route }: { route: DeliveryRoute }) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const [driverId, setDriverId] = useState<string>('')
  const [reason, setReason] = useState<ReassignmentReason>('operational_change')
  const [notes, setNotes] = useState('')

  const { data: drivers = [] } = useDrivers()
  const reassign = useReassignDriver()
  const unavailableDriverIds = useUnavailableDriverIds(route.date)
  const isReassignment = !!route.driverId
  const otherDrivers = drivers.filter((d) => d.id !== route.driverId)
  const pickedIsUnavailable = !!driverId && unavailableDriverIds.has(driverId)

  function reset() {
    setDriverId('')
    setReason('operational_change')
    setNotes('')
  }

  async function handleSubmit() {
    try {
      await reassign.mutateAsync({
        routeId: route.id,
        driverId: driverId === 'unassigned' ? null : driverId,
        reason: isReassignment ? reason : 'initial_assignment',
        notes: notes || undefined,
      })
      const driverName = drivers.find((d) => d.id === driverId)?.fullName
      toast.success(
        driverName
          ? t('routeBuilder.routeAssigned', { driver: driverName })
          : t('reassignment.unassigned'),
      )
      reset()
      setOpen(false)
    } catch (e: any) {
      toast.error(e.message ?? t('common.error'))
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o)
        if (!o) reset()
      }}
    >
      <DialogTrigger asChild>
        <Button variant={isReassignment ? 'outline' : 'default'} size="sm">
          <UserCog className="h-3.5 w-3.5" />
          {isReassignment ? t('reassignment.reassignDriver') : t('routes.assignDriver')}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isReassignment ? t('reassignment.reassignDriver') : t('routes.assignDriver')}</DialogTitle>
          {isReassignment && (
            <DialogDescription>
              {t('reassignment.currentDriver', { driver: route.driverName ?? t('common.unassigned') })}
            </DialogDescription>
          )}
        </DialogHeader>

        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label>{isReassignment ? t('reassignment.newDriver') : t('routes.driver')}</Label>
            <Select value={driverId} onValueChange={setDriverId}>
              <SelectTrigger>
                <SelectValue placeholder={t('common.unassigned')} />
              </SelectTrigger>
              <SelectContent>
                {isReassignment && <SelectItem value="unassigned">{t('common.unassigned')}</SelectItem>}
                {(isReassignment ? otherDrivers : drivers).map((d) => (
                  <SelectItem key={d.id} value={d.id}>
                    <span className="flex items-center gap-1.5">
                      {d.fullName}
                      {unavailableDriverIds.has(d.id) && (
                        <span className="flex items-center gap-1 text-warning-foreground">
                          <AlertTriangle className="h-3 w-3" /> {t('availability.driverUnavailable')}
                        </span>
                      )}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {pickedIsUnavailable && (
              <p className="flex items-center gap-1.5 text-xs text-warning-foreground">
                <AlertTriangle className="h-3.5 w-3.5" /> {t('availability.assigningUnavailableWarning')}
              </p>
            )}
          </div>

          {isReassignment && (
            <>
              <div className="flex flex-col gap-1.5">
                <Label>{t('reassignment.reason')}</Label>
                <Select value={reason} onValueChange={(v) => setReason(v as ReassignmentReason)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {REASONS.map((r) => (
                      <SelectItem key={r} value={r}>
                        {t(`reassignment.reasons.${r}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>
                  {t('common.notes')} <span className="text-muted-foreground">({t('common.optional')})</span>
                </Label>
                <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            {t('common.cancel')}
          </Button>
          <Button onClick={handleSubmit} disabled={!driverId || reassign.isPending}>
            {reassign.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            {t('common.confirm')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
