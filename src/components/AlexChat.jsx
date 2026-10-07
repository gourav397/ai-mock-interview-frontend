import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
} from "react";
import axios from "axios";

const API_BASE = (
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000"
).replace(/\/+$/, "");

const SESSION_KEY = "alex_chat_session_id";
const OWNER_MEMORY_SESSION_KEY =
  "alex_owner_memory_session_id";

const ADMIN_KEY_STORAGE_KEY = "alex_admin_key";
const WINDOWS_AGENT_TOKEN_STORAGE_KEY =
  "alex_windows_agent_token";

const ALEX_AVATAR = "🤖";
const USER_AVATAR = "👤";

// ============================================================
// IDENTITY
// ============================================================

const decodeJwtPayload = (token) => {
  try {
    const parts = String(token || "").split(".");

    if (parts.length !== 3) {
      return null;
    }

    const base64 = parts[1]
      .replace(/-/g, "+")
      .replace(/_/g, "/");

    const padded =
      base64 +
      "=".repeat(
        (4 - (base64.length % 4)) % 4
      );

    const json = decodeURIComponent(
      atob(padded)
        .split("")
        .map(
          (c) =>
            `%${(
              "00" +
              c.charCodeAt(0).toString(16)
            ).slice(-2)}`
        )
        .join("")
    );

    return JSON.parse(json);
  } catch {
    return null;
  }
};

const getCurrentToken = () => {
  try {
    return (
      localStorage.getItem("token") ||
      sessionStorage.getItem("token") ||
      ""
    );
  } catch {
    return "";
  }
};

const getIdentityStorageKey = () => {
  try {
    const token = getCurrentToken();
    const payload = decodeJwtPayload(token);

    const id =
      payload?.id ||
      payload?._id ||
      payload?.userId;

    if (id) {
      return String(id);
    }

    const email = payload?.email;

    if (email) {
      return `email:${String(
        email
      ).toLowerCase()}`;
    }

    return "anonymous";
  } catch {
    return "anonymous";
  }
};

const getSessionStorageKey = () =>
  `${SESSION_KEY}:${getIdentityStorageKey()}`;

const getOwnerMemoryStorageKey = () =>
  `${OWNER_MEMORY_SESSION_KEY}:${getIdentityStorageKey()}`;

// ============================================================
// SESSION ID
// ============================================================

const createSessionId = () => {
  try {
    if (
      typeof crypto !== "undefined" &&
      crypto.randomUUID
    ) {
      return `alex_chat_${crypto.randomUUID()}`;
    }
  } catch {}

  return `alex_chat_${Date.now()}_${Math.random()
    .toString(36)
    .slice(2)}`;
};

// ============================================================
// HTML ESCAPE
// ============================================================

const escapeHtml = (value) => {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
};

// ============================================================
// CONTENT RENDERER
// ============================================================

