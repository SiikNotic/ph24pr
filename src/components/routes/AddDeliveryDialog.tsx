import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Plus, Loader2, Search, CheckCircle2 } from 'lucide-react'
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
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useCustomers } from '@/hooks/useCustomers'
import { useAddDelivery } from '@/hooks/usePackages'
import { CustomerFormDialog } from '@/components/customers/CustomerFormDialog'
import type { Customer, DeliveryMethod, Priority } from '@/types/domain'

const DELIVERY_METHODS: DeliveryMethod[] = ['in_hand', 'leave_at_location', 'signature_required', 'pin_required']

export function AddDeliveryDialog({ routeId, nextSequence }: { routeId: string; nextSequence: number }) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [priority, setPriority] = useState<Priority>('standard')
  const [packageCount, setPackageCount] = useState(1)
  const [controlled, setControlled] = useState(false)
  const [signature, setSignature] = useState(false)
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>('in_hand')

  const { data: customers = [] } = useCustomers()
  const addDelivery = useAddDelivery()

  function reset() {
    setSearch('')
    setCustomer(null)
    setPriority('standard')
    setPackageCount(1)
    setControlled(false)
    setSignature(false)
    setDeliveryMethod('in_hand')
  }

  function pickCustomer(c: Customer) {
    setCustomer(c)
    setControlled(c.handlesControlledSubstances)
    setSignature(c.requiresSignature)
    setDeliveryMethod(c.requiresSignature ? 'signature_required' : 'in_hand')
  }

  const filtered = customers.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()))

  async function handleSubmit() {
    if (!customer) {
      toast.error(t('common.required'))
      return
    }
    if (packageCount < 1) {
      toast.error(t('common.required'))
      return
    }
    try {
      await addDelivery.mutateAsync({
        routeId,
        sequence: nextSequence,
        customerId: customer.id,
        customerName: customer.name,
        address: `${customer.address}, ${customer.city}, ${customer.state}`,
        priority,
        packageCount,
        isControlledSubstance: controlled,
        requiresSignature: signature,
        deliveryMethod,
      })
      toast.success(t('common.success'))
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
        <Button>
          <Plus className="h-4 w-4" /> {t('routes.addDelivery')}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{t('routes.addDelivery')}</DialogTitle>
        </DialogHeader>

        {!customer ? (
          <Tabs defaultValue="existing">
            <TabsList className="w-full">
              <TabsTrigger value="existing" className="flex-1">
                {t('routes.existingCustomer')}
              </TabsTrigger>
              <TabsTrigger value="new" className="flex-1">
                {t('routes.newCustomerTab')}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="existing" className="flex flex-col gap-2">
              <div className="relative">
                <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  className="pl-8"
                  placeholder={t('common.search')}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <ScrollArea className="h-56 rounded-md border border-border">
                <div className="flex flex-col divide-y divide-border">
                  {filtered.length === 0 ? (
                    <p className="p-4 text-center text-sm text-muted-foreground">{t('customers.noCustomers')}</p>
                  ) : (
                    filtered.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => pickCustomer(c)}
                        className="flex flex-col items-start gap-0.5 p-3 text-left text-sm transition-colors hover:bg-accent"
                      >
                        <span className="font-medium">{c.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {c.address}, {c.city}, {c.state}
                        </span>
                      </button>
                    ))
                  )}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="new" className="flex flex-col items-center gap-3 py-6 text-center">
              <p className="text-sm text-muted-foreground">{t('routes.newCustomerHint')}</p>
              <CustomerFormDialog onCreated={pickCustomer} />
            </TabsContent>
          </Tabs>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="flex items-start justify-between gap-2 rounded-lg border border-success/30 bg-success/10 p-3">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                <div>
                  <p className="text-sm font-medium">{customer.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {customer.address}, {customer.city}, {customer.state}
                  </p>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setCustomer(null)}>
                {t('common.edit')}
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label>{t('routes.priority')}</Label>
                <Select value={priority} onValueChange={(v) => setPriority(v as Priority)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="standard">{t('priority.standard')}</SelectItem>
                    <SelectItem value="urgent">{t('priority.urgent')}</SelectItem>
                    <SelectItem value="stat">{t('priority.stat')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>{t('routes.packages')}</Label>
                <Input
                  type="number"
                  min={1}
                  max={50}
                  value={packageCount}
                  onChange={(e) => setPackageCount(Math.max(1, Number(e.target.value) || 1))}
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label>{t('delivery.method')}</Label>
              <Select value={deliveryMethod} onValueChange={(v) => setDeliveryMethod(v as DeliveryMethod)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DELIVERY_METHODS.map((m) => (
                    <SelectItem key={m} value={m}>
                      {t(`delivery.methods.${m}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">{t(`delivery.methodHints.${deliveryMethod}`)}</p>
            </div>

            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <Label className="cursor-pointer">{t('customers.controlledSubstances')}</Label>
              <Switch checked={controlled} onCheckedChange={setControlled} />
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <Label className="cursor-pointer">{t('customers.requiresSignature')}</Label>
              <Switch checked={signature} onCheckedChange={setSignature} />
            </div>

            <Badge variant="secondary" className="w-fit">
              {packageCount} {t(packageCount === 1 ? 'routes.packageWillBeCreated' : 'routes.packagesWillBeCreated')}
            </Badge>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            {t('common.cancel')}
          </Button>
          <Button onClick={handleSubmit} disabled={!customer || addDelivery.isPending}>
            {addDelivery.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            {t('routes.addDelivery')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
