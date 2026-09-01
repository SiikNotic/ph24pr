import { QRCodeSVG } from 'qrcode.react'
import { ShieldAlert, FileSignature } from 'lucide-react'
import type { Package, RouteStop } from '@/types/domain'

// The physical shipping label — identical whether it's being previewed on
// screen or sent to the printer, so what you print is always exactly what
// you saw. routeName/orgName are cosmetic header text only.
export function PackageLabel({
  pkg,
  stop,
  routeName,
  orgName = 'MedRoute Pharmacy Logistics',
}: {
  pkg: Package
  stop: RouteStop
  routeName: string
  orgName?: string
}) {
  return (
    <div className="flex w-[320px] flex-col gap-2 border-2 border-black bg-white p-4 text-black">
      <div className="flex items-center justify-between border-b border-black pb-2">
        <span className="text-xs font-bold uppercase tracking-wide">{orgName}</span>
        <span className="text-xs">{routeName}</span>
      </div>

      <div className="flex items-center gap-3">
        <QRCodeSVG value={pkg.qrPayload} size={84} level="M" />
        <div className="min-w-0">
          <p className="font-mono text-lg font-bold leading-tight">{pkg.code}</p>
          <p className="text-xs text-neutral-600">
            Package {pkg.sequence} — {routeName}
          </p>
        </div>
      </div>

      <div className="border-t border-dashed border-black pt-2">
        <p className="text-sm font-bold leading-tight">{stop.customerName}</p>
        <p className="text-xs leading-snug text-neutral-700">{stop.address}</p>
      </div>

      {(stop.isControlledSubstance || stop.requiresSignature) && (
        <div className="flex flex-wrap gap-2 border-t border-dashed border-black pt-2 text-[10px] font-semibold uppercase">
          {stop.isControlledSubstance && (
            <span className="flex items-center gap-1">
              <ShieldAlert className="h-3 w-3" /> Controlled substance
            </span>
          )}
          {stop.requiresSignature && (
            <span className="flex items-center gap-1">
              <FileSignature className="h-3 w-3" /> Signature required
            </span>
          )}
        </div>
      )}
    </div>
  )
}
