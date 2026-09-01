import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Truck, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useAuthStore } from '@/store/auth'
import { DEMO_PASSWORD, DEMO_ACCOUNTS } from '@/lib/supabase'
import { ROLE_LABELS } from '@/lib/permissions'
import type { Role } from '@/types/domain'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { LanguageSwitcher } from '@/components/shared/LanguageSwitcher'
import { ThemeToggle } from '@/components/shared/ThemeToggle'

const ROLE_ICON_BG: Record<Role, string> = {
  owner: 'bg-primary/10 text-primary',
  general_manager: 'bg-info/15 text-info',
  dispatch: 'bg-warning/20 text-warning-foreground',
  staff: 'bg-secondary text-secondary-foreground',
  driver: 'bg-success/15 text-success',
}

export default function Login() {
  const { t, i18n } = useTranslation()
  const signIn = useAuthStore((s) => s.signIn)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState<string | null>(null)

  async function handleDemo(demoEmail: string, role: Role) {
    setLoading(role)
    try {
      await signIn(demoEmail, DEMO_PASSWORD)
    } catch {
      toast.error(t('auth.invalidCredentials'))
    } finally {
      setLoading(null)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading('manual')
    try {
      await signIn(email, password)
    } catch {
      toast.error(t('auth.invalidCredentials'))
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="flex min-h-svh flex-col bg-gradient-to-b from-secondary/40 to-background">
      <div className="flex items-center justify-between p-4 sm:p-6">
        <div className="flex items-center gap-2 font-semibold text-foreground">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Truck className="h-4.5 w-4.5" />
          </div>
          <span>{t('app.name')}</span>
        </div>
        <div className="flex items-center gap-2">
          <LanguageSwitcher />
          <ThemeToggle />
        </div>
      </div>

      <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col items-center justify-center gap-8 px-4 pb-16 pt-4 lg:flex-row lg:items-center lg:gap-12">
        <div className="flex max-w-sm flex-col justify-center gap-3 text-center lg:text-left">
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">{t('auth.welcomeBack')}</h1>
          <p className="text-sm text-muted-foreground sm:text-base">{t('auth.signInPrompt')}</p>
          <p className="mt-2 hidden text-xs text-muted-foreground lg:block">{t('auth.poweredBy')}</p>
        </div>

        <div className="grid w-full max-w-3xl items-start gap-5 sm:grid-cols-2">
          <Card>
            <CardContent className="flex flex-col gap-4 p-5">
              <div>
                <h2 className="text-sm font-semibold">{t('auth.demoAccess')}</h2>
                <p className="text-xs text-muted-foreground">{t('auth.demoAccessHint')}</p>
              </div>
              <div className="flex flex-col gap-2">
                {DEMO_ACCOUNTS.map((acc) => (
                  <Button
                    key={acc.role}
                    type="button"
                    variant="outline"
                    className="h-auto justify-start gap-3 py-2.5"
                    disabled={loading !== null}
                    onClick={() => handleDemo(acc.email, acc.role as Role)}
                  >
                    <span
                      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${ROLE_ICON_BG[acc.role as Role]}`}
                    >
                      {ROLE_LABELS[acc.role as Role][i18n.language === 'es' ? 'es' : 'en'].slice(0, 1)}
                    </span>
                    <span className="flex flex-col items-start">
                      <span className="text-sm font-medium">
                        {t('auth.continueAs', { role: t(`roles.${acc.role}`) })}
                      </span>
                      <span className="text-xs text-muted-foreground">{acc.email}</span>
                    </span>
                    {loading === acc.role && <Loader2 className="ml-auto h-4 w-4 animate-spin" />}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex flex-col gap-4 p-5">
              <div>
                <h2 className="text-sm font-semibold">{t('auth.orSignInManually')}</h2>
              </div>
              <form className="flex flex-1 flex-col gap-3" onSubmit={handleSubmit}>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="email">{t('auth.email')}</Label>
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@pharmacy.com"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="password">{t('auth.password')}</Label>
                  <Input
                    id="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                  />
                </div>
                <Button type="submit" className="mt-2" disabled={loading !== null}>
                  {loading === 'manual' ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> {t('auth.signingIn')}
                    </>
                  ) : (
                    t('auth.signIn')
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
