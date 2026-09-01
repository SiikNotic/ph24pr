import {
  LayoutDashboard,
  Route as RouteIcon,
  Users,
  Truck,
  RotateCcw,
  CalendarDays,
  Bell,
  BarChart3,
  Settings,
  HelpCircle,
} from 'lucide-react'
import type { Section } from '@/lib/permissions'

export interface NavItem {
  section: Section
  path: string
  icon: typeof LayoutDashboard
  labelKey: string
}

export const NAV_ITEMS: NavItem[] = [
  { section: 'dashboard', path: '/', icon: LayoutDashboard, labelKey: 'nav.dashboard' },
  { section: 'routes', path: '/routes', icon: RouteIcon, labelKey: 'nav.routes' },
  { section: 'customers', path: '/customers', icon: Users, labelKey: 'nav.customers' },
  { section: 'drivers', path: '/drivers', icon: Truck, labelKey: 'nav.drivers' },
  { section: 'returns', path: '/returns', icon: RotateCcw, labelKey: 'nav.returns' },
  { section: 'availability', path: '/availability', icon: CalendarDays, labelKey: 'nav.availability' },
  { section: 'notifications', path: '/notifications', icon: Bell, labelKey: 'nav.notifications' },
  { section: 'reports', path: '/reports', icon: BarChart3, labelKey: 'nav.reports' },
  { section: 'settings', path: '/settings', icon: Settings, labelKey: 'nav.settings' },
  { section: 'help', path: '/help', icon: HelpCircle, labelKey: 'nav.help' },
]
