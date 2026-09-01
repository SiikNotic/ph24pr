import { format, formatDistanceToNow, parseISO } from 'date-fns'
import { enUS, es } from 'date-fns/locale'

function localeFor(lang: string) {
  return lang.startsWith('es') ? es : enUS
}

export function formatRelativeTime(iso: string, lang: string) {
  try {
    return formatDistanceToNow(parseISO(iso), { addSuffix: true, locale: localeFor(lang) })
  } catch {
    return iso
  }
}

export function formatDate(iso: string, lang: string, pattern = 'MMM d, yyyy') {
  try {
    return format(parseISO(iso), pattern, { locale: localeFor(lang) })
  } catch {
    return iso
  }
}

export function formatTime(iso: string, lang: string) {
  try {
    return format(parseISO(iso), 'p', { locale: localeFor(lang) })
  } catch {
    return iso
  }
}

export function formatDateTime(iso: string, lang: string) {
  try {
    return format(parseISO(iso), 'MMM d, p', { locale: localeFor(lang) })
  } catch {
    return iso
  }
}

export function todayISODate() {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export function initials(name: string) {
  return name
    .split(' ')
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase()
}
