import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import API from "../../services/api";

function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (!stored) { navigate("/login"); return; }
    const u = JSON.parse(stored);
    setUser(u);
    fetchResults(u.id);
  }, [navigate]);

  const fetchResults = async (userId) => {
    try {
      const res = await API.get(`/results/${userId}`);
      setResults(res.data);
    } catch (err) {
      console.log("Results fetch error:", err);
    } finally { setLoading(false); }
  };

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  };

  // Stats
  const totalInterviews = results.length;
  const bestScore = results.length > 0 ? Math.max(...results.map((r) => r.percentage || 0)) : 0;
  const avgPercentage = results.length > 0
    ? Math.round(results.reduce((sum, r) => sum + (r.percentage || 0), 0) / results.length)
    : 0;

  // Last 5 tests for quick view
  const recentTests = results.slice(0, 5);

  if (loading) return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-indigo-900 to-purple-900 flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-purple-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-white/70 text-lg animate-pulse">Loading your dashboard...</p>
      </div>
    </div>
  );
  
  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-indigo-950 to-slate-900">
      
      {/* 🔥 PREMIUM HEADER — Glassmorphism */}
      <header className="bg-white/5 backdrop-blur-xl border-b border-white/10 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2">
              <div className="w-9 h-9 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/20">
                <span className="text-white font-bold text-sm">AI</span>
              </div>
              <span className="text-white font-bold text-lg hidden sm:block">Interview</span>
            </Link>

            {/* Nav Links */}
            <nav className="hidden md:flex items-center gap-6">
              {[
                { to: "/", label: "Home" },
                { to: "/category", label: "📘 Class 11/12" },
                { to: "/dashboard", label: "Dashboard", active: true },
                { to: "/profile", label: "Profile" },
              ].map((link) => (
                <Link key={link.to} to={link.to}
                  className={`text-sm font-semibold transition-all ${
                    link.active
                      ? "text-purple-300 border-b-2 border-purple-400 pb-1"
                      : "text-white/60 hover:text-white"
                  }`}>
                  {link.label}
                </Link>
              ))}
            </nav>

            {/* Right side */}
            <div className="flex items-center gap-3">
              <button onClick={() => navigate("/")} className="text-white/50 hover:text-white text-sm transition hidden sm:block">🌐 हिंदी</button>
              <button onClick={() => { localStorage.removeItem("user"); navigate("/login"); }}
                className="px-4 py-1.5 bg-white/10 hover:bg-red-500/20 text-white/80 hover:text-red-300 rounded-lg text-sm font-semibold transition border border-white/10">
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* 🔥 WELCOME SECTION */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-white">
              Welcome back, <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">{user.name || user.email?.split("@")[0] || "User"}</span> 👋
            </h1>
            <p className="text-white/50 mt-1">AI Interview Dashboard — Track your progress and ace your exams!</p>
          </div>
          <div className="flex gap-3">
            <button onClick={() => navigate("/category")}
              className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold rounded-xl shadow-lg shadow-purple-600/30 hover:shadow-purple-600/50 hover:scale-105 transition-all duration-200">
              📝 New Test
            </button>
            <button onClick={() => navigate("/interview")}
              className="px-5 py-2.5 bg-white/10 text-white font-bold rounded-xl border border-white/20 hover:bg-white/20 transition-all duration-200">
              🎯 Interview
            </button>
          </div>
        </div>

        {/* 🔥 STATS CARDS — PREMIUM */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-gradient-to-br from-purple-600/20 to-purple-800/10 backdrop-blur-sm rounded-2xl p-5 border border-purple-500/20 hover:border-purple-400/40 transition-all duration-300 group">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-300/70 text-sm font-medium">Total Tests</p>
                <p className="text-white text-3xl font-bold mt-1 group-hover:scale-110 transition-transform origin-left">{totalInterviews}</p>
              </div>
              <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center text-2xl">📊</div>
            </div>
            <div className="mt-3 h-1 bg-white/5 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-purple-500 to-purple-300 rounded-full" style={{ width: `${Math.min(totalInterviews * 5, 100)}%` }}></div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-600/20 to-blue-800/10 backdrop-blur-sm rounded-2xl p-5 border border-blue-500/20 hover:border-blue-400/40 transition-all duration-300 group">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-300/70 text-sm font-medium">Best Score</p>
                <p className="text-white text-3xl font-bold mt-1 group-hover:scale-110 transition-transform origin-left">{bestScore}%</p>
              </div>
              <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center text-2xl">🏆</div>
            </div>
            <div className="mt-3 h-1 bg-white/5 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-blue-500 to-blue-300 rounded-full" style={{ width: `${bestScore}%` }}></div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-emerald-600/20 to-emerald-800/10 backdrop-blur-sm rounded-2xl p-5 border border-emerald-500/20 hover:border-emerald-400/40 transition-all duration-300 group">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-emerald-300/70 text-sm font-medium">Average</p>
                <p className="text-white text-3xl font-bold mt-1 group-hover:scale-110 transition-transform origin-left">{avgPercentage}%</p>
              </div>
              <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center text-2xl">📈</div>
            </div>
            <div className="mt-3 h-1 bg-white/5 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-emerald-500 to-emerald-300 rounded-full" style={{ width: `${avgPercentage}%` }}></div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-amber-600/20 to-amber-800/10 backdrop-blur-sm rounded-2xl p-5 border border-amber-500/20 hover:border-amber-400/40 transition-all duration-300 group">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-amber-300/70 text-sm font-medium">Category</p>
                <p className="text-white text-2xl font-bold mt-1">{results[0]?.category || "—"}</p>
              </div>
              <div className="w-12 h-12 bg-amber-500/20 rounded-xl flex items-center justify-center text-2xl">🎯</div>
            </div>
            <div className="mt-3 text-xs text-amber-300/50">Last test category</div>
          </div>
        </div>

        {/* 🔥 QUICK ACTIONS + PROFILE SIDE-BY-SIDE */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Quick Actions */}
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
            <h3 className="text-white font-bold text-lg mb-4">⚡ Quick Actions</h3>
            <div className="space-y-3">
              <button onClick={() => navigate("/category")}
                className="w-full p-3 bg-gradient-to-r from-purple-600/30 to-blue-600/30 rounded-xl border border-purple-400/20 text-white font-semibold flex items-center gap-3 hover:from-purple-600/50 hover:to-blue-600/50 transition-all">
                <span className="text-2xl">📝</span>
                <span className="text-left">Practice Test — Choose category</span>
                <span className="ml-auto text-purple-300">→</span>
              </button>
              <button onClick={() => navigate("/interview")}
                className="w-full p-3 bg-gradient-to-r from-emerald-600/30 to-teal-600/30 rounded-xl border border-emerald-400/20 text-white font-semibold flex items-center gap-3 hover:from-emerald-600/50 hover:to-teal-600/50 transition-all">
                <span className="text-2xl">🎯</span>
                <span className="text-left">Start AI Interview</span>
                <span className="ml-auto text-emerald-300">→</span>
              </button>
              <button onClick={() => navigate("/upload-resume")}
                className="w-full p-3 bg-gradient-to-r from-amber-600/30 to-orange-600/30 rounded-xl border border-amber-400/20 text-white font-semibold flex items-center gap-3 hover:from-amber-600/50 hover:to-orange-600/50 transition-all">
                <span className="text-2xl">📄</span>
                <span className="text-left">Upload Resume</span>
                <span className="ml-auto text-amber-300">→</span>
              </button>
            </div>
          </div>

          {/* Profile Card */}
          <div className="lg:col-span-2 bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-white font-bold text-lg">👤 Profile</h3>
              <button onClick={() => navigate("/profile")} className="text-purple-400 hover:text-purple-300 text-sm font-medium transition">View Profile →</button>
            </div>
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-500 rounded-2xl flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                {user.name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || "U"}
              </div>
              <div>
                <p className="text-white font-bold text-lg">{user.name || "User"}</p>
                <p className="text-white/50 text-sm">{user.email}</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-white/5 rounded-xl p-3 text-center">
                <p className="text-2xl font-bold text-purple-300">{totalInterviews}</p>
                <p className="text-white/50 text-xs mt-1">Tests</p>
              </div>
              <div className="bg-white/5 rounded-xl p-3 text-center">
                <p className="text-2xl font-bold text-blue-300">{bestScore}%</p>
                <p className="text-white/50 text-xs mt-1">Best</p>
              </div>
              <div className="bg-white/5 rounded-xl p-3 text-center">
                <p className="text-2xl font-bold text-emerald-300">{avgPercentage}%</p>
                <p className="text-white/50 text-xs mt-1">Average</p>
              </div>
            </div>
          </div>
        </div>

        {/* 🔥 RECENT TESTS — Quick View */}
        {recentTests.length > 0 && (
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 mb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-bold text-lg">🕐 Recent Tests</h3>
              <span className="text-white/40 text-sm">Last 5</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
              {recentTests.map((r) => (
                <div key={r._id} onClick={() => navigate(`/history-detail/${r._id}`)}
                  className="bg-white/5 hover:bg-white/10 rounded-xl p-3 cursor-pointer transition-all border border-white/5 hover:border-purple-400/30">
                  <p className="text-white font-semibold text-sm truncate">{r.category}</p>
                  <p className="text-purple-300 text-lg font-bold mt-1">{r.percentage}%</p>
                  <p className="text-white/40 text-xs mt-1">{r.score}/{r.totalQuestions}</p>
                  <p className="text-white/30 text-xs mt-1">{formatDate(r.createdAt)}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 🔥 FULL HISTORY — Clickable */}
        <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-white font-bold text-xl">📊 Interview History</h3>
            <span className="text-white/40 text-sm">{results.length} entries</span>
          </div>

          {results.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-6xl mb-4">🎯</div>
              <p className="text-white/50 text-lg">No tests yet! Start your first practice test.</p>
              <button onClick={() => navigate("/category")}
                className="mt-4 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-purple-600/30 transition-all">
                Start Now
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {results.map((result, index) => (
                <div key={result._id}
                  onClick={() => navigate(`/history-detail/${result._id}`)}
                  className="group bg-white/[0.03] hover:bg-white/[0.08] rounded-xl p-4 border border-white/5 hover:border-purple-400/30 cursor-pointer transition-all duration-200"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      {/* Index circle */}
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500/30 to-blue-500/30 flex items-center justify-center text-white/60 text-xs font-bold shrink-0">
                        {index + 1}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-white font-bold">{result.category}</span>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                            result.difficulty === "Hard" ? "bg-red-500/20 text-red-300" :
                            result.difficulty === "Medium" ? "bg-yellow-500/20 text-yellow-300" :
                            "bg-green-500/20 text-green-300"
                          }`}>{result.difficulty}</span>
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-sm text-white/40">
                          <span>Score: <b className="text-white/80">{result.score}/{result.totalQuestions}</b></span>
                          <span>• {result.percentage}%</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 sm:text-right">
                      <div className="flex gap-2">
                        <span className="text-xs text-green-400/60">✅ {result.correctQuestions || 0}</span>
                        <span className="text-xs text-red-400/60">❌ {result.wrongQuestions || 0}</span>
                        <span className="text-xs text-yellow-400/60">⏭️ {result.skippedQuestions || 0}</span>
                      </div>
                      <div className="hidden sm:block text-right">
                        <p className="text-white/30 text-xs">{formatDate(result.createdAt)}</p>
                        <p className={`text-xs font-semibold mt-0.5 ${
                          result.percentage >= 80 ? "text-green-400" :
                          result.percentage >= 50 ? "text-yellow-400" : "text-red-400"
                        }`}>{result.performance || "Need Practice"}</p>
                      </div>
                      <div className="text-purple-400/0 group-hover:text-purple-400/80 transition-all text-sm">→</div>
                    </div>
                  </div>

                  {/* Mobile date/performance */}
                  <div className="sm:hidden flex justify-between mt-2 pt-2 border-t border-white/5 text-xs">
                    <span className="text-white/30">{formatDate(result.createdAt)}</span>
                    <span className={`font-semibold ${
                      result.percentage >= 80 ? "text-green-400" :
                      result.percentage >= 50 ? "text-yellow-400" : "text-red-400"
                    }`}>{result.performance || "Need Practice"}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;