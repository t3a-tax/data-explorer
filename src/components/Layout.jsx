import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

const NAV_LINKS = [
  { to: '/', label: 'Dashboard' },
  { to: '/explorer', label: 'Firm Explorer' },
  { to: '/map', label: 'Map View' },
  { to: '/raw-data', label: 'Raw Data' },
  { to: '/completeness', label: 'Data Completeness' },
]

export default function Layout({ children }) {
  const { user, signOut } = useAuth()
  const location = useLocation()

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#fafafa' }}>
      {/* Header */}
      <header style={{ background: '#1f514c' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>
          <div className="flex items-center justify-between" style={{ height: 64 }}>
            {/* Logo */}
            <Link to="/" className="flex items-center gap-3 no-underline">
              <div
                className="flex items-center justify-center text-white font-bold text-sm"
                style={{
                  width: 36,
                  height: 36,
                  background: 'rgba(255,255,255,0.15)',
                  borderRadius: 10,
                  fontFamily: '"Hedvig Letters Serif", Georgia, serif',
                  fontSize: 15,
                }}
              >
                T3A
              </div>
              <span
                className="text-white font-semibold"
                style={{ fontFamily: '"Inter", sans-serif', fontSize: 16, letterSpacing: '-0.03em' }}
              >
                Data Explorer
              </span>
            </Link>

            {/* Nav */}
            <nav className="hidden md:flex items-center gap-6">
              {NAV_LINKS.map(({ to, label }) => {
                const active = location.pathname === to || (to !== '/' && location.pathname.startsWith(to))
                return (
                  <Link
                    key={to}
                    to={to}
                    style={{
                      color: active ? '#ffffff' : 'rgba(255,255,255,0.7)',
                      textDecoration: 'none',
                      fontSize: 14,
                      fontWeight: active ? 600 : 400,
                      letterSpacing: '-0.02em',
                      paddingBottom: active ? 2 : 0,
                      borderBottom: active ? '2px solid rgba(255,255,255,0.8)' : 'none',
                      transition: 'color 0.2s',
                    }}
                  >
                    {label}
                  </Link>
                )
              })}
            </nav>

            {/* User */}
            <div className="flex items-center gap-4">
              <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13 }}>
                {user?.email}
              </span>
              <button
                onClick={signOut}
                style={{
                  background: 'rgba(255,255,255,0.1)',
                  color: 'white',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: 8,
                  padding: '6px 16px',
                  fontSize: 13,
                  cursor: 'pointer',
                  fontFamily: '"Inter", sans-serif',
                  transition: 'background 0.2s',
                }}
                onMouseEnter={e => { e.target.style.background = 'rgba(255,255,255,0.2)' }}
                onMouseLeave={e => { e.target.style.background = 'rgba(255,255,255,0.1)' }}
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1" style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 24px', width: '100%' }}>
        {children}
      </main>

      {/* Footer */}
      <footer style={{ background: '#1f514c', padding: '20px 24px', marginTop: 'auto' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13 }}>
            © 2025 T3A Tax. All rights reserved.
          </span>
          <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13 }}>
            Acquisition Intelligence Platform
          </span>
        </div>
      </footer>
    </div>
  )
}
