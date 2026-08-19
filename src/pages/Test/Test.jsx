import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import API from "../../services/api";

const TIME_LIMITS = {
  Easy: 45 * 60,
  Medium: 60 * 60,
  Hard: 75 * 60,
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
  const [timeLeft, setTimeLeft] = useState(0);
  const [timeUp, setTimeUp] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [reviewFilter, setReviewFilter] = useState("all");
  const [savedResultId, setSavedResultId] = useState(null);

  const formatTime = (secs) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return [h, m, s].map((n) => String(n).padStart(2, "0")).join(":");
  };

  // 🔥 Option explanation — option ke andar jo di hai
  const getOptionExplanation = (opt) => {
    if (typeof opt === "string") return "";
    if (opt.explanation) return opt.explanation;
    if (opt.info) return opt.info;
    if (opt.description) return opt.description;
    if (opt.detail) return opt.detail;
    return "";
  };

  // 🔥 General question explanation (API se)
  const getGeneralExplanation = (q) => {
    if (q.explanation) return q.explanation;
    if (q.description) return q.description;
    if (q.detail) return q.detail;
    return "";
  };

  // 🔥 Check: kya kisi option ki apni explanation hai?
  const anyOptionHasExplanation = (q) => {
    return q.options?.some((opt) => typeof opt === "object" && getOptionExplanation(opt));
  };

  const startTest = async () => {
    setLoading(true);
    try {
      const res = await API.get("/ai-interview/generate", {
        params: { category, difficulty, count: 50 },
      });
      const qs = res.data.questions || [];
      if (!qs.length) {
        alert("Is category me questions nahi mile");
        return;
      }
      setQuestions(qs);
      setAnswers({});
      setCurrent(0);
      setFinished(false);
      setTimeUp(false);
      setSaved(false);
      setSavedResultId(null);
      setTimeLeft(TIME_LIMITS[difficulty] || 60 * 60);
      setReviewFilter("all");
      setStarted(true);
    } catch (error) {
      console.log(error);
      alert(error.response?.data?.message || "Questions load nahi hue");
    } finally {
      setLoading(false);
    }
  };

  const selected = answers[current] || "";

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

  const goNext = () => {
    if (current < questions.length - 1) setCurrent((c) => c + 1);
    else setFinished(true);
  };

  const goPrev = () => {
    if (current > 0) setCurrent((c) => c - 1);
  };

  const submitAnswer = () => {
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

  const finalScore = questions.reduce(
    (s, q, i) =>
      answers[i] && answers[i] === q.correctAnswer ? s + 1 : s,
    0
  );

  const percentage = questions.length
    ? Math.round((finalScore / questions.length) * 100)
    : 0;

  const actualSkippedCount = questions.reduce(
    (count, _, i) =>
      answers[i] === undefined || answers[i] === null ? count + 1 : count,
    0
  );

  const actualWrongCount =
    questions.length - finalScore - actualSkippedCount;

  const performance =
    finalScore >= questions.length * 0.8
      ? "Excellent 🏆"
      : finalScore >= questions.length * 0.5
      ? "Good 👍"
      : "Need More Practice 📖";

  const filters = [
    { key: "all", label: "📋 Sab", count: questions.length },
    { key: "correct", label: "✅ Sahi", count: finalScore },
    { key: "wrong", label: "❌ Galat", count: actualWrongCount },
    { key: "skipped", label: "⏭️ Skip", count: actualSkippedCount },
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

  // ---------- SAVE RESULT ----------
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
        // 🔥 Collect all option explanations
        const optionExplanations = {};

        if (q.options) {
          q.options.forEach((opt, oi) => {
            const exp =
              typeof opt === "object" ? getOptionExplanation(opt) : "";

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
          isCorrect: answers[i]
            ? answers[i] === q.correctAnswer
            : false,
        };
      });

      const payload = {
        user: user.id,
        category,
        difficulty,
        totalQuestions: questions.length,
        score: finalScore,
        percentage,
        correctQuestions: finalScore,
        wrongQuestions: actualWrongCount,
        skippedQuestions: actualSkippedCount,
        performance,
        questionsData: questionsWithAnswers,
      };

      const res = await API.post("/results", payload);

      setSaved(true);
      setSavedResultId(res.data.result?._id || null);
    } catch (err) {
      console.log(
        "SAVE ERROR =",
        err.response?.data || err.message
      );
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-indigo-950 to-slate-900">
      {/* 🔥 PREMIUM GLASS HEADER */}
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
              {category} — {difficulty}
            </span>

            <button
              onClick={() => navigate("/dashboard")}
              className="text-purple-300 hover:text-white transition"
            >
              ← Dashboard
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {!started ? (
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10">
            <h1 className="text-3xl font-bold text-white">
              📝 Practice Test
            </h1>

            <p className="text-white/50 mt-1">
              Category: {category}
            </p>

            <div className="mt-6 space-y-4">
              <label className="text-white/70 text-sm font-semibold">
                Select Difficulty
              </label>

              <select
                className="w-full bg-white/10 border border-white/20 text-white p-3 rounded-xl"
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
              >
                <option className="bg-gray-800" value="Easy">
                  🟢 Easy
                </option>

                <option className="bg-gray-800" value="Medium">
                  🟡 Medium
                </option>

                <option className="bg-gray-800" value="Hard">
                  🔴 Hard
                </option>
              </select>

              <div className="p-4 rounded-xl bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-400/20 text-sm">
                <p className="text-white/80 font-semibold">
                  ⏰ Time Limits (50 questions):
                </p>

                <div className="mt-2 flex gap-4 text-white/60">
                  <span>🟢 Easy: 45 min</span>
                  <span>🟡 Medium: 60 min</span>
                  <span>🔴 Hard: 75 min</span>
                </div>
              </div>

              <button
                onClick={startTest}
                disabled={loading}
                className="w-full py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-purple-600/30 transition-all disabled:opacity-50 text-lg"
              >
                {loading
                  ? "⏳ Generating AI Questions..."
                  : "🚀 Start Test"}
              </button>

              {loading && (
                <p className="text-purple-300 text-sm text-center animate-pulse">
                  AI 50 {difficulty} questions bana raha hai... 30-60 sec
                </p>
              )}
            </div>
          </div>
        ) : !finished ? (
          <>
            {/* 🔥 QUESTION NUMBERS — QUESTION KE UPAR */}
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

            {/* 🔥 PREMIUM TIMER + PROGRESS */}
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-white/50 text-sm">
                    Question {current + 1}/{questions.length}
                  </span>

                  <h2 className="text-white font-bold text-xl mt-1">
                    {questions[current]?.question}
                  </h2>
                </div>

                <div
                  className={`text-right text-2xl font-mono font-bold ${timerColor}`}
                >
                  ⏱ {formatTime(timeLeft)}
                </div>
              </div>

              <div className="mt-4">
                <div className="flex justify-between text-xs text-white/40 mb-1">
                  <span>Progress</span>

                  <span>
                    {Math.round(
                      ((current + 1) / questions.length) * 100
                    )}
                    %
                  </span>
                </div>

                <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-purple-500 to-blue-500 rounded-full transition-all duration-300"
                    style={{
                      width: `${((current + 1) / questions.length) * 100}%`,
                    }}
                  />
                </div>
              </div>

              <div className="mt-3 text-sm text-white/40">
                ✅ {Object.keys(answers).length} answered • ⏭️ Skip = Not attempted
              </div>
            </div>

            {/* 🔥 OPTIONS — Question already upar timer me hai, ab options dikhao */}
            <div className="space-y-3 mb-6">
              {questions[current]?.options?.map((option, index) => {
                const optText =
                  typeof option === "string" ? option : option.text;

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

                      <span>{optText}</span>

                      {selected === optText && (
                        <span className="ml-auto text-purple-300 text-sm">
                          ✓ Selected
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* 🔥 NAVIGATION BUTTONS */}
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
                {current === questions.length - 1
                  ? "🏁 Finish Test"
                  : "✅ Submit & Next"}
              </button>
            </div>
          </>
        ) : (
          <>
            {/* 🔥🔥🔥 RESULT SECTION — PREMIUM PREMIUM PREMIUM */}
            {timeUp && (
              <div className="mb-4 p-4 rounded-xl bg-red-500/20 border border-red-400/30 text-red-300 font-semibold text-center">
                ⏰ Time's up! Auto-submitted.
              </div>
            )}

            {saved && (
              <div className="mb-4 p-4 rounded-xl bg-green-500/20 border border-green-400/30 text-green-300 font-semibold text-center">
                ✅ Result saved successfully! Check your history.
              </div>
            )}

            {/* 🔥 Score Hero Card */}
            <div className="bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-700 rounded-2xl p-8 shadow-2xl border border-white/20 mb-6">
              <div className="flex flex-col md:flex-row items-center gap-8">
                <div className="relative w-36 h-36 shrink-0">
                  <svg
                    className="w-36 h-36 transform -rotate-90"
                    viewBox="0 0 120 120"
                  >
                    <circle
                      cx="60"
                      cy="60"
                      r="52"
                      fill="none"
                      stroke="rgba(255,255,255,0.15)"
                      strokeWidth="8"
                    />

                    <circle
                      cx="60"
                      cy="60"
                      r="52"
                      fill="none"
                      stroke="rgba(255,255,255,0.9)"
                      strokeWidth="8"
                      strokeLinecap="round"
                      strokeDasharray={`${2 * Math.PI * 52}`}
                      strokeDashoffset={
                        2 *
                        Math.PI *
                        52 *
                        (1 - percentage / 100)
                      }
                    />

                    <text
                      x="60"
                      y="55"
                      textAnchor="middle"
                      className="fill-white text-2xl font-bold"
                    >
                      {percentage}%
                    </text>

                    <text
                      x="60"
                      y="72"
                      textAnchor="middle"
                      className="fill-white/80 text-xs"
                    >
                      {finalScore}/{questions.length}
                    </text>
                  </svg>
                </div>

                <div className="text-center md:text-left">
                  <h2 className="text-3xl font-bold text-white">
                    Test Complete 🎉
                  </h2>

                  <p className="text-white/80 mt-1 text-lg">
                    {performance}
                  </p>

                  <div className="flex flex-wrap gap-3 mt-4 justify-center md:justify-start">
                    <div className="px-4 py-2 rounded-xl bg-green-500/20 border border-green-400/30 text-center">
                      <div className="text-green-300 text-xl font-bold">
                        {finalScore}
                      </div>

                      <div className="text-green-200 text-xs">
                        ✅ Correct
                      </div>
                    </div>

                    <div className="px-4 py-2 rounded-xl bg-red-500/20 border border-red-400/30 text-center">
                      <div className="text-red-300 text-xl font-bold">
                        {actualWrongCount}
                      </div>

                      <div className="text-red-200 text-xs">
                        ❌ Wrong
                      </div>
                    </div>

                    <div className="px-4 py-2 rounded-xl bg-yellow-500/20 border border-yellow-400/30 text-center">
                      <div className="text-yellow-300 text-xl font-bold">
                        {actualSkippedCount}
                      </div>

                      <div className="text-yellow-200 text-xs">
                        ⏭️ Skipped
                      </div>
                    </div>
                  </div>

                  <p className="mt-3 text-white/40 text-sm">
                    {category} • {difficulty}
                  </p>
                </div>
              </div>
            </div>

            {/* 🔥 Filter Tabs */}
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

            {/* 🔥 Questions Review */}
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
                const skipped =
                  !answers[idx] && answers[idx] !== 0;
                const isCorrect =
                  userAns === q.correctAnswer;
                const generalExplanation =
                  getGeneralExplanation(q);
                const hasOptionExp =
                  anyOptionHasExplanation(q);

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
                    {/* Question & Status Badge */}
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="text-white font-bold text-lg">
                        Q{idx + 1}. {q.question}
                      </h3>

                      <span
                        className={`shrink-0 px-3 py-1 rounded-full text-xs font-bold ${
                          skipped
                            ? "bg-yellow-500/80 text-white"
                            : isCorrect
                            ? "bg-green-500/80 text-white"
                            : "bg-red-500/80 text-white"
                        }`}
                      >
                        {skipped
                          ? "⏭️ Skipped"
                          : isCorrect
                          ? "✅ Correct"
                          : "❌ Wrong"}
                      </span>
                    </div>

                    {/* Options with per-option explanations */}
                    <div className="mt-4 space-y-2">
                      {q.options?.map((opt, oi) => {
                        const optText =
                          typeof opt === "string"
                            ? opt
                            : opt.text;

                        const optCorrect =
                          optText === q.correctAnswer;

                        const optPick =
                          optText === userAns;

                        const optExplanation =
                          typeof opt === "object"
                            ? getOptionExplanation(opt)
                            : "";

                        let bg =
                          "bg-white/5 border-white/10";

                        let statusLabel = "";
                        let statusColor = "";

                        if (optCorrect) {
                          bg =
                            "bg-green-500/15 border-green-400/40";
                          statusLabel =
                            "✅ Correct Answer";
                          statusColor =
                            "text-green-300";
                        } else if (optPick) {
                          bg =
                            "bg-red-500/15 border-red-400/40";
                          statusLabel =
                            "❌ Your Answer";
                          statusColor =
                            "text-red-300";
                        }

                        return (
                          <div
                            key={oi}
                            className={`rounded-xl border ${bg} p-3 transition-all`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1">
                                <span className="text-white/90 font-medium">
                                  {optText}
                                </span>

                                {/* 🔥 OPTION EXPLANATION — YAHI CHAHIYE THA */}
                                {optExplanation && (
                                  <div className="mt-2 text-xs text-blue-300 border-t border-white/10 pt-2 leading-relaxed">
                                    {optExplanation}
                                  </div>
                                )}
                              </div>

                              {statusLabel && (
                                <span
                                  className={`shrink-0 text-xs font-bold ${statusColor}`}
                                >
                                  {statusLabel}
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* 🔥 GENERAL EXPLANATION — sirf tab show karo jab API se aayi ho aur options ki explanation se different ho */}
                    {generalExplanation && !hasOptionExp && (
                      <div className="mt-3 p-4 rounded-xl bg-blue-500/10 border border-blue-400/20 text-sm text-blue-200 leading-relaxed">
                        <b>📖 Additional Info:</b>{" "}
                        {generalExplanation}
                      </div>
                    )}

                    {/* 🔥 Jab options ki explanations hain toh koi extra box nahi — clean UI */}
                    {generalExplanation && hasOptionExp && (
                      <div className="mt-2 text-xs text-blue-300/60 text-right">
                        📖 See option explanations above
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* 🔥 Action Buttons */}
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
                }}
                className="flex-1 px-6 py-3 bg-white/10 text-white rounded-xl border border-white/20 hover:bg-white/20 font-bold transition"
              >
                🔄 New Test
              </button>

              <button
                onClick={saveResult}
                disabled={saving || saved}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-bold shadow-lg hover:shadow-purple-600/30 transition disabled:opacity-50"
              >
                {saving
                  ? "⏳ Saving..."
                  : saved
                  ? "✅ Saved"
                  : "💾 Save Result"}
              </button>

              {saved && savedResultId && (
                <button
                  onClick={() =>
                    navigate(
                      `/history-detail/${savedResultId}`
                    )
                  }
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

export default Test;