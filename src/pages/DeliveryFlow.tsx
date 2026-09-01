import { useMemo, useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { ArrowLeft, CheckCircle2, KeyRound, Loader2, MapPin, PackageCheck, ShieldAlert } from 'lucide-react'
import { PageHeader } from '@/components/shared/PageHeader'
import { PriorityBadge } from '@/components/shared/StatusBadge'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
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

export default function DeliveryFlow() {
  const { t } = useTranslation()
  const { routeId, stopId } = useParams<{ routeId: string; stopId: string }>()
  const navigate = useNavigate()
  const { isDriver } = usePermissions()

  const { data: route, isLoading: routeLoading } = useRoute(routeId)
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
    const remaining = route.stops
      .filter((s) => s.id !== stopId && (s.status === 'pending' || s.status === 'en_route'))
      .sort((a, b) => a.sequence - b.sequence)
    if (remaining.length > 0) {
      navigate(`/routes/${routeId}/deliver/${remaining[0].id}`)
    } else {
      toast.success(t('delivery.allStopsComplete'))
      navigate('/routes')
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
        title={t('delivery.title')}
        subtitle={`${t('routeBuilder.deliveriesCount')} · ${route.name}`}
        actions={
          <Button variant="ghost" size="sm" asChild>
            <Link to="/routes">
              <ArrowLeft className="h-4 w-4" /> {t('common.back')}
            </Link>
          </Button>
        }
      />

      <Card className="mb-4">
        <CardContent className="flex flex-col gap-2 p-4">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-semibold">{stop.customerName}</p>
              <p className="flex items-center gap-1 text-sm text-muted-foreground">
                <MapPin className="h-3.5 w-3.5" /> {stop.address}
              </p>
            </div>
            <PriorityBadge priority={stop.priority} />
          </div>
          {stop.isControlledSubstance && (
            <Badge variant="warning" className="w-fit gap-1">
              <ShieldAlert className="h-3 w-3" /> {t('routes.controlled')}
            </Badge>
          )}
        </CardContent>
      </Card>

      {/* Step 1: scan every package */}
      <div className="mb-4 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <p className="flex items-center gap-1.5 text-sm font-semibold">
            <PackageCheck className="h-4 w-4" /> {t('delivery.stepScan')}
          </p>
          <Badge variant={allScanned ? 'success' : 'secondary'}>
            {scannedCount} / {stopPackages.length}
          </Badge>
        </div>
        {stopPackages.map((pkg) => (
          <PackageScanInput key={pkg.id} pkg={pkg} onScan={handleScan} isScanning={scanPackage.isPending} />
        ))}
      </div>

      {/* Step 2: proof of delivery, once every package is scanned */}
      {allScanned && (
        <Card>
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

            <Button size="lg" onClick={handleComplete} disabled={!canSubmit || completeDelivery.isPending}>
              {completeDelivery.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              {t('delivery.completeDelivery')}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
