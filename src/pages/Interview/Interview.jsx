import { useEffect, useState } from "react";
import API from "../../services/api";
import { useNavigate } from "react-router-dom";

// 🔥 FALLBACK — API fail ho jaye to bhi categories kabhi khali nahi hongi
const FALLBACK_CATEGORIES = [
  "Haryana GK",
  "General Knowledge",
  "Reasoning",
  "Current Affairs",
  "Indian History",
  "Indian Polity",
  "Geography",
  "Science",
  "Computer",
  "Python",
  "Cyber Security",
  "AI & Machine Learning",
  "SSC",
  "UPSC",
  "Railway",
  "Banking",
  "Defence",
  "General Hindi",
  "General Science",
  "Mathematics"
];

function Interview() {
  const navigate = useNavigate();

  const [categories, setCategories] = useState([]);
  const [category, setCategory] = useState("");
  const [difficulty, setDifficulty] = useState("Medium");
  const [questions, setQuestions] = useState([]);
  const [started, setStarted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [current, setCurrent] = useState(0);
  // 🔥 { questionIndex: selectedOptionText } — piche jaa kar badal bhi sakte ho
  const [answers, setAnswers] = useState({});
  // 🔥 test khatam → review screen (sahi/glat sab yahin dikhega)
  const [finished, setFinished] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30);
  const [saving, setSaving] = useState(false);

  // ---------- CATEGORIES ----------
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const res = await API.get("/interview-session/categories");
        const list = res.data?.categories || [];
        setCategories(list.length ? list : FALLBACK_CATEGORIES);
      } catch (error) {
        console.log("Category load error:", error);
        setCategories(FALLBACK_CATEGORIES);
      }
    };
    loadCategories();
  }, []);

  // ---------- START ----------
  const startInterview = async () => {
    if (!category) {
      alert("Select Category");
      return;
    }
    setLoading(true);
    try {
      const res = await API.get("/ai-interview/generate", {
        params: { category, difficulty, count: 50 },
      });
      const questionList = res.data.questions || [];
      if (!questionList.length) {
        alert("Is category me questions nahi mile — bank ban raha hai, 1 min baad try karo");
        return;
      }
      setQuestions(questionList);
      setAnswers({});
      setCurrent(0);
      setFinished(false);
      setTimeLeft(30);
      setStarted(true);
    } catch (error) {
      console.log(error);
      alert(error.response?.data?.message || "Questions load nahi hue — thodi der baad try karo");
    } finally {
      setLoading(false);
    }
  };

  // abhi wale question ka selected option (answers se derive)
  const selected = answers[current] || "";

  // ---------- TIMER (timeout → bina feedback aage, last par review) ----------
  useEffect(() => {
    if (!started || finished) return;
    if (timeLeft <= 0) {
      if (current < questions.length - 1) {
        setCurrent((c) => c + 1);
        setTimeLeft(30);
      } else {
        setFinished(true);
      }
      return;
    }
    const t = setTimeout(() => setTimeLeft((p) => p - 1), 1000);
    return () => clearTimeout(t);
  }, [timeLeft, started, finished, current, questions.length]);

  // ---------- NAVIGATION ----------
  const goNext = () => {
    if (current < questions.length - 1) {
      setCurrent((c) => c + 1);
      setTimeLeft(30);
    } else {
      setFinished(true); // last question → review
    }
  };

  const goPrev = () => {
    if (current > 0) {
      setCurrent((c) => c - 1);
      setTimeLeft(30);
    }
  };

  // ---------- SUBMIT (answer select karke aage) ----------
  const submitAnswer = () => {
    if (!selected) {
      alert("Pehle option select karo (ya Skip dabao)");
      return;
    }
    goNext();
  };

  // ---------- SKIP (koi popup nahi — answer clear + aage) ----------
  const skipQuestion = () => {
    setAnswers((prev) => {
      const next = { ...prev };
      delete next[current]; // skip → answer hatao → pakka galat count hoga
      return next;
    });
    goNext();
  };

  // ---------- SCORE (review par calculate) ----------
  const finalScore = questions.reduce(
    (s, q, i) => (answers[i] && answers[i] === q.correctAnswer ? s + 1 : s),
    0
  );
  const percentage = questions.length
    ? Math.round((finalScore / questions.length) * 100)
    : 0;
  const skippedCount = questions.filter((_, i) => !answers[i]).length;
  const performance =
    finalScore >= questions.length * 0.8
      ? "Excellent Performance 🏆"
      : finalScore >= questions.length * 0.5
        ? "Good Performance 👍"
        : "Need More Practice 📖";

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
      <div className="max-w-3xl mx-auto bg-white p-8 rounded-xl shadow">
        <h1 className="text-3xl font-bold">AI Interview</h1>

        {!started ? (
          /* ================= START SCREEN ================= */
          <>
            <select
              className="w-full border p-3 mt-6 rounded"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="">Select Category</option>
              {categories.map((cat, index) => (
                <option key={index} value={cat}>
                  {cat}
                </option>
              ))}
            </select>

            <select
              className="w-full border p-3 mt-4 rounded"
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
            >
              <option>Easy</option>
              <option>Medium</option>
              <option>Hard</option>
            </select>

            <button
              onClick={startInterview}
              disabled={loading}
              className="mt-5 bg-blue-600 text-white px-6 py-3 rounded"
            >
              {loading ? "Generating..." : "Start Interview"}
            </button>

            {loading && (
              <p className="mt-4 text-blue-600 font-semibold">
                ⏳ AI 50 {difficulty} questions bana raha hai... 30-90 second lag sakte hain
              </p>
            )}
          </>
        ) : finished ? (
          /* ================= REVIEW SCREEN (test ke baad) ================= */
          <>
            <div className="mt-6 bg-blue-50 border border-blue-200 rounded p-4 text-center">
              <h2 className="text-2xl font-bold">Test Complete 🎉</h2>
              <p className="mt-2 text-lg">
                Score: <b>{finalScore}/{questions.length}</b> | Percentage: <b>{percentage}%</b>
              </p>
              <p className="mt-1 font-semibold">{performance}</p>
              <p className="mt-1 text-sm text-gray-600">
                ✅ Sahi: {finalScore} | ❌ Galat: {questions.length - finalScore - skippedCount} | ⏭️ Skipped: {skippedCount}
              </p>
            </div>

            <div className="mt-6 space-y-6">
              {questions.map((q, i) => {
                const userAns = answers[i] || "";
                const skipped = !userAns;
                const isCorrect = userAns === q.correctAnswer;
                const correctOption = q.options?.find((o) => o.text === q.correctAnswer);
                const explanation = correctOption?.info || q.options?.[0]?.info || "";
                return (
                  <div key={i} className="border rounded p-4">
                    <p className="font-bold">
                      Q{i + 1}. {q.question}
                    </p>
                    <p className="mt-1">
                      {skipped ? (
                        <span className="text-yellow-600 font-semibold">⏭️ Skipped — galat count hua</span>
                      ) : isCorrect ? (
                        <span className="text-green-600 font-semibold">✅ Sahi jawab</span>
                      ) : (
                        <span className="text-red-600 font-semibold">❌ Galat jawab</span>
                      )}
                    </p>
                    <div className="mt-2 space-y-2">
                      {q.options?.map((opt, oi) => {
                        const optCorrect = opt.text === q.correctAnswer;
                        const optPick = opt.text === userAns;
                        let cls = "p-2 border rounded text-sm";
                        if (optCorrect) cls += " bg-green-100 border-green-500";
                        else if (optPick) cls += " bg-red-100 border-red-500";
                        else cls += " bg-gray-50";
                        return (
                          <div key={oi} className={cls}>
                            {opt.text}
                            {optCorrect && " ✅ (Sahi answer)"}
                            {optPick && !optCorrect && " ❌ (Aapka answer)"}
                          </div>
                        );
                      })}
                    </div>
                    {explanation && (
                      <p className="mt-2 text-sm text-gray-600">
                        📖 Explanation: {explanation}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>

            <button
              onClick={saveResult}
              disabled={saving}
              className="mt-6 w-full bg-blue-600 text-white px-6 py-3 rounded font-bold"
            >
              {saving ? "Saving..." : "Save Result & Result Page Dekho"}
            </button>
          </>
        ) : (
          /* ================= QUESTION SCREEN ================= */
          <>
            {/* Question numbers — kahin bhi jump karo */}
            <div className="mt-6 flex flex-wrap gap-2">
              {questions.map((q, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setCurrent(i);
                    setTimeLeft(30);
                  }}
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

            <p className="mt-4">
              Question {current + 1}/{questions.length}
            </p>
            <p className="mt-2 text-red-600 font-bold">
              ⏱ Time Left: {timeLeft} sec
            </p>

            <h2 className="text-xl font-bold mt-4">
              {questions[current]?.question}
            </h2>

            <div className="mt-5 space-y-3">
              {questions[current]?.options?.map((option, index) => (
                <button
                  key={index}
                  onClick={() =>
                    setAnswers((prev) => ({ ...prev, [current]: option.text }))
                  }
                  className={`block w-full text-left p-3 border rounded ${
                    selected === option.text
                      ? "bg-blue-100 border-blue-600"
                      : ""
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
              <button
                onClick={skipQuestion}
                className="bg-yellow-500 text-white px-6 py-3 rounded"
              >
                Skip
              </button>
              <button
                onClick={submitAnswer}
                className="bg-green-600 text-white px-6 py-3 rounded"
              >
                {current === questions.length - 1 ? "Finish" : "Submit"}
              </button>
            </div>

            <p className="mt-3 text-sm text-gray-500">
              💡 Test khatam hone ke baad hi pata chalega kaun se sahi / galat hain.
              Skip kiye hue questions galat count honge — pichle question par jaa kar badal sakte ho.
            </p>
          </>
        )}
      </div>
    </div>
  );
}

export default Interview;