import { Navigate, Outlet } from 'react-router-dom'
import { Loader2, ShieldAlert } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '@/store/auth'
import { usePermissions } from '@/hooks/usePermissions'
import type { Section } from '@/lib/permissions'
import { Button } from '@/components/ui/button'

export function RequireAuth() {
  const session = useAuthStore((s) => s.session)
  const loading = useAuthStore((s) => s.loading)

  if (loading) {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!session) return <Navigate to="/login" replace />

  return <Outlet />
}

export function RequireSection({ section, children }: { section: Section; children: React.ReactNode }) {
  const { t } = useTranslation()
  const { canView, sections } = usePermissions()

  if (!canView(section)) {
    const fallback = sections[0]
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
        <ShieldAlert className="h-10 w-10 text-muted-foreground" />
        <p className="text-sm font-medium">403 — Not authorized</p>
        {fallback && (
          <Button asChild size="sm" variant="outline">
            <a href="/">{t('common.back')}</a>
          </Button>
        )}
      </div>
    )
  }

  return <>{children}</>
}
