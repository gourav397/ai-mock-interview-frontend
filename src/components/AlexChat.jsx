import React, { useState, useRef, useEffect, useCallback } from "react";
import axios from "axios";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";
const SESSION_KEY = "alex_chat_session_id";
const ADMIN_KEY_STORAGE_KEY = "alex_admin_key";
const ALEX_AVATAR = "🤖";
const USER_AVATAR = "👤";

const renderContent = (content) => {
  if (!content) return "";
  let html = content
    .replace(/```(\w*)\n([\s\S]*?)```/g, '<pre><code class="language-$1">$2</code></pre>')
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\*([^*]+)\*/g, "<em>$1</em>")
    .replace(/^•\s(.+)$/gm, "<li>$1</li>")
    .replace(/(<li>.*<\/li>\n?)+/g, "<ul>$&</ul>")
    .replace(/\n\n/g, "</p><p>")
    .replace(/\n/g, "<br/>");
  return `<p>${html}</p>`;
};

const ResultCard = ({ result }) => {
  if (!result) return null;
  const getStatusColor = () => {
    if (result.success) return "#10b981";
    if (result.status === "confirmation_required") return "#f59e0b";
    return "#ef4444";
  };
  const getIcon = () => {
    if (result.success) return "✅";
    if (result.status === "confirmation_required") return "⚠️";
    if (result.status === "denied") return "🚫";
    return "❌";
  };
  return (
    <div style={{
      borderLeft: `4px solid ${getStatusColor()}`,
      background: "#1a1a2e", borderRadius: "8px", padding: "12px 16px",
      marginTop: "8px", fontSize: "13px",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
        <span>{getIcon()}</span>
        <span style={{ color: getStatusColor(), fontWeight: 600, fontSize: "13px" }}>
          {result.status === "completed" ? "COMPLETED" :
           result.status === "confirmation_required" ? "CONFIRMATION REQUIRED" :
           result.status === "denied" ? "DENIED" : "FAILED"}
        </span>
        {result.durationMs && (
          <span style={{ color: "#64748b", fontSize: "12px", marginLeft: "auto" }}>⏱ {result.durationMs}ms</span>
        )}
      </div>
      {result.message && <div style={{ color: "#94a3b8", fontSize: "13px", marginBottom: "4px" }}>{result.message}</div>}
      {result.error && <div style={{ color: "#ef4444", fontSize: "13px", marginBottom: "4px" }}>{result.error}</div>}
    </div>
  );
};

const ChatMessage = ({ message }) => {
  const isUser = message.role === "user";
  return (
    <div style={{
      display: "flex", gap: "12px", marginBottom: "20px",
      flexDirection: isUser ? "row-reverse" : "row", alignItems: "flex-start",
    }}>
      <div style={{
        width: "36px", height: "36px", borderRadius: "50%",
        background: isUser ? "#3b82f6" : "#8b5cf6",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: "16px", flexShrink: 0,
        boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
      }}>
        {isUser ? USER_AVATAR : ALEX_AVATAR}
      </div>
      <div style={{
        maxWidth: "80%",
        background: isUser ? "#1e3a5f" : "#16213e",
        borderRadius: isUser ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
        padding: "14px 18px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
      }}>
        <div style={{ fontSize: "11px", fontWeight: 600, color: isUser ? "#60a5fa" : "#a78bfa", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
          {isUser ? "You" : "ALEX"}
        </div>
        <div className="alex-content" dangerouslySetInnerHTML={{ __html: renderContent(message.content) }}
          style={{ color: "#e2e8f0", fontSize: "14px", lineHeight: "1.6", wordBreak: "break-word" }}
        />
        {message.result && <ResultCard result={message.result} />}
        <div style={{ fontSize: "11px", color: "#475569", marginTop: "8px", textAlign: isUser ? "left" : "right" }}>
          {new Date(message.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </div>
      </div>
    </div>
  );
};

const SUGGESTED_COMMANDS = [
  { label: "🛡️ Scan Security", command: "Scan the project for security vulnerabilities and fix them" },
  { label: "🔍 Inspect Project", command: "Inspect the project structure and show me everything" },
  { label: "🧪 Run Tests", command: "Run the test suite and report results" },
  { label: "📊 System Status", command: "Show me the complete system status" },
  { label: "🐛 Find & Fix Bugs", command: "Find and fix all bugs in the project" },
  { label: "📋 Show Incidents", command: "Show all active incidents and their details" },
];

const AlexChat = ({ isOpen, onClose }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState(() => localStorage.getItem(SESSION_KEY));
  const [error, setError] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [showAdminKeyInput, setShowAdminKeyInput] = useState(false);
  const [adminKeyInput, setAdminKeyInput] = useState("");
  const [adminKey, setAdminKey] = useState(() => localStorage.getItem(ADMIN_KEY_STORAGE_KEY) || "");
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const adminKeyInputRef = useRef(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => { scrollToBottom(); }, [messages, scrollToBottom]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        if (showAdminKeyInput) adminKeyInputRef.current?.focus();
        else inputRef.current?.focus();
      }, 300);
    }
  }, [isOpen, showAdminKeyInput]);

  const getAuthHeaders = useCallback(() => {
    const headers = { "Content-Type": "application/json" };
    if (adminKey) {
      headers["x-admin-key"] = adminKey;
    } else {
      const token = localStorage.getItem("token");
      if (token) headers["Authorization"] = `Bearer ${token}`;
    }
    return headers;
  }, [adminKey]);

  const handleSaveAdminKey = () => {
    const key = adminKeyInput.trim();
    if (key.length < 4) return;
    setAdminKey(key);
    localStorage.setItem(ADMIN_KEY_STORAGE_KEY, key);
    setShowAdminKeyInput(false);
    setAdminKeyInput("");
    setMessages(prev => [...prev, {
      role: "alex", type: "system",
      content: `✅ Admin key configured. Server must have **same key** in \`.env\`:\n\`\`\`\nADMIN_KEY=${key}\n\`\`\``,
      timestamp: new Date().toISOString(),
    }]);
  };

  const handleClearAdminKey = () => {
    localStorage.removeItem(ADMIN_KEY_STORAGE_KEY);
    setAdminKey("");
    setMessages(prev => [...prev, {
      role: "alex", type: "system", content: "🔑 Admin key cleared.",
      timestamp: new Date().toISOString(),
    }]);
  };

  const sendMessage = async (text) => {
    const message = text || input.trim();
    if (!message || loading) return;

    if (!adminKey && !localStorage.getItem("token")) {
      setShowAdminKeyInput(true);
      return;
    }

    setInput("");
    setLoading(true);
    setError(null);

    const userMsg = { role: "user", type: "message", content: message, timestamp: new Date().toISOString() };
    setMessages(prev => [...prev, userMsg]);
    setMessages(prev => [...prev, { role: "alex", type: "typing", content: "...", timestamp: new Date().toISOString() }]);

    try {
      const { data } = await axios.post(
        `${API_BASE}/api/alex/chat`,
        { message, sessionId },
        { headers: getAuthHeaders() }
      );

      setMessages(prev => prev.filter(m => m.type !== "typing"));

      if (data.success) {
        if (data.sessionId) {
          setSessionId(data.sessionId);
          localStorage.setItem(SESSION_KEY, data.sessionId);
        }
        setMessages(prev => [...prev, {
          role: "alex", type: "result", content: data.response,
          result: data.result, timestamp: new Date().toISOString(),
        }]);
        if (data.metrics) setMetrics(data.metrics);
      }
    } catch (err) {
      setMessages(prev => prev.filter(m => m.type !== "typing"));

      const status = err.response?.status;
      const serverMsg = err.response?.data?.message || "";
      const serverError = err.response?.data?.error || "";

      if (status === 401 || status === 403) {
        let detailMsg = "";
        if (adminKey) {
          detailMsg = `❌ **Access Denied (${status})**\n\nYour admin key **\`${adminKey}\`** was rejected by the server.\n\n**Fix this now:**\n1. Open \`backend/.env\`\n2. Add this line:\n   \`\`\`\n   ADMIN_KEY=${adminKey}\n   \`\`\`\n3. Restart server:\n   \`\`\`bash\n   cd backend && npm start\n   \`\`\`\n\nServer response: ${serverMsg || serverError || "Key mismatch"}`;
        } else {
          detailMsg = `🔑 **Authentication Required (${status})**\n\nSet your admin key below or add to \`backend/.env\`:\n\`\`\`\nADMIN_KEY=your-secret-key\n\`\`\``;
          setShowAdminKeyInput(true);
        }
        setMessages(prev => [...prev, {
          role: "alex", type: "error", content: detailMsg,
          timestamp: new Date().toISOString(),
        }]);
      } else {
        setMessages(prev => [...prev, {
          role: "alex", type: "error",
          content: `❌ **Error:** ${err.response?.data?.response || err.message}`,
          timestamp: new Date().toISOString(),
        }]);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const handleSuggested = (cmd) => sendMessage(cmd);

  const resetSession = async () => {
    if (sessionId) {
      try { await axios.delete(`${API_BASE}/api/alex/chat/sessions/${sessionId}`, { headers: getAuthHeaders() }); } catch {}
    }
    localStorage.removeItem(SESSION_KEY);
    setSessionId(null);
    setMessages([]);
    setMetrics(null);
    setError(null);
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: "fixed", bottom: "24px", right: "24px",
      width: "440px", height: "620px",
      background: "linear-gradient(180deg, #0f0f23 0%, #1a1a2e 100%)",
      borderRadius: "16px",
      boxShadow: "0 20px 60px rgba(0,0,0,0.5), 0 0 80px rgba(139,92,246,0.15)",
      display: "flex", flexDirection: "column", overflow: "hidden",
      zIndex: 9999, border: "1px solid rgba(139,92,246,0.2)",
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    }}>
      {/* HEADER */}
      <div style={{
        padding: "16px 20px", background: "linear-gradient(135deg, #1e1b4b, #312e81)",
        borderBottom: "1px solid rgba(139,92,246,0.2)",
        display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{ width: "40px", height: "40px", borderRadius: "12px", background: "linear-gradient(135deg, #8b5cf6, #6d28d9)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px" }}>🤖</div>
          <div>
            <div style={{ color: "#fff", fontWeight: 700, fontSize: "16px" }}>ALEX</div>
            <div style={{ color: "#a78bfa", fontSize: "11px", display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: adminKey ? "#10b981" : "#ef4444", display: "inline-block" }} />
              {adminKey ? "🔑 Owner Mode" : "⛔ Unauthenticated"}
            </div>
          </div>
        </div>
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          {adminKey && (
            <button onClick={handleClearAdminKey} title="Clear Key" style={{ background: "rgba(239,68,68,0.15)", border: "none", color: "#fca5a5", width: "32px", height: "32px", borderRadius: "8px", cursor: "pointer", fontSize: "12px" }}>🔑</button>
          )}
          {metrics && (
            <div style={{ color: "#64748b", fontSize: "11px", textAlign: "right" }}>
              <div>{metrics.commandsExecuted} ✅</div>
              <div>{metrics.commandsFailed} ❌</div>
            </div>
          )}
          <button onClick={resetSession} title="New Session" style={{ background: "rgba(255,255,255,0.1)", border: "none", color: "#cbd5e1", width: "32px", height: "32px", borderRadius: "8px", cursor: "pointer", fontSize: "14px" }}>↺</button>
          <button onClick={onClose} title="Close" style={{ background: "rgba(255,255,255,0.1)", border: "none", color: "#cbd5e1", width: "32px", height: "32px", borderRadius: "8px", cursor: "pointer", fontSize: "18px" }}>✕</button>
        </div>
      </div>

      {/* MESSAGES */}
      <div style={{ flex: 1, overflowY: "auto", padding: "20px", scrollBehavior: "smooth" }}>
        {showAdminKeyInput && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", padding: "20px" }}>
            <div style={{ fontSize: "48px", marginBottom: "16px" }}>🔑</div>
            <div style={{ fontSize: "18px", fontWeight: 600, color: "#e2e8f0", marginBottom: "8px" }}>Admin Key Required</div>
            <div style={{ fontSize: "13px", color: "#94a3b8", maxWidth: "320px", textAlign: "center", marginBottom: "20px" }}>
              Enter the same key that is set in <code style={{ background: "rgba(139,92,246,0.2)", padding: "2px 6px", borderRadius: "4px", color: "#c4b5fd" }}>backend/.env</code> as <code style={{ background: "rgba(139,92,246,0.2)", padding: "2px 6px", borderRadius: "4px", color: "#c4b5fd" }}>ADMIN_KEY</code>
            </div>
            <div style={{ display: "flex", gap: "8px", width: "100%", maxWidth: "350px" }}>
              <input ref={adminKeyInputRef} type="password" value={adminKeyInput}
                onChange={(e) => setAdminKeyInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") handleSaveAdminKey(); }}
                placeholder="Enter admin key..." style={{ flex: 1, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(139,92,246,0.3)", borderRadius: "10px", padding: "10px 14px", color: "#e2e8f0", fontSize: "14px", outline: "none", fontFamily: "monospace" }}
              />
              <button onClick={handleSaveAdminKey} style={{ background: "linear-gradient(135deg, #8b5cf6, #6d28d9)", border: "none", borderRadius: "10px", padding: "10px 20px", color: "#fff", cursor: "pointer", fontSize: "14px", fontWeight: 600 }}>Set Key</button>
            </div>
          </div>
        )}

        {!showAdminKeyInput && messages.length === 0 && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", color: "#64748b", textAlign: "center", padding: "20px" }}>
            <div style={{ fontSize: "48px", marginBottom: "16px" }}>🤖</div>
            <div style={{ fontSize: "18px", fontWeight: 600, color: "#94a3b8", marginBottom: "8px" }}>
              ALEX is ready
            </div>
            <div style={{ fontSize: "13px", color: "#64748b", maxWidth: "300px", marginBottom: "24px" }}>
              {adminKey ? "Give me a goal!" : "Enter your admin key to start."}
            </div>
            {adminKey && (
              <div style={{ display: "flex", flexDirection: "column", gap: "6px", width: "100%" }}>
                {SUGGESTED_COMMANDS.map((cmd, i) => (
                  <button key={i} onClick={() => handleSuggested(cmd.command)}
                    style={{ background: "rgba(139,92,246,0.1)", border: "1px solid rgba(139,92,246,0.2)", borderRadius: "8px", padding: "8px 14px", color: "#c4b5fd", cursor: "pointer", fontSize: "13px", textAlign: "left" }}>
                    {cmd.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {!showAdminKeyInput && messages.map((msg, i) =>
          msg.type === "typing" ? (
            <div key={i} style={{ display: "flex", gap: "12px", marginBottom: "20px", alignItems: "center", padding: "14px 18px", background: "#16213e", borderRadius: "16px 16px 16px 4px", maxWidth: "80%" }}>
              <div style={{ color: "#a78bfa", fontSize: "14px" }}>🤖</div>
              <div style={{ display: "flex", gap: "4px" }}>
                {[0,1,2].map(j => <span key={j} style={{ width:"8px", height:"8px", borderRadius:"50%", background:"#8b5cf6", animation:"bounce 1.4s infinite ease-in-out", animationDelay:`${j*0.2}s` }} />)}
              </div>
            </div>
          ) : <ChatMessage key={i} message={msg} />
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* INPUT */}
      <div style={{ padding: "12px 16px", borderTop: "1px solid rgba(139,92,246,0.15)", background: "rgba(15,15,35,0.95)", flexShrink: 0 }}>
        <div style={{ display: "flex", gap: "8px" }}>
          <textarea ref={inputRef} value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={handleKeyDown}
            placeholder={adminKey ? "Tell ALEX what to do..." : "Click 🔑 to set admin key first..."} rows={1}
            disabled={loading || !adminKey}
            style={{ flex: 1, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(139,92,246,0.2)", borderRadius: "10px", padding: "10px 14px", color: "#e2e8f0", fontSize: "14px", resize: "none", outline: "none", minHeight: "42px", fontFamily: "inherit", opacity: adminKey ? 1 : 0.5 }}
          />
          <button onClick={() => !adminKey ? setShowAdminKeyInput(true) : sendMessage()}
            disabled={loading || (!input.trim() && adminKey)}
            style={{ width: "42px", height: "42px", borderRadius: "10px", background: loading ? "rgba(139,92,246,0.3)" : "linear-gradient(135deg, #8b5cf6, #6d28d9)", border: "none", color: "#fff", cursor: loading || (!input.trim() && adminKey) ? "not-allowed" : "pointer", fontSize: "18px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            {!adminKey ? "🔑" : loading ? "⏳" : "➤"}
          </button>
        </div>
      </div>

      <style>{`
        .alex-content p { margin: 0 0 8px 0; }
        .alex-content p:last-child { margin-bottom: 0; }
        .alex-content ul { margin: 6px 0; padding-left: 20px; }
        .alex-content li { margin-bottom: 4px; }
        .alex-content code { background: rgba(139,92,246,0.15); padding: 2px 6px; border-radius: 4px; font-size: 13px; font-family: 'JetBrains Mono', monospace; color: #c4b5fd; }
        .alex-content pre { background: #0a0a1a; border: 1px solid rgba(139,92,246,0.15); border-radius: 8px; padding: 12px; overflow-x: auto; margin: 8px 0; }
        .alex-content pre code { background: none; padding: 0; color: #e2e8f0; font-size: 12px; }
        .alex-content strong { color: #f1f5f9; }
        textarea::placeholder { color: #475569; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(139,92,246,0.3); border-radius: 3px; }
        @keyframes bounce { 0%, 80%, 100% { transform: scale(0); } 40% { transform: scale(1); } }
      `}</style>
    </div>
  );
};

export default AlexChat;