const renderContent = (content) => {
  if (!content) return "";

  let html = escapeHtml(content);

  html = html
    .replace(
      /```(\w*)\n([\s\S]*?)```/g,
      '<pre><code class="language-$1">$2</code></pre>'
    )
    .replace(
      /`([^`]+)`/g,
      "<code>$1</code>"
    )
    .replace(
      /^### (.+)$/gm,
      "<h3>$1</h3>"
    )
    .replace(
      /^## (.+)$/gm,
      "<h3>$1</h3>"
    )
    .replace(
      /^# (.+)$/gm,
      "<h3>$1</h3>"
    )
    .replace(
      /\*\*([^*]+)\*\*/g,
      "<strong>$1</strong>"
    )
    .replace(
      /\*([^*]+)\*/g,
      "<em>$1</em>"
    )
    .replace(
      /^•\s(.+)$/gm,
      "<li>$1</li>"
    )
    .replace(
      /^[-*]\s(.+)$/gm,
      "<li>$1</li>"
    )
    .replace(
      /^\d+\.\s(.+)$/gm,
      "<li>$1</li>"
    )
    .replace(
      /(<li>.*<\/li>\n?)+/g,
      "<ul>$&</ul>"
    )
    .replace(
      /\n\n/g,
      "</p><p>"
    )
    .replace(
      /\n/g,
      "<br/>"
    );

  return `<p>${html}</p>`;
};

// ============================================================
// FIXED CODE BLOCK
// ============================================================

const FixedCodeBlock = ({
  code,
  fileName,
}) => {
  const [copied, setCopied] =
    useState(false);

  if (!code) return null;

  const handleCopy = async () => {
    try {
      if (
        navigator.clipboard?.writeText
      ) {
        await navigator.clipboard.writeText(
          code
        );
      } else {
        const textarea =
          document.createElement(
            "textarea"
          );

        textarea.value = code;
        document.body.appendChild(
          textarea
        );
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(
          textarea
        );
      }

      setCopied(true);

      setTimeout(
        () => setCopied(false),
        2000
      );
    } catch {
      setCopied(false);
    }
  };

  const handleDownload = () => {
    try {
      const blob = new Blob(
        [code],
        {
          type:
            "text/plain;charset=utf-8",
        }
      );

      const url =
        URL.createObjectURL(blob);

      const anchor =
        document.createElement("a");

      anchor.href = url;
      anchor.download =
        fileName ||
        "fixed-code.txt";

      document.body.appendChild(
        anchor
      );

      anchor.click();

      document.body.removeChild(
        anchor
      );

      setTimeout(
        () =>
          URL.revokeObjectURL(
            url
          ),
        1000
      );
    } catch {}
  };

  return (
    <div
      style={{
        marginTop: "10px",
        borderRadius: "10px",
        overflow: "hidden",
        border:
          "1px solid rgba(16,185,129,0.35)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent:
            "space-between",
          background:
            "rgba(16,185,129,0.12)",
          padding: "8px 12px",
          gap: "8px",
        }}
      >
        <span
          style={{
            color: "#34d399",
            fontSize: "12px",
            fontWeight: 700,
            overflow: "hidden",
            textOverflow:
              "ellipsis",
            whiteSpace:
              "nowrap",
          }}
        >
          ✅ FIXED CODE —{" "}
          {fileName ||
            "fixed-code"}
        </span>

        <div
          style={{
            display: "flex",
            gap: "6px",
            flexShrink: 0,
          }}
        >
          <button
            onClick={handleCopy}
            style={{
              background:
                copied
                  ? "#10b981"
                  : "rgba(255,255,255,0.1)",
              border: "none",
              color: "#fff",
              borderRadius: "6px",
              padding:
                "4px 10px",
              fontSize: "11px",
              cursor: "pointer",
            }}
          >
            {copied
              ? "✓ Copied!"
              : "📋 Copy"}
          </button>

          <button
            onClick={
              handleDownload
            }
            style={{
              background:
                "rgba(255,255,255,0.1)",
              border: "none",
              color: "#e2e8f0",
              borderRadius: "6px",
              padding:
                "4px 10px",
              fontSize: "11px",
              cursor: "pointer",
            }}
          >
            ⬇ Download
          </button>
        </div>
      </div>

      <pre
        style={{
          margin: 0,
          padding: "12px",
          background: "#0a0a1a",
          color: "#a7f3d0",
          fontSize: "11.5px",
          lineHeight: "1.5",
          overflowX: "auto",
          maxHeight: "300px",
          overflowY: "auto",
          fontFamily:
            "'JetBrains Mono', monospace",
        }}
      >
        <code>{code}</code>
      </pre>
    </div>
  );
};

// ============================================================
// UPLOAD RESULT
// ============================================================

const UploadResultPanel = ({
  upload,
}) => {
  const [
    showOriginal,
    setShowOriginal,
  ] = useState(false);

  if (
    !upload ||
    !upload.success
  ) {
    return null;
  }

  const {
    analysis,
    fixed,
    original,
    fileName,
    language,
  } = upload;

  const sevColor = {
    CRITICAL: "#ef4444",
    HIGH: "#f97316",
    MEDIUM: "#f59e0b",
    LOW: "#64748b",
  };

  return (
    <div
      style={{
        marginTop: "10px",
        borderRadius: "10px",
        overflow: "hidden",
        border:
          "1px solid rgba(139,92,246,0.3)",
        background: "#0d0d21",
      }}
    >
      <div
        style={{
          padding:
            "10px 14px",
          background:
            "rgba(139,92,246,0.12)",
          borderBottom:
            "1px solid rgba(139,92,246,0.2)",
        }}
      >
        <div
          style={{
            color: "#c4b5fd",
            fontWeight: 700,
            fontSize: "13px",
          }}
        >
          📁{" "}
          {fileName ||
            "Uploaded file"}{" "}
          —{" "}
          {language ||
            "Unknown"}
        </div>

        {analysis?.summary && (
          <div
            style={{
              color: "#94a3b8",
              fontSize: "12px",
              marginTop: "4px",
            }}
          >
            {analysis.summary}
          </div>
        )}

        <div
          style={{
            display: "flex",
            gap: "10px",
            marginTop: "6px",
            flexWrap:
              "wrap",
          }}
        >
          {[
            "CRITICAL",
            "HIGH",
            "MEDIUM",
            "LOW",
          ].map((severity) => (
            <span
              key={severity}
              style={{
                color:
                  sevColor[
                    severity
                  ],
                fontSize: "11px",
                fontWeight: 600,
              }}
            >
              {severity}:{" "}
              {analysis
                ?.severityCount?.[
                severity
              ] || 0}
            </span>
          ))}
        </div>
      </div>

      {analysis?.issues
        ?.length > 0 && (
        <div
          style={{
            padding:
              "10px 14px",
            maxHeight: "180px",
            overflowY:
              "auto",
          }}
        >
          {analysis.issues
            .slice(0, 10)
            .map(
              (issue, index) => (
                <div
                  key={index}
                  style={{
                    marginBottom:
                      "8px",
                    fontSize:
                      "12px",
                  }}
                >
                  <span
                    style={{
                      color:
                        sevColor[
                          issue?.severity
                        ] ||
                        "#94a3b8",
                      fontWeight:
                        700,
                    }}
                  >
                    [
                    {issue?.severity ||
                      "INFO"}
                    ]
                  </span>{" "}
                  <span
                    style={{
                      color:
                        "#e2e8f0",
                    }}
                  >
                    {issue?.title ||
                      "Issue"}
                  </span>

                  {issue?.line && (
                    <span
                      style={{
                        color:
                          "#64748b",
                      }}
                    >
                      {" "}
                      (line{" "}
                      {
                        issue.line
                      })
                    </span>
                  )}

                  {issue?.fix && (
                    <div
                      style={{
                        color:
                          "#94a3b8",
                        fontSize:
                          "11px",
                        marginTop:
                          "2px",
                      }}
                    >
                      →{" "}
                      {issue.fix}
                    </div>
                  )}
                </div>
              )
            )}
        </div>
      )}

      {fixed?.code && (
        <FixedCodeBlock
          code={fixed.code}
          fileName={`fixed_${
            fileName ||
            "code"
          }`}
        />
      )}

      {fixed?.syntaxValid ===
        false && (
        <div
          style={{
            padding:
              "8px 14px",
            color: "#f59e0b",
            fontSize: "12px",
          }}
        >
          ⚠️{" "}
          {fixed.syntaxError ||
            "Syntax validation failed."}
        </div>
      )}

      <div
        style={{
          padding:
            "8px 14px",
          borderTop:
            "1px solid rgba(255,255,255,0.05)",
        }}
      >
        <button
          onClick={() =>
            setShowOriginal(
              (value) => !value
            )
          }
          style={{
            background: "none",
            border: "none",
            color: "#64748b",
            fontSize: "11px",
            cursor: "pointer",
          }}
        >
          {showOriginal
            ? "▲ Hide original code"
            : "▼ Show original code"}
        </button>

        {showOriginal &&
          original?.code && (
            <pre
              style={{
                marginTop: "6px",
                padding: "10px",
                background:
                  "#0a0a1a",
                color:
                  "#94a3b8",
                fontSize: "11px",
                maxHeight: "200px",
                overflowY:
                  "auto",
                borderRadius:
                  "6px",
              }}
            >
              <code>
                {original.code}
              </code>
            </pre>
          )}
      </div>
    </div>
  );
};

// ============================================================
// REPORT PANEL
// ============================================================

const ReportPanel = ({
  report,
}) => {
  const [
    expanded,
    setExpanded,
  ] = useState(false);

  if (!report) return null;

  return (
    <div
      style={{
        marginTop: "10px",
        border:
          "1px solid rgba(139,92,246,0.3)",
        borderRadius: "10px",
        overflow: "hidden",
        background:
          "#0d0d21",
      }}
    >
      <button
        onClick={() =>
          setExpanded(
            (value) => !value
          )
        }
        style={{
          width: "100%",
          background:
            "rgba(139,92,246,0.15)",
          border: "none",
          padding:
            "10px 14px",
          color: "#c4b5fd",
          fontSize: "13px",
          fontWeight: 600,
          cursor: "pointer",
          display: "flex",
          alignItems:
            "center",
          justifyContent:
            "space-between",
        }}
      >
        <span>
          📊 Analysis Report (
          {Math.ceil(
            report.length /
              1000
          )}
          k chars)
        </span>

        <span>
          {expanded
            ? "▲ Collapse"
            : "▼ Expand"}
        </span>
      </button>

      <div
        className="alex-content alex-report"
        dangerouslySetInnerHTML={{
          __html:
            renderContent(
              expanded
                ? report
                : `${report.slice(
                    0,
                    2500
                  )}\n\n_report truncated. Click Expand for full report._`
            ),
        }}
        style={{
          padding: "14px",
          color: "#e2e8f0",
          fontSize:
            "12.5px",
          lineHeight: "1.6",
          wordBreak:
            "break-word",
          maxHeight:
            expanded
              ? "400px"
              : "260px",
          overflowY:
            "auto",
          whiteSpace:
            "normal",
        }}
      />
    </div>
  );
};

// ============================================================
// RESULT CARD
// ============================================================

const ResultCard = ({
  result,
}) => {
  if (!result) return null;

  const getStatusColor =
    () => {
      if (result.success)
        return "#10b981";

      if (
        result.status ===
        "confirmation_required"
      ) {
        return "#f59e0b";
      }

      if (
        result.status ===
        "denied"
      ) {
        return "#ef4444";
      }

      return "#ef4444";
    };

  const getIcon = () => {
    if (result.success)
      return "✅";

    if (
      result.status ===
      "confirmation_required"
    ) {
      return "⚠️";
    }

    if (
      result.status ===
      "denied"
    ) {
      return "🚫";
    }

    return "❌";
  };

  const systemInfo =
    result?.data ||
    result?.result ||
    result?.result?.result ||
    null;

  return (
    <div
      style={{
        borderLeft:
          `4px solid ${getStatusColor()}`,
        background:
          "#1a1a2e",
        borderRadius: "8px",
        padding:
          "12px 16px",
        marginTop: "8px",
        fontSize: "13px",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems:
            "center",
          gap: "8px",
          marginBottom:
            "8px",
        }}
      >
        <span>
          {getIcon()}
        </span>

        <span
          style={{
            color:
              getStatusColor(),
            fontWeight: 600,
            fontSize: "13px",
          }}
        >
          {result.status ===
          "completed"
            ? "COMPLETED"
            : result.status ===
              "confirmation_required"
            ? "CONFIRMATION REQUIRED"
            : result.status ===
              "denied"
            ? "DENIED"
            : "FAILED"}
        </span>

        {result.durationMs && (
          <span
            style={{
              color: "#64748b",
              fontSize: "12px",
              marginLeft:
                "auto",
            }}
          >
            ⏱{" "}
            {
              result.durationMs
            }
            ms
          </span>
        )}
      </div>

      {result.message && (
        <div
          style={{
            color: "#94a3b8",
            fontSize: "13px",
            marginBottom:
              "8px",
          }}
        >
          {result.message}
        </div>
      )}

      {result.error && (
        <div
          style={{
            color: "#ef4444",
            fontSize: "13px",
            marginBottom:
              "8px",
          }}
        >
          {result.error}
        </div>
      )}

      {systemInfo && (
        <div
          style={{
            marginTop: "10px",
            background:
              "rgba(255,255,255,0.04)",
            border:
              "1px solid rgba(139,92,246,0.18)",
            borderRadius:
              "10px",
            padding:
              "12px",
          }}
        >
          <div
            style={{
              color: "#c4b5fd",
              fontWeight: 700,
              fontSize: "13px",
              marginBottom:
                "10px",
            }}
          >
            Execution Details
          </div>

          <pre
            style={{
              margin: 0,
              whiteSpace:
                "pre-wrap",
              wordBreak:
                "break-word",
              color:
                "#94a3b8",
              fontSize:
                "11px",
              maxHeight:
                "260px",
              overflowY:
                "auto",
            }}
          >
            {JSON.stringify(
              systemInfo,
              null,
              2
            )}
          </pre>
        </div>
      )}
    </div>
  );
};

// ============================================================
// MAIN ALEX CHAT
// ============================================================

const AlexChat = ({
  isOpen,
  onClose,
  ownerMode = false,
}) => {
  const [messages, setMessages] =
    useState([]);

  const [input, setInput] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [uploading, setUploading] =
    useState(false);

  const [
    sessionId,
    setSessionId,
  ] = useState(() => {
    try {
      const saved =
        localStorage.getItem(
          getSessionStorageKey()
        );

      if (saved) {
        return saved;
      }
    } catch {}

    return createSessionId();
  });

  const [error, setError] =
    useState(null);

  const [metrics, setMetrics] =
    useState(null);

  const [
    showAdminKeyInput,
    setShowAdminKeyInput,
  ] = useState(false);

  const [
    adminKeyInput,
    setAdminKeyInput,
  ] = useState("");

  const [adminKey, setAdminKey] =
    useState(() => {
      if (!ownerMode) return "";

      try {
        return (
          localStorage.getItem(
            ADMIN_KEY_STORAGE_KEY
          ) || ""
        );
      } catch {
        return "";
      }
    });

  const [
    windowsAgentToken,
    setWindowsAgentToken,
  ] = useState(() => {
    if (!ownerMode) return "";

    try {
      return (
        localStorage.getItem(
          WINDOWS_AGENT_TOKEN_STORAGE_KEY
        ) || ""
      );
    } catch {
      return "";
    }
  });

  const [
    showWindowsAgentTokenInput,
    setShowWindowsAgentTokenInput,
  ] = useState(false);

  const [
    windowsAgentTokenInput,
    setWindowsAgentTokenInput,
  ] = useState("");

  const messagesEndRef =
    useRef(null);

  const inputRef =
    useRef(null);

  const adminKeyInputRef =
    useRef(null);

  const fileInputRef =
    useRef(null);

  // ==========================================================
  // AUTH
  // ==========================================================

  const getToken = useCallback(
    () => getCurrentToken(),
    []
  );

  const hasAuthentication =
    useCallback(() => {
      return Boolean(
        getToken()
      );
    }, [getToken]);

  const authenticated =
    hasAuthentication();

  // ==========================================================
  // AUTH HEADERS
  // ==========================================================

  const getAuthHeaders =
    useCallback(() => {
      const headers = {
        "Content-Type":
          "application/json",
      };

      const token =
        getToken();

      if (token) {
        headers.Authorization =
          `Bearer ${token}`;
      }

      // ADMIN_KEY is intentionally
      // available ONLY in owner mode.
      if (
        ownerMode &&
        !token &&
        adminKey
      ) {
        headers[
          "x-admin-key"
        ] = adminKey;
      }

      return headers;
    }, [
      getToken,
      ownerMode,
      adminKey,
    ]);

  const getUploadAuthHeaders =
    useCallback(() => {
      const headers = {};

      const token =
        getToken();

      if (token) {
        headers.Authorization =
          `Bearer ${token}`;
      }

      if (
        ownerMode &&
        !token &&
        adminKey
      ) {
        headers[
          "x-admin-key"
        ] = adminKey;
      }

      return headers;
    }, [
      getToken,
      ownerMode,
      adminKey,
    ]);

  // ==========================================================
  // SESSION PERSISTENCE
  // ==========================================================

  const persistSessionId =
    useCallback(
      (id) => {
        if (!id) return;

        setSessionId(id);

        try {
          localStorage.setItem(
            getSessionStorageKey(),
            id
          );

          if (ownerMode) {
            localStorage.setItem(
              getOwnerMemoryStorageKey(),
              id
            );
          }
        } catch {}
      },
      [ownerMode]
    );

  // ==========================================================
  // LOAD SESSION FROM SERVER
  // ==========================================================

  const loadSession =
    useCallback(
      async (id) => {
        if (
          !id ||
          !authenticated
        ) {
          return false;
        }

        try {
          const response =
            await axios.get(
              `${API_BASE}/api/alex/chat/sessions/${encodeURIComponent(
                id
              )}`,
              {
                headers:
                  getAuthHeaders(),
                timeout: 30000,
              }
            );

          const data =
            response?.data;

          if (
            data?.success &&
            data?.data
          ) {
            const session =
              data.data;

            if (
              Array.isArray(
                session.messages
              )
            ) {
              const restored =
                session.messages
                  .map(
                    (message) => ({
                      ...message,
                      role:
                        message.role ===
                        "assistant"
                          ? "alex"
                          : message.role,
                    })
                  );

              setMessages(
                restored
              );
            }

            if (
              session.metrics
            ) {
              setMetrics(
                session.metrics
              );
            }

            return true;
          }
        } catch (err) {
          const status =
            err?.response?.status;

          // A missing/old session
          // should not break chat.
          if (
            status === 404
          ) {
            try {
              localStorage.removeItem(
                getSessionStorageKey()
              );
            } catch {}
          }

          // Never delete a valid JWT
          // merely because session restore
          // failed.
        }

        return false;
      },
      [
        authenticated,
        getAuthHeaders,
      ]
    );

  // ==========================================================
  // INITIAL SESSION
  // ==========================================================

  useEffect(() => {
    if (!isOpen) return;

    let active = true;

    const initialize =
      async () => {
        if (!authenticated) {
          if (active) {
            setMessages([]);
          }
          return;
        }

        let id =
          sessionId;

        if (!id) {
          id =
            createSessionId();

          persistSessionId(id);
        }

        const restored =
          await loadSession(id);

        if (
          active &&
          !restored
        ) {
          setMessages(
            (prev) =>
              prev.length
                ? prev
                : [
                    {
                      role: "alex",
                      type: "system",
                      content:
                        ownerMode
                          ? "🤖 **ALEX Owner Mode**\n\nReady. Owner-level commands remain protected by server-side authorization."
                          : "🤖 **ALEX**\n\nHi! Main ALEX hoon. Aap mujhse questions, project help, analysis aur normal tasks ke baare mein baat kar sakte ho.",
                      timestamp:
                        new Date().toISOString(),
                    },
                  ]
          );
        }
      };

    initialize();

    return () => {
      active = false;
    };
  }, [
    isOpen,
    authenticated,
    ownerMode,
    sessionId,
    loadSession,
    persistSessionId,
  ]);

  // ==========================================================
  // SCROLL
  // ==========================================================

  const scrollToBottom =
    useCallback(() => {
      messagesEndRef.current?.scrollIntoView(
        {
          behavior: "smooth",
        }
      );
    }, []);

  useEffect(() => {
    scrollToBottom();
  }, [
    messages,
    scrollToBottom,
  ]);

  // ==========================================================
  // FOCUS
  // ==========================================================

  useEffect(() => {
    if (!isOpen) return;

    const timer =
      setTimeout(() => {
        if (
          showWindowsAgentTokenInput
        ) {
          return;
        }

        if (
          showAdminKeyInput
        ) {
          adminKeyInputRef.current?.focus();
        } else {
          inputRef.current?.focus();
        }
      }, 300);

    return () =>
      clearTimeout(timer);
  }, [
    isOpen,
    showAdminKeyInput,
    showWindowsAgentTokenInput,
  ]);

  // ==========================================================
  // OWNER ADMIN KEY
  // ==========================================================

  const handleSaveAdminKey =
    () => {
      if (!ownerMode) {
        return;
      }

      const key =
        adminKeyInput.trim();

      if (key.length < 4) {
        setError(
          "Valid admin key required."
        );
        return;
      }

      setAdminKey(key);

      try {
        localStorage.setItem(
          ADMIN_KEY_STORAGE_KEY,
          key
        );
      } catch {}

      setShowAdminKeyInput(
        false
      );

      setAdminKeyInput("");
      setError(null);

      setMessages(
        (prev) => [
          ...prev,
          {
            role: "alex",
            type: "system",
            content:
              "✅ Admin key configured. Server-side ADMIN_KEY must match.",
            timestamp:
              new Date().toISOString(),
          },
        ]
      );
    };

  const handleClearAdminKey =
    () => {
      if (!ownerMode) {
        return;
      }

      try {
        localStorage.removeItem(
          ADMIN_KEY_STORAGE_KEY
        );
      } catch {}

      setAdminKey("");

      setMessages(
        (prev) => [
          ...prev,
          {
            role: "alex",
            type: "system",
            content:
              "🔑 Admin key cleared.",
            timestamp:
              new Date().toISOString(),
          },
        ]
      );
    };

  // ==========================================================
  // WINDOWS AGENT
  // ==========================================================

  const handleSaveWindowsAgentToken =
    () => {
      if (!ownerMode) {
        return;
      }

      const token =
        windowsAgentTokenInput.trim();

      if (!token) {
        setError(
          "Windows Agent pairing token required."
        );
        return;
      }

      try {
        localStorage.setItem(
          WINDOWS_AGENT_TOKEN_STORAGE_KEY,
          token
        );
      } catch {}

      setWindowsAgentToken(
        token
      );

      setWindowsAgentTokenInput(
        ""
      );

      setShowWindowsAgentTokenInput(
        false
      );

      setMessages(
        (prev) => [
          ...prev,
          {
            role: "alex",
            type: "system",
            content:
              "✅ Windows Agent paired successfully. Local laptop tools are available only to authorized ALEX commands.",
            timestamp:
              new Date().toISOString(),
          },
        ]
      );
    };

  const handleClearWindowsAgentToken =
    () => {
      if (!ownerMode) {
        return;
      }

      try {
        localStorage.removeItem(
          WINDOWS_AGENT_TOKEN_STORAGE_KEY
        );
      } catch {}

      setWindowsAgentToken("");

      setWindowsAgentTokenInput("");

      setShowWindowsAgentTokenInput(
        false
      );

      setMessages(
        (prev) => [
          ...prev,
          {
            role: "alex",
            type: "system",
            content:
              "🖥️ Windows Agent pairing cleared.",
            timestamp:
              new Date().toISOString(),
          },
        ]
      );
    };

  // ==========================================================
  // FILE UPLOAD
  // ==========================================================

  const handleFileSelect =
    async (event) => {
      const file =
        event.target.files?.[0];

      event.target.value = "";

      if (
        !file ||
        uploading
      ) {
        return;
      }

      if (
        !hasAuthentication()
      ) {
        setError(
          "Login required. Pehle login karo."
        );
        return;
      }

      setError(null);
      setUploading(true);
      setLoading(true);

      const userMessage = {
        role: "user",
        type: "message",
        content:
          `📤 Uploaded file: **${file.name}** (${(
            file.size / 1024
          ).toFixed(1)} KB)`,
        timestamp:
          new Date().toISOString(),
      };

      const typingMessage = {
        role: "alex",
        type: "typing",
        content: "...",
        timestamp:
          new Date().toISOString(),
      };

      setMessages(
        (prev) => [
          ...prev,
          userMessage,
          typingMessage,
        ]
      );

      try {
        const formData =
          new FormData();

        formData.append(
          "file",
          file
        );

        const hint =
          input.trim();

        if (hint) {
          formData.append(
            "hint",
            hint
          );
        }

        const response =
          await axios.post(
            `${API_BASE}/api/alex/upload/analyze`,
            formData,
            {
              headers:
                getUploadAuthHeaders(),
              timeout:
                120000,
            }
          );

        const data =
          response.data;

        setMessages(
          (prev) =>
            prev.filter(
              (message) =>
                message.type !==
                "typing"
            )
        );

        if (data?.sessionId) {
          persistSessionId(
            data.sessionId
          );
        }

        if (data?.success) {
          const parts = [];

          if (
            data.analysis
              ?.summary
          ) {
            parts.push(
              data.analysis
                .summary
            );
          }

          if (
            data.fixed
              ?.syntaxValid
          ) {
            parts.push(
              "\n✅ **Fixed code passed syntax validation.**"
            );
          }

          if (
            data.explanation
          ) {
            parts.push(
              `\n${data.explanation}`
            );
          }

          setMessages(
            (prev) => [
              ...prev,
              {
                role: "alex",
                type:
                  "upload-result",
                content:
                  parts.join(
                    "\n"
                  ) ||
                  "File processed successfully.",
                uploadResult:
                  data,
                timestamp:
                  new Date().toISOString(),
              },
            ]
          );
        } else {
          setMessages(
            (prev) => [
              ...prev,
              {
                role: "alex",
                type: "error",
                content:
                  `❌ **Upload failed:** ${
                    data?.error ||
                    data?.message ||
                    "Unknown error"
                  }`,
                timestamp:
                  new Date().toISOString(),
              },
            ]
          );
        }

        setInput("");
      } catch (err) {
        setMessages(
          (prev) =>
            prev.filter(
              (message) =>
                message.type !==
                "typing"
            )
        );

        const status =
          err?.response
            ?.status;

        const serverMessage =
          err?.response
            ?.data
            ?.message ||
          err?.response
            ?.data
            ?.error ||
          err?.message ||
          "Unknown upload error";

        if (
          status === 401
        ) {
          try {
            localStorage.removeItem(
              "token"
            );
            sessionStorage.removeItem(
              "token"
            );
          } catch {}

          setMessages(
            (prev) => [
              ...prev,
              {
                role: "alex",
                type: "error",
                content:
                  `❌ **Authentication failed (401)**\n\n${serverMessage}\n\nLogin session expired/invalid hai. Dobara login karo.`,
                timestamp:
                  new Date().toISOString(),
              },
            ]
          );
        } else if (
          status === 403
        ) {
          setMessages(
            (prev) => [
              ...prev,
              {
                role: "alex",
                type: "error",
                content:
                  `❌ **Access denied (403)**\n\n${serverMessage}`,
                timestamp:
                  new Date().toISOString(),
              },
            ]
          );
        } else {
          setMessages(
            (prev) => [
              ...prev,
              {
                role: "alex",
                type: "error",
                content:
                  `❌ **Upload error:** ${serverMessage}`,
                timestamp:
                  new Date().toISOString(),
              },
            ]
          );
        }
      } finally {
        setUploading(false);
        setLoading(false);
      }
    };

  // ==========================================================
  // SEND MESSAGE
  // ==========================================================

 const sendMessage =
  async (value) => {
    const message =
      typeof value === "string"
        ? value.trim()
        : input.trim();

    if (!message || loading) {
      return;
    }

    if (!hasAuthentication()) {
      setError(
        "Login required. Pehle login karo."
      );
      return;
    }

    const currentWindowsAgentToken =
      ownerMode
        ? localStorage.getItem(
            WINDOWS_AGENT_TOKEN_STORAGE_KEY
          ) ||
          windowsAgentToken ||
          ""
        : "";

    setInput("");
    setLoading(true);
    setError(null);

    const userMessage = {
      role: "user",
      type: "message",
      content: message,
      timestamp: new Date().toISOString(),
    };

    const typingMessage = {
      role: "alex",
      type: "typing",
      content: "...",
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [
      ...prev,
      userMessage,
      typingMessage,
    ]);

    let activeSessionId = sessionId;
    let response = null;

    const sendChatRequest =
      async (currentSessionId) => {
        return await axios.post(
          `${API_BASE}/api/alex/chat`,
          {
            message,
            sessionId:
              currentSessionId || null,
            ...(ownerMode &&
            currentWindowsAgentToken
              ? {
                  windowsAgentToken:
                    currentWindowsAgentToken,
                }
              : {}),
          },
          {
            headers:
              getAuthHeaders(),
            timeout: 120000,
          }
        );
      };

    try {
      /*
       * --------------------------------------------------
       * FIRST REQUEST
       * --------------------------------------------------
       */
      try {
        response =
          await sendChatRequest(
            activeSessionId
          );
      } catch (firstError) {
        const firstStatus =
          firstError?.response?.status;

        const firstServerError =
          firstError?.response?.data
            ?.error || "";

        const firstServerMessage =
          firstError?.response?.data
            ?.message || "";

        const errorText =
          String(
            firstServerError ||
              firstServerMessage ||
              ""
          )
            .trim()
            .toLowerCase();

        const isStaleSession =
          firstStatus === 403 &&
          (
            errorText ===
              "access denied" ||
            errorText ===
              "access denied."
          );

        /*
         * ------------------------------------------------
         * STALE SESSION
         * ------------------------------------------------
         */
        if (isStaleSession) {
          console.warn(
            "⚠️ ALEX: stale session detected. Creating fresh session..."
          );

          const freshSessionId =
            `alex_chat_${Date.now()}_${Math.random()
              .toString(36)
              .slice(2, 10)}`;

          activeSessionId =
            freshSessionId;

          persistSessionId(
            freshSessionId
          );

          /*
           * Retry exactly once with
           * the fresh session.
           */
          response =
            await sendChatRequest(
              freshSessionId
            );
        } else {
          throw firstError;
        }
      }

      /*
       * --------------------------------------------------
       * RESPONSE
       * --------------------------------------------------
       */

      const data =
        response?.data;

      /*
       * Remove typing indicator.
       */
      setMessages(
        (prev) =>
          prev.filter(
            (item) =>
              item.type !== "typing"
          )
      );

      /*
       * Save session returned by backend.
       */
      if (data?.sessionId) {
        persistSessionId(
          data.sessionId
        );
      }

      /*
       * Update metrics.
       */
      if (data?.metrics) {
        setMetrics(
          data.metrics
        );
      }

      /*
       * --------------------------------------------------
       * SUCCESS
       * --------------------------------------------------
       */
      if (data?.success) {
        setMessages(
          (prev) => [
            ...prev,
            {
              role: "alex",
              type: "result",
              content:
                data.response ||
                data.message ||
                "ALEX completed the request.",
              result:
                data.result,
              report:
                data.report,
              timestamp:
                new Date().toISOString(),
            },
          ]
        );
      }

      /*
       * --------------------------------------------------
       * BACKEND RETURNED success:false
       * --------------------------------------------------
       */
      else {
        setMessages(
          (prev) => [
            ...prev,
            {
              role: "alex",
              type: "error",
              content:
                data?.response ||
                data?.message ||
                data?.error ||
                "ALEX request failed.",
              result:
                data?.result,
              timestamp:
                new Date().toISOString(),
            },
          ]
        );
      }
    } catch (err) {
      /*
       * Remove typing indicator.
       */
      setMessages(
        (prev) =>
          prev.filter(
            (item) =>
              item.type !== "typing"
          )
      );

      const status =
        err?.response?.status;

      const serverMessage =
        err?.response?.data?.message ||
        "";

      const serverError =
        err?.response?.data?.error ||
        "";

      const serverResponse =
        err?.response?.data?.response ||
        "";

      /*
       * --------------------------------------------------
       * 401 AUTHENTICATION
       * --------------------------------------------------
       */
      if (status === 401) {
        try {
          localStorage.removeItem(
            "token"
          );

          sessionStorage.removeItem(
            "token"
          );
        } catch {}

        setMessages(
          (prev) => [
            ...prev,
            {
              role: "alex",
              type: "error",
              content:
                `❌ **Authentication failed (401)**\n\n${
                  serverMessage ||
                  serverError ||
                  "Login session invalid ya expired hai."
                }\n\nPlease dobara login karo.`,
              timestamp:
                new Date().toISOString(),
            },
          ]
        );
      }

      /*
       * --------------------------------------------------
       * 403 PERMISSION
       * --------------------------------------------------
       */
      else if (status === 403) {
        setMessages(
          (prev) => [
            ...prev,
            {
              role: "alex",
              type: "error",
              content:
                `❌ **Access denied (403)**\n\n${
                  serverResponse ||
                  serverMessage ||
                  serverError ||
                  "Is action ke liye permission required hai."
                }`,
              timestamp:
                new Date().toISOString(),
            },
          ]
        );
      }

      /*
       * --------------------------------------------------
       * OTHER ERROR
       * --------------------------------------------------
       */
      else {
        setMessages(
          (prev) => [
            ...prev,
            {
              role: "alex",
              type: "error",
              content:
                `❌ **Error:** ${
                  serverResponse ||
                  serverMessage ||
                  serverError ||
                  err?.message ||
                  "Unknown error"
                }`,
              timestamp:
                new Date().toISOString(),
            },
          ]
        );
      }
    } finally {
      setLoading(false);
    }
  
  // ==========================================================
  // ENTER
  // ==========================================================

  const handleKeyDown =
    (event) => {
      if (
        event.key ===
          "Enter" &&
        !event.shiftKey
      ) {
        event.preventDefault();
        sendMessage();
      }
    };

  // ==========================================================
  // SUGGESTIONS
  // ==========================================================

  const handleSuggested =
    (command) => {
      if (
        command ===
        "__UPLOAD__"
      ) {
        if (
          !authenticated
        ) {
          setError(
            "Login required."
          );
          return;
        }

        fileInputRef.current?.click();
        return;
      }

      setInput(command);

      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    };

  // ==========================================================
  // RESET SESSION
  // ==========================================================

  const resetSession =
    async () => {
      if (loading) return;

      const oldSession =
        sessionId;

      setMessages([]);
      setMetrics(null);
      setError(null);

      const newSession =
        createSessionId();

      persistSessionId(
        newSession
      );

      try {
        if (
          oldSession &&
          authenticated
        ) {
          await axios.delete(
            `${API_BASE}/api/alex/chat/sessions/${encodeURIComponent(
              oldSession
            )}`,
            {
              headers:
                getAuthHeaders(),
              timeout: 30000,
            }
          );
        }
      } catch {
        // Local reset still succeeds.
      }

      setMessages([
        {
          role: "alex",
          type: "system",
          content:
            ownerMode
              ? "🧠 New owner session started."
              : "🧠 New ALEX session started.",
          timestamp:
            new Date().toISOString(),
        },
      ]);
    };

  // ==========================================================
  // CLOSE
  // ==========================================================

  if (!isOpen) {
    return null;
  }

  // ==========================================================
  // UI
  // ==========================================================

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 99999,
        background:
          "rgba(2,6,23,0.78)",
        backdropFilter:
          "blur(8px)",
        display: "flex",
        alignItems:
          "center",
        justifyContent:
          "center",
        padding: "16px",
      }}
      onMouseDown={(event) => {
        if (
          event.target ===
          event.currentTarget
        ) {
          onClose?.();
        }
      }}
    >
      <div
        style={{
          width:
            "min(1100px, 100%)",
          height:
            "min(850px, 94vh)",
          background:
            "linear-gradient(180deg,#111127 0%,#080817 100%)",
          border:
            "1px solid rgba(139,92,246,0.35)",
          borderRadius: "18px",
          overflow: "hidden",
          display: "flex",
          flexDirection:
            "column",
          boxShadow:
            "0 30px 100px rgba(0,0,0,0.55)",
        }}
      >
        {/* ==================================================
            HEADER
        ================================================== */}

        <div
          style={{
            minHeight: "64px",
            padding:
              "10px 14px",
            display: "flex",
            alignItems:
              "center",
            gap: "12px",
            borderBottom:
              "1px solid rgba(255,255,255,0.07)",
            background:
              "rgba(17,17,39,0.96)",
          }}
        >
          <div
            style={{
              width: "40px",
              height: "40px",
              borderRadius:
                "12px",
              display: "flex",
              alignItems:
                "center",
              justifyContent:
                "center",
              background:
                "linear-gradient(135deg,#7c3aed,#2563eb)",
              fontSize: "21px",
              flexShrink: 0,
            }}
          >
            {ALEX_AVATAR}
          </div>

          <div
            style={{
              minWidth: 0,
              flex: 1,
            }}
          >
            <div
              style={{
                color: "#f8fafc",
                fontWeight: 800,
                fontSize: "16px",
              }}
            >
              ALEX
            </div>

            <div
              style={{
                color:
                  ownerMode
                    ? "#c4b5fd"
                    : authenticated
                    ? "#34d399"
                    : "#f59e0b",
                fontSize: "11px",
                marginTop: "2px",
              }}
            >
              {ownerMode
                ? "🔑 Owner Mode"
                : authenticated
                ? "● Online"
                : "⛔ Login Required"}
            </div>
          </div>

          {metrics && (
            <div
              style={{
                display:
                  "flex",
                gap: "10px",
                color:
                  "#64748b",
                fontSize:
                  "10px",
              }}
            >
              {metrics.turns != null && (
                <span>
                  Turns:{" "}
                  {
                    metrics.turns
                  }
                </span>
              )}

              {metrics.toolCalls !=
                null && (
                <span>
                  Tools:{" "}
                  {
                    metrics.toolCalls
                  }
                </span>
              )}
            </div>
          )}

          {/* OWNER CONTROLS ONLY */}

          {ownerMode && (
            <>
              <button
                onClick={() =>
                  setShowAdminKeyInput(
                    (value) =>
                      !value
                  )
                }
                style={{
                  background:
                    showAdminKeyInput
                      ? "#7c3aed"
                      : "rgba(255,255,255,0.06)",
                  border:
                    "1px solid rgba(255,255,255,0.08)",
                  color:
                    "#e2e8f0",
                  borderRadius:
                    "8px",
                  padding:
                    "7px 9px",
                  cursor:
                    "pointer",
                  fontSize:
                    "11px",
                }}
                title="Admin key"
              >
                🔑
              </button>

              {adminKey && (
                <button
                  onClick={
                    handleClearAdminKey
                  }
                  style={{
                    background:
                      "rgba(239,68,68,0.1)",
                    border:
                      "1px solid rgba(239,68,68,0.2)",
                    color:
                      "#fca5a5",
                    borderRadius:
                      "8px",
                    padding:
                      "7px 9px",
                    cursor:
                      "pointer",
                    fontSize:
                      "11px",
                  }}
                  title="Clear admin key"
                >
                  Clear Key
                </button>
              )}

              <button
                onClick={() =>
                  setShowWindowsAgentTokenInput(
                    (value) =>
                      !value
                  )
                }
                style={{
                  background:
                    showWindowsAgentTokenInput
                      ? "#2563eb"
                      : "rgba(255,255,255,0.06)",
                  border:
                    "1px solid rgba(255,255,255,0.08)",
                  color:
                    "#e2e8f0",
                  borderRadius:
                    "8px",
                  padding:
                    "7px 9px",
                  cursor:
                    "pointer",
                  fontSize:
                    "11px",
                }}
                title="Windows Agent"
              >
                🖥️
              </button>

              {windowsAgentToken && (
                <button
                  onClick={
                    handleClearWindowsAgentToken
                  }
                  style={{
                    background:
                      "rgba(239,68,68,0.1)",
                    border:
                      "1px solid rgba(239,68,68,0.2)",
                    color:
                      "#fca5a5",
                    borderRadius:
                      "8px",
                    padding:
                      "7px 9px",
                    cursor:
                      "pointer",
                    fontSize:
                      "11px",
                  }}
                  title="Clear Windows Agent"
                >
                  Clear Agent
                </button>
              )}
            </>
          )}

          <button
            onClick={
              resetSession
            }
            disabled={loading}
            style={{
              background:
                "rgba(255,255,255,0.06)",
              border:
                "1px solid rgba(255,255,255,0.08)",
              color:
                "#cbd5e1",
              borderRadius:
                "8px",
              padding:
                "7px 9px",
              cursor:
                loading
                  ? "not-allowed"
                  : "pointer",
              fontSize:
                "11px",
              opacity:
                loading
                  ? 0.5
                  : 1,
            }}
            title="New session"
          >
            + New
          </button>

          <button
            onClick={onClose}
            style={{
              width: "34px",
              height: "34px",
              borderRadius:
                "9px",
              border:
                "1px solid rgba(255,255,255,0.08)",
              background:
                "rgba(255,255,255,0.06)",
              color:
                "#cbd5e1",
              cursor:
                "pointer",
              fontSize:
                "18px",
            }}
            title="Close"
          >
            ×
          </button>
        </div>

        {/* ==================================================
            OWNER KEY INPUT
        ================================================== */}

        {ownerMode &&
          showAdminKeyInput && (
            <div
              style={{
                padding:
                  "10px 14px",
                borderBottom:
                  "1px solid rgba(255,255,255,0.06)",
                background:
                  "rgba(124,58,237,0.08)",
                display:
                  "flex",
                gap: "8px",
              }}
            >
              <input
                ref={
                  adminKeyInputRef
                }
                value={
                  adminKeyInput
                }
                onChange={(event) =>
                  setAdminKeyInput(
                    event.target.value
                  )
                }
                onKeyDown={(
                  event
                ) => {
                  if (
                    event.key ===
                    "Enter"
                  ) {
                    handleSaveAdminKey();
                  }
                }}
                type="password"
                placeholder="Owner ADMIN_KEY"
                style={{
                  flex: 1,
                  background:
                    "#080817",
                  border:
                    "1px solid rgba(139,92,246,0.3)",
                  color:
                    "#f8fafc",
                  borderRadius:
                    "8px",
                  padding:
                    "9px 11px",
                  outline: "none",
                }}
              />

              <button
                onClick={
                  handleSaveAdminKey
                }
                style={{
                  background:
                    "#7c3aed",
                  border: "none",
                  color: "#fff",
                  borderRadius:
                    "8px",
                  padding:
                    "0 14px",
                  cursor:
                    "pointer",
                }}
              >
                Save
              </button>
            </div>
          )}

        {/* ==================================================
            WINDOWS AGENT INPUT
        ================================================== */}

        {ownerMode &&
          showWindowsAgentTokenInput && (
            <div
              style={{
                padding:
                  "10px 14px",
                borderBottom:
                  "1px solid rgba(255,255,255,0.06)",
                background:
                  "rgba(37,99,235,0.08)",
                display:
                  "flex",
                gap: "8px",
              }}
            >
              <input
                value={
                  windowsAgentTokenInput
                }
                onChange={(event) =>
                  setWindowsAgentTokenInput(
                    event.target.value
                  )
                }
                onKeyDown={(
                  event
                ) => {
                  if (
                    event.key ===
                    "Enter"
                  ) {
                    handleSaveWindowsAgentToken();
                  }
                }}
                type="password"
                placeholder="Windows Agent pairing token"
                style={{
                  flex: 1,
                  background:
                    "#080817",
                  border:
                    "1px solid rgba(37,99,235,0.3)",
                  color:
                    "#f8fafc",
                  borderRadius:
                    "8px",
                  padding:
                    "9px 11px",
                  outline: "none",
                }}
              />

              <button
                onClick={
                  handleSaveWindowsAgentToken
                }
                style={{
                  background:
                    "#2563eb",
                  border: "none",
                  color: "#fff",
                  borderRadius:
                    "8px",
                  padding:
                    "0 14px",
                  cursor:
                    "pointer",
                }}
              >
                Pair
              </button>
            </div>
          )}

        {/* ==================================================
            CHAT
        ================================================== */}

        <div
          style={{
            flex: 1,
            overflowY:
              "auto",
            padding:
              "18px",
            display:
              "flex",
            flexDirection:
              "column",
            gap: "12px",
          }}
        >
          {!authenticated && (
            <div
              style={{
                margin:
                  "auto",
                maxWidth:
                  "500px",
                textAlign:
                  "center",
                padding:
                  "30px",
                color:
                  "#94a3b8",
              }}
            >
              <div
                style={{
                  fontSize:
                    "42px",
                  marginBottom:
                    "12px",
                }}
              >
                🔐
              </div>

              <div
                style={{
                  color:
                    "#f8fafc",
                  fontSize:
                    "18px",
                  fontWeight:
                    700,
                  marginBottom:
                    "8px",
                }}
              >
                Login Required
              </div>

              <div
                style={{
                  fontSize:
                    "13px",
                  lineHeight:
                    "1.6",
                }}
              >
                ALEX use karne ke
                liye pehle login karo.
              </div>
            </div>
          )}

          {messages.map(
            (message, index) => {
              const isUser =
                message.role ===
                "user";

              const isTyping =
                message.type ===
                "typing";

              return (
                <div
                  key={`${message.timestamp || "message"}-${index}`}
                  style={{
                    display:
                      "flex",
                    alignItems:
                      "flex-start",
                    gap: "10px",
                    justifyContent:
                      isUser
                        ? "flex-end"
                        : "flex-start",
                  }}
                >
                  {!isUser && (
                    <div
                      style={{
                        width:
                          "34px",
                        height:
                          "34px",
                        borderRadius:
                          "10px",
                        background:
                          "linear-gradient(135deg,#7c3aed,#2563eb)",
                        display:
                          "flex",
                        alignItems:
                          "center",
                        justifyContent:
                          "center",
                        flexShrink: 0,
                      }}
                    >
                      {
                        ALEX_AVATAR
                      }
                    </div>
                  )}

                  <div
                    style={{
                      maxWidth:
                        "82%",
                      minWidth:
                        "80px",
                    }}
                  >
                    <div
                      style={{
                        background:
                          isUser
                            ? "linear-gradient(135deg,#2563eb,#4f46e5)"
                            : message.type ===
                              "error"
                            ? "rgba(127,29,29,0.35)"
                            : message.type ===
                              "system"
                            ? "rgba(124,58,237,0.12)"
                            : "#15152b",
                        border:
                          isUser
                            ? "none"
                            : "1px solid rgba(255,255,255,0.06)",
                        color:
                          "#e2e8f0",
                        borderRadius:
                          isUser
                            ? "14px 14px 4px 14px"
                            : "14px 14px 14px 4px",
                        padding:
                          "11px 13px",
                        fontSize:
                          "13px",
                        lineHeight:
                          "1.6",
                        overflow:
                          "hidden",
                      }}
                    >
                      {isTyping ? (
                        <div
                          style={{
                            display:
                              "flex",
                            gap:
                              "4px",
                            alignItems:
                              "center",
                            height:
                              "20px",
                          }}
                        >
                          {[0, 1, 2].map(
                            (dot) => (
                              <span
                                key={
                                  dot
                                }
                                style={{
                                  width:
                                    "6px",
                                  height:
                                    "6px",
                                  borderRadius:
                                    "50%",
                                  background:
                                    "#94a3b8",
                                  display:
                                    "inline-block",
                                  animation:
                                    `alexBounce 1.2s infinite ${
                                      dot *
                                      0.15
                                    }s`,
                                }}
                              />
                            )
                          )}
                        </div>
                      ) : (
                        <div
                          className="alex-content"
                          dangerouslySetInnerHTML={{
                            __html:
                              renderContent(
                                message.content
                              ),
                          }}
                        />
                      )}

                      {message.result && (
                        <ResultCard
                          result={
                            message.result
                          }
                        />
                      )}

                      {message.report && (
                        <ReportPanel
                          report={
                            message.report
                          }
                        />
                      )}

                      {message.uploadResult && (
                        <UploadResultPanel
                          upload={
                            message.uploadResult
                          }
                        />
                      )}
                    </div>

                    {!isTyping &&
                      message.timestamp && (
                        <div
                          style={{
                            color:
                              "#475569",
                            fontSize:
                              "9px",
                            marginTop:
                              "3px",
                            textAlign:
                              isUser
                                ? "right"
                                : "left",
                            padding:
                              "0 3px",
                          }}
                        >
                          {new Date(
                            message.timestamp
                          ).toLocaleTimeString(
                            [],
                            {
                              hour:
                                "2-digit",
                              minute:
                                "2-digit",
                            }
                          )}
                        </div>
                      )}
                  </div>

                  {isUser && (
                    <div
                      style={{
                        width:
                          "34px",
                        height:
                          "34px",
                        borderRadius:
                          "10px",
                        background:
                          "#1e293b",
                        display:
                          "flex",
                        alignItems:
                          "center",
                        justifyContent:
                          "center",
                        flexShrink: 0,
                      }}
                    >
                      {
                        USER_AVATAR
                      }
                    </div>
                  )}
                </div>
              );
            }
          )}

          {error && (
            <div
              style={{
                alignSelf:
                  "center",
                color:
                  "#fca5a5",
                background:
                  "rgba(127,29,29,0.2)",
                border:
                  "1px solid rgba(239,68,68,0.2)",
                borderRadius:
                  "8px",
                padding:
                  "7px 12px",
                fontSize:
                  "11px",
              }}
            >
              {error}
            </div>
          )}

          <div
            ref={
              messagesEndRef
            }
          />
        </div>

        {/* ==================================================
            SUGGESTIONS
        ================================================== */}

        {authenticated &&
          messages.length <=
            2 && (
            <div
              style={{
                padding:
                  "0 14px 8px",
                display:
                  "flex",
                gap: "7px",
                flexWrap:
                  "wrap",
              }}
            >
              {[
                "Hello ALEX",
                "Mere project ko analyze karo",
                "Mujhe code mein help chahiye",
                "Explain this problem",
                ...(ownerMode
                  ? [
                      "Project health check karo",
                      "Deep analysis karo",
                    ]
                  : []),
              ].map(
                (command) => (
                  <button
                    key={
                      command
                    }
                    onClick={() =>
                      handleSuggested(
                        command
                      )
                    }
                    style={{
                      background:
                        "rgba(255,255,255,0.04)",
                      border:
                        "1px solid rgba(255,255,255,0.07)",
                      color:
                        "#94a3b8",
                      borderRadius:
                        "999px",
                      padding:
                        "6px 10px",
                      fontSize:
                        "10px",
                      cursor:
                        "pointer",
                    }}
                  >
                    {command}
                  </button>
                )
              )}
            </div>
          )}

        {/* ==================================================
            INPUT
        ================================================== */}

        <div
          style={{
            padding:
              "10px 14px 14px",
            borderTop:
              "1px solid rgba(255,255,255,0.07)",
            background:
              "rgba(8,8,23,0.8)",
          }}
        >
          <input
            ref={
              fileInputRef
            }
            type="file"
            style={{
              display: "none",
            }}
            onChange={
              handleFileSelect
            }
            accept=".js,.jsx,.ts,.tsx,.json,.css,.html,.txt,.md,.py,.java,.cpp,.c,.pdf,.doc,.docx"
          />

          <div
            style={{
              display:
                "flex",
              gap: "8px",
              alignItems:
                "flex-end",
            }}
          >
            <button
              onClick={() => {
                if (
                  !authenticated
                ) {
                  setError(
                    "Login required."
                  );
                  return;
                }

                fileInputRef.current?.click();
              }}
              disabled={
                loading ||
                uploading ||
                !authenticated
              }
              style={{
                width:
                  "42px",
                height:
                  "42px",
                flexShrink: 0,
                borderRadius:
                  "10px",
                border:
                  "1px solid rgba(255,255,255,0.08)",
                background:
                  "rgba(255,255,255,0.05)",
                color:
                  "#cbd5e1",
                cursor:
                  loading ||
                  uploading ||
                  !authenticated
                    ? "not-allowed"
                    : "pointer",
                opacity:
                  loading ||
                  uploading ||
                  !authenticated
                    ? 0.45
                    : 1,
                fontSize:
                  "17px",
              }}
              title="Upload file"
            >
              📎
            </button>

            <textarea
              ref={inputRef}
              value={input}
              onChange={(event) =>
                setInput(
                  event.target.value
                )
              }
              onKeyDown={
                handleKeyDown
              }
              disabled={
                loading ||
                !authenticated
              }
              placeholder={
                authenticated
                  ? ownerMode
                    ? "Ask ALEX anything..."
                    : "ALEX se kuch bhi pucho..."
                  : "Login required..."
              }
              rows={1}
              style={{
                flex: 1,
                minHeight:
                  "42px",
                maxHeight:
                  "130px",
                resize:
                  "vertical",
                background:
                  "#0d0d21",
                border:
                  "1px solid rgba(255,255,255,0.08)",
                color:
                  "#f8fafc",
                borderRadius:
                  "10px",
                padding:
                  "11px 12px",
                outline: "none",
                fontSize:
                  "13px",
                lineHeight:
                  "1.4",
              }}
            />

            <button
              onClick={() =>
                sendMessage()
              }
              disabled={
                loading ||
                !input.trim() ||
                !authenticated
              }
              style={{
                width:
                  "42px",
                height:
                  "42px",
                flexShrink: 0,
                borderRadius:
                  "10px",
                border: "none",
                background:
                  loading ||
                  !input.trim() ||
                  !authenticated
                    ? "#334155"
                    : "linear-gradient(135deg,#7c3aed,#2563eb)",
                color: "#fff",
                cursor:
                  loading ||
                  !input.trim() ||
                  !authenticated
                    ? "not-allowed"
                    : "pointer",
                fontSize:
                  "17px",
              }}
              title="Send"
            >
              {loading
                ? "..."
                : "➤"}
            </button>
          </div>

          <div
            style={{
              marginTop:
                "6px",
              display:
                "flex",
              justifyContent:
                "space-between",
              color:
                "#475569",
              fontSize:
                "9px",
            }}
          >
            <span>
              Enter = send • Shift+Enter = new line
            </span>

            <span>
              {ownerMode
                ? "Owner controls protected"
                : "ALEX"}
            </span>
          </div>
        </div>

        <style>
          {`
            .alex-content p {
              margin: 0 0 8px;
            }

            .alex-content p:last-child {
              margin-bottom: 0;
            }

            .alex-content h3 {
              margin: 8px 0;
              color: #c4b5fd;
              font-size: 14px;
            }

            .alex-content strong {
              color: #f8fafc;
            }

            .alex-content em {
              color: #cbd5e1;
            }

            .alex-content ul {
              margin: 6px 0;
              padding-left: 20px;
            }

            .alex-content li {
              margin: 3px 0;
            }

            .alex-content code {
              background: rgba(255,255,255,0.07);
              border-radius: 4px;
              padding: 1px 5px;
              color: #a7f3d0;
              font-family: "JetBrains Mono", monospace;
              font-size: 0.92em;
            }

            .alex-content pre {
              background: #080817;
              border: 1px solid rgba(255,255,255,0.07);
              border-radius: 8px;
              padding: 10px;
              overflow-x: auto;
              margin: 8px 0;
            }

            .alex-content pre code {
              background: transparent;
              padding: 0;
              color: #a7f3d0;
              white-space: pre;
            }

            .alex-content a {
              color: #93c5fd;
            }

            .alex-content::-webkit-scrollbar,
            .alex-report::-webkit-scrollbar {
              width: 6px;
              height: 6px;
            }

            .alex-content::-webkit-scrollbar-track,
            .alex-report::-webkit-scrollbar-track {
              background: transparent;
            }

            .alex-content::-webkit-scrollbar-thumb,
            .alex-report::-webkit-scrollbar-thumb {
              background: rgba(139,92,246,0.3);
              border-radius: 3px;
            }

            @keyframes alexBounce {
              0%, 80%, 100% {
                transform: scale(0);
                opacity: 0.5;
              }

              40% {
                transform: scale(1);
                opacity: 1;
              }
            }

            @media (max-width: 700px) {
              .alex-content {
                font-size: 13px !important;
              }
            }
          `}
        </style>
      </div>
    </div>
  );
};

export default AlexChat;