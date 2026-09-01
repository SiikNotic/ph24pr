import { useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { ArrowLeft, CheckCircle2, KeyRound, Loader2, MapPin, MapPinOff, Navigation2, PackageCheck, ShieldAlert } from 'lucide-react'
import { PageHeader } from '@/components/shared/PageHeader'
import { PriorityBadge } from '@/components/shared/StatusBadge'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { useRoute } from '@/hooks/useRoutes'
import { usePackages } from '@/hooks/usePackages'
import { useScanPackage } from '@/hooks/usePackages'
import { useCompleteDelivery } from '@/hooks/useDelivery'
import { useOrgSettings } from '@/hooks/useSettings'
import { usePermissions } from '@/hooks/usePermissions'
import { PackageScanInput } from '@/components/delivery/PackageScanInput'
import { PhotoCapture } from '@/components/delivery/PhotoCapture'
import { SignaturePad } from '@/components/delivery/SignaturePad'
import { PinInput } from '@/components/delivery/PinInput'
import { AddressIssueDialog } from '@/components/routes/RouteDetailSheet'
import { SelfLocationMap } from '@/components/driver/SelfLocationMap'
import { getNextStop } from '@/lib/routeProgress'
import { directionsUrl } from '@/lib/maps'

export default function DeliveryFlow() {
  const { t } = useTranslation()
  const { routeId, stopId } = useParams<{ routeId: string; stopId: string }>()
  const navigate = useNavigate()
  const { isDriver } = usePermissions()

  // Polls while the driver is actively working a delivery so a
  // dispatch-corrected address (or anything else) shows up automatically —
  // no need to back out and reopen the stop.
  const { data: route, isLoading: routeLoading } = useRoute(routeId, { refetchInterval: 15_000 })
  const { data: packages = [] } = usePackages(routeId)
  const { data: orgSettings } = useOrgSettings()
  const scanPackage = useScanPackage()
  const completeDelivery = useCompleteDelivery()

  const [recipientName, setRecipientName] = useState('')
  const [signatureData, setSignatureData] = useState<string | null>(null)
  const [photoData, setPhotoData] = useState<string | null>(null)
  const [leaveLocation, setLeaveLocation] = useState('')
  const [pin, setPin] = useState('')
  const [pinError, setPinError] = useState(false)
  const [addressIssueOpen, setAddressIssueOpen] = useState(false)

  const stop = route?.stops.find((s) => s.id === stopId)
  const stopPackages = useMemo(() => packages.filter((p) => p.stopId === stopId), [packages, stopId])
  const allScanned = stopPackages.length > 0 && stopPackages.every((p) => p.scannedAt)
  const scannedCount = stopPackages.filter((p) => p.scannedAt).length

  if (!isDriver) {
    navigate('/routes', { replace: true })
    return null
  }

  if (routeLoading || !route) {
    return (
      <div className="flex flex-col gap-3">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-40 w-full" />
      </div>
    )
  }

  if (!stop) {
    return (
      <div className="flex flex-col items-center gap-3 py-16 text-center">
        <p className="text-sm text-muted-foreground">{t('delivery.notFound')}</p>
        <Button asChild variant="outline">
          <Link to="/routes">
            <ArrowLeft className="h-4 w-4" /> {t('routeBuilder.backToRoutes')}
          </Link>
        </Button>
      </div>
    )
  }

  function goToNextStop() {
    if (!route) return
    const next = getNextStop(route, stopId)
    if (next) {
      navigate(`/routes/${routeId}/deliver/${next.id}`)
    } else {
      // No stops left to attempt — back to the driver's home screen, which
      // now shows the "return to station" wrap-up on its own (derived from
      // the route's status/stops, not a one-off toast-and-redirect here).
      toast.success(t('delivery.allStopsComplete'))
      navigate('/')
    }
  }

  async function handleScan(value: string) {
    const nextUnscanned = stopPackages.find((p) => !p.scannedAt)
    if (!nextUnscanned || !routeId) return
    try {
      await scanPackage.mutateAsync({ packageId: nextUnscanned.id, qrPayload: value, routeId })
      toast.success(t('delivery.packageScanned'))
    } catch (e: any) {
      toast.error(e.message ?? t('delivery.scanMismatch'))
    }
  }

  async function handleComplete() {
    if (!routeId || !stopId || !stop) return
    setPinError(false)
    try {
      await completeDelivery.mutateAsync({
        stopId,
        routeId,
        enteredPin: stop.deliveryMethod === 'pin_required' ? pin : undefined,
        recipientName: stop.deliveryMethod === 'signature_required' ? recipientName : undefined,
        signatureData: stop.deliveryMethod === 'signature_required' ? signatureData ?? undefined : undefined,
        photoData: photoData ?? undefined,
        leaveLocation: stop.deliveryMethod === 'leave_at_location' ? leaveLocation : undefined,
      })
      toast.success(t('routes.deliveryConfirmed'))
      goToNextStop()
    } catch (e: any) {
      if (stop.deliveryMethod === 'pin_required' && /pin/i.test(e.message ?? '')) {
        setPinError(true)
        setPin('')
      }
      toast.error(e.message ?? t('common.error'))
    }
  }

  const canSubmit = (() => {
    switch (stop.deliveryMethod) {
      case 'pin_required':
        return pin.length === 4
      case 'signature_required':
        return recipientName.trim().length > 0 && !!signatureData
      case 'leave_at_location':
        return !!photoData && !!leaveLocation
      case 'in_hand':
        return !orgSettings?.requirePhotoForInHand || !!photoData
      default:
        return false
    }
  })()

  return (
    <div className="mx-auto max-w-lg">
      <PageHeader
        title={t('delivery.stopOfTotal', { n: stop.sequence, total: route.stops.length })}
        subtitle={route.name}
        actions={
          <Button variant="ghost" size="sm" asChild>
            <Link to="/routes">
              <ArrowLeft className="h-4 w-4" /> {t('common.back')}
            </Link>
          </Button>
        }
      />

      {/* Stop card: rounded "sheet" handle + a colored pin marker, echoing the
          pickup/drop-off card pattern from the reference driver app. */}
      <div className="mb-4 overflow-hidden rounded-2xl border border-border bg-card shadow-elevate">
        <div className="flex justify-center pt-2.5">
          <span className="h-1 w-10 rounded-full bg-border" aria-hidden />
        </div>
        <div className="flex flex-col gap-3 p-4 pt-3">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/12 text-primary">
              <MapPin className="h-5 w-5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-display text-base font-semibold leading-tight">{stop.customerName}</p>
              <p className="mt-0.5 text-sm text-muted-foreground">{stop.address}</p>
            </div>
            <PriorityBadge priority={stop.priority} />
          </div>
          {(stop.isControlledSubstance || stop.addressIssueFlaggedAt) && (
            <div className="flex flex-wrap items-center gap-1.5">
              {stop.isControlledSubstance && (
                <Badge variant="warning" className="w-fit gap-1">
                  <ShieldAlert className="h-3 w-3" /> {t('routes.controlled')}
                </Badge>
              )}
              {stop.addressIssueFlaggedAt && (
                <Badge variant="warning" className="w-fit gap-1">
                  <MapPinOff className="h-3 w-3" /> {t('addressIssue.flagged')}
                </Badge>
              )}
            </div>
          )}
          <Button size="sm" variant="ghost" className="w-fit -ml-2" onClick={() => setAddressIssueOpen(true)}>
            <MapPinOff className="h-3.5 w-3.5" /> {t('addressIssue.reportIssue')}
          </Button>
        </div>
      </div>

      {/* A "you are here" map plus a hand-off to the device's own maps app
          for real turn-by-turn — see SelfLocationMap for why there's no
          destination pin (no geocoded stop coordinates in this app). */}
      <div className="mb-4 flex flex-col gap-2">
        <SelfLocationMap className="h-36 w-full" />
        <Button variant="outline" size="lg" className="w-full" asChild>
          <a href={directionsUrl(stop.address)} target="_blank" rel="noreferrer">
            <Navigation2 className="h-4 w-4" /> {t('delivery.navigate')}
          </a>
        </Button>
      </div>

      <AddressIssueDialog stop={addressIssueOpen ? stop : null} onClose={() => setAddressIssueOpen(false)} />

      {/* Step 1: scan every package */}
      <div className={cn('flex flex-col gap-3', allScanned ? 'mb-4' : 'mb-40 lg:mb-4')}>
        <div className="flex items-center justify-between">
          <p className="flex items-center gap-1.5 text-sm font-semibold">
            <PackageCheck className="h-4 w-4" /> {t('delivery.stepScan')}
          </p>
          <span className="font-numeric text-xs font-semibold text-muted-foreground">
            {scannedCount} / {stopPackages.length}
          </span>
        </div>
        <div className="flex gap-1" aria-hidden>
          {stopPackages.map((pkg) => (
            <span
              key={pkg.id}
              className={cn(
                'h-1.5 flex-1 rounded-full transition-colors duration-500',
                pkg.scannedAt ? 'bg-success' : 'bg-muted',
              )}
            />
          ))}
        </div>
        {stopPackages.map((pkg) => (
          <PackageScanInput key={pkg.id} pkg={pkg} onScan={handleScan} isScanning={scanPackage.isPending} />
        ))}
      </div>

      {/* Step 2: proof of delivery, once every package is scanned */}
      {allScanned && (
        <Card className="mb-40 lg:mb-4">
          <CardContent className="flex flex-col gap-4 p-4">
            <p className="flex items-center gap-1.5 text-sm font-semibold">
              <CheckCircle2 className="h-4 w-4" /> {t(`delivery.methods.${stop.deliveryMethod}`)}
            </p>

            {stop.deliveryMethod === 'in_hand' && (
              <div className="flex flex-col gap-3">
                <p className="text-sm text-muted-foreground">{t('delivery.inHandHint')}</p>
                {orgSettings?.requirePhotoForInHand && (
                  <PhotoCapture value={photoData} onChange={setPhotoData} label={t('delivery.takePhoto')} />
                )}
              </div>
            )}

            {stop.deliveryMethod === 'leave_at_location' && (
              <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-1.5">
                  <Label>{t('delivery.leaveLocation')}</Label>
                  <Select value={leaveLocation} onValueChange={setLeaveLocation}>
                    <SelectTrigger>
                      <SelectValue placeholder={t('delivery.selectLocation')} />
                    </SelectTrigger>
                    <SelectContent>
                      {(orgSettings?.leaveLocationOptions ?? []).map((loc) => (
                        <SelectItem key={loc} value={loc}>
                          {loc}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <PhotoCapture value={photoData} onChange={setPhotoData} label={t('delivery.takePhoto')} />
              </div>
            )}

            {stop.deliveryMethod === 'signature_required' && (
              <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-1.5">
                  <Label>{t('delivery.recipientName')}</Label>
                  <Input value={recipientName} onChange={(e) => setRecipientName(e.target.value)} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label>{t('delivery.signature')}</Label>
                  <SignaturePad onChange={setSignatureData} />
                </div>
              </div>
            )}

            {stop.deliveryMethod === 'pin_required' && (
              <div className="flex flex-col items-center gap-3 py-2">
                <KeyRound className="h-6 w-6 text-muted-foreground" />
                <p className="text-center text-sm text-muted-foreground">{t('delivery.pinHint')}</p>
                <PinInput
                  value={pin}
                  onChange={(v) => {
                    setPin(v)
                    setPinError(false)
                  }}
                />
                {pinError && <p className="text-sm text-destructive">{t('delivery.incorrectPin')}</p>}
              </div>
            )}

            {/* Desktop: a normal inline button, matching the rest of the app. */}
            <Button
              size="lg"
              onClick={handleComplete}
              disabled={!canSubmit || completeDelivery.isPending}
              className="hidden lg:inline-flex"
            >
              {completeDelivery.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              {t('delivery.completeDelivery')}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Mobile: the same button, in a solid full-width bar sitting just
          above the driver bottom-nav — the reference app's own pattern (its
          Go Online / Accept buttons live inside an opaque bottom sheet bar,
          never floating bare over content). Portaled to <body> so it's
          reliably positioned against the real viewport rather than
          whatever ancestor React happens to mount it under. A solid bar
          background also matters functionally, not just visually: the
          button dims to 40% opacity while disabled (until every proof field
          is filled in), and without an opaque backing that would let
          whatever scrolls underneath show through. */}
      {allScanned &&
        createPortal(
          <div className="safe-bottom fixed inset-x-0 bottom-[68px] z-20 border-t border-border bg-card/95 p-3 backdrop-blur-md lg:hidden">
            <Button
              size="lg"
              onClick={handleComplete}
              disabled={!canSubmit || completeDelivery.isPending}
              className="h-14 w-full rounded-full text-base"
            >
              {completeDelivery.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              {t('delivery.completeDelivery')}
            </Button>
          </div>,
          document.body,
        )}
    </div>
  )
}
