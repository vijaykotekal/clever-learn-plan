import { createRoot } from 'react-dom/client'
import React from 'react'

const rootEl = document.getElementById('root')!

function EnvError() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
      fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif'
    }}>
      <div style={{ maxWidth: 720 }}>
        <h1 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Backend not initialized</h1>
        <p style={{ marginBottom: '0.75rem' }}>
          Missing VITE_SUPABASE_URL or VITE_SUPABASE_PUBLISHABLE_KEY. This prevents the app from starting.
        </p>
        <p style={{ marginBottom: '0.75rem' }}>
          Please refresh the preview. If it persists, open the backend panel and ensure the environment is ready.
        </p>
        <pre style={{
          padding: '0.75rem',
          background: '#0b1020',
          color: '#d2d7ff',
          borderRadius: 8,
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word'
        }}>
{`VITE_SUPABASE_URL: ${String((import.meta as any).env?.VITE_SUPABASE_URL) || 'undefined'}
VITE_SUPABASE_PUBLISHABLE_KEY: ${((import.meta as any).env?.VITE_SUPABASE_PUBLISHABLE_KEY ? 'present' : 'undefined')}`}
        </pre>
      </div>
    </div>
  )
}

async function bootstrap() {
  const url = (import.meta as any).env?.VITE_SUPABASE_URL
  const key = (import.meta as any).env?.VITE_SUPABASE_PUBLISHABLE_KEY

  // Log once for debugging
  console.info('Env check => URL defined:', Boolean(url), 'Key defined:', Boolean(key))

  if (!url || !key) {
    createRoot(rootEl).render(React.createElement(EnvError))
    return
  }

  const App = (await import('./App.tsx')).default
  await import('./index.css')
  createRoot(rootEl).render(React.createElement(App))
}

bootstrap()
