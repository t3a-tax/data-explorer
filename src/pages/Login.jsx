import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'

export default function Login() {
  const { signIn } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { error: err } = await signIn(email, password)
    if (err) setError(err.message)
    setLoading(false)
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#fafafa',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
      }}
    >
      {/* Hero card */}
      <div
        style={{
          background: '#1f514c',
          borderRadius: 38,
          padding: '48px 40px',
          width: '100%',
          maxWidth: 440,
          boxShadow: '0 4px 32px rgba(0,0,0,0.12)',
        }}
      >
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 56,
              height: 56,
              background: 'rgba(255,255,255,0.15)',
              borderRadius: 16,
              marginBottom: 16,
              fontFamily: '"Hedvig Letters Serif", Georgia, serif',
              fontSize: 20,
              fontWeight: 700,
              color: 'white',
            }}
          >
            T3A
          </div>
          <h1
            style={{
              fontFamily: '"Hedvig Letters Serif", Georgia, serif',
              fontSize: 28,
              fontWeight: 400,
              color: 'white',
              margin: 0,
              letterSpacing: '-0.03em',
            }}
          >
            Data Explorer
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: 14, marginTop: 8, marginBottom: 0 }}>
            Accounting Firm Acquisition Intelligence
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ display: 'block', color: 'rgba(255,255,255,0.8)', fontSize: 13, marginBottom: 6, fontWeight: 500 }}>
              Email address
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              placeholder="you@t3a.tax"
              style={{
                width: '100%',
                height: 52,
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.15)',
                borderRadius: 12,
                padding: '0 16px',
                color: 'white',
                fontSize: 15,
                fontFamily: '"Inter", sans-serif',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', color: 'rgba(255,255,255,0.8)', fontSize: 13, marginBottom: 6, fontWeight: 500 }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              style={{
                width: '100%',
                height: 52,
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.15)',
                borderRadius: 12,
                padding: '0 16px',
                color: 'white',
                fontSize: 15,
                fontFamily: '"Inter", sans-serif',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {error && (
            <div
              style={{
                background: 'rgba(220,38,38,0.15)',
                border: '1px solid rgba(220,38,38,0.3)',
                borderRadius: 10,
                padding: '10px 14px',
                color: '#fca5a5',
                fontSize: 13,
              }}
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              height: 52,
              background: loading ? 'rgba(255,255,255,0.2)' : 'white',
              color: loading ? 'rgba(255,255,255,0.5)' : '#1f514c',
              border: 'none',
              borderRadius: 16,
              fontSize: 15,
              fontWeight: 600,
              fontFamily: '"Inter", sans-serif',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
              marginTop: 8,
            }}
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>

      <p style={{ marginTop: 24, color: '#636363', fontSize: 13 }}>
        Access is restricted to authorized T3A team members.
      </p>
    </div>
  )
}
