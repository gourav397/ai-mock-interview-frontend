import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
} from "react";
import axios from "axios";

const API_BASE =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000";

const SESSION_KEY =
  "alex_chat_session_id";

const OWNER_MEMORY_SESSION_KEY =
  "alex_owner_memory_session_id";

const ADMIN_KEY_STORAGE_KEY =
  "alex_admin_key";

const WINDOWS_AGENT_TOKEN_STORAGE_KEY =
  "alex_windows_agent_token";

// ============================================================
// IDENTITY-SCOPED SESSION STORAGE
// ============================================================

const getIdentityStorageKey = () => {
  try {
    const token =
      localStorage.getItem("token");

    if (token) {
      const parts =
        token.split(".");

      if (parts.length === 3) {
        const payload =
          JSON.parse(
            decodeURIComponent(
              atob(
                parts[1]
                  .replace(/-/g, "+")
                  .replace(/_/g, "/")
              )
                .split("")
                .map(
                  (c) =>
                    `%${(
                      "00" +
                      c.charCodeAt(
                        0
                      ).toString(16)
                    ).slice(-2)}`
                )
                .join("")
            )
          );

        if (
          payload?.id ||
          payload?._id ||
          payload?.userId
        ) {
          return String(
            payload.id ||
              payload._id ||
              payload.userId
          );
        }
      }
    }
  } catch {}

  return localStorage.getItem(
    ADMIN_KEY_STORAGE_KEY
  )
    ? "admin-key-owner"
    : "anonymous";
};

const getSessionStorageKey = () =>
  `${SESSION_KEY}:${getIdentityStorageKey()}`;

const getOwnerMemoryStorageKey = () =>
  `${OWNER_MEMORY_SESSION_KEY}:${getIdentityStorageKey()}`;

const ALEX_AVATAR = "🤖";
const USER_AVATAR = "👤";

