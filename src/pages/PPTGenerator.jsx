// ============================================================
// src/pages/PPTGenerator.jsx — PRO AI PPT Generator (upgraded)
// PRESERVED: Topic, Slides, Language, Type, Theme, Add images,
// Add speaker notes, Generate PPT, My PPTs, download flow.
// NEW (all functional): Layout style, Transitions, Animations,
// Charts, Narration, REAL slide preview (from API data),
// narration playback via browser SpeechSynthesis.
// ============================================================

import { useState, useEffect, useCallback, useRef } from "react";
import { apiService } from "../services/api";

const SLIDE_OPTIONS = [5, 10, 15, 20];
const LANGUAGES = ["English", "Hindi", "Bilingual"];
const TYPES = ["Student", "Professional", "Educational", "Interview", "General"];
const THEMES = ["Modern", "Academic", "Professional", "Minimal", "Dark"];
const LAYOUT_STYLES = ["AI Auto", "Professional", "Visual", "Academic"];
const TRANSITIONS = ["Off", "Subtle", "Dynamic"];
const ANIMATIONS = ["Off", "Subtle", "Professional"];
const CHARTS = ["Auto", "Off"];
const NARRATION = ["Off", "On"];

export default function PPTGenerator() {
  const [topic, setTopic] = useState("");
  const [slides, setSlides] = useState(10);
  const [language, setLanguage] = useState("English");
  const [type, setType] = useState("Educational");
  const [theme, setTheme] = useState("Modern");
  const [addImages, setAddImages] = useState(false);
  const [speakerNotes, setSpeakerNotes] = useState(true);
  // 🆕 upgrade controls
  const [layoutStyle, setLayoutStyle] = useState("AI Auto");
  const [transitions, setTransitions] = useState("Subtle");
  const [animations, setAnimations] = useState("Subtle");
  const [charts, setCharts] = useState("Auto");
  const [narration, setNarration] = useState("Off");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [readyFile, setReadyFile] = useState(null);
  const [preview, setPreview] = useState(null); // 🆕 real slide data
  const [currentSlide, setCurrentSlide] = useState(0);
  const [narrationScripts, setNarrationScripts] = useState([]);
  const [speaking, setSpeaking] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [myPpts, setMyPpts] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const speechRef = useRef(null);

  const loadHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const res = await apiService.get("/api/ppt/my");
      setMyPpts(res.data?.items || []);
    } catch {
      /* history optional */
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  useEffect(() => {
    loadHistory();
    return () => window.speechSynthesis?.cancel();
  }, [loadHistory]);

  async function handleGenerate(e) {
    e?.preventDefault();
    setError("");
    setReadyFile(null);
    setPreview(null);
    setNarrationScripts([]);
    setCurrentSlide(0);
    window.speechSynthesis?.cancel();

    if (!topic.trim()) return setError("Topic ya presentation request likho.");
    if (topic.length > 300) return setError("Topic 300 characters se chhota rakho.");

    setLoading(true);
    try {
      const res = await apiService.postLong("/api/ppt/generate", {
        topic: topic.trim(),
        slides,
        language,
        type,
        theme,
        addImages,
        speakerNotes,
        // 🆕 upgrade options
        layoutStyle,
        transitions,
        animations,
        charts,
        narration,
      });
      if (res.data?.success && res.data?.file) {
        setReadyFile({ file: res.data.file, downloadUrl: res.data.downloadUrl });
        setPreview(res.data.preview || null);
        setNarrationScripts(res.data.narrationScripts || []);
        loadHistory();
      } else {
        setError(res.data?.message || "PPT generate nahi hua — dobara try karo.");
      }
    } catch (err) {
      setError(err.message || "Server error — thodi der baad try karo.");
    } finally {
      setLoading(false);
    }
  }

  // 🆕 REAL narration playback — browser SpeechSynthesis
  function playNarration(slideNo) {
    if (!window.speechSynthesis) return setError("Is browser me narration supported nahi hai.");
    window.speechSynthesis.cancel();
    const item = narrationScripts.find((n) => n.slideNumber === slideNo);
    if (!item?.narration) return;
    const u = new SpeechSynthesisUtterance(item.narration);
    u.lang = language === "Hindi" ? "hi-IN" : language === "Bilingual" ? "hi-IN" : "en-IN";
    u.onend = () => setSpeaking(false);
    u.onerror = () => setSpeaking(false);
    speechRef.current = u;
    setSpeaking(true);
    window.speechSynthesis.speak(u);
  }

  function stopNarration() {
    window.speechSynthesis?.cancel();
    setSpeaking(false);
  }

  // Browser blob download — unchanged flow
  async function handleDownload(fileName) {
    setDownloading(true);
    try {
      const res = await apiService.get(`/api/ppt/download/${fileName}`, { responseType: "blob" });
      const url = window.URL.createObjectURL(
        new Blob([res.data], {
          type: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        })
      );
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(
        err?.response?.status === 410
          ? "File expire ho gayi — PPT dobara generate karo."
          : "Download fail hua — dobara try karo."
      );
    } finally {
      setDownloading(false);
    }
  }

  const OptionGroup = ({ label, value, options, onChange }) => (
    <>
      <label style={styles.label}>{label}</label>
      <div style={styles.optionRowWrap}>
        {options.map((o) => (
          <button
            key={o}
            type="button"
            onClick={() => onChange(o)}
            style={{ ...styles.optionBtn, ...(value === o ? styles.optionBtnActive : {}) }}
          >
            {o}
          </button>
        ))}
      </div>
    </>
  );

  const previewSlide = preview?.slides?.[currentSlide];

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h2 style={styles.title}>📊 AI PPT Generator</h2>
        <p style={styles.subtitle}>
          Professional AI presentation creator — layouts, charts, transitions, animations aur
          narration ke saath.
        </p>

        <form onSubmit={handleGenerate} style={styles.form}>
          <label style={styles.label}>Topic / Presentation Request *</label>
          <textarea
            style={styles.textarea}
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder='Example: "Create a 10-slide presentation about Water Conservation."'
            rows={3}
            maxLength={300}
          />

          <label style={styles.label}>Number of Slides</label>
          <div style={styles.optionRow}>
            {SLIDE_OPTIONS.map((n) => (
              <button key={n} type="button" onClick={() => setSlides(n)}
                style={{ ...styles.optionBtn, ...(slides === n ? styles.optionBtnActive : {}) }}>
                {n}
              </button>
            ))}
          </div>

          <OptionGroup label="Language" value={language} options={LANGUAGES} onChange={setLanguage} />
          <OptionGroup label="Presentation Type" value={type} options={TYPES} onChange={setType} />
          <OptionGroup label="Theme" value={theme} options={THEMES} onChange={setTheme} />

          {/* 🆕 Upgrade controls — sab real backend options hain */}
          <OptionGroup label="Layout Style" value={layoutStyle} options={LAYOUT_STYLES} onChange={setLayoutStyle} />
          <OptionGroup label="Transitions" value={transitions} options={TRANSITIONS} onChange={setTransitions} />
          <OptionGroup label="Animations" value={animations} options={ANIMATIONS} onChange={setAnimations} />
          <OptionGroup label="Charts / Infographics" value={charts} options={CHARTS} onChange={setCharts} />
          <OptionGroup label="Narration" value={narration} options={NARRATION} onChange={setNarration} />

          <div style={styles.checkboxRow}>
            <label style={styles.checkboxLabel}>
              <input type="checkbox" checked={addImages} onChange={(e) => setAddImages(e.target.checked)} /> Add images
            </label>
            <label style={styles.checkboxLabel}>
              <input type="checkbox" checked={speakerNotes} onChange={(e) => setSpeakerNotes(e.target.checked)} /> Add speaker notes
            </label>
          </div>

          <button type="submit" style={styles.generateBtn} disabled={loading}>
            {loading ? "⏳ Generating PPT… (30-90 sec)" : "📊 GENERATE PPT"}
          </button>
        </form>

        {loading && (
          <div style={styles.infoBox}>
            🧠 AI slides design kar raha hai — layouts, content, visuals…
          </div>
        )}
        {error && <div style={styles.errorBox}>❌ {error}</div>}

        {readyFile && !loading && (
          <div style={styles.successBox}>
            <h3 style={{ margin: "0 0 8px 0" }}>✅ Your PPT is ready!</h3>
            <button style={styles.downloadBtn} onClick={() => handleDownload(readyFile.file)} disabled={downloading}>
              {downloading ? "⏳ Downloading…" : "⬇️ Download PPT"}
            </button>
          </div>
        )}
      </div>

      {/* ============ 🆕 REAL PREVIEW (API slide data se rendered) ============ */}
      {preview && !loading && (
        <div style={styles.card}>
          <h3 style={styles.title}>👁️ Preview</h3>
          <p style={styles.subtitle}>
            {preview.title} — {preview.slides.length} slides. PPT me transitions ({transitions}),
            animations ({animations}) aur ye hi layouts hain.
          </p>

          {/* Thumbnails */}
          <div style={styles.thumbRow}>
            {preview.slides.map((s, i) => (
              <button key={s.slideNumber} onClick={() => setCurrentSlide(i)}
                style={{
                  ...styles.thumb,
                  ...(i === currentSlide ? styles.thumbActive : {}),
                }}
                title={s.title}
              >
                <div style={styles.thumbNo}>{s.slideNumber}</div>
                <div style={styles.thumbTitle}>{s.title.slice(0, 28)}</div>
                <div style={styles.thumbLayout}>{s.layout}</div>
              </button>
            ))}
          </div>

          {previewSlide && (
            <div style={styles.previewSlide}>
              <div style={styles.previewHeader}>{previewSlide.title}</div>
              <div style={{ ...styles.previewBadge, background: "#eef2ff", color: "#2563eb" }}>
                Layout: {previewSlide.layout}
                {previewSlide.hasChart ? " • 📊 Chart" : ""}
                {previewSlide.imagePrompt ? " • 🖼️ Image" : ""}
              </div>
              <ul style={styles.previewList}>
                {previewSlide.content.map((c, i) => (
                  <li key={i} style={styles.previewBullet}>{c}</li>
                ))}
              </ul>
              {narration === "On" && (
                <div style={{ marginTop: 12 }}>
                  {speaking ? (
                    <button style={styles.stopBtn} onClick={stopNarration}>⏹ Stop Narration</button>
                  ) : (
                    <button style={styles.playBtn} onClick={() => playNarration(previewSlide.slideNumber)}>
                      🔊 Play Narration (Slide {previewSlide.slideNumber})
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ============ MY PPTs — UNCHANGED ============ */}
      <div style={styles.card}>
        <h3 style={styles.title}>🗂️ My PPTs</h3>
        {historyLoading ? (
          <p style={styles.subtitle}>Loading…</p>
        ) : myPpts.length === 0 ? (
          <p style={styles.subtitle}>Abhi koi PPT generate nahi hua.</p>
        ) : (
          <ul style={styles.historyList}>
            {myPpts.map((it) => (
              <li key={it.file} style={styles.historyItem}>
                <div>
                  <strong>{it.topic}</strong>
                  <div style={styles.historyMeta}>
                    {it.slideCount} slides • {it.language} • {it.theme} •{" "}
                    {new Date(it.createdAt).toLocaleString()}
                  </div>
                </div>
                <button style={styles.downloadBtnSmall} onClick={() => handleDownload(it.file)} disabled={downloading}>
                  ⬇️
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

const styles = {
  page: { maxWidth: 960, margin: "0 auto", padding: 16, fontFamily: "inherit" },
  card: {
    background: "#fff", borderRadius: 14, padding: 24,
    boxShadow: "0 4px 14px rgba(0,0,0,0.08)", marginBottom: 20,
  },
  title: { margin: "0 0 6px 0", fontSize: 22 },
  subtitle: { color: "#6b7280", fontSize: 14, marginTop: 0 },
  form: { display: "flex", flexDirection: "column", gap: 10, marginTop: 12 },
  label: { fontWeight: 600, fontSize: 14 },
  textarea: {
    width: "100%", boxSizing: "border-box", padding: 12, borderRadius: 10,
    border: "1px solid #d1d5db", fontSize: 15, resize: "vertical", fontFamily: "inherit",
  },
  optionRow: { display: "flex", gap: 8, flexWrap: "wrap" },
  optionRowWrap: { display: "flex", gap: 8, flexWrap: "wrap" },
  optionBtn: {
    padding: "7px 14px", borderRadius: 20, border: "1px solid #d1d5db",
    background: "#fff", cursor: "pointer", fontSize: 13,
  },
  optionBtnActive: { background: "#2563eb", color: "#fff", borderColor: "#2563eb", fontWeight: 600 },
  checkboxRow: { display: "flex", gap: 24, marginTop: 4 },
  checkboxLabel: { fontSize: 14, cursor: "pointer" },
  generateBtn: {
    marginTop: 10, padding: "14px 20px", borderRadius: 10, border: "none",
    background: "#2563eb", color: "#fff", fontWeight: 700, fontSize: 16, cursor: "pointer",
  },
  downloadBtn: {
    padding: "12px 24px", borderRadius: 10, border: "none",
    background: "#16a34a", color: "#fff", fontWeight: 700, fontSize: 15, cursor: "pointer",
  },
  downloadBtnSmall: {
    padding: "8px 14px", borderRadius: 8, border: "1px solid #d1d5db",
    background: "#fff", cursor: "pointer",
  },
  infoBox: {
    marginTop: 14, padding: 12, background: "#eff6ff",
    border: "1px solid #bfdbfe", borderRadius: 10, fontSize: 14,
  },
  errorBox: {
    marginTop: 14, padding: 12, background: "#fef2f2",
    border: "1px solid #fecaca", borderRadius: 10, fontSize: 14, color: "#b91c1c",
  },
  successBox: {
    marginTop: 14, padding: 16, background: "#f0fdf4",
    border: "1px solid #bbf7d0", borderRadius: 10,
  },
  historyList: { listStyle: "none", padding: 0, margin: 0 },
  historyItem: {
    display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12,
    padding: "10px 0", borderBottom: "1px solid #f3f4f6", fontSize: 14,
  },
  historyMeta: { color: "#6b7280", fontSize: 12, marginTop: 2 },
  // Preview styles
  thumbRow: { display: "flex", gap: 8, overflowX: "auto", padding: "8px 0" },
  thumb: {
    minWidth: 110, padding: 8, borderRadius: 8, border: "1px solid #e5e7eb",
    background: "#f9fafb", cursor: "pointer", textAlign: "left",
  },
  thumbActive: { borderColor: "#2563eb", background: "#eff6ff", boxShadow: "0 0 0 2px #bfdbfe" },
  thumbNo: { fontSize: 11, color: "#9ca3af" },
  thumbTitle: { fontSize: 12, fontWeight: 600, color: "#111827", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" },
  thumbLayout: { fontSize: 10, color: "#6b7280" },
  previewSlide: {
    marginTop: 12, border: "1px solid #e5e7eb", borderRadius: 10, padding: 18,
    background: "#fff", minHeight: 220,
  },
  previewHeader: { fontSize: 19, fontWeight: 700, color: "#111827", borderBottom: "3px solid #2563eb", paddingBottom: 8 },
  previewBadge: {
    display: "inline-block", marginTop: 10, padding: "4px 12px",
    borderRadius: 14, fontSize: 12, fontWeight: 600,
  },
  previewList: { marginTop: 12, paddingLeft: 20 },
  previewBullet: { fontSize: 14, color: "#374151", marginBottom: 6 },
  playBtn: {
    padding: "8px 16px", borderRadius: 8, border: "none",
    background: "#7c3aed", color: "#fff", fontWeight: 600, fontSize: 13, cursor: "pointer",
  },
  stopBtn: {
    padding: "8px 16px", borderRadius: 8, border: "none",
    background: "#dc2626", color: "#fff", fontWeight: 600, fontSize: 13, cursor: "pointer",
  },
};

if (typeof window !== "undefined") {
  if (window.matchMedia("(max-width: 640px)").matches) {
    styles.card.padding = 16;
    styles.title.fontSize = 18;
  }
}