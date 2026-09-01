import { useTranslation } from 'react-i18next'
import { Bell } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { useNotifications, useMarkNotificationRead } from '@/hooks/useNotifications'
import { formatRelativeTime } from '@/lib/format'
import { NOTIFICATION_ICON } from '@/components/shared/notificationIcons'

export function NotificationBell() {
  const { t, i18n } = useTranslation()
  const { data: notifications = [] } = useNotifications()
  const markRead = useMarkNotificationRead()
  const unread = notifications.filter((n) => !n.read)

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label={t('nav.notifications')}>
          <Bell className="h-4 w-4" />
          {unread.length > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold text-destructive-foreground">
              {unread.length > 9 ? '9+' : unread.length}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between border-b p-3">
          <p className="text-sm font-semibold">{t('nav.notifications')}</p>
          <Badge variant="secondary">{unread.length}</Badge>
        </div>
        <ScrollArea className="h-80">
          {notifications.length === 0 ? (
            <p className="p-6 text-center text-sm text-muted-foreground">{t('notifications.empty')}</p>
          ) : (
            <div className="flex flex-col">
              {notifications.slice(0, 20).map((n) => {
                const Icon = NOTIFICATION_ICON[n.type]
                return (
                  <button
                    key={n.id}
                    onClick={() => !n.read && markRead.mutate(n.id)}
                    className={`flex items-start gap-3 border-b p-3 text-left text-sm transition-colors hover:bg-accent last:border-0 ${!n.read ? 'bg-accent/40' : ''}`}
                  >
                    <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                      <Icon className="h-3.5 w-3.5" />
                    </span>
                    <span className="flex-1">
                      <span className="block font-medium leading-snug">{n.title}</span>
                      <span className="block text-xs text-muted-foreground">{n.body}</span>
                      <span className="mt-1 block text-[11px] text-muted-foreground/80">
                        {formatRelativeTime(n.createdAt, i18n.language)}
                      </span>
                    </span>
                    {!n.read && <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />}
                  </button>
                )
              })}
            </div>
          )}
        </ScrollArea>
        <div className="border-t p-2">
          <Button variant="ghost" size="sm" className="w-full" asChild>
            <Link to="/notifications">{t('common.viewAll')}</Link>
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
