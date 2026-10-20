
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

  const isStandalone =
    window.matchMedia("(display-mode: standalone)").matches ||
    window.navigator.standalone === true;

  useEffect(() => {
    const updateInstallButton = () => {
      setShowInstall(
        !(
          window.matchMedia("(display-mode: standalone)").matches ||
          window.navigator.standalone === true
        )
      );
    };

    const handleInstalled = () => setShowInstall(false);
    const handleReady = () => updateInstallButton();

    updateInstallButton();

    window.addEventListener("install-ready", handleReady);
    window.addEventListener("appinstalled", handleInstalled);

    const mediaQuery = window.matchMedia("(display-mode: standalone)");
    mediaQuery.addEventListener?.("change", updateInstallButton);

    return () => {
      window.removeEventListener("install-ready", handleReady);
      window.removeEventListener("appinstalled", handleInstalled);
      mediaQuery.removeEventListener?.("change", updateInstallButton);
    };
  }, []);

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const handleInstall = async () => {
    if (isStandalone) {
      alert("AI Interview app is already installed.");
      setShowInstall(false);
      return;
    }

    if (isIOS) {
      alert(
        'iPhone/iPad: Safari mein Share (📤) button dabao, phir "Add to Home Screen" select karo.'
      );
      return;
    }

    const prompt = getInstallPrompt();

    if (prompt) {
      const result = await installApp();

      if (result?.ok) {
        setShowInstall(false);
      } else if (result?.reason === "no-prompt") {
        alert(
          'Chrome ke ⋮ menu mein "Cast, save and share" → "Install page as app" ya "Install AI Interview" option check karo.'
        );
      }

      return;
    }

    alert(
      'Chrome ke ⋮ menu mein "Cast, save and share" → "Install page as app" ya "Install AI Interview" option check karo. Agar option nahi hai, page reload karo aur HTTPS, manifest aur app icons check karo.'
    );
  };

  return (
    <nav className="bg-white shadow-md px-8 py-4 flex justify-between items-center flex-wrap gap-3">
      <Link to="/" className="text-2xl font-bold text-blue-600">
        AI Interview
      </Link>

      <div className="flex gap-6 items-center flex-wrap">
        {showInstall && (
          <button
            type="button"
            onClick={handleInstall}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-semibold"
          >
            📲 Install App
          </button>
        )}

        <button
          type="button"
          onClick={() =>
            window.dispatchEvent(new CustomEvent("show-onboarding"))
          }
          className="text-gray-700 hover:text-blue-600"
        >
          📚 Learn More
        </button>

        <button
          type="button"
          onClick={() => setLang(toggleLang())}
          className="text-gray-700 hover:text-blue-600"
        >
          🌐 {lang === "hi" ? "English" : "हिंदी"}
        </button>

        <Link to="/" className="text-gray-700 hover:text-blue-600">
          Home
        </Link>

        <Link to="/ppt" className="text-gray-700 hover:text-blue-600">
          📊 AI PPT
        </Link>

        <Link to="/class-exam" className="text-gray-700 hover:text-blue-600">
          📘 Class 11/12
        </Link>

        {token ? (
          <>
            <Link to="/dashboard" className="text-gray-700 hover:text-blue-600">
              {t("dashboard")}
            </Link>

            <Link to="/profile" className="text-gray-700 hover:text-blue-600">
              {t("profile")}
            </Link>

            <button
              type="button"
              onClick={logout}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg"
            >
              {t("logout")}
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className="text-gray-700 hover:text-blue-600">
              Login
            </Link>

            <Link
              to="/register"
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
            >
              Register
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}

export default Navbar;
