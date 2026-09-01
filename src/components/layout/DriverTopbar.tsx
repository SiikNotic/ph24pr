import { useState } from 'react'
import { Menu, Waypoints } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet } from '@/components/ui/sheet'
import { DriverMenu } from '@/components/layout/DriverMenu'
import { NotificationBell } from '@/components/shared/NotificationBell'

// The driver app's only chrome: a top-left hamburger (the sole way into
// navigation — see DriverMenu) and a notification bell. No sidebar, no
// bottom tab bar, no page title clutter — the screen below this bar is
// always the point.
export function DriverTopbar() {
  const [open, setOpen] = useState(false)

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b border-border bg-background/90 px-3 backdrop-blur-md supports-[backdrop-filter]:bg-background/75">
      <Sheet open={open} onOpenChange={setOpen}>
        <Button variant="ghost" size="icon" onClick={() => setOpen(true)} aria-label="Menu">
          <Menu className="h-5 w-5" />
        </Button>
        <DriverMenu onNavigate={() => setOpen(false)} />
      </Sheet>

      <div className="flex flex-1 items-center justify-center gap-1.5 lg:justify-start lg:pl-1">
        <Waypoints className="h-4 w-4 text-primary" strokeWidth={2.5} />
        <span className="font-display text-[14px] font-semibold tracking-tight">
          Med<span className="text-primary">Route</span>
        </span>
      </div>

      <NotificationBell />
    </header>
  )
}
