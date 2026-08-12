import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import API from "../../services/api";

const AI_BASE = "/ai-interview/generate";

function Test() {
  const { category } = useParams();
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selected, setSelected] = useState(null);
  const [revealed, setRevealed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [score, setScore] = useState(0);
  const [skipped, setSkipped] = useState(0);
  const [finished, setFinished] = useState(false);

  const loadQuestions = async () => {
    setLoading(true);
    setError("");
    setQuestions([]);
    setCurrentIndex(0);
    setSelected(null);
    setRevealed(false);
    setScore(0);
    setSkipped(0);
    setFinished(false);
    try {
      // 🔥 total: 50 bhejo — backend ko 50 questions generate karne ko bolega
      const res = await API.get(AI_BASE, {
        params: { category, difficulty: "Medium", total: 50 }
      });
      setQuestions(res.data.questions || []);
    } catch (err) {
      setError(err.response?.data?.message || "Questions generate nahi ho paye");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQuestions();
  }, [category]);

  const goNext = () => {
    if (currentIndex + 1 >= questions.length) {
      setFinished(true);
    } else {
      setCurrentIndex((i) => i + 1);
      setSelected(null);
      setRevealed(false);
    }
  };

  const handleSelect = (optionText) => {
    if (revealed) return;
    setSelected(optionText);
    setRevealed(true);
    if (optionText === questions[currentIndex].correctAnswer) {
      setScore((s) => s + 1);
    }
  };

  const handleSkip = () => {
    if (revealed) return;
    setSkipped((s) => s + 1);
    goNext();
  };

  // ===== LOADING =====
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-lg p-10 text-center">
          <p className="text-xl font-bold text-blue-600">AI 50 questions bana raha hai...</p>
          <p className="text-gray-500 mt-2">30-60 second lag sakte hain (7 batches)</p>
        </div>
      </div>
    );
  }

  // ===== ERROR =====
  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-lg p-10 text-center">
          <p className="text-red-600 font-bold">{error}</p>
          <button
            onClick={loadQuestions}
            className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // ===== EMPTY =====
  if (questions.length === 0) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-lg p-10 text-center">
          <p className="text-red-600 font-bold">Koi questions nahi aaye</p>
          <button
            onClick={loadQuestions}
            className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // ===== FINISHED =====
  if (finished) {
    const attempted = questions.length - skipped;
    const percentage = ((score / questions.length) * 100).toFixed(2);
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-lg p-10 text-center max-w-md">
          <h1 className="text-2xl font-bold">Test Complete 🎉</h1>
          <p className="mt-4 text-xl">
            Score: <b>{score}</b>/{questions.length}
          </p>
          <p className="text-gray-600 mt-1">Percentage: {percentage}%</p>
          <p className="text-gray-500 mt-1">
            Attempted: {attempted} | Skipped: {skipped}
          </p>
          <button
            onClick={loadQuestions}
            className="mt-6 bg-purple-600 text-white px-8 py-3 rounded-lg font-bold"
          >
            Naye Questions (fresh set)
          </button>
        </div>
      </div>
    );
  }

  // ===== MAIN QUESTION =====
  const current = questions[currentIndex];
  const total = questions.length;

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-xl shadow p-4 mb-4 flex items-center justify-between">
          <p className="font-bold">
            Question {currentIndex + 1} of {total}
          </p>
          <p className="text-gray-600">Category: {category}</p>
        </div>

        <div className="w-full bg-gray-200 rounded-full h-3 mb-6">
          <div
            className="bg-blue-600 h-3 rounded-full transition-all"
            style={{ width: `${(currentIndex / total) * 100}%` }}
          />
        </div>

        <div className="bg-white rounded-xl shadow-lg p-8">
          <h2 className="text-xl font-bold">
            Q{currentIndex + 1}. {current.question}
          </h2>

          <div className="mt-6 space-y-3">
            {current.options?.map((option, i) => {
              let btnClass = "block w-full text-left p-4 border rounded-lg ";

              if (revealed) {
                if (option.text === current.correctAnswer) {
                  btnClass += "bg-green-100 border-green-600";
                } else if (selected === option.text) {
                  btnClass += "bg-red-100 border-red-600";
                } else {
                  btnClass += "bg-gray-50 border-gray-200";
                }
              } else if (selected === option.text) {
                btnClass += "bg-blue-100 border-blue-600";
              } else {
                btnClass += "hover:bg-gray-50";
              }

              return (
                <button
                  key={i}
                  onClick={() => handleSelect(option.text)}
                  disabled={revealed}
                  className={btnClass}
                >
                  <b>{String.fromCharCode(65 + i)}.</b> {option.text}
                </button>
              );
            })}
          </div>

          {/* Skip button — sirf tab tak jab answer reveal nahi hua */}
          {!revealed && (
            <button
              onClick={handleSkip}
              className="mt-4 w-full bg-gray-500 text-white px-6 py-2 rounded-lg font-bold"
            >
              Skip Question →
            </button>
          )}

          {revealed && (
            <div className="mt-6">
              <p
                className={`text-lg font-bold ${
                  selected === current.correctAnswer
                    ? "text-green-600"
                    : "text-red-600"
                }`}
              >
                {selected === current.correctAnswer
                  ? "✅ Sahi Jawab!"
                  : "❌ Galat Jawab"}
              </p>

              <p className="font-bold mt-3">
                Correct Answer:{" "}
                <span className="text-green-700">{current.correctAnswer}</span>
              </p>

              <h3 className="font-bold mt-4">Saare Options ki Explanation:</h3>
              {current.options?.map((option, i) => (
                <div
                  key={i}
                  className={`mt-2 p-3 rounded ${
                    option.text === current.correctAnswer
                      ? "bg-green-50 border border-green-400"
                      : "bg-gray-100"
                  }`}
                >
                  <b>
                    {String.fromCharCode(65 + i)}. {option.text}
                  </b>
                  <p className="text-sm mt-1 text-gray-700">
                    {option.explanation || "No explanation"}
                  </p>
                </div>
              ))}

              <button
                onClick={goNext}
                className="mt-6 w-full bg-blue-600 text-white px-6 py-3 rounded-lg font-bold"
              >
                {currentIndex + 1 >= total ? "Result Dekho" : "Next Question →"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Test;