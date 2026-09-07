// ============================================================
// AI IMAGE EDITOR — PRODUCTION v4.2
// ============================================================

import React, {
  useState,
  useRef,
  useCallback,
  useEffect,
} from "react";

import apiService from "../services/api";
import "./ImageEditor.css";

// ============================================
// DEBUG
// ============================================

const DEBUG_IMAGE_EDIT = true;

// ============================================
// FILTERS
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
  { id: "face-glow", label: "Face Glow", icon: "✨" },
  { id: "portrait-enhance", label: "Portrait Enhance", icon: "💎" },
];

// ============================================
// QUICK ACTIONS
// ============================================

const QUICK_ACTIONS = [
  { id: "enhance", label: "Enhance", icon: "✨" },
  { id: "upscale", label: "2x Upscale", icon: "🔍" },
  { id: "removeBg", label: "Remove BG", icon: "✂️" },
  { id: "bw_q", label: "B&W", icon: "⚫" },
  { id: "warm_q", label: "Warm", icon: "🔥" },
  { id: "vintage_q", label: "Vintage", icon: "📷" },
];

// ============================================
// AI SUGGESTIONS
// ============================================

const AI_SUGGESTIONS = [
  "background hata do",
  "HD kar do",
  "brightness badha do",
  "background white kar do",
  "vintage look do",
  "cinematic bana do",
];

// ============================================
// HAIRSTYLES
// ============================================

const HAIRSTYLES = [
  { id: "original", label: "Original", icon: "🧑" },
  { id: "short-hair", label: "Short Hair", icon: "💈" },
  { id: "side-part", label: "Side Part", icon: "💇" },
  { id: "classic", label: "Classic", icon: "🎩" },
  { id: "crew-cut", label: "Crew Cut", icon: "✂️" },
  { id: "textured", label: "Textured", icon: "🌾" },
  { id: "wavy", label: "Wavy", icon: "🌊" },
  { id: "curly", label: "Curly", icon: "🌀" },
  { id: "slick-back", label: "Slick Back", icon: "💼" },
  { id: "undercut", label: "Undercut", icon: "🪒" },
  { id: "fade", label: "Fade", icon: "🕶️" },
  { id: "fringe", label: "Fringe", icon: "💇" },
  { id: "buzz-cut", label: "Buzz Cut", icon: "🦲" },
  { id: "long-hair", label: "Long Hair", icon: "💁" },
  { id: "messy", label: "Messy Style", icon: "🌪️" },
];

// ============================================
// BACKGROUND BLUR
// ============================================

const BG_BLUR_LEVELS = ["low", "medium", "high"];

// ============================================
// FILE SETTINGS
// ============================================

const ALLOWED_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
];

const MAX_FILE_SIZE = 10 * 1024 * 1024;

// ============================================
// COMPONENT
// ============================================

