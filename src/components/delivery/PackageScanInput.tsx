import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'framer-motion'
import { Camera, CheckCircle2, Keyboard, Loader2, PackageX } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { decodeQrFromFile } from '@/lib/imageUtils'
import { cn } from '@/lib/utils'
import type { Package } from '@/types/domain'

// Scans one package: capture a photo of its QR label (decoded entirely on
// device, no network) or fall back to typing its printed code by hand —
// e.g. bad lighting, a damaged label, or (as in this environment) no
// camera at all. Either path calls onScan with whatever the driver
// provided; the scan_package RPC is what actually verifies it's correct.
//
// `onMarkMissing` is only ever passed by the pre-route loading screen
// (never DeliveryFlow's at-the-door scan) — it renders the "Package not
// present" affordance and, once the package carries a load-issue flag,
// shows that state instead of the plain "not scanned" one.
export function PackageScanInput({
  pkg,
  onScan,
  isScanning,
  onMarkMissing,
}: {
  pkg: Package
  onScan: (value: string) => void
  isScanning: boolean
  onMarkMissing?: () => void
}) {
  const { t } = useTranslation()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [manualEntry, setManualEntry] = useState(false)
  const [manualCode, setManualCode] = useState('')
  const [decoding, setDecoding] = useState(false)
  const missing = !!pkg.loadIssueReportedAt && !pkg.scannedAt

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setDecoding(true)
    try {
      const payload = await decodeQrFromFile(file)
      if (!payload) {
        toast.error(t('delivery.scanNotFound'))
        return
      }
      onScan(payload)
    } catch {
      toast.error(t('delivery.scanNotFound'))
    } finally {
      setDecoding(false)
    }
  }

  function submitManualCode() {
    if (!manualCode.trim()) return
    onScan(manualCode.trim())
  }

  const busy = isScanning || decoding

  return (
    <div
      className={cn(
        'flex flex-col gap-2 rounded-lg border p-3 transition-colors duration-500',
        pkg.scannedAt ? 'border-success/30 bg-success/[0.04]' : missing ? 'border-warning/30 bg-warning/[0.04]' : 'border-border',
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="font-numeric text-sm font-semibold">{pkg.code}</p>
          <p className="text-xs text-muted-foreground">{t('delivery.packageOf', { n: pkg.sequence })}</p>
        </div>
        <AnimatePresence mode="wait" initial={false}>
          {pkg.scannedAt ? (
            <motion.span
              key="scanned"
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'spring', stiffness: 500, damping: 20 }}
              className="flex items-center gap-1 text-sm font-medium text-success"
            >
              <CheckCircle2 className="h-4 w-4" /> {t('delivery.scanned')}
            </motion.span>
          ) : missing ? (
            <motion.span key="missing" initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }}>
              <Badge variant="warning" className="gap-1">
                <PackageX className="h-3 w-3" /> {t('loading.missingBadge')}
              </Badge>
            </motion.span>
          ) : (
            <motion.span key="pending" exit={{ opacity: 0 }} className="text-sm text-muted-foreground">
              {t('delivery.notScanned')}
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {!pkg.scannedAt && (
        <div className="flex flex-col gap-2">
          {missing && <p className="text-xs text-warning-foreground">{t('loading.missingHint')}</p>}
          {!manualEntry ? (
            <div className="flex gap-2">
              <Button className="flex-1" onClick={() => fileInputRef.current?.click()} disabled={busy}>
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
                {t('delivery.scanPackage')}
              </Button>
              <Button variant="outline" size="icon" onClick={() => setManualEntry(true)} disabled={busy}>
                <Keyboard className="h-4 w-4" />
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handleFile}
              />
            </div>
          ) : (
            <div className="flex gap-2">
              <Input
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                placeholder={t('delivery.enterCodeManually')}
                className="font-mono"
                autoFocus
              />
              <Button onClick={submitManualCode} disabled={busy || !manualCode.trim()}>
                {busy && <Loader2 className="h-4 w-4 animate-spin" />}
                {t('delivery.confirmCode')}
              </Button>
            </div>
          )}
          {onMarkMissing && !missing && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="self-start text-muted-foreground hover:text-warning-foreground"
              onClick={onMarkMissing}
              disabled={busy}
            >
              <PackageX className="h-3.5 w-3.5" /> {t('loading.packageNotPresent')}
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
