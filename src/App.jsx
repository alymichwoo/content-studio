import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from './hooks/useAuth'
import ProtectedRoute from './components/ProtectedRoute'
import Login from './pages/Login'
import Calendar from './pages/Calendar'
import Posts from './pages/Posts'
import Ideas from './pages/Ideas'
import Partnerships from './pages/Partnerships'
import Dashboard from './pages/Dashboard'
import Report from './pages/Report'

const queryClient = new QueryClient()

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
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  )
}
