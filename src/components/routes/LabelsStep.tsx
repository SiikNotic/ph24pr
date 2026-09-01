import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { QRCodeSVG } from 'qrcode.react'
import { Printer, CheckCircle2, PackageIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Card, CardContent } from '@/components/ui/card'
import { usePrintLabel } from '@/hooks/usePackages'
import { PrintPortal } from '@/components/routes/PrintPortal'
import { PackageLabel } from '@/components/routes/PackageLabel'
import type { DeliveryRoute, Package } from '@/types/domain'

export function LabelsStep({ route, packages }: { route: DeliveryRoute; packages: Package[] }) {
  const { t } = useTranslation()
  const printLabel = usePrintLabel()
  const [printingPackage, setPrintingPackage] = useState<Package | null>(null)
  const queueRef = useRef<Package[]>([])

  const total = packages.length
  const printedCount = packages.filter((p) => p.labelPrinted).length
  const allPrinted = total > 0 && printedCount === total

  const stopById = new Map(route.stops.map((s) => [s.id, s]))

  function startPrint(pkg: Package) {
    setPrintingPackage(pkg)
  }

  function printAllRemaining() {
    queueRef.current = packages.filter((p) => !p.labelPrinted)
    const next = queueRef.current.shift()
    if (next) startPrint(next)
  }

  useEffect(() => {
    if (!printingPackage) return
    document.body.classList.add('printing-label')

    let settled = false
    const finish = () => {
      if (settled) return
      settled = true
      document.body.classList.remove('printing-label')
      printLabel.mutate({ packageId: printingPackage.id, routeId: route.id })
      setPrintingPackage(null)
      // Continue a "print all remaining" queue, if one is running.
      const next = queueRef.current.shift()
      if (next) setTimeout(() => startPrint(next), 300)
    }

    const raf = requestAnimationFrame(() => window.print())
    window.addEventListener('afterprint', finish, { once: true })
    const fallback = setTimeout(finish, 4000)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('afterprint', finish)
      clearTimeout(fallback)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [printingPackage])

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium">
              {t('routeBuilder.labelsProgress', { done: printedCount, total })}
            </p>
            <Progress value={total ? (printedCount / total) * 100 : 0} className="mt-2" />
          </div>
          <Button variant="outline" onClick={printAllRemaining} disabled={allPrinted || total === 0}>
            <Printer className="h-4 w-4" /> {t('routeBuilder.printAllRemaining')}
          </Button>
        </CardContent>
      </Card>

      {route.stops.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">{t('routeBuilder.noDeliveries')}</p>
      ) : (
        route.stops.map((stop) => {
          const stopPackages = packages.filter((p) => p.stopId === stop.id)
          return (
            <Card key={stop.id}>
              <CardContent className="flex flex-col gap-3 p-4">
                <div className="flex items-center gap-2">
                  <PackageIcon className="h-4 w-4 text-muted-foreground" />
                  <p className="font-medium">{stop.customerName}</p>
                  <Badge variant="outline">{stopPackages.length}</Badge>
                </div>
                <div className="flex flex-col divide-y divide-border">
                  {stopPackages.map((pkg) => (
                    <div key={pkg.id} className="flex items-center gap-3 py-2">
                      <QRCodeSVG value={pkg.qrPayload} size={36} />
                      <div className="min-w-0 flex-1">
                        <p className="font-mono text-sm font-medium">{pkg.code}</p>
                        <p className="text-xs text-muted-foreground">
                          {t('routeBuilder.packageOf', { n: pkg.sequence, total: stopPackages.length })}
                        </p>
                      </div>
                      {pkg.labelPrinted && (
                        <Badge variant="success" className="gap-1">
                          <CheckCircle2 className="h-3 w-3" /> {t('routeBuilder.printed')}
                        </Badge>
                      )}
                      <Button
                        size="sm"
                        variant={pkg.labelPrinted ? 'outline' : 'default'}
                        onClick={() => startPrint(pkg)}
                        disabled={!!printingPackage}
                      >
                        <Printer className="h-3.5 w-3.5" />
                        {pkg.labelPrinted ? t('routeBuilder.reprintLabel') : t('routeBuilder.printLabel')}
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )
        })
      )}

      {printingPackage && stopById.get(printingPackage.stopId) && (
        <PrintPortal>
          <PackageLabel pkg={printingPackage} stop={stopById.get(printingPackage.stopId)!} routeName={route.name} />
        </PrintPortal>
      )}
    </div>
  )
}
