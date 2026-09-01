import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { UserPlus, Loader2, RefreshCw, Copy, Check, PartyPopper } from 'lucide-react'
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useInviteTeamMember } from '@/hooks/useSettings'
import { ROLE_LABELS } from '@/lib/permissions'
import type { Role } from '@/types/domain'

// Unambiguous character set (no 0/O/1/l/I) so a temp password read aloud or
// copied to a sticky note doesn't get mistyped.
const PASSWORD_CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%'

function generatePassword(length = 12) {
  const bytes = new Uint32Array(length)
  crypto.getRandomValues(bytes)
  return Array.from(bytes, (b) => PASSWORD_CHARS[b % PASSWORD_CHARS.length]).join('')
}

const EMPTY = { fullName: '', email: '', phone: '', role: 'staff' as Role, tempPassword: generatePassword() }

export function InviteTeamMemberDialog({ canInviteOwner }: { canInviteOwner: boolean }) {
  const { t, i18n } = useTranslation()
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(EMPTY)
  const [created, setCreated] = useState<{ email: string; password: string } | null>(null)
  const [copied, setCopied] = useState(false)
  const invite = useInviteTeamMember()

  const roleOptions: Role[] = canInviteOwner
    ? ['owner', 'general_manager', 'dispatch', 'staff', 'driver']
    : ['general_manager', 'dispatch', 'staff', 'driver']

  function reset() {
    setForm({ ...EMPTY, tempPassword: generatePassword() })
    setCreated(null)
    setCopied(false)
  }

  async function handleSubmit() {
    if (!form.fullName.trim() || !form.email.trim() || form.tempPassword.length < 8) {
      toast.error(t('common.required'))
      return
    }
    try {
      await invite.mutateAsync({
        email: form.email.trim(),
        fullName: form.fullName.trim(),
        role: form.role,
        tempPassword: form.tempPassword,
        phone: form.phone.trim() || undefined,
      })
      setCreated({ email: form.email.trim(), password: form.tempPassword })
    } catch (e: any) {
      toast.error(e.message ?? t('common.error'))
    }
  }

  async function copyCredentials() {
    const text = `${created?.email}\n${created?.password}`
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error(t('common.error'))
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v)
        if (!v) reset()
      }}
    >
      <DialogTrigger asChild>
        <Button>
          <UserPlus className="h-4 w-4" /> {t('settings.inviteTeamMember')}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        {created ? (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <PartyPopper className="h-4.5 w-4.5 text-success" /> {t('settings.accountCreated')}
              </DialogTitle>
              <DialogDescription>{t('settings.accountCreatedHint')}</DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-3 rounded-xl border border-border bg-muted/30 p-3.5">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {t('auth.email')}
                </p>
                <p className="font-numeric text-sm">{created.email}</p>
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {t('settings.tempPassword')}
                </p>
                <p className="font-numeric text-sm">{created.password}</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">{t('settings.shareCredentialsHint')}</p>
            <DialogFooter>
              <Button variant="outline" onClick={copyCredentials}>
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copied ? t('common.copied') : t('settings.copyCredentials')}
              </Button>
              <Button onClick={() => setOpen(false)}>{t('common.done')}</Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>{t('settings.inviteTeamMember')}</DialogTitle>
              <DialogDescription>{t('settings.inviteTeamMemberHint')}</DialogDescription>
            </DialogHeader>

            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-1.5">
                <Label>{t('common.name')}</Label>
                <Input value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>{t('auth.email')}</Label>
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="teammate@pharmacy.com"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>
                  {t('common.phone')} <span className="text-muted-foreground">({t('common.optional')})</span>
                </Label>
                <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="787-555-0100" />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>{t('settings.role')}</Label>
                <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v as Role })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {roleOptions.map((r) => (
                      <SelectItem key={r} value={r}>
                        {ROLE_LABELS[r][i18n.language === 'es' ? 'es' : 'en']}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>{t('settings.tempPassword')}</Label>
                <div className="flex gap-2">
                  <Input
                    value={form.tempPassword}
                    onChange={(e) => setForm({ ...form, tempPassword: e.target.value })}
                    className="font-numeric"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => setForm({ ...form, tempPassword: generatePassword() })}
                    title={t('settings.regeneratePassword')}
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">{t('settings.tempPasswordHint')}</p>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>
                {t('common.cancel')}
              </Button>
              <Button onClick={handleSubmit} disabled={invite.isPending}>
                {invite.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                {t('settings.createAccount')}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
