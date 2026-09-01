import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { addDays, format } from 'date-fns'
import { enUS, es } from 'date-fns/locale'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { PageHeader } from '@/components/shared/PageHeader'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { usePermissions } from '@/hooks/usePermissions'
import { useAuthStore } from '@/store/auth'
import { useDrivers } from '@/hooks/useDrivers'
import { useAvailability, useUpsertAvailability } from '@/hooks/useAvailability'
import { todayISODate } from '@/lib/format'
import type { AvailabilityStatus } from '@/types/domain'

const STATUS_VARIANT: Record<AvailabilityStatus, 'success' | 'destructive' | 'warning' | 'secondary'> = {
  available: 'success',
  unavailable: 'destructive',
  time_off: 'warning',
  partial: 'secondary',
}

function toISODate(d: Date) {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export default function Availability() {
  const { t, i18n } = useTranslation()
  const { isDriver } = usePermissions()
  const driver = useAuthStore((s) => s.driver)
  const [weekStart] = useState(new Date())

  const days = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart])
  const startISO = todayISODate()
  const endISO = toISODate(days[6])

  const { data: drivers = [] } = useDrivers()
  const { data: availability = [], isLoading } = useAvailability(startISO, endISO)

  const visibleDrivers = isDriver ? drivers.filter((d) => d.id === driver?.id) : drivers

  function entryFor(driverId: string, dateISO: string) {
    return availability.find((a) => a.driverId === driverId && a.date === dateISO)
  }

  return (
    <div>
      <PageHeader title={t('availability.title')} subtitle={t('availability.subtitle')} />

      <div className="mb-4 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
        <span className="font-medium">{t('availability.legend')}:</span>
        {(['available', 'partial', 'time_off', 'unavailable'] as AvailabilityStatus[]).map((s) => (
          <Badge key={s} variant={STATUS_VARIANT[s]}>
            {t(`status.${s}`)}
          </Badge>
        ))}
      </div>

      <Card>
        <CardContent className="overflow-x-auto p-0">
          <table className="w-full min-w-[720px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="sticky left-0 z-10 bg-card p-3 text-left font-medium text-muted-foreground">
                  {t('drivers.title')}
                </th>
                {days.map((d) => (
                  <th key={d.toISOString()} className="min-w-28 p-3 text-center font-medium text-muted-foreground">
                    <div>{format(d, 'EEE', { locale: i18n.language === 'es' ? es : enUS })}</div>
                    <div className="text-xs font-normal">{format(d, 'MMM d')}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-muted-foreground">
                    <Loader2 className="mx-auto h-5 w-5 animate-spin" />
                  </td>
                </tr>
              ) : (
                visibleDrivers.map((d) => (
                  <tr key={d.id} className="border-b border-border last:border-0">
                    <td className="sticky left-0 z-10 bg-card p-3 font-medium">{d.fullName}</td>
                    {days.map((day) => {
                      const dateISO = toISODate(day)
                      const entry = entryFor(d.id, dateISO)
                      const canEdit = isDriver ? d.id === driver?.id : true
                      return (
                        <td key={dateISO} className="p-2 text-center">
                          <AvailabilityCell
                            driverId={d.id}
                            date={dateISO}
                            status={entry?.status}
                            startTime={entry?.startTime}
                            endTime={entry?.endTime}
                            editable={canEdit}
                          />
                        </td>
                      )
                    })}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  )
}

function AvailabilityCell({
  driverId,
  date,
  status,
  startTime,
  endTime,
  editable,
}: {
  driverId: string
  date: string
  status?: AvailabilityStatus
  startTime?: string
  endTime?: string
  editable: boolean
}) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState<{ status: AvailabilityStatus; startTime: string; endTime: string }>({
    status: status ?? 'available',
    startTime: startTime ?? '08:00',
    endTime: endTime ?? '17:00',
  })
  const upsert = useUpsertAvailability()

  const badge = (
    <Badge variant={status ? STATUS_VARIANT[status] : 'outline'} className="w-full justify-center">
      {status ? t(`status.${status}`) : '—'}
    </Badge>
  )

  if (!editable) return badge

  async function save() {
    try {
      await upsert.mutateAsync({
        driverId,
        date,
        status: form.status,
        startTime: form.status === 'available' || form.status === 'partial' ? form.startTime : undefined,
        endTime: form.status === 'available' || form.status === 'partial' ? form.endTime : undefined,
      })
      setOpen(false)
    } catch (e: any) {
      toast.error(e.message ?? t('common.error'))
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button className="w-full">{badge}</button>
      </PopoverTrigger>
      <PopoverContent className="w-64">
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs">{t('common.status')}</Label>
            <Select value={form.status} onValueChange={(v) => setForm((f) => ({ ...f, status: v as AvailabilityStatus }))}>
              <SelectTrigger className="h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="available">{t('status.available')}</SelectItem>
                <SelectItem value="partial">{t('status.partial')}</SelectItem>
                <SelectItem value="unavailable">{t('status.unavailable')}</SelectItem>
                <SelectItem value="time_off">{t('status.time_off')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {(form.status === 'available' || form.status === 'partial') && (
            <div className="grid grid-cols-2 gap-2">
              <div className="flex flex-col gap-1">
                <Label className="text-xs">{t('availability.startTime')}</Label>
                <Input
                  type="time"
                  className="h-8"
                  value={form.startTime}
                  onChange={(e) => setForm((f) => ({ ...f, startTime: e.target.value }))}
                />
              </div>
              <div className="flex flex-col gap-1">
                <Label className="text-xs">{t('availability.endTime')}</Label>
                <Input
                  type="time"
                  className="h-8"
                  value={form.endTime}
                  onChange={(e) => setForm((f) => ({ ...f, endTime: e.target.value }))}
                />
              </div>
            </div>
          )}
          <Button size="sm" onClick={save} disabled={upsert.isPending}>
            {upsert.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {t('common.save')}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
