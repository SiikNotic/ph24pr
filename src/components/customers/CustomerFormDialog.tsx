import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Plus, Loader2, Pencil } from 'lucide-react'
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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useCreateCustomer, useUpdateCustomer } from '@/hooks/useCustomers'
import type { Customer, CustomerType } from '@/types/domain'

const TYPES: CustomerType[] = ['pharmacy', 'clinic', 'hospital', 'nursing_home', 'patient']

const EMPTY = {
  name: '',
  type: 'pharmacy' as CustomerType,
  address: '',
  city: '',
  state: '',
  zip: '',
  contactName: '',
  contactPhone: '',
  contactEmail: '',
  requiresSignature: false,
  handlesControlledSubstances: false,
  deliveryNotes: '',
  active: true,
}

export function CustomerFormDialog({ customer }: { customer?: Customer }) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(EMPTY)
  const createCustomer = useCreateCustomer()
  const updateCustomer = useUpdateCustomer()

  useEffect(() => {
    if (open && customer) {
      setForm({
        name: customer.name,
        type: customer.type,
        address: customer.address,
        city: customer.city,
        state: customer.state,
        zip: customer.zip,
        contactName: customer.contactName ?? '',
        contactPhone: customer.contactPhone ?? '',
        contactEmail: customer.contactEmail ?? '',
        requiresSignature: customer.requiresSignature,
        handlesControlledSubstances: customer.handlesControlledSubstances,
        deliveryNotes: customer.deliveryNotes ?? '',
        active: customer.active,
      })
    } else if (open) {
      setForm(EMPTY)
    }
  }, [open, customer])

  async function handleSubmit() {
    if (!form.name.trim() || !form.address.trim()) {
      toast.error(t('common.required'))
      return
    }
    try {
      if (customer) {
        await updateCustomer.mutateAsync({ id: customer.id, input: form })
      } else {
        await createCustomer.mutateAsync(form)
      }
      toast.success(t('common.success'))
      setOpen(false)
    } catch (e: any) {
      toast.error(e.message ?? t('common.error'))
    }
  }

  const pending = createCustomer.isPending || updateCustomer.isPending

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {customer ? (
          <Button variant="ghost" size="icon">
            <Pencil className="h-4 w-4" />
          </Button>
        ) : (
          <Button>
            <Plus className="h-4 w-4" /> {t('customers.newCustomer')}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{customer ? t('customers.editCustomer') : t('customers.newCustomer')}</DialogTitle>
        </DialogHeader>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <Label>{t('common.name')}</Label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>{t('customers.type')}</Label>
            <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v as CustomerType })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TYPES.map((ty) => (
                  <SelectItem key={ty} value={ty}>
                    {t(`customers.types.${ty}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>{t('common.phone')}</Label>
            <Input value={form.contactPhone} onChange={(e) => setForm({ ...form, contactPhone: e.target.value })} />
          </div>
          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <Label>{t('common.address')}</Label>
            <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>City</Label>
            <Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
          </div>
          <div className="flex gap-3">
            <div className="flex flex-1 flex-col gap-1.5">
              <Label>State</Label>
              <Input value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} />
            </div>
            <div className="flex flex-1 flex-col gap-1.5">
              <Label>ZIP</Label>
              <Input value={form.zip} onChange={(e) => setForm({ ...form, zip: e.target.value })} />
            </div>
          </div>
          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <Label>{t('customers.contact')}</Label>
            <Input value={form.contactName} onChange={(e) => setForm({ ...form, contactName: e.target.value })} />
          </div>
          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <Label>{t('common.email')}</Label>
            <Input
              type="email"
              value={form.contactEmail}
              onChange={(e) => setForm({ ...form, contactEmail: e.target.value })}
            />
          </div>
          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <Label>{t('customers.deliveryNotes')}</Label>
            <Textarea
              value={form.deliveryNotes}
              onChange={(e) => setForm({ ...form, deliveryNotes: e.target.value })}
            />
          </div>
          <div className="flex items-center justify-between rounded-lg border border-border p-3 sm:col-span-2">
            <Label className="cursor-pointer">{t('customers.requiresSignature')}</Label>
            <Switch
              checked={form.requiresSignature}
              onCheckedChange={(v) => setForm({ ...form, requiresSignature: v })}
            />
          </div>
          <div className="flex items-center justify-between rounded-lg border border-border p-3 sm:col-span-2">
            <Label className="cursor-pointer">{t('customers.controlledSubstances')}</Label>
            <Switch
              checked={form.handlesControlledSubstances}
              onCheckedChange={(v) => setForm({ ...form, handlesControlledSubstances: v })}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            {t('common.cancel')}
          </Button>
          <Button onClick={handleSubmit} disabled={pending}>
            {pending && <Loader2 className="h-4 w-4 animate-spin" />}
            {t('common.save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
