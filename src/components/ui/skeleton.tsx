import { cn } from '@/lib/utils'

function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('animate-[shimmer_1.8s_infinite] rounded-md bg-muted bg-[length:200%_100%]', className)}
      style={{
        backgroundImage:
          'linear-gradient(90deg, var(--muted) 0%, color-mix(in oklch, var(--muted) 55%, var(--foreground) 8%) 50%, var(--muted) 100%)',
      }}
      {...props}
    />
  )
}

export { Skeleton }
