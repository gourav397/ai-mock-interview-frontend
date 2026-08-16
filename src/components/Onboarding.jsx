import { useEffect, useState } from "react";
import "./Onboarding.css";

const SLIDES = [
  {
    emoji: "🎯",
    title: "AI se Interview Crack Karo",
    tagline: "Smart practice jo aapko job dilayegi",
    color: "#6366f1",
    points: ["Real interview questions", "AI-powered feedback", "Har topic ka deep practice"]
  },
  {
    emoji: "🔥",
    title: "Daily Streak — 10 Minute",
    tagline: "Bilkul Snapchat jaisa streak system",
    color: "#f97316",
    points: ["Roz 10 min practice", "Streak mat todo 🔥", "Level up + XP kamao"]
  },
  {
    emoji: "🤖",
    title: "Real AI Interview",
    tagline: "AI aapse baat karega — jaise real interviewer",
    color: "#06b6d4",
    points: ["Follow-up questions", "Voice se answer bolo", "Har answer pe scoring"]
  },
  {
    emoji: "📄",
    title: "Resume-Based Questions",
    tagline: "Aapke resume ke hisaab se sawal",
    color: "#8b5cf6",
    points: ["Resume upload karo", "Personalized questions", "Interview-ready bano"]
  },
  {
    emoji: "📊",
    title: "Instant Results & Feedback",
    tagline: "Performance ka poora analysis",
    color: "#10b981",
    points: ["Score + percentage turant", "Performance rating", "Progress track karo"]
  }
];

export default function Onboarding() {
  const [visible, setVisible] = useState(true); // HAR BAAR dikhegi
  const [cur, setCur] = useState(0);

  useEffect(() => {
    const show = () => { setCur(0); setVisible(true); };
    window.addEventListener("show-onboarding", show);
    return () => window.removeEventListener("show-onboarding", show);
  }, []);

  function finish() { setVisible(false); }
  if (!visible) return null;

  const slide = SLIDES[cur];
  const last = cur === SLIDES.length - 1;

  return (
    <div id="onboarding">
      <div className="ob-card">
        <div className="ob-progress">
          {SLIDES.map((_, i) => (
            <span
              key={i}
              className="ob-bar"
              style={{ background: i <= cur ? slide.color : "#e2e8f0" }}
            />
          ))}
        </div>

        {/* ⭐⭐ display:block INLINE — koi CSS isse nahi chhupa sakti */}
        <div key={cur} className="ob-slide" style={{ display: "block" }}>
          <div
            className="ob-emoji"
            style={{ background: `linear-gradient(135deg, ${slide.color}, ${slide.color}99)` }}
          >
            {slide.emoji}
          </div>
          <p className="ob-tagline">{slide.tagline}</p>
          <h2>{slide.title}</h2>
          <ul className="ob-points">
            {slide.points.map((p, i) => (
              <li key={i}>✅ {p}</li>
            ))}
          </ul>
        </div>

        <div className="ob-dots">
          {SLIDES.map((_, i) => (
            <span
              key={i}
              className={"ob-dot" + (i === cur ? " active" : "")}
              style={{ background: i === cur ? slide.color : "#cbd5e1" }}
              onClick={() => setCur(i)}
            />
          ))}
        </div>

        <div className="ob-actions">
          <button className="ob-skip" onClick={finish}>Skip</button>
          <button
            className="ob-next"
            style={{ background: slide.color }}
            onClick={() => (last ? finish() : setCur(cur + 1))}
          >
            {last ? "Start 🚀" : "Next →"}
          </button>
        </div>
      </div>
    </div>
  );
}