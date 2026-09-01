import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: {
  icon?: LucideIcon
  title: string
  description?: string
  action?: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-2.5 rounded-xl border border-dashed border-border bg-muted/20 py-14 text-center',
        className,
      )}
    >
      {Icon && (
        <div className="mb-1 flex h-11 w-11 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <Icon className="h-5 w-5" strokeWidth={1.75} />
        </div>
      )}
      <p className="font-display text-[15px] font-semibold text-foreground">{title}</p>
      {description && <p className="max-w-sm text-[13.5px] text-muted-foreground">{description}</p>}
      {action}
    </div>
  )
}
