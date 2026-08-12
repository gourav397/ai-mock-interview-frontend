import { useState } from "react";
import API from "../services/api";

function UploadResume() {
  const [file, setFile] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedAnswers, setSelectedAnswers] = useState({});

  const uploadResume = async () => {
    if (!file) {
      alert("Choose Resume");
      return;
    }

    setLoading(true);

    const formData = new FormData();
    formData.append("resume", file);

    try {
      const res = await API.post("/upload/resume", formData, {
        headers: {
          "Content-Type": "multipart/form-data"
        }
      });

      alert("Resume Uploaded");

      if (Array.isArray(res.data.questions)) {
        setQuestions(res.data.questions);
        console.log("FRONTEND RECEIVED:", res.data.questions.length, "questions");
        console.log("Q1:", JSON.stringify(res.data.questions[0], null, 2));
      } else {
        setQuestions([]);
      }
    } catch (error) {
      console.log(error);
      alert(error.response?.data?.message || "Upload Error");
    } finally {
      setLoading(false);
    }
  };

  const selectAnswer = (qIndex, option) => {
    setSelectedAnswers({
      ...selectedAnswers,
      [qIndex]: option
    });
  };

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold">AI Mock Interview</h1>

      <input
        type="file"
        accept=".pdf,.docx,.txt"
        onChange={(e) => setFile(e.target.files[0])}
        className="mt-5"
      />

      <br />

      <button
        onClick={uploadResume}
        disabled={loading}
        className="bg-blue-600 text-white px-6 py-3 rounded mt-5"
      >
        {loading ? "Analyzing PDF..." : "Upload Resume"}
      </button>

      <div className="mt-8 space-y-8">
        {questions.map((q, index) => (
          <div key={index} className="border rounded-xl p-6 shadow">
            <h2 className="text-xl font-bold">
              Q{index + 1}. {q.question}
            </h2>

            <p className="text-gray-500 mt-2">Type: {q.type}</p>

            <div className="mt-5 space-y-3">
              {q.options?.map((option, i) => (
                <button
                  key={i}
                  onClick={() => selectAnswer(index, option.text)}
                  className={`block w-full text-left p-4 border rounded-lg ${
                    selectedAnswers[index] === option.text
                      ? "bg-blue-100 border-blue-600"
                      : ""
                  }`}
                >
                  <b>{String.fromCharCode(65 + i)}.</b> {option.text}
                </button>
              ))}
            </div>

            {selectedAnswers[index] && (
              <div className="mt-5">
                <h3 className="font-bold">Result:</h3>
                {selectedAnswers[index] === q.correctAnswer ? (
                  <p className="text-green-600">Correct Answer</p>
                ) : (
                  <p className="text-red-600">Wrong Answer</p>
                )}

                <h3 className="font-bold mt-3">Correct Answer:</h3>
                <p className="text-green-700 font-semibold">{q.correctAnswer}</p>

                <h3 className="font-bold mt-3">Explanation:</h3>
                {q.options?.map((option, i) => (
                  <div
                    key={i}
                    className={`mt-2 p-3 rounded ${
                      option.text === q.correctAnswer
                        ? "bg-green-100 border border-green-500"
                        : "bg-gray-100"
                    }`}
                  >
                    <b>
                      {String.fromCharCode(65 + i)}. {option.text}
                    </b>
                    <p className="mt-1 text-sm">
                      {option.explanation || "No explanation"}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default UploadResume;