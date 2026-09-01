import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { CalendarOff, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useCreateTimeOffRequest } from '@/hooks/useTimeOff'
import { todayISODate } from '@/lib/format'

export function RequestTimeOffDialog() {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const [startDate, setStartDate] = useState(todayISODate())
  const [endDate, setEndDate] = useState(todayISODate())
  const [reason, setReason] = useState('')
  const createRequest = useCreateTimeOffRequest()

  function reset() {
    setStartDate(todayISODate())
    setEndDate(todayISODate())
    setReason('')
  }

  async function handleSubmit() {
    if (endDate < startDate) {
      toast.error(t('availability.endBeforeStart'))
      return
    }
    try {
      await createRequest.mutateAsync({ startDate, endDate, reason: reason || undefined })
      toast.success(t('availability.requestSubmitted'))
      reset()
      setOpen(false)
    } catch (e: any) {
      toast.error(e.message ?? t('common.error'))
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o)
        if (!o) reset()
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline">
          <CalendarOff className="h-4 w-4" /> {t('availability.requestTimeOff')}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('availability.requestTimeOff')}</DialogTitle>
          <DialogDescription>{t('availability.requestHint')}</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label>{t('availability.startDate')}</Label>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>{t('availability.endDate')}</Label>
              <Input type="date" value={endDate} min={startDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>
              {t('availability.reason')} <span className="text-muted-foreground">({t('common.optional')})</span>
            </Label>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={t('availability.reasonPlaceholder')}
              rows={2}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            {t('common.cancel')}
          </Button>
          <Button onClick={handleSubmit} disabled={createRequest.isPending}>
            {createRequest.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            {t('availability.submitRequest')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
