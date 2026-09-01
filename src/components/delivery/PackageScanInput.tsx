import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Camera, CheckCircle2, Keyboard, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { decodeQrFromFile } from '@/lib/imageUtils'
import type { Package } from '@/types/domain'

// Scans one package: capture a photo of its QR label (decoded entirely on
// device, no network) or fall back to typing its printed code by hand —
// e.g. bad lighting, a damaged label, or (as in this environment) no
// camera at all. Either path calls onScan with whatever the driver
// provided; the scan_package RPC is what actually verifies it's correct.
export function PackageScanInput({
  pkg,
  onScan,
  isScanning,
}: {
  pkg: Package
  onScan: (value: string) => void
  isScanning: boolean
}) {
  const { t } = useTranslation()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [manualEntry, setManualEntry] = useState(false)
  const [manualCode, setManualCode] = useState('')
  const [decoding, setDecoding] = useState(false)

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
    <div className="flex flex-col gap-2 rounded-lg border border-border p-3">
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="font-mono text-sm font-semibold">{pkg.code}</p>
          <p className="text-xs text-muted-foreground">{t('delivery.packageOf', { n: pkg.sequence })}</p>
        </div>
        {pkg.scannedAt ? (
          <span className="flex items-center gap-1 text-sm font-medium text-success">
            <CheckCircle2 className="h-4 w-4" /> {t('delivery.scanned')}
          </span>
        ) : (
          <span className="text-sm text-muted-foreground">{t('delivery.notScanned')}</span>
        )}
      </div>

      {!pkg.scannedAt && (
        <div className="flex flex-col gap-2">
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
        </div>
      )}
    </div>
  )
}
