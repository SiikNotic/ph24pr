import type { LucideIcon } from 'lucide-react'
import { TrendingUp, TrendingDown } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

export function KpiCard({
  label,
  value,
  icon: Icon,
  delta,
  tone = 'default',
}: {
  label: string
  value: string | number
  icon?: LucideIcon
  delta?: number
  tone?: 'default' | 'success' | 'warning' | 'destructive' | 'info'
}) {
  const toneClass = {
    default: 'bg-primary/10 text-primary',
    success: 'bg-success/15 text-success',
    warning: 'bg-warning/20 text-warning-foreground',
    destructive: 'bg-destructive/15 text-destructive',
    info: 'bg-info/15 text-info',
  }[tone]

  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-4 sm:p-5">
        {Icon && (
          <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-lg', toneClass)}>
            <Icon className="h-5 w-5" />
          </div>
        )}
        <div className="min-w-0">
          <p className="text-xs font-medium leading-tight text-muted-foreground">{label}</p>
          <div className="flex items-baseline gap-2">
            <p className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">{value}</p>
            {typeof delta === 'number' && (
              <span
                className={cn(
                  'flex items-center gap-0.5 text-xs font-medium',
                  delta >= 0 ? 'text-success' : 'text-destructive',
                )}
              >
                {delta >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                {Math.abs(delta)}%
              </span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
