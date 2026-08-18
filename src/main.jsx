import { StrictMode, useEffect } from "react";
import { createRoot } from "react-dom/client";
import { useLocation } from "react-router-dom";
import App from "./App.jsx";
import "./index.css";

// ===== 🔥 SEO: Har page ka apna Title + Description =====
export function PageMeta() {
  const location = useLocation();

  // exact match pages
  const pages = {
    "/": {
      title: "AI Mock Interview — Free SSC, UPSC, Railway & CBSE Practice Tests",
      desc: "Free AI mock interview aur practice test — SSC, UPSC, Railway, Banking, Haryana GK, Class 11/12 CBSE. Hindi + English. 100% Free."
    },
    "/login": {
      title: "Login — AI Mock Interview",
      desc: "Login karo aur AI mock interview, practice tests aur results dekho."
    },
    "/register": {
      title: "Register — AI Mock Interview",
      desc: "Free account banao — SSC, UPSC, Railway, Class 11/12 CBSE practice tests ke liye."
    },
    "/dashboard": {
      title: "Dashboard — AI Mock Interview",
      desc: "Apne practice tests, scores aur progress dekho."
    },
    "/profile": {
      title: "Profile — AI Mock Interview",
      desc: "Apni profile aur resume manage karo."
    },
    "/upload-resume": {
      title: "Upload Resume — AI Mock Interview",
      desc: "Apna resume upload karo aur AI se interview practice karo."
    },
    "/category": {
      title: "Categories — AI Mock Interview",
      desc: "SSC, UPSC, Railway, Banking, Haryana GK aur bhi saari categories ke practice tests."
    },
    "/interview": {
      title: "Start AI Mock Interview — SSC, UPSC, Railway Practice",
      desc: "50 questions ka AI mock interview — Haryana GK, Reasoning, Current Affairs, Computer, Cyber Security aur bhi bahut kuch."
    },
    "/class-exam": {
      title: "Class 11/12 CBSE Practice — Science, Commerce, Humanities",
      desc: "CBSE Class 11 aur 12 ke liye practice tests — Physics, Chemistry, Biology, Maths, Accountancy, Economics, History, Geography."
    },
    "/exam": {
      title: "Exam — AI Mock Interview",
      desc: "Apna mock exam start karo — 50 questions, detailed review."
    },
    "/result": {
      title: "Result — AI Mock Interview",
      desc: "Apna test result dekho — score, percentage aur performance."
    },
    "/admin": {
      title: "Admin Panel — AI Mock Interview",
      desc: "Admin panel — questions, categories aur bulk upload manage karo."
    },
    "/admin/questions": {
      title: "Manage Questions — AI Mock Interview",
      desc: "Admin — questions add, edit, delete karo."
    },
    "/admin/bulk-upload": {
      title: "Bulk Upload Questions — AI Mock Interview",
      desc: "Admin — ek saath bahut saare questions upload karo."
    }
  };

  useEffect(() => {
    let meta;

    // dynamic route: /test/:category
    if (location.pathname.startsWith("/test/")) {
      const cat = decodeURIComponent(location.pathname.replace("/test/", "")) || "Practice";
      meta = {
        title: `${cat} Practice Test — AI Mock Interview`,
        desc: `${cat} ke free practice questions — AI Mock Interview par test do aur review dekho.`
      };
    } else {
      meta = pages[location.pathname] || {
        title: "AI Mock Interview",
        desc: "Free AI mock interview practice tests — SSC, UPSC, Railway, Class 11/12 CBSE."
      };
    }

    document.title = meta.title;

    // meta description update (agar pehle se hai to replace, warna banao)
    let descTag = document.querySelector('meta[name="description"]');
    if (!descTag) {
      descTag = document.createElement("meta");
      descTag.setAttribute("name", "description");
      document.head.appendChild(descTag);
    }
    descTag.setAttribute("content", meta.desc);
  }, [location.pathname]);

  return null;
}

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