// ============================================================
// SAFE SESSION ID
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
        const ta =
          document.createElement(
            "textarea"
          );

        ta.value = code;

        document.body.appendChild(
          ta
        );

        ta.select();

        document.execCommand(
          "copy"
        );

        document.body.removeChild(
          ta
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

      const a =
        document.createElement(
          "a"
        );

      a.href = url;

      a.download =
        fileName ||
        "fixed-code.txt";

      document.body.appendChild(
        a
      );

      a.click();

      document.body.removeChild(
        a
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
            onClick={
              handleCopy
            }
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
// UPLOAD RESULT PANEL
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
          ].map((s) => (
            <span
              key={s}
              style={{
                color:
                  sevColor[s],
                fontSize:
                  "11px",
                fontWeight: 600,
              }}
            >
              {s}:{" "}
              {analysis
                ?.severityCount?.[
                s
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
            maxHeight:
              "180px",
            overflowY:
              "auto",
          }}
        >
          {analysis.issues
            .slice(0, 10)
            .map(
              (
                issue,
                i
              ) => (
                <div
                  key={i}
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
                      {
                        issue.fix
                      }
                    </div>
                  )}
                </div>
              )
            )}
        </div>
      )}

      {fixed?.code && (
        <FixedCodeBlock
          code={
            fixed.code
          }
          fileName={
            `fixed_${fileName || "code"}`
          }
        />
      )}

      {fixed?.syntaxValid ===
        false && (
        <div
          style={{
            padding:
              "8px 14px",
            color:
              "#f59e0b",
            fontSize:
              "12px",
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
              (p) => !p
            )
          }
          style={{
            background:
              "none",
            border: "none",
            color:
              "#64748b",
            fontSize:
              "11px",
            cursor:
              "pointer",
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
                marginTop:
                  "6px",
                padding:
                  "10px",
                background:
                  "#0a0a1a",
                color:
                  "#94a3b8",
                fontSize:
                  "11px",
                maxHeight:
                  "200px",
                overflowY:
                  "auto",
                borderRadius:
                  "6px",
              }}
            >
              <code>
                {
                  original.code
                }
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
            (prev) => !prev
          )
        }
        style={{
          width: "100%",
          background:
            "rgba(139,92,246,0.15)",
          border: "none",
          padding:
            "10px 14px",
          color:
            "#c4b5fd",
          fontSize:
            "13px",
          fontWeight: 600,
          cursor:
            "pointer",
          display:
            "flex",
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
          lineHeight:
            "1.6",
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
      if (
        result.success
      ) {
        return "#10b981";
      }

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
        borderLeft: `4px solid ${getStatusColor()}`,
        background:
          "#1a1a2e",
        borderRadius:
          "8px",
        padding:
          "12px 16px",
        marginTop:
          "8px",
        fontSize:
          "13px",
      }}
    >
      <div
        style={{
          display:
            "flex",
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
            fontWeight:
              600,
            fontSize:
              "13px",
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
              color:
                "#64748b",
              fontSize:
                "12px",
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
            color:
              "#94a3b8",
            fontSize:
              "13px",
            marginBottom:
              "8px",
          }}
        >
          {
            result.message
          }
        </div>
      )}

      {result.error && (
        <div
          style={{
            color:
              "#ef4444",
            fontSize:
              "13px",
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
            marginTop:
              "10px",
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
              color:
                "#c4b5fd",
              fontWeight:
                700,
              fontSize:
                "13px",
              marginBottom:
                "10px",
            }}
          >
            💻 Laptop Information
          </div>

          {systemInfo.os && (
            <div
              style={{
                marginBottom:
                  "10px",
              }}
            >
              <div
                style={{
                  color:
                    "#a78bfa",
                  fontWeight:
                    600,
                }}
              >
                🪟 Operating System
              </div>

              <div
                style={{
                  color:
                    "#cbd5e1",
                  marginTop:
                    "4px",
                }}
              >
                Type:{" "}
                {systemInfo.os.type ||
                  "Unknown"}
                <br />
                Version:{" "}
                {systemInfo.os.release ||
                  "Unknown"}
                <br />
                Architecture:{" "}
                {systemInfo.os.arch ||
                  "Unknown"}
                <br />
                Hostname:{" "}
                {systemInfo.os.hostname ||
                  "Unknown"}
                <br />
                Uptime:{" "}
                {systemInfo.os.uptimeMinutes ??
                  "Unknown"}{" "}
                minutes
              </div>
            </div>
          )}

          {systemInfo.cpu && (
            <div
              style={{
                marginBottom:
                  "10px",
              }}
            >
              <div
                style={{
                  color:
                    "#a78bfa",
                  fontWeight:
                    600,
                }}
              >
                🧠 CPU
              </div>

              <div
                style={{
                  color:
                    "#cbd5e1",
                  marginTop:
                    "4px",
                }}
              >
                Model:{" "}
                {systemInfo.cpu.model ||
                  "Unknown"}
                <br />
                Cores:{" "}
                {systemInfo.cpu.cores ??
                  "Unknown"}
                <br />
                Load:{" "}
                {Array.isArray(
                  systemInfo.cpu
                    .loadAvg
                )
                  ? systemInfo.cpu.loadAvg.join(
                      " / "
                    )
                  : "Unknown"}
              </div>
            </div>
          )}

          {systemInfo.memory && (
            <div
              style={{
                marginBottom:
                  "10px",
              }}
            >
              <div
                style={{
                  color:
                    "#a78bfa",
                  fontWeight:
                    600,
                }}
              >
                🧮 RAM
              </div>

              <div
                style={{
                  color:
                    "#cbd5e1",
                  marginTop:
                    "4px",
                }}
              >
                Total:{" "}
                {systemInfo.memory
                  .totalGB ??
                  "Unknown"}{" "}
                GB
                <br />
                Free:{" "}
                {systemInfo.memory
                  .freeGB ??
                  "Unknown"}{" "}
                GB
                <br />
                Used by ALEX:{" "}
                {systemInfo.memory
                  .usedByAlexMB ??
                  "Unknown"}{" "}
                MB
              </div>
            </div>
          )}

          {systemInfo.disk && (
            <div
              style={{
                marginBottom:
                  "10px",
              }}
            >
              <div
                style={{
                  color:
                    "#a78bfa",
                  fontWeight:
                    600,
                }}
              >
                💾 Disk
              </div>

              <div
                style={{
                  color:
                    "#cbd5e1",
                  marginTop:
                    "4px",
                }}
              >
                {Array.isArray(
                  systemInfo.disk
                ) ? (
                  systemInfo.disk.map(
                    (
                      disk,
                      index
                    ) => (
                      <div
                        key={
                          index
                        }
                        style={{
                          marginBottom:
                            "6px",
                        }}
                      >
                        {disk.drive ||
                          `Drive ${
                            index +
                            1
                          }`}
                        <br />
                        Total:{" "}
                        {disk.totalGB ??
                          "?"}{" "}
                        GB
                        <br />
                        Free:{" "}
                        {disk.freeGB ??
                          "?"}{" "}
                        GB
                      </div>
                    )
                  )
                ) : (
                  String(
                    systemInfo.disk
                  )
                )}
              </div>
            </div>
          )}

          {systemInfo.user && (
            <div
              style={{
                marginBottom:
                  "10px",
              }}
            >
              <div
                style={{
                  color:
                    "#a78bfa",
                  fontWeight:
                    600,
                }}
              >
                👤 User
              </div>

              <div
                style={{
                  color:
                    "#cbd5e1",
                  marginTop:
                    "4px",
                }}
              >
                Username:{" "}
                {
                  systemInfo.user
                }
                <br />
                Home:{" "}
                {systemInfo.homeDir ||
                  "Unknown"}
              </div>
            </div>
          )}

          {systemInfo.node && (
            <div
              style={{
                marginBottom:
                  "10px",
              }}
            >
              <div
                style={{
                  color:
                    "#a78bfa",
                  fontWeight:
                    600,
                }}
              >
                🟢 Node.js
              </div>

              <div
                style={{
                  color:
                    "#cbd5e1",
                  marginTop:
                    "4px",
                }}
              >
                {
                  systemInfo.node
                }
              </div>
            </div>
          )}

          {systemInfo.networkInterfaces && (
            <div>
              <div
                style={{
                  color:
                    "#a78bfa",
                  fontWeight:
                    600,
                }}
              >
                🌐 Network Interfaces
              </div>

              <div
                style={{
                  color:
                    "#cbd5e1",
                  marginTop:
                    "4px",
                }}
              >
                {Array.isArray(
                  systemInfo.networkInterfaces
                )
                  ? systemInfo.networkInterfaces.join(
                      ", "
                    )
                  : String(
                      systemInfo.networkInterfaces
                    )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ============================================================
// CHAT MESSAGE
// ============================================================

const ChatMessage = ({
  message,
}) => {
  const isUser =
    message.role ===
    "user";

  return (
    <div
      style={{
        display:
          "flex",
        gap: "12px",
        marginBottom:
          "20px",
        flexDirection:
          isUser
            ? "row-reverse"
            : "row",
        alignItems:
          "flex-start",
      }}
    >
      <div
        style={{
          width: "36px",
          height: "36px",
          borderRadius:
            "50%",
          background:
            isUser
              ? "#3b82f6"
              : "#8b5cf6",
          display:
            "flex",
          alignItems:
            "center",
          justifyContent:
            "center",
          fontSize:
            "16px",
          flexShrink: 0,
          boxShadow:
            "0 2px 8px rgba(0,0,0,0.3)",
        }}
      >
        {isUser
          ? USER_AVATAR
          : ALEX_AVATAR}
      </div>

      <div
        style={{
          maxWidth:
            "80%",
          background:
            isUser
              ? "#1e3a5f"
              : "#16213e",
          borderRadius:
            isUser
              ? "16px 16px 4px 16px"
              : "16px 16px 16px 4px",
          padding:
            "14px 18px",
          boxShadow:
            "0 2px 8px rgba(0,0,0,0.2)",
          minWidth:
            isUser
              ? undefined
              : "60%",
        }}
      >
        <div
          style={{
            fontSize:
              "11px",
            fontWeight:
              600,
            color:
              isUser
                ? "#60a5fa"
                : "#a78bfa",
            marginBottom:
              "6px",
            textTransform:
              "uppercase",
            letterSpacing:
              "0.5px",
          }}
        >
          {isUser
            ? "You"
            : "ALEX"}
        </div>

        <div
          className="alex-content"
          dangerouslySetInnerHTML={{
            __html:
              renderContent(
                message.content
              ),
          }}
          style={{
            color:
              "#e2e8f0",
            fontSize:
              "14px",
            lineHeight:
              "1.6",
            wordBreak:
              "break-word",
          }}
        />

        {!isUser &&
          message.uploadResult && (
            <UploadResultPanel
              upload={
                message.uploadResult
              }
            />
          )}

        {!isUser &&
          message.result?.report && (
            <ReportPanel
              report={
                message.result
                  .report
              }
            />
          )}

        {message.result &&
          message.result.route !==
            "chat" &&
          message.result
            .result?.route !==
            "chat" &&
          message.result.intent
            ?.intent !==
            "GENERAL_CHAT" &&
          message.result.result
            ?.intent?.intent !==
            "GENERAL_CHAT" && (
            <ResultCard
              result={
                message.result
              }
            />
          )}

        <div
          style={{
            fontSize:
              "11px",
            color:
              "#475569",
            marginTop:
              "8px",
            textAlign:
              isUser
                ? "left"
                : "right",
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
      </div>
    </div>
  );
};

// ============================================================
// SUGGESTIONS
// ============================================================

const SUGGESTED_COMMANDS = [
  {
    label:
      "📤 Upload & Fix a File",
    command:
      "__UPLOAD__",
  },
  {
    label:
      "🔍 Deep Analysis (read-only)",
    command:
      "Ab actual project analysis karo. Sirf actual code inspect karke detailed findings do — har bug, security vulnerability, code quality issue, severity + file path ke saath. Koi file modify/delete mat karo.",
  },
  {
    label:
      "💻 Laptop Info",
    command:
      "Mere laptop ka complete info do — CPU, RAM, disk, OS sab kuch",
  },
  {
    label:
      "🌐 Browser Me Kholo",
    command:
      "google.com browser me khol do",
  },
  {
    label:
      "📊 System Status",
    command:
      "Show me the complete system status",
  },
  {
    label:
      "📁 Folder Dikhao",
    command:
      "Mere desktop ka folder list dikhao",
  },
  {
    label:
      "🧪 Run Tests",
    command:
      "Run the test suite and report results",
  },
  {
    label:
      "🛡️ Security Scan",
    command:
      "Scan the project for security vulnerabilities",
  },
];

// ============================================================
// MAIN ALEX CHAT
// ============================================================

const AlexChat = ({
  isOpen,
  onClose,
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
    const saved =
      localStorage.getItem(
        getSessionStorageKey()
      );

    if (saved) return saved;

    const ownerSession =
      localStorage.getItem(
        getOwnerMemoryStorageKey()
      );

    if (ownerSession) {
      localStorage.setItem(
        getSessionStorageKey(),
        ownerSession
      );

      return ownerSession;
    }

    const newSession =
      createSessionId();

    localStorage.setItem(
      getSessionStorageKey(),
      newSession
    );

    localStorage.setItem(
      getOwnerMemoryStorageKey(),
      newSession
    );

    return newSession;
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
    useState(
      () =>
        localStorage.getItem(
          ADMIN_KEY_STORAGE_KEY
        ) || ""
    );

  const [
    windowsAgentToken,
    setWindowsAgentToken,
  ] = useState(
    () =>
      localStorage.getItem(
        WINDOWS_AGENT_TOKEN_STORAGE_KEY
      ) || ""
  );

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

  const getToken =
    useCallback(() => {
      try {
        return (
          localStorage.getItem(
            "token"
          ) || ""
        );
      } catch {
        return "";
      }
    }, []);

  const hasAuthentication =
    useCallback(() => {
      return Boolean(
        getToken() ||
          adminKey
      );
    }, [
      getToken,
      adminKey,
    ]);

  const authenticated =
    hasAuthentication();

  // ==========================================================
  // JSON HEADERS
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
      } else if (adminKey) {
        headers[
          "x-admin-key"
        ] = adminKey;
      }

      return headers;
    }, [
      getToken,
      adminKey,
    ]);

  // ==========================================================
  // FORM DATA HEADERS
  // IMPORTANT:
  // Do not manually set multipart Content-Type.
  // Axios/browser adds boundary automatically.
  // ==========================================================

  const getUploadAuthHeaders =
    useCallback(() => {
      const headers = {};

      const token =
        getToken();

      if (token) {
        headers.Authorization =
          `Bearer ${token}`;
      } else if (adminKey) {
        headers[
          "x-admin-key"
        ] = adminKey;
      }

      return headers;
    }, [
      getToken,
      adminKey,
    ]);

  // ==========================================================
  // SCROLL
  // ==========================================================

  const scrollToBottom =
    useCallback(() => {
      messagesEndRef.current?.scrollIntoView(
        {
          behavior:
            "smooth",
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
  }, [
    isOpen,
    showAdminKeyInput,
    showWindowsAgentTokenInput,
  ]);

  // ==========================================================
  // SAVE ADMIN KEY
  // ==========================================================

  const handleSaveAdminKey =
    () => {
      const key =
        adminKeyInput.trim();

      if (key.length < 4) {
        return;
      }

      setAdminKey(key);

      localStorage.setItem(
        ADMIN_KEY_STORAGE_KEY,
        key
      );

      setShowAdminKeyInput(
        false
      );

      setAdminKeyInput("");

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

  // ==========================================================
  // CLEAR ADMIN KEY
  // ==========================================================

  const handleClearAdminKey =
    () => {
      localStorage.removeItem(
        ADMIN_KEY_STORAGE_KEY
      );

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
  // WINDOWS AGENT TOKEN
  // ==========================================================

  const handleSaveWindowsAgentToken =
    () => {
      const token =
        windowsAgentTokenInput.trim();

      if (!token) {
        setMessages(
          (prev) => [
            ...prev,
            {
              role: "alex",
              type: "system",
              content:
                "❌ Windows Agent pairing token required.",
              timestamp:
                new Date().toISOString(),
            },
          ]
        );

        return;
      }

      localStorage.setItem(
        WINDOWS_AGENT_TOKEN_STORAGE_KEY,
        token
      );

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
              "✅ Windows Agent paired successfully. Local laptop tools are now available to authorized ALEX commands.",
            timestamp:
              new Date().toISOString(),
          },
        ]
      );
    };

  const handleClearWindowsAgentToken =
    () => {
      localStorage.removeItem(
        WINDOWS_AGENT_TOKEN_STORAGE_KEY
      );

      setWindowsAgentToken(
        ""
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
    async (e) => {
      const file =
        e.target.files?.[0];

      e.target.value = "";

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

      const userMsg = {
        role: "user",
        type: "message",
        content:
          `📤 Uploaded file: **${file.name}** (${(
            file.size /
            1024
          ).toFixed(
            1
          )} KB)`,
        timestamp:
          new Date().toISOString(),
      };

      const typingMsg = {
        role: "alex",
        type: "typing",
        content: "...",
        timestamp:
          new Date().toISOString(),
      };

      setMessages(
        (prev) => [
          ...prev,
          userMsg,
          typingMsg,
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
              (m) =>
                m.type !==
                "typing"
            )
        );

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
              "\n✅ **Fixed code passed syntax validation.** Copy/download karke use karo."
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
                type:
                  "error",
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
              (m) =>
                m.type !==
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
          status === 401 ||
          status === 403
        ) {
          setMessages(
            (prev) => [
              ...prev,
              {
                role: "alex",
                type:
                  "error",
                content:
                  `❌ **Authentication failed (${status})**\n\n${serverMessage}\n\nLogin session check karo.`,
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
                type:
                  "error",
                content:
                  `❌ **Upload error:** ${serverMessage}`,
                timestamp:
                  new Date().toISOString(),
              },
            ]
          );
        }
      } finally {
        setUploading(
          false
        );

        setLoading(false);
      }
    };

  // ==========================================================
  // SEND MESSAGE
  // ==========================================================

  const sendMessage =
    async (text) => {
      const message =
        typeof text ===
        "string"
          ? text.trim()
          : input.trim();

      if (
        !message ||
        loading
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

      const currentWindowsAgentToken =
        localStorage.getItem(
          WINDOWS_AGENT_TOKEN_STORAGE_KEY
        ) ||
        windowsAgentToken ||
        "";

      setInput("");

      setLoading(true);

      setError(null);

      const userMsg = {
        role: "user",
        type: "message",
        content:
          message,
        timestamp:
          new Date().toISOString(),
      };

      const typingMsg = {
        role: "alex",
        type: "typing",
        content: "...",
        timestamp:
          new Date().toISOString(),
      };

      setMessages(
        (prev) => [
          ...prev,
          userMsg,
          typingMsg,
        ]
      );

      try {
        const response =
          await axios.post(
            `${API_BASE}/api/alex/chat`,
            {
              message,
              sessionId,
              windowsAgentToken:
                currentWindowsAgentToken,
            },
            {
              headers:
                getAuthHeaders(),
              timeout:
                120000,
            }
          );

        const data =
          response.data;

        setMessages(
          (prev) =>
            prev.filter(
              (m) =>
                m.type !==
                "typing"
            )
        );

        if (
          data?.sessionId
        ) {
          setSessionId(
            data.sessionId
          );

          localStorage.setItem(
            getSessionStorageKey(),
            data.sessionId
          );

          localStorage.setItem(
            getOwnerMemoryStorageKey(),
            data.sessionId
          );
        }

        if (
          data?.metrics
        ) {
          setMetrics(
            data.metrics
          );
        }

        if (
          data?.success
        ) {
          setMessages(
            (prev) => [
              ...prev,
              {
                role: "alex",
                type:
                  "result",
                content:
                  data.response ||
                  data.message ||
                  "ALEX completed the request.",
                result:
                  data.result,
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
                type:
                  "error",
                content:
                  data?.response ||
                  data?.message ||
                  data?.error ||
                  "ALEX request failed.",
                result:
                  data.result,
                timestamp:
                  new Date().toISOString(),
              },
            ]
          );
        }
      } catch (err) {
        setMessages(
          (prev) =>
            prev.filter(
              (m) =>
                m.type !==
                "typing"
            )
        );

        const status =
          err?.response
            ?.status;

        const serverMsg =
          err?.response
            ?.data
            ?.message ||
          "";

        const serverError =
          err?.response
            ?.data
            ?.error ||
          "";

        const serverResponse =
          err?.response
            ?.data
            ?.response ||
          "";

        // ======================================================
        // AUTH FAILURE
        // ======================================================

        if (
          status === 401 ||
          status === 403
        ) {
          const token =
            getToken();

          // ----------------------------------------------------
          // JWT FAILED
          // ----------------------------------------------------

          if (token) {
            try {
              localStorage.removeItem(
                "token"
              );
            } catch {}

            setMessages(
              (prev) => [
                ...prev,
                {
                  role: "alex",
                  type:
                    "error",
                  content:
                    `❌ **Authentication failed (${status})**\n\n${
                      serverMsg ||
                      serverError ||
                      "Login session invalid ya expired hai."
                    }\n\nPlease logout karke dobara login karo.`,
                  timestamp:
                    new Date().toISOString(),
                },
              ]
            );
          }

          // ----------------------------------------------------
          // ADMIN KEY FAILED
          // ----------------------------------------------------

          else if (
            adminKey
          ) {
            setMessages(
              (prev) => [
                ...prev,
                {
                  role: "alex",
                  type:
                    "error",
                  content:
                    `❌ **Access denied (${status})**\n\nSaved admin key server ne reject kar di.\n\nAdmin key clear karke dobara valid key set karo.`,
                  timestamp:
                    new Date().toISOString(),
                },
              ]
            );
          }

          // ----------------------------------------------------
          // NO AUTH
          // ----------------------------------------------------

          else {
            setShowAdminKeyInput(
              true
            );

            setMessages(
              (prev) => [
                ...prev,
                {
                  role: "alex",
                  type:
                    "error",
                  content:
                    "🔑 **Authentication required.** Please login first.",
                  timestamp:
                    new Date().toISOString(),
                },
              ]
            );
          }
        } else {
          setMessages(
            (prev) => [
              ...prev,
              {
                role: "alex",
                type:
                  "error",
                content:
                  `❌ **Error:** ${
                    serverResponse ||
                    serverMsg ||
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
        setLoading(
          false
        );
      }
    };

  // ==========================================================
  // ENTER
  // ==========================================================

  const handleKeyDown =
    (e) => {
      if (
        e.key ===
          "Enter" &&
        !e.shiftKey
      ) {
        e.preventDefault();

        sendMessage();
      }
    };

  // ==========================================================
  // SUGGESTED COMMAND
  // ==========================================================

  const handleSuggested =
    (cmd) => {
      if (
        cmd ===
        "__UPLOAD__"
      ) {
        if (
          !hasAuthentication()
        ) {
          setError(
            "Login required."
          );
          return;
        }

        fileInputRef.current?.click();

        return;
      }

      sendMessage(cmd);
    };

  // ==========================================================
  // RESET SESSION
  // ==========================================================

  const resetSession =
    async () => {
      if (sessionId) {
        try {
          await axios.delete(
            `${API_BASE}/api/alex/chat/sessions/${sessionId}`,
            {
              headers:
                getAuthHeaders(),
            }
          );
        } catch {}
      }

      localStorage.removeItem(
        getSessionStorageKey()
      );

      localStorage.removeItem(
        getOwnerMemoryStorageKey()
      );

      setSessionId(
        createSessionId()
      );

      setMessages([]);

      setMetrics(null);

      setError(null);
    };

  if (!isOpen) {
    return null;
  }

  // ==========================================================
  // UI
  // ==========================================================

  return (
    <div
      style={{
        position:
          "fixed",
        bottom: "24px",
        right: "24px",
        width: "440px",
        height: "620px",
        background:
          "linear-gradient(180deg, #0f0f23 0%, #1a1a2e 100%)",
        borderRadius:
          "16px",
        boxShadow:
          "0 20px 60px rgba(0,0,0,0.5), 0 0 80px rgba(139,92,246,0.15)",
        display:
          "flex",
        flexDirection:
          "column",
        overflow:
          "hidden",
        zIndex:
          9999,
        border:
          "1px solid rgba(139,92,246,0.2)",
        fontFamily:
          "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      }}
    >
      {/* =====================================================
          HEADER
          ===================================================== */}

      <div
        style={{
          padding:
            "16px 20px",
          background:
            "linear-gradient(135deg, #1e1b4b, #312e81)",
          borderBottom:
            "1px solid rgba(139,92,246,0.2)",
          display:
            "flex",
          alignItems:
            "center",
          justifyContent:
            "space-between",
          flexShrink: 0,
        }}
      >
        <div
          style={{
            display:
              "flex",
            alignItems:
              "center",
            gap: "12px",
          }}
        >
          <div
            style={{
              width: "40px",
              height: "40px",
              borderRadius:
                "12px",
              background:
                "linear-gradient(135deg, #8b5cf6, #6d28d9)",
              display:
                "flex",
              alignItems:
                "center",
              justifyContent:
                "center",
              fontSize:
                "20px",
            }}
          >
            🤖
          </div>

          <div>
            <div
              style={{
                color:
                  "#fff",
                fontWeight:
                  700,
                fontSize:
                  "16px",
              }}
            >
              ALEX
            </div>

            <div
              style={{
                color:
                  "#a78bfa",
                fontSize:
                  "11px",
                display:
                  "flex",
                alignItems:
                  "center",
                gap: "6px",
              }}
            >
              <span
                style={{
                  width: "6px",
                  height:
                    "6px",
                  borderRadius:
                    "50%",
                  background:
                    getToken() ||
                    adminKey
                      ? "#10b981"
                      : "#ef4444",
                  display:
                    "inline-block",
                }}
              />

              {adminKey
                ? "🔑 Owner Mode"
                : getToken()
                ? "● Online"
                : "⛔ Login Required"}
            </div>
          </div>
        </div>

        <div
          style={{
            display:
              "flex",
            gap: "8px",
            alignItems:
              "center",
          }}
        >
          {adminKey && (
            <button
              onClick={
                handleClearAdminKey
              }
              title="Clear Admin Key"
              style={{
                background:
                  "rgba(239,68,68,0.15)",
                border:
                  "none",
                color:
                  "#fca5a5",
                width:
                  "32px",
                height:
                  "32px",
                borderRadius:
                  "8px",
                cursor:
                  "pointer",
                fontSize:
                  "12px",
              }}
            >
              🔑
            </button>
          )}

          {windowsAgentToken && (
            <button
              onClick={
                handleClearWindowsAgentToken
              }
              title="Clear Windows Agent pairing"
              style={{
                background:
                  "rgba(239,68,68,0.15)",
                border:
                  "none",
                color:
                  "#fca5a5",
                width:
                  "32px",
                height:
                  "32px",
                borderRadius:
                  "8px",
                cursor:
                  "pointer",
                fontSize:
                  "12px",
              }}
            >
              🖥️
            </button>
          )}

          <button
            onClick={() => {
              setShowWindowsAgentTokenInput(
                true
              );

              setShowAdminKeyInput(
                false
              );
            }}
            title="Windows Agent Settings"
            style={{
              background:
                windowsAgentToken
                  ? "rgba(16,185,129,0.15)"
                  : "rgba(255,255,255,0.1)",
              border:
                "none",
              color:
                windowsAgentToken
                  ? "#6ee7b7"
                  : "#cbd5e1",
              width:
                "32px",
              height:
                "32px",
              borderRadius:
                "8px",
              cursor:
                "pointer",
              fontSize:
                "14px",
            }}
          >
            🖥️
          </button>

          {metrics && (
            <div
              style={{
                color:
                  "#64748b",
                fontSize:
                  "11px",
                textAlign:
                  "right",
              }}
            >
              <div>
                {
                  metrics.commandsExecuted ||
                  0
                }{" "}
                ✅
              </div>

              <div>
                {
                  metrics.commandsFailed ||
                  0
                }{" "}
                ❌
              </div>
            </div>
          )}

          <button
            onClick={
              resetSession
            }
            title="New Session"
            style={{
              background:
                "rgba(255,255,255,0.1)",
              border:
                "none",
              color:
                "#cbd5e1",
              width:
                "32px",
              height:
                "32px",
              borderRadius:
                "8px",
              cursor:
                "pointer",
              fontSize:
                "14px",
            }}
          >
            ↺
          </button>

          <button
            onClick={onClose}
            title="Close"
            style={{
              background:
                "rgba(255,255,255,0.1)",
              border:
                "none",
              color:
                "#cbd5e1",
              width:
                "32px",
              height:
                "32px",
              borderRadius:
                "8px",
              cursor:
                "pointer",
              fontSize:
                "18px",
            }}
          >
            ✕
          </button>
        </div>
      </div>

      {/* =====================================================
          MESSAGES
          ===================================================== */}

      <div
        style={{
          flex: 1,
          overflowY:
            "auto",
          padding:
            "20px",
          scrollBehavior:
            "smooth",
        }}
      >
        {showWindowsAgentTokenInput && (
          <div
            style={{
              display:
                "flex",
              flexDirection:
                "column",
              alignItems:
                "center",
              justifyContent:
                "center",
              height:
                "100%",
              padding:
                "20px",
            }}
          >
            <div
              style={{
                fontSize:
                  "48px",
                marginBottom:
                  "16px",
              }}
            >
              🖥️
            </div>

            <div
              style={{
                fontSize:
                  "18px",
                fontWeight:
                  600,
                color:
                  "#e2e8f0",
                marginBottom:
                  "8px",
              }}
            >
              Windows Agent Pairing
            </div>

            <div
              style={{
                fontSize:
                  "13px",
                color:
                  "#94a3b8",
                maxWidth:
                  "320px",
                textAlign:
                  "center",
                marginBottom:
                  "20px",
              }}
            >
              Paste the pairing
              token shown when
              your local Windows
              Agent starts.
            </div>

            <div
              style={{
                display:
                  "flex",
                gap: "8px",
                width:
                  "100%",
                maxWidth:
                  "350px",
              }}
            >
              <input
                type="password"
                value={
                  windowsAgentTokenInput
                }
                onChange={(e) =>
                  setWindowsAgentTokenInput(
                    e.target.value
                  )
                }
                onKeyDown={(e) => {
                  if (
                    e.key ===
                    "Enter"
                  ) {
                    handleSaveWindowsAgentToken();
                  }
                }}
                placeholder="Paste Windows Agent token..."
                style={{
                  flex: 1,
                  background:
                    "rgba(255,255,255,0.05)",
                  border:
                    "1px solid rgba(16,185,129,0.3)",
                  borderRadius:
                    "10px",
                  padding:
                    "10px 14px",
                  color:
                    "#e2e8f0",
                  fontSize:
                    "14px",
                  outline:
                    "none",
                  fontFamily:
                    "monospace",
                }}
              />

              <button
                onClick={
                  handleSaveWindowsAgentToken
                }
                style={{
                  background:
                    "linear-gradient(135deg, #10b981, #047857)",
                  border:
                    "none",
                  borderRadius:
                    "10px",
                  padding:
                    "10px 20px",
                  color:
                    "#fff",
                  cursor:
                    "pointer",
                  fontSize:
                    "14px",
                  fontWeight:
                    600,
                }}
              >
                Pair
              </button>
            </div>
          </div>
        )}

        {showAdminKeyInput &&
          !showWindowsAgentTokenInput && (
            <div
              style={{
                display:
                  "flex",
                flexDirection:
                  "column",
                alignItems:
                  "center",
                justifyContent:
                  "center",
                height:
                  "100%",
                padding:
                  "20px",
              }}
            >
              <div
                style={{
                  fontSize:
                    "48px",
                  marginBottom:
                    "16px",
                }}
              >
                🔑
              </div>

              <div
                style={{
                  fontSize:
                    "18px",
                  fontWeight:
                    600,
                  color:
                    "#e2e8f0",
                  marginBottom:
                    "8px",
                }}
              >
                Admin Key
              </div>

              <div
                style={{
                  fontSize:
                    "13px",
                  color:
                    "#94a3b8",
                  maxWidth:
                    "320px",
                  textAlign:
                    "center",
                  marginBottom:
                    "20px",
                }}
              >
                Enter the admin key
                only if you are
                authorized to use
                owner/admin mode.
              </div>

              <div
                style={{
                  display:
                    "flex",
                  gap: "8px",
                  width:
                    "100%",
                  maxWidth:
                    "350px",
                }}
              >
                <input
                  ref={
                    adminKeyInputRef
                  }
                  type="password"
                  value={
                    adminKeyInput
                  }
                  onChange={(e) =>
                    setAdminKeyInput(
                      e.target.value
                    )
                  }
                  onKeyDown={(e) => {
                    if (
                      e.key ===
                      "Enter"
                    ) {
                      handleSaveAdminKey();
                    }
                  }}
                  placeholder="Enter admin key..."
                  style={{
                    flex: 1,
                    background:
                      "rgba(255,255,255,0.05)",
                    border:
                      "1px solid rgba(139,92,246,0.3)",
                    borderRadius:
                      "10px",
                    padding:
                      "10px 14px",
                    color:
                      "#e2e8f0",
                    fontSize:
                      "14px",
                    outline:
                      "none",
                    fontFamily:
                      "monospace",
                  }}
                />

                <button
                  onClick={
                    handleSaveAdminKey
                  }
                  style={{
                    background:
                      "linear-gradient(135deg, #8b5cf6, #6d28d9)",
                    border:
                      "none",
                    borderRadius:
                      "10px",
                    padding:
                      "10px 20px",
                    color:
                      "#fff",
                    cursor:
                      "pointer",
                    fontSize:
                      "14px",
                    fontWeight:
                      600,
                  }}
                >
                  Set Key
                </button>
              </div>
            </div>
          )}

        {!showAdminKeyInput &&
          !showWindowsAgentTokenInput &&
          messages.length === 0 && (
            <div
              style={{
                display:
                  "flex",
                flexDirection:
                  "column",
                alignItems:
                  "center",
                justifyContent:
                  "center",
                minHeight:
                  "100%",
                color:
                  "#64748b",
                textAlign:
                  "center",
                padding:
                  "20px",
              }}
            >
              <div
                style={{
                  fontSize:
                    "48px",
                  marginBottom:
                    "16px",
                }}
              >
                🤖
              </div>

              <div
                style={{
                  fontSize:
                    "18px",
                  fontWeight:
                    600,
                  color:
                    "#94a3b8",
                  marginBottom:
                    "8px",
                }}
              >
                ALEX is ready
              </div>

              <div
                style={{
                  fontSize:
                    "13px",
                  color:
                    "#64748b",
                  maxWidth:
                    "300px",
                  marginBottom:
                    "24px",
                }}
              >
                File upload karke
                fix karwa ya kuch
                bhi bolo!
              </div>

              {hasAuthentication() && (
                <div
                  style={{
                    display:
                      "flex",
                    flexDirection:
                      "column",
                    gap: "6px",
                    width:
                      "100%",
                  }}
                >
                  {SUGGESTED_COMMANDS.map(
                    (
                      cmd,
                      i
                    ) => (
                      <button
                        key={i}
                        onClick={() =>
                          handleSuggested(
                            cmd.command
                          )
                        }
                        style={{
                          background:
                            cmd.command ===
                            "__UPLOAD__"
                              ? "rgba(16,185,129,0.12)"
                              : "rgba(139,92,246,0.1)",
                          border:
                            cmd.command ===
                            "__UPLOAD__"
                              ? "1px solid rgba(16,185,129,0.3)"
                              : "1px solid rgba(139,92,246,0.2)",
                          borderRadius:
                            "8px",
                          padding:
                            "8px 14px",
                          color:
                            cmd.command ===
                            "__UPLOAD__"
                              ? "#6ee7b7"
                              : "#c4b5fd",
                          cursor:
                            "pointer",
                          fontSize:
                            "13px",
                          textAlign:
                            "left",
                        }}
                      >
                        {
                          cmd.label
                        }
                      </button>
                    )
                  )}
                </div>
              )}
            </div>
          )}

        {error &&
          !showAdminKeyInput &&
          !showWindowsAgentTokenInput && (
            <div
              style={{
                marginBottom:
                  "12px",
                padding:
                  "10px 12px",
                borderRadius:
                  "8px",
                background:
                  "rgba(239,68,68,0.1)",
                border:
                  "1px solid rgba(239,68,68,0.25)",
                color:
                  "#fca5a5",
                fontSize:
                  "12px",
              }}
            >
              {error}

              <button
                onClick={() =>
                  setError(
                    null
                  )
                }
                style={{
                  float:
                    "right",
                  background:
                    "none",
                  border:
                    "none",
                  color:
                    "#fca5a5",
                  cursor:
                    "pointer",
                }}
              >
                ✕
              </button>
            </div>
          )}

        {!showWindowsAgentTokenInput &&
          !showAdminKeyInput &&
          messages.map(
            (msg, i) =>
              msg.type ===
              "typing" ? (
                <div
                  key={i}
                  style={{
                    display:
                      "flex",
                    gap:
                      "12px",
                    marginBottom:
                      "20px",
                    alignItems:
                      "center",
                    padding:
                      "14px 18px",
                    background:
                      "#16213e",
                    borderRadius:
                      "16px 16px 16px 4px",
                    maxWidth:
                      "80%",
                  }}
                >
                  <div
                    style={{
                      color:
                        "#a78bfa",
                      fontSize:
                        "14px",
                    }}
                  >
                    🤖
                  </div>

                  <div
                    style={{
                      display:
                        "flex",
                      gap:
                        "4px",
                    }}
                  >
                    {[0, 1, 2].map(
                      (j) => (
                        <span
                          key={
                            j
                          }
                          style={{
                            width:
                              "8px",
                            height:
                              "8px",
                            borderRadius:
                              "50%",
                            background:
                              "#8b5cf6",
                            animation:
                              "bounce 1.4s infinite ease-in-out",
                            animationDelay: `${
                              j *
                              0.2
                            }s`,
                          }}
                        />
                      )
                    )}
                  </div>
                </div>
              ) : (
                <ChatMessage
                  key={i}
                  message={
                    msg
                  }
                />
              )
          )}

        <div
          ref={
            messagesEndRef
          }
        />
      </div>

      {/* =====================================================
          INPUT
          ===================================================== */}

      <div
        style={{
          padding:
            "12px 16px",
          borderTop:
            "1px solid rgba(139,92,246,0.15)",
          background:
            "rgba(15,15,35,0.95)",
          flexShrink: 0,
        }}
      >
        <div
          style={{
            display:
              "flex",
            gap: "8px",
          }}
        >
          <input
            ref={
              fileInputRef
            }
            type="file"
            accept=".js,.mjs,.cjs,.jsx,.ts,.tsx,.py,.java,.cpp,.c,.html,.css,.json,.sql,.sh,.md,.go,.rb,.php"
            style={{
              display:
                "none",
            }}
            onChange={
              handleFileSelect
            }
          />

          <button
            onClick={() => {
              if (
                !hasAuthentication()
              ) {
                setError(
                  "Login required. Pehle login karo."
                );
                return;
              }

              fileInputRef.current?.click();
            }}
            disabled={
              uploading ||
              loading
            }
            title="Upload file"
            style={{
              width:
                "42px",
              height:
                "42px",
              borderRadius:
                "10px",
              background:
                "rgba(16,185,129,0.15)",
              border:
                "1px solid rgba(16,185,129,0.3)",
              color:
                "#34d399",
              cursor:
                uploading ||
                loading
                  ? "not-allowed"
                  : "pointer",
              fontSize:
                "18px",
              display:
                "flex",
              alignItems:
                "center",
              justifyContent:
                "center",
              flexShrink: 0,
            }}
          >
            {uploading
              ? "⏳"
              : "📎"}
          </button>

          <textarea
            ref={
              inputRef
            }
            value={input}
            onChange={(e) =>
              setInput(
                e.target.value
              )
            }
            onKeyDown={
              handleKeyDown
            }
            placeholder={
              authenticated
                ? "Tell ALEX what to do... (ya 📎 se file upload karo)"
                : "Pehle login karo..."
            }
            rows={1}
            disabled={
              loading ||
              !authenticated
            }
            style={{
              flex: 1,
              background:
                "rgba(255,255,255,0.05)",
              border:
                "1px solid rgba(139,92,246,0.2)",
              borderRadius:
                "10px",
              padding:
                "10px 14px",
              color:
                "#e2e8f0",
              fontSize:
                "14px",
              resize:
                "none",
              outline:
                "none",
              minHeight:
                "42px",
              fontFamily:
                "inherit",
              opacity:
                authenticated
                  ? 1
                  : 0.6,
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
              borderRadius:
                "10px",
              background:
                loading ||
                !authenticated ||
                !input.trim()
                  ? "rgba(139,92,246,0.3)"
                  : "linear-gradient(135deg, #8b5cf6, #6d28d9)",
              border:
                "none",
              color:
                "#fff",
              cursor:
                loading ||
                !authenticated ||
                !input.trim()
                  ? "not-allowed"
                  : "pointer",
              fontSize:
                "18px",
              display:
                "flex",
              alignItems:
                "center",
              justifyContent:
                "center",
              flexShrink: 0,
            }}
          >
            {loading
              ? "⏳"
              : "➤"}
          </button>
        </div>
      </div>

      {/* =====================================================
          STYLE
          ===================================================== */}

      <style>{`
        .alex-content p {
          margin: 0 0 8px 0;
        }

        .alex-content p:last-child {
          margin-bottom: 0;
        }

        .alex-content ul {
          margin: 6px 0;
          padding-left: 20px;
        }

        .alex-content li {
          margin-bottom: 4px;
        }

        .alex-content h3 {
          margin: 10px 0 6px 0;
          color: #c4b5fd;
          font-size: 13px;
        }

        .alex-content code {
          background: rgba(139,92,246,0.15);
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 13px;
          font-family: 'JetBrains Mono', monospace;
          color: #c4b5fd;
        }

        .alex-content pre {
          background: #0a0a1a;
          border: 1px solid rgba(139,92,246,0.15);
          border-radius: 8px;
          padding: 12px;
          overflow-x: auto;
          margin: 8px 0;
        }

        .alex-content pre code {
          background: none;
          padding: 0;
          color: #e2e8f0;
          font-size: 12px;
        }

        .alex-content strong {
          color: #f1f5f9;
        }

        .alex-report ul {
          padding-left: 16px;
        }

        textarea::placeholder {
          color: #475569;
        }

        button {
          -webkit-tap-highlight-color: transparent;
        }

        ::-webkit-scrollbar {
          width: 6px;
        }

        ::-webkit-scrollbar-track {
          background: transparent;
        }

        ::-webkit-scrollbar-thumb {
          background: rgba(139,92,246,0.3);
          border-radius: 3px;
        }

        @keyframes bounce {
          0%, 80%, 100% {
            transform: scale(0);
          }

          40% {
            transform: scale(1);
          }
        }

        @media (max-width: 600px) {
          .alex-content {
            font-size: 13px !important;
          }
        }
      `}</style>
    </div>
  );
};

export default AlexChat;