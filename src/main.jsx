import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
console.log("Main.jsc")
// Render App
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
    <App />
    </AuthProvider>
  </StrictMode>,
)

// 🔥 Register PWA Service Worker (vite-plugin-pwa)
import { registerSW } from 'virtual:pwa-register'

// auto-update when new version available
registerSW({
  onNeedRefresh() {
    console.log("New version available — refresh required!");
  },
  onOfflineReady() {
    console.log("App ready to work offline!");
  }
})
