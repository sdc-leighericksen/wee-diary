import { useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import useAuthStore from './stores/authStore'
import { pingAppwrite } from './lib/appwrite'
import AppShell from './components/layout/AppShell'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import LogEntryPage from './pages/LogEntryPage'
import HistoryPage from './pages/HistoryPage'
import InsightsPage from './pages/InsightsPage'
import ExportPage from './pages/ExportPage'
import RemindersPage from './pages/RemindersPage'
import SettingsPage from './pages/SettingsPage'

const DEMO_MODE = import.meta.env.VITE_DEMO === 'true'

function ProtectedRoute({ children }) {
  const user = useAuthStore(s => s.user)
  const loading = useAuthStore(s => s.loading)
  if (DEMO_MODE) return children
  if (loading) return <LoadingScreen />
  if (!user) return <Navigate to="/login" replace />
  return children
}

function LoadingScreen() {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      minHeight: '100dvh', background: 'var(--color-bg)'
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '2rem', marginBottom: 8 }}>💧</div>
        <div style={{ color: 'var(--color-text-secondary)' }}>Loading...</div>
      </div>
    </div>
  )
}

export default function App() {
  const init = useAuthStore(s => s.init)
  const user = useAuthStore(s => s.user)
  const loading = useAuthStore(s => s.loading)

  useEffect(() => {
    if (!DEMO_MODE) {
      pingAppwrite()
      init()
    }
  }, [init])

  if (!DEMO_MODE && loading) return <LoadingScreen />

  return (
    <Routes>
      <Route path="/login" element={(user && !DEMO_MODE) ? <Navigate to="/" replace /> : <LoginPage />} />
      <Route element={<ProtectedRoute><AppShell /></ProtectedRoute>}>
        <Route index element={<DashboardPage />} />
        <Route path="log" element={<LogEntryPage />} />
        <Route path="log/:id" element={<LogEntryPage />} />
        <Route path="history" element={<HistoryPage />} />
        <Route path="insights" element={<InsightsPage />} />
        <Route path="export" element={<ExportPage />} />
        <Route path="reminders" element={<RemindersPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
