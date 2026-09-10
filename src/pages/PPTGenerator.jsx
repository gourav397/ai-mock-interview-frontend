// ============================================================
// src/pages/PPTGenerator.jsx — AI PPT Generator page
// Reuses existing services/api (auth interceptor automatic).
// Responsive: desktop/tablet/mobile.
// ============================================================

import { useState, useEffect, useCallback } from "react";
import apiService from "../services/api";

const SLIDE_OPTIONS = [5, 10, 15, 20];
const LANGUAGES = ["English", "Hindi", "Bilingual"];
const TYPES = ["Student", "Professional", "Educational", "Interview", "General"];
const THEMES = ["Modern", "Academic", "Professional", "Minimal", "Dark"];

export default function PPTGenerator() {
  const [topic, setTopic] = useState("");
  const [slides, setSlides] = useState(10);
  const [language, setLanguage] = useState("English");
  const [type, setType] = useState("Educational");
  const [theme, setTheme] = useState("Modern");
  const [addImages, setAddImages] = useState(false);
  const [speakerNotes, setSpeakerNotes] = useState(true);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [readyFile, setReadyFile] = useState(null); // { file, downloadUrl }
  const [downloading, setDownloading] = useState(false);
  const [myPpts, setMyPpts] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const loadHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const res = await apiService.get("/api/ppt/my");
      setMyPpts(res.data?.items || []);
    } catch {
      /* history optional — silent */
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  async function handleGenerate(e) {
    e?.preventDefault();
    setError("");
    setReadyFile(null);

    if (!topic.trim()) {
      setError("Topic ya presentation request likho.");
      return;
    }
    if (topic.length > 300) {
      setError("Topic 300 characters se chhota rakho.");
      return;
    }

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
      });
      if (res.data?.success && res.data?.file) {
        setReadyFile({ file: res.data.file, downloadUrl: res.data.downloadUrl });
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

  // Browser blob download — auth header ke saath, raw server path open nahi hota
  async function handleDownload(fileName) {
    setDownloading(true);
    try {
      const res = await apiService.get(`/api/ppt/download/${fileName}`, {
        responseType: "blob",
      });
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

  return (
    <div className="ppt-generator" style={styles.page}>
      <div style={styles.card}>
        <h2 style={styles.title}>📊 AI PPT Generator</h2>
        <p style={styles.subtitle}>
          Simple request likho — jaise "Haryana Geography par 10-slide presentation" —
          aur ready PowerPoint download karo.
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
              <button
                key={n}
                type="button"
                onClick={() => setSlides(n)}
                style={{ ...styles.optionBtn, ...(slides === n ? styles.optionBtnActive : {}) }}
              >
                {n}
              </button>
            ))}
          </div>

          <label style={styles.label}>Language</label>
          <div style={styles.optionRow}>
            {LANGUAGES.map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => setLanguage(l)}
                style={{ ...styles.optionBtn, ...(language === l ? styles.optionBtnActive : {}) }}
              >
                {l}
              </button>
            ))}
          </div>

          <label style={styles.label}>Presentation Type</label>
          <div style={styles.optionRowWrap}>
            {TYPES.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setType(t)}
                style={{ ...styles.optionBtn, ...(type === t ? styles.optionBtnActive : {}) }}
              >
                {t}
              </button>
            ))}
          </div>

          <label style={styles.label}>Theme</label>
          <div style={styles.optionRowWrap}>
            {THEMES.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTheme(t)}
                style={{ ...styles.optionBtn, ...(theme === t ? styles.optionBtnActive : {}) }}
              >
                {t}
              </button>
            ))}
          </div>

          <div style={styles.checkboxRow}>
            <label style={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={addImages}
                onChange={(e) => setAddImages(e.target.checked)}
              />{" "}
              Add images
            </label>
            <label style={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={speakerNotes}
                onChange={(e) => setSpeakerNotes(e.target.checked)}
              />{" "}
              Add speaker notes
            </label>
          </div>

          <button type="submit" style={styles.generateBtn} disabled={loading}>
            {loading ? "⏳ Generating PPT… (30-90 sec)" : "📊 GENERATE PPT"}
          </button>
        </form>

        {loading && (
          <div style={styles.infoBox}>
            🧠 AI presentation structure + content bana raha hai… slide count ke hisab se
            30-90 second lag sakte hain.
          </div>
        )}

        {error && <div style={styles.errorBox}>❌ {error}</div>}

        {readyFile && !loading && (
          <div style={styles.successBox}>
            <h3 style={{ margin: "0 0 8px 0" }}>✅ Your PPT is ready!</h3>
            <button
              style={styles.downloadBtn}
              onClick={() => handleDownload(readyFile.file)}
              disabled={downloading}
            >
              {downloading ? "⏳ Downloading…" : "⬇️ Download PPT"}
            </button>
          </div>
        )}
      </div>

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
                <button
                  style={styles.downloadBtnSmall}
                  onClick={() => handleDownload(it.file)}
                  disabled={downloading}
                >
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
  page: {
    maxWidth: 900,
    margin: "0 auto",
    padding: 16,
    fontFamily: "inherit",
  },
  card: {
    background: "#fff",
    borderRadius: 14,
    padding: 24,
    boxShadow: "0 4px 14px rgba(0,0,0,0.08)",
    marginBottom: 20,
  },
  title: { margin: "0 0 6px 0", fontSize: 22 },
  subtitle: { color: "#6b7280", fontSize: 14, marginTop: 0 },
  form: { display: "flex", flexDirection: "column", gap: 10, marginTop: 12 },
  label: { fontWeight: 600, fontSize: 14 },
  textarea: {
    width: "100%",
    boxSizing: "border-box",
    padding: 12,
    borderRadius: 10,
    border: "1px solid #d1d5db",
    fontSize: 15,
    resize: "vertical",
    fontFamily: "inherit",
  },
  optionRow: { display: "flex", gap: 8, flexWrap: "wrap" },
  optionRowWrap: { display: "flex", gap: 8, flexWrap: "wrap" },
  optionBtn: {
    padding: "8px 16px",
    borderRadius: 20,
    border: "1px solid #d1d5db",
    background: "#fff",
    cursor: "pointer",
    fontSize: 14,
  },
  optionBtnActive: {
    background: "#2563eb",
    color: "#fff",
    borderColor: "#2563eb",
    fontWeight: 600,
  },
  checkboxRow: { display: "flex", gap: 24, marginTop: 4 },
  checkboxLabel: { fontSize: 14, cursor: "pointer" },
  generateBtn: {
    marginTop: 10,
    padding: "14px 20px",
    borderRadius: 10,
    border: "none",
    background: "#2563eb",
    color: "#fff",
    fontWeight: 700,
    fontSize: 16,
    cursor: "pointer",
  },
  downloadBtn: {
    padding: "12px 24px",
    borderRadius: 10,
    border: "none",
    background: "#16a34a",
    color: "#fff",
    fontWeight: 700,
    fontSize: 15,
    cursor: "pointer",
  },
  downloadBtnSmall: {
    padding: "8px 14px",
    borderRadius: 8,
    border: "1px solid #d1d5db",
    background: "#fff",
    cursor: "pointer",
  },
  infoBox: {
    marginTop: 14,
    padding: 12,
    background: "#eff6ff",
    border: "1px solid #bfdbfe",
    borderRadius: 10,
    fontSize: 14,
  },
  errorBox: {
    marginTop: 14,
    padding: 12,
    background: "#fef2f2",
    border: "1px solid #fecaca",
    borderRadius: 10,
    fontSize: 14,
    color: "#b91c1c",
  },
  successBox: {
    marginTop: 14,
    padding: 16,
    background: "#f0fdf4",
    border: "1px solid #bbf7d0",
    borderRadius: 10,
  },
  historyList: { listStyle: "none", padding: 0, margin: 0 },
  historyItem: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    padding: "10px 0",
    borderBottom: "1px solid #f3f4f6",
    fontSize: 14,
  },
  historyMeta: { color: "#6b7280", fontSize: 12, marginTop: 2 },
};

// Responsive tweaks
if (typeof window !== "undefined") {
  const mq = window.matchMedia("(max-width: 640px)");
  if (mq.matches) {
    styles.card.padding = 16;
    styles.title.fontSize = 18;
  }
}