import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Plus, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useCreateRouteShell } from '@/hooks/useRoutes'
import { todayISODate } from '@/lib/format'

// Step 1 of the route workflow: just an internal name and a date. Creates
// the route as a draft, then hands off to the route builder for adding
// deliveries, printing labels, and confirming.
export function CreateRouteDialog() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [date, setDate] = useState(todayISODate())
  const createShell = useCreateRouteShell()

  async function handleSubmit() {
    if (!name.trim()) {
      toast.error(t('common.required'))
      return
    }
    try {
      const route = await createShell.mutateAsync({ name, date })
      setOpen(false)
      setName('')
      setDate(todayISODate())
      navigate(`/routes/${route.id}/build`)
    } catch (e: any) {
      toast.error(e.message ?? t('common.error'))
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4" /> {t('routes.newRoute')}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('routes.createRoute')}</DialogTitle>
          <DialogDescription>{t('routeBuilder.shellHint')}</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label>{t('routes.routeName')}</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="North Loop AM"
              autoFocus
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>{t('common.date')}</Label>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            {t('common.cancel')}
          </Button>
          <Button onClick={handleSubmit} disabled={createShell.isPending}>
            {createShell.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            {t('common.next')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
