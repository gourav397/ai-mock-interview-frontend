import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import "./index.css";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>
);

// PWA: Service worker SIRF production (deploy) mein
if ("serviceWorker" in navigator && import.meta.env.PROD) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js")
      .then(() => console.log("✅ Service Worker registered"))
      .catch((err) => console.log("SW register fail:", err));
  });
}

// Dev mein purana SW unregister — cache/HMR problems khatam
if ("serviceWorker" in navigator && import.meta.env.DEV) {
  navigator.serviceWorker.getRegistrations().then((regs) =>
    regs.forEach((r) => r.unregister())
  );
}

// ===== Install prompt =====
let deferredPrompt;

window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  deferredPrompt = e;
  console.log("📲 beforeinstallprompt fired — install READY");
  window.dispatchEvent(new CustomEvent("install-ready"));
});

window.addEventListener("appinstalled", () => {
  deferredPrompt = null;
  window.dispatchEvent(new CustomEvent("appinstalled"));
  console.log("✅ App installed!");
});

export function getInstallPrompt() {
  return deferredPrompt;
}

export async function installApp() {
  if (!deferredPrompt) {
    console.log("❌ No install prompt available");
    return { ok: false, reason: "no-prompt" };
  }
  try {
    deferredPrompt.prompt(); // user gesture ke andar direct call
    const { outcome } = await deferredPrompt.userChoice;
    console.log("Install outcome:", outcome);
    deferredPrompt = null;
    return { ok: outcome === "accepted", reason: outcome };
  } catch (err) {
    console.log("Install prompt error:", err);
    return { ok: false, reason: err.message };
  }
}