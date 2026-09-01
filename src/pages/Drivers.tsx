import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Truck, Star, ShieldCheck, ShieldAlert, Car, Bike } from 'lucide-react'
import { PageHeader } from '@/components/shared/PageHeader'
import { EmptyState } from '@/components/shared/EmptyState'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { usePermissions } from '@/hooks/usePermissions'
import { useDrivers, useUpdateDriverStatus } from '@/hooks/useDrivers'
import { initials, formatDate } from '@/lib/format'
import type { DriverStatus } from '@/types/domain'

const STATUSES: DriverStatus[] = ['available', 'on_route', 'break', 'off_duty', 'inactive']

export default function Drivers() {
  const { t, i18n } = useTranslation()
  const { can } = usePermissions()
  const [search, setSearch] = useState('')

  const { data: drivers = [], isLoading } = useDrivers()
  const updateStatus = useUpdateDriverStatus()

  const filtered = drivers.filter((d) => d.fullName.toLowerCase().includes(search.toLowerCase()))

  return (
    <div>
      <PageHeader title={t('drivers.title')} subtitle={t('drivers.subtitle')} />

      <div className="mb-4">
        <Input placeholder={t('common.search')} value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-sm" />
      </div>

      {isLoading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-48 w-full" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={Truck} title={t('drivers.noDrivers')} />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((d) => {
            const VehicleIcon = d.vehicleType === 'motorcycle' || d.vehicleType === 'bike' ? Bike : Car
            const expiring = d.licenseExpiry && new Date(d.licenseExpiry) < new Date(Date.now() + 1000 * 60 * 60 * 24 * 60)
            return (
              <Card key={d.id}>
                <CardContent className="flex flex-col gap-3 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback>{initials(d.fullName)}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="truncate font-semibold">{d.fullName}</p>
                        <p className="text-xs text-muted-foreground">{d.phone}</p>
                      </div>
                    </div>
                    {d.rating && (
                      <span className="flex items-center gap-1 text-sm font-medium">
                        <Star className="h-3.5 w-3.5 fill-warning text-warning" /> {d.rating}
                      </span>
                    )}
                  </div>

                  {can('drivers', 'edit') ? (
                    <Select value={d.status} onValueChange={(v) => updateStatus.mutate({ id: d.id, status: v as DriverStatus })}>
                      <SelectTrigger className="h-8 w-fit text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {STATUSES.map((s) => (
                          <SelectItem key={s} value={s}>
                            {t(`status.${s}`)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <StatusBadge status={d.status} />
                  )}

                  <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                    <Badge variant="outline" className="gap-1">
                      <VehicleIcon className="h-3 w-3" /> {t(`drivers.vehicleTypes.${d.vehicleType}`)}
                      {d.vehiclePlate ? ` · ${d.vehiclePlate}` : ''}
                    </Badge>
                    {d.hipaaCertified && (
                      <Badge variant="info" className="gap-1">
                        <ShieldCheck className="h-3 w-3" /> {t('drivers.hipaaCertified')}
                      </Badge>
                    )}
                    {!d.backgroundCheckOk && (
                      <Badge variant="destructive" className="gap-1">
                        <ShieldAlert className="h-3 w-3" /> {t('drivers.backgroundCheck')}
                      </Badge>
                    )}
                  </div>

                  {d.licenseExpiry && (
                    <p className={`text-xs ${expiring ? 'text-destructive' : 'text-muted-foreground'}`}>
                      {t('drivers.licenseExpiry')}: {formatDate(d.licenseExpiry, i18n.language)}
                    </p>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
