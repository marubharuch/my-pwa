import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import { registerSW } from "virtual:pwa-register";

registerSW({ immediate: true }); // 👈 REQUIRED
console.log("Main.jsc")
const updateSW = registerSW({
  onNeedRefresh() {
    // New version available
    console.log("🔄 New version available, reloading...");
    updateSW(true); // forces update
  },
  onOfflineReady() {
    console.log("📦 App ready for offline use");
  },
});
// Render App
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
    <App />
    </AuthProvider>
  </StrictMode>,
)

// 🔥 Register PWA Service Worker (vite-plugin-pwa)


// auto-update when new version available
