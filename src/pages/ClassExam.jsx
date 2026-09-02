import { useEffect, useState } from "react";
import API from "../services/api";
import { useNavigate } from "react-router-dom";

const FALLBACK_STRUCTURE = {
  "Class 11": {
    "Science": ["Physics", "Chemistry", "Biology", "Mathematics", "Computer Science", "English Core"],
    "Commerce": ["Accountancy", "Business Studies", "Economics", "Mathematics", "English Core"],
    "Humanities": ["History", "Geography", "Political Science", "Economics", "Psychology", "Sociology", "English Core"]
  },
  "Class 12": {
    "Science": ["Physics", "Chemistry", "Biology", "Mathematics", "Computer Science", "English Core"],
    "Commerce": ["Accountancy", "Business Studies", "Economics", "Mathematics", "English Core"],
    "Humanities": ["History", "Geography", "Political Science", "Economics", "Psychology", "Sociology", "English Core"]
  }
};

const STREAM_LABELS = {
  Science: "🔬 Science",
  Commerce: "📊 Commerce",
  Humanities: "📚 Humanities / Arts"
};

function ClassExam() {
  const navigate = useNavigate();

  const [structure, setStructure] = useState(FALLBACK_STRUCTURE);
  const [classList] = useState(["Class 11", "Class 12"]);

  const [step, setStep] = useState("select"); // select | test | review
  const [cls, setCls] = useState("");
  const [stream, setStream] = useState("");
  const [subject, setSubject] = useState("");
  const [difficulty, setDifficulty] = useState("Medium");
  const [loading, setLoading] = useState(false);

  const [questions, setQuestions] = useState([]);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(30);
  const [saving, setSaving] = useState(false);
  const [reviewFilter, setReviewFilter] = useState("all");

  const category = cls && stream && subject
    ? `${cls} ${stream} - ${subject}`
    : "";

  // ---------- STRUCTURE LOAD ----------
  useEffect(() => {
    (async () => {
      try {
        const res = await API.get("/class-exam/structure");
        if (res.data && Object.keys(res.data).length) {
          setStructure(res.data);
        }
      } catch (e) {
        console.log("Structure load error:", e);
      }
    })();
  }, []);

  // ---------- START TEST ----------
  const startTest = async () => {
    if (!category) {
      alert("Pehle Class, Stream aur Subject select karo");
      return;
    }
    setLoading(true);
    try {
      const res = await API.get("/api/ai-interview/generate", {
        params: { category, difficulty, count: 50 },
      });
      const qs = res.data.questions || [];
      if (!qs.length) {
        alert("Is subject me questions nahi mile — thodi der baad try karo");
        return;
      }
      setQuestions(qs);
      setAnswers({});
      setCurrent(0);
      setTimeLeft(30);
      setReviewFilter("all");
      setStep("test");
    } catch (error) {
      console.log(error);
      alert(error.response?.data?.message || "Questions load nahi hue — 1 min baad try karo");
    } finally {
      setLoading(false);
    }
  };

  const selected = answers[current] || "";

  // ---------- TIMER ----------
  useEffect(() => {
    if (step !== "test") return;
    if (timeLeft <= 0) {
      if (current < questions.length - 1) {
        setCurrent((c) => c + 1);
        setTimeLeft(30);
      } else {
        setStep("review");
      }
      return;
    }
    const t = setTimeout(() => setTimeLeft((p) => p - 1), 1000);
    return () => clearTimeout(t);
  }, [timeLeft, step, current, questions.length]);

  const goNext = () => {
    if (current < questions.length - 1) {
      setCurrent((c) => c + 1);
      setTimeLeft(30);
    } else {
      setStep("review");
    }
  };

  const goPrev = () => {
    if (current > 0) {
      setCurrent((c) => c - 1);
      setTimeLeft(30);
    }
  };

  const submitAnswer = () => {
    if (!selected) {
      alert("Pehle option select karo (ya Skip dabao)");
      return;
    }
    goNext();
  };

  // ---------- SKIP — koi popup nahi, answer clear + aage ----------
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

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto bg-white p-8 rounded-xl shadow">
        <h1 className="text-3xl font-bold">📘 Class 11 / 12 — CBSE</h1>

        {/* ============ STEP 1: SELECT ============ */}
        {step === "select" && (
          <>
            <p className="mt-6 font-bold">1. Class Chuno:</p>
            <div className="flex gap-3 mt-2">
              {classList.map((c) => (
                <button
                  key={c}
                  onClick={() => { setCls(c); setStream(""); setSubject(""); }}
                  className={`px-5 py-2 rounded border ${
                    cls === c ? "bg-blue-600 text-white border-blue-600" : "bg-gray-50 border-gray-300"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>

            {cls && (
              <>
                <p className="mt-6 font-bold">2. Stream Chuno:</p>
                <div className="flex gap-3 mt-2 flex-wrap">
                  {Object.keys(structure[cls] || {}).map((s) => (
                    <button
                      key={s}
                      onClick={() => { setStream(s); setSubject(""); }}
                      className={`px-5 py-2 rounded border ${
                        stream === s ? "bg-green-600 text-white border-green-600" : "bg-gray-50 border-gray-300"
                      }`}
                    >
                      {STREAM_LABELS[s] || s}
                    </button>
                  ))}
                </div>
              </>
            )}

            {cls && stream && (
              <>
                <p className="mt-6 font-bold">3. Subject Chuno:</p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-2">
                  {(structure[cls]?.[stream] || []).map((sub) => (
                    <button
                      key={sub}
                      onClick={() => setSubject(sub)}
                      className={`p-3 rounded border text-left ${
                        subject === sub
                          ? "bg-yellow-100 border-yellow-500"
                          : "bg-gray-50 border-gray-300 hover:bg-gray-100"
                      }`}
                    >
                      {sub}
                    </button>
                  ))}
                </div>
              </>
            )}

            <p className="mt-6 font-bold">4. Difficulty:</p>
            <select
              className="w-full border p-3 mt-2 rounded"
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
            >
              <option>Easy</option>
              <option>Medium</option>
              <option>Hard</option>
            </select>

            <button
              onClick={startTest}
              disabled={loading || !category}
              className="mt-6 w-full bg-blue-600 text-white px-6 py-3 rounded font-bold disabled:opacity-40"
            >
              {loading ? "Questions bana rahe hain..." : `Start Test — ${category || "Pehle select karo"}`}
            </button>

            {loading && (
              <p className="mt-3 text-blue-600 font-semibold text-sm">
                ⏳ AI 50 questions bana raha hai... 30-90 second lag sakte hain (sirf pehli baar)
              </p>
            )}
          </>
        )}

        {/* ============ STEP 2: TEST ============ */}
        {step === "test" && (
          <>
            <p className="mt-2 text-sm text-gray-500 font-semibold">{category} — {difficulty}</p>

            <div className="mt-4 flex flex-wrap gap-2">
              {questions.map((q, i) => (
                <button
                  key={i}
                  onClick={() => { setCurrent(i); setTimeLeft(30); }}
                  className={`w-8 h-8 rounded-full text-xs font-bold ${
                    i === current
                      ? "bg-blue-600 text-white"
                      : answers[i]
                        ? "bg-green-500 text-white"
                        : "bg-gray-200 text-gray-700"
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>

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
            <p className="mt-2 text-red-600 font-bold">⏱ Time Left: {timeLeft} sec</p>

            <h2 className="text-xl font-bold mt-4">{questions[current]?.question}</h2>

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
              Skip kiye hue questions galat count honge — pichle par jaa kar badal sakte ho.
            </p>
          </>
        )}

        {/* ============ STEP 3: REVIEW ============ */}
        {step === "review" && (
          <>
            {/* SUMMARY CARD */}
            <div className="mt-6 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-6 shadow-lg">
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

            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => {
                  setStep("select"); setQuestions([]); setAnswers({});
                  setCurrent(0); setTimeLeft(30); setCls(""); setStream(""); setSubject("");
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
        )}
      </div>
    </div>
  );
}

export default ClassExam;