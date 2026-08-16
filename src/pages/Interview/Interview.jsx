import { useEffect, useState } from "react";
import API from "../../services/api";
import { useNavigate } from "react-router-dom";

function Interview() {
  const navigate = useNavigate();

  const [categories, setCategories] = useState([]);
  const [category, setCategory] = useState("");
  const [difficulty, setDifficulty] = useState("Medium");
  const [questions, setQuestions] = useState([]);
  const [started, setStarted] = useState(false);
  const [loading, setLoading] = useState(false); // 🔥 AI generate hone par dikhega
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState("");
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [answeredQuestions, setAnsweredQuestions] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);

  // LOAD CATEGORY
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const res = await API.get("/interview/categories");
        console.log("CATEGORIES:", res.data);
        setCategories(res.data);
      } catch (error) {
        console.log(error);
        alert("Category load nahi hui");
      }
    };
    loadCategories();
  }, []);

  // START INTERVIEW
  const startInterview = async () => {
    if (!category) {
      alert("Select Category");
      return;
    }

    setLoading(true);

    try {
      let questionList = [];

      if (difficulty === "Easy" || difficulty === "Hard") {
        // 🔥 Easy/Hard — AI se 50 questions auto-generate (manually add nahi karne padenge)
        const res = await API.get("/ai-interview/generate", {
          params: { category, difficulty, total: 50 },
        });
        questionList = res.data.questions || [];
      } else {
        // Medium — existing manually added questions (DB)
        const res = await API.get(
          `/interview/questions?category=${category}&difficulty=${difficulty}&limit=50`
        );
        questionList = res.data;
      }

      console.log("QUESTIONS:", questionList);

      if (questionList.length === 0) {
        alert("Is category me questions nahi mile");
        return;
      }

      setQuestions(questionList);
      setCurrent(0);
      setScore(0);
      setSelected("");
      setShowResult(false);
      setTimeLeft(30);
      setStarted(true);
    } catch (error) {
      console.log(error);
      alert("Questions load nahi hue");
    } finally {
      setLoading(false);
    }
  };

  // TIMER — same 30 second pattern (Easy/Hard AI par bhi)
  useEffect(() => {
    if (!started || showResult) return;

    if (timeLeft <= 0) {
      if (selected) {
        submitAnswer();
      } else {
        setShowResult(true);
      }
      return;
    }

    const timer = setTimeout(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [timeLeft, started, showResult]);

  const submitAnswer = () => {
    if (!selected) {
      alert("Option select karo");
      return;
    }

    if (selected === questions[current].correctAnswer) {
      setScore((prev) => prev + 1);
    }

    setAnsweredQuestions((prev) => prev + 1);
    setShowResult(true);
  };

  const nextQuestion = async () => {
    setSelected("");
    setShowResult(false);

    if (current < questions.length - 1) {
      setCurrent((prev) => prev + 1);
      setTimeLeft(30);
    } else {
      try {
        const user = JSON.parse(localStorage.getItem("user"));
        const finalScore =
          score + (selected === questions[current].correctAnswer ? 1 : 0);
        const percentage = Math.round((finalScore / questions.length) * 100);

        console.log("USER DATA =", user);

        if (!user || !user.id) {
          alert("User ID missing. Please login again.");
          return;
        }

        try {
          console.log("CALLING RESULT API");
          console.log("SENDING DATA =", {
            user: user.id,
            category: category,
            difficulty: difficulty,
            totalQuestions: questions.length,
            score: score,
            percentage: percentage,
          });

          const resultResponse = await API.post("/results", {
            user: user.id,
            category: category,
            difficulty: difficulty,
            totalQuestions: questions.length,
            score: finalScore,
            percentage: percentage,
            correctQuestions: finalScore,
            wrongQuestions: questions.length - finalScore,
            performance:
              finalScore >= questions.length * 0.8
                ? "Excellent Performance"
                : finalScore >= questions.length * 0.5
                  ? "Good Performance"
                  : "Need More Practice",
          });

          console.log("RESULT RESPONSE =", resultResponse.data);
        } catch (err) {
          console.log("RESULT API ERROR =", err.response?.data || err.message);
          alert("Result API failed");
          return;
        }

        navigate("/result", {
          state: {
            score: score,
            totalQuestions: questions.length,
            category: category,
            percentage: percentage,
          },
        });
      } catch (error) {
        console.log("RESULT SAVE ERROR:", error);
        alert("Result save nahi hua");
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-3xl mx-auto bg-white p-8 rounded-xl shadow">
        <h1 className="text-3xl font-bold">AI Interview</h1>

        {!started ? (
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
                ⏳ AI 50 {difficulty} questions bana raha hai... 30-90 second lag
                sakte hain
              </p>
            )}
          </>
        ) : (
          <div className="mt-8">
            <p>
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
                  onClick={() => setSelected(option.text)}
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

            {!showResult && (
              <div>
                <button
                  onClick={submitAnswer}
                  className="mt-6 bg-green-600 text-white px-6 py-3 rounded"
                >
                  Submit
                </button>

                <button
                  onClick={nextQuestion}
                  className="mt-6 ml-3 bg-yellow-500 text-white px-6 py-3 rounded"
                >
                  Skip Question
                </button>
              </div>
            )}

            {showResult && (
              <div className="mt-6 bg-gray-100 p-4 rounded">
                <h3>
                  {selected === questions[current].correctAnswer
                    ? "✅ Correct Answer"
                    : "❌ Wrong Answer"}
                </h3>

                <p className="mt-3">
                  Correct Answer: <b>{questions[current].correctAnswer}</b>
                </p>

                {questions[current].options.map((option) => (
                  <div
                    key={option.text}
                    className="mt-4 p-3 bg-white border rounded"
                  >
                    <p className="font-bold">Option: {option.text}</p>
                    <p className="text-gray-600 mt-2">
                      Explanation: {option.explanation}
                    </p>
                  </div>
                ))}

                <button
                  onClick={nextQuestion}
                  className="mt-5 bg-blue-600 text-white px-6 py-3 rounded"
                >
                  Next Question
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default Interview;