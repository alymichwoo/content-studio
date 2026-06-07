import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from './hooks/useAuth'
import { queryClient } from './lib/queryClient'
import ProtectedRoute from './components/ProtectedRoute'
import Login from './pages/Login'
import Calendar from './pages/Calendar'
import Posts from './pages/Posts'
import Ideas from './pages/Ideas'
import Partnerships from './pages/Partnerships'
import Dashboard from './pages/Dashboard'
import Report from './pages/Report'
import Generate from './pages/Generate'
import Settings from './pages/Settings'

function ProtectedPage({ children }) {
  return <ProtectedRoute>{children}</ProtectedRoute>
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<Navigate to="/calendar" replace />} />
            <Route
              path="/calendar"
              element={
                <ProtectedPage>
                  <Calendar />
                </ProtectedPage>
              }
            />
            <Route
              path="/posts"
              element={
                <ProtectedPage>
                  <Posts />
                </ProtectedPage>
              }
            />
            <Route
              path="/ideas"
              element={
                <ProtectedPage>
                  <Ideas />
                </ProtectedPage>
              }
            />
            <Route
              path="/partnerships"
              element={
                <ProtectedPage>
                  <Partnerships />
                </ProtectedPage>
              }
            />
            <Route
              path="/dashboard"
              element={
                <ProtectedPage>
                  <Dashboard />
                </ProtectedPage>
              }
            />
            <Route
              path="/report"
              element={
                <ProtectedPage>
                  <Report />
                </ProtectedPage>
              }
            />
            <Route
              path="/generate"
              element={
                <ProtectedPage>
                  <Generate />
                </ProtectedPage>
              }
            />
            <Route
              path="/settings"
              element={
                <ProtectedPage>
                  <Settings />
                </ProtectedPage>
              }
            />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  )
}
