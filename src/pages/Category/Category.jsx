import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../services/api";

// ⚠️ Ye names backend cron/refreshBanks.js ke ALL_CATEGORIES se EXACT match hone chahiye
const categories = [
  "Haryana GK", "General Knowledge", "Current Affairs", "Indian History",
  "Indian Polity", "Geography", "Science", "Computer", "Python",
  "Cyber Security", "AI & Machine Learning", "SSC", "UPSC", "Railway",
  "Banking", "Defence", "Mathematics", "Reasoning", "Hindi", "English",
  "Haryana History", "Haryana Geography", "Haryana Polity", "Haryana Economy",
  "Haryana Culture", "Haryana Literature"
];

function Category() {
  const navigate = useNavigate();

  const [counts, setCounts] = useState({});   // { "SSC": 150, ... } — total across difficulties
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await API.get("/api/question-banks/overview");
        const map = {};
        (res.data || []).forEach((b) => {
          map[b.category] = (map[b.category] || 0) + (b.count || 0);
        });
        setCounts(map);
      } catch (e) {
        console.log("Overview load error:", e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold">Choose Category</h1>
        <p className="text-gray-500 mt-2">
          Har category me Easy • Medium • Hard questions available hain — roz naye add hote hain.
        </p>

        <div className="grid md:grid-cols-4 gap-5 mt-8">
          {categories.map((cat, index) => (
            <div key={index} className="bg-white p-6 rounded-xl shadow">
              <h2 className="font-bold text-lg">{cat}</h2>
              <p className="text-gray-500 mt-2">
                {counts[cat] !== undefined
                  ? `${counts[cat]} Practice Questions`
                  : loading
                    ? "Loading..."
                    : "Coming soon"}
              </p>
              <button
                onClick={() => navigate(`/test/${encodeURIComponent(cat)}`)}
                className="mt-4 bg-blue-600 text-white px-5 py-2 rounded hover:bg-blue-700 transition"
              >
                Start Test
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Category;