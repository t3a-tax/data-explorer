import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Explorer from './pages/Explorer'
import MapView from './pages/MapView'
import DataCompleteness from './pages/DataCompleteness'
import RawData from './pages/RawData'

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#fafafa',
      }}>
        <div style={{ color: '#1f514c', fontSize: 16, fontFamily: '"Inter", sans-serif' }}>
          Loading…
        </div>
      </div>
    )
  }

  if (!user) return <Navigate to="/login" replace />
  return children
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout>
                <Dashboard />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/explorer"
          element={
            <ProtectedRoute>
              <Layout>
                <Explorer />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/map"
          element={
            <ProtectedRoute>
              <Layout>
                <MapView />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/completeness"
          element={
            <ProtectedRoute>
              <Layout>
                <DataCompleteness />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/raw-data"
          element={
            <ProtectedRoute>
              <Layout>
                <RawData />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
