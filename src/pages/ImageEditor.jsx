// ============================================================
// AI IMAGE EDITOR — PRODUCTION v4.1
// Result preview uses ONE canonical URL builder (apiService.buildPreviewUrl)
// built from a safely extracted basename — never raw `path`, never blob,
// never double-prepended base URL.
// AI Edit supports Hindi/Hinglish/English + multi-step commands.
// ============================================================

import React, { useState, useRef, useCallback, useEffect } from "react";
import apiService from "../services/api";
import "./ImageEditor.css";

// ============================================
// DEBUG — set to false after confirming the fix in production
// ============================================
const DEBUG_IMAGE_EDIT = true;

// ============================================
// FILTERS CONFIGURATION (ids match backend FILTER_PRESETS)
// ============================================

const FILTERS = [
  { id: "natural", label: "Natural", icon: "🌿" },
  { id: "brighten", label: "Brighten", icon: "☀️" },
  { id: "darken", label: "Darken", icon: "🌙" },
  { id: "contrast", label: "Contrast", icon: "◐" },
  { id: "saturate", label: "Saturate", icon: "🎨" },
  { id: "desaturate", label: "Desaturate", icon: "🖌️" },
  { id: "warm", label: "Warm", icon: "🔥" },
  { id: "cool", label: "Cool", icon: "❄️" },
  { id: "vintage", label: "Vintage", icon: "📷" },
  { id: "bw", label: "B&W", icon: "⚫" },
  { id: "cinematic", label: "Cinematic", icon: "🎬" },
  { id: "portrait", label: "Portrait", icon: "👤" },
  { id: "soft", label: "Soft", icon: "💫" },
  { id: "vivid", label: "Vivid", icon: "🌈" },
  { id: "dramatic", label: "Dramatic", icon: "🎭" },
];

const QUICK_ACTIONS = [
  { id: "enhance", label: "Enhance", icon: "✨" },
  { id: "upscale", label: "2x Upscale", icon: "🔍" },
  { id: "removeBg", label: "Remove BG", icon: "✂️" },
  { id: "bw_q", label: "B&W", icon: "⚫" },
  { id: "warm_q", label: "Warm", icon: "🔥" },
  { id: "vintage_q", label: "Vintage", icon: "📷" },
];

const AI_SUGGESTIONS = [
  "background hata do",
  "HD kar do",
  "brightness badha do",
  "background white kar do",
  "vintage look do",
  "cinematic bana do",
];

const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB client-side (server allows 20MB)

// ============================================
// IMAGE EDITOR COMPONENT
// ============================================

