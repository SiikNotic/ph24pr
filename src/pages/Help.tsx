import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { HelpCircle, Search } from 'lucide-react'
import { PageHeader } from '@/components/shared/PageHeader'
import { EmptyState } from '@/components/shared/EmptyState'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { useHelpArticles } from '@/hooks/useHelp'

export default function Help() {
  const { t } = useTranslation()
  const [search, setSearch] = useState('')
  const { data: articles = [], isLoading } = useHelpArticles()

  const filtered = useMemo(
    () =>
      articles.filter(
        (a) =>
          a.title.toLowerCase().includes(search.toLowerCase()) || a.body.toLowerCase().includes(search.toLowerCase()),
      ),
    [articles, search],
  )

  const grouped = useMemo(() => {
    const map = new Map<string, typeof filtered>()
    for (const a of filtered) {
      const list = map.get(a.category) ?? []
      list.push(a)
      map.set(a.category, list)
    }
    return Array.from(map.entries())
  }, [filtered])

  return (
    <div>
      <PageHeader title={t('help.title')} subtitle={t('help.subtitle')} />

      <div className="relative mb-6 max-w-md">
        <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input className="pl-8" placeholder={t('help.searchPlaceholder')} value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      ) : grouped.length === 0 ? (
        <EmptyState icon={HelpCircle} title={t('help.noArticles')} />
      ) : (
        <div className="flex flex-col gap-6">
          {grouped.map(([category, items]) => (
            <div key={category}>
              <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">{category}</h3>
              <div className="flex flex-col gap-3">
                {items.map((a) => (
                  <Card key={a.id}>
                    <CardHeader>
                      <CardTitle className="text-base">{a.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm text-muted-foreground">{a.body}</CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
