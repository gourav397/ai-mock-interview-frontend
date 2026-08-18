import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API from "../../services/api";

// 🔥 Total time per difficulty (seconds) — 50 questions ke liye
const TIME_LIMITS = {
  Easy: 45 * 60,   // 45 min
  Medium: 60 * 60, // 60 min
  Hard: 75 * 60,   // 75 min
};

function Test() {
  const { category } = useParams();
  const navigate = useNavigate();

  const [difficulty, setDifficulty] = useState("Medium");
  const [questions, setQuestions] = useState([]);
  const [started, setStarted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState({});
  const [finished, setFinished] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0); // total seconds
  const [timeUp, setTimeUp] = useState(false); // time khatam hua ya nahi
  const [saving, setSaving] = useState(false);
  const [reviewFilter, setReviewFilter] = useState("all");

  // ⏱ Time ko HH:MM:SS me dikhao
  const formatTime = (secs) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return [h, m, s].map((n) => String(n).padStart(2, "0")).join(":");
  };

  // ---------- START TEST ----------
  const startTest = async () => {
    setLoading(true);
    try {
      const res = await API.get("/ai-interview/generate", {
        params: { category, difficulty, count: 50 },
      });
      const qs = res.data.questions || [];
      if (!qs.length) {
        alert("Is category me questions nahi mile — bank ban raha hai, 1 min baad try karo");
        return;
      }
      setQuestions(qs);
      setAnswers({});
      setCurrent(0);
      setFinished(false);
      setTimeUp(false);
      setTimeLeft(TIME_LIMITS[difficulty] || 60 * 60); // 🔥 total time set
      setReviewFilter("all");
      setStarted(true);
    } catch (error) {
      console.log(error);
      alert(error.response?.data?.message || "Questions load nahi hue — thodi der baad try karo");
    } finally {
      setLoading(false);
    }
  };

  const selected = answers[current] || "";

  // ---------- TOTAL TIMER (ek hi baar, pura test) ----------
  useEffect(() => {
    if (!started || finished) return;
    if (timeLeft <= 0) {
      setTimeUp(true);
      setFinished(true); // ⏰ time khatam → auto-submit
      return;
    }
    const t = setTimeout(() => setTimeLeft((p) => p - 1), 1000);
    return () => clearTimeout(t);
  }, [timeLeft, started, finished]);

  // ---------- NAVIGATION (timer kabhi reset NAHI hota) ----------
  const goNext = () => {
    if (current < questions.length - 1) setCurrent((c) => c + 1);
    else setFinished(true);
  };

  const goPrev = () => {
    if (current > 0) setCurrent((c) => c - 1);
  };

  // ---------- SUBMIT ----------
  const submitAnswer = () => {
    if (!selected) {
      alert("Pehle option select karo (ya Skip dabao)");
      return;
    }
    goNext();
  };

  // ---------- SKIP — koi popup nahi ----------
  const skipQuestion = () => {
    setAnswers((prev) => {
      const next = { ...prev };
      delete next[current];
      return next;
    });
    goNext();
  };

  // ---------- REVIEW CALC ----------
  const finalScore = questions.reduce(
    (s, q, i) => (answers[i] && answers[i] === q.correctAnswer ? s + 1 : s),
    0
  );
  const percentage = questions.length
    ? Math.round((finalScore / questions.length) * 100)
    : 0;
  const skippedCount = questions.filter((_, i) => !answers[i]).length;
  const wrongCount = questions.length - finalScore - skippedCount;
  const performance =
    finalScore >= questions.length * 0.8
      ? "Excellent Performance 🏆"
      : finalScore >= questions.length * 0.5
        ? "Good Performance 👍"
        : "Need More Practice 📖";

  const filters = [
    { key: "all", label: "📋 Sab", count: questions.length },
    { key: "correct", label: "✅ Sahi", count: finalScore },
    { key: "wrong", label: "❌ Galat", count: wrongCount },
    { key: "skipped", label: "⏭️ Skip", count: skippedCount }
  ];

  const filteredIndexes = questions
    .map((q, i) => ({ q, i }))
    .filter(({ q, i }) => {
      const userAns = answers[i] || "";
      const skipped = !userAns;
      const isCorrect = userAns === q.correctAnswer;
      if (reviewFilter === "correct") return isCorrect;
      if (reviewFilter === "wrong") return !skipped && !isCorrect;
      if (reviewFilter === "skipped") return skipped;
      return true;
    })
    .map(({ i }) => i);

  // ---------- SAVE RESULT ----------
  const saveResult = async () => {
    if (saving) return;
    setSaving(true);
    try {
      const user = JSON.parse(localStorage.getItem("user"));
      if (!user || !user.id) {
        alert("User ID missing. Please login again.");
        return;
      }
      await API.post("/results", {
        user: user.id,
        category,
        difficulty,
        totalQuestions: questions.length,
        score: finalScore,
        percentage,
        correctQuestions: finalScore,
        wrongQuestions: questions.length - finalScore,
        performance,
      });
      navigate("/result", {
        state: { score: finalScore, totalQuestions: questions.length, category, percentage },
      });
    } catch (err) {
      console.log("RESULT API ERROR =", err.response?.data || err.message);
      alert("Result save nahi hua — wapas try karo");
    } finally {
      setSaving(false);
    }
  };

  // ⏱ Timer color: 10 min se kam = yellow, 5 min se kam = red
  const timerColor =
    timeLeft < 5 * 60 ? "text-red-600" : timeLeft < 10 * 60 ? "text-amber-600" : "text-green-600";

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-3xl mx-auto bg-white p-8 rounded-xl shadow">
        <h1 className="text-3xl font-bold">Practice Test</h1>
        <p className="text-gray-500 mt-1">Category: {category}</p>

        {!started ? (
          /* ============ START SCREEN ============ */
          <>
            <select
              className="w-full border p-3 mt-6 rounded"
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
            >
              <option>Easy</option>
              <option>Medium</option>
              <option>Hard</option>
            </select>

            {/* 🔥 Total time info */}
            <div className="mt-4 p-4 rounded-lg bg-blue-50 border border-blue-200 text-sm font-semibold">
              <p className="text-gray-700">⏰ Total Time (50 questions):</p>
              <p className="mt-1">🟢 Easy: 45 min</p>
              <p>🟡 Medium: 60 min</p>
              <p>🔴 Hard: 75 min</p>
            </div>

            <button
              onClick={startTest}
              disabled={loading}
              className="mt-5 w-full bg-blue-600 text-white px-6 py-3 rounded font-bold"
            >
              {loading ? "Generating..." : "Start Test"}
            </button>

            {loading && (
              <p className="mt-4 text-blue-600 font-semibold">
                ⏳ AI 50 {difficulty} questions bana raha hai... 30-90 second lag sakte hain
              </p>
            )}
          </>
        ) : finished ? (
          /* ============ REVIEW SCREEN ============ */
          <>
            {timeUp && (
              <div className="mt-4 p-3 rounded-lg bg-red-50 border border-red-300 text-red-700 font-semibold text-center">
                ⏰ Time khatam ho gaya — test auto-submit ho gaya
              </div>
            )}

            {/* SUMMARY CARD */}
            <div className="mt-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-6 shadow-lg">
              <div className="flex flex-col sm:flex-row items-center gap-6">
                <svg viewBox="0 0 120 120" className="w-32 h-32 shrink-0">
                  <circle cx="60" cy="60" r="52" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="12" />
                  <circle cx="60" cy="60" r="52" fill="none" stroke="#ffffff" strokeWidth="12"
                    strokeLinecap="round"
                    strokeDasharray={`${2 * Math.PI * 52}`}
                    strokeDashoffset={2 * Math.PI * 52 * (1 - percentage / 100)}
                    transform="rotate(-90 60 60)" />
                  <text x="60" y="57" textAnchor="middle" className="fill-white text-[22px] font-bold">{percentage}%</text>
                  <text x="60" y="75" textAnchor="middle" className="fill-white text-[11px]">{finalScore}/{questions.length}</text>
                </svg>
                <div className="text-center sm:text-left">
                  <h2 className="text-2xl font-bold">Test Complete 🎉</h2>
                  <p className="mt-1 font-semibold text-blue-100">{performance}</p>
                  <div className="mt-3 flex flex-wrap gap-2 justify-center sm:justify-start">
                    <span className="px-3 py-1 rounded-full bg-green-400/25 border border-green-200/40 text-sm">✅ Sahi: {finalScore}</span>
                    <span className="px-3 py-1 rounded-full bg-red-400/25 border border-red-200/40 text-sm">❌ Galat: {wrongCount}</span>
                    <span className="px-3 py-1 rounded-full bg-yellow-400/25 border border-yellow-200/40 text-sm">⏭️ Skip: {skippedCount}</span>
                  </div>
                  <p className="mt-2 text-xs text-blue-200">{category} • {difficulty}</p>
                </div>
              </div>
            </div>

            {/* FILTER TABS */}
            <div className="mt-5 flex flex-wrap gap-2">
              {filters.map((f) => (
                <button
                  key={f.key}
                  onClick={() => setReviewFilter(f.key)}
                  className={`px-4 py-2 rounded-full text-sm font-bold border transition ${
                    reviewFilter === f.key
                      ? "bg-blue-600 text-white border-blue-600 shadow"
                      : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  {f.label} ({f.count})
                </button>
              ))}
            </div>

            {filteredIndexes.length === 0 && (
              <p className="mt-8 text-center text-gray-500">Is filter me koi question nahi hai</p>
            )}

            {/* QUESTION CARDS */}
            <div className="mt-4 space-y-4">
              {filteredIndexes.map((idx) => {
                const q = questions[idx];
                const userAns = answers[idx] || "";
                const skipped = !userAns;
                const isCorrect = userAns === q.correctAnswer;
                const correctOption = q.options?.find((o) => o.text === q.correctAnswer);
                const explanation = correctOption?.info || q.options?.[0]?.info || "";
                return (
                  <div key={idx} className={`rounded-xl border-2 p-4 shadow-sm ${
                    skipped ? "border-yellow-200 bg-yellow-50/60"
                      : isCorrect ? "border-green-200 bg-green-50/60"
                      : "border-red-200 bg-red-50/60"
                  }`}>
                    <div className="flex items-start justify-between gap-3">
                      <p className="font-bold text-gray-800">Q{idx + 1}. {q.question}</p>
                      <span className={`shrink-0 px-3 py-1 rounded-full text-xs font-bold text-white ${
                        skipped ? "bg-yellow-500" : isCorrect ? "bg-green-500" : "bg-red-500"
                      }`}>
                        {skipped ? "⏭️ Skip" : isCorrect ? "✅ Sahi" : "❌ Galat"}
                      </span>
                    </div>

                    <div className="mt-3 space-y-2">
                      {q.options?.map((opt, oi) => {
                        const optCorrect = opt.text === q.correctAnswer;
                        const optPick = opt.text === userAns;
                        let clsName = "p-2.5 rounded-lg border text-sm flex items-center justify-between gap-2";
                        if (optCorrect) clsName += " bg-green-100 border-green-400";
                        else if (optPick) clsName += " bg-red-100 border-red-400";
                        else clsName += " bg-white border-gray-200";
                        return (
                          <div key={oi} className={clsName}>
                            <span>{opt.text}</span>
                            <span className="text-xs font-bold shrink-0">
                              {optCorrect ? "✅ Sahi answer" : optPick ? "❌ Aapka jawab" : ""}
                            </span>
                          </div>
                        );
                      })}
                    </div>

                    {explanation && (
                      <div className="mt-3 p-3 rounded-lg bg-blue-50 border border-blue-100 text-sm text-gray-700">
                        <b>📖 Explanation:</b> {explanation}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* ACTIONS */}
            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => {
                  setStarted(false); setFinished(false); setQuestions([]);
                  setAnswers({}); setCurrent(0); setTimeLeft(0); setTimeUp(false);
                }}
                className="flex-1 bg-gray-500 hover:bg-gray-600 text-white px-6 py-3 rounded-xl font-bold transition"
              >
                🔄 Naya Test
              </button>
              <button
                onClick={saveResult}
                disabled={saving}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold shadow transition disabled:opacity-50"
              >
                {saving ? "Saving..." : "💾 Save Result & Result Page Dekho"}
              </button>
            </div>
          </>
        ) : (
          /* ============ TEST SCREEN ============ */
          <>
            <p className="mt-2 text-sm text-gray-500 font-semibold">{category} — {difficulty}</p>

            {/* 🔥 TOTAL TIME — upar right side sticky jaisa */}
            <div className={`mt-3 px-4 py-2 rounded-lg bg-gray-100 border font-bold text-center text-lg ${timerColor}`}>
              ⏱ Total Time Left: {formatTime(timeLeft)}
            </div>

            {/* Question numbers */}
            <div className="mt-4 flex flex-wrap gap-2">
              {questions.map((q, i) => (
                <button
                  key={i}
                  onClick={() => setCurrent(i)}
                  className={`w-8 h-8 rounded-full text-xs font-bold ${
                    i === current
                      ? "bg-blue-600 text-white"
                      : answers[i]
                        ? "bg-green-500 text-white"
                        : "bg-gray-200 text-gray-700"
                  }`}
                  title={answers[i] ? "Answered" : "Unanswered"}
                >
                  {i + 1}
                </button>
              ))}
            </div>

            {/* Progress bar */}
            <div className="mt-4">
              <div className="flex justify-between text-xs text-gray-500 font-semibold">
                <span>Progress</span>
                <span>{Math.round(((current + 1) / questions.length) * 100)}%</span>
              </div>
              <div className="mt-1 w-full bg-gray-200 rounded-full h-2">
                <div className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${((current + 1) / questions.length) * 100}%` }} />
              </div>
            </div>
            <p className="mt-2 text-sm text-gray-500">
              ✅ Answered: {Object.keys(answers).length}/{questions.length} | ⏭️ Skip = galat count hoga
            </p>

            <p className="mt-4">Question {current + 1}/{questions.length}</p>

            <h2 className="text-xl font-bold mt-2">{questions[current]?.question}</h2>

            <div className="mt-5 space-y-3">
              {questions[current]?.options?.map((option, index) => (
                <button
                  key={index}
                  onClick={() => setAnswers((prev) => ({ ...prev, [current]: option.text }))}
                  className={`block w-full text-left p-3 border rounded ${
                    selected === option.text ? "bg-blue-100 border-blue-600" : ""
                  }`}
                >
                  {option.text}
                </button>
              ))}
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={goPrev}
                disabled={current === 0}
                className="bg-gray-500 text-white px-6 py-3 rounded disabled:opacity-40"
              >
                ← Pichla
              </button>
              <button onClick={skipQuestion} className="bg-yellow-500 text-white px-6 py-3 rounded">
                Skip
              </button>
              <button onClick={submitAnswer} className="bg-green-600 text-white px-6 py-3 rounded">
                {current === questions.length - 1 ? "Finish" : "Submit"}
              </button>
            </div>

            <p className="mt-3 text-sm text-gray-500">
              💡 Test khatam hone ke baad hi pata chalega kaun se sahi / galat hain.
              Total time chalta rahega — kahin bhi jao, timer nahi rukega.
            </p>
          </>
        )}
      </div>
    </div>
  );
}

export default Test;