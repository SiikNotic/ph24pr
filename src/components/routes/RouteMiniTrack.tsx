import { Truck } from 'lucide-react'
import { cn } from '@/lib/utils'

// The compact "dot — truck — dot" route-progress motif from logistics SaaS
// dashboards (load-list rows showing a shipment's pickup-to-delivery
// progress at a glance). Purely a stops-completed fraction — no real
// geography involved, unlike a map.
export function RouteMiniTrack({ done, total, className }: { done: number; total: number; className?: string }) {
  const pct = total > 0 ? Math.min(100, Math.max(0, (done / total) * 100)) : 0
  const complete = total > 0 && done >= total

  return (
    <div className={cn('relative h-5 w-full', className)}>
      <div className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-border" />
      <div
        className={cn(
          'absolute left-0 top-1/2 h-px -translate-y-1/2 transition-all duration-700 ease-[cubic-bezier(0.19,1,0.22,1)]',
          complete ? 'bg-success' : 'bg-primary',
        )}
        style={{ width: `${pct}%` }}
      />
      <span className="absolute left-0 top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-primary" aria-hidden />
      <span
        className={cn(
          'absolute right-0 top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full',
          complete ? 'bg-success' : 'bg-border',
        )}
        aria-hidden
      />
      <span
        className={cn(
          'absolute top-1/2 flex h-5 w-5 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-[1.5px] bg-card transition-[left] duration-700 ease-[cubic-bezier(0.19,1,0.22,1)]',
          complete ? 'border-success text-success' : 'border-primary text-primary',
        )}
        style={{ left: `${pct}%` }}
        aria-hidden
      >
        <Truck className="h-3 w-3" strokeWidth={2.5} />
      </span>
    </div>
  )
}
