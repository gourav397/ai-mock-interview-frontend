import { useEffect, useState, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";

function Home() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [scrolled, setScrolled] = useState(0);
  const statsRef = useRef(null);
  const [animateStats, setAnimateStats] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");
    if (token && storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        setUser(null);
      }
    }
  }, []);

  // ─── Scroll Animation ──────────────────────────────────────
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY);
      if (statsRef.current) {
        const rect = statsRef.current.getBoundingClientRect();
        if (rect.top < window.innerHeight - 100) {
          setAnimateStats(true);
        }
      }
    };
    window.addEventListener("scroll", handleScroll);
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // ─── Stats Data ────────────────────────────────────────────
  const stats = [
    { icon: "📝", value: "10,000+", label: "Questions" },
    { icon: "🎯", value: "5,000+", label: "Mock Interviews" },
    { icon: "🏆", value: "98%", label: "Success Rate" },
    { icon: "🌍", value: "50+", label: "Categories" },
  ];

  // ─── Features ──────────────────────────────────────────────
  const features = [
    {
      icon: "🧠",
      title: "AI-Powered Questions",
      desc: "Smart algorithms generate questions tailored to your job role, experience, and tech stack — just like a real interviewer.",
      color: "from-purple-500 to-blue-500",
      border: "border-purple-500/30",
      glow: "shadow-purple-500/20",
    },
    {
      icon: "📊",
      title: "Detailed Analytics",
      desc: "Track your progress with beautiful charts, performance metrics, confidence scores, and area-wise improvement tracking.",
      color: "from-emerald-500 to-teal-500",
      border: "border-emerald-500/30",
      glow: "shadow-emerald-500/20",
    },
    {
      icon: "🎤",
      title: "Voice Recording",
      desc: "Record your answers, play them back, and analyze your communication skills. Build confidence for real interviews.",
      color: "from-amber-500 to-orange-500",
      border: "border-amber-500/30",
      glow: "shadow-amber-500/20",
    },
    {
      icon: "📚",
      title: "Class 11-12 Curriculum",
      desc: "Subject-wise practice tests for Physics, Chemistry, Math, and Biology with NCERT-aligned question banks.",
      color: "from-pink-500 to-rose-500",
      border: "border-pink-500/30",
      glow: "shadow-pink-500/20",
    },
    {
      icon: "📄",
      title: "Resume Analysis",
      desc: "Upload your resume and get AI-driven interview questions based on your actual experience and listed skills.",
      color: "from-cyan-500 to-blue-500",
      border: "border-cyan-500/30",
      glow: "shadow-cyan-500/20",
    },
    {
      icon: "🏅",
      title: "Performance Badges",
      desc: "Earn badges and achievements as you improve. Stay motivated with streaks, milestones, and leaderboards.",
      color: "from-violet-500 to-purple-600",
      border: "border-violet-500/30",
      glow: "shadow-violet-500/20",
    },
  ];

  // ─── How It Works ──────────────────────────────────────────
  const steps = [
    {
      step: "01",
      title: "Choose Your Path",
      desc: "Select your job role, experience level, tech stack, and difficulty — or pick a class 11/12 subject.",
      color: "from-purple-600 to-blue-600",
    },
    {
      step: "02",
      title: "Take the Test",
      desc: "Answer AI-generated questions under timed conditions. Record voice notes and rate your confidence per question.",
      color: "from-blue-600 to-cyan-600",
    },
    {
      step: "03",
      title: "Review & Improve",
      desc: "Get detailed feedback with per-option explanations, confidence analysis, and performance trends over time.",
      color: "from-emerald-600 to-teal-600",
    },
  ];

  // ─── Testimonials ──────────────────────────────────────────
  const testimonials = [
    {
      quote: "This platform helped me crack my Google interview. The AI questions were incredibly accurate to what was asked.",
      name: "Priya Sharma",
      role: "Software Engineer @ Google",
      avatar: "PS",
      color: "from-purple-500 to-blue-500",
    },
    {
      quote: "The voice recording feature is a game-changer. I could analyze my own answers and improve my communication skills dramatically.",
      name: "Rahul Verma",
      role: "Full Stack Developer @ Microsoft",
      avatar: "RV",
      color: "from-emerald-500 to-teal-500",
    },
    {
      quote: "Class 11/12 practice tests helped my daughter score 95% in Physics. The NCERT-aligned questions are superb!",
      name: "Anita Gupta",
      role: "Parent of Class 12 Student",
      avatar: "AG",
      color: "from-amber-500 to-orange-500",
    },
  ];

  // ─── Tech Stack Logos ──────────────────────────────────────
  const techLogos = [
    "React", "Node.js", "Python", "JavaScript", "TypeScript",
    "AWS", "Docker", "MongoDB", "PostgreSQL", "GraphQL",
  ];

  // ─── Hero section parallax style ───────────────────────────
  const heroBgStyle = {
    transform: `translateY(${scrolled * 0.15}px)`,
    opacity: Math.max(1 - scrolled / 600, 0.3),
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-indigo-950 to-slate-900 overflow-hidden">
      {/* ─── ANIMATED BACKGROUND PARTICLES ─────────────────── */}
      <div className="fixed inset-0 pointer-events-none z-0" style={heroBgStyle}>
        <div className="absolute top-20 left-10 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-40 right-20 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute bottom-20 left-1/3 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl animate-pulse delay-700"></div>
      </div>

      {/* ─── HEADER ─────────────────────────────────────────── */}
      <header className="relative z-50 bg-white/5 backdrop-blur-xl border-b border-white/10 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 group">
              <div className="w-9 h-9 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/20 group-hover:shadow-purple-500/40 transition-all duration-300 group-hover:scale-110">
                <span className="text-white font-bold text-sm">AI</span>
              </div>
              <span className="text-white font-bold text-lg hidden sm:block">Interview AI</span>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-1">
              {[
                { to: "/", label: "Home", active: true },
                { to: "/category", label: "📘 Class 11/12" },
                { to: "/dashboard", label: "Dashboard" },
                { to: "/pricing", label: "Pricing" },
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

            {/* Right Side */}
            <div className="flex items-center gap-3">
              <button className="text-white/50 hover:text-white text-sm transition hidden sm:block">🌐 हिंदी</button>

              {user ? (
                <Link
                  to="/dashboard"
                  className="px-5 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold rounded-xl shadow-lg shadow-purple-600/30 hover:shadow-purple-600/50 hover:scale-105 transition-all duration-200 text-sm"
                >
                  🚀 Dashboard
                </Link>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="px-4 py-2 text-white/70 hover:text-white text-sm font-semibold transition"
                  >
                    Log In
                  </Link>
                  <Link
                    to="/register"
                    className="px-5 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold rounded-xl shadow-lg shadow-purple-600/30 hover:shadow-purple-600/50 hover:scale-105 transition-all duration-200 text-sm"
                  >
                    Sign Up Free
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* ─── HERO SECTION ───────────────────────────────────── */}
      <section className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-20 lg:pt-28 lg:pb-32">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left - Text Content */}
          <div className="text-center lg:text-left">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-500/10 border border-purple-400/30 text-purple-300 text-xs font-semibold mb-6 animate-fade-in">
              <span className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></span>
              AI-Powered Interview Preparation
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-extrabold leading-tight">
              <span className="text-white">Crack Your Next</span>
              <br />
              <span className="bg-gradient-to-r from-purple-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent">
                Interview With AI
              </span>
            </h1>

            <p className="mt-6 text-lg sm:text-xl text-white/50 max-w-xl mx-auto lg:mx-0 leading-relaxed">
              Practice with <span className="text-white font-semibold">10,000+ AI-generated questions</span> tailored to your job role,
              experience, and tech stack. Get detailed explanations, track your progress, and ace your dream job.
            </p>

            {/* CTA Buttons */}
            <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <button
                onClick={() => {
                  const token = localStorage.getItem("token");
                  token ? navigate("/interview") : navigate("/login");
                }}
                className="group relative px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold rounded-xl text-lg shadow-xl shadow-purple-600/30 hover:shadow-purple-600/50 hover:scale-105 transition-all duration-300 overflow-hidden"
              >
                <span className="relative z-10">🎯 Start Interview</span>
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-blue-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-xl"></div>
              </button>

              <button
                onClick={() => navigate("/category")}
                className="px-8 py-4 bg-white/5 text-white font-bold rounded-xl border border-white/20 hover:bg-white/10 hover:border-white/30 transition-all duration-200 text-lg backdrop-blur-sm"
              >
                📘 Class 11/12 Practice
              </button>
            </div>

            {/* Trust indicators */}
            <div className="mt-10 flex flex-wrap items-center gap-6 justify-center lg:justify-start">
              <div className="flex items-center gap-2">
                <div className="flex -space-x-2">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className={`w-8 h-8 rounded-full border-2 border-gray-900 bg-gradient-to-br ${
                        i === 1 ? "from-purple-400 to-purple-600" :
                        i === 2 ? "from-blue-400 to-blue-600" :
                        i === 3 ? "from-emerald-400 to-emerald-600" :
                        "from-amber-400 to-amber-600"
                      } flex items-center justify-center text-white text-xs font-bold`}
                    >
                      {["A", "R", "P", "S"][i - 1]}
                    </div>
                  ))}
                </div>
                <span className="text-white/40 text-sm">Trusted by 5K+ students</span>
              </div>
              <div className="text-white/30 text-sm flex items-center gap-2">
                <span className="text-yellow-400">★★★★★</span>
                <span>4.9/5</span>
              </div>
            </div>
          </div>

          {/* Right - Hero Visual / Dashboard Preview */}
          <div className="relative hidden lg:block">
            <div className="relative">
              {/* Main card */}
              <div className="bg-white/5 backdrop-blur-2xl rounded-3xl border border-white/10 p-6 shadow-2xl shadow-purple-500/10">
                {/* Mini header */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-400"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                    <div className="w-3 h-3 rounded-full bg-green-400"></div>
                  </div>
                  <span className="text-white/30 text-xs">Live Preview</span>
                </div>

                {/* Mini question card */}
                <div className="space-y-4">
                  <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-white/40 text-xs">Question 5/30</span>
                      <span className="text-emerald-400 text-xs font-mono">⏱ 42:15</span>
                    </div>
                    <p className="text-white font-semibold text-sm">
                      Explain the Virtual DOM in React and how it improves performance compared to direct DOM manipulation.
                    </p>
                  </div>

                  {/* Options */}
                  <div className="space-y-2">
                    {[
                      { text: "Virtual DOM is a copy of real DOM stored in memory", correct: true },
                      { text: "Virtual DOM replaces the browser's DOM API", correct: false },
                      { text: "Virtual DOM only works with class components", correct: false },
                    ].map((opt, i) => (
                      <div
                        key={i}
                        className={`flex items-center gap-3 p-3 rounded-xl border text-sm transition-all ${
                          opt.correct
                            ? "bg-purple-500/20 border-purple-400/40 text-white"
                            : "bg-white/5 border-white/10 text-white/60"
                        }`}
                      >
                        <div
                          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center text-[10px] font-bold ${
                            opt.correct ? "border-purple-400 bg-purple-500/30 text-purple-300" : "border-white/30"
                          }`}
                        >
                          {String.fromCharCode(65 + i)}
                        </div>
                        <span className="flex-1">{opt.text}</span>
                        {opt.correct && <span className="text-purple-300 text-xs">✓</span>}
                      </div>
                    ))}
                  </div>

                  {/* Progress bar */}
                  <div className="pt-2">
                    <div className="flex justify-between text-xs text-white/30 mb-1">
                      <span>Progress</span>
                      <span>65%</span>
                    </div>
                    <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-purple-500 to-blue-500 rounded-full" style={{ width: "65%" }}></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating badge 1 */}
              <div className="absolute -top-4 -right-4 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-2xl p-3 shadow-xl animate-bounce-slow">
                <div className="text-white text-center">
                  <div className="text-lg font-bold">98%</div>
                  <div className="text-[10px] text-white/80">Success Rate</div>
                </div>
              </div>

              {/* Floating badge 2 */}
              <div className="absolute -bottom-4 -left-4 bg-white/10 backdrop-blur-xl rounded-2xl p-3 border border-white/10 shadow-xl">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">🏆</span>
                  <div>
                    <div className="text-white text-xs font-bold">10,000+</div>
                    <div className="text-white/40 text-[10px]">Questions</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── TECH STACK SCROLLER ─────────────────────────────── */}
      <section className="relative z-10 py-10 border-y border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-white/30 text-sm mb-6">Trusted by developers from top companies</p>
          <div className="flex flex-wrap items-center justify-center gap-6 md:gap-10">
            {techLogos.map((tech) => (
              <div
                key={tech}
                className="text-white/20 hover:text-white/60 transition-all duration-300 font-bold text-lg tracking-wide"
              >
                {tech}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── STATS SECTION ───────────────────────────────────── */}
      <section ref={statsRef} className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {stats.map((stat, i) => (
            <div
              key={i}
              className={`bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 text-center transition-all duration-700 hover:border-purple-400/30 hover:bg-white/10 ${
                animateStats
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-10"
              }`}
              style={{ transitionDelay: `${i * 150}ms` }}
            >
              <div className="text-4xl mb-3">{stat.icon}</div>
              <div className="text-3xl md:text-4xl font-extrabold text-white mb-1">{stat.value}</div>
              <div className="text-white/50 text-sm">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── FEATURES SECTION ────────────────────────────────── */}
      <section className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-white">
            Everything You Need to
            <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent"> Ace Interviews</span>
          </h2>
          <p className="mt-4 text-white/50 text-lg max-w-2xl mx-auto">
            Powerful features designed to transform your interview preparation journey.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, i) => (
            <div
              key={i}
              className={`group bg-white/5 backdrop-blur-sm rounded-2xl p-6 border ${feature.border} hover:bg-white/10 transition-all duration-300 hover:shadow-xl ${feature.glow} hover:-translate-y-1`}
            >
              <div
                className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center text-2xl mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300`}
              >
                {feature.icon}
              </div>
              <h3 className="text-white font-bold text-lg mb-2">{feature.title}</h3>
              <p className="text-white/50 text-sm leading-relaxed">{feature.desc}</p>
              <div className="mt-4 flex items-center gap-1 text-xs text-white/30 group-hover:text-white/60 transition-colors">
                <span>Learn more</span>
                <span className="group-hover:translate-x-1 transition-transform">→</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── HOW IT WORKS ────────────────────────────────────── */}
      <section className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-white">
            How It <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">Works</span>
          </h2>
          <p className="mt-4 text-white/50 text-lg max-w-2xl mx-auto">
            Three simple steps to interview mastery.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          {/* Connecting line */}
          <div className="hidden md:block absolute top-1/2 left-[16.66%] right-[16.66%] h-0.5 bg-gradient-to-r from-purple-500/30 via-blue-500/30 to-transparent -translate-y-1/2"></div>

          {steps.map((step, i) => (
            <div
              key={i}
              className="relative text-center group"
            >
              <div
                className={`w-20 h-20 mx-auto rounded-3xl bg-gradient-to-br ${step.color} flex items-center justify-center text-white text-2xl font-bold shadow-xl shadow-purple-500/20 group-hover:scale-110 transition-transform duration-300 mb-6`}
              >
                {step.step}
              </div>
              <h3 className="text-white font-bold text-xl mb-2">{step.title}</h3>
              <p className="text-white/50 text-sm leading-relaxed max-w-xs mx-auto">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── TESTIMONIALS ────────────────────────────────────── */}
      <section className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-white">
            What Our <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">Users Say</span>
          </h2>
          <p className="mt-4 text-white/50 text-lg max-w-2xl mx-auto">
            Join thousands of successful candidates who cracked their dream interviews.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <div
              key={i}
              className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 hover:bg-white/10 transition-all duration-300 hover:border-purple-400/30"
            >
              <div className="flex gap-1 mb-4">
                {[1, 2, 3, 4, 5].map((star) => (
                  <span key={star} className="text-yellow-400 text-sm">★</span>
                ))}
              </div>
              <p className="text-white/70 text-sm leading-relaxed mb-6 italic">
                "{t.quote}"
              </p>
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-xl bg-gradient-to-br ${t.color} flex items-center justify-center text-white text-sm font-bold`}
                >
                  {t.avatar}
                </div>
                <div>
                  <p className="text-white font-semibold text-sm">{t.name}</p>
                  <p className="text-white/40 text-xs">{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── CTA SECTION ─────────────────────────────────────── */}
      <section className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="bg-gradient-to-br from-purple-600/30 via-blue-600/20 to-indigo-600/30 backdrop-blur-xl rounded-3xl p-10 md:p-16 border border-white/10 text-center shadow-2xl shadow-purple-500/10">
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">
            Ready to Ace Your Interview? 🚀
          </h2>
          <p className="text-white/60 text-lg max-w-2xl mx-auto mb-8">
            Join 5,000+ successful candidates. Start practicing with AI-powered questions today — it's free!
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => {
                const token = localStorage.getItem("token");
                token ? navigate("/interview") : navigate("/register");
              }}
              className="px-10 py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold rounded-xl text-lg shadow-xl shadow-purple-600/30 hover:shadow-purple-600/50 hover:scale-105 transition-all duration-300"
            >
              {user ? "🎯 Start Interview Now" : "✨ Get Started Free"}
            </button>

            {!user && (
              <button
                onClick={() => navigate("/login")}
                className="px-10 py-4 bg-white/5 text-white font-bold rounded-xl border border-white/20 hover:bg-white/10 transition-all duration-200 text-lg"
              >
                🔑 I Already Have an Account
              </button>
            )}
          </div>

          {/* Features mini-list */}
          <div className="mt-8 flex flex-wrap justify-center gap-6 text-sm text-white/40">
            <span>✅ No credit card</span>
            <span>✅ 10,000+ questions</span>
            <span>✅ Detailed explanations</span>
            <span>✅ Track progress</span>
          </div>
        </div>
      </section>

      {/* ─── FOOTER ──────────────────────────────────────────── */}
      <footer className="relative z-10 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {/* Brand */}
            <div className="col-span-2 md:col-span-1">
              <Link to="/" className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-xs">AI</span>
                </div>
                <span className="text-white font-bold">Interview AI</span>
              </Link>
              <p className="text-white/40 text-sm leading-relaxed">
                AI-powered interview preparation platform. Practice smart, crack your dream job.
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="text-white font-semibold mb-4 text-sm">Quick Links</h4>
              <div className="space-y-2.5">
                {[
                  { label: "Home", to: "/" },
                  { label: "Practice Tests", to: "/category" },
                  { label: "AI Interview", to: "/interview" },
                  { label: "Dashboard", to: "/dashboard" },
                ].map((link) => (
                  <Link
                    key={link.label}
                    to={link.to}
                    className="block text-white/40 hover:text-white text-sm transition-colors"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>

            {/* Resources */}
            <div>
              <h4 className="text-white font-semibold mb-4 text-sm">Resources</h4>
              <div className="space-y-2.5">
                {[
                  { label: "Blog", to: "/blog" },
                  { label: "Help Center", to: "/help" },
                  { label: "Privacy Policy", to: "/privacy" },
                  { label: "Terms of Service", to: "/terms" },
                ].map((link) => (
                  <Link
                    key={link.label}
                    to={link.to}
                    className="block text-white/40 hover:text-white text-sm transition-colors"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>

            {/* Subjects */}
            <div>
              <h4 className="text-white font-semibold mb-4 text-sm">Class 11/12 Subjects</h4>
              <div className="space-y-2.5">
                {[
                  "Physics",
                  "Chemistry",
                  "Mathematics",
                  "Biology",
                ].map((sub) => (
                  <Link
                    key={sub}
                    to={`/category?subject=${sub}`}
                    className="block text-white/40 hover:text-white text-sm transition-colors"
                  >
                    {sub}
                  </Link>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-10 pt-8 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-white/30 text-sm">
              © 2026 Interview AI. All rights reserved.
            </p>
            <div className="flex items-center gap-4">
              <span className="text-white/30 text-sm">Made with ❤️ for candidates</span>
            </div>
          </div>
        </div>
      </footer>

      {/* ─── CUSTOM CSS FOR ANIMATIONS ────────────────────────── */}
      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.6s ease-out;
        }
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        .animate-bounce-slow {
          animation: bounce-slow 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}

export default Home;