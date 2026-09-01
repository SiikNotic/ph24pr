import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { Route as RouteIcon, Package, Building2, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useOrgSettings } from '@/hooks/useSettings'
import type { DeliveryRoute } from '@/types/domain'

// Shown the moment a driver opens the app to a freshly assigned route,
// before any loading has started — a calm summary + one primary action.
// No accept/reject: dispatch already made the assignment (per the brief),
// this is purely "here's what you're about to load".
export function RouteAssignedSummary({
  route,
  packageCount,
  onStart,
}: {
  route: DeliveryRoute
  packageCount: number
  onStart: () => void
}) {
  const { t } = useTranslation()
  const { data: orgSettings } = useOrgSettings()

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.19, 1, 0.22, 1] }}
      className="flex min-h-[70svh] flex-col items-center justify-center gap-6 px-2 py-8 text-center"
    >
      <span className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/12 text-primary">
        <RouteIcon className="h-7 w-7" strokeWidth={1.75} />
      </span>

      <div className="flex flex-col gap-1.5">
        <p className="text-xs font-semibold uppercase tracking-wider text-primary">{t('routes.title')}</p>
        <h1 className="font-display text-2xl font-semibold tracking-tight">{route.name}</h1>
      </div>

      <Card className="w-full max-w-sm">
        <CardContent className="flex flex-col divide-y divide-border p-0">
          <div className="flex items-center gap-3 p-4">
            <RouteIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
            <span className="flex-1 text-left text-sm text-muted-foreground">{t('routes.stops')}</span>
            <span className="font-numeric text-sm font-semibold">{route.stops.length}</span>
          </div>
          <div className="flex items-center gap-3 p-4">
            <Package className="h-4 w-4 shrink-0 text-muted-foreground" />
            <span className="flex-1 text-left text-sm text-muted-foreground">{t('routes.packages')}</span>
            <span className="font-numeric text-sm font-semibold">{packageCount}</span>
          </div>
          <div className="flex items-center gap-3 p-4">
            <Building2 className="h-4 w-4 shrink-0 text-muted-foreground" />
            <span className="flex-1 text-left text-sm text-muted-foreground">{t('driverHome.startingStation')}</span>
            <span className="truncate text-sm font-semibold">{orgSettings?.companyName ?? '—'}</span>
          </div>
        </CardContent>
      </Card>

      <Button size="lg" className="rounded-full px-8" onClick={onStart}>
        {t('driverHome.startLoading')} <ArrowRight className="h-4 w-4" />
      </Button>
    </motion.div>
  )
}
