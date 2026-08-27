// ============================================================
// AI IMAGE EDITOR — PREMIUM PRODUCTION VERSION 3.0
// COMPLETE: Upload, preview, 14 filters, adjustments, quick actions,
//           AI edit, reset, error handling
// ============================================================

import React, { useState, useRef, useCallback, useEffect } from "react";
import apiService from "../services/api";
import "./ImageEditor.css";

// ============================================
// FILTERS CONFIGURATION
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
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

// ============================================
// IMAGE EDITOR COMPONENT
// ============================================

function ImageEditor() {
  // ============================================
  // STATE
  // ============================================
  const [sessionId, setSessionId] = useState(null);
  const [imageState, setImageState] = useState("empty"); // empty | loaded | processing | done | error
  const [originalUrl, setOriginalUrl] = useState(null);
  const [resultUrl, setResultUrl] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [metadata, setMetadata] = useState(null);
  const [activeFilter, setActiveFilter] = useState(null);
  const [adjustments, setAdjustments] = useState({
    brightness: 1,
    contrast: 1,
    saturation: 1,
  });
  const [aiInstruction, setAiInstruction] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [processingMessage, setProcessingMessage] = useState("");

  const fileInputRef = useRef(null);
  const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

  // ============================================
  // CLEANUP ON UNMOUNT
  // ============================================
  useEffect(() => {
    return () => {
      if (sessionId) {
        apiService.clearSession(sessionId).catch(() => {});
      }
      // Revoke object URLs
      if (originalUrl && originalUrl.startsWith("blob:")) {
        URL.revokeObjectURL(originalUrl);
      }
    };
  }, [sessionId, originalUrl]);

  // ============================================
  // FILE VALIDATION
  // ============================================
  const validateFile = useCallback((file) => {
    if (!file) {
      throw new Error("No file selected.");
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
      throw new Error(
        `Invalid file type: ${file.type || "unknown"}. Allowed: JPG, PNG, WebP`
      );
    }
    if (file.size > MAX_FILE_SIZE) {
      const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
      throw new Error(
        `File too large (${sizeMB}MB). Maximum is 10MB.`
      );
    }
    return true;
  }, []);

  // ============================================
  // HANDLE FILE SELECTION
  // ============================================
  const handleFile = useCallback(
    async (file) => {
      setErrorMessage(null);
      setResultUrl(null);
      setActiveFilter(null);
      setAdjustments({ brightness: 1, contrast: 1, saturation: 1 });
      setAiInstruction("");

      try {
        validateFile(file);

        setImageState("processing");
        setIsProcessing(true);
        setProcessingMessage("Uploading image...");

        // Show local preview immediately
        const localUrl = URL.createObjectURL(file);
        setOriginalUrl(localUrl);

        // Upload to backend
        const response = await apiService.uploadImage(file);
        const data = response.data;

        if (!data.success) {
          throw new Error(data.error || "Upload failed.");
        }

        setSessionId(data.sessionId);
        setMetadata(data.metadata);
        setPreviewUrl(data.previewUrl);
        setImageState("loaded");
        setProcessingMessage("");
      } catch (err) {
        console.error("[ImageEditor] Upload error:", err);
        setImageState("error");
        setErrorMessage(err.message || "Failed to upload image.");
        // Revoke blob URL on error
        setOriginalUrl(null);
      } finally {
        setIsProcessing(false);
      }
    },
    [validateFile]
  );

  // ============================================
  // FILE INPUT HANDLER
  // ============================================
  const handleFileInput = useCallback(
    (e) => {
      const file = e.target.files?.[0];
      if (file) {
        handleFile(file);
      }
      // Reset input so the same file can be selected again
      e.target.value = "";
    },
    [handleFile]
  );

  // ============================================
  // DRAG AND DROP
  // ============================================
  const handleDrop = useCallback(
    (e) => {
      e.preventDefault();
      e.stopPropagation();
      setDragOver(false);

      const file = e.dataTransfer?.files?.[0];
      if (file) {
        handleFile(file);
      }
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
    async (filterId) => {
      if (!sessionId) return;

      setIsProcessing(true);
      setErrorMessage(null);
      setProcessingMessage(`Applying ${filterId} filter...`);
      setActiveFilter(filterId);

      try {
        const response = await apiService.applyFilter(sessionId, filterId);
        const data = response.data;

        if (!data.success) {
          throw new Error(data.error || "Filter failed.");
        }

        setResultUrl(data.resultUrl ? `${API_BASE}${data.resultUrl}` : null);
        setMetadata(data.metadata);
        setImageState("done");
      } catch (err) {
        console.error("[ImageEditor] Filter error:", err);
        setErrorMessage(err.message || "Filter application failed.");
        setActiveFilter(null);
      } finally {
        setIsProcessing(false);
        setProcessingMessage("");
      }
    },
    [sessionId, API_BASE]
  );

  // ============================================
  // APPLY ADJUSTMENTS
  // ============================================
  const applyAdjustments = useCallback(
    async (adj) => {
      if (!sessionId) return;

      setIsProcessing(true);
      setErrorMessage(null);
      setProcessingMessage("Applying adjustments...");

      try {
        const response = await apiService.applyAdjustments(sessionId, adj);
        const data = response.data;

        if (!data.success) {
          throw new Error(data.error || "Adjustments failed.");
        }

        setResultUrl(data.resultUrl ? `${API_BASE}${data.resultUrl}` : null);
        setMetadata(data.metadata);
        setImageState("done");
      } catch (err) {
        console.error("[ImageEditor] Adjust error:", err);
        setErrorMessage(err.message || "Adjustments failed.");
      } finally {
        setIsProcessing(false);
        setProcessingMessage("");
      }
    },
    [sessionId, API_BASE]
  );

  // ============================================
  // ADJUSTMENT HANDLER
  // ============================================
  const handleAdjustmentChange = useCallback(
    (key, value) => {
      const newAdjustments = {
        ...adjustments,
        [key]: parseFloat(value),
      };
      setAdjustments(newAdjustments);
      applyAdjustments(newAdjustments);
    },
    [adjustments, applyAdjustments]
  );

  // ============================================
  // QUICK ACTION HANDLER
  // ============================================
  const handleQuickAction = useCallback(
    async (actionId) => {
      if (!sessionId) return;

      setIsProcessing(true);
      setErrorMessage(null);

      try {
        let response;
        let data;

        switch (actionId) {
          case "enhance":
            setProcessingMessage("Enhancing image...");
            response = await apiService.enhanceImage(sessionId);
            break;
          case "upscale":
            setProcessingMessage("Upscaling image 2x...");
            response = await apiService.upscaleImage(sessionId, 2);
            break;
          case "removeBg":
            setProcessingMessage("Removing background...");
            response = await apiService.removeBackground(sessionId);
            break;
          case "bw_q":
            setProcessingMessage("Converting to B&W...");
            response = await apiService.applyFilter(sessionId, "bw");
            setActiveFilter("bw");
            break;
          case "warm_q":
            setProcessingMessage("Applying warm tone...");
            response = await apiService.applyFilter(sessionId, "warm");
            setActiveFilter("warm");
            break;
          case "vintage_q":
            setProcessingMessage("Applying vintage...");
            response = await apiService.applyFilter(sessionId, "vintage");
            setActiveFilter("vintage");
            break;
          default:
            throw new Error(`Unknown action: ${actionId}`);
        }

        data = response.data;

        if (!data.success) {
          throw new Error(data.error || `${actionId} failed.`);
        }

        setResultUrl(data.resultUrl ? `${API_BASE}${data.resultUrl}` : null);
        setMetadata(data.metadata);
        setImageState("done");
      } catch (err) {
        console.error(`[ImageEditor] ${actionId} error:`, err);
        setErrorMessage(err.message || `${actionId} failed.`);
      } finally {
        setIsProcessing(false);
        setProcessingMessage("");
      }
    },
    [sessionId, API_BASE]
  );

  // ============================================
  // AI EDIT
  // ============================================
  const handleAiEdit = useCallback(
    async (instruction) => {
      if (!sessionId || !instruction.trim()) return;

      setIsProcessing(true);
      setErrorMessage(null);
      setProcessingMessage(`AI editing: "${instruction}"...`);

      try {
        const response = await apiService.aiEditImage(
          sessionId,
          instruction.trim()
        );
        const data = response.data;

        if (!data.success) {
          throw new Error(data.error || "AI edit failed.");
        }

        setResultUrl(data.resultUrl ? `${API_BASE}${data.resultUrl}` : null);
        setMetadata(data.metadata);
        setImageState("done");
      } catch (err) {
        console.error("[ImageEditor] AI Edit error:", err);
        setErrorMessage(err.message || "AI edit failed.");
      } finally {
        setIsProcessing(false);
        setProcessingMessage("");
      }
    },
    [sessionId, API_BASE]
  );

  const handleAiEditSubmit = useCallback(
    (e) => {
      e.preventDefault();
      handleAiEdit(aiInstruction);
    },
    [aiInstruction, handleAiEdit]
  );

  // ============================================
  // RESET
  // ============================================
  const handleReset = useCallback(async () => {
    if (!sessionId) {
      // No session — just clear local state
      setOriginalUrl(null);
      setResultUrl(null);
      setPreviewUrl(null);
      setMetadata(null);
      setImageState("empty");
      setActiveFilter(null);
      setAdjustments({ brightness: 1, contrast: 1, saturation: 1 });
      setErrorMessage(null);
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);
    setProcessingMessage("Resetting...");

    try {
      const response = await apiService.resetImage(sessionId);
      const data = response.data;

      if (!data.success) {
        throw new Error(data.error || "Reset failed.");
      }

      setResultUrl(null);
      setPreviewUrl(data.previewUrl);
      setMetadata(data.metadata);
      setImageState("loaded");
      setActiveFilter(null);
      setAdjustments({ brightness: 1, contrast: 1, saturation: 1 });
    } catch (err) {
      console.error("[ImageEditor] Reset error:", err);
      setErrorMessage(err.message || "Reset failed.");
    } finally {
      setIsProcessing(false);
      setProcessingMessage("");
    }
  }, [sessionId]);

  // ============================================
  // NEW IMAGE
  // ============================================
  const handleNewImage = useCallback(() => {
    // Revoke old blob URL
    if (originalUrl && originalUrl.startsWith("blob:")) {
      URL.revokeObjectURL(originalUrl);
    }
    setOriginalUrl(null);
    setResultUrl(null);
    setPreviewUrl(null);
    setMetadata(null);
    setImageState("empty");
    setSessionId(null);
    setActiveFilter(null);
    setAdjustments({ brightness: 1, contrast: 1, saturation: 1 });
    setErrorMessage(null);
    setAiInstruction("");

    // Trigger file picker
    fileInputRef.current?.click();
  }, [originalUrl]);

  // ============================================
  // RENDER FILE SIZE
  // ============================================
  const formatFileSize = (bytes) => {
    if (!bytes) return "N/A";
    const mb = (bytes / (1024 * 1024)).toFixed(2);
    if (mb < 1) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${mb} MB`;
  };

  // ============================================
  // RENDER
  // ============================================

  const showUploadArea =
    imageState === "empty" || (imageState === "error" && !originalUrl);

  return (
    <div className="image-editor-container">
      <div className="image-editor-header">
        <h1>AI Image Editor</h1>
        <p className="subtitle">
          Upload, edit, and enhance your images with AI-powered tools
        </p>
      </div>

      {/* ============================================ */}
      {/* ERROR DISPLAY */}
      {/* ============================================ */}
      {errorMessage && (
        <div className="error-banner">
          <span className="error-icon">⚠️</span>
          <span>{errorMessage}</span>
          <button
            className="error-dismiss"
            onClick={() => setErrorMessage(null)}
          >
            ✕
          </button>
        </div>
      )}

      {/* ============================================ */}
      {/* PROCESSING OVERLAY */}
      {/* ============================================ */}
      {isProcessing && (
        <div className="processing-overlay">
          <div className="processing-spinner"></div>
          <p>{processingMessage || "Processing..."}</p>
        </div>
      )}

      {/* ============================================ */}
      {/* UPLOAD AREA */}
      {/* ============================================ */}
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
          <p className="upload-hint">
            Supports JPG, PNG, WebP (up to 10MB)
          </p>
        </div>
      )}

      {/* ============================================ */}
      {/* EDITOR — Visible when image is loaded */}
      {/* ============================================ */}
      {imageState !== "empty" && (
        <div className="editor-layout">
          {/* ========================================== */}
          {/* LEFT SIDEBAR — Tools */}
          {/* ========================================== */}
          <div className="editor-sidebar">
            {/* New Image Button */}
            <button className="new-image-btn" onClick={handleNewImage}>
              📁 New Image
            </button>

            {/* ============= FILTERS ============= */}
            <div className="tool-section">
              <h3>Filters</h3>
              <div className="filter-grid">
                {FILTERS.map((filter) => (
                  <button
                    key={filter.id}
                    className={`filter-btn ${
                      activeFilter === filter.id ? "active" : ""
                    }`}
                    onClick={() => applyFilter(filter.id)}
                    disabled={isProcessing}
                    title={filter.label}
                  >
                    <span className="filter-icon">{filter.icon}</span>
                    <span className="filter-label">{filter.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* ============= ADJUSTMENTS ============= */}
            <div className="tool-section">
              <h3>Adjustments</h3>

              <div className="adjustment-group">
                <label>
                  Brightness
                  <span className="adjust-value">
                    {adjustments.brightness.toFixed(1)}x
                  </span>
                </label>
                <input
                  type="range"
                  min="0.3"
                  max="2.0"
                  step="0.1"
                  value={adjustments.brightness}
                  onChange={(e) =>
                    handleAdjustmentChange("brightness", e.target.value)
                  }
                  disabled={isProcessing}
                />
              </div>

              <div className="adjustment-group">
                <label>
                  Contrast
                  <span className="adjust-value">
                    {adjustments.contrast.toFixed(1)}x
                  </span>
                </label>
                <input
                  type="range"
                  min="0.3"
                  max="2.5"
                  step="0.1"
                  value={adjustments.contrast}
                  onChange={(e) =>
                    handleAdjustmentChange("contrast", e.target.value)
                  }
                  disabled={isProcessing}
                />
              </div>

              <div className="adjustment-group">
                <label>
                  Saturation
                  <span className="adjust-value">
                    {adjustments.saturation.toFixed(1)}x
                  </span>
                </label>
                <input
                  type="range"
                  min="0.0"
                  max="3.0"
                  step="0.1"
                  value={adjustments.saturation}
                  onChange={(e) =>
                    handleAdjustmentChange("saturation", e.target.value)
                  }
                  disabled={isProcessing}
                />
              </div>
            </div>

            {/* ============= QUICK ACTIONS ============= */}
            <div className="tool-section">
              <h3>Quick Actions</h3>
              <div className="quick-actions-grid">
                {QUICK_ACTIONS.map((action) => (
                  <button
                    key={action.id}
                    className="quick-action-btn"
                    onClick={() => handleQuickAction(action.id)}
                    disabled={isProcessing}
                  >
                    <span className="action-icon">{action.icon}</span>
                    <span className="action-label">{action.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* ============= AI EDIT ============= */}
            <div className="tool-section">
              <h3>AI Edit</h3>
              <form onSubmit={handleAiEditSubmit} className="ai-edit-form">
                <input
                  type="text"
                  value={aiInstruction}
                  onChange={(e) => setAiInstruction(e.target.value)}
                  placeholder='e.g., "Make brighter", "B&W"'
                  disabled={isProcessing}
                  className="ai-input"
                />
                <button
                  type="submit"
                  className="ai-edit-btn"
                  disabled={isProcessing || !aiInstruction.trim()}
                >
                  Apply
                </button>
              </form>
            </div>

            {/* ============= RESET ============= */}
            <button
              className="reset-btn"
              onClick={handleReset}
              disabled={isProcessing}
            >
              🔄 Reset to Original
            </button>
          </div>

          {/* ========================================== */}
          {/* RIGHT PANEL — Preview */}
          {/* ========================================== */}
          <div className="editor-preview">
            {/* ORIGINAL IMAGE */}
            <div className="preview-section">
              <h3>Original Image</h3>
              <div className="image-frame">
                {originalUrl ? (
                  <img
                    src={
                      originalUrl.startsWith("blob:")
                        ? originalUrl
                        : originalUrl.startsWith("http")
                        ? originalUrl
                        : `${API_BASE}${originalUrl}`
                    }
                    alt="Original"
                    className="preview-image"
                  />
                ) : (
                  <div className="no-image-placeholder">
                    No image provided.
                  </div>
                )}
              </div>
              {metadata && (
                <div className="image-info">
                  <span className="info-badge">
                    {metadata.width} × {metadata.height}
                  </span>
                  <span className="info-badge">{metadata.format}</span>
                  {metadata.size && (
                    <span className="info-badge">
                      {formatFileSize(metadata.size)}
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* RESULT IMAGE */}
            <div className="preview-section">
              <h3>
                {resultUrl ? "Edited Result" : "Preview"}
                {resultUrl && (
                  <a
                    href={resultUrl}
                    download="edited-image.jpg"
                    className="download-link"
                  >
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
                      e.target.nextSibling.style.display = "flex";
                    }}
                  />
                ) : (
                  <div className="no-image-placeholder">
                    {imageState === "loaded"
                      ? "Apply a filter or adjustment to see the result"
                      : imageState === "processing"
                      ? "Processing..."
                      : "No result yet"}
                  </div>
                )}
                <div
                  className="no-image-placeholder"
                  style={{ display: "none" }}
                >
                  Failed to load result image
                </div>
              </div>
              {resultUrl && metadata && (
                <div className="image-info">
                  <span className="info-badge">
                    {metadata.width} × {metadata.height}
                  </span>
                  <span className="info-badge">
                    {metadata.format || "jpeg"}
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