function ImageEditor() {
  const [originalUrl, setOriginalUrl] = useState(null); // local blob preview (original ONLY)
  const [originalPath, setOriginalPath] = useState(null); // server filename of ORIGINAL
  const [currentPath, setCurrentPath] = useState(null); // server filename of latest edit

  const [resultUrl, setResultUrl] = useState(null); // canonical backend preview URL
  const [resultLoadError, setResultLoadError] = useState(false); // React-state based, no DOM hacks
  const [metadata, setMetadata] = useState(null);
  const [activeFilter, setActiveFilter] = useState(null);
  const [adjustments, setAdjustments] = useState({
    brightness: 1,
    contrast: 1,
    saturation: 1,
  });
  const [aiInstruction, setAiInstruction] = useState("");
  const [imageState, setImageState] = useState("empty"); // empty | loaded | error
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [processingMessage, setProcessingMessage] = useState("");

  const fileInputRef = useRef(null);
  const adjustTimerRef = useRef(null);
  const currentPathRef = useRef(null);
  const blobUrlRef = useRef(null);
  const isProcessingRef = useRef(false);

  useEffect(() => {
    currentPathRef.current = currentPath;
  }, [currentPath]);

  useEffect(() => {
    isProcessingRef.current = isProcessing;
  }, [isProcessing]);

  // ============================================
  // CLEANUP ON UNMOUNT
  // ============================================
  useEffect(() => {
    return () => {
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
      }
      if (adjustTimerRef.current) {
        clearTimeout(adjustTimerRef.current);
      }
    };
  }, []);

  // ============================================
  // COMMON: handle API responses
  // Establishes the single consistent contract:
  //   response.data.data → { preview | resultUrl | path | filename }
  //   → safely resolved basename → canonical preview URL
  // ============================================
  const applyResult = useCallback((responseData, context = "operation") => {
    if (!responseData?.success) {
      throw new Error(responseData?.message || "Operation failed.");
    }

    const d = responseData.data || {};

    // Resolve filename from ANY response format (see api.js)
    const filename = apiService.resolveImageFilename(d);

    if (DEBUG_IMAGE_EDIT) {
      console.log(`[IMAGE EDIT RESULT] (${context})`, {
        responseData: responseData,
        filename: filename,
        preview: d.preview,
        resultUrl: d.resultUrl,
        path: d.path,
        finalPreviewUrl: filename ? apiService.buildPreviewUrl(filename) : null,
      });
    }

    if (!filename) {
      throw new Error(
        "Backend ne valid image filename return nahi kiya. Deploy latest backend and retry."
      );
    }

    // currentPath always points to the LATEST successful result
    setCurrentPath(filename);

    // Edited Result uses ONLY the canonical backend preview URL
    // (never blob, never original URL, never constructed from raw path)
    setResultUrl(apiService.buildPreviewUrl(filename));
    setResultLoadError(false);

    if (d.width && d.height) {
      setMetadata((prev) => ({
        ...(prev || {}),
        width: d.width,
        height: d.height,
        format: d.format || (prev && prev.format) || "jpeg",
      }));
    }

    setSuccessMessage(responseData.message || null);
    setImageState("loaded");
  }, []);

  const runOperation = useCallback(
    async (message, fn, context, onError) => {
      // Prevent duplicate/parallel requests
      if (isProcessingRef.current) return;

      setIsProcessing(true);
      setErrorMessage(null);
      setSuccessMessage(null);
      setProcessingMessage(message);
      try {
        const response = await fn();
        applyResult(response.data, context);
      } catch (err) {
        console.error(`[ImageEditor] ${context} error:`, err.message);
        // On failure: current image + previous result are PRESERVED
        setErrorMessage(err.message || "Operation failed.");
        if (onError) onError();
      } finally {
        setIsProcessing(false);
        setProcessingMessage("");
      }
    },
    [applyResult]
  );

  // ============================================
  // FILE VALIDATION
  // ============================================
  const validateFile = useCallback((file) => {
    if (!file) throw new Error("No file selected.");
    if (!ALLOWED_TYPES.includes(file.type)) {
      throw new Error(
        `Invalid file type: ${file.type || "unknown"}. Allowed: JPG, PNG, WebP.`
      );
    }
    if (file.size > MAX_FILE_SIZE) {
      const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
      throw new Error(`File too large (${sizeMB}MB). Maximum is 10MB.`);
    }
    return true;
  }, []);

  // ============================================
  // HANDLE FILE SELECTION / UPLOAD
  // ============================================
  const handleFile = useCallback(
    async (file) => {
      if (isProcessingRef.current) return;
      setErrorMessage(null);
      try {
        validateFile(file);
      } catch (err) {
        setErrorMessage(err.message);
        return;
      }

      setIsProcessing(true);
      setProcessingMessage("Uploading image...");
      setResultUrl(null);
      setResultLoadError(false);
      setSuccessMessage(null);
      setActiveFilter(null);
      setAdjustments({ brightness: 1, contrast: 1, saturation: 1 });
      setAiInstruction("");

      // Local blob preview for the ORIGINAL image only
      if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current);
      const localUrl = URL.createObjectURL(file);
      blobUrlRef.current = localUrl;
      setOriginalUrl(localUrl);

      try {
        const response = await apiService.uploadImage(file);
        const responseData = response.data;

        if (!responseData.success) {
          throw new Error(responseData.message || "Upload failed.");
        }

        const d = responseData.data || {};
        // Use the same safe resolution (old backends may return a full path)
        const filename =
          apiService.resolveImageFilename(d) ||
          apiService.extractBasename(d.path);

        if (DEBUG_IMAGE_EDIT) {
          console.log("[IMAGE EDIT RESULT] (upload)", {
            responseData,
            filename,
            finalPreviewUrl: filename ? apiService.buildPreviewUrl(filename) : null,
          });
        }

        if (!filename) {
          throw new Error("Upload succeeded but server returned no valid filename.");
        }

        setOriginalPath(filename);
        setCurrentPath(filename);
        setMetadata({
          width: d.width,
          height: d.height,
          format: d.format,
          size: d.size,
        });
        setImageState("loaded");
        setSuccessMessage("Image uploaded. Start editing!");
      } catch (err) {
        console.error("[ImageEditor] Upload error:", err);
        setImageState("error");
        setErrorMessage(err.message || "Failed to upload image.");
        setOriginalUrl(null);
        setOriginalPath(null);
        setCurrentPath(null);
      } finally {
        setIsProcessing(false);
        setProcessingMessage("");
      }
    },
    [validateFile]
  );

  // ============================================
  // FILE INPUT + DRAG AND DROP
  // ============================================
  const handleFileInput = useCallback(
    (e) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
      e.target.value = "";
    },
    [handleFile]
  );

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault();
      e.stopPropagation();
      setDragOver(false);
      const file = e.dataTransfer?.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
  }, []);

  // ============================================
  // APPLY FILTER
  // ============================================
  const applyFilter = useCallback(
    (filterId) => {
      if (!currentPathRef.current) return;
      runOperation(
        `Applying ${filterId} filter...`,
        () => apiService.applyFilter(currentPathRef.current, filterId),
        `filter:${filterId}`,
        () => setActiveFilter(null)
      );
      setActiveFilter(filterId);
    },
    [runOperation]
  );

  // ============================================
  // APPLY ADJUSTMENTS — debounced (600ms after slider stops)
  // ============================================
  const applyAdjustmentsNow = useCallback(
    (adj) => {
      const path = currentPathRef.current;
      if (!path) return;
      runOperation(
        "Applying adjustments...",
        () => apiService.applyAdjustments(path, adj),
        "adjust"
      );
    },
    [runOperation]
  );

  const handleAdjustmentChange = useCallback(
    (key, value) => {
      const newAdjustments = { ...adjustments, [key]: parseFloat(value) };
      setAdjustments(newAdjustments);

      if (adjustTimerRef.current) clearTimeout(adjustTimerRef.current);
      adjustTimerRef.current = setTimeout(() => {
        applyAdjustmentsNow(newAdjustments);
      }, 600);
    },
    [adjustments, applyAdjustmentsNow]
  );

  // ============================================
  // QUICK ACTIONS
  // ============================================
  const handleQuickAction = useCallback(
    (actionId) => {
      const path = currentPathRef.current;
      if (!path) return;

      switch (actionId) {
        case "enhance":
          runOperation("Enhancing image...", () => apiService.enhanceImage(path), "enhance");
          break;
        case "upscale":
          runOperation("Upscaling image 2x...", () => apiService.upscaleImage(path, 2), "upscale");
          break;
        case "removeBg":
          runOperation("Removing background...", () => apiService.removeBackground(path), "removeBg");
          break;
        case "bw_q":
          applyFilter("bw");
          break;
        case "warm_q":
          applyFilter("warm");
          break;
        case "vintage_q":
          applyFilter("vintage");
          break;
        default:
          setErrorMessage(`Unknown action: ${actionId}`);
      }
    },
    [runOperation, applyFilter]
  );

  // ============================================
  // AI EDIT — natural language (Hindi/Hinglish/English), multi-step
  // ============================================
  const handleAiEdit = useCallback(
    (instruction) => {
      const path = currentPathRef.current;
      if (!path || !instruction.trim()) return;
      runOperation(
        `AI editing: "${instruction.trim()}"...`,
        () => apiService.aiEditImage(path, instruction.trim()),
        "ai-edit"
      );
    },
    [runOperation]
  );

  const handleAiEditSubmit = useCallback(
    (e) => {
      e.preventDefault();
      handleAiEdit(aiInstruction);
    },
    [aiInstruction, handleAiEdit]
  );

  // ============================================
  // RESET — revert to original upload (original is never overwritten)
  // ============================================
  const handleReset = useCallback(() => {
    if (!originalPath) return;
    setCurrentPath(originalPath);
    setResultUrl(null);
    setResultLoadError(false);
    setActiveFilter(null);
    setAdjustments({ brightness: 1, contrast: 1, saturation: 1 });
    setErrorMessage(null);
    setSuccessMessage("Reset to original image.");
  }, [originalPath]);

  // ============================================
  // NEW IMAGE
  // ============================================
  const handleNewImage = useCallback(() => {
    if (blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current);
      blobUrlRef.current = null;
    }
    setOriginalUrl(null);
    setResultUrl(null);
    setResultLoadError(false);
    setMetadata(null);
    setImageState("empty");
    setOriginalPath(null);
    setCurrentPath(null);
    setActiveFilter(null);
    setAdjustments({ brightness: 1, contrast: 1, saturation: 1 });
    setErrorMessage(null);
    setSuccessMessage(null);
    setAiInstruction("");
    fileInputRef.current?.click();
  }, []);

  // ============================================
  // DOWNLOAD — same filename as the displayed edited result
  // ============================================
  const downloadFilename = currentPath || originalPath;
  const downloadHref = downloadFilename
    ? apiService.downloadUrl(downloadFilename)
    : null;

  // ============================================
  // RENDER FILE SIZE
  // ============================================
  const formatFileSize = (bytes) => {
    if (!bytes) return "N/A";
    const mb = bytes / (1024 * 1024);
    if (mb < 1) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${mb.toFixed(2)} MB`;
  };

  const showUploadArea = imageState === "empty" || (imageState === "error" && !originalUrl);

  return (
    <div className="image-editor-container">
      <div className="image-editor-header">
        <h1>AI Image Editor</h1>
        <p className="subtitle">
          Upload, edit, and enhance your images with AI-powered tools — Hindi,
          Hinglish & English instructions supported
        </p>
      </div>

      {/* ERROR DISPLAY */}
      {errorMessage && (
        <div className="error-banner">
          <span className="error-icon">⚠️</span>
          <span>{errorMessage}</span>
          <button className="error-dismiss" onClick={() => setErrorMessage(null)}>
            ✕
          </button>
        </div>
      )}

      {/* SUCCESS DISPLAY */}
      {successMessage && !errorMessage && (
        <div
          className="success-banner"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            background: "#f0fff4",
            border: "1px solid #9ae6b4",
            borderRadius: "8px",
            padding: "12px 16px",
            marginBottom: "20px",
            color: "#276749",
            fontSize: "0.9rem",
          }}
        >
          <span>✓</span>
          <span>{successMessage}</span>
          <button
            className="error-dismiss"
            style={{ color: "#276749" }}
            onClick={() => setSuccessMessage(null)}
          >
            ✕
          </button>
        </div>
      )}

      {/* PROCESSING OVERLAY */}
      {isProcessing && (
        <div className="processing-overlay">
          <div className="processing-spinner"></div>
          <p>{processingMessage || "Processing..."}</p>
        </div>
      )}

      {/* UPLOAD AREA */}
      {showUploadArea && (
        <div
          className={`upload-area ${dragOver ? "drag-over" : ""}`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".jpg,.jpeg,.png,.webp"
            onChange={handleFileInput}
            style={{ display: "none" }}
          />
          <div className="upload-icon">
            <svg
              width="64"
              height="64"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
          </div>
          <h3>Drop your image here</h3>
          <p>or click to browse</p>
          <p className="upload-hint">Supports JPG, PNG, WebP (up to 10MB)</p>
        </div>
      )}

      {/* EDITOR */}
      {imageState !== "empty" && (
        <div className="editor-layout">
          {/* LEFT SIDEBAR */}
          <div className="editor-sidebar">
            <button className="new-image-btn" onClick={handleNewImage}>
              📁 New Image
            </button>

            {/* FILTERS */}
            <div className="tool-section">
              <h3>Filters</h3>
              <div className="filter-grid">
                {FILTERS.map((filter) => (
                  <button
                    key={filter.id}
                    className={`filter-btn ${activeFilter === filter.id ? "active" : ""}`}
                    onClick={() => applyFilter(filter.id)}
                    disabled={isProcessing || !currentPath}
                    title={filter.label}
                  >
                    <span className="filter-icon">{filter.icon}</span>
                    <span className="filter-label">{filter.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* ADJUSTMENTS */}
            <div className="tool-section">
              <h3>Adjustments</h3>

              <div className="adjustment-group">
                <label>
                  Brightness
                  <span className="adjust-value">{adjustments.brightness.toFixed(1)}x</span>
                </label>
                <input
                  type="range"
                  min="0.3"
                  max="2.0"
                  step="0.1"
                  value={adjustments.brightness}
                  onChange={(e) => handleAdjustmentChange("brightness", e.target.value)}
                  disabled={isProcessing || !currentPath}
                />
              </div>

              <div className="adjustment-group">
                <label>
                  Contrast
                  <span className="adjust-value">{adjustments.contrast.toFixed(1)}x</span>
                </label>
                <input
                  type="range"
                  min="0.3"
                  max="2.5"
                  step="0.1"
                  value={adjustments.contrast}
                  onChange={(e) => handleAdjustmentChange("contrast", e.target.value)}
                  disabled={isProcessing || !currentPath}
                />
              </div>

              <div className="adjustment-group">
                <label>
                  Saturation
                  <span className="adjust-value">{adjustments.saturation.toFixed(1)}x</span>
                </label>
                <input
                  type="range"
                  min="0.0"
                  max="3.0"
                  step="0.1"
                  value={adjustments.saturation}
                  onChange={(e) => handleAdjustmentChange("saturation", e.target.value)}
                  disabled={isProcessing || !currentPath}
                />
              </div>
            </div>

            {/* QUICK ACTIONS */}
            <div className="tool-section">
              <h3>Quick Actions</h3>
              <div className="quick-actions-grid">
                {QUICK_ACTIONS.map((action) => (
                  <button
                    key={action.id}
                    className="quick-action-btn"
                    onClick={() => handleQuickAction(action.id)}
                    disabled={isProcessing || !currentPath}
                  >
                    <span className="action-icon">{action.icon}</span>
                    <span className="action-label">{action.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* AI EDIT */}
            <div className="tool-section">
              <h3>AI Edit (Hindi / English)</h3>
              <form onSubmit={handleAiEditSubmit} className="ai-edit-form">
                <input
                  type="text"
                  value={aiInstruction}
                  onChange={(e) => setAiInstruction(e.target.value)}
                  placeholder='e.g., "background hata do aur HD kar do"'
                  disabled={isProcessing || !currentPath}
                  className="ai-input"
                />
                <button
                  type="submit"
                  className="ai-edit-btn"
                  disabled={isProcessing || !aiInstruction.trim() || !currentPath}
                >
                  Apply
                </button>
              </form>
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "6px",
                  marginTop: "10px",
                }}
              >
                {AI_SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setAiInstruction(s)}
                    disabled={isProcessing || !currentPath}
                    style={{
                      fontSize: "0.7rem",
                      padding: "4px 8px",
                      borderRadius: "12px",
                      border: "1px solid #d0ccff",
                      background: "#f5f3ff",
                      color: "#5a52d5",
                      cursor: "pointer",
                    }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* RESET */}
            <button
              className="reset-btn"
              onClick={handleReset}
              disabled={isProcessing || !originalPath}
            >
              🔄 Reset to Original
            </button>
          </div>

          {/* RIGHT PANEL — Preview */}
          <div className="editor-preview">
            {/* ORIGINAL IMAGE — always visible, never modified */}
            <div className="preview-section">
              <h3>Original Image</h3>
              <div className="image-frame">
                {originalUrl ? (
                  <img src={originalUrl} alt="Original" className="preview-image" />
                ) : (
                  <div className="no-image-placeholder">No image uploaded.</div>
                )}
              </div>
              {metadata && (
                <div className="image-info">
                  <span className="info-badge">
                    {metadata.width} × {metadata.height}
                  </span>
                  <span className="info-badge">{metadata.format || "jpeg"}</span>
                  {metadata.size && (
                    <span className="info-badge">{formatFileSize(metadata.size)}</span>
                  )}
                </div>
              )}
            </div>

            {/* EDITED RESULT — canonical backend preview URL */}
            <div className="preview-section">
              <h3>
                {resultUrl ? "Edited Result" : "Preview"}
                {downloadHref && (
                  <a href={downloadHref} download className="download-link">
                    ⬇ Download
                  </a>
                )}
              </h3>
              <div className="image-frame">
                {resultUrl && (
                  <img
                    src={resultUrl}
                    alt="Edited"
                    className="preview-image"
                    onError={() => setResultLoadError(true)}
                    onLoad={() => setResultLoadError(false)}
                    style={{ display: resultLoadError ? "none" : "block" }}
                  />
                )}
                <div
                  className="no-image-placeholder"
                  style={{ display: resultUrl && !resultLoadError ? "none" : "flex" }}
                >
                  {resultUrl
                    ? resultLoadError
                      ? "Result image load nahi hui. Retry ya naya edit try karo."
                      : "Loading result..."
                    : "Apply a filter or adjustment to see the result"}
                </div>
              </div>
              {resultUrl && !resultLoadError && metadata && (
                <div className="image-info">
                  <span className="info-badge">
                    {metadata.width} × {metadata.height}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ImageEditor;