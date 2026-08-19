import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import API from "../services/api";

function HistoryDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reviewFilter, setReviewFilter] = useState("all");

  // 🔥 Per-option explanation
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
    if (q.optionExplanations) return Object.keys(q.optionExplanations).length > 0;
    return q.options?.some((opt) => typeof opt === "object" && getOptionExplanation(opt));
  };

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        const res = await API.get(`/results/detail/${id}`);
        setData(res.data);
      } catch (err) {
        console.log(err);
        alert("History detail load nahi hua");
        navigate("/dashboard");
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [id, navigate]);

  if (loading) return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-slate-900 flex items-center justify-center">
      <div className="text-white text-xl animate-pulse">⏳ Loading...</div>
    </div>
  );
  
  if (!data) return null;

  const questionsData = data.questionsData || [];
  const { category, difficulty, score, percentage, totalQuestions } = data;

  const skippedCount = questionsData.filter((q) => !q.userAnswer).length;
  const correctCount = questionsData.filter((q) => q.isCorrect).length;
  const wrongCount = questionsData.filter((q) => q.userAnswer && !q.isCorrect).length;

  const filters = [
    { key: "all", label: "📋 Sab", count: questionsData.length },
    { key: "correct", label: "✅ Sahi", count: correctCount },
    { key: "wrong", label: "❌ Galat", count: wrongCount },
    { key: "skipped", label: "⏭️ Skip", count: skippedCount },
  ];

  const filteredQs = questionsData.filter((q) => {
    if (reviewFilter === "correct") return q.isCorrect;
    if (reviewFilter === "wrong") return q.userAnswer && !q.isCorrect;
    if (reviewFilter === "skipped") return !q.userAnswer;
    return true;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-slate-900">
      <header className="bg-white/5 backdrop-blur-xl border-b border-white/10 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/dashboard" className="flex items-center gap-2 text-white hover:text-purple-300 transition">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="font-semibold">Dashboard</span>
          </Link>
          <h1 className="text-white font-bold text-lg">📋 Test Review</h1>
          <div className="text-white/60 text-sm">{category} • {difficulty}</div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* 🔥 Score Card */}
        <div className="bg-gradient-to-r from-purple-600/80 via-blue-600/80 to-indigo-600/80 backdrop-blur-sm rounded-2xl p-6 md:p-8 shadow-2xl border border-white/20 mb-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-6">
              <div className="relative w-28 h-28">
                <svg className="w-28 h-28 transform -rotate-90" viewBox="0 0 120 120">
                  <circle cx="60" cy="60" r="52" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="8" />
                  <circle cx="60" cy="60" r="52" fill="none" stroke="rgba(255,255,255,0.9)" strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={`${2 * Math.PI * 52}`}
                    strokeDashoffset={2 * Math.PI * 52 * (1 - percentage / 100)} />
                  <text x="60" y="55" textAnchor="middle" className="fill-white text-2xl font-bold">{percentage}%</text>
                  <text x="60" y="72" textAnchor="middle" className="fill-white/80 text-xs">{score}/{totalQuestions}</text>
                </svg>
              </div>
              <div>
                <h2 className="text-white text-2xl font-bold">Test Complete 🎉</h2>
                <p className="text-white/80 mt-1">
                  {percentage >= 80 ? "🌟 Excellent Performance" : percentage >= 50 ? "👍 Good Performance" : "📖 Need More Practice"}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <div className="px-4 py-2 rounded-xl bg-green-500/20 border border-green-400/30 text-center">
                <div className="text-green-300 text-2xl font-bold">{correctCount}</div>
                <div className="text-green-200 text-xs">✅ Correct</div>
              </div>
              <div className="px-4 py-2 rounded-xl bg-red-500/20 border border-red-400/30 text-center">
                <div className="text-red-300 text-2xl font-bold">{wrongCount}</div>
                <div className="text-red-200 text-xs">❌ Wrong</div>
              </div>
              <div className="px-4 py-2 rounded-xl bg-yellow-500/20 border border-yellow-400/30 text-center">
                <div className="text-yellow-300 text-2xl font-bold">{skippedCount}</div>
                <div className="text-yellow-200 text-xs">⏭️ Skipped</div>
              </div>
            </div>
          </div>
        </div>

        {/* 🔥 Filter Tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          {filters.map((f) => (
            <button key={f.key} onClick={() => setReviewFilter(f.key)}
              className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 ${
                reviewFilter === f.key
                  ? "bg-white text-gray-900 shadow-lg scale-105"
                  : "bg-white/10 text-white/70 hover:bg-white/20 border border-white/10"
              }`}>
              {f.label} ({f.count})
            </button>
          ))}
        </div>

        {/* 🔥 Questions */}
        <div className="space-y-5">
          {filteredQs.length === 0 && (
            <div className="text-center py-16 text-white/50">
              <div className="text-5xl mb-4">📭</div>
              <p>No questions in this filter</p>
            </div>
          )}

          {filteredQs.map((q, idx) => {
            const skipped = !q.userAnswer;
            const isCorrect = q.isCorrect;
            const borderColor = skipped ? "border-yellow-500/40" : isCorrect ? "border-green-500/40" : "border-red-500/40";
            const bgColor = skipped ? "from-yellow-500/5" : isCorrect ? "from-green-500/5" : "from-red-500/5";
            const generalExplanation = getGeneralExplanation(q);
            const hasOptionExp = anyOptionHasExplanation(q);

            return (
              <div key={idx} className={`bg-gradient-to-br ${bgColor} to-transparent backdrop-blur-sm rounded-xl border ${borderColor} p-5 shadow-lg hover:shadow-xl transition-all`}>
                {/* Question Header */}
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-white font-bold text-lg">Q{idx + 1}. {q.question}</h3>
                  <span className={`shrink-0 px-3 py-1 rounded-full text-xs font-bold ${
                    skipped ? "bg-yellow-500/80 text-white" : isCorrect ? "bg-green-500/80 text-white" : "bg-red-500/80 text-white"
                  }`}>
                    {skipped ? "⏭️ Skipped" : isCorrect ? "✅ Correct" : "❌ Wrong"}
                  </span>
                </div>

                {/* Options with per-option explanations */}
                <div className="mt-4 space-y-2.5">
                  {q.options?.map((opt, oi) => {
                    const optText = typeof opt === "string" ? opt : opt.text;
                    const optCorrect = optText === q.correctAnswer;
                    const optPick = optText === q.userAnswer;
                    
                    // 🔥 Check both inline option explanation AND saved optionExplanations
                    let optExplanation = "";
                    if (typeof opt === "object") optExplanation = getOptionExplanation(opt);
                    if (!optExplanation && q.optionExplanations) {
                      optExplanation = q.optionExplanations[oi] || "";
                    }

                    let bg = "bg-white/5 border-white/10";
                    let label = "";
                    let labelColor = "";
                    
                    if (optCorrect) {
                      bg = "bg-green-500/15 border-green-400/40";
                      label = "✅ Correct Answer";
                      labelColor = "text-green-300";
                    } else if (optPick) {
                      bg = "bg-red-500/15 border-red-400/40";
                      label = "❌ Your Answer";
                      labelColor = "text-red-300";
                    }

                    return (
                      <div key={oi} className={`rounded-xl border ${bg} p-3.5 transition-all`}>
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <span className="text-white/90 font-medium">{optText}</span>
                            {/* 🔥🔥🔥 OPTION EXPLANATION — exactly what user wants */}
                            {optExplanation && (
                              <div className="mt-2 text-xs text-blue-300 border-t border-white/10 pt-2 leading-relaxed">
                                📖 {optExplanation}
                              </div>
                            )}
                          </div>
                          {label && (
                            <span className={`shrink-0 text-xs font-bold ${labelColor}`}>{label}</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* 🔥 General explanation — ONLY if options don't have their own */}
                {generalExplanation && !hasOptionExp && (
                  <div className="mt-3 p-4 rounded-xl bg-blue-500/10 border border-blue-400/20 text-sm text-blue-200 leading-relaxed">
                    <b>📖 Additional Info:</b> {generalExplanation}
                  </div>
                )}
                
                {/* 🔥 Clean — no extra box when options already have explanations */}
                {generalExplanation && hasOptionExp && (
                  <div className="mt-2 text-xs text-blue-300/60 text-right">
                    📖 See option explanations above
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default HistoryDetail;