import { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import API from "../../services/api";

const TIME_LIMITS = {
  Easy: 30 * 60,
  Medium: 45 * 60,
  Hard: 60 * 60,
};

const QUESTION_COUNTS = {
  Easy: 20,
  Medium: 30,
  Hard: 40,
};

function Interview() {
  const navigate = useNavigate();

  // ─── Interview Config ──────────────────────────────────────────
  const [jobRole, setJobRole] = useState("");
  const [experience, setExperience] = useState("Fresher");
  const [difficulty, setDifficulty] = useState("Medium");
  const [techStack, setTechStack] = useState("");

  // ─── Interview State ───────────────────────────────────────────
  const [questions, setQuestions] = useState([]);
  const [started, setStarted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState({});
  const [finished, setFinished] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [timeUp, setTimeUp] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [reviewFilter, setReviewFilter] = useState("all");
  const [savedResultId, setSavedResultId] = useState(null);
  const [statusMessage, setStatusMessage] = useState("");

  // ─── Voice / Notes ─────────────────────────────────────────────
  const [voiceNotes, setVoiceNotes] = useState({});
  const [recording, setRecording] = useState(false);
  const [recordingFor, setRecordingFor] = useState(null);
  const mediaRecorder = useRef(null);
  const audioChunks = useRef([]);

  // ─── Confidence / Feedback ────────────────────────────────────
  const [confidence, setConfidence] = useState({});
  const [feedback, setFeedback] = useState({});

  const experienceLevels = [
    "Fresher",
    "Junior (0-2 yrs)",
    "Mid-Level (3-5 yrs)",
    "Senior (6-9 yrs)",
    "Lead (10+ yrs)",
  ];

  // ─── Utility ──────────────────────────────────────────────────
  const formatTime = (secs) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return [h, m, s].map((n) => String(n).padStart(2, "0")).join(":");
  };

  const getOptionExplanation = (opt) => {
    if (typeof opt === "string") return "";
    if (opt.explanation) return opt.explanation;
    if (opt.info) return opt.info;
    if (opt.description) return opt.description;
    if (opt.detail) return opt.detail;
    return "";
  };

  const getGeneralExplanation = (q) => {
    if (q.explanation) return q.explanation;
    if (q.description) return q.description;
    if (q.detail) return q.detail;
    return "";
  };

  const anyOptionHasExplanation = (q) => {
    return q.options?.some((opt) => typeof opt === "object" && getOptionExplanation(opt));
  };

  // ─── Start Interview (with auto-retry) ────────────────────────
  const startInterview = async (retryCount = 0) => {
    if (!jobRole.trim()) {
      alert("Please enter a Job Role before starting!");
      return;
    }
    if (!techStack.trim()) {
      alert("Please enter a Tech Stack before starting!");
      return;
    }

    setLoading(true);
    if (retryCount > 0) {
      setStatusMessage(`🔄 Preparing questions... (attempt ${retryCount}/5)`);
    } else {
      setStatusMessage(`🤖 AI generating ${difficulty} questions for ${jobRole}...`);
    }

    try {
      const count = QUESTION_COUNTS[difficulty] || 30;
      const res = await API.get("/ai-interview/generate", {
        params: {
          category: jobRole,
          difficulty,
          count,
          experience,
          techStack,
          type: "interview",
        },
        timeout: 25000,
      });

      const qs = res.data.questions || [];
      if (!qs.length) {
        alert("Is category me interview questions nahi mile");
        return;
      }

      setQuestions(qs);
      setAnswers({});
      setCurrent(0);
      setFinished(false);
      setTimeUp(false);
      setSaved(false);
      setSavedResultId(null);
      setTimeLeft(TIME_LIMITS[difficulty] || 45 * 60);
      setReviewFilter("all");
      setVoiceNotes({});
      setConfidence({});
      setFeedback({});
      setStatusMessage("");
      setStarted(true);
    } catch (error) {
      const status = error.response?.status;
      const msg = error.response?.data?.message || "";

      // Auto-retry for 409 (bank building) — max 5 retries
      if (status === 409 && retryCount < 5) {
        const waitTime = Math.min(1000 * (retryCount + 1), 5000);
        console.log(`⏳ Bank building... retry ${retryCount + 1}/5 in ${waitTime}ms`);
        setStatusMessage(`🔄 Questions are being prepared... (attempt ${retryCount + 1}/5)`);
        await new Promise((r) => setTimeout(r, waitTime));
        return startInterview(retryCount + 1);
      }

      if (status === 503 || error.code === "ECONNABORTED" || error.message?.includes("timeout")) {
        alert("⏱️ Server is busy — please try again in a few seconds.");
      } else if (status === 409) {
        alert("Server is still preparing questions. Please try again.");
      } else {
        alert(msg || "Interview questions load nahi hue. Please try again.");
      }
      console.log("Interview start error:", error);
    } finally {
      setLoading(false);
      setStatusMessage("");
    }
  };

  // ─── Timer ────────────────────────────────────────────────────
  useEffect(() => {
    if (!started || finished) return;
    if (timeLeft <= 0) {
      setTimeUp(true);
      setFinished(true);
      return;
    }
    const t = setTimeout(() => setTimeLeft((p) => p - 1), 1000);
    return () => clearTimeout(t);
  }, [timeLeft, started, finished]);

  // ─── Navigation ───────────────────────────────────────────────
  const goNext = () => {
    if (current < questions.length - 1) setCurrent((c) => c + 1);
    else setFinished(true);
  };

  const goPrev = () => {
    if (current > 0) setCurrent((c) => c - 1);
  };

  const submitAnswer = () => {
    const selected = answers[current];
    if (!selected) {
      alert("Pehle option select karo (ya Skip dabao)");
      return;
    }
    goNext();
  };

  const skipQuestion = () => {
    setAnswers((prev) => {
      const n = { ...prev };
      delete n[current];
      return n;
    });
    goNext();
  };

  // ─── Voice Recording ──────────────────────────────────────────
  const startRecording = async (qIndex) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaRecorder.current = recorder;
      audioChunks.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunks.current.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(audioChunks.current, { type: "audio/webm" });
        const url = URL.createObjectURL(blob);
        setVoiceNotes((prev) => ({ ...prev, [qIndex]: url }));
        stream.getTracks().forEach((t) => t.stop());
      };

      recorder.start();
      setRecording(true);
      setRecordingFor(qIndex);
    } catch (err) {
      console.log("Mic error:", err);
      alert("Microphone access nahi mila. Check permissions.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorder.current && mediaRecorder.current.state === "recording") {
      mediaRecorder.current.stop();
      setRecording(false);
      setRecordingFor(null);
    }
  };

  // ─── Confidence Slider ────────────────────────────────────────
  const updateConfidence = (qIndex, value) => {
    setConfidence((prev) => ({ ...prev, [qIndex]: value }));
    const fb = value >= 80 ? "Excellent 💪" : value >= 60 ? "Good 👍" : value >= 40 ? "Average 👌" : "Needs Practice 📖";
    setFeedback((prev) => ({ ...prev, [qIndex]: fb }));
  };

  // ─── Scoring ──────────────────────────────────────────────────
  const finalScore = questions.reduce(
    (s, q, i) => (answers[i] && answers[i] === q.correctAnswer ? s + 1 : s),
    0
  );

  const percentage = questions.length ? Math.round((finalScore / questions.length) * 100) : 0;

  const actualSkippedCount = questions.reduce(
    (count, _, i) => (answers[i] === undefined || answers[i] === null ? count + 1 : count),
    0
  );

  const actualWrongCount = questions.length - finalScore - actualSkippedCount;

  const performance =
    finalScore >= questions.length * 0.8
      ? "Excellent 🏆"
      : finalScore >= questions.length * 0.5
      ? "Good 👍"
      : "Need More Practice 📖";

  // ─── Filter System ────────────────────────────────────────────
  const filters = [
    { key: "all", label: "📋 All", count: questions.length },
    { key: "correct", label: "✅ Correct", count: finalScore },
    { key: "wrong", label: "❌ Wrong", count: actualWrongCount },
    { key: "skipped", label: "⏭️ Skipped", count: actualSkippedCount },
  ];

  const filteredIndexes = questions
    .map((q, i) => ({ q, i }))
    .filter(({ q, i }) => {
      const ua = answers[i] || "";
      const sk = !answers[i] && answers[i] !== 0;
      const ic = ua === q.correctAnswer;
      if (reviewFilter === "correct") return ic;
      if (reviewFilter === "wrong") return !sk && !ic;
      if (reviewFilter === "skipped") return sk;
      return true;
    })
    .map(({ i }) => i);

  // ─── Save Interview Result ────────────────────────────────────
  const saveResult = async () => {
    if (saving || saved) return;
    setSaving(true);

    try {
      const user = JSON.parse(localStorage.getItem("user"));
      if (!user || !user.id) {
        alert("Login karo pehle");
        return;
      }

      const questionsWithAnswers = questions.map((q, i) => {
        const optionExplanations = {};
        if (q.options) {
          q.options.forEach((opt, oi) => {
            const exp = typeof opt === "object" ? getOptionExplanation(opt) : "";
            if (exp) optionExplanations[oi] = exp;
          });
        }

        return {
          question: q.question,
          options: q.options,
          correctAnswer: q.correctAnswer,
          explanation: getGeneralExplanation(q),
          optionExplanations,
          userAnswer: answers[i] || null,
          isCorrect: answers[i] ? answers[i] === q.correctAnswer : false,
          voiceNote: voiceNotes[i] || null,
          confidence: confidence[i] || null,
          feedback: feedback[i] || null,
        };
      });

      const payload = {
        user: user.id,
        category: jobRole,
        difficulty,
        experience,
        techStack,
        type: "interview",
        totalQuestions: questions.length,
        score: finalScore,
        percentage,
        correctQuestions: finalScore,
        wrongQuestions: actualWrongCount,
        skippedQuestions: actualSkippedCount,
        performance,
        averageConfidence: Object.values(confidence).length
          ? Math.round(Object.values(confidence).reduce((a, b) => a + b, 0) / Object.values(confidence).length)
          : 0,
        questionsData: questionsWithAnswers,
      };

      const res = await API.post("/results", payload);
      setSaved(true);
      setSavedResultId(res.data.result?._id || null);
    } catch (err) {
      console.log("SAVE ERROR =", err.response?.data || err.message);
      alert("Result save nahi hua — wapas try karo");
    } finally {
      setSaving(false);
    }
  };

  const timerColor =
    timeLeft < 5 * 60
      ? "text-red-600"
      : timeLeft < 10 * 60
      ? "text-amber-600"
      : "text-green-600";

  // ─── RENDER ────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-indigo-950 to-slate-900">
      {/* HEADER */}
      <header className="bg-white/5 backdrop-blur-xl border-b border-white/10 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xs">AI</span>
            </div>
            <span className="text-white font-bold">Interview</span>
          </Link>

          <div className="flex items-center gap-4 text-sm">
            <span className="text-white/50">
              {jobRole || "Interview"} — {difficulty}
            </span>
            <button onClick={() => navigate("/dashboard")} className="text-purple-300 hover:text-white transition">
              ← Dashboard
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {!started ? (
          /* ─── CONFIGURATION SCREEN ──────────────────────────── */
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10">
            <h1 className="text-3xl font-bold text-white">🎤 AI Mock Interview</h1>
            <p className="text-white/50 mt-1">Practice with real interview questions</p>

            <div className="mt-6 space-y-5">
              {/* Job Role */}
              <div>
                <label className="text-white/70 text-sm font-semibold block mb-1.5">
                  💼 Job Role <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Frontend Developer, DevOps Engineer, Data Scientist"
                  value={jobRole}
                  onChange={(e) => setJobRole(e.target.value)}
                  className="w-full bg-white/10 border border-white/20 text-white p-3 rounded-xl placeholder-white/30 focus:border-purple-400 focus:outline-none focus:ring-1 focus:ring-purple-400/50"
                />
              </div>

              {/* Tech Stack */}
              <div>
                <label className="text-white/70 text-sm font-semibold block mb-1.5">
                  🛠️ Tech Stack <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. React, Node.js, Python, AWS"
                  value={techStack}
                  onChange={(e) => setTechStack(e.target.value)}
                  className="w-full bg-white/10 border border-white/20 text-white p-3 rounded-xl placeholder-white/30 focus:border-purple-400 focus:outline-none focus:ring-1 focus:ring-purple-400/50"
                />
              </div>

              {/* Experience */}
              <div>
                <label className="text-white/70 text-sm font-semibold block mb-1.5">📅 Experience Level</label>
                <select
                  className="w-full bg-white/10 border border-white/20 text-white p-3 rounded-xl"
                  value={experience}
                  onChange={(e) => setExperience(e.target.value)}
                >
                  {experienceLevels.map((lev) => (
                    <option key={lev} className="bg-gray-800" value={lev}>
                      {lev}
                    </option>
                  ))}
                </select>
              </div>

              {/* Difficulty */}
              <div>
                <label className="text-white/70 text-sm font-semibold block mb-1.5">Select Difficulty</label>
                <select
                  className="w-full bg-white/10 border border-white/20 text-white p-3 rounded-xl"
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value)}
                >
                  <option className="bg-gray-800" value="Easy">🟢 Easy — {QUESTION_COUNTS.Easy} Qs</option>
                  <option className="bg-gray-800" value="Medium">🟡 Medium — {QUESTION_COUNTS.Medium} Qs</option>
                  <option className="bg-gray-800" value="Hard">🔴 Hard — {QUESTION_COUNTS.Hard} Qs</option>
                </select>
              </div>

              {/* Info Card */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-400/20 text-sm">
                <p className="text-white/80 font-semibold">⏰ Interview Time Limits:</p>
                <div className="mt-2 flex flex-wrap gap-4 text-white/60">
                  <span>🟢 Easy: 30 min ({QUESTION_COUNTS.Easy} Qs)</span>
                  <span>🟡 Medium: 45 min ({QUESTION_COUNTS.Medium} Qs)</span>
                  <span>🔴 Hard: 60 min ({QUESTION_COUNTS.Hard} Qs)</span>
                </div>
              </div>

              <button
                onClick={() => startInterview(0)}
                disabled={loading}
                className="w-full py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-purple-600/30 transition-all disabled:opacity-50 text-lg"
              >
                {loading ? "⏳ Preparing..." : "🚀 Start Interview"}
              </button>

              {loading && (
                <div className="text-center">
                  <p className="text-purple-300 text-sm text-center animate-pulse">
                    {statusMessage || `🤖 AI ${difficulty} questions bana raha hai for ${jobRole}...`}
                  </p>
                  <div className="mt-3 flex justify-center gap-1">
                    <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></div>
                    <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></div>
                    <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></div>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : !finished ? (
          <>
            {/* QUESTION NUMBER NAVIGATION */}
            <div className="flex flex-wrap gap-2 mb-6">
              {questions.map((q, i) => (
                <button
                  key={i}
                  onClick={() => setCurrent(i)}
                  className={`w-9 h-9 rounded-lg text-xs font-bold transition-all ${
                    i === current
                      ? "bg-gradient-to-br from-purple-500 to-blue-500 text-white scale-110 shadow-lg"
                      : answers[i]
                      ? "bg-green-500/30 text-green-300 border border-green-400/30"
                      : "bg-white/10 text-white/50 border border-white/10 hover:bg-white/20"
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>

            {/* TIMER + PROGRESS + QUESTION */}
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 mb-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-white/50 text-sm">
                      Question {current + 1}/{questions.length}
                    </span>
                    {confidence[current] && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30">
                        Confidence: {confidence[current]}%
                      </span>
                    )}
                  </div>
                  <h2 className="text-white font-bold text-xl mt-1 leading-relaxed">
                    {questions[current]?.question}
                  </h2>
                  {questions[current]?.codeSnippet && (
                    <pre className="mt-3 p-4 bg-gray-900/80 rounded-xl border border-white/10 overflow-x-auto">
                      <code className="text-sm text-green-300 font-mono">{questions[current].codeSnippet}</code>
                    </pre>
                  )}
                </div>
                <div className={`text-right text-2xl font-mono font-bold shrink-0 ${timerColor}`}>
                  ⏱ {formatTime(timeLeft)}
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mt-4">
                <div className="flex justify-between text-xs text-white/40 mb-1">
                  <span>Progress</span>
                  <span>{Math.round(((current + 1) / questions.length) * 100)}%</span>
                </div>
                <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-purple-500 to-blue-500 rounded-full transition-all duration-300"
                    style={{ width: `${((current + 1) / questions.length) * 100}%` }}
                  />
                </div>
              </div>

              <div className="mt-3 text-sm text-white/40 flex flex-wrap items-center gap-3">
                <span>✅ {Object.keys(answers).length} answered</span>
                <span>⏭️ {actualSkippedCount} skipped</span>
                {voiceNotes[current] && <span className="text-purple-300">🎤 Voice note recorded</span>}
              </div>
            </div>

            {/* OPTIONS */}
            <div className="space-y-3 mb-4">
              {questions[current]?.options?.map((option, index) => {
                const optText = typeof option === "string" ? option : option.text;
                const selected = answers[current] || "";

                return (
                  <button
                    key={index}
                    onClick={() =>
                      setAnswers((prev) => ({
                        ...prev,
                        [current]: optText,
                      }))
                    }
                    className={`w-full text-left p-4 rounded-xl border text-white font-medium transition-all ${
                      selected === optText
                        ? "bg-gradient-to-r from-purple-600/40 to-blue-600/40 border-purple-400/60 shadow-lg"
                        : "bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/30"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-bold ${
                          selected === optText
                            ? "border-purple-400 bg-purple-500/30"
                            : "border-white/30"
                        }`}
                      >
                        {String.fromCharCode(65 + index)}
                      </div>
                      <span className="flex-1">{optText}</span>
                      {selected === optText && (
                        <span className="ml-auto text-purple-300 text-sm">✓ Selected</span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* VOICE RECORDING + CONFIDENCE */}
            <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-4 mb-6">
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2">
                  {recording && recordingFor === current ? (
                    <button
                      onClick={stopRecording}
                      className="px-4 py-2 bg-red-500/20 text-red-300 border border-red-400/30 rounded-xl font-semibold text-sm hover:bg-red-500/30 transition animate-pulse"
                    >
                      ⏹️ Stop Recording
                    </button>
                  ) : (
                    <button
                      onClick={() => startRecording(current)}
                      className="px-4 py-2 bg-white/10 text-white/70 border border-white/10 rounded-xl font-semibold text-sm hover:bg-white/20 transition"
                    >
                      🎤 {voiceNotes[current] ? "🔁 Re-record" : "Record Voice Note"}
                    </button>
                  )}
                  {voiceNotes[current] && (
                    <audio controls className="h-8 w-48">
                      <source src={voiceNotes[current]} type="audio/webm" />
                    </audio>
                  )}
                </div>

                <div className="flex items-center gap-3 flex-1 min-w-[200px]">
                  <span className="text-white/50 text-xs shrink-0">Confidence:</span>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={confidence[current] || 50}
                    onChange={(e) => updateConfidence(current, parseInt(e.target.value))}
                    className="w-full h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-purple-500"
                  />
                  <span className="text-white font-bold text-sm w-10 text-right">
                    {confidence[current] || 50}%
                  </span>
                </div>
              </div>
              {feedback[current] && (
                <div className="mt-2 text-xs text-purple-300/70">
                  💬 {feedback[current]}
                </div>
              )}
            </div>

            {/* NAVIGATION BUTTONS */}
            <div className="flex gap-3">
              <button
                onClick={goPrev}
                disabled={current === 0}
                className="px-6 py-3 bg-white/10 text-white rounded-xl border border-white/10 hover:bg-white/20 disabled:opacity-30 font-semibold transition"
              >
                ← Previous
              </button>
              <button
                onClick={skipQuestion}
                className="px-6 py-3 bg-yellow-500/20 text-yellow-300 rounded-xl border border-yellow-400/30 hover:bg-yellow-500/30 font-semibold transition"
              >
                ⏭️ Skip
              </button>
              <button
                onClick={submitAnswer}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:shadow-lg hover:shadow-green-600/30 font-bold transition"
              >
                {current === questions.length - 1 ? "🏁 Finish Interview" : "✅ Submit & Next"}
              </button>
            </div>
          </>
        ) : (
          <>
            {/* RESULTS SECTION */}
            {timeUp && (
              <div className="mb-4 p-4 rounded-xl bg-red-500/20 border border-red-400/30 text-red-300 font-semibold text-center">
                ⏰ Time's up! Auto-submitted.
              </div>
            )}

            {saved && (
              <div className="mb-4 p-4 rounded-xl bg-green-500/20 border border-green-400/30 text-green-300 font-semibold text-center">
                ✅ Interview result saved successfully! Check your history.
              </div>
            )}

            {/* Hero Score Card */}
            <div className="bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-700 rounded-2xl p-8 shadow-2xl border border-white/20 mb-6">
              <div className="flex flex-col md:flex-row items-center gap-8">
                <div className="relative w-36 h-36 shrink-0">
                  <svg className="w-36 h-36 transform -rotate-90" viewBox="0 0 120 120">
                    <circle cx="60" cy="60" r="52" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="8" />
                    <circle
                      cx="60" cy="60" r="52" fill="none" stroke="rgba(255,255,255,0.9)" strokeWidth="8"
                      strokeLinecap="round"
                      strokeDasharray={`${2 * Math.PI * 52}`}
                      strokeDashoffset={2 * Math.PI * 52 * (1 - percentage / 100)}
                    />
                    <text x="60" y="55" textAnchor="middle" className="fill-white text-2xl font-bold">{percentage}%</text>
                    <text x="60" y="72" textAnchor="middle" className="fill-white/80 text-xs">{finalScore}/{questions.length}</text>
                  </svg>
                </div>

                <div className="text-center md:text-left">
                  <h2 className="text-3xl font-bold text-white">Interview Complete 🎉</h2>
                  <p className="text-white/80 mt-1 text-lg">{performance}</p>

                  <div className="flex flex-wrap gap-3 mt-4 justify-center md:justify-start">
                    <div className="px-4 py-2 rounded-xl bg-green-500/20 border border-green-400/30 text-center">
                      <div className="text-green-300 text-xl font-bold">{finalScore}</div>
                      <div className="text-green-200 text-xs">✅ Correct</div>
                    </div>
                    <div className="px-4 py-2 rounded-xl bg-red-500/20 border border-red-400/30 text-center">
                      <div className="text-red-300 text-xl font-bold">{actualWrongCount}</div>
                      <div className="text-red-200 text-xs">❌ Wrong</div>
                    </div>
                    <div className="px-4 py-2 rounded-xl bg-yellow-500/20 border border-yellow-400/30 text-center">
                      <div className="text-yellow-300 text-xl font-bold">{actualSkippedCount}</div>
                      <div className="text-yellow-200 text-xs">⏭️ Skipped</div>
                    </div>
                    {Object.values(confidence).length > 0 && (
                      <div className="px-4 py-2 rounded-xl bg-blue-500/20 border border-blue-400/30 text-center">
                        <div className="text-blue-300 text-xl font-bold">
                          {Math.round(Object.values(confidence).reduce((a, b) => a + b, 0) / Object.values(confidence).length)}%
                        </div>
                        <div className="text-blue-200 text-xs">🎯 Avg. Confidence</div>
                      </div>
                    )}
                  </div>

                  <p className="mt-3 text-white/40 text-sm">
                    {jobRole} • {experience} • {difficulty}
                  </p>
                </div>
              </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex flex-wrap gap-2 mb-6">
              {filters.map((f) => (
                <button
                  key={f.key}
                  onClick={() => setReviewFilter(f.key)}
                  className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 ${
                    reviewFilter === f.key
                      ? "bg-white text-gray-900 shadow-lg scale-105"
                      : "bg-white/10 text-white/70 hover:bg-white/20 border border-white/10"
                  }`}
                >
                  {f.label} ({f.count})
                </button>
              ))}
            </div>

            {/* Questions Review */}
            <div className="space-y-4">
              {filteredIndexes.length === 0 && (
                <div className="text-center py-16 text-white/30">
                  <div className="text-6xl mb-4">📭</div>
                  <p>No questions in this filter</p>
                </div>
              )}

              {filteredIndexes.map((idx) => {
                const q = questions[idx];
                const userAns = answers[idx] || "";
                const skipped = !answers[idx] && answers[idx] !== 0;
                const isCorrect = userAns === q.correctAnswer;
                const generalExplanation = getGeneralExplanation(q);
                const hasOptionExp = anyOptionHasExplanation(q);
                const qConfidence = confidence[idx];
                const qFeedback = feedback[idx];
                const qVoiceNote = voiceNotes[idx];

                return (
                  <div
                    key={idx}
                    className={`rounded-xl border-2 p-5 transition-all ${
                      skipped
                        ? "border-yellow-500/30 bg-yellow-500/5"
                        : isCorrect
                        ? "border-green-500/30 bg-green-500/5"
                        : "border-red-500/30 bg-red-500/5"
                    }`}
                  >
                    {/* Question & Status */}
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="text-white font-bold text-lg">Q{idx + 1}. {q.question}</h3>
                      <span
                        className={`shrink-0 px-3 py-1 rounded-full text-xs font-bold ${
                          skipped
                            ? "bg-yellow-500/80 text-white"
                            : isCorrect
                            ? "bg-green-500/80 text-white"
                            : "bg-red-500/80 text-white"
                        }`}
                      >
                        {skipped ? "⏭️ Skipped" : isCorrect ? "✅ Correct" : "❌ Wrong"}
                      </span>
                    </div>

                    {(qConfidence || qVoiceNote) && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {qConfidence && (
                          <span className="text-xs px-2 py-1 rounded-full bg-blue-500/15 text-blue-300 border border-blue-400/30">
                            🎯 Confidence: {qConfidence}%
                          </span>
                        )}
                        {qFeedback && (
                          <span className="text-xs px-2 py-1 rounded-full bg-purple-500/15 text-purple-300 border border-purple-400/30">
                            💬 {qFeedback}
                          </span>
                        )}
                        {qVoiceNote && (
                          <span className="text-xs px-2 py-1 rounded-full bg-teal-500/15 text-teal-300 border border-teal-400/30">
                            🎤 Voice note attached
                          </span>
                        )}
                      </div>
                    )}

                    <div className="mt-4 space-y-2">
                      {q.options?.map((opt, oi) => {
                        const optText = typeof opt === "string" ? opt : opt.text;
                        const optCorrect = optText === q.correctAnswer;
                        const optPick = optText === userAns;
                        const optExplanation = typeof opt === "object" ? getOptionExplanation(opt) : "";

                        let bg = "bg-white/5 border-white/10";
                        let statusLabel = "";
                        let statusColor = "";

                        if (optCorrect) {
                          bg = "bg-green-500/15 border-green-400/40";
                          statusLabel = "✅ Correct Answer";
                          statusColor = "text-green-300";
                        } else if (optPick) {
                          bg = "bg-red-500/15 border-red-400/40";
                          statusLabel = "❌ Your Answer";
                          statusColor = "text-red-300";
                        }

                        return (
                          <div key={oi} className={`rounded-xl border ${bg} p-3 transition-all`}>
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1">
                                <span className="text-white/90 font-medium">{optText}</span>
                                {optExplanation && (
                                  <div className="mt-2 text-xs text-blue-300 border-t border-white/10 pt-2 leading-relaxed">
                                    {optExplanation}
                                  </div>
                                )}
                              </div>
                              {statusLabel && (
                                <span className={`shrink-0 text-xs font-bold ${statusColor}`}>{statusLabel}</span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {generalExplanation && !hasOptionExp && (
                      <div className="mt-3 p-4 rounded-xl bg-blue-500/10 border border-blue-400/20 text-sm text-blue-200 leading-relaxed">
                        <b>📖 Additional Info:</b> {generalExplanation}
                      </div>
                    )}
                    {generalExplanation && hasOptionExp && (
                      <div className="mt-2 text-xs text-blue-300/60 text-right">
                        📖 See option explanations above
                      </div>
                    )}

                    {qVoiceNote && (
                      <div className="mt-3">
                        <audio controls className="w-full h-10">
                          <source src={qVoiceNote} type="audio/webm" />
                        </audio>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Action Buttons */}
            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => {
                  setStarted(false);
                  setFinished(false);
                  setQuestions([]);
                  setAnswers({});
                  setCurrent(0);
                  setTimeLeft(0);
                  setTimeUp(false);
                  setSaved(false);
                  setSavedResultId(null);
                  setVoiceNotes({});
                  setConfidence({});
                  setFeedback({});
                }}
                className="flex-1 px-6 py-3 bg-white/10 text-white rounded-xl border border-white/20 hover:bg-white/20 font-bold transition"
              >
                🔄 New Interview
              </button>

              <button
                onClick={saveResult}
                disabled={saving || saved}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-bold shadow-lg hover:shadow-purple-600/30 transition disabled:opacity-50"
              >
                {saving ? "⏳ Saving..." : saved ? "✅ Saved" : "💾 Save Result"}
              </button>

              {saved && savedResultId && (
                <button
                  onClick={() => navigate(`/history-detail/${savedResultId}`)}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl font-bold shadow-lg hover:shadow-emerald-600/30 transition"
                >
                  📋 View in History
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default Interview;