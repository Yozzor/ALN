import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Debug: Add error handling
console.log('🚀 About Last Night - Starting app with Supabase env vars...')

try {
  const rootElement = document.getElementById('root')
  if (!rootElement) {
    throw new Error('Root element not found')
  }

  console.log('✅ Root element found, mounting React app...')

  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  )

  console.log('✅ React app mounted successfully')
} catch (error) {
  console.error('❌ Failed to mount React app:', error)

  // Fallback: Show error message
  const rootElement = document.getElementById('root')
  const errorMessage = error instanceof Error ? error.message : String(error)

  if (rootElement) {
    rootElement.innerHTML = `
      <div style="
        min-height: 100vh;
        background: #1a1a1a;
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        font-family: system-ui, -apple-system, sans-serif;
        text-align: center;
        padding: 20px;
      ">
        <div>
          <h1 style="color: #ff6b6b; margin-bottom: 20px;">About Last Night</h1>
          <p style="margin-bottom: 10px;">App failed to load</p>
          <p style="font-size: 14px; opacity: 0.7;">Error: ${errorMessage}</p>
          <p style="font-size: 12px; margin-top: 20px;">Please refresh the page or contact support</p>
        </div>
      </div>
    `
  }
}
