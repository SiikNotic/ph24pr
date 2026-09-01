import { motion } from 'framer-motion'
import type { LucideIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

// A full, intentional "nothing to do right now" screen for the driver
// home — used for "no route assigned", "route complete", and "all stops
// done, head back" states. Deliberately not a shrunk admin empty-state:
// large icon, centered, no stray navigation.
export function DriverEmptyScreen({
  icon: Icon,
  title,
  subtitle,
  hint,
  tone = 'muted',
  action,
}: {
  icon: LucideIcon
  title: string
  subtitle: string
  hint?: string
  tone?: 'muted' | 'success' | 'primary'
  action?: { label: string; onClick: () => void; loading?: boolean }
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.19, 1, 0.22, 1] }}
      className="flex min-h-[70svh] flex-col items-center justify-center gap-4 px-6 text-center"
    >
      <span
        className={cn(
          'flex h-16 w-16 items-center justify-center rounded-full',
          tone === 'success' ? 'bg-success/12 text-success' : tone === 'primary' ? 'bg-primary/12 text-primary' : 'bg-muted text-muted-foreground',
        )}
      >
        <Icon className="h-7 w-7" strokeWidth={1.75} />
      </span>
      <div className="flex flex-col gap-1.5">
        <h1 className="font-display text-xl font-semibold tracking-tight">{title}</h1>
        <p className="max-w-xs text-sm text-muted-foreground">{subtitle}</p>
        {hint && <p className="max-w-xs text-xs text-muted-foreground/70">{hint}</p>}
      </div>
      {action && (
        <Button size="lg" className="mt-2 rounded-full px-8" onClick={action.onClick} disabled={action.loading}>
          {action.label}
        </Button>
      )}
    </motion.div>
  )
}
