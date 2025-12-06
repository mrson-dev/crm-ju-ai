import { lazy, Suspense } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client'
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister'
import { AuthProvider } from './contexts/AuthContext'
import { ErrorBoundary, ToastProvider, LoadingSpinner } from './components/common'
import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import PrivateRoute from './components/PrivateRoute'
import PortalPrivateRoute from './components/PortalPrivateRoute'

// Lazy loading de páginas menos críticas
const Clients = lazy(() => import('./pages/Clients'))
const ClientDetail = lazy(() => import('./pages/ClientDetail'))
const ClientForm = lazy(() => import('./pages/ClientForm'))
const Cases = lazy(() => import('./pages/Cases'))
const CaseDetail = lazy(() => import('./pages/CaseDetail'))
const Templates = lazy(() => import('./pages/Templates'))
const Calendar = lazy(() => import('./pages/Calendar'))
const Tasks = lazy(() => import('./pages/Tasks'))
const Timesheet = lazy(() => import('./pages/Timesheet'))
const Documents = lazy(() => import('./pages/Documents'))
const Financial = lazy(() => import('./pages/Financial'))
const Settings = lazy(() => import('./pages/Settings'))
const Help = lazy(() => import('./pages/Help'))

// Portal do Cliente - Lazy loading
const PortalLayout = lazy(() => import('./pages/portal/PortalLayout'))
const PortalLogin = lazy(() => import('./pages/portal/PortalLogin'))
const PortalDashboard = lazy(() => import('./pages/portal/PortalDashboard'))
const PortalCases = lazy(() => import('./pages/portal/PortalCases'))
const PortalCaseDetail = lazy(() => import('./pages/portal/PortalCaseDetail'))
const PortalMessages = lazy(() => import('./pages/portal/PortalMessages'))
const PortalProfile = lazy(() => import('./pages/portal/PortalProfile'))

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: (failureCount, error) => {
        // Não retry em erros de autenticação ou validação
        if (error?.code === 'AUTH_EXPIRED' || error?.code === 'FORBIDDEN' || error?.code === 'VALIDATION_ERROR') {
          return false;
        }
        // Retry até 3x para erros de rede
        return failureCount < 3;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      staleTime: 5 * 60 * 1000, // 5 minutos
      gcTime: 10 * 60 * 1000, // 10 minutos (renomeado de cacheTime)
    },
    mutations: {
      retry: 0,
    },
  },
})

const persister = createSyncStoragePersister({
  storage: window.localStorage,
  key: 'crm-juridico-cache',
})

// Loading fallback component
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen">
    <LoadingSpinner size="lg" />
  </div>
)

function App() {
  return (
    <ErrorBoundary>
      <PersistQueryClientProvider
        client={queryClient}
        persistOptions={{
          persister,
          maxAge: 1000 * 60 * 60 * 24,
          dehydrateOptions: {
            shouldDehydrateQuery: (query) => {
              return query.state.status === 'success'
            },
          },
        }}
      >
        <ToastProvider>
          <AuthProvider>
            <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
              <Suspense fallback={<PageLoader />}>
                <Routes>
                {/* Login Advogado */}
                <Route path="/login" element={<Login />} />
                
                {/* Área do Advogado (protegida) */}
                <Route
                  path="/"
                  element={
                    <PrivateRoute>
                      <Layout />
                    </PrivateRoute>
                  }
                >
                  <Route index element={<Dashboard />} />
                  <Route path="clients" element={<Clients />} />
                  <Route path="clients/new" element={<ClientForm />} />
                  <Route path="clients/:id" element={<ClientDetail />} />
                  <Route path="clients/:id/edit" element={<ClientForm />} />
                  <Route path="cases" element={<Cases />} />
                  <Route path="cases/:id" element={<CaseDetail />} />
                  <Route path="templates" element={<Templates />} />
                  <Route path="calendar" element={<Calendar />} />
                  <Route path="tasks" element={<Tasks />} />
                  <Route path="timesheet" element={<Timesheet />} />
                  <Route path="documents" element={<Documents />} />
                  <Route path="financial" element={<Financial />} />
                  <Route path="settings" element={<Settings />} />
                  <Route path="help" element={<Help />} />
                </Route>

                {/* Portal do Cliente */}
                <Route path="/portal/login" element={<PortalLogin />} />
                <Route
                  path="/portal"
                  element={
                    <PortalPrivateRoute>
                      <PortalLayout />
                    </PortalPrivateRoute>
                  }
                >
                  <Route index element={<PortalDashboard />} />
                  <Route path="cases" element={<PortalCases />} />
                  <Route path="cases/:id" element={<PortalCaseDetail />} />
                  <Route path="messages" element={<PortalMessages />} />
                  <Route path="profile" element={<PortalProfile />} />
                </Route>
                </Routes>
              </Suspense>
            </Router>
          </AuthProvider>
        </ToastProvider>
      </PersistQueryClientProvider>
    </ErrorBoundary>
  )
}

export default App
