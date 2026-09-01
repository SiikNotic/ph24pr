import type { LucideIcon } from 'lucide-react'
import { TrendingUp, TrendingDown } from 'lucide-react'
import { cn } from '@/lib/utils'

const TONE_ICON: Record<string, string> = {
  default: 'bg-primary/10 text-primary',
  success: 'bg-success/12 text-success',
  warning: 'bg-warning/15 text-warning-foreground',
  destructive: 'bg-destructive/12 text-destructive',
  info: 'bg-muted text-muted-foreground',
}

const TONE_ACCENT: Record<string, string> = {
  default: 'bg-primary',
  success: 'bg-success',
  warning: 'bg-warning',
  destructive: 'bg-destructive',
  info: 'bg-muted-foreground/40',
}

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
  return (
    <div className="group relative overflow-hidden rounded-xl border border-border bg-card p-4 shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-shadow hover:shadow-elevate sm:p-5">
      <span className={cn('absolute inset-y-0 left-0 w-[3px]', TONE_ACCENT[tone])} aria-hidden />
      <div className="flex items-start justify-between gap-3">
        <p className="text-[13px] font-medium leading-tight text-muted-foreground">{label}</p>
        {Icon && (
          <div className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-lg', TONE_ICON[tone])}>
            <Icon className="h-4 w-4" strokeWidth={2.25} />
          </div>
        )}
      </div>
      <div className="mt-2.5 flex items-baseline gap-2">
        <p className="font-numeric text-[28px] font-semibold leading-none text-foreground sm:text-[30px]">{value}</p>
        {typeof delta === 'number' && (
          <span
            className={cn(
              'flex items-center gap-0.5 text-xs font-semibold',
              delta >= 0 ? 'text-success' : 'text-destructive',
            )}
          >
            {delta >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            {Math.abs(delta)}%
          </span>
        )}
      </div>
    </div>
  )
}
