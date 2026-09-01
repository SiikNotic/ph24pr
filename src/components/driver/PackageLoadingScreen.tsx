import { useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { CheckCircle2, Loader2, PackageCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PackageScanInput } from '@/components/delivery/PackageScanInput'
import { MarkPackageMissingDialog } from '@/components/delivery/MarkPackageMissingDialog'
import { useScanPackage } from '@/hooks/usePackages'
import { useUpdateRouteStatus } from '@/hooks/useRoutes'
import { useOrgSettings } from '@/hooks/useSettings'
import { cn } from '@/lib/utils'
import type { DeliveryRoute, Package } from '@/types/domain'

// Step 1 of "Start Route": scan every package physically loaded into the
// vehicle before the route actually goes active. Reuses the same
// PackageScanInput used at the door in DeliveryFlow, just for the whole
// route's manifest at once instead of one stop — fast, continuous
// scanning is the point.
export function PackageLoadingScreen({ route, packages }: { route: DeliveryRoute; packages: Package[] }) {
  const { t } = useTranslation()
  const scanPackage = useScanPackage()
  const updateRouteStatus = useUpdateRouteStatus()
  const { data: orgSettings } = useOrgSettings()
  const [missingTarget, setMissingTarget] = useState<Package | null>(null)

  const scannedCount = packages.filter((p) => p.scannedAt).length
  const missingCount = packages.filter((p) => p.loadIssueReportedAt && !p.scannedAt).length
  const total = packages.length
  const accountedFor = scannedCount + missingCount
  const strict = orgSettings?.requireAllPackagesScanned ?? true
  const canStart = total > 0 && (strict ? scannedCount === total : accountedFor === total)
  const progressCount = strict ? scannedCount : accountedFor

  const byStop = useMemo(() => {
    const map = new Map<string, Package[]>()
    for (const pkg of packages) {
      const list = map.get(pkg.stopId) ?? []
      list.push(pkg)
      map.set(pkg.stopId, list)
    }
    return route.stops
      .filter((s) => map.has(s.id))
      .sort((a, b) => a.sequence - b.sequence)
      .map((stop) => ({ stop, packages: (map.get(stop.id) ?? []).sort((a, b) => a.sequence - b.sequence) }))
  }, [packages, route.stops])

  async function handleScan(pkg: Package, value: string) {
    try {
      await scanPackage.mutateAsync({ packageId: pkg.id, qrPayload: value, routeId: route.id })
      toast.success(t('delivery.packageScanned'))
    } catch (e: any) {
      toast.error(e.message ?? t('delivery.scanMismatch'))
    }
  }

  async function handleStartRoute() {
    try {
      await updateRouteStatus.mutateAsync({ routeId: route.id, status: 'active' })
      toast.success(t('loading.routeStarted'))
    } catch (e: any) {
      toast.error(e.message ?? t('common.error'))
    }
  }

  return (
    <div className="pb-28">
      <div className="mb-5 flex flex-col items-center gap-1 pt-2 text-center">
        <h1 className="font-display text-xl font-semibold tracking-tight">{t('loading.title')}</h1>
        <p className="text-sm text-muted-foreground">{t('loading.subtitle')}</p>
      </div>

      <div className="sticky top-14 z-10 -mx-3 mb-5 flex flex-col gap-2 bg-background/95 px-3 pb-3 pt-1 backdrop-blur-md sm:-mx-6 sm:px-6">
        <div className="flex items-center justify-between">
          <p className="flex items-center gap-1.5 text-sm font-semibold">
            <PackageCheck className="h-4 w-4" />
            {strict ? t('loading.scannedCount', { done: progressCount, total }) : t('loading.accountedCount', { done: progressCount, total })}
          </p>
        </div>
        <div className="flex gap-1" aria-hidden>
          {packages.map((pkg) => (
            <span
              key={pkg.id}
              className={cn(
                'h-1.5 flex-1 rounded-full transition-colors duration-500',
                pkg.scannedAt ? 'bg-success' : pkg.loadIssueReportedAt ? 'bg-warning' : 'bg-muted',
              )}
            />
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-5">
        {byStop.map(({ stop, packages: stopPackages }) => (
          <div key={stop.id} className="flex flex-col gap-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {t('loading.byStop', { sequence: stop.sequence, name: stop.customerName })}
            </p>
            {stopPackages.map((pkg) => (
              <PackageScanInput
                key={pkg.id}
                pkg={pkg}
                onScan={(value) => handleScan(pkg, value)}
                isScanning={scanPackage.isPending}
                onMarkMissing={() => setMissingTarget(pkg)}
              />
            ))}
          </div>
        ))}
      </div>

      <MarkPackageMissingDialog pkg={missingTarget} routeId={route.id} onClose={() => setMissingTarget(null)} />

      {/* Portaled to <body> — a page-transition ancestor with an animated
          transform would otherwise become this fixed bar's containing
          block and break true viewport-relative positioning (the same bug
          fixed the same way in DeliveryFlow's own bottom action bar). */}
      {createPortal(
        <div className="safe-bottom fixed inset-x-0 bottom-0 z-20 border-t border-border bg-card/95 p-3 backdrop-blur-md">
          <div className="mx-auto flex max-w-2xl flex-col gap-2">
            {canStart && (
              <p className="flex items-center justify-center gap-1.5 text-xs font-medium text-success">
                <CheckCircle2 className="h-3.5 w-3.5" /> {t('loading.allLoaded')}
              </p>
            )}
            <Button
              size="lg"
              className="h-14 w-full rounded-full text-base"
              disabled={!canStart || updateRouteStatus.isPending}
              onClick={handleStartRoute}
            >
              {updateRouteStatus.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              {t('routes.startRoute')}
            </Button>
            {!canStart && (
              <p className="text-center text-xs text-muted-foreground">
                {strict ? t('loading.strictBlockedHint') : t('loading.lenientBlockedHint')}
              </p>
            )}
          </div>
        </div>,
        document.body,
      )}
    </div>
  )
}