function ImageEditor() {
  // ==========================================
  // IMAGE STATE
  // ==========================================

  const [originalUrl, setOriginalUrl] = useState(null);
  const [originalPath, setOriginalPath] = useState(null);
  const [currentPath, setCurrentPath] = useState(null);

  const [resultUrl, setResultUrl] = useState(null);
  const [resultLoadError, setResultLoadError] = useState(false);

  const [metadata, setMetadata] = useState(null);

  // ==========================================
  // EDIT STATE
  // ==========================================

  const [activeFilter, setActiveFilter] = useState(null);

  const [adjustments, setAdjustments] = useState({
    brightness: 1,
    contrast: 1,
    saturation: 1,
  });

  const [blurIntensity, setBlurIntensity] = useState("medium");

  const [aiInstruction, setAiInstruction] = useState("");

  // ==========================================
  // UI STATE
  // ==========================================

  const [imageState, setImageState] = useState("empty");

  const [isProcessing, setIsProcessing] = useState(false);

  const [errorMessage, setErrorMessage] = useState(null);

  const [successMessage, setSuccessMessage] = useState(null);

  const [dragOver, setDragOver] = useState(false);

  const [processingMessage, setProcessingMessage] = useState("");

  // ==========================================
  // REFS
  // ==========================================

  const fileInputRef = useRef(null);

  const adjustTimerRef = useRef(null);

  const currentPathRef = useRef(null);

  const blobUrlRef = useRef(null);

  const isProcessingRef = useRef(false);

  // ==========================================
  // KEEP REFS UPDATED
  // ==========================================

  useEffect(() => {
    currentPathRef.current = currentPath;
  }, [currentPath]);

  useEffect(() => {
    isProcessingRef.current = isProcessing;
  }, [isProcessing]);

  // ==========================================
  // CLEANUP
  // ==========================================

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

  // ==========================================
  // APPLY RESULT
  // ==========================================

  const applyResult = useCallback(
    (responseData, context = "operation") => {
      if (!responseData?.success) {
        throw new Error(
          responseData?.message || "Operation failed."
        );
      }

      const d = responseData.data || responseData;

      const filename = apiService.resolveImageFilename(d);

      if (DEBUG_IMAGE_EDIT) {
        console.log(
          `[IMAGE EDIT RESULT] (${context})`,
          {
            responseData,
            filename,
            preview: d.preview,
            resultUrl: d.resultUrl,
            path: d.path,
            finalPreviewUrl: filename
              ? apiService.buildPreviewUrl(filename)
              : null,
          }
        );
      }

      if (!filename) {
        throw new Error(
          "Backend ne valid image filename return nahi kiya. Deploy latest backend and retry."
        );
      }

      setCurrentPath(filename);

      setResultUrl(
        apiService.buildPreviewUrl(filename)
      );

      setResultLoadError(false);

      if (d.width && d.height) {
        setMetadata((prev) => ({
          ...(prev || {}),
          width: d.width,
          height: d.height,
          format:
            d.format ||
            prev?.format ||
            "jpeg",
        }));
      }

      setSuccessMessage(
        responseData.message || null
      );

      setImageState("loaded");
    },
    []
  );

  // ==========================================
  // COMMON OPERATION RUNNER
  // ==========================================

  const runOperation = useCallback(
    async (
      message,
      fn,
      context,
      onError
    ) => {
      if (isProcessingRef.current) {
        return;
      }

      setIsProcessing(true);
      setErrorMessage(null);
      setSuccessMessage(null);
      setProcessingMessage(message);

      try {
        const response = await fn();

        applyResult(
          response.data,
          context
        );
      } catch (err) {
        console.error(
          `[ImageEditor] ${context} error:`,
          err
        );

        setErrorMessage(
          err.message ||
            "Operation failed."
        );

        if (onError) {
          onError();
        }
      } finally {
        setIsProcessing(false);
        setProcessingMessage("");
      }
    },
    [applyResult]
  );

  // ==========================================
  // FILE VALIDATION
  // ==========================================

  const validateFile = useCallback(
    (file) => {
      if (!file) {
        throw new Error(
          "No file selected."
        );
      }

      if (
        !ALLOWED_TYPES.includes(
          file.type
        )
      ) {
        throw new Error(
          `Invalid file type: ${
            file.type || "unknown"
          }. Allowed: JPG, PNG, WebP.`
        );
      }

      if (
        file.size > MAX_FILE_SIZE
      ) {
        const sizeMB = (
          file.size /
          (1024 * 1024)
        ).toFixed(1);

        throw new Error(
          `File too large (${sizeMB}MB). Maximum is 10MB.`
        );
      }

      return true;
    },
    []
  );

  // ==========================================
  // UPLOAD IMAGE
  // ==========================================

  const handleFile = useCallback(
    async (file) => {
      if (
        isProcessingRef.current
      ) {
        return;
      }

      setErrorMessage(null);

      try {
        validateFile(file);
      } catch (err) {
        setErrorMessage(
          err.message
        );
        return;
      }

      setIsProcessing(true);

      setProcessingMessage(
        "Uploading image..."
      );

      setResultUrl(null);
      setResultLoadError(false);

      setSuccessMessage(null);

      setActiveFilter(null);

      setAdjustments({
        brightness: 1,
        contrast: 1,
        saturation: 1,
      });

      setAiInstruction("");

      if (blobUrlRef.current) {
        URL.revokeObjectURL(
          blobUrlRef.current
        );
      }

      const localUrl =
        URL.createObjectURL(file);

      blobUrlRef.current =
        localUrl;

      setOriginalUrl(localUrl);

      try {
        const response =
          await apiService.uploadImage(
            file
          );

        const responseData =
          response.data;

        if (
          !responseData.success
        ) {
          throw new Error(
            responseData.message ||
              "Upload failed."
          );
        }

        const d =
          responseData.data ||
          responseData;

        const filename =
          apiService.resolveImageFilename(
            d
          ) ||
          apiService.extractBasename(
            d.path
          );

        if (DEBUG_IMAGE_EDIT) {
          console.log(
            "[IMAGE EDIT RESULT] (upload)",
            {
              responseData,
              filename,
              finalPreviewUrl:
                filename
                  ? apiService.buildPreviewUrl(
                      filename
                    )
                  : null,
            }
          );
        }

        if (!filename) {
          throw new Error(
            "Upload succeeded but server returned no valid filename."
          );
        }

        setOriginalPath(
          filename
        );

        setCurrentPath(
          filename
        );

        setResultUrl(
          apiService.buildPreviewUrl(
            filename
          )
        );

        setResultLoadError(false);

        setMetadata({
          width: d.width,
          height: d.height,
          format: d.format,
          size: d.size,
        });

        setImageState(
          "loaded"
        );

        setSuccessMessage(
          "Image uploaded. Start editing!"
        );
      } catch (err) {
        console.error(
          "[ImageEditor] Upload error:",
          err
        );

        setImageState(
          "error"
        );

        setErrorMessage(
          err.message ||
            "Failed to upload image."
        );

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

  // ==========================================
  // FILE INPUT
  // ==========================================

  const handleFileInput =
    useCallback(
      (e) => {
        const file =
          e.target.files?.[0];

        if (file) {
          handleFile(file);
        }

        e.target.value = "";
      },
      [handleFile]
    );

  // ==========================================
  // DRAG & DROP
  // ==========================================

  const handleDrop =
    useCallback(
      (e) => {
        e.preventDefault();
        e.stopPropagation();

        setDragOver(false);

        const file =
          e.dataTransfer?.files?.[0];

        if (file) {
          handleFile(file);
        }
      },
      [handleFile]
    );

  const handleDragOver =
    useCallback((e) => {
      e.preventDefault();
      e.stopPropagation();
      setDragOver(true);
    }, []);

  const handleDragLeave =
    useCallback((e) => {
      e.preventDefault();
      e.stopPropagation();
      setDragOver(false);
    }, []);

  // ==========================================
  // APPLY FILTER
  // ==========================================

  const applyFilter =
    useCallback(
      (filterId) => {
        const path =
          currentPathRef.current;

        if (!path) {
          return;
        }

        runOperation(
          `Applying ${filterId} filter...`,
          () =>
            apiService.applyFilter(
              path,
              filterId
            ),
          `filter:${filterId}`,
          () =>
            setActiveFilter(null)
        );

        setActiveFilter(
          filterId
        );
      },
      [runOperation]
    );

  // ==========================================
  // APPLY ADJUSTMENTS
  // ==========================================

  const applyAdjustmentsNow =
    useCallback(
      (adj) => {
        const path =
          currentPathRef.current;

        if (!path) {
          return;
        }

        runOperation(
          "Applying adjustments...",
          () =>
            apiService.applyAdjustments(
              path,
              adj
            ),
          "adjust"
        );
      },
      [runOperation]
    );

  const handleAdjustmentChange =
    useCallback(
      (key, value) => {
        const newAdjustments = {
          ...adjustments,
          [key]: parseFloat(value),
        };

        setAdjustments(
          newAdjustments
        );

        if (
          adjustTimerRef.current
        ) {
          clearTimeout(
            adjustTimerRef.current
          );
        }

        adjustTimerRef.current =
          setTimeout(() => {
            applyAdjustmentsNow(
              newAdjustments
            );
          }, 600);
      },
      [
        adjustments,
        applyAdjustmentsNow,
      ]
    );

  // ==========================================
  // QUICK ACTIONS
  // ==========================================

  const handleQuickAction =
    useCallback(
      (actionId) => {
        const path =
          currentPathRef.current;

        if (!path) {
          return;
        }

        switch (actionId) {
          case "enhance":
            runOperation(
              "Enhancing image...",
              () =>
                apiService.enhanceImage(
                  path
                ),
              "enhance"
            );
            break;

          case "upscale":
            runOperation(
              "Upscaling image 2x...",
              () =>
                apiService.upscaleImage(
                  path,
                  2
                ),
              "upscale"
            );
            break;

          case "removeBg":
            runOperation(
              "Removing background...",
              () =>
                apiService.removeBackground(
                  path
                ),
              "removeBg"
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
            setErrorMessage(
              `Unknown action: ${actionId}`
            );
        }
      },
      [
        runOperation,
        applyFilter,
      ]
    );

  // ==========================================
  // BACKGROUND BLUR
  // ==========================================

  const handleBackgroundBlur =
    useCallback(
      (intensity) => {
        const path =
          currentPathRef.current;

        if (!path) {
          return;
        }

        setBlurIntensity(
          intensity
        );

        runOperation(
          `Blurring background (${intensity})...`,
          () =>
            apiService.backgroundBlur(
              path,
              intensity
            ),
          "bg-blur"
        );
      },
      [runOperation]
    );

  // ==========================================
  // RESET TO ORIGINAL
  //
  // IMPORTANT:
  // This is BEFORE handleHairstyle
  // ==========================================

  const handleReset =
    useCallback(() => {
      if (!originalPath) {
        return;
      }

      setCurrentPath(
        originalPath
      );

      setResultUrl(
        apiService.buildPreviewUrl(
          originalPath
        )
      );

      setResultLoadError(false);

      setActiveFilter(null);

      setAdjustments({
        brightness: 1,
        contrast: 1,
        saturation: 1,
      });

      setErrorMessage(null);

      setSuccessMessage(
        "Reset to original image."
      );
    }, [originalPath]);

  // ==========================================
  // HAIRSTYLE PREVIEW — AI
  // ==========================================

  const handleHairstyle =
    useCallback(
      (styleId) => {
        const path =
          currentPathRef.current;

        if (!path) {
          return;
        }

        // Original button
        if (
          styleId === "original"
        ) {
          handleReset();
          return;
        }

        runOperation(
          `Applying hairstyle: ${styleId}...`,
          () =>
            apiService.applyHairstyle(
              path,
              styleId
            ),
          "hairstyle"
        );
      },
      [
        runOperation,
        handleReset,
      ]
    );

  // ==========================================
  // AI EDIT
  // ==========================================

  const handleAiEdit =
    useCallback(
      (instruction) => {
        const path =
          currentPathRef.current;

        if (
          !path ||
          !instruction.trim()
        ) {
          return;
        }

        runOperation(
          `AI editing: "${instruction.trim()}"...`,
          () =>
            apiService.aiEditImage(
              path,
              instruction.trim()
            ),
          "ai-edit"
        );
      },
      [runOperation]
    );

  const handleAiEditSubmit =
    useCallback(
      (e) => {
        e.preventDefault();

        handleAiEdit(
          aiInstruction
        );
      },
      [
        aiInstruction,
        handleAiEdit,
      ]
    );

  // ==========================================
  // NEW IMAGE
  // ==========================================

  const handleNewImage =
    useCallback(() => {
      if (
        blobUrlRef.current
      ) {
        URL.revokeObjectURL(
          blobUrlRef.current
        );

        blobUrlRef.current =
          null;
      }

      setOriginalUrl(null);
      setResultUrl(null);
      setResultLoadError(false);

      setMetadata(null);

      setImageState("empty");

      setOriginalPath(null);
      setCurrentPath(null);

      setActiveFilter(null);

      setAdjustments({
        brightness: 1,
        contrast: 1,
        saturation: 1,
      });

      setErrorMessage(null);
      setSuccessMessage(null);

      setAiInstruction("");

      fileInputRef.current?.click();
    }, []);

  // ==========================================
  // DOWNLOAD
  // ==========================================

  const downloadFilename =
    currentPath || originalPath;

  const downloadHref =
    downloadFilename
      ? apiService.downloadUrl(
          downloadFilename
        )
      : null;

  // ==========================================
  // FILE SIZE
  // ==========================================

  const formatFileSize =
    (bytes) => {
      if (!bytes) {
        return "N/A";
      }

      const mb =
        bytes /
        (1024 * 1024);

      if (mb < 1) {
        return `${(
          bytes / 1024
        ).toFixed(1)} KB`;
      }

      return `${mb.toFixed(
        2
      )} MB`;
    };

  // ==========================================
  // UPLOAD AREA
  // ==========================================

  const showUploadArea =
    imageState === "empty" ||
    (
      imageState === "error" &&
      !originalUrl
    );

  // ==========================================
  // RENDER
  // ==========================================

  return (
    <div className="image-editor-container">

      {/* ======================================
          HEADER
      ====================================== */}

      <div className="image-editor-header">
        <h1>
          AI Image Editor
        </h1>

        <p className="subtitle">
          Upload, edit, and enhance
          your images with AI-powered
          tools — Hindi, Hinglish &
          English instructions supported
        </p>
      </div>

      {/* ======================================
          ERROR
      ====================================== */}

      {errorMessage && (
        <div className="error-banner">

          <span className="error-icon">
            ⚠️
          </span>

          <span>
            {errorMessage}
          </span>

          <button
            className="error-dismiss"
            onClick={() =>
              setErrorMessage(null)
            }
          >
            ✕
          </button>

        </div>
      )}

      {/* ======================================
          SUCCESS
      ====================================== */}

      {successMessage &&
        !errorMessage && (
          <div
            className="success-banner"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              background:
                "#f0fff4",
              border:
                "1px solid #9ae6b4",
              borderRadius: "8px",
              padding:
                "12px 16px",
              marginBottom:
                "20px",
              color:
                "#276749",
              fontSize:
                "0.9rem",
            }}
          >

            <span>✓</span>

            <span>
              {successMessage}
            </span>

            <button
              className="error-dismiss"
              style={{
                color:
                  "#276749",
              }}
              onClick={() =>
                setSuccessMessage(
                  null
                )
              }
            >
              ✕
            </button>

          </div>
        )}

      {/* ======================================
          PROCESSING
      ====================================== */}

      {isProcessing && (
        <div className="processing-overlay">

          <div className="processing-spinner" />

          <p>
            {processingMessage ||
              "Processing..."}
          </p>

        </div>
      )}

      {/* ======================================
          UPLOAD AREA
      ====================================== */}

      {showUploadArea && (
        <div
          className={`upload-area ${
            dragOver
              ? "drag-over"
              : ""
          }`}
          onDrop={handleDrop}
          onDragOver={
            handleDragOver
          }
          onDragLeave={
            handleDragLeave
          }
          onClick={() =>
            fileInputRef.current?.click()
          }
        >

          <input
            ref={fileInputRef}
            type="file"
            accept=".jpg,.jpeg,.png,.webp"
            onChange={
              handleFileInput
            }
            style={{
              display: "none",
            }}
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
              <line
                x1="12"
                y1="3"
                x2="12"
                y2="15"
              />
            </svg>

          </div>

          <h3>
            Drop your image here
          </h3>

          <p>
            or click to browse
          </p>

          <p className="upload-hint">
            Supports JPG, PNG, WebP
            (up to 10MB)
          </p>

        </div>
      )}

      {/* ======================================
          EDITOR
      ====================================== */}

      {imageState !== "empty" && (
        <div className="editor-layout">

          {/* ==================================
              LEFT SIDEBAR
          ================================== */}

          <div className="editor-sidebar">

            {/* NEW IMAGE */}

            <button
              className="new-image-btn"
              onClick={
                handleNewImage
              }
            >
              📁 New Image
            </button>

            {/* ==================================
                FILTERS
            ================================== */}

            <div className="tool-section">

              <h3>
                Filters
              </h3>

              <div className="filter-grid">

                {FILTERS.map(
                  (filter) => (
                    <button
                      key={
                        filter.id
                      }
                      className={`filter-btn ${
                        activeFilter ===
                        filter.id
                          ? "active"
                          : ""
                      }`}
                      onClick={() =>
                        applyFilter(
                          filter.id
                        )
                      }
                      disabled={
                        isProcessing ||
                        !currentPath
                      }
                      title={
                        filter.label
                      }
                    >

                      <span className="filter-icon">
                        {filter.icon}
                      </span>

                      <span className="filter-label">
                        {filter.label}
                      </span>

                    </button>
                  )
                )}

              </div>

            </div>

            {/* ==================================
                ADJUSTMENTS
            ================================== */}

            <div className="tool-section">

              <h3>
                Adjustments
              </h3>

              {/* BRIGHTNESS */}

              <div className="adjustment-group">

                <label>
                  Brightness

                  <span className="adjust-value">
                    {adjustments.brightness.toFixed(
                      1
                    )}
                    x
                  </span>
                </label>

                <input
                  type="range"
                  min="0.3"
                  max="2.0"
                  step="0.1"
                  value={
                    adjustments.brightness
                  }
                  onChange={(e) =>
                    handleAdjustmentChange(
                      "brightness",
                      e.target.value
                    )
                  }
                  disabled={
                    isProcessing ||
                    !currentPath
                  }
                />

              </div>

              {/* CONTRAST */}

              <div className="adjustment-group">

                <label>
                  Contrast

                  <span className="adjust-value">
                    {adjustments.contrast.toFixed(
                      1
                    )}
                    x
                  </span>
                </label>

                <input
                  type="range"
                  min="0.3"
                  max="2.5"
                  step="0.1"
                  value={
                    adjustments.contrast
                  }
                  onChange={(e) =>
                    handleAdjustmentChange(
                      "contrast",
                      e.target.value
                    )
                  }
                  disabled={
                    isProcessing ||
                    !currentPath
                  }
                />

              </div>

              {/* SATURATION */}

              <div className="adjustment-group">

                <label>
                  Saturation

                  <span className="adjust-value">
                    {adjustments.saturation.toFixed(
                      1
                    )}
                    x
                  </span>
                </label>

                <input
                  type="range"
                  min="0.0"
                  max="3.0"
                  step="0.1"
                  value={
                    adjustments.saturation
                  }
                  onChange={(e) =>
                    handleAdjustmentChange(
                      "saturation",
                      e.target.value
                    )
                  }
                  disabled={
                    isProcessing ||
                    !currentPath
                  }
                />

              </div>

            </div>

            {/* ==================================
                QUICK ACTIONS
            ================================== */}

            <div className="tool-section">

              <h3>
                Quick Actions
              </h3>

              <div className="quick-actions-grid">

                {QUICK_ACTIONS.map(
                  (action) => (
                    <button
                      key={
                        action.id
                      }
                      className="quick-action-btn"
                      onClick={() =>
                        handleQuickAction(
                          action.id
                        )
                      }
                      disabled={
                        isProcessing ||
                        !currentPath
                      }
                    >

                      <span className="action-icon">
                        {action.icon}
                      </span>

                      <span className="action-label">
                        {action.label}
                      </span>

                    </button>
                  )
                )}

              </div>

            </div>

            {/* ==================================
                BACKGROUND BLUR
            ================================== */}

            <div className="tool-section">

              <h3>
                Background Blur
              </h3>

              <div className="quick-actions-grid">

                {BG_BLUR_LEVELS.map(
                  (level) => (
                    <button
                      key={level}
                      className={`quick-action-btn ${
                        blurIntensity ===
                        level
                          ? "active"
                          : ""
                      }`}
                      onClick={() =>
                        handleBackgroundBlur(
                          level
                        )
                      }
                      disabled={
                        isProcessing ||
                        !currentPath
                      }
                    >

                      <span
                        className="action-label"
                        style={{
                          textTransform:
                            "capitalize",
                        }}
                      >
                        {level}
                      </span>

                    </button>
                  )
                )}

              </div>

            </div>

            {/* ==================================
                HAIRSTYLES — AI
            ================================== */}

            <div className="tool-section">

              <h3>
                Hairstyles (AI)
              </h3>

              <div className="filter-grid">

                {HAIRSTYLES.map(
                  (hs) => (
                    <button
                      key={hs.id}
                      className="filter-btn"
                      onClick={() =>
                        handleHairstyle(
                          hs.id
                        )
                      }
                      disabled={
                        isProcessing ||
                        !currentPath
                      }
                      title={
                        hs.label
                      }
                    >

                      <span className="filter-icon">
                        {hs.icon}
                      </span>

                      <span className="filter-label">
                        {hs.label}
                      </span>

                    </button>
                  )
                )}

              </div>

              <p
                style={{
                  fontSize:
                    "0.7rem",
                  color:
                    "#888",
                  marginTop:
                    "6px",
                }}
              >
                Hairstyle previews
                AI se generate hote
                hain. Backend me AI
                key/configuration
                available na hone par
                clear error milega.
              </p>

            </div>

            {/* ==================================
                AI EDIT
            ================================== */}

            <div className="tool-section">

              <h3>
                AI Edit (Hindi /
                English)
              </h3>

              <form
                onSubmit={
                  handleAiEditSubmit
                }
                className="ai-edit-form"
              >

                <input
                  type="text"
                  value={
                    aiInstruction
                  }
                  onChange={(e) =>
                    setAiInstruction(
                      e.target.value
                    )
                  }
                  placeholder='e.g., "background hata do aur HD kar do"'
                  disabled={
                    isProcessing ||
                    !currentPath
                  }
                  className="ai-input"
                />

                <button
                  type="submit"
                  className="ai-edit-btn"
                  disabled={
                    isProcessing ||
                    !aiInstruction.trim() ||
                    !currentPath
                  }
                >
                  Apply
                </button>

              </form>

              <div
                style={{
                  display:
                    "flex",
                  flexWrap:
                    "wrap",
                  gap: "6px",
                  marginTop:
                    "10px",
                }}
              >

                {AI_SUGGESTIONS.map(
                  (suggestion) => (
                    <button
                      key={
                        suggestion
                      }
                      type="button"
                      onClick={() =>
                        setAiInstruction(
                          suggestion
                        )
                      }
                      disabled={
                        isProcessing ||
                        !currentPath
                      }
                      style={{
                        fontSize:
                          "0.7rem",
                        padding:
                          "4px 8px",
                        borderRadius:
                          "12px",
                        border:
                          "1px solid #d0ccff",
                        background:
                          "#f5f3ff",
                        color:
                          "#5a52d5",
                        cursor:
                          "pointer",
                      }}
                    >
                      {suggestion}
                    </button>
                  )
                )}

              </div>

            </div>

            {/* ==================================
                RESET
            ================================== */}

            <button
              className="reset-btn"
              onClick={
                handleReset
              }
              disabled={
                isProcessing ||
                !originalPath
              }
            >
              🔄 Reset to Original
            </button>

          </div>

          {/* ==================================
              RIGHT PREVIEW
          ================================== */}

          <div className="editor-preview">

            {/* =================================
                ORIGINAL
            ================================= */}

            <div className="preview-section">

              <h3>
                Original Image
              </h3>

              <div className="image-frame">

                {originalUrl ? (
                  <img
                    src={originalUrl}
                    alt="Original"
                    className="preview-image"
                  />
                ) : (
                  <div className="no-image-placeholder">
                    No image uploaded.
                  </div>
                )}

              </div>

              {metadata && (
                <div className="image-info">

                  <span className="info-badge">
                    {metadata.width} ×{" "}
                    {metadata.height}
                  </span>

                  <span className="info-badge">
                    {metadata.format ||
                      "jpeg"}
                  </span>

                  {metadata.size && (
                    <span className="info-badge">
                      {formatFileSize(
                        metadata.size
                      )}
                    </span>
                  )}

                </div>
              )}

            </div>

            {/* =================================
                EDITED RESULT
            ================================= */}

            <div className="preview-section">

              <h3>

                {resultUrl
                  ? "Edited Result"
                  : "Preview"}

                {downloadHref && (
                  <a
                    href={
                      downloadHref
                    }
                    download
                    className="download-link"
                  >
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
                    onError={() =>
                      setResultLoadError(
                        true
                      )
                    }
                    onLoad={() =>
                      setResultLoadError(
                        false
                      )
                    }
                    style={{
                      display:
                        resultLoadError
                          ? "none"
                          : "block",
                    }}
                  />
                )}

                <div
                  className="no-image-placeholder"
                  style={{
                    display:
                      resultUrl &&
                      !resultLoadError
                        ? "none"
                        : "flex",
                  }}
                >

                  {resultUrl
                    ? resultLoadError
                      ? "Result image load nahi hui. Retry ya naya edit try karo."
                      : "Loading result..."
                    : "Apply a filter or adjustment to see the result"}

                </div>

              </div>

              {resultUrl &&
                !resultLoadError &&
                metadata && (
                  <div className="image-info">

                    <span className="info-badge">
                      {metadata.width} ×{" "}
                      {metadata.height}
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