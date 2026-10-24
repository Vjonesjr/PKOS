import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import '@/index.css'
import { applyTheme } from '@/lib/theme'

// Apply the saved palette before React paints so the app never flashes a different theme.
applyTheme()

ReactDOM.createRoot(document.getElementById('root')).render(
  <App />
)
