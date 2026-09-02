// ============================================================
// AI IMAGE EDITOR — PRODUCTION v3.0
// Stateles flow: upload → server filename → chained edits via imagePath
// ============================================================

import React, { useState, useRef, useCallback, useEffect } from "react";
import apiService from "../services/api";
import "./ImageEditor.css";

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

const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB client-side (server allows 20MB)

// ============================================
// IMAGE EDITOR COMPONENT
// ============================================

function ImageEditor() {
  const [originalFile, setOriginalFile] = useState(null); // File object (for blob URL)
  const [originalUrl, setOriginalUrl] = useState(null); // local blob preview
  const [originalPath, setOriginalPath] = useState(null); // server filename of ORIGINAL
  const [currentPath, setCurrentPath] = useState(null); // server filename being edited

  const [resultUrl, setResultUrl] = useState(null); // absolute URL of edited result
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
  const [dragOver, setDragOver] = useState(false);
  const [processingMessage, setProcessingMessage] = useState("");

  const fileInputRef = useRef(null);
  const adjustTimerRef = useRef(null);
  const currentPathRef = useRef(null);
  const blobUrlRef = useRef(null);

  // Keep a ref of currentPath for debounced callbacks
  useEffect(() => {
    currentPathRef.current = currentPath;
  }, [currentPath]);

  // ============================================
  // CLEANUP ON UNMOUNT — revoke blob URL only
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
  // ============================================
  const applyResult = useCallback((data) => {
    if (!data?.success) {
      throw new Error(data?.message || "Operation failed.");
    }
    const d = data.data || {};
    setCurrentPath(d.path || d.filename || null);
    setResultUrl(apiService.absolutize(d.resultUrl || d.preview));
    if (d.width && d.height) {
      setMetadata((prev) => ({
        ...(prev || {}),
        width: d.width,
        height: d.height,
        format: d.format || (prev && prev.format) || "jpeg",
      }));
    }
    setImageState("loaded");
  }, []);

  const runOperation = useCallback(
    async (message, fn, onError) => {
      setIsProcessing(true);
      setErrorMessage(null);
      setProcessingMessage(message);
      try {
        const response = await fn();
        applyResult(response.data);
      } catch (err) {
        console.error("[ImageEditor]", err.message);
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
      setActiveFilter(null);
      setAdjustments({ brightness: 1, contrast: 1, saturation: 1 });
      setAiInstruction("");

      // Local preview immediately
      if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current);
      const localUrl = URL.createObjectURL(file);
      blobUrlRef.current = localUrl;
      setOriginalFile(file);
      setOriginalUrl(localUrl);

      try {
        const response = await apiService.uploadImage(file);
        const data = response.data;

        if (!data.success) {
          throw new Error(data.message || "Upload failed.");
        }

        setOriginalPath(data.data.path);
        setCurrentPath(data.data.path);
        setMetadata({
          width: data.data.width,
          height: data.data.height,
          format: data.data.format,
          size: data.data.size,
        });
        setImageState("loaded");
      } catch (err) {
        console.error("[ImageEditor] Upload error:", err);
        setImageState("error");
        setErrorMessage(err.message || "Failed to upload image.");
        setOriginalFile(null);
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
      runOperation("Applying adjustments...", () =>
        apiService.applyAdjustments(path, adj)
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
          runOperation("Enhancing image...", () =>
            apiService.enhanceImage(path)
          );
          break;
        case "upscale":
          runOperation("Upscaling image 2x...", () =>
            apiService.upscaleImage(path, 2)
          );
          break;
        case "removeBg":
          runOperation("Removing background...", () =>
            apiService.removeBackground(path)
          );
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
  // AI EDIT
  // ============================================
  const handleAiEdit = useCallback(
    (instruction) => {
      const path = currentPathRef.current;
      if (!path || !instruction.trim()) return;
      runOperation(`AI editing: "${instruction}"...`, () =>
        apiService.aiEditImage(path, instruction.trim())
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
  // RESET — revert to original upload (real revert: edits chain off
  // currentPath, so pointing currentPath back at originalPath IS the reset)
  // ============================================
  const handleReset = useCallback(() => {
    if (!originalPath) return;
    setCurrentPath(originalPath);
    setResultUrl(null);
    setActiveFilter(null);
    setAdjustments({ brightness: 1, contrast: 1, saturation: 1 });
    setErrorMessage(null);
  }, [originalPath]);

  // ============================================
  // NEW IMAGE
  // ============================================
  const handleNewImage = useCallback(() => {
    if (blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current);
      blobUrlRef.current = null;
    }
    setOriginalFile(null);
    setOriginalUrl(null);
    setResultUrl(null);
    setMetadata(null);
    setImageState("empty");
    setOriginalPath(null);
    setCurrentPath(null);
    setActiveFilter(null);
    setAdjustments({ brightness: 1, contrast: 1, saturation: 1 });
    setErrorMessage(null);
    setAiInstruction("");
    fileInputRef.current?.click();
  }, []);

  // ============================================
  // DOWNLOAD — real file download from backend
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
          Upload, edit, and enhance your images with AI-powered tools
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
              <h3>AI Edit</h3>
              <form onSubmit={handleAiEditSubmit} className="ai-edit-form">
                <input
                  type="text"
                  value={aiInstruction}
                  onChange={(e) => setAiInstruction(e.target.value)}
                  placeholder='e.g., "Make brighter", "B&W"'
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
            {/* ORIGINAL IMAGE */}
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

            {/* RESULT IMAGE */}
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
                {resultUrl ? (
                  <img
                    src={resultUrl}
                    alt="Edited"
                    className="preview-image"
                    onError={(e) => {
                      e.target.style.display = "none";
                      if (e.target.nextSibling) e.target.nextSibling.style.display = "flex";
                    }}
                    onLoad={(e) => {
                      e.target.style.display = "block";
                      if (e.target.nextSibling) e.target.nextSibling.style.display = "none";
                    }}
                  />
                ) : null}
                <div
                  className="no-image-placeholder"
                  style={{ display: resultUrl ? "none" : "flex" }}
                >
                  {resultUrl
                    ? "Failed to load result image"
                    : "Apply a filter or adjustment to see the result"}
                </div>
              </div>
              {resultUrl && metadata && (
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