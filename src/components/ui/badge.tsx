import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center gap-1.5 rounded-md border px-2.5 py-0.5 text-xs font-medium transition-colors',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-primary text-primary-foreground',
        secondary: 'border-transparent bg-secondary text-secondary-foreground',
        outline: 'border-border text-foreground bg-transparent',
        success: 'border-success/20 bg-success/10 text-success',
        warning: 'border-warning/25 bg-warning/12 text-warning-foreground',
        destructive: 'border-destructive/20 bg-destructive/10 text-destructive',
        info: 'border-border bg-muted text-muted-foreground',
      },
    },
    defaultVariants: { variant: 'default' },
  },
)

const DOT_CLASS: Record<string, string> = {
  default: 'bg-primary-foreground',
  secondary: 'bg-secondary-foreground',
  outline: 'bg-foreground',
  success: 'bg-success',
  warning: 'bg-warning',
  destructive: 'bg-destructive',
  info: 'bg-muted-foreground',
}

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  /** Small solid dot before the label — gives status an at-a-glance
   * shape/position cue distinct from plain colored text, so recognition
   * never depends on color alone. */
  dot?: boolean
}

function Badge({ className, variant, dot, children, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props}>
      {dot && <span className={cn('h-1.5 w-1.5 shrink-0 rounded-full', DOT_CLASS[variant ?? 'default'])} />}
      {children}
    </div>
  )
}

export { Badge, badgeVariants }
