import { useTranslation } from 'react-i18next'
import { Bell, CheckCheck } from 'lucide-react'
import { PageHeader } from '@/components/shared/PageHeader'
import { EmptyState } from '@/components/shared/EmptyState'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useMarkAllNotificationsRead, useMarkNotificationRead, useNotifications } from '@/hooks/useNotifications'
import { formatDateTime } from '@/lib/format'
import { NOTIFICATION_ICON } from '@/components/shared/notificationIcons'
import { cn } from '@/lib/utils'

export default function Notifications() {
  const { t, i18n } = useTranslation()
  const { data: notifications = [], isLoading } = useNotifications()
  const markRead = useMarkNotificationRead()
  const markAllRead = useMarkAllNotificationsRead()
  const unreadIds = notifications.filter((n) => !n.read).map((n) => n.id)

  return (
    <div>
      <PageHeader
        title={t('notifications.title')}
        subtitle={t('notifications.subtitle')}
        actions={
          unreadIds.length > 0 ? (
            <Button variant="outline" size="sm" onClick={() => markAllRead.mutate(unreadIds)}>
              <CheckCheck className="h-4 w-4" /> {t('common.markAllRead')}
            </Button>
          ) : undefined
        }
      />

      {isLoading ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <EmptyState icon={Bell} title={t('notifications.empty')} />
      ) : (
        <div className="flex flex-col gap-2">
          {notifications.map((n) => {
            const Icon = NOTIFICATION_ICON[n.type]
            return (
              <Card key={n.id} className={cn(!n.read && 'border-primary/40 bg-accent/30')}>
                <CardContent
                  className="flex cursor-pointer items-start gap-3 p-4"
                  onClick={() => !n.read && markRead.mutate(n.id)}
                >
                  <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                    <Icon className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium">{n.title}</p>
                      {!n.read && <span className="h-1.5 w-1.5 rounded-full bg-primary" />}
                    </div>
                    <p className="text-sm text-muted-foreground">{n.body}</p>
                    <p className="mt-1 text-xs text-muted-foreground/80">
                      {n.actorName ? `${n.actorName} · ` : ''}
                      {formatDateTime(n.createdAt, i18n.language)}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
