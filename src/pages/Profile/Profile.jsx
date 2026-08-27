import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import API from "../../services/api";

function Profile() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // 🔥 Detect actual profile picture from user object
  const [userPicture, setUserPicture] = useState(null);

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (!stored) {
      navigate("/login");
      return;
    }
    try {
      const u = JSON.parse(stored);
      setUser(u);

      // 🔥 Check various possible field names used by Google OAuth / Firebase
      const pictureField =
        u.picture ||
        u.avatar ||
        u.profilePicture ||
        u.photoURL ||
        u.photo ||
        u.image ||
        u.profile_image ||
        u.profileUrl ||
        u.avatarUrl ||
        "";

      // 🔥 Also check if token response had picture (some setups store it separately)
      if (!pictureField) {
        try {
          const tokenData = localStorage.getItem("token");
          if (tokenData) {
            const parsed = JSON.parse(atob(tokenData.split(".")[1]));
            if (parsed.picture) {
              setUserPicture(parsed.picture);
            }
          }
        } catch (e) {
          // Token parsing fail — ignore
        }
      }

      if (pictureField && typeof pictureField === "string" && pictureField.startsWith("http")) {
        setUserPicture(pictureField);
      }

      fetchResults(u.id);
    } catch (e) {
      navigate("/login");
    }
  }, [navigate]);

  const fetchResults = async (userId) => {
    try {
     const res = await API.get(`/api/results/${userId}`);
      setResults(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.log("Results fetch error:", err);
      setError("Could not load your performance data.");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "—";
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatDateVerbose = (dateStr) => {
    if (!dateStr) return "—";
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  // ----- COMPUTED STATS -----
  const totalTests = results.length;
  const bestScore =
    results.length > 0
      ? Math.max(...results.map((r) => r.percentage || 0))
      : 0;
  const avgPercentage =
    results.length > 0
      ? Math.round(
          results.reduce((sum, r) => sum + (r.percentage || 0), 0) /
            results.length
        )
      : 0;
  const latestResult = results.length > 0 ? results[0] : null;
  const categoriesAttempted = [
    ...new Set(results.map((r) => r.category)),
  ].length;

  // ----- ACHIEVEMENTS (real data only) -----
  const achievements = [];
  if (totalTests >= 1) achievements.push({ icon: "🎯", label: "First Interview", desc: "Started your interview journey", unlocked: true });
  if (totalTests >= 5) achievements.push({ icon: "🔥", label: "Consistent Practice", desc: "Completed 5+ tests", unlocked: true });
  else if (totalTests >= 1) achievements.push({ icon: "🔥", label: "Consistent Practice", desc: `Complete ${5 - totalTests} more`, unlocked: false });
  if (bestScore >= 80) achievements.push({ icon: "🏆", label: "Best Score", desc: `Scored ${bestScore}%`, unlocked: true });
  if (categoriesAttempted >= 3) achievements.push({ icon: "📚", label: "Multi-Category", desc: `Explored ${categoriesAttempted} categories`, unlocked: true });
  else if (categoriesAttempted >= 1) achievements.push({ icon: "📚", label: "Multi-Category", desc: `Explore ${3 - categoriesAttempted} more`, unlocked: false });
  if (totalTests >= 1) achievements.push({ icon: "🚀", label: "Journey Started", desc: "Your path to success begins", unlocked: true });

  // ----- GET USER INITIAL (fallback if no picture) -----
  const userInitial =
    user?.name?.[0]?.toUpperCase() ||
    user?.email?.[0]?.toUpperCase() ||
    "U";

  // ----- LOADING STATE -----
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-indigo-950 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white/70 text-lg animate-pulse">Loading your profile...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  // ----- ERROR STATE -----
  if (error && results.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-indigo-950 to-slate-900">
        <Header user={user} navigate={navigate} />
        <div className="max-w-4xl mx-auto px-4 py-20 text-center">
          <div className="w-20 h-20 mx-auto rounded-full bg-red-500/20 flex items-center justify-center text-4xl mb-4">⚠️</div>
          <h2 className="text-white text-2xl font-bold mb-2">Something went wrong</h2>
          <p className="text-white/50 mb-6">{error}</p>
          <button onClick={() => fetchResults(user.id)}
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-purple-600/30 transition-all">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-indigo-950 to-slate-900">
      {/* BACKGROUND GLOW */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-40 right-20 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-40 left-20 w-80 h-80 bg-blue-500/5 rounded-full blur-3xl"></div>
      </div>

      {/* HEADER */}
      <Header user={user} navigate={navigate} />

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* ===== HERO SECTION ===== */}
        <div className="bg-gradient-to-br from-purple-600/30 via-blue-600/20 to-indigo-600/30 backdrop-blur-xl rounded-3xl p-6 md:p-10 border border-white/10 shadow-2xl shadow-purple-500/10 mb-8 overflow-hidden relative">
          <div className="absolute -top-20 -right-20 w-60 h-60 bg-purple-500/20 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-blue-500/20 rounded-full blur-3xl"></div>

          <div className="relative z-10 flex flex-col md:flex-row items-center gap-6 md:gap-10">
            {/* 🔥 AVATAR — Actual Google picture if available, else initial fallback */}
            <div className="relative shrink-0">
              <div className="w-24 h-24 md:w-28 md:h-28 rounded-2xl bg-gradient-to-br from-purple-500 to-blue-500 p-0.5 shadow-xl shadow-purple-500/30 overflow-hidden">
                {userPicture ? (
                  <img
                    src={userPicture}
                    alt={user?.name || "Profile"}
                    className="w-full h-full rounded-2xl object-cover"
                    onError={(e) => {
                      // 🔥 Agar image load na ho to fallback show karo
                      e.target.style.display = "none";
                      e.target.parentNode.classList.add("flex", "items-center", "justify-center", "bg-gray-900");
                      e.target.parentNode.innerHTML = `<span class="text-white text-3xl md:text-4xl font-bold">${userInitial}</span>`;
                    }}
                  />
                ) : (
                  <div className="w-full h-full rounded-2xl bg-gray-900 flex items-center justify-center">
                    <span className="text-white text-3xl md:text-4xl font-bold">
                      {userInitial}
                    </span>
                  </div>
                )}
              </div>
              {/* Glow ring */}
              <div className="absolute -inset-2 rounded-2xl bg-gradient-to-br from-purple-500/20 to-blue-500/20 blur-xl -z-10"></div>
              {/* Online status badge */}
              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-400 border-2 border-gray-900 rounded-full"></div>
            </div>

            {/* Info */}
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-2xl md:text-4xl font-bold text-white">
                {user.name || "User"}
              </h1>
              <p className="text-white/50 text-sm md:text-base mt-1">{user.email}</p>
              <div className="flex flex-wrap items-center gap-3 mt-3 justify-center md:justify-start">
                <span className="px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-400/30 text-emerald-300 text-xs font-semibold">
                  🟢 Active Member
                </span>
                {totalTests > 0 && (
                  <span className="px-3 py-1 rounded-full bg-purple-500/15 border border-purple-400/30 text-purple-300 text-xs font-semibold">
                    🎯 {totalTests} Test{totalTests > 1 ? "s" : ""} Completed
                  </span>
                )}
              </div>
              <p className="text-white/30 text-sm mt-3">
                Your AI Interview journey — Keep learning, keep improving 🚀
              </p>
            </div>

            <button className="shrink-0 px-5 py-2.5 bg-white/10 text-white/70 rounded-xl border border-white/10 hover:bg-white/20 hover:text-white transition-all text-sm font-semibold">
              ✏️ Edit Profile
            </button>
          </div>
        </div>

        {/* ===== MAIN GRID ===== */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">

          {/* LEFT — Personal Info */}
          <div className="lg:col-span-1">
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 h-full">
              <h3 className="text-white font-bold text-lg mb-5 flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-xs">👤</span>
                Personal Information
              </h3>

              <div className="space-y-4">
                <div className="bg-white/[0.03] rounded-xl p-4 border border-white/5">
                  <p className="text-white/40 text-xs font-medium uppercase tracking-wider">Full Name</p>
                  <p className="text-white font-semibold mt-1">{user.name || "Not set"}</p>
                </div>

                <div className="bg-white/[0.03] rounded-xl p-4 border border-white/5">
                  <p className="text-white/40 text-xs font-medium uppercase tracking-wider">Email Address</p>
                  <p className="text-white font-semibold mt-1 truncate">{user.email || "Not set"}</p>
                </div>

                <div className="bg-white/[0.03] rounded-xl p-4 border border-white/5">
                  <p className="text-white/40 text-xs font-medium uppercase tracking-wider">Account Status</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="w-2 h-2 bg-emerald-400 rounded-full"></span>
                    <p className="text-emerald-300 font-semibold">Active</p>
                  </div>
                </div>

                <div className="bg-white/[0.03] rounded-xl p-4 border border-white/5">
                  <p className="text-white/40 text-xs font-medium uppercase tracking-wider">Member Since</p>
                  <p className="text-white font-semibold mt-1">
                    {user.createdAt ? formatDateVerbose(user.createdAt) : "Current Session"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT — Stats Grid */}
          <div className="lg:col-span-2">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div className="bg-gradient-to-br from-purple-600/20 to-purple-800/10 backdrop-blur-sm rounded-2xl p-5 border border-purple-500/20 hover:border-purple-400/40 transition-all duration-300 group">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 bg-purple-500/20 rounded-xl flex items-center justify-center text-xl group-hover:scale-110 transition-transform">📊</div>
                </div>
                <p className="text-white text-2xl font-bold group-hover:scale-110 transition-transform origin-left">{totalTests}</p>
                <p className="text-purple-300/70 text-xs mt-1">Total Tests</p>
              </div>

              <div className="bg-gradient-to-br from-blue-600/20 to-blue-800/10 backdrop-blur-sm rounded-2xl p-5 border border-blue-500/20 hover:border-blue-400/40 transition-all duration-300 group">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center text-xl group-hover:scale-110 transition-transform">🏆</div>
                </div>
                <p className="text-white text-2xl font-bold group-hover:scale-110 transition-transform origin-left">{bestScore}%</p>
                <p className="text-blue-300/70 text-xs mt-1">Best Score</p>
              </div>

              <div className="bg-gradient-to-br from-emerald-600/20 to-emerald-800/10 backdrop-blur-sm rounded-2xl p-5 border border-emerald-500/20 hover:border-emerald-400/40 transition-all duration-300 group">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 bg-emerald-500/20 rounded-xl flex items-center justify-center text-xl group-hover:scale-110 transition-transform">📈</div>
                </div>
                <p className="text-white text-2xl font-bold group-hover:scale-110 transition-transform origin-left">{avgPercentage}%</p>
                <p className="text-emerald-300/70 text-xs mt-1">Average</p>
              </div>

              <div className="bg-gradient-to-br from-amber-600/20 to-amber-800/10 backdrop-blur-sm rounded-2xl p-5 border border-amber-500/20 hover:border-amber-400/40 transition-all duration-300 group">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 bg-amber-500/20 rounded-xl flex items-center justify-center text-xl group-hover:scale-110 transition-transform">🎯</div>
                </div>
                <p className="text-white text-2xl font-bold group-hover:scale-110 transition-transform origin-left">{latestResult?.percentage || 0}%</p>
                <p className="text-amber-300/70 text-xs mt-1">Latest Score</p>
              </div>

              <div className="bg-gradient-to-br from-rose-600/20 to-rose-800/10 backdrop-blur-sm rounded-2xl p-5 border border-rose-500/20 hover:border-rose-400/40 transition-all duration-300 group">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 bg-rose-500/20 rounded-xl flex items-center justify-center text-xl group-hover:scale-110 transition-transform">📚</div>
                </div>
                <p className="text-white text-2xl font-bold group-hover:scale-110 transition-transform origin-left">{categoriesAttempted}</p>
                <p className="text-rose-300/70 text-xs mt-1">Categories</p>
              </div>

              <div className="bg-gradient-to-br from-cyan-600/20 to-cyan-800/10 backdrop-blur-sm rounded-2xl p-5 border border-cyan-500/20 hover:border-cyan-400/40 transition-all duration-300 group">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 bg-cyan-500/20 rounded-xl flex items-center justify-center text-xl group-hover:scale-110 transition-transform">✅</div>
                </div>
                <p className="text-white text-2xl font-bold group-hover:scale-110 transition-transform origin-left">{results.filter(r => r.score > 0).length}</p>
                <p className="text-cyan-300/70 text-xs mt-1">Passed</p>
              </div>
            </div>
          </div>
        </div>

        {/* ===== PERFORMANCE OVERVIEW + RECENT ACTIVITY ===== */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
            <h3 className="text-white font-bold text-lg mb-5 flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-xs">📊</span>
              Performance Overview
            </h3>

            {results.length === 0 ? (
              <div className="text-center py-10">
                <div className="text-5xl mb-4">📭</div>
                <p className="text-white/40">No performance data yet.</p>
                <p className="text-white/30 text-sm mt-1">Start your first test to see stats.</p>
              </div>
            ) : (
              <div className="space-y-5">
                <div>
                  <div className="flex justify-between text-sm mb-1.5">
                    <span className="text-white/60">Average Performance</span>
                    <span className="text-white font-semibold">{avgPercentage}%</span>
                  </div>
                  <div className="w-full bg-white/10 rounded-full h-2.5 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-purple-500 to-blue-500 rounded-full transition-all duration-700"
                      style={{ width: `${avgPercentage}%` }}
                    ></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-1.5">
                    <span className="text-white/60">Best Performance</span>
                    <span className="text-emerald-400 font-semibold">{bestScore}%</span>
                  </div>
                  <div className="w-full bg-white/10 rounded-full h-2.5 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-700"
                      style={{ width: `${bestScore}%` }}
                    ></div>
                  </div>
                </div>

                {latestResult && (
                  <div>
                    <div className="flex justify-between text-sm mb-1.5">
                      <span className="text-white/60">Latest ({latestResult.category})</span>
                      <span className={`font-semibold ${latestResult.percentage >= 80 ? "text-emerald-400" : latestResult.percentage >= 50 ? "text-amber-400" : "text-red-400"}`}>
                        {latestResult.percentage}%
                      </span>
                    </div>
                    <div className="w-full bg-white/10 rounded-full h-2.5 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${
                          latestResult.percentage >= 80
                            ? "bg-gradient-to-r from-emerald-500 to-teal-500"
                            : latestResult.percentage >= 50
                            ? "bg-gradient-to-r from-amber-500 to-orange-500"
                            : "bg-gradient-to-r from-red-500 to-rose-500"
                        }`}
                        style={{ width: `${latestResult.percentage}%` }}
                      ></div>
                    </div>
                  </div>
                )}

                {["Easy", "Medium", "Hard"].map((diff) => {
                  const diffResults = results.filter((r) => r.difficulty === diff);
                  if (diffResults.length === 0) return null;
                  const diffAvg = Math.round(
                    diffResults.reduce((s, r) => s + (r.percentage || 0), 0) /
                      diffResults.length
                  );
                  const diffColor =
                    diff === "Easy"
                      ? "from-green-500 to-emerald-500"
                      : diff === "Medium"
                      ? "from-yellow-500 to-amber-500"
                      : "from-red-500 to-rose-500";
                  const diffTextColor =
                    diff === "Easy"
                      ? "text-green-300"
                      : diff === "Medium"
                      ? "text-yellow-300"
                      : "text-red-300";
                  return (
                    <div key={diff}>
                      <div className="flex justify-between text-sm mb-1.5">
                        <span className={`text-white/60`}>{diff}</span>
                        <span className={`font-semibold ${diffTextColor}`}>{diffAvg}%</span>
                      </div>
                      <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
                        <div
                          className={`h-full bg-gradient-to-r ${diffColor} rounded-full transition-all duration-700`}
                          style={{ width: `${diffAvg}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-white font-bold text-lg flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-xs">🕐</span>
                Recent Activity
              </h3>
              {results.length > 5 && (
                <Link to="/dashboard" className="text-purple-400 hover:text-purple-300 text-xs font-semibold transition">
                  View All →
                </Link>
              )}
            </div>

            {results.length === 0 ? (
              <div className="text-center py-10">
                <div className="text-5xl mb-4">🚀</div>
                <p className="text-white/50 text-lg">Your journey starts here!</p>
                <p className="text-white/30 text-sm mt-1">Take your first test to begin.</p>
                <Link
                  to="/interview"
                  className="inline-block mt-4 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-purple-600/30 transition-all"
                >
                  🎤 Start Interview
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {results.slice(0, 5).map((r, i) => (
                  <Link
                    key={r._id}
                    to={`/history-detail/${r._id}`}
                    className="block bg-white/[0.03] hover:bg-white/[0.07] rounded-xl p-3.5 border border-white/5 hover:border-purple-400/30 transition-all duration-200 group"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm shrink-0 ${
                          r.percentage >= 80
                            ? "bg-green-500/20 text-green-300"
                            : r.percentage >= 50
                            ? "bg-yellow-500/20 text-yellow-300"
                            : "bg-red-500/20 text-red-300"
                        }`}>
                          {i + 1}
                        </div>
                        <div className="min-w-0">
                          <p className="text-white text-sm font-semibold truncate">{r.category}</p>
                          <div className="flex items-center gap-2 text-xs text-white/40 mt-0.5">
                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                              r.difficulty === "Hard" ? "bg-red-500/20 text-red-300" :
                              r.difficulty === "Medium" ? "bg-yellow-500/20 text-yellow-300" :
                              "bg-green-500/20 text-green-300"
                            }`}>{r.difficulty}</span>
                            <span>{r.score}/{r.totalQuestions || 50}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className={`font-bold text-lg ${
                          r.percentage >= 80 ? "text-green-400" :
                          r.percentage >= 50 ? "text-yellow-400" : "text-red-400"
                        }`}>{r.percentage}%</p>
                        <p className="text-white/30 text-[10px]">{formatDate(r.createdAt)}</p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ===== ACHIEVEMENTS + QUICK ACTIONS ===== */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
            <h3 className="text-white font-bold text-lg mb-5 flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-xs">🏅</span>
              Achievements
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {achievements.map((ach, i) => (
                <div
                  key={i}
                  className={`rounded-xl p-4 text-center border transition-all duration-200 ${
                    ach.unlocked
                      ? "bg-gradient-to-b from-purple-500/10 to-transparent border-purple-400/20 hover:border-purple-400/40"
                      : "bg-white/[0.02] border-white/5 opacity-40"
                  }`}
                >
                  <div className={`text-2xl mb-2 ${ach.unlocked ? "" : "grayscale"}`}>{ach.icon}</div>
                  <p className={`text-xs font-semibold ${ach.unlocked ? "text-white" : "text-white/40"}`}>
                    {ach.label}
                  </p>
                  <p className={`text-[10px] mt-0.5 ${ach.unlocked ? "text-white/40" : "text-white/20"}`}>
                    {ach.desc}
                  </p>
                </div>
              ))}
            </div>

            {achievements.length === 0 && (
              <div className="text-center py-8">
                <div className="text-4xl mb-3">🏅</div>
                <p className="text-white/40 text-sm">Complete your first test to unlock achievements!</p>
              </div>
            )}
          </div>

          <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
            <h3 className="text-white font-bold text-lg mb-5 flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-xs">⚡</span>
              Quick Actions
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Link to="/interview"
                className="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-r from-purple-600/20 to-blue-600/20 border border-purple-400/20 hover:from-purple-600/40 hover:to-blue-600/40 transition-all duration-200 group">
                <span className="text-2xl">🎤</span>
                <span className="flex-1 text-white font-semibold text-sm">Start Interview</span>
                <span className="text-purple-300 group-hover:translate-x-1 transition-transform">→</span>
              </Link>

              <Link to="/category"
                className="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-r from-emerald-600/20 to-teal-600/20 border border-emerald-400/20 hover:from-emerald-600/40 hover:to-teal-600/40 transition-all duration-200 group">
                <span className="text-2xl">📝</span>
                <span className="flex-1 text-white font-semibold text-sm">Practice Test</span>
                <span className="text-emerald-300 group-hover:translate-x-1 transition-transform">→</span>
              </Link>

              <Link to="/upload-resume"
                className="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-r from-amber-600/20 to-orange-600/20 border border-amber-400/20 hover:from-amber-600/40 hover:to-orange-600/40 transition-all duration-200 group">
                <span className="text-2xl">📄</span>
                <span className="flex-1 text-white font-semibold text-sm">Upload Resume</span>
                <span className="text-amber-300 group-hover:translate-x-1 transition-transform">→</span>
              </Link>

              <Link to="/dashboard"
                className="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-r from-blue-600/20 to-cyan-600/20 border border-blue-400/20 hover:from-blue-600/40 hover:to-cyan-600/40 transition-all duration-200 group">
                <span className="text-2xl">📊</span>
                <span className="flex-1 text-white font-semibold text-sm">View History</span>
                <span className="text-blue-300 group-hover:translate-x-1 transition-transform">→</span>
              </Link>

              <Link
  to="/image-editor"
  className="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-r from-pink-600/20 to-purple-600/20 border border-pink-400/20 hover:from-pink-600/40 hover:to-purple-600/40 transition-all duration-200 group"
>
  <span className="text-2xl">🖼️</span>
  <span className="flex-1 text-white font-semibold text-sm">
    AI Image Editor
  </span>
  <span className="text-pink-300 group-hover:translate-x-1 transition-transform">
    →
  </span>
</Link>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

// ===== HEADER COMPONENT =====
function Header({ user, navigate }) {
  return (
    <header className="relative z-50 bg-white/5 backdrop-blur-xl border-b border-white/10 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-9 h-9 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/20 group-hover:shadow-purple-500/40 transition-all duration-300 group-hover:scale-110">
              <span className="text-white font-bold text-sm">AI</span>
            </div>
            <span className="text-white font-bold text-lg hidden sm:block">Interview</span>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {[
              { to: "/", label: "Home" },
              { to: "/category", label: "📘 Class 11/12" },
              { to: "/dashboard", label: "Dashboard" },
              { to: "/profile", label: "Profile", active: true },
            ].map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
                  link.active
                    ? "text-white bg-white/10 border border-white/10"
                    : "text-white/60 hover:text-white hover:bg-white/5"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                localStorage.removeItem("user");
                localStorage.removeItem("token");
                navigate("/login");
              }}
              className="px-4 py-1.5 bg-white/10 hover:bg-red-500/20 text-white/80 hover:text-red-300 rounded-lg text-sm font-semibold transition border border-white/10"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}

export default Profile;