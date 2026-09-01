import { create } from 'zustand'

export type ThemeMode = 'light' | 'dark' | 'system'

function applyTheme(mode: ThemeMode) {
  const root = document.documentElement
  const resolved =
    mode === 'system'
      ? window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light'
      : mode
  root.classList.toggle('dark', resolved === 'dark')
}

interface UIState {
  theme: ThemeMode
  sidebarOpen: boolean
  setTheme: (mode: ThemeMode) => void
  toggleSidebar: () => void
  setSidebarOpen: (open: boolean) => void
}

const storedTheme = (localStorage.getItem('medroute-theme') as ThemeMode) || 'system'
applyTheme(storedTheme)

export const useUIStore = create<UIState>((set) => ({
  theme: storedTheme,
  sidebarOpen: false,
  setTheme: (mode) => {
    localStorage.setItem('medroute-theme', mode)
    applyTheme(mode)
    set({ theme: mode })
  },
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
}))
