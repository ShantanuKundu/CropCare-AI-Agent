import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import { warmUpBackend } from './api.js'

// Ping the Render backend immediately so it wakes up from sleep
// before the user makes their first API call.
warmUpBackend()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
