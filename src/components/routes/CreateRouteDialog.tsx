import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Plus, Trash2, Loader2 } from 'lucide-react'
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useCustomers } from '@/hooks/useCustomers'
import { useDrivers } from '@/hooks/useDrivers'
import { useCreateRoute } from '@/hooks/useRoutes'
import { todayISODate } from '@/lib/format'
import type { Priority } from '@/types/domain'

interface DraftStop {
  customerId: string
  customerName: string
  address: string
  priority: Priority
  packageCount: number
  isControlledSubstance: boolean
  requiresSignature: boolean
}

export function CreateRouteDialog() {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [date, setDate] = useState(todayISODate())
  const [driverId, setDriverId] = useState<string>('')
  const [stops, setStops] = useState<DraftStop[]>([])
  const [pickCustomer, setPickCustomer] = useState('')

  const { data: customers = [] } = useCustomers()
  const { data: drivers = [] } = useDrivers()
  const createRoute = useCreateRoute()

  function addStop() {
    const c = customers.find((x) => x.id === pickCustomer)
    if (!c) return
    setStops((s) => [
      ...s,
      {
        customerId: c.id,
        customerName: c.name,
        address: `${c.address}, ${c.city}, ${c.state}`,
        priority: 'standard',
        packageCount: 1,
        isControlledSubstance: c.handlesControlledSubstances,
        requiresSignature: c.requiresSignature,
      },
    ])
    setPickCustomer('')
  }

  function reset() {
    setName('')
    setDate(todayISODate())
    setDriverId('')
    setStops([])
    setPickCustomer('')
  }

  async function handleSubmit() {
    if (!name.trim()) {
      toast.error(t('common.required'))
      return
    }
    try {
      await createRoute.mutateAsync({ name, date, driverId: driverId || null, stops })
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
          <Plus className="h-4 w-4" /> {t('routes.newRoute')}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{t('routes.createRoute')}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label>{t('routes.routeName')}</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="North Loop AM" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>{t('common.date')}</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>{t('routes.driver')}</Label>
            <Select value={driverId} onValueChange={setDriverId}>
              <SelectTrigger>
                <SelectValue placeholder={t('common.unassigned')} />
              </SelectTrigger>
              <SelectContent>
                {drivers.map((d) => (
                  <SelectItem key={d.id} value={d.id}>
                    {d.fullName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-2 rounded-lg border border-border p-3">
            <Label>{t('routes.addStop')}</Label>
            <div className="flex gap-2">
              <Select value={pickCustomer} onValueChange={setPickCustomer}>
                <SelectTrigger className="flex-1">
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
              <Button type="button" variant="secondary" onClick={addStop} disabled={!pickCustomer}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            {stops.length > 0 && (
              <div className="mt-2 flex flex-col divide-y divide-border">
                {stops.map((s, i) => (
                  <div key={i} className="flex items-center gap-2 py-2">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold">
                      {i + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{s.customerName}</p>
                      <p className="truncate text-xs text-muted-foreground">{s.address}</p>
                    </div>
                    <Select
                      value={s.priority}
                      onValueChange={(v) =>
                        setStops((arr) => arr.map((x, idx) => (idx === i ? { ...x, priority: v as Priority } : x)))
                      }
                    >
                      <SelectTrigger className="h-8 w-28 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="standard">{t('priority.standard')}</SelectItem>
                        <SelectItem value="urgent">{t('priority.urgent')}</SelectItem>
                        <SelectItem value="stat">{t('priority.stat')}</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => setStops((arr) => arr.filter((_, idx) => idx !== i))}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            {t('common.cancel')}
          </Button>
          <Button onClick={handleSubmit} disabled={createRoute.isPending}>
            {createRoute.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            {t('common.create')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
