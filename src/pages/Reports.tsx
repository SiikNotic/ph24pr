import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Download } from 'lucide-react'
import { PageHeader } from '@/components/shared/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useRoutes } from '@/hooks/useRoutes'
import { useReturns } from '@/hooks/useReturns'
import { useDrivers } from '@/hooks/useDrivers'
import { formatDate } from '@/lib/format'

const CHART_COLORS = ['var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)', 'var(--chart-4)', 'var(--chart-5)']

export default function Reports() {
  const { t, i18n } = useTranslation()
  const [period, setPeriod] = useState('7')

  const { data: routes = [] } = useRoutes()
  const { data: returns = [] } = useReturns()
  const { data: drivers = [] } = useDrivers()

  const byDate = useMemo(() => {
    const map = new Map<string, { date: string; delivered: number; failed: number; total: number }>()
    for (const r of routes) {
      for (const s of r.stops) {
        const entry = map.get(r.date) ?? { date: r.date, delivered: 0, failed: 0, total: 0 }
        entry.total += 1
        if (s.status === 'delivered') entry.delivered += 1
        if (s.status === 'failed' || s.status === 'pending_return' || s.status === 'returned') entry.failed += 1
        map.set(r.date, entry)
      }
    }
    return Array.from(map.values())
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((d) => ({ ...d, label: formatDate(d.date, i18n.language, 'MMM d'), onTime: d.total ? Math.round((d.delivered / d.total) * 100) : 0 }))
  }, [routes, i18n.language])

  const returnsByReason = useMemo(() => {
    const map = new Map<string, number>()
    for (const r of returns) map.set(r.reason, (map.get(r.reason) ?? 0) + 1)
    return Array.from(map.entries()).map(([reason, count]) => ({ name: t(`returns.reasons.${reason}`), value: count }))
  }, [returns, t])

  const driverPerf = useMemo(() => {
    return drivers
      .map((d) => {
        const stops = routes.filter((r) => r.driverId === d.id).flatMap((r) => r.stops)
        return {
          name: d.fullName,
          delivered: stops.filter((s) => s.status === 'delivered').length,
          failed: stops.filter((s) => s.status === 'failed' || s.status === 'pending_return' || s.status === 'returned').length,
        }
      })
      .filter((d) => d.delivered + d.failed > 0)
  }, [drivers, routes])

  function exportCsv() {
    const rows = [['date', 'delivered', 'failed', 'total'], ...byDate.map((d) => [d.date, d.delivered, d.failed, d.total])]
    const csv = rows.map((r) => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'medroute-report.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div>
      <PageHeader
        title={t('reports.title')}
        subtitle={t('reports.subtitle')}
        actions={
          <div className="flex items-center gap-2">
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">{t('reports.last7Days')}</SelectItem>
                <SelectItem value="30">{t('reports.last30Days')}</SelectItem>
                <SelectItem value="90">{t('reports.last90Days')}</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={exportCsv}>
              <Download className="h-4 w-4" /> {t('reports.exportCsv')}
            </Button>
          </div>
        }
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t('reports.deliveryVolume')}</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byDate}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="label" tick={{ fontSize: 12 }} stroke="var(--muted-foreground)" />
                <YAxis tick={{ fontSize: 12 }} stroke="var(--muted-foreground)" allowDecimals={false} />
                <Tooltip contentStyle={{ background: 'var(--popover)', border: '1px solid var(--border)', borderRadius: 8 }} />
                <Legend />
                <Bar dataKey="delivered" name={t('common.delivered')} fill="var(--chart-1)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="failed" name={t('status.failed')} fill="var(--chart-5)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t('reports.onTimePerformance')}</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={byDate}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="label" tick={{ fontSize: 12 }} stroke="var(--muted-foreground)" />
                <YAxis tick={{ fontSize: 12 }} stroke="var(--muted-foreground)" unit="%" />
                <Tooltip contentStyle={{ background: 'var(--popover)', border: '1px solid var(--border)', borderRadius: 8 }} />
                <Line type="monotone" dataKey="onTime" name="%" stroke="var(--chart-2)" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t('reports.returnsByReason')}</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            {returnsByReason.length === 0 ? (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">{t('returns.noReturns')}</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={returnsByReason} dataKey="value" nameKey="name" innerRadius={50} outerRadius={90} paddingAngle={2}>
                    {returnsByReason.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Legend />
                  <Tooltip contentStyle={{ background: 'var(--popover)', border: '1px solid var(--border)', borderRadius: 8 }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t('reports.driverPerformance')}</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('common.name')}</TableHead>
                  <TableHead>{t('common.delivered')}</TableHead>
                  <TableHead>{t('status.failed')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {driverPerf.map((d) => (
                  <TableRow key={d.name}>
                    <TableCell className="font-medium">{d.name}</TableCell>
                    <TableCell>{d.delivered}</TableCell>
                    <TableCell>{d.failed}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
