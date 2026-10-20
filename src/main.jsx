
import { StrictMode, useEffect } from "react";
import { createRoot } from "react-dom/client";
import { useLocation } from "react-router-dom";
import App from "./App.jsx";
import "./index.css";

// ===== SEO: Har page ka apna Title + Description =====
export function PageMeta() {
  const location = useLocation();

  const pages = {
    "/": {
      title: "AI Interview — Free SSC, UPSC, Railway & CBSE Practice Tests",
      desc: "Free AI interview practice aur tests — SSC, UPSC, Railway, Banking, Haryana GK, Class 11/12 CBSE. Hindi + English."
    },
    "/login": {
      title: "Login — AI Interview",
      desc: "Login karo aur AI interview, practice tests aur results dekho."
    },
    "/register": {
      title: "Register — AI Interview",
      desc: "Free account banao aur practice tests aur AI interview practice shuru karo."
    },
    "/dashboard": {
      title: "Dashboard — AI Interview",
      desc: "Apne practice tests, scores aur progress dekho."
    },
    "/profile": {
      title: "Profile — AI Interview",
      desc: "Apni profile aur resume manage karo."
    },
    "/upload-resume": {
      title: "Upload Resume — AI Interview",
      desc: "Apna resume upload karo aur AI ke saath interview practice karo."
    },
    "/category": {
      title: "Categories — AI Interview",
      desc: "SSC, UPSC, Railway, Banking, Haryana GK aur anya categories ke practice tests."
    },
    "/interview": {
      title: "Start AI Interview — AI Interview",
      desc: "Haryana GK, Reasoning, Current Affairs, Computer, Cyber Security aur anya subjects ki interview practice."
    },
    "/class-exam": {
      title: "Class 11/12 CBSE Practice — AI Interview",
      desc: "CBSE Class 11 aur 12 ke liye Science, Commerce aur Humanities practice tests."
    },
    "/exam": {
      title: "Exam — AI Interview",
      desc: "Apna practice exam shuru karo aur detailed review dekho."
    },
    "/result": {
      title: "Result — AI Interview",
      desc: "Apna test result, score, percentage aur performance dekho."
    },
    "/admin": {
      title: "Admin Panel — AI Interview",
      desc: "Questions, categories aur bulk uploads manage karo."
    },
    "/admin/questions": {
      title: "Manage Questions — AI Interview",
      desc: "Admin panel mein questions add aur edit karo."
    },
    "/admin/bulk-upload": {
      title: "Bulk Upload Questions — AI Interview",
      desc: "Admin panel mein ek saath kai questions upload karo."
    }
  };

  useEffect(() => {
    let meta;

    if (location.pathname.startsWith("/test/")) {
      let category = "Practice";

      try {
        category =
          decodeURIComponent(
            location.pathname.replace("/test/", "")
          ) || "Practice";
      } catch {
        category = "Practice";
      }

      meta = {
        title: `${category} Practice Test — AI Interview`,
        desc: `${category} ke practice questions solve karo aur apna result dekho.`
      };
    } else {
      meta = pages[location.pathname] || {
        title: "AI Interview — Practice Tests and Interview Preparation",
        desc: "AI-powered interview practice aur SSC, UPSC, Railway, Haryana GK aur Class 11/12 ke practice tests."
      };
    }

    document.title = meta.title;

    let descTag = document.querySelector(
      'meta[name="description"]'
    );

    if (!descTag) {
      descTag = document.createElement("meta");
      descTag.setAttribute("name", "description");
      document.head.appendChild(descTag);
    }

    descTag.setAttribute("content", meta.desc);
  }, [location.pathname]);

  return null;
}

// ===== React application =====
createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>
);

// ===== Development: purana Service Worker unregister =====
if (
  "serviceWorker" in navigator &&
  import.meta.env.DEV
) {
  navigator.serviceWorker
    .getRegistrations()
    .then((registrations) =>
      Promise.all(
        registrations.map((registration) =>
          registration.unregister()
        )
      )
    )
    .catch((error) => {
      console.error(
        "Development Service Worker cleanup failed:",
        error
      );
    });
}

// ===== AI Interview PWA Install Support =====
let deferredPrompt = null;

const isAppInstalled = () =>
  window.matchMedia("(display-mode: standalone)").matches ||
  window.navigator.standalone === true;

// Browser install prompt available hone par save karo.
window.addEventListener("beforeinstallprompt", (event) => {
  event.preventDefault();
  deferredPrompt = event;

  console.log("AI Interview: Install prompt ready");
  window.dispatchEvent(new CustomEvent("install-ready"));
});

// Successful installation ke baad prompt clear karo.
window.addEventListener("appinstalled", () => {
  deferredPrompt = null;

  window.dispatchEvent(new CustomEvent("appinstalled"));
  console.log("AI Interview installed successfully");
});

export function getInstallPrompt() {
  return deferredPrompt;
}

export async function installApp() {
  if (isAppInstalled()) {
    return {
      ok: true,
      reason: "already-installed"
    };
  }

  if (!deferredPrompt) {
    console.log(
      "AI Interview: Browser install prompt is unavailable"
    );

    return {
      ok: false,
      reason: "no-prompt"
    };
  }

  const promptEvent = deferredPrompt;

  try {
    // prompt() ko click handler se call kiya jana chahiye.
    const promptResult = promptEvent.prompt();
    deferredPrompt = null;

    if (promptResult && typeof promptResult.then === "function") {
      await promptResult;
    }

    const choice = await promptEvent.userChoice;

    console.log(
      "AI Interview install outcome:",
      choice.outcome
    );

    return {
      ok: choice.outcome === "accepted",
      reason: choice.outcome
    };
  } catch (error) {
    console.error(
      "AI Interview install error:",
      error
    );

    return {
      ok: false,
      reason: error?.message || "install-failed"
    };
  }
}

// ===== Production Service Worker registration =====
if (
  "serviceWorker" in navigator &&
  import.meta.env.PROD
) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js")
      .then((registration) => {
        console.log(
          "AI Interview Service Worker registered:",
          registration.scope
        );
      })
      .catch((error) => {
        console.error(
          "Service Worker registration failed:",
          error
        );
      });
  });
}
