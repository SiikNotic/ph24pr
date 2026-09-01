import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Camera, RotateCcw } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { fileToCompressedDataUrl } from '@/lib/imageUtils'

export function PhotoCapture({
  value,
  onChange,
  label,
}: {
  value: string | null
  onChange: (dataUrl: string | null) => void
  label: string
}) {
  const { t } = useTranslation()
  const inputRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setBusy(true)
    try {
      const dataUrl = await fileToCompressedDataUrl(file)
      onChange(dataUrl)
    } catch {
      toast.error(t('common.error'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex flex-col gap-2">
      {value ? (
        <div className="relative overflow-hidden rounded-lg border border-border">
          <img src={value} alt={label} className="max-h-64 w-full object-cover" />
          <Button
            variant="secondary"
            size="sm"
            className="absolute right-2 top-2"
            onClick={() => inputRef.current?.click()}
          >
            <RotateCcw className="h-3.5 w-3.5" /> {t('delivery.retakePhoto')}
          </Button>
        </div>
      ) : (
        <Button variant="outline" onClick={() => inputRef.current?.click()} disabled={busy}>
          <Camera className="h-4 w-4" /> {label}
        </Button>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFile}
      />
    </div>
  )
}
