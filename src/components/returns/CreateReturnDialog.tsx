import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Plus, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useCustomers } from '@/hooks/useCustomers'
import { useCreateReturn } from '@/hooks/useReturns'
import { useOrgSettings } from '@/hooks/useSettings'
import { RETURN_REASONS } from '@/lib/returnReasons'
import type { ReturnReason } from '@/types/domain'

export function CreateReturnDialog() {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const [customerId, setCustomerId] = useState('')
  const [reason, setReason] = useState<ReturnReason>('other')
  const [customReason, setCustomReason] = useState('')
  const [notes, setNotes] = useState('')
  const [controlled, setControlled] = useState(false)

  const { data: customers = [] } = useCustomers()
  const { data: org } = useOrgSettings()
  const createReturn = useCreateReturn()
  const configuredReasons = org?.returnReasonOptions ?? []

  async function handleSubmit() {
    const customer = customers.find((c) => c.id === customerId)
    if (!customer) {
      toast.error(t('common.required'))
      return
    }
    if (reason === 'other' && !customReason.trim()) {
      toast.error(t('common.required'))
      return
    }
    try {
      await createReturn.mutateAsync({
        customerId: customer.id,
        customerName: customer.name,
        reason,
        customReason: reason === 'other' ? customReason.trim() : undefined,
        notes,
        isControlledSubstance: controlled,
      })
      toast.success(t('common.success'))
      setOpen(false)
      setCustomerId('')
      setCustomReason('')
      setNotes('')
      setControlled(false)
    } catch (e: any) {
      toast.error(e.message ?? t('common.error'))
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4" /> {t('returns.newReturn')}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('returns.newReturn')}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label>{t('routes.customer')}</Label>
            <Select value={customerId} onValueChange={setCustomerId}>
              <SelectTrigger>
                <SelectValue placeholder={t('routes.customer')} />
              </SelectTrigger>
              <SelectContent>
                {customers.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>{t('returns.reason')}</Label>
            <Select value={reason} onValueChange={(v) => setReason(v as ReturnReason)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {RETURN_REASONS.map((r) => (
                  <SelectItem key={r} value={r}>
                    {t(`returns.reasons.${r}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {reason === 'other' && (
            <div className="flex flex-col gap-1.5">
              <Label>{t('returns.customReasonLabel')}</Label>
              {configuredReasons.length > 0 ? (
                <Select value={customReason} onValueChange={setCustomReason}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('returns.selectReason')} />
                  </SelectTrigger>
                  <SelectContent>
                    {configuredReasons.map((r) => (
                      <SelectItem key={r} value={r}>
                        {r}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                  placeholder={t('returns.otherReasonPlaceholder')}
                />
              )}
            </div>
          )}
          <div className="flex flex-col gap-1.5">
            <Label>{t('common.notes')}</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
          <div className="flex items-center justify-between rounded-lg border border-border p-3">
            <Label className="cursor-pointer">{t('customers.controlledSubstances')}</Label>
            <Switch checked={controlled} onCheckedChange={setControlled} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            {t('common.cancel')}
          </Button>
          <Button onClick={handleSubmit} disabled={createReturn.isPending}>
            {createReturn.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            {t('common.create')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
