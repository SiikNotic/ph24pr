import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Loader2, Moon, Sun, Monitor, Plus, X } from 'lucide-react'
import { toast } from 'sonner'
import { PageHeader } from '@/components/shared/PageHeader'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { usePermissions } from '@/hooks/usePermissions'
import {
  useOrgSettings,
  useUpdateOrgSettings,
  useUpdateDeliverySettings,
  useTeamMembers,
  useUpdateMemberRole,
} from '@/hooks/useSettings'
import { useUIStore } from '@/store/ui'
import { ROLE_LABELS } from '@/lib/permissions'
import { initials } from '@/lib/format'
import type { Role } from '@/types/domain'

const ROLES: Role[] = ['owner', 'general_manager', 'dispatch', 'staff', 'driver']

export default function Settings() {
  const { t, i18n } = useTranslation()
  const { can, isOwner } = usePermissions()
  const theme = useUIStore((s) => s.theme)
  const setTheme = useUIStore((s) => s.setTheme)

  const { data: org } = useOrgSettings()
  const updateOrg = useUpdateOrgSettings()
  const updateDeliverySettings = useUpdateDeliverySettings()
  const { data: members = [] } = useTeamMembers()
  const updateRole = useUpdateMemberRole()

  const [companyName, setCompanyName] = useState('')
  const [timezone, setTimezone] = useState('')
  const [requirePhotoForInHand, setRequirePhotoForInHand] = useState(false)
  const [leaveLocationOptions, setLeaveLocationOptions] = useState<string[]>([])
  const [newLocation, setNewLocation] = useState('')

  useEffect(() => {
    if (org) {
      setCompanyName(org.companyName)
      setTimezone(org.timezone)
      setRequirePhotoForInHand(org.requirePhotoForInHand)
      setLeaveLocationOptions(org.leaveLocationOptions)
    }
  }, [org])

  function saveDeliverySettings(next: { requirePhotoForInHand: boolean; leaveLocationOptions: string[] }) {
    updateDeliverySettings.mutate(next, {
      onSuccess: () => toast.success(t('common.success')),
      onError: (e: any) => toast.error(e.message ?? t('common.error')),
    })
  }

  function addLocation() {
    const value = newLocation.trim()
    if (!value || leaveLocationOptions.includes(value)) return
    const next = [...leaveLocationOptions, value]
    setLeaveLocationOptions(next)
    setNewLocation('')
    saveDeliverySettings({ requirePhotoForInHand, leaveLocationOptions: next })
  }

  function removeLocation(value: string) {
    const next = leaveLocationOptions.filter((l) => l !== value)
    setLeaveLocationOptions(next)
    saveDeliverySettings({ requirePhotoForInHand, leaveLocationOptions: next })
  }

  function toggleRequirePhoto(checked: boolean) {
    setRequirePhotoForInHand(checked)
    saveDeliverySettings({ requirePhotoForInHand: checked, leaveLocationOptions })
  }

  return (
    <div>
      <PageHeader title={t('settings.title')} subtitle={t('settings.subtitle')} />

      <Tabs defaultValue="general">
        <TabsList>
          <TabsTrigger value="general">{t('settings.general')}</TabsTrigger>
          {can('settings', 'manage_users') && <TabsTrigger value="users">{t('settings.users')}</TabsTrigger>}
          <TabsTrigger value="appearance">{t('settings.appearance')}</TabsTrigger>
          {isOwner && <TabsTrigger value="danger">{t('settings.dangerZone')}</TabsTrigger>}
        </TabsList>

        <TabsContent value="general">
          <Card className="max-w-xl">
            <CardHeader>
              <CardTitle className="text-base">{t('settings.organization')}</CardTitle>
              <CardDescription>{t('settings.subtitle')}</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <Label>{t('settings.companyName')}</Label>
                <Input
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  disabled={!can('settings', 'edit')}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>{t('settings.timezone')}</Label>
                <Input
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  disabled={!can('settings', 'edit')}
                />
              </div>
              {can('settings', 'edit') && (
                <Button
                  className="self-start"
                  onClick={() =>
                    updateOrg.mutate(
                      { companyName, timezone },
                      {
                        onSuccess: () => toast.success(t('common.success')),
                        onError: (e: any) => toast.error(e.message ?? t('common.error')),
                      },
                    )
                  }
                  disabled={updateOrg.isPending}
                >
                  {updateOrg.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                  {t('common.saveChanges')}
                </Button>
              )}
            </CardContent>
          </Card>

          {can('settings', 'edit') && (
            <Card className="mt-4 max-w-xl">
              <CardHeader>
                <CardTitle className="text-base">{t('delivery.settingsTitle')}</CardTitle>
                <CardDescription>{t('delivery.settingsSubtitle')}</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <div className="flex items-center justify-between rounded-lg border border-border p-3">
                  <div>
                    <Label className="cursor-pointer">{t('delivery.requirePhotoForInHand')}</Label>
                    <p className="text-xs text-muted-foreground">{t('delivery.requirePhotoForInHandHint')}</p>
                  </div>
                  <Switch checked={requirePhotoForInHand} onCheckedChange={toggleRequirePhoto} />
                </div>

                <div className="flex flex-col gap-2">
                  <Label>{t('delivery.leaveLocationOptions')}</Label>
                  <div className="flex flex-wrap gap-2">
                    {leaveLocationOptions.map((loc) => (
                      <Badge key={loc} variant="secondary" className="gap-1 py-1">
                        {loc}
                        <button onClick={() => removeLocation(loc)} className="ml-1 hover:text-destructive">
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      value={newLocation}
                      onChange={(e) => setNewLocation(e.target.value)}
                      placeholder={t('delivery.addLocationPlaceholder')}
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addLocation())}
                    />
                    <Button type="button" variant="outline" onClick={addLocation} disabled={!newLocation.trim()}>
                      <Plus className="h-4 w-4" /> {t('common.add')}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {can('settings', 'manage_users') && (
          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{t('settings.users')}</CardTitle>
                <CardDescription>{t('settings.manageRoles')}</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col divide-y divide-border">
                {members.map((m: any) => (
                  <div key={m.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="text-xs">{initials(m.full_name)}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{m.full_name}</p>
                      <p className="truncate text-xs text-muted-foreground">{m.email}</p>
                    </div>
                    <Select
                      value={m.role}
                      onValueChange={(v) =>
                        updateRole.mutate(
                          { id: m.id, role: v },
                          {
                            onSuccess: () => toast.success(t('common.success')),
                            onError: (e: any) => toast.error(e.message ?? t('common.error')),
                          },
                        )
                      }
                      disabled={m.role === 'owner' && !isOwner}
                    >
                      <SelectTrigger className="w-44">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ROLES.map((r) => (
                          <SelectItem key={r} value={r}>
                            {ROLE_LABELS[r][i18n.language === 'es' ? 'es' : 'en']}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
        )}

        <TabsContent value="appearance">
          <Card className="max-w-xl">
            <CardHeader>
              <CardTitle className="text-base">{t('settings.appearance')}</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <Label>{t('common.theme')}</Label>
                <div className="flex gap-2">
                  <Button variant={theme === 'light' ? 'default' : 'outline'} size="sm" onClick={() => setTheme('light')}>
                    <Sun className="h-4 w-4" /> {t('common.light')}
                  </Button>
                  <Button variant={theme === 'dark' ? 'default' : 'outline'} size="sm" onClick={() => setTheme('dark')}>
                    <Moon className="h-4 w-4" /> {t('common.dark')}
                  </Button>
                  <Button variant={theme === 'system' ? 'default' : 'outline'} size="sm" onClick={() => setTheme('system')}>
                    <Monitor className="h-4 w-4" /> {t('common.system')}
                  </Button>
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>{t('settings.language')}</Label>
                <Select value={i18n.language} onValueChange={(v) => i18n.changeLanguage(v)}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="es">Español</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {isOwner && (
          <TabsContent value="danger">
            <Card className="max-w-xl border-destructive/30">
              <CardHeader>
                <CardTitle className="text-base text-destructive">{t('settings.dangerZone')}</CardTitle>
                <CardDescription>{t('common.comingSoon')}</CardDescription>
              </CardHeader>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}
