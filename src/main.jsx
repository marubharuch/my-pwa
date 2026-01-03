import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";
import { registerSW } from "virtual:pwa-register";

/* ================= PWA SERVICE WORKER ================= */
const updateSW = registerSW({
  immediate: true, // register immediately
  onNeedRefresh() {
    console.log("🔄 New version available, reloading...");
    updateSW(true); // force update
  },
  onOfflineReady() {
    console.log("📦 App ready for offline use");
  },
});

console.log("Main.jsx loaded");

/* ================= RENDER APP ================= */
createRoot(document.getElementById("root")).render(
  <StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </StrictMode>
);
