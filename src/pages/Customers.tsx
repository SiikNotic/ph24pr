import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Users, Search, ShieldAlert, FileSignature, Trash2, Phone, Mail } from 'lucide-react'
import { toast } from 'sonner'
import { PageHeader } from '@/components/shared/PageHeader'
import { EmptyState } from '@/components/shared/EmptyState'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { usePermissions } from '@/hooks/usePermissions'
import { useCustomers, useDeleteCustomer } from '@/hooks/useCustomers'
import { CustomerFormDialog } from '@/components/customers/CustomerFormDialog'
import type { CustomerType } from '@/types/domain'

const TYPES: (CustomerType | 'all')[] = ['all', 'pharmacy', 'clinic', 'hospital', 'nursing_home', 'patient']

export default function Customers() {
  const { t } = useTranslation()
  const { can } = usePermissions()
  const [search, setSearch] = useState('')
  const [type, setType] = useState<CustomerType | 'all'>('all')

  const { data: customers = [], isLoading } = useCustomers()
  const deleteCustomer = useDeleteCustomer()

  const filtered = useMemo(
    () =>
      customers.filter((c) => {
        if (type !== 'all' && c.type !== type) return false
        if (search && !c.name.toLowerCase().includes(search.toLowerCase())) return false
        return true
      }),
    [customers, search, type],
  )

  return (
    <div>
      <PageHeader
        title={t('customers.title')}
        subtitle={t('customers.subtitle')}
        actions={can('customers', 'create') ? <CustomerFormDialog /> : undefined}
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-48">
          <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-8"
            placeholder={t('common.search')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={type} onValueChange={(v) => setType(v as CustomerType | 'all')}>
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {TYPES.map((ty) => (
              <SelectItem key={ty} value={ty}>
                {ty === 'all' ? t('common.all') : t(`customers.types.${ty}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-44 w-full" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={Users} title={t('customers.noCustomers')} />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((c) => (
            <Card key={c.id}>
              <CardContent className="flex flex-col gap-2 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{c.name}</p>
                    <p className="text-xs text-muted-foreground">{t(`customers.types.${c.type}`)}</p>
                  </div>
                  {can('customers', 'edit') && <CustomerFormDialog customer={c} />}
                </div>

                <p className="text-sm text-muted-foreground">
                  {c.address}, {c.city}, PR {c.zip}
                </p>

                {(c.contactPhone || c.contactEmail) && (
                  <div className="flex flex-col gap-0.5 text-xs text-muted-foreground">
                    {c.contactPhone && (
                      <span className="flex items-center gap-1.5">
                        <Phone className="h-3 w-3" /> {c.contactPhone}
                      </span>
                    )}
                    {c.contactEmail && (
                      <span className="flex items-center gap-1.5">
                        <Mail className="h-3 w-3" /> {c.contactEmail}
                      </span>
                    )}
                  </div>
                )}

                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  {c.handlesControlledSubstances && (
                    <Badge variant="warning" className="gap-1">
                      <ShieldAlert className="h-3 w-3" /> {t('customers.controlledSubstances')}
                    </Badge>
                  )}
                  {c.requiresSignature && (
                    <Badge variant="outline" className="gap-1">
                      <FileSignature className="h-3 w-3" /> {t('customers.requiresSignature')}
                    </Badge>
                  )}
                </div>

                {can('customers', 'delete') && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-1 self-start text-destructive hover:text-destructive"
                    onClick={() =>
                      deleteCustomer.mutate(c.id, {
                        onSuccess: () => toast.success(t('common.success')),
                        onError: (e: any) => toast.error(e.message ?? t('common.error')),
                      })
                    }
                  >
                    <Trash2 className="h-3.5 w-3.5" /> {t('common.delete')}
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
