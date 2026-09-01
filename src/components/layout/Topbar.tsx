import { useState } from 'react'
import { Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import { SidebarNav } from '@/components/layout/Sidebar'
import { NotificationBell } from '@/components/shared/NotificationBell'
import { LanguageSwitcher } from '@/components/shared/LanguageSwitcher'
import { ThemeToggle } from '@/components/shared/ThemeToggle'

// Profile/sign-out lives in the sidebar's own footer (SidebarNav) now —
// no separate avatar/dropdown duplicated up here.
export function Topbar({ title }: { title: string }) {
  const [open, setOpen] = useState(false)

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-background/85 px-4 backdrop-blur-md supports-[backdrop-filter]:bg-background/70 sm:px-6">
      <Sheet open={open} onOpenChange={setOpen}>
        <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setOpen(true)} aria-label="Menu">
          <Menu className="h-5 w-5" />
        </Button>
        <SheetContent side="left" className="w-64 p-0">
          <SidebarNav onNavigate={() => setOpen(false)} />
        </SheetContent>
      </Sheet>

      <h1 className="font-display min-w-0 flex-1 truncate text-[17px] font-semibold tracking-tight text-foreground sm:text-lg">
        {title}
      </h1>

      <div className="flex items-center gap-0.5 sm:gap-1">
        <NotificationBell />
        <LanguageSwitcher />
        <ThemeToggle />
      </div>
    </header>
  )
}
