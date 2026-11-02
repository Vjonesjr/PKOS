import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import '@/index.css'
import { initializeNativeAuth } from '@/lib/native'
initializeNativeAuth();

const savedTheme = localStorage.getItem('smart_pkos_theme');
document.documentElement.dataset.theme = ['neon', 'dark', 'oled', 'light-blue', 'red'].includes(savedTheme) ? savedTheme : 'neon';

ReactDOM.createRoot(document.getElementById('root')).render(
  <App />
)
