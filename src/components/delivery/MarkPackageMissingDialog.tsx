import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Loader2, PackageX } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useReportPackageMissing } from '@/hooks/usePackages'
import type { Package } from '@/types/domain'

const REASONS = ['not_on_shelf', 'not_loaded', 'damaged', 'other'] as const

// Confirms a "Package not present" report with a quick reason before it's
// sent — report_package_missing() records package/route/driver/time/reason
// and notifies dispatch immediately (see supabase/schema-notes.md). Never
// creates a duplicate package or delivery.
export function MarkPackageMissingDialog({
  pkg,
  routeId,
  onClose,
}: {
  pkg: Package | null
  routeId: string
  onClose: () => void
}) {
  const { t } = useTranslation()
  const [reason, setReason] = useState<string>('not_on_shelf')
  const [notes, setNotes] = useState('')
  const reportMissing = useReportPackageMissing()

  function handleClose(open: boolean) {
    if (!open) {
      onClose()
      setReason('not_on_shelf')
      setNotes('')
    }
  }

  async function handleConfirm() {
    if (!pkg) return
    try {
      await reportMissing.mutateAsync({ packageId: pkg.id, reason, notes: notes.trim() || undefined, routeId })
      toast.success(t('common.success'))
      handleClose(false)
    } catch (e: any) {
      toast.error(e.message ?? t('common.error'))
    }
  }

  return (
    <Dialog open={!!pkg} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PackageX className="h-4 w-4 text-warning-foreground" /> {t('loading.missingDialogTitle')}
          </DialogTitle>
          <DialogDescription>{t('loading.missingDialogSubtitle')}</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          {pkg && <p className="font-numeric text-sm font-semibold">{pkg.code}</p>}

          <div className="flex flex-col gap-1.5">
            <Label>{t('loading.missingReason')}</Label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {REASONS.map((r) => (
                  <SelectItem key={r} value={r}>
                    {t(`loading.missingReasonOptions.${r}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>{t('loading.missingNotes')}</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleClose(false)}>
            {t('common.cancel')}
          </Button>
          <Button variant="destructive" onClick={handleConfirm} disabled={reportMissing.isPending}>
            {reportMissing.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            {t('loading.confirmMissing')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
