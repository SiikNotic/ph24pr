import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Navigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Truck, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useAuthStore } from '@/store/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { LanguageSwitcher } from '@/components/shared/LanguageSwitcher'
import { ThemeToggle } from '@/components/shared/ThemeToggle'

export default function Login() {
  const { t } = useTranslation()
  const session = useAuthStore((s) => s.session)
  const authLoading = useAuthStore((s) => s.loading)
  const signIn = useAuthStore((s) => s.signIn)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  // A successful signIn() only updates the auth store (via Supabase's
  // onAuthStateChange listener) -- nothing about that navigates away from
  // /login on its own, since this route sits outside <RequireAuth/>. Without
  // this, the form just sits there looking unresponsive after a correct
  // password: the request succeeds, the session is set, but the URL and the
  // screen never move.
  if (!authLoading && session) {
    return <Navigate to="/" replace />
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      await signIn(email, password)
    } catch {
      toast.error(t('auth.invalidCredentials'))
    } finally {
      setLoading(false)
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

      <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col items-center justify-center gap-8 px-4 pb-16 pt-4 lg:flex-row lg:items-center lg:gap-16">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: [0.19, 1, 0.22, 1] }}
          className="flex max-w-sm flex-col justify-center gap-3 text-center lg:text-left"
        >
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">{t('auth.welcomeBack')}</h1>
          <p className="text-sm text-muted-foreground sm:text-base">{t('auth.signInPrompt')}</p>
          <p className="mt-2 hidden text-xs text-muted-foreground lg:block">{t('auth.poweredBy')}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.08, ease: [0.19, 1, 0.22, 1] }}
          className="w-full max-w-sm"
        >
          <Card>
            <CardContent className="flex flex-col gap-4 p-6">
              <form className="flex flex-col gap-3" onSubmit={handleSubmit}>
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
                <Button type="submit" className="mt-2" disabled={loading}>
                  {loading ? (
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
        </motion.div>
      </div>
    </div>
  )
}
