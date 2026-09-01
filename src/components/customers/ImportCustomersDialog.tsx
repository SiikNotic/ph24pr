import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Upload, Download, Loader2, CheckCircle2, AlertTriangle, FileUp } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useBulkCreateCustomers } from '@/hooks/useCustomers'
import { parseCustomersCsv, customerCsvTemplate, downloadCsv, type ParsedCustomersCsv } from '@/lib/customersCsv'

// Imports customers from a CSV: pick a file, see a validation summary
// (valid rows vs. row-level errors with the reason), then commit only the
// valid rows in one bulk insert. Invalid rows are skipped, never guessed
// at or silently corrected beyond the small normalizations parseCustomersCsv
// itself documents (municipality casing, loose boolean spellings).
export function ImportCustomersDialog() {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const [fileName, setFileName] = useState<string | null>(null)
  const [parsed, setParsed] = useState<ParsedCustomersCsv | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const bulkCreate = useBulkCreateCustomers()

  function reset() {
    setFileName(null)
    setParsed(null)
  }

  function handleOpenChange(next: boolean) {
    setOpen(next)
    if (!next) reset()
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setFileName(file.name)
    const text = await file.text()
    setParsed(parseCustomersCsv(text))
  }

  async function handleImport() {
    if (!parsed || parsed.rows.length === 0) return
    try {
      const created = await bulkCreate.mutateAsync(parsed.rows)
      toast.success(t('customers.importSuccess', { count: created.length }))
      handleOpenChange(false)
    } catch (e: any) {
      toast.error(e.message ?? t('common.error'))
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Upload className="h-4 w-4" /> {t('customers.import')}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{t('customers.importTitle')}</DialogTitle>
          <DialogDescription>{t('customers.importSubtitle')}</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
              <FileUp className="h-3.5 w-3.5" /> {t('customers.chooseFile')}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground"
              onClick={() => downloadCsv('medroute-customers-template.csv', customerCsvTemplate())}
            >
              <Download className="h-3.5 w-3.5" /> {t('customers.downloadTemplate')}
            </Button>
            <input ref={fileInputRef} type="file" accept=".csv,text/csv" className="hidden" onChange={handleFile} />
          </div>

          {fileName && <p className="text-xs text-muted-foreground">{fileName}</p>}

          {parsed && (
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2 text-sm">
                {parsed.rows.length > 0 ? (
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-success" />
                ) : (
                  <AlertTriangle className="h-4 w-4 shrink-0 text-destructive" />
                )}
                <span>
                  {t('customers.importSummary', { valid: parsed.rows.length, total: parsed.rows.length + parsed.errors.length })}
                </span>
              </div>

              {parsed.errors.length > 0 && (
                <div className="flex flex-col gap-1">
                  <p className="text-xs font-semibold text-destructive">{t('customers.importErrors')}</p>
                  <ScrollArea className="h-32 rounded-md border border-border">
                    <div className="flex flex-col divide-y divide-border">
                      {parsed.errors.map((err, i) => (
                        <p key={i} className="px-3 py-1.5 text-xs text-muted-foreground">
                          {t('customers.importRow', { row: err.row })}: {err.message}
                        </p>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            {t('common.cancel')}
          </Button>
          <Button onClick={handleImport} disabled={!parsed || parsed.rows.length === 0 || bulkCreate.isPending}>
            {bulkCreate.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            {t('customers.importConfirm', { count: parsed?.rows.length ?? 0 })}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
