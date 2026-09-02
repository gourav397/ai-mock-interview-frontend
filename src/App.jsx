import { BrowserRouter } from "react-router-dom";
import { useState, useEffect } from "react";
import AppRoutes from "./routes/AppRoutes";
import Navbar from "./components/layout/Navbar";
import Onboarding from "./components/Onboarding";
import AlexChat from "./components/AlexChat";

function App() {
  const [alexOpen, setAlexOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  // Check if current user is admin/owner
  useEffect(() => {
    const checkAdmin = () => {
      const adminKey = localStorage.getItem("alex_admin_key");
      const token = localStorage.getItem("token");
      let tokenAdmin = false;
      let emailMatch = false;
      if (token) {
        try {
          const payload = JSON.parse(atob(token.split(".")[1]));
          tokenAdmin = payload.role === "admin" || payload.role === "owner";
          emailMatch = payload.email === "gouravjangra782@gmail.com";
        } catch {}
      }
      setIsAdmin(!!adminKey || tokenAdmin || emailMatch);
    };
    checkAdmin();
    window.addEventListener("storage", checkAdmin);
    return () => window.removeEventListener("storage", checkAdmin);
  }, []);

  // Keyboard shortcut for admin only
  useEffect(() => {
    if (!isAdmin) return;
    const handleKeyDown = (e) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'A') {
        e.preventDefault();
        setAlexOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isAdmin]);

  return (
    <BrowserRouter>
      <Onboarding />
      <Navbar />
      <AppRoutes />

      {/* 🤖 ALEX BUTTON — SIRF ADMIN KO DIKHEGA */}
      {isAdmin && (
        <>
          <button
            onClick={() => setAlexOpen(!alexOpen)}
            title="Open ALEX Chat (Ctrl+Shift+A)"
            style={{
              position: "fixed",
              bottom: "24px",
              right: "24px",
              width: "60px",
              height: "60px",
              borderRadius: "16px",
              background: alexOpen
                ? "linear-gradient(135deg, #ef4444, #dc2626)"
                : "linear-gradient(135deg, #8b5cf6, #6d28d9)",
              border: "none",
              color: "#fff",
              fontSize: "28px",
              cursor: "pointer",
              boxShadow: alexOpen
                ? "0 4px 20px rgba(239,68,68,0.4)"
                : "0 4px 25px rgba(139,92,246,0.5), 0 0 60px rgba(139,92,246,0.15)",
              zIndex: 9998,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 0.3s",
              transform: alexOpen ? "rotate(45deg)" : "rotate(0deg)",
              animation: "alexPulse 3s ease-in-out infinite",
            }}
          >
            {alexOpen ? "✕" : "🤖"}
          </button>

          <AlexChat isOpen={alexOpen} onClose={() => setAlexOpen(false)} />
        </>
      )}

      <style>{`
        @keyframes alexPulse {
          0%, 100% { box-shadow: 0 4px 25px rgba(139,92,246,0.5); }
          50% { box-shadow: 0 4px 35px rgba(139,92,246,0.7), 0 0 80px rgba(139,92,246,0.1); }
        }
        html { scroll-behavior: smooth; }
        ::selection { background: rgba(139, 92, 246, 0.3); color: #fff; }
        @media (max-width: 768px) {
          button[title*="ALEX"] {
            width: 50px !important; height: 50px !important;
            font-size: 22px !important; bottom: 16px !important; right: 16px !important;
          }
        }
      `}</style>
    </BrowserRouter>
  );
}

export default App;