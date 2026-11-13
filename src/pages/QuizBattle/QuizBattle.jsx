
import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import API from "../../services/quizBattleApi";

const getToken = () => localStorage.getItem("token");

const getHeaders = () => ({
  Authorization: `Bearer ${getToken()}`,
});

const getBattleData = (response) =>
  response?.data?.battle ||
  response?.data?.data?.battle ||
  response?.data?.data ||
  response?.data;

const getOptionText = (option) => {
  if (typeof option === "string") return option;

  return (
    option?.text ||
    option?.value ||
    option?.label ||
    option?.option ||
    ""
  );
};

const getQuestionText = (question) =>
  question?.question ||
  question?.question_en ||
  question?.text ||
  question?.title ||
  "Question";

function QuizBattle() {
  const navigate = useNavigate();
  const { roomCode } = useParams();

  const [category, setCategory] = useState("Haryana GK");
  const [difficulty, setDifficulty] = useState("Medium");
  const [totalQuestions, setTotalQuestions] = useState(10);
  const [timeLimitMinutes, setTimeLimitMinutes] = useState(10);
  const [joinCode, setJoinCode] = useState("");

  const [battle, setBattle] = useState(null);
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(Boolean(roomCode));
  const [error, setError] = useState("");
  const [answers, setAnswers] = useState({});
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const autoSubmitRef = useRef(false);

  const me = battle?.me || battle?.myParticipant || null;
  const participants = battle?.participants || [];
  const questions = battle?.questions || [];
  const results = battle?.results || null;

  const myStatus = me?.status || "";
  const isStarted = myStatus === "started";
  const isSubmitted =
    myStatus === "submitted" || myStatus === "expired";

  const getBattle = useCallback(async () => {
    if (!roomCode) return null;

    const response = await API.get(
      `/quiz-battles/${roomCode}`,
      { headers: getHeaders() }
    );

    const data = getBattleData(response);
    setBattle(data);

    if (data?.me?.remainingSeconds !== undefined) {
      setRemainingSeconds(data.me.remainingSeconds);
    }

    return data;
  }, [roomCode]);

  useEffect(() => {
    if (!roomCode) return;

    let active = true;

    const load = async () => {
      try {
        setPageLoading(true);
        setError("");

        const response = await API.get(
          `/quiz-battles/${roomCode}`,
          { headers: getHeaders() }
        );

        if (!active) return;

        const data = getBattleData(response);
        setBattle(data);

        if (data?.me?.remainingSeconds !== undefined) {
          setRemainingSeconds(data.me.remainingSeconds);
        }
      } catch (err) {
        if (active) {
          setError(
            err.response?.data?.message ||
            "Battle load nahi ho payi."
          );
        }
      } finally {
        if (active) setPageLoading(false);
      }
    };

    load();

    return () => {
      active = false;
    };
  }, [roomCode]);

  // Waiting room aur opponent progress refresh
  useEffect(() => {
    if (!roomCode || !battle) return;

    const interval = setInterval(() => {
      getBattle().catch(() => {});
    }, 4000);

    return () => clearInterval(interval);
  }, [roomCode, battle, getBattle]);

  // Individual timer
  useEffect(() => {
    if (!isStarted || isSubmitted) return;

    const interval = setInterval(() => {
      setRemainingSeconds((previous) =>
        Math.max(0, previous - 1)
      );
    }, 1000);

    return () => clearInterval(interval);
  }, [isStarted, isSubmitted]);

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;

    return `${String(minutes).padStart(2, "0")}:${String(
      secs
    ).padStart(2, "0")}`;
  };

  const createBattle = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);
      setError("");

      const response = await API.post(
        "/quiz-battles/create",
        {
          category,
          difficulty,
          totalQuestions: Number(totalQuestions),
          timeLimitMinutes: Number(timeLimitMinutes),
        },
        { headers: getHeaders() }
      );

      const data = getBattleData(response);
      const code =
        data?.roomCode ||
        response?.data?.roomCode;

      if (!code) {
        throw new Error("Room code response mein nahi mila.");
      }

      navigate(`/quiz-battle/${code}`);
    } catch (err) {
      setError(
        err.response?.data?.message ||
        err.message ||
        "Battle create nahi hui."
      );
    } finally {
      setLoading(false);
    }
  };

  const joinBattle = async (e) => {
    e.preventDefault();

    const code = joinCode.trim().toUpperCase();

    if (!code) {
      setError("Room code enter karo.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      await API.post(
        `/quiz-battles/${code}/join`,
        {},
        { headers: getHeaders() }
      );

      navigate(`/quiz-battle/${code}`);
    } catch (err) {
      setError(
        err.response?.data?.message ||
        "Battle join nahi hui."
      );
    } finally {
      setLoading(false);
    }
  };

  const startBattle = async () => {
    try {
      setLoading(true);
      setError("");

      await API.post(
        `/quiz-battles/${roomCode}/start`,
        {},
        { headers: getHeaders() }
      );

      await getBattle();
    } catch (err) {
      setError(
        err.response?.data?.message ||
        "Quiz start nahi hua."
      );
    } finally {
      setLoading(false);
    }
  };

  const submitBattle = useCallback(async () => {
    if (submitting || autoSubmitRef.current || !roomCode) return;

    autoSubmitRef.current = true;
    setSubmitting(true);

    try {
      await API.post(
        `/quiz-battles/${roomCode}/submit`,
        { answers },
        { headers: getHeaders() }
      );

      await getBattle();
    } catch (err) {
      autoSubmitRef.current = false;
      setError(
        err.response?.data?.message ||
        "Answers submit nahi ho paaye."
      );
    } finally {
      setSubmitting(false);
    }
  }, [answers, getBattle, roomCode, submitting]);

  // Time over hone par automatic submit
  useEffect(() => {
    if (
      isStarted &&
      remainingSeconds === 0 &&
      !autoSubmitRef.current
    ) {
      submitBattle();
    }
  }, [isStarted, remainingSeconds, submitBattle]);

  const selectAnswer = (questionIndex, option) => {
    setAnswers((previous) => ({
      ...previous,
      [String(questionIndex)]: option,
    }));
  };

  const copyRoomCode = async () => {
    try {
      await navigator.clipboard.writeText(roomCode);
      alert("Room code copied!");
    } catch {
      alert(`Room Code: ${roomCode}`);
    }
  };

  const playerName = (participant) =>
    participant?.user?.name ||
    participant?.user?.fullName ||
    participant?.user?.email ||
    "Student";

  const getResultForMe = () => {
    if (!results) return null;

    if (Array.isArray(results.participants)) {
      return results.participants.find(
        (item) =>
          String(item.user?._id || item.user) ===
          String(me?.user?._id || me?.user)
      );
    }

    return results.me || results;
  };

  // HOME SCREEN
  if (!roomCode) {
    return (
      <div className="min-h-screen bg-slate-950 text-white p-5">
        <div className="max-w-4xl mx-auto py-10">
          <button
            onClick={() => navigate("/dashboard")}
            className="text-slate-400 hover:text-white mb-8"
          >
            ← Dashboard
          </button>

          <div className="text-center mb-10">
            <div className="text-5xl mb-4">⚔️</div>
            <h1 className="text-3xl md:text-4xl font-bold">
              Private Quiz Battle
            </h1>
            <p className="text-slate-400 mt-3">
              Apne friend ke saath same questions ka quiz do.
            </p>
            <p className="text-sm text-blue-400 mt-2">
              Dono students ka timer independently chalega.
            </p>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-300 p-3 rounded-lg mb-5">
              {error}
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-6">
            <form
              onSubmit={createBattle}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-6"
            >
              <h2 className="text-xl font-bold mb-5">
                Create Battle
              </h2>

              <label className="block text-sm text-slate-300 mb-2">
                Category
              </label>
              <input
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                required
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 mb-4"
                placeholder="Enter category"
              />

              <label className="block text-sm text-slate-300 mb-2">
                Difficulty
              </label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 mb-4"
              >
                <option>Easy</option>
                <option>Medium</option>
                <option>Hard</option>
              </select>

              <label className="block text-sm text-slate-300 mb-2">
                Total Questions
              </label>
              <select
                value={totalQuestions}
                onChange={(e) =>
                  setTotalQuestions(Number(e.target.value))
                }
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 mb-4"
              >
                <option value={5}>5 Questions</option>
                <option value={10}>10 Questions</option>
                <option value={20}>20 Questions</option>
                <option value={30}>30 Questions</option>
                <option value={50}>50 Questions</option>
              </select>

              <label className="block text-sm text-slate-300 mb-2">
                Time Limit
              </label>
              <select
                value={timeLimitMinutes}
                onChange={(e) =>
                  setTimeLimitMinutes(Number(e.target.value))
                }
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 mb-6"
              >
                <option value={5}>5 Minutes</option>
                <option value={10}>10 Minutes</option>
                <option value={15}>15 Minutes</option>
                <option value={30}>30 Minutes</option>
                <option value={60}>60 Minutes</option>
              </select>

              <button
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg py-3 font-semibold"
              >
                {loading ? "Creating..." : "Create Battle"}
              </button>
            </form>

            <form
              onSubmit={joinBattle}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-6"
            >
              <h2 className="text-xl font-bold mb-5">
                Join Battle
              </h2>

              <p className="text-slate-400 text-sm mb-5">
                Apne friend se mila hua room code enter karo.
              </p>

              <label className="block text-sm text-slate-300 mb-2">
                Room Code
              </label>

              <input
                value={joinCode}
                onChange={(e) =>
                  setJoinCode(e.target.value.toUpperCase())
                }
                required
                maxLength={12}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 mb-6 uppercase tracking-widest"
                placeholder="ENTER ROOM CODE"
              />

              <button
                disabled={loading}
                className="w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-50 rounded-lg py-3 font-semibold"
              >
                {loading ? "Joining..." : "Join Battle"}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // LOADING
  if (pageLoading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        Loading Battle...
      </div>
    );
  }

  if (!battle) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-5">
        <p className="text-red-400 mb-5">
          {error || "Battle nahi mili."}
        </p>
        <button
          onClick={() => navigate("/quiz-battle")}
          className="bg-blue-600 px-5 py-3 rounded-lg"
        >
          Back
        </button>
      </div>
    );
  }

  // RESULT SCREEN
  if (results) {
    const myResult = getResultForMe();
    const winner = results.winner;

    return (
      <div className="min-h-screen bg-slate-950 text-white p-5">
        <div className="max-w-3xl mx-auto py-12">
          <div className="text-center mb-8">
            <div className="text-6xl mb-4">🏆</div>
            <h1 className="text-3xl font-bold">
              Battle Result
            </h1>
            <p className="text-slate-400 mt-2">
              Room: {roomCode}
            </p>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <h2 className="text-xl font-bold mb-5 text-center">
              {winner?.user
                ? `${playerName(winner)} Won!`
                : winner === "draw"
                ? "Match Draw!"
                : "Battle Completed"}
            </h2>

            {myResult && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-center">
                <div className="bg-slate-800 rounded-xl p-4">
                  <div className="text-2xl font-bold text-green-400">
                    {myResult.correct ?? 0}
                  </div>
                  <div className="text-slate-400 text-sm">Correct</div>
                </div>

                <div className="bg-slate-800 rounded-xl p-4">
                  <div className="text-2xl font-bold text-red-400">
                    {myResult.wrong ?? 0}
                  </div>
                  <div className="text-slate-400 text-sm">Wrong</div>
                </div>

                <div className="bg-slate-800 rounded-xl p-4">
                  <div className="text-2xl font-bold">
                    {myResult.skipped ?? 0}
                  </div>
                  <div className="text-slate-400 text-sm">Skipped</div>
                </div>

                <div className="bg-slate-800 rounded-xl p-4">
                  <div className="text-2xl font-bold text-blue-400">
                    {myResult.score ?? 0}
                  </div>
                  <div className="text-slate-400 text-sm">Score</div>
                </div>

                <div className="bg-slate-800 rounded-xl p-4">
                  <div className="text-2xl font-bold">
                    {myResult.percentage ?? 0}%
                  </div>
                  <div className="text-slate-400 text-sm">Percentage</div>
                </div>

                <div className="bg-slate-800 rounded-xl p-4">
                  <div className="text-2xl font-bold">
                    {formatTime(myResult.timeTakenSeconds ?? 0)}
                  </div>
                  <div className="text-slate-400 text-sm">Time Taken</div>
                </div>
              </div>
            )}

            <div className="mt-6 space-y-3">
              {(results.participants || []).map((player, index) => (
                <div
                  key={player.user?._id || player.user || index}
                  className="bg-slate-800 rounded-lg p-4 flex justify-between"
                >
                  <span>{playerName(player)}</span>
                  <span className="font-bold">
                    {player.score ?? 0} points
                  </span>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={() => navigate("/quiz-battle")}
            className="w-full mt-6 bg-blue-600 hover:bg-blue-700 rounded-lg py-3 font-semibold"
          >
            Back to Quiz Battle
          </button>
        </div>
      </div>
    );
  }

  // WAITING ROOM
  if (participants.length < 2 && !isStarted) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-5">
        <div className="max-w-lg w-full bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center">
          <div className="text-5xl mb-4">⏳</div>
          <h1 className="text-2xl font-bold">Waiting Room</h1>
          <p className="text-slate-400 mt-2">
            Apne friend ko room code share karo.
          </p>

          <div className="bg-slate-800 rounded-xl p-5 my-6">
            <p className="text-xs text-slate-400 mb-2">ROOM CODE</p>
            <div className="text-3xl font-bold tracking-widest">
              {roomCode}
            </div>
            <button
              onClick={copyRoomCode}
              className="text-blue-400 text-sm mt-3"
            >
              Copy Room Code
            </button>
          </div>

          <p className="text-slate-300">
            {participants.length}/2 Students Joined
          </p>

          {error && (
            <p className="text-red-400 text-sm mt-4">{error}</p>
          )}

          <p className="text-slate-500 text-sm mt-5">
            Friend join karte hi yahan update ho jayega.
          </p>
        </div>
      </div>
    );
  }

  // WAITING FOR OPPONENT TO FINISH
  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-5">
        <div className="max-w-lg w-full bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center">
          <div className="text-5xl mb-4">✅</div>
          <h1 className="text-2xl font-bold">Quiz Submitted!</h1>
          <p className="text-slate-400 mt-3">
            Aapke answers submit ho gaye hain.
          </p>
          <p className="text-blue-400 mt-4">
            Opponent ke finish karne ka wait ho raha hai...
          </p>
          <p className="text-slate-500 text-sm mt-4">
            Result automatically show ho jayega.
          </p>
        </div>
      </div>
    );
  }

  // QUIZ SCREEN
  const question = questions[currentQuestion];
  const options = question?.options || [];

  return (
    <div className="min-h-screen bg-slate-950 text-white p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
          <div>
            <h1 className="text-xl font-bold">Private Quiz Battle</h1>
            <p className="text-slate-400 text-sm">
              Room: {roomCode}
            </p>
          </div>

          <div className="bg-slate-900 border border-slate-700 rounded-xl px-5 py-3">
            <p className="text-xs text-slate-400">YOUR TIMER</p>
            <p
              className={`text-2xl font-bold ${
                remainingSeconds <= 60
                  ? "text-red-400"
                  : "text-green-400"
              }`}
            >
              {formatTime(remainingSeconds)}
            </p>
          </div>
        </div>

        <div className="bg-slate-900 rounded-xl p-4 mb-5 flex justify-between">
          <span className="text-slate-300">
            Question {currentQuestion + 1} / {questions.length}
          </span>
          <span className="text-slate-300">
            Answered: {Object.keys(answers).length}
          </span>
        </div>

        {error && (
          <div className="bg-red-500/10 text-red-300 p-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        {question ? (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 md:p-8">
            <h2 className="text-lg md:text-xl font-semibold leading-relaxed mb-7">
              {getQuestionText(question)}
            </h2>

            <div className="space-y-3">
              {options.map((option, index) => {
                const optionText = getOptionText(option);
                const selected =
                  answers[String(currentQuestion)] === optionText;

                return (
                  <button
                    key={index}
                    type="button"
                    onClick={() =>
                      selectAnswer(currentQuestion, optionText)
                    }
                    className={`w-full text-left p-4 rounded-xl border transition ${
                      selected
                        ? "border-blue-500 bg-blue-500/20"
                        : "border-slate-700 bg-slate-800 hover:border-slate-500"
                    }`}
                  >
                    <span className="font-bold mr-3">
                      {String.fromCharCode(65 + index)}.
                    </span>
                    {optionText}
                  </button>
                );
              })}
            </div>

            <div className="flex justify-between gap-3 mt-8">
              <button
                disabled={currentQuestion === 0}
                onClick={() =>
                  setCurrentQuestion((previous) => previous - 1)
                }
                className="px-5 py-3 rounded-lg bg-slate-700 disabled:opacity-30"
              >
                Previous
              </button>

              {currentQuestion < questions.length - 1 ? (
                <button
                  onClick={() =>
                    setCurrentQuestion((previous) => previous + 1)
                  }
                  className="px-5 py-3 rounded-lg bg-blue-600 hover:bg-blue-700"
                >
                  Next
                </button>
              ) : (
                <button
                  disabled={submitting}
                  onClick={submitBattle}
                  className="px-5 py-3 rounded-lg bg-green-600 hover:bg-green-700 disabled:opacity-50"
                >
                  {submitting ? "Submitting..." : "Submit Quiz"}
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-slate-900 rounded-xl p-6 text-center">
            Questions load nahi hue. Page refresh karke dekho.
          </div>
        )}

        <div className="mt-5 text-center text-slate-500 text-sm">
          Aapka timer aapke quiz start karne ke baad hi chalta hai.
        </div>
      </div>
    </div>
  );
}

export default QuizBattle;
