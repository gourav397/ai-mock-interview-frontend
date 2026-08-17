import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { t, toggleLang } from "../../i18n";
import { installApp, getInstallPrompt } from "../../main";

function Navbar() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const [lang, setLang] = useState(localStorage.getItem("lang") || "en");
  const [showInstall, setShowInstall] = useState(false);

  const isIOS =
    /iphone|ipad|ipod/i.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

  useEffect(() => {
    const showBtn = () => setShowInstall(true);
    window.addEventListener("install-ready", showBtn);
    if (getInstallPrompt()) showBtn();
    if (isIOS) setShowInstall(true);

    const hideBtn = () => setShowInstall(false);
    window.addEventListener("appinstalled", hideBtn);

    return () => {
      window.removeEventListener("install-ready", showBtn);
      window.removeEventListener("appinstalled", hideBtn);
    };
  }, []);

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const handleInstall = async () => {
    if (isIOS) {
      alert('iPhone pe: Share (📤) button → "Add to Home Screen"');
      return;
    }
    await installApp();
  };

  return (
    <nav className="bg-white shadow-md px-8 py-4 flex justify-between items-center flex-wrap gap-3">
      <Link to="/" className="text-2xl font-bold text-blue-600">
        AI Interview
      </Link>

      <div className="flex gap-6 items-center flex-wrap">
        {/* 📲 Install — ab ye tabhi dikhega jab prompt ready ho (ya iPhone pe) */}
        {showInstall && (
          <button
            onClick={handleInstall}
            className="bg-green-600 text-white px-4 py-2 rounded-lg font-semibold"
          >
            📲 Install App
          </button>
        )}

        {/* 📚 Learn More — click karte hi 4 slides wapas khul jayengi, bina reload ke */}
        <button
          onClick={() => window.dispatchEvent(new CustomEvent("show-onboarding"))}
          className="text-gray-700 hover:text-blue-600"
        >
          📚 Learn More
        </button>

        <button
          onClick={() => setLang(toggleLang())}
          className="text-gray-700 hover:text-blue-600"
        >
          🌐 {lang === "hi" ? "English" : "हिंदी"}
        </button>

        <Link to="/" className="text-gray-700 hover:text-blue-600">
          Home
        </Link>

        <Link to="/class-exam">📘 Class 11/12</Link>

        {token ? (
          <>
            <Link to="/dashboard" className="text-gray-700 hover:text-blue-600">
              {t("dashboard")}
            </Link>
            <Link to="/profile" className="text-gray-700 hover:text-blue-600">
              {t("profile")}
            </Link>
            <button
              onClick={logout}
              className="bg-red-600 text-white px-4 py-2 rounded-lg"
            >
              {t("logout")}
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className="text-gray-700 hover:text-blue-600">
              Login
            </Link>
            <Link to="/register" className="bg-blue-600 text-white px-4 py-2 rounded-lg">
              Register
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}

export default Navbar;