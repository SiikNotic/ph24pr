import { useEffect, useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Loader2,
  Trash2,
  PackageIcon,
  ShieldAlert,
  FileSignature,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react'
import { PageHeader } from '@/components/shared/PageHeader'
import { StatusBadge, PriorityBadge } from '@/components/shared/StatusBadge'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { useRoute, useUpdateRouteStatus, useReassignDriver } from '@/hooks/useRoutes'
import { BUILDING_ROUTE_STATUSES } from '@/types/domain'
import { usePackages } from '@/hooks/usePackages'
import { useRemoveDelivery } from '@/hooks/usePackages'
import { useDrivers } from '@/hooks/useDrivers'
import { useUnavailableDriverIds } from '@/hooks/useAvailability'
import { usePermissions } from '@/hooks/usePermissions'
import { AddDeliveryDialog } from '@/components/routes/AddDeliveryDialog'
import { LabelsStep } from '@/components/routes/LabelsStep'
import { formatDate } from '@/lib/format'

const STEPS = ['deliveries', 'labels', 'confirm'] as const
type Step = (typeof STEPS)[number]

export default function RouteBuilder() {
  const { t, i18n } = useTranslation()
  const { routeId } = useParams<{ routeId: string }>()
  const navigate = useNavigate()
  const { can } = usePermissions()
  const [step, setStep] = useState<Step>('deliveries')

  const { data: route, isLoading } = useRoute(routeId)
  const { data: packages = [] } = usePackages(routeId)
  const { data: drivers = [] } = useDrivers()
  const unavailableDriverIds = useUnavailableDriverIds(route?.date)
  const removeDelivery = useRemoveDelivery()
  const updateRouteStatus = useUpdateRouteStatus()
  const reassignDriver = useReassignDriver()

  // 'draft' | 'labels_pending' | 'labels_printed' -- the manager is still
  // actively building the route (adding deliveries, printing labels).
  const isDraft = !!route && BUILDING_ROUTE_STATUSES.includes(route.status)
  const allPrinted = packages.length > 0 && packages.every((p) => p.labelPrinted)

  useEffect(() => {
    if (route && !BUILDING_ROUTE_STATUSES.includes(route.status)) setStep('confirm')
  }, [route?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!can('routes', 'create')) {
    navigate('/routes', { replace: true })
    return null
  }

  if (isLoading || !route) {
    return (
      <div className="flex flex-col gap-3">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-40 w-full" />
      </div>
    )
  }

  const stepIndex = STEPS.indexOf(step)

  async function handleConfirm() {
    if (!routeId) return
    try {
      await updateRouteStatus.mutateAsync({ routeId, status: 'confirmed' })
      toast.success(t('routeBuilder.confirmed'))
    } catch (e: any) {
      toast.error(e.message ?? t('common.error'))
    }
  }

  async function handleAssign(driverId: string) {
    if (!routeId || !route) return
    const driver = drivers.find((d) => d.id === driverId)
    try {
      await reassignDriver.mutateAsync({
        routeId,
        driverId,
        reason: route.driverId ? 'operational_change' : 'initial_assignment',
      })
      toast.success(t('routeBuilder.routeAssigned', { driver: driver?.fullName }))
    } catch (e: any) {
      toast.error(e.message ?? t('common.error'))
    }
  }

  return (
    <div>
      <PageHeader
        title={route.name}
        subtitle={`${formatDate(route.date, i18n.language)} · ${route.stops.length} ${t(route.stops.length === 1 ? 'routes.stop' : 'routes.stops')}`}
        actions={<StatusBadge status={route.status} />}
      />

      {/* Stepper */}
      <div className="mb-6 flex items-center gap-2">
        {STEPS.map((s, i) => (
          <div key={s} className="flex flex-1 items-center gap-2">
            <button
              onClick={() => (i <= stepIndex || !isDraft) && setStep(s)}
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold transition-colors ${
                i < stepIndex || (!isDraft && s !== 'confirm')
                  ? 'bg-success text-success-foreground'
                  : i === stepIndex
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground'
              }`}
            >
              {i < stepIndex || (!isDraft && s !== 'confirm') ? <Check className="h-4 w-4" /> : i + 1}
            </button>
            <span className={`hidden text-sm font-medium sm:block ${i === stepIndex ? '' : 'text-muted-foreground'}`}>
              {t(`routeBuilder.step${i + 1}`)}
            </span>
            {i < STEPS.length - 1 && <div className="h-px flex-1 bg-border" />}
          </div>
        ))}
      </div>

      {step === 'deliveries' && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">{t('routeBuilder.deliveriesHint')}</p>
            {isDraft && <AddDeliveryDialog routeId={route.id} nextSequence={route.stops.length + 1} />}
          </div>

          {route.stops.length === 0 ? (
            <p className="rounded-xl border border-dashed border-border py-12 text-center text-sm text-muted-foreground">
              {t('routeBuilder.noDeliveries')}
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {route.stops.map((stop) => (
                <Card key={stop.id}>
                  <CardContent className="flex items-center gap-3 p-4">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold">
                      {stop.sequence}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{stop.customerName}</p>
                      <p className="truncate text-xs text-muted-foreground">{stop.address}</p>
                    </div>
                    <PriorityBadge priority={stop.priority} />
                    <Badge variant="outline" className="gap-1">
                      <PackageIcon className="h-3 w-3" /> {stop.packageCount}
                    </Badge>
                    {stop.isControlledSubstance && (
                      <Badge variant="warning" className="gap-1 hidden sm:flex">
                        <ShieldAlert className="h-3 w-3" /> {t('routes.controlled')}
                      </Badge>
                    )}
                    {stop.requiresSignature && (
                      <Badge variant="outline" className="gap-1 hidden sm:flex">
                        <FileSignature className="h-3 w-3" /> {t('routes.signature')}
                      </Badge>
                    )}
                    {isDraft && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() =>
                          removeDelivery.mutate(
                            { stopId: stop.id, routeId: route.id },
                            { onError: (e: any) => toast.error(e.message ?? t('common.error')) },
                          )
                        }
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          <div className="flex justify-end">
            <Button onClick={() => setStep('labels')} disabled={route.stops.length === 0}>
              {t('common.next')} <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {step === 'labels' && (
        <div className="flex flex-col gap-4">
          <LabelsStep route={route} packages={packages} />
          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setStep('deliveries')}>
              <ArrowLeft className="h-4 w-4" /> {t('common.back')}
            </Button>
            <Button onClick={() => setStep('confirm')} disabled={!allPrinted}>
              {t('common.next')} <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {step === 'confirm' && (
        <div className="flex flex-col gap-4">
          <Card>
            <CardContent className="flex flex-col gap-3 p-5">
              <p className="font-semibold">{t('routeBuilder.summary')}</p>
              <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
                <div>
                  <p className="text-muted-foreground">{t('routes.routeName')}</p>
                  <p className="font-medium">{route.name}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">{t('common.date')}</p>
                  <p className="font-medium">{formatDate(route.date, i18n.language)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">{t('routeBuilder.deliveriesCount')}</p>
                  <p className="font-medium">{route.stops.length}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">{t('routeBuilder.packagesTotal')}</p>
                  <p className="font-medium">{packages.length}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">{t('routeBuilder.labelsPrinted')}</p>
                  <p className={`font-medium ${allPrinted ? 'text-success' : 'text-warning-foreground'}`}>
                    {packages.filter((p) => p.labelPrinted).length} / {packages.length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {isDraft ? (
            <Card>
              <CardContent className="flex flex-col items-center gap-3 p-6 text-center">
                <p className="text-sm text-muted-foreground">
                  {allPrinted ? t('routeBuilder.confirmHint') : t('routeBuilder.needAllLabelsPrinted')}
                </p>
                <Button size="lg" onClick={handleConfirm} disabled={!allPrinted || updateRouteStatus.isPending}>
                  {updateRouteStatus.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                  <Check className="h-4 w-4" /> {t('routeBuilder.confirmRoute')}
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="flex flex-col gap-3 p-5">
                <p className="font-semibold">{t('routeBuilder.assignDriverTitle')}</p>
                <p className="text-sm text-muted-foreground">{t('routeBuilder.assignDriverHint')}</p>
                <Select value={route.driverId ?? ''} onValueChange={handleAssign} disabled={!can('routes', 'assign')}>
                  <SelectTrigger className="max-w-xs">
                    <SelectValue placeholder={t('common.unassigned')} />
                  </SelectTrigger>
                  <SelectContent>
                    {drivers.map((d) => (
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
                {route.driverId && unavailableDriverIds.has(route.driverId) && (
                  <p className="flex items-center gap-1.5 text-xs text-warning-foreground">
                    <AlertTriangle className="h-3.5 w-3.5" /> {t('availability.assigningUnavailableWarning')}
                  </p>
                )}

                {route.driverId && (
                  <div className="flex items-center gap-2 rounded-lg border border-success/30 bg-success/10 p-3 text-sm text-success">
                    <CheckCircle2 className="h-4 w-4" />
                    {t('routeBuilder.routeLiveForDriver', { driver: route.driverName })}
                  </div>
                )}

                <Button asChild variant="outline" className="mt-2 self-start">
                  <Link to="/routes">
                    <ArrowLeft className="h-4 w-4" /> {t('routeBuilder.backToRoutes')}
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}

          {step === 'confirm' && isDraft && (
            <div className="flex justify-start">
              <Button variant="outline" onClick={() => setStep('labels')}>
                <ArrowLeft className="h-4 w-4" /> {t('common.back')}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
