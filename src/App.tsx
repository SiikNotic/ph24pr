import { useEffect } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { TooltipProvider } from '@/components/ui/tooltip'
import { Toaster } from '@/components/ui/sonner'
import { useAuthStore } from '@/store/auth'
import { RequireAuth, RequireSection } from '@/routes/guards'
import { AppShell } from '@/components/layout/AppShell'

import Login from '@/pages/Login'
import Dashboard from '@/pages/Dashboard'
import RoutesPage from '@/pages/Routes'
import RouteBuilder from '@/pages/RouteBuilder'
import DeliveryFlow from '@/pages/DeliveryFlow'
import Customers from '@/pages/Customers'
import Drivers from '@/pages/Drivers'
import Returns from '@/pages/Returns'
import Availability from '@/pages/Availability'
import Notifications from '@/pages/Notifications'
import Reports from '@/pages/Reports'
import Settings from '@/pages/Settings'
import Help from '@/pages/Help'
import NotFound from '@/pages/NotFound'

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 15_000, retry: 1 } },
})

export default function App() {
  const init = useAuthStore((s) => s.init)

  useEffect(() => {
    const unsubscribe = init()
    return unsubscribe
  }, [init])

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider delayDuration={200}>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />

            <Route element={<RequireAuth />}>
              <Route element={<AppShell />}>
                <Route
                  index
                  element={
                    <RequireSection section="dashboard">
                      <Dashboard />
                    </RequireSection>
                  }
                />
                <Route
                  path="routes"
                  element={
                    <RequireSection section="routes">
                      <RoutesPage />
                    </RequireSection>
                  }
                />
                <Route
                  path="routes/:routeId/build"
                  element={
                    <RequireSection section="routes">
                      <RouteBuilder />
                    </RequireSection>
                  }
                />
                <Route
                  path="routes/:routeId/deliver/:stopId"
                  element={
                    <RequireSection section="routes">
                      <DeliveryFlow />
                    </RequireSection>
                  }
                />
                <Route
                  path="customers"
                  element={
                    <RequireSection section="customers">
                      <Customers />
                    </RequireSection>
                  }
                />
                <Route
                  path="drivers"
                  element={
                    <RequireSection section="drivers">
                      <Drivers />
                    </RequireSection>
                  }
                />
                <Route
                  path="returns"
                  element={
                    <RequireSection section="returns">
                      <Returns />
                    </RequireSection>
                  }
                />
                <Route
                  path="availability"
                  element={
                    <RequireSection section="availability">
                      <Availability />
                    </RequireSection>
                  }
                />
                <Route
                  path="notifications"
                  element={
                    <RequireSection section="notifications">
                      <Notifications />
                    </RequireSection>
                  }
                />
                <Route
                  path="reports"
                  element={
                    <RequireSection section="reports">
                      <Reports />
                    </RequireSection>
                  }
                />
                <Route
                  path="settings"
                  element={
                    <RequireSection section="settings">
                      <Settings />
                    </RequireSection>
                  }
                />
                <Route
                  path="help"
                  element={
                    <RequireSection section="help">
                      <Help />
                    </RequireSection>
                  }
                />
              </Route>
            </Route>

            <Route path="/404" element={<NotFound />} />
            <Route path="*" element={<Navigate to="/404" replace />} />
          </Routes>
        </BrowserRouter>
        <Toaster richColors closeButton />
      </TooltipProvider>
    </QueryClientProvider>
  )
}
