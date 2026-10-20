
import { useEffect, useState, useRef } from "react";
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

const REQUEST_TIMEOUT = 120000;
const MAX_RETRIES = 2;

function Interview() {
  const navigate = useNavigate();

  const [jobRole, setJobRole] = useState("");
  const [experience, setExperience] = useState("Fresher");
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
  const [statusMessage, setStatusMessage] = useState("");

  const [voiceNotes, setVoiceNotes] = useState({});
  const [recording, setRecording] = useState(false);
  const [recordingFor, setRecordingFor] = useState(null);
  const mediaRecorder = useRef(null);
  const audioChunks = useRef([]);

  const [confidence, setConfidence] = useState({});
  const [feedback, setFeedback] = useState({});

  const experienceLevels = [
    "Fresher",
    "Junior (0-2 yrs)",
    "Mid-Level (3-5 yrs)",
    "Senior (6-9 yrs)",
    "Lead (10+ yrs)",
  ];

  const formatTime = (secs) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return [h, m, s].map((n) => String(n).padStart(2, "0")).join(":");
  };

  const getOptionExplanation = (opt) => {
    if (typeof opt === "string") return "";
    return opt?.explanation || opt?.info || opt?.description || opt?.detail || "";
  };

  const getGeneralExplanation = (q) =>
    q?.explanation || q?.description || q?.detail || "";

  const anyOptionHasExplanation = (q) =>
    q.options?.some(
      (opt) =>
        typeof opt === "object" && Boolean(getOptionExplanation(opt))
    );

  // Interview request: retry only transient server errors/timeouts.
  const startInterview = async () => {
    if (loading) return;

    if (!jobRole.trim()) {
      alert("Please enter a Job Role before starting!");
      return;
    }

    setLoading(true);
    setStatusMessage(
      `Preparing ${QUESTION_COUNTS[difficulty]} ${difficulty} questions for ${jobRole.trim()}...`
    );

    try {
      const count = QUESTION_COUNTS[difficulty] || 30;
      let response = null;
      let lastError = null;

      for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
        try {
          if (attempt > 0) {
            setStatusMessage(
              `Server is busy. Retrying (${attempt}/${MAX_RETRIES})...`
            );
            await new Promise((resolve) =>
              setTimeout(resolve, attempt * 2500)
            );
          }

          response = await API.get("/api/ai-interview/generate", {
            params: {
              category: jobRole.trim(),
              difficulty,
              count,
              experience,
              type: "interview",
            },
            timeout: REQUEST_TIMEOUT,
          });

          lastError = null;
          break;
        } catch (error) {
          lastError = error;

          const status = error.response?.status;
          const transient =
            !status ||
            status === 408 ||
            status === 409 ||
            status === 429 ||
            status === 500 ||
            status === 502 ||
            status === 503 ||
            status === 504 ||
            error.code === "ECONNABORTED" ||
            error.code === "ETIMEDOUT";

          if (!transient || attempt === MAX_RETRIES) break;
        }
      }

      if (lastError) {
        const status = lastError.response?.status;
        const serverMessage = lastError.response?.data?.message;

        if (
          status === 503 ||
          status === 502 ||
          status === 504 ||
          lastError.code === "ECONNABORTED" ||
          lastError.code === "ETIMEDOUT"
        ) {
          throw new Error(
            serverMessage ||
              "Server ya AI service abhi busy hai. Thodi der baad dobara try karo."
          );
        }

        throw new Error(
          serverMessage || lastError.message || "Questions load nahi hue."
        );
      }

      const data = response?.data;
      const qs = Array.isArray(data?.questions) ? data.questions : [];

      if (!qs.length) {
        throw new Error(
          data?.message ||
            "Is category ke questions abhi available nahi hain. Dobara try karo."
        );
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

      if (qs.length < count) {
        setStatusMessage(
          `Note: ${count} requested the, lekin server ne ${qs.length} questions diye hain.`
        );
      }
    } catch (error) {
      console.error("Interview start error:", error);

      alert(
        error.message ||
          "Interview questions load nahi hue. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!started || finished) return;

    if (timeLeft <= 0) {
      setTimeUp(true);
      setFinished(true);
      return;
    }

    const timer = setTimeout(() => {
      setTimeLeft((previous) => previous - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [timeLeft, started, finished]);

  const goNext = () => {
    if (current < questions.length - 1) {
      setCurrent((value) => value + 1);
    } else {
      setFinished(true);
    }
  };

  const goPrev = () => {
    if (current > 0) setCurrent((value) => value - 1);
  };

  const submitAnswer = () => {
    if (!answers[current]) {
      alert("Pehle option select karo ya Skip dabao.");
      return;
    }
    goNext();
  };

  const skipQuestion = () => {
    setAnswers((previous) => {
      const next = { ...previous };
      delete next[current];
      return next;
    });
    goNext();
  };

  const startRecording = async (questionIndex) => {
    try {
      if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
        alert("Is browser mein voice recording supported nahi hai.");
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });

      const recorder = new MediaRecorder(stream);
      mediaRecorder.current = recorder;
      audioChunks.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunks.current.push(event.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(audioChunks.current, {
          type: recorder.mimeType || "audio/webm",
        });
        const url = URL.createObjectURL(blob);

        setVoiceNotes((previous) => ({
          ...previous,
          [questionIndex]: url,
        }));

        stream.getTracks().forEach((track) => track.stop());
      };

      recorder.start();
      setRecording(true);
      setRecordingFor(questionIndex);
    } catch (error) {
      console.error("Microphone error:", error);
      alert("Microphone access nahi mila. Browser permissions check karo.");
    }
  };

  const stopRecording = () => {
    if (
      mediaRecorder.current &&
      mediaRecorder.current.state === "recording"
    ) {
      mediaRecorder.current.stop();
      setRecording(false);
      setRecordingFor(null);
    }
  };

  const updateConfidence = (questionIndex, value) => {
    setConfidence((previous) => ({
      ...previous,
      [questionIndex]: value,
    }));

    const message =
      value >= 80
        ? "Excellent 💪"
        : value >= 60
        ? "Good 👍"
        : value >= 40
        ? "Average 👌"
        : "Needs Practice 📖";

    setFeedback((previous) => ({
      ...previous,
      [questionIndex]: message,
    }));
  };

  const finalScore = questions.reduce(
    (score, question, index) =>
      answers[index] && answers[index] === question.correctAnswer
        ? score + 1
        : score,
    0
  );

  const percentage = questions.length
    ? Math.round((finalScore / questions.length) * 100)
    : 0;

  const actualSkippedCount = questions.reduce(
    (count, _, index) =>
      answers[index] === undefined || answers[index] === null
        ? count + 1
        : count,
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
    { key: "all", label: "📋 All", count: questions.length },
    { key: "correct", label: "✅ Correct", count: finalScore },
    { key: "wrong", label: "❌ Wrong", count: actualWrongCount },
    { key: "skipped", label: "⏭️ Skipped", count: actualSkippedCount },
  ];

  const filteredIndexes = questions
    .map((question, index) => ({ question, index }))
    .filter(({ question, index }) => {
      const userAnswer = answers[index] || "";
      const skipped = !answers[index];
      const correct = userAnswer === question.correctAnswer;

      if (reviewFilter === "correct") return correct;
      if (reviewFilter === "wrong") return !skipped && !correct;
      if (reviewFilter === "skipped") return skipped;
      return true;
    })
    .map(({ index }) => index);

  const saveResult = async () => {
    if (saving || saved) return;

    setSaving(true);

    try {
      const user = JSON.parse(localStorage.getItem("user") || "null");

      if (!user?.id) {
        alert("Result save karne ke liye pehle login karo.");
        return;
      }

      const questionsWithAnswers = questions.map((question, index) => {
        const optionExplanations = {};

        if (Array.isArray(question.options)) {
          question.options.forEach((option, optionIndex) => {
            const explanation =
              typeof option === "object"
                ? getOptionExplanation(option)
                : "";

            if (explanation) {
              optionExplanations[optionIndex] = explanation;
            }
          });
        }

        return {
          question: question.question,
          options: question.options,
          correctAnswer: question.correctAnswer,
          explanation: getGeneralExplanation(question),
          optionExplanations,
          userAnswer: answers[index] || null,
          isCorrect: Boolean(
            answers[index] &&
              answers[index] === question.correctAnswer
          ),
          voiceNote: voiceNotes[index] || null,
          confidence: confidence[index] ?? null,
          feedback: feedback[index] || null,
        };
      });

      const confidenceValues = Object.values(confidence);

      const payload = {
        user: user.id,
        category: jobRole.trim(),
        difficulty,
        experience,
        type: "interview",
        totalQuestions: questions.length,
        score: finalScore,
        percentage,
        correctQuestions: finalScore,
        wrongQuestions: actualWrongCount,
        skippedQuestions: actualSkippedCount,
        performance,
        averageConfidence: confidenceValues.length
          ? Math.round(
              confidenceValues.reduce((total, value) => total + value, 0) /
                confidenceValues.length
            )
          : 0,
        questionsData: questionsWithAnswers,
      };

      const response = await API.post("/results", payload);

      setSaved(true);
      setSavedResultId(response.data?.result?._id || null);
    } catch (error) {
      console.error("SAVE ERROR =", error.response?.data || error.message);
      alert("Result save nahi hua. Please dobara try karo.");
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

  const resetInterview = () => {
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
    setStatusMessage("");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-indigo-950 to-slate-900">
      <header className="sticky top-0 z-50 border-b border-white/10 bg-white/5 backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <Link to="/dashboard" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-purple-500 to-blue-500">
              <span className="text-xs font-bold text-white">AI</span>
            </div>
            <span className="font-bold text-white">Interview</span>
          </Link>

          <div className="flex items-center gap-4 text-sm">
            <span className="text-white/50">
              {jobRole || "Interview"} — {difficulty}
            </span>
            <button
              onClick={() => navigate("/dashboard")}
              className="text-purple-300 transition hover:text-white"
            >
              ← Dashboard
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-4 py-8">
        {!started ? (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur-sm">
            <h1 className="text-3xl font-bold text-white">
              🎤 AI Interview
            </h1>
            <p className="mt-1 text-white/50">
              Practice with interview questions generated for your chosen role.
            </p>

            <div className="mt-6 space-y-5">
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-white/70">
                  💼 Job Role / Category <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Frontend Developer, Haryana GK, Python, Reasoning"
                  value={jobRole}
                  onChange={(event) => setJobRole(event.target.value)}
                  disabled={loading}
                  className="w-full rounded-xl border border-white/20 bg-white/10 p-3 text-white placeholder-white/30 focus:border-purple-400 focus:outline-none focus:ring-1 focus:ring-purple-400/50"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-semibold text-white/70">
                  📅 Experience Level
                </label>
                <select
                  className="w-full rounded-xl border border-white/20 bg-white/10 p-3 text-white"
                  value={experience}
                  onChange={(event) => setExperience(event.target.value)}
                  disabled={loading}
                >
                  {experienceLevels.map((level) => (
                    <option key={level} className="bg-gray-800" value={level}>
                      {level}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-semibold text-white/70">
                  Select Difficulty
                </label>
                <select
                  className="w-full rounded-xl border border-white/20 bg-white/10 p-3 text-white"
                  value={difficulty}
                  onChange={(event) => setDifficulty(event.target.value)}
                  disabled={loading}
                >
                  <option className="bg-gray-800" value="Easy">
                    🟢 Easy — {QUESTION_COUNTS.Easy} Qs
                  </option>
                  <option className="bg-gray-800" value="Medium">
                    🟡 Medium — {QUESTION_COUNTS.Medium} Qs
                  </option>
                  <option className="bg-gray-800" value="Hard">
                    🔴 Hard — {QUESTION_COUNTS.Hard} Qs
                  </option>
                </select>
              </div>

              <div className="rounded-xl border border-purple-400/20 bg-gradient-to-r from-purple-500/10 to-blue-500/10 p-4 text-sm">
                <p className="font-semibold text-white/80">
                  ⏰ Interview Time Limits:
                </p>
                <div className="mt-2 flex flex-wrap gap-4 text-white/60">
                  <span>🟢 Easy: 30 min (20 Qs)</span>
                  <span>🟡 Medium: 45 min (30 Qs)</span>
                  <span>🔴 Hard: 60 min (40 Qs)</span>
                </div>
                <p className="mt-2 text-white/50">
                  You can enter any subject or job role; a predefined category is not required.
                </p>
              </div>

              <button
                onClick={startInterview}
                disabled={loading}
                className="w-full rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 py-4 text-lg font-bold text-white transition-all hover:shadow-lg hover:shadow-purple-600/30 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? "⏳ Preparing..." : "🚀 Start Interview"}
              </button>

              {loading && (
                <div className="text-center">
                  <p className="animate-pulse text-center text-sm text-purple-300">
                    {statusMessage ||
                      `AI ${difficulty} questions bana raha hai for ${jobRole}...`}
                  </p>
                  <div className="mt-3 flex justify-center gap-1">
                    {[0, 150, 300].map((delay) => (
                      <div
                        key={delay}
                        className="h-2 w-2 animate-bounce rounded-full bg-purple-400"
                        style={{ animationDelay: `${delay}ms` }}
                      />
                    ))}
                  </div>
                </div>
              )}

              {!loading && statusMessage && (
                <p className="text-center text-sm text-amber-300">
                  {statusMessage}
                </p>
              )}
            </div>
          </div>
        ) : !finished ? (
          <>
            <div className="mb-6 flex flex-wrap gap-2">
              {questions.map((question, index) => (
                <button
                  key={index}
                  onClick={() => setCurrent(index)}
                  className={`h-9 w-9 rounded-lg text-xs font-bold transition-all ${
                    index === current
                      ? "scale-110 bg-gradient-to-br from-purple-500 to-blue-500 text-white shadow-lg"
                      : answers[index]
                      ? "border border-green-400/30 bg-green-500/30 text-green-300"
                      : "border border-white/10 bg-white/10 text-white/50 hover:bg-white/20"
                  }`}
                >
                  {index + 1}
                </button>
              ))}
            </div>

            <div className="mb-6 rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-white/50">
                      Question {current + 1}/{questions.length}
                    </span>
                    {confidence[current] !== undefined && (
                      <span className="rounded-full border border-blue-400/30 bg-blue-500/20 px-2 py-0.5 text-xs text-blue-300">
                        Confidence: {confidence[current]}%
                      </span>
                    )}
                  </div>
                  <h2 className="mt-1 text-xl font-bold leading-relaxed text-white">
                    {questions[current]?.question}
                  </h2>

                  {questions[current]?.codeSnippet && (
                    <pre className="mt-3 overflow-x-auto rounded-xl border border-white/10 bg-gray-900/80 p-4">
                      <code className="font-mono text-sm text-green-300">
                        {questions[current].codeSnippet}
                      </code>
                    </pre>
                  )}
                </div>

                <div className={`shrink-0 text-right font-mono text-2xl font-bold ${timerColor}`}>
                  ⏱ {formatTime(timeLeft)}
                </div>
              </div>

              <div className="mt-4">
                <div className="mb-1 flex justify-between text-xs text-white/40">
                  <span>Progress</span>
                  <span>
                    {Math.round(((current + 1) / questions.length) * 100)}%
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-purple-500 to-blue-500 transition-all duration-300"
                    style={{
                      width: `${((current + 1) / questions.length) * 100}%`,
                    }}
                  />
                </div>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-white/40">
                <span>✅ {Object.keys(answers).length} answered</span>
                <span>⏭️ {actualSkippedCount} skipped</span>
                {voiceNotes[current] && (
                  <span className="text-purple-300">🎤 Voice note recorded</span>
                )}
              </div>
            </div>

            <div className="mb-4 space-y-3">
              {questions[current]?.options?.map((option, index) => {
                const optionText =
                  typeof option === "string" ? option : option?.text || "";
                const selected = answers[current] || "";

                return (
                  <button
                    key={index}
                    onClick={() =>
                      setAnswers((previous) => ({
                        ...previous,
                        [current]: optionText,
                      }))
                    }
                    className={`w-full rounded-xl border p-4 text-left font-medium text-white transition-all ${
                      selected === optionText
                        ? "border-purple-400/60 bg-gradient-to-r from-purple-600/40 to-blue-600/40 shadow-lg"
                        : "border-white/10 bg-white/5 hover:border-white/30 hover:bg-white/10"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex h-6 w-6 items-center justify-center rounded-full border-2 text-xs font-bold ${
                          selected === optionText
                            ? "border-purple-400 bg-purple-500/30"
                            : "border-white/30"
                        }`}
                      >
                        {String.fromCharCode(65 + index)}
                      </div>
                      <span className="flex-1">{optionText}</span>
                      {selected === optionText && (
                        <span className="ml-auto text-sm text-purple-300">
                          ✓ Selected
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="mb-6 rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2">
                  {recording && recordingFor === current ? (
                    <button
                      onClick={stopRecording}
                      className="animate-pulse rounded-xl border border-red-400/30 bg-red-500/20 px-4 py-2 text-sm font-semibold text-red-300 hover:bg-red-500/30"
                    >
                      ⏹️ Stop Recording
                    </button>
                  ) : (
                    <button
                      onClick={() => startRecording(current)}
                      className="rounded-xl border border-white/10 bg-white/10 px-4 py-2 text-sm font-semibold text-white/70 transition hover:bg-white/20"
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

                <div className="flex min-w-[200px] flex-1 items-center gap-3">
                  <span className="shrink-0 text-xs text-white/50">
                    Confidence:
                  </span>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={confidence[current] ?? 50}
                    onChange={(event) =>
                      updateConfidence(current, Number(event.target.value))
                    }
                    className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-white/20 accent-purple-500"
                  />
                  <span className="w-10 text-right text-sm font-bold text-white">
                    {confidence[current] ?? 50}%
                  </span>
                </div>
              </div>

              {feedback[current] && (
                <div className="mt-2 text-xs text-purple-300/70">
                  💬 {feedback[current]}
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={goPrev}
                disabled={current === 0}
                className="rounded-xl border border-white/10 bg-white/10 px-6 py-3 font-semibold text-white transition hover:bg-white/20 disabled:opacity-30"
              >
                ← Previous
              </button>
              <button
                onClick={skipQuestion}
                className="rounded-xl border border-yellow-400/30 bg-yellow-500/20 px-6 py-3 font-semibold text-yellow-300 transition hover:bg-yellow-500/30"
              >
                ⏭️ Skip
              </button>
              <button
                onClick={submitAnswer}
                className="flex-1 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 px-6 py-3 font-bold text-white transition hover:shadow-lg hover:shadow-green-600/30"
              >
                {current === questions.length - 1
                  ? "🏁 Finish Interview"
                  : "✅ Submit & Next"}
              </button>
            </div>
          </>
        ) : (
          <>
            {timeUp && (
              <div className="mb-4 rounded-xl border border-red-400/30 bg-red-500/20 p-4 text-center font-semibold text-red-300">
                ⏰ Time's up! Auto-submitted.
              </div>
            )}

            {saved && (
              <div className="mb-4 rounded-xl border border-green-400/30 bg-green-500/20 p-4 text-center font-semibold text-green-300">
                ✅ Interview result saved successfully! Check your history.
              </div>
            )}

            <div className="mb-6 rounded-2xl border border-white/20 bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-700 p-8 shadow-2xl">
              <div className="flex flex-col items-center gap-8 md:flex-row">
                <div className="relative h-36 w-36 shrink-0">
                  <svg
                    className="h-36 w-36 -rotate-90 transform"
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
                      strokeDashoffset={2 * Math.PI * 52 * (1 - percentage / 100)}
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
                    Interview Complete 🎉
                  </h2>
                  <p className="mt-1 text-lg text-white/80">{performance}</p>

                  <div className="mt-4 flex flex-wrap justify-center gap-3 md:justify-start">
                    <div className="rounded-xl border border-green-400/30 bg-green-500/20 px-4 py-2 text-center">
                      <div className="text-xl font-bold text-green-300">
                        {finalScore}
                      </div>
                      <div className="text-xs text-green-200">✅ Correct</div>
                    </div>
                    <div className="rounded-xl border border-red-400/30 bg-red-500/20 px-4 py-2 text-center">
                      <div className="text-xl font-bold text-red-300">
                        {actualWrongCount}
                      </div>
                      <div className="text-xs text-red-200">❌ Wrong</div>
                    </div>
                    <div className="rounded-xl border border-yellow-400/30 bg-yellow-500/20 px-4 py-2 text-center">
                      <div className="text-xl font-bold text-yellow-300">
                        {actualSkippedCount}
                      </div>
                      <div className="text-xs text-yellow-200">⏭️ Skipped</div>
                    </div>

                    {Object.keys(confidence).length > 0 && (
                      <div className="rounded-xl border border-blue-400/30 bg-blue-500/20 px-4 py-2 text-center">
                        <div className="text-xl font-bold text-blue-300">
                          {Math.round(
                            Object.values(confidence).reduce(
                              (sum, value) => sum + value,
                              0
                            ) / Object.values(confidence).length
                          )}
                          %
                        </div>
                        <div className="text-xs text-blue-200">
                          🎯 Avg. Confidence
                        </div>
                      </div>
                    )}
                  </div>

                  <p className="mt-3 text-sm text-white/40">
                    {jobRole} • {experience} • {difficulty}
                  </p>
                </div>
              </div>
            </div>

            <div className="mb-6 flex flex-wrap gap-2">
              {filters.map((filter) => (
                <button
                  key={filter.key}
                  onClick={() => setReviewFilter(filter.key)}
                  className={`rounded-xl px-5 py-2.5 text-sm font-bold transition-all duration-200 ${
                    reviewFilter === filter.key
                      ? "scale-105 bg-white text-gray-900 shadow-lg"
                      : "border border-white/10 bg-white/10 text-white/70 hover:bg-white/20"
                  }`}
                >
                  {filter.label} ({filter.count})
                </button>
              ))}
            </div>

            <div className="space-y-4">
              {filteredIndexes.length === 0 && (
                <div className="py-16 text-center text-white/30">
                  <div className="mb-4 text-6xl">📭</div>
                  <p>No questions in this filter</p>
                </div>
              )}

              {filteredIndexes.map((index) => {
                const question = questions[index];
                const userAnswer = answers[index] || "";
                const skipped = !answers[index];
                const correct = userAnswer === question.correctAnswer;
                const generalExplanation = getGeneralExplanation(question);
                const hasOptionExplanation =
                  anyOptionHasExplanation(question);

                return (
                  <div
                    key={index}
                    className={`rounded-xl border-2 p-5 transition-all ${
                      skipped
                        ? "border-yellow-500/30 bg-yellow-500/5"
                        : correct
                        ? "border-green-500/30 bg-green-500/5"
                        : "border-red-500/30 bg-red-500/5"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="text-lg font-bold text-white">
                        Q{index + 1}. {question.question}
                      </h3>
                      <span
                        className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold ${
                          skipped
                            ? "bg-yellow-500/80 text-white"
                            : correct
                            ? "bg-green-500/80 text-white"
                            : "bg-red-500/80 text-white"
                        }`}
                      >
                        {skipped
                          ? "⏭️ Skipped"
                          : correct
                          ? "✅ Correct"
                          : "❌ Wrong"}
                      </span>
                    </div>

                    {(confidence[index] !== undefined ||
                      voiceNotes[index]) && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {confidence[index] !== undefined && (
                          <span className="rounded-full border border-blue-400/30 bg-blue-500/15 px-2 py-1 text-xs text-blue-300">
                            🎯 Confidence: {confidence[index]}%
                          </span>
                        )}
                        {feedback[index] && (
                          <span className="rounded-full border border-purple-400/30 bg-purple-500/15 px-2 py-1 text-xs text-purple-300">
                            💬 {feedback[index]}
                          </span>
                        )}
                        {voiceNotes[index] && (
                          <span className="rounded-full border border-teal-400/30 bg-teal-500/15 px-2 py-1 text-xs text-teal-300">
                            🎤 Voice note attached
                          </span>
                        )}
                      </div>
                    )}

                    <div className="mt-4 space-y-2">
                      {question.options?.map((option, optionIndex) => {
                        const optionText =
                          typeof option === "string"
                            ? option
                            : option?.text || "";
                        const isCorrectOption =
                          optionText === question.correctAnswer;
                        const isUserOption = optionText === userAnswer;
                        const optionExplanation =
                          typeof option === "object"
                            ? getOptionExplanation(option)
                            : "";

                        let background = "bg-white/5 border-white/10";
                        let label = "";
                        let labelColor = "";

                        if (isCorrectOption) {
                          background =
                            "bg-green-500/15 border-green-400/40";
                          label = "✅ Correct Answer";
                          labelColor = "text-green-300";
                        } else if (isUserOption) {
                          background = "bg-red-500/15 border-red-400/40";
                          label = "❌ Your Answer";
                          labelColor = "text-red-300";
                        }

                        return (
                          <div
                            key={optionIndex}
                            className={`rounded-xl border p-3 transition-all ${background}`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1">
                                <span className="font-medium text-white/90">
                                  {optionText}
                                </span>
                                {optionExplanation && (
                                  <div className="mt-2 border-t border-white/10 pt-2 text-xs leading-relaxed text-blue-300">
                                    {optionExplanation}
                                  </div>
                                )}
                              </div>
                              {label && (
                                <span
                                  className={`shrink-0 text-xs font-bold ${labelColor}`}
                                >
                                  {label}
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {generalExplanation && !hasOptionExplanation && (
                      <div className="mt-3 rounded-xl border border-blue-400/20 bg-blue-500/10 p-4 text-sm leading-relaxed text-blue-200">
                        <b>📖 Additional Info:</b> {generalExplanation}
                      </div>
                    )}

                    {generalExplanation && hasOptionExplanation && (
                      <div className="mt-2 text-right text-xs text-blue-300/60">
                        📖 See option explanations above
                      </div>
                    )}

                    {voiceNotes[index] && (
                      <div className="mt-3">
                        <audio controls className="h-10 w-full">
                          <source
                            src={voiceNotes[index]}
                            type="audio/webm"
                          />
                        </audio>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <button
                onClick={resetInterview}
                className="flex-1 rounded-xl border border-white/20 bg-white/10 px-6 py-3 font-bold text-white transition hover:bg-white/20"
              >
                🔄 New Interview
              </button>

              <button
                onClick={saveResult}
                disabled={saving || saved}
                className="flex-1 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 px-6 py-3 font-bold text-white shadow-lg transition hover:shadow-purple-600/30 disabled:opacity-50"
              >
                {saving ? "⏳ Saving..." : saved ? "✅ Saved" : "💾 Save Result"}
              </button>

              {saved && savedResultId && (
                <button
                  onClick={() =>
                    navigate(`/history-detail/${savedResultId}`)
                  }
                  className="flex-1 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-3 font-bold text-white shadow-lg transition hover:shadow-emerald-600/30"
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
