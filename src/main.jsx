import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { supabaseConfigured } from './lib/supabase.js'

function MissingConfig() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#fafafa',
      fontFamily: '"Inter", sans-serif',
      padding: 24,
    }}>
      <div style={{
        background: '#1f514c',
        borderRadius: 24,
        padding: '40px 36px',
        maxWidth: 480,
        width: '100%',
        color: 'white',
      }}>
        <div style={{ fontSize: 32, marginBottom: 16 }}>⚙️</div>
        <h2 style={{ margin: '0 0 12px', fontFamily: '"Hedvig Letters Serif", Georgia, serif', fontWeight: 400, fontSize: 24, letterSpacing: '-0.02em' }}>
          Supabase not configured
        </h2>
        <p style={{ margin: '0 0 20px', color: 'rgba(255,255,255,0.75)', fontSize: 14, lineHeight: 1.6 }}>
          This Netlify deployment is missing the required environment variables.
          Add them in <strong style={{ color: 'white' }}>Netlify → Site settings → Environment variables</strong>, then trigger a new deploy.
        </p>
        <div style={{ background: 'rgba(0,0,0,0.25)', borderRadius: 12, padding: '16px 18px', fontFamily: 'monospace', fontSize: 13, lineHeight: 2 }}>
          <div><span style={{ color: '#4ade80' }}>VITE_SUPABASE_URL</span> = https://….supabase.co</div>
          <div><span style={{ color: '#4ade80' }}>VITE_SUPABASE_ANON_KEY</span> = eyJ…</div>
        </div>
      </div>
    </div>
  )
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {supabaseConfigured ? <App /> : <MissingConfig />}
  </StrictMode>,
)
