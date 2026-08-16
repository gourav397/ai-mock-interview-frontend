export const translations = {
  en: {
    dashboard: "Dashboard",
    practice: "Practice Test",
    startInterview: "Start Interview",
    uploadResume: "Upload Resume",
    profile: "Profile",
    logout: "Logout",
    chooseCategory: "Choose Category",
    startTest: "Start Test"
  },
  hi: {
    dashboard: "डैशबोर्ड",
    practice: "प्रैक्टिस टेस्ट",
    startInterview: "इंटरव्यू शुरू करें",
    uploadResume: "रिज्यूमे अपलोड करें",
    profile: "प्रोफ़ाइल",
    logout: "लॉगआउट",
    chooseCategory: "श्रेणी चुनें",
    startTest: "टेस्ट शुरू करें"
  }
};

export function t(key) {
  const lang = localStorage.getItem("lang") || "en";
  return (translations[lang] && translations[lang][key]) || translations.en[key] || key;
}

export function toggleLang() {
  const cur = localStorage.getItem("lang") === "hi" ? "en" : "hi";
  localStorage.setItem("lang", cur);
  return cur;
}