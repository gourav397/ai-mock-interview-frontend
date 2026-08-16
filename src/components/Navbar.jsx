import { useState } from "react";
import { t, toggleLang } from "../i18n";
import { installApp } from "../../main";

function Navbar() {
  const [lang, setLang] = useState(localStorage.getItem("lang") || "en");

  return (
    <nav>
        <button onClick={() => { localStorage.removeItem("onboardingDone"); window.location.reload(); }}>
  📚 Learn More
</button>

      <button onClick={() => setLang(toggleLang())}>
        🌐 {lang === "hi" ? "English" : "हिंदी"}
      </button>

      <button
        id="installBtn"
        style={{ display: "none" }}
        onClick={installApp}
      >
        📲 Install App
      </button>

      <h1>{t("dashboard")}</h1>

      {/* ...baaki nav links — unke labels bhi t("key") se */}
    </nav>
    
  );
}


export default Navbar;