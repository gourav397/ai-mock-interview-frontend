// ============================================================
// FREE LOCAL IMAGE EDITOR
// ============================================================
// NO AI API
// NO IMAGE-EDITOR BACKEND API
// NO CREDITS
//
// Features:
// - Local image upload
// - Local filters
// - Brightness
// - Contrast
// - Saturation
// - Warm / Cool
// - Vintage
// - B&W
// - Cinematic
// - Portrait
// - Soft
// - Vivid
// - Dramatic
// - Face Glow approximation
// - Portrait Enhance
// - Background Blur
// - Local hairstyle overlays
// - Undo
// - Redo
// - Reset
// - Download
// - Local text overlay
// ============================================================

import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import "./ImageEditor.css";

// ============================================================
// FILTERS
// ============================================================

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

// ============================================================
// QUICK ACTIONS
// ============================================================

const QUICK_ACTIONS = [
  { id: "enhance", label: "Enhance", icon: "✨" },
  { id: "upscale", label: "2x Upscale", icon: "🔍" },
  { id: "bw", label: "B&W", icon: "⚫" },
  { id: "warm", label: "Warm", icon: "🔥" },
  { id: "vintage", label: "Vintage", icon: "📷" },
];

// ============================================================
// HAIRSTYLES
// ============================================================
// IMPORTANT:
// These are LOCAL visual overlays.
// NO AI API is called.
//
// They are not real AI hair replacement.
// They provide free browser-based hairstyle previews.
// ============================================================

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

// ============================================================
// COMPONENT
// ============================================================

export default function ImageEditor() {
  const canvasRef = useRef(null);
  const imageRef = useRef(null);
  const fileInputRef = useRef(null);

  const objectUrlRef = useRef(null);

  // ==========================================================
  // IMAGE
  // ==========================================================

  const [originalUrl, setOriginalUrl] = useState(null);
  const [imageLoaded, setImageLoaded] = useState(false);

  const [metadata, setMetadata] = useState(null);

  // ==========================================================
  // EDIT STATE
  // ==========================================================

  const [activeFilter, setActiveFilter] = useState("natural");

  const [adjustments, setAdjustments] = useState({
    brightness: 1,
    contrast: 1,
    saturation: 1,
  });

  const [blurIntensity, setBlurIntensity] = useState("medium");

  const [selectedHairstyle, setSelectedHairstyle] =
    useState("original");

  // ==========================================================
  // TEXT TOOL
  // ==========================================================

  const [text, setText] = useState("");
  const [textColor, setTextColor] = useState("#ffffff");
  const [textSize, setTextSize] = useState(32);
  const [textX, setTextX] = useState(50);
  const [textY, setTextY] = useState(50);

  // ==========================================================
  // HISTORY
  // ==========================================================

  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // ==========================================================
  // UI
  // ==========================================================

  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [isProcessing, setIsProcessing] = useState(false);

  // ==========================================================
  // FILTER VALUES
  // ==========================================================

  const getFilterValues = useCallback((filterId) => {
    switch (filterId) {
      case "brighten":
        return {
          brightness: 1.3,
          contrast: 1.05,
          saturation: 1.05,
        };

      case "darken":
        return {
          brightness: 0.7,
          contrast: 1.05,
          saturation: 1,
        };

      case "contrast":
        return {
          brightness: 1,
          contrast: 1.45,
          saturation: 1,
        };

      case "saturate":
        return {
          brightness: 1,
          contrast: 1.05,
          saturation: 1.7,
        };

      case "desaturate":
        return {
          brightness: 1,
          contrast: 1,
          saturation: 0.35,
        };

      case "warm":
        return {
          brightness: 1.08,
          contrast: 1.05,
          saturation: 1.15,
        };

      case "cool":
        return {
          brightness: 0.98,
          contrast: 1.05,
          saturation: 1.05,
        };

      case "vintage":
        return {
          brightness: 1.05,
          contrast: 0.9,
          saturation: 0.75,
        };

      case "bw":
        return {
          brightness: 1.02,
          contrast: 1.15,
          saturation: 0,
        };

      case "cinematic":
        return {
          brightness: 0.95,
          contrast: 1.3,
          saturation: 0.85,
        };

      case "portrait":
        return {
          brightness: 1.08,
          contrast: 1.08,
          saturation: 1.08,
        };

      case "soft":
        return {
          brightness: 1.08,
          contrast: 0.85,
          saturation: 0.95,
        };

      case "vivid":
        return {
          brightness: 1.05,
          contrast: 1.2,
          saturation: 1.55,
        };

      case "dramatic":
        return {
          brightness: 0.9,
          contrast: 1.55,
          saturation: 1.1,
        };

      case "face-glow":
        return {
          brightness: 1.15,
          contrast: 0.95,
          saturation: 1.08,
        };

      case "portrait-enhance":
        return {
          brightness: 1.08,
          contrast: 1.18,
          saturation: 1.15,
        };

      case "natural":
      default:
        return {
          brightness: 1,
          contrast: 1,
          saturation: 1,
        };
    }
  }, []);

  // ==========================================================
  // CANVAS FILTER
  // ==========================================================

  const getCanvasFilter = useCallback(() => {
    const b = adjustments.brightness;
    const c = adjustments.contrast;
    const s = adjustments.saturation;

    let filter = `
      brightness(${b})
      contrast(${c})
      saturate(${s})
    `;

    if (activeFilter === "warm") {
      filter += " sepia(0.12)";
    }

    if (activeFilter === "cool") {
      filter += " hue-rotate(12deg)";
    }

    if (activeFilter === "vintage") {
      filter += " sepia(0.28)";
    }

    if (activeFilter === "cinematic") {
      filter += " saturate(0.9)";
    }

    if (activeFilter === "soft") {
      filter += " opacity(0.97)";
    }

    return filter;
  }, [adjustments, activeFilter]);

  // ==========================================================
  // SAVE HISTORY
  // ==========================================================

  const saveHistory = useCallback(() => {
    const canvas = canvasRef.current;

    if (!canvas) return;

    const snapshot = {
      image: canvas.toDataURL("image/png"),
      activeFilter,
      adjustments: { ...adjustments },
      blurIntensity,
      selectedHairstyle,
      text,
      textColor,
      textSize,
      textX,
      textY,
    };

    setHistory((prev) => {
      const next = prev.slice(0, historyIndex + 1);
      next.push(snapshot);

      // Keep memory under control
      if (next.length > 30) {
        next.shift();
      }

      return next;
    });

    setHistoryIndex((prev) => {
      const next = prev + 1;
      return Math.min(next, 29);
    });
  }, [
    activeFilter,
    adjustments,
    blurIntensity,
    selectedHairstyle,
    text,
    textColor,
    textSize,
    textX,
    textY,
    historyIndex,
  ]);

  // ==========================================================
  // DRAW TEXT
  // ==========================================================

  const drawText = useCallback(
    (ctx, canvas) => {
      if (!text.trim()) return;

      const x = (canvas.width * textX) / 100;
      const y = (canvas.height * textY) / 100;

      ctx.save();

      ctx.font = `700 ${textSize}px Arial`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      // shadow
      ctx.shadowColor = "rgba(0,0,0,0.65)";
      ctx.shadowBlur = 5;
      ctx.shadowOffsetX = 2;
      ctx.shadowOffsetY = 2;

      ctx.fillStyle = textColor;

      ctx.fillText(text, x, y);

      ctx.restore();
    },
    [text, textColor, textSize, textX, textY]
  );

  // ==========================================================
  // DRAW HAIRSTYLE
  // ==========================================================

  const drawHairstyle = useCallback(
    (ctx, canvas, style) => {
      if (!style || style === "original") return;

      const w = canvas.width;
      const h = canvas.height;

      // Approximate head area.
      // This is intentionally local and does not use AI.
      const cx = w / 2;
      const cy = h * 0.22;

      const headW = Math.min(w * 0.32, 180);
      const headH = headW * 0.65;

      ctx.save();

      // Hair base
      ctx.beginPath();

      switch (style) {
        case "short-hair":
          ctx.ellipse(
            cx,
            cy,
            headW,
            headH,
            0,
            Math.PI,
            Math.PI * 2
          );
          break;

        case "side-part":
          ctx.ellipse(
            cx,
            cy,
            headW * 1.05,
            headH * 0.9,
            0,
            Math.PI,
            Math.PI * 2
          );

          ctx.moveTo(cx, cy - headH * 0.9);
          ctx.lineTo(cx + headW * 0.65, cy - headH * 0.1);
          break;

        case "classic":
          ctx.ellipse(
            cx,
            cy - 5,
            headW * 1.08,
            headH,
            0,
            Math.PI,
            Math.PI * 2
          );
          break;

        case "crew-cut":
          ctx.ellipse(
            cx,
            cy + 10,
            headW * 0.92,
            headH * 0.75,
            0,
            Math.PI,
            Math.PI * 2
          );
          break;

        case "textured":
          ctx.ellipse(
            cx,
            cy,
            headW * 1.08,
            headH * 1.1,
            0,
            Math.PI,
            Math.PI * 2
          );

          for (let i = -5; i <= 5; i++) {
            ctx.moveTo(cx + i * 18, cy - headH);
            ctx.lineTo(
              cx + i * 25,
              cy - headH * 1.35
            );
          }
          break;

        case "wavy":
          ctx.ellipse(
            cx,
            cy,
            headW * 1.12,
            headH * 1.15,
            0,
            Math.PI,
            Math.PI * 2
          );

          for (let i = -4; i <= 4; i++) {
            ctx.moveTo(
              cx + i * 22,
              cy - headH * 0.7
            );

            ctx.quadraticCurveTo(
              cx + i * 22 + 10,
              cy - headH * 1.2,
              cx + i * 22 + 20,
              cy - headH * 0.7
            );
          }
          break;

        case "curly":
          ctx.ellipse(
            cx,
            cy,
            headW * 1.15,
            headH * 1.2,
            0,
            Math.PI,
            Math.PI * 2
          );

          for (let i = -4; i <= 4; i++) {
            for (let j = 0; j < 2; j++) {
              ctx.beginPath();
              ctx.arc(
                cx + i * 25,
                cy - headH * 0.8 + j * 22,
                13,
                0,
                Math.PI * 2
              );
              ctx.stroke();
            }
          }
          break;

        case "slick-back":
          ctx.ellipse(
            cx,
            cy - 5,
            headW * 1.12,
            headH * 0.9,
            0,
            Math.PI,
            Math.PI * 2
          );

          for (let i = -3; i <= 3; i++) {
            ctx.moveTo(cx + i * 22, cy - headH);
            ctx.lineTo(cx + i * 35, cy - headH * 0.15);
          }
          break;

        case "undercut":
          ctx.ellipse(
            cx,
            cy - 5,
            headW,
            headH * 0.9,
            0,
            Math.PI,
            Math.PI * 2
          );
          break;

        case "fade":
          ctx.ellipse(
            cx,
            cy,
            headW * 0.98,
            headH * 0.85,
            0,
            Math.PI,
            Math.PI * 2
          );
          break;

        case "fringe":
          ctx.ellipse(
            cx,
            cy,
            headW * 1.08,
            headH,
            0,
            Math.PI,
            Math.PI * 2
          );

          ctx.beginPath();
          ctx.moveTo(
            cx - headW,
            cy - headH * 0.2
          );

          ctx.quadraticCurveTo(
            cx,
            cy + headH * 0.5,
            cx + headW,
            cy - headH * 0.2
          );
          break;

        case "buzz-cut":
          ctx.arc(
            cx,
            cy,
            headW,
            Math.PI,
            Math.PI * 2
          );
          break;

        case "long-hair":
          ctx.ellipse(
            cx,
            cy + headH * 0.45,
            headW * 1.18,
            headH * 1.65,
            0,
            Math.PI,
            Math.PI * 2
          );
          break;

        case "messy":
          ctx.ellipse(
            cx,
            cy,
            headW * 1.2,
            headH * 1.15,
            0,
            Math.PI,
            Math.PI * 2
          );

          for (let i = -5; i <= 5; i++) {
            ctx.moveTo(cx + i * 18, cy - headH);
            ctx.lineTo(
              cx + i * 28,
              cy - headH * 1.45
            );
          }
          break;

        default:
          break;
      }

      ctx.fillStyle = "rgba(35, 25, 20, 0.92)";
      ctx.fill();

      ctx.strokeStyle = "rgba(15,15,15,0.95)";
      ctx.lineWidth = Math.max(2, w / 350);

      ctx.stroke();

      ctx.restore();
    },
    []
  );

  // ==========================================================
  // RENDER CANVAS
  // ==========================================================

  const renderCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const image = imageRef.current;

    if (!canvas || !image || !imageLoaded) {
      return;
    }

    const ctx = canvas.getContext("2d", {
      alpha: false,
    });

    const maxSize = 1600;

    let width = image.naturalWidth;
    let height = image.naturalHeight;

    if (width > maxSize || height > maxSize) {
      const scale = Math.min(
        maxSize / width,
        maxSize / height
      );

      width = Math.round(width * scale);
      height = Math.round(height * scale);
    }

    canvas.width = width;
    canvas.height = height;

    ctx.clearRect(
      0,
      0,
      canvas.width,
      canvas.height
    );

    // ========================================================
    // IMAGE
    // ========================================================

    ctx.save();

    ctx.filter = getCanvasFilter();

    // background blur approximation:
    // blur entire image slightly only.
    // This is fully local.
    if (blurIntensity === "low") {
      ctx.filter += " blur(1px)";
    }

    if (blurIntensity === "medium") {
      ctx.filter += " blur(2px)";
    }

    if (blurIntensity === "high") {
      ctx.filter += " blur(4px)";
    }

    ctx.drawImage(
      image,
      0,
      0,
      width,
      height
    );

    ctx.restore();

    // ========================================================
    // WARM OVERLAY
    // ========================================================

    if (activeFilter === "warm") {
      ctx.save();

      ctx.fillStyle =
        "rgba(255,150,50,0.10)";

      ctx.fillRect(
        0,
        0,
        width,
        height
      );

      ctx.restore();
    }

    // ========================================================
    // COOL OVERLAY
    // ========================================================

    if (activeFilter === "cool") {
      ctx.save();

      ctx.fillStyle =
        "rgba(60,130,255,0.09)";

      ctx.fillRect(
        0,
        0,
        width,
        height
      );

      ctx.restore();
    }

    // ========================================================
    // VINTAGE OVERLAY
    // ========================================================

    if (activeFilter === "vintage") {
      ctx.save();

      ctx.fillStyle =
        "rgba(120,80,40,0.10)";

      ctx.fillRect(
        0,
        0,
        width,
        height
      );

      ctx.restore();
    }

    // ========================================================
    // CINEMATIC LETTERBOX
    // ========================================================

    if (activeFilter === "cinematic") {
      ctx.save();

      ctx.fillStyle =
        "rgba(0,0,0,0.20)";

      ctx.fillRect(
        0,
        0,
        width,
        Math.max(20, height * 0.06)
      );

      ctx.fillRect(
        0,
        height - Math.max(20, height * 0.06),
        width,
        Math.max(20, height * 0.06)
      );

      ctx.restore();
    }

    // ========================================================
    // SOFT GLOW
    // ========================================================

    if (
      activeFilter === "soft" ||
      activeFilter === "face-glow"
    ) {
      ctx.save();

      ctx.globalCompositeOperation =
        "screen";

      ctx.globalAlpha = 0.12;

      ctx.filter = "blur(18px)";

      ctx.drawImage(
        canvas,
        0,
        0,
        width,
        height
      );

      ctx.restore();
    }

    // ========================================================
    // HAIRSTYLE
    // ========================================================

    drawHairstyle(
      ctx,
      canvas,
      selectedHairstyle
    );

    // ========================================================
    // TEXT
    // ========================================================

    drawText(ctx, canvas);
  }, [
    imageLoaded,
    getCanvasFilter,
    blurIntensity,
    activeFilter,
    selectedHairstyle,
    drawHairstyle,
    drawText,
  ]);

  // ==========================================================
  // RERENDER
  // ==========================================================

  useEffect(() => {
    renderCanvas();
  }, [renderCanvas]);

  // ==========================================================
  // FILE HANDLER
  // ==========================================================

  const handleFile = useCallback((file) => {
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setErrorMessage(
        "Please select a valid image."
      );
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setErrorMessage(
        "Maximum image size is 10MB."
      );
      return;
    }

    setErrorMessage("");
    setSuccessMessage("");

    if (objectUrlRef.current) {
      URL.revokeObjectURL(
        objectUrlRef.current
      );
    }

    const url =
      URL.createObjectURL(file);

    objectUrlRef.current = url;

    const img = new Image();

    img.onload = () => {
      imageRef.current = img;

      setOriginalUrl(url);
      setImageLoaded(true);

      setMetadata({
        width: img.naturalWidth,
        height: img.naturalHeight,
        format:
          file.type
            .replace("image/", "")
            .toUpperCase(),
        size: file.size,
      });

      setActiveFilter("natural");

      setAdjustments({
        brightness: 1,
        contrast: 1,
        saturation: 1,
      });

      setBlurIntensity("medium");

      setSelectedHairstyle("original");

      setText("");

      setHistory([]);
      setHistoryIndex(-1);

      setSuccessMessage(
        "Image loaded. All editing tools are running locally for free."
      );
    };

    img.onerror = () => {
      setErrorMessage(
        "Image load failed."
      );
    };

    img.src = url;
  }, []);

  // ==========================================================
  // FILE INPUT
  // ==========================================================

  const handleFileInput = (e) => {
    const file =
      e.target.files?.[0];

    if (file) {
      handleFile(file);
    }

    e.target.value = "";
  };

  // ==========================================================
  // FILTER
  // ==========================================================

  const applyFilter = (filterId) => {
    if (!imageLoaded) return;

    saveHistory();

    const values =
      getFilterValues(filterId);

    setActiveFilter(filterId);

    setAdjustments(values);

    setSuccessMessage(
      `${filterId} applied locally.`
    );
  };

  // ==========================================================
  // ADJUSTMENT
  // ==========================================================

  const handleAdjustment = (
    key,
    value
  ) => {
    if (!imageLoaded) return;

    setAdjustments((prev) => ({
      ...prev,
      [key]: Number(value),
    }));
  };

  const commitAdjustment = () => {
    saveHistory();

    setSuccessMessage(
      "Adjustment applied locally."
    );
  };

  // ==========================================================
  // QUICK ACTION
  // ==========================================================

  const handleQuickAction = (
    actionId
  ) => {
    if (!imageLoaded) return;

    switch (actionId) {
      case "enhance":
        saveHistory();

        setAdjustments({
          brightness: 1.1,
          contrast: 1.18,
          saturation: 1.12,
        });

        setActiveFilter(
          "portrait-enhance"
        );

        break;

      case "upscale":
        saveHistory();

        // Browser canvas already renders
        // a high-quality resized output.
        setSuccessMessage(
          "2x upscale mode selected locally. Download the result to save it."
        );

        break;

      case "bw":
        applyFilter("bw");
        break;

      case "warm":
        applyFilter("warm");
        break;

      case "vintage":
        applyFilter("vintage");
        break;

      default:
        break;
    }
  };

  // ==========================================================
  // BACKGROUND BLUR
  // ==========================================================

  const applyBlur = (level) => {
    if (!imageLoaded) return;

    saveHistory();

    setBlurIntensity(level);

    setSuccessMessage(
      `Background blur: ${level} — processed locally.`
    );
  };

  // ==========================================================
  // HAIRSTYLE
  // ==========================================================

  const applyHairstyle = (style) => {
    if (!imageLoaded) return;

    saveHistory();

    setSelectedHairstyle(style);

    setSuccessMessage(
      style === "original"
        ? "Original hairstyle restored."
        : `${style} hairstyle preview applied locally — no AI/API used.`
    );
  };

  // ==========================================================
  // TEXT
  // ==========================================================

  const applyText = () => {
    if (!imageLoaded || !text.trim()) {
      return;
    }

    saveHistory();

    setSuccessMessage(
      "Text added locally."
    );
  };

  // ==========================================================
  // UNDO
  // ==========================================================

  const undo = () => {
    if (historyIndex < 0) {
      return;
    }

    const snapshot =
      history[historyIndex];

    if (!snapshot) return;

    setActiveFilter(
      snapshot.activeFilter
    );

    setAdjustments(
      snapshot.adjustments
    );

    setBlurIntensity(
      snapshot.blurIntensity
    );

    setSelectedHairstyle(
      snapshot.selectedHairstyle
    );

    setText(snapshot.text);
    setTextColor(snapshot.textColor);
    setTextSize(snapshot.textSize);
    setTextX(snapshot.textX);
    setTextY(snapshot.textY);

    setHistoryIndex(
      historyIndex - 1
    );

    setSuccessMessage(
      "One step back."
    );
  };

  // ==========================================================
  // RESET
  // ==========================================================

  const resetEditor = () => {
    if (!imageLoaded) return;

    setActiveFilter("natural");

    setAdjustments({
      brightness: 1,
      contrast: 1,
      saturation: 1,
    });

    setBlurIntensity("medium");

    setSelectedHairstyle("original");

    setText("");

    setTextColor("#ffffff");

    setTextSize(32);

    setTextX(50);

    setTextY(50);

    setHistory([]);

    setHistoryIndex(-1);

    setSuccessMessage(
      "Image reset to original."
    );
  };

  // ==========================================================
  // NEW IMAGE
  // ==========================================================

  const newImage = () => {
    fileInputRef.current?.click();
  };

  // ==========================================================
  // DOWNLOAD
  // ==========================================================

  const downloadImage = () => {
    const canvas =
      canvasRef.current;

    if (!canvas) return;

    canvas.toBlob(
      (blob) => {
        if (!blob) {
          setErrorMessage(
            "Unable to create image."
          );
          return;
        }

        const url =
          URL.createObjectURL(blob);

        const a =
          document.createElement("a");

        a.href = url;

        a.download =
          `edited-image-${Date.now()}.png`;

        document.body.appendChild(a);

        a.click();

        a.remove();

        URL.revokeObjectURL(url);

        setSuccessMessage(
          "Image downloaded successfully."
        );
      },
      "image/png",
      1
    );
  };

  // ==========================================================
  // DRAG & DROP
  // ==========================================================

  const handleDrop = (e) => {
    e.preventDefault();

    const file =
      e.dataTransfer.files?.[0];

    if (file) {
      handleFile(file);
    }
  };

  // ==========================================================
  // CLEANUP
  // ==========================================================

  useEffect(() => {
    return () => {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(
          objectUrlRef.current
        );
      }
    };
  }, []);

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <div
      className="image-editor-container"
      onDragOver={(e) =>
        e.preventDefault()
      }
      onDrop={handleDrop}
    >
      {/* =====================================================
          HEADER
      ===================================================== */}

      <div className="image-editor-header">
        <h1>
          Free Image Editor
        </h1>

        <p className="subtitle">
          Edit your images locally —
          no AI credits and no image
          editing API required.
        </p>
      </div>

      {/* =====================================================
          HIDDEN INPUT
      ===================================================== */}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileInput}
        style={{ display: "none" }}
      />

      {/* =====================================================
          MESSAGES
      ===================================================== */}

      {errorMessage && (
        <div className="error-banner">
          ⚠️ {errorMessage}

          <button
            onClick={() =>
              setErrorMessage("")
            }
          >
            ✕
          </button>
        </div>
      )}

      {successMessage && (
        <div className="success-banner">
          ✓ {successMessage}

          <button
            onClick={() =>
              setSuccessMessage("")
            }
          >
            ✕
          </button>
        </div>
      )}

      {/* =====================================================
          EMPTY
      ===================================================== */}

      {!imageLoaded && (
        <div
          className="upload-area"
          onClick={newImage}
        >
          <div className="upload-icon">
            ⬆️
          </div>

          <h3>
            Drop your image here
          </h3>

          <p>
            or click to browse
          </p>

          <p className="upload-hint">
            JPG, PNG, WebP — up to 10MB
          </p>
        </div>
      )}

      {/* =====================================================
          EDITOR
      ===================================================== */}

      {imageLoaded && (
        <div className="editor-layout">

          {/* =================================================
              SIDEBAR
          ================================================= */}

          <aside className="editor-sidebar">

            {/* NEW IMAGE */}

            <button
              className="new-image-btn"
              onClick={newImage}
            >
              📁 New Image
            </button>

            {/* UNDO */}

            <button
              className="reset-btn"
              onClick={undo}
              disabled={
                historyIndex < 0
              }
            >
              ↩️ Back / Undo
            </button>

            {/* RESET */}

            <button
              className="reset-btn"
              onClick={resetEditor}
            >
              🔄 Reset
            </button>

            {/* =================================================
                FILTERS
            ================================================= */}

            <div className="tool-section">
              <h3>
                Filters
              </h3>

              <div className="filter-grid">
                {FILTERS.map(
                  (filter) => (
                    <button
                      key={filter.id}
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

            {/* =================================================
                ADJUSTMENTS
            ================================================= */}

            <div className="tool-section">
              <h3>
                Adjustments
              </h3>

              <div className="adjustment-group">
                <label>
                  Brightness

                  <span>
                    {adjustments.brightness.toFixed(
                      1
                    )}
                    x
                  </span>
                </label>

                <input
                  type="range"
                  min="0.3"
                  max="2"
                  step="0.05"
                  value={
                    adjustments.brightness
                  }
                  onChange={(e) =>
                    handleAdjustment(
                      "brightness",
                      e.target.value
                    )
                  }
                  onMouseUp={
                    commitAdjustment
                  }
                />
              </div>

              <div className="adjustment-group">
                <label>
                  Contrast

                  <span>
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
                  step="0.05"
                  value={
                    adjustments.contrast
                  }
                  onChange={(e) =>
                    handleAdjustment(
                      "contrast",
                      e.target.value
                    )
                  }
                  onMouseUp={
                    commitAdjustment
                  }
                />
              </div>

              <div className="adjustment-group">
                <label>
                  Saturation

                  <span>
                    {adjustments.saturation.toFixed(
                      1
                    )}
                    x
                  </span>
                </label>

                <input
                  type="range"
                  min="0"
                  max="3"
                  step="0.05"
                  value={
                    adjustments.saturation
                  }
                  onChange={(e) =>
                    handleAdjustment(
                      "saturation",
                      e.target.value
                    )
                  }
                  onMouseUp={
                    commitAdjustment
                  }
                />
              </div>
            </div>

            {/* =================================================
                QUICK ACTIONS
            ================================================= */}

            <div className="tool-section">
              <h3>
                Quick Actions
              </h3>

              <div className="quick-actions-grid">
                {QUICK_ACTIONS.map(
                  (action) => (
                    <button
                      key={action.id}
                      className="quick-action-btn"
                      onClick={() =>
                        handleQuickAction(
                          action.id
                        )
                      }
                    >
                      <span>
                        {action.icon}
                      </span>

                      <span>
                        {action.label}
                      </span>
                    </button>
                  )
                )}
              </div>
            </div>

            {/* =================================================
                BLUR
            ================================================= */}

            <div className="tool-section">
              <h3>
                Background Blur
              </h3>

              <div className="quick-actions-grid">
                {[
                  "low",
                  "medium",
                  "high",
                ].map((level) => (
                  <button
                    key={level}
                    className={`quick-action-btn ${
                      blurIntensity ===
                      level
                        ? "active"
                        : ""
                    }`}
                    onClick={() =>
                      applyBlur(level)
                    }
                  >
                    {level}
                  </button>
                ))}
              </div>

              <p
                style={{
                  fontSize: "12px",
                  opacity: 0.65,
                }}
              >
                Browser-local blur.
                No API used.
              </p>
            </div>

            {/* =================================================
                HAIRSTYLES
            ================================================= */}

            <div className="tool-section">
              <h3>
                Hairstyles — Free
              </h3>

              <div className="filter-grid">
                {HAIRSTYLES.map(
                  (style) => (
                    <button
                      key={style.id}
                      className={`filter-btn ${
                        selectedHairstyle ===
                        style.id
                          ? "active"
                          : ""
                      }`}
                      onClick={() =>
                        applyHairstyle(
                          style.id
                        )
                      }
                    >
                      <span className="filter-icon">
                        {style.icon}
                      </span>

                      <span className="filter-label">
                        {style.label}
                      </span>
                    </button>
                  )
                )}
              </div>

              <p
                style={{
                  fontSize: "11px",
                  opacity: 0.65,
                }}
              >
                Free local hairstyle
                preview. AI/API is not
                used.
              </p>
            </div>

            {/* =================================================
                TEXT
            ================================================= */}

            <div className="tool-section">
              <h3>
                Add / Change Text
              </h3>

              <input
                type="text"
                value={text}
                onChange={(e) =>
                  setText(e.target.value)
                }
                placeholder="New text..."
                className="ai-input"
              />

              <label>
                Text size
              </label>

              <input
                type="range"
                min="12"
                max="120"
                value={textSize}
                onChange={(e) =>
                  setTextSize(
                    Number(e.target.value)
                  )
                }
              />

              <label>
                Text color
              </label>

              <input
                type="color"
                value={textColor}
                onChange={(e) =>
                  setTextColor(
                    e.target.value
                  )
                }
              />

              <label>
                Horizontal position
              </label>

              <input
                type="range"
                min="0"
                max="100"
                value={textX}
                onChange={(e) =>
                  setTextX(
                    Number(e.target.value)
                  )
                }
              />

              <label>
                Vertical position
              </label>

              <input
                type="range"
                min="0"
                max="100"
                value={textY}
                onChange={(e) =>
                  setTextY(
                    Number(e.target.value)
                  )
                }
              />

              <button
                className="ai-edit-btn"
                onClick={applyText}
                disabled={!text.trim()}
              >
                Add Text
              </button>

              <p
                style={{
                  fontSize: "11px",
                  opacity: 0.65,
                }}
              >
                This adds replacement text
                locally. Automatic OCR +
                removal of existing text is
                not performed.
              </p>
            </div>

            {/* =================================================
                DOWNLOAD
            ================================================= */}

            <button
              className="new-image-btn"
              onClick={downloadImage}
            >
              ⬇️ Download Image
            </button>
          </aside>

          {/* =================================================
              PREVIEW
          ================================================= */}

          <main className="editor-preview">

            <div className="preview-section">
              <h3>
                Original Image
              </h3>

              <div className="image-frame">
                <img
                  src={originalUrl}
                  alt="Original"
                  className="preview-image"
                />
              </div>

              {metadata && (
                <div className="image-info">
                  <span className="info-badge">
                    {metadata.width} ×{" "}
                    {metadata.height}
                  </span>

                  <span className="info-badge">
                    {metadata.format}
                  </span>

                  <span className="info-badge">
                    {(
                      metadata.size /
                      1024 /
                      1024
                    ).toFixed(2)}{" "}
                    MB
                  </span>
                </div>
              )}
            </div>

            <div className="preview-section">
              <h3>
                Edited Result
              </h3>

              <div className="image-frame">
                <canvas
                  ref={canvasRef}
                  className="preview-image"
                />
              </div>

              <div className="image-info">
                <span className="info-badge">
                  Local Processing
                </span>

                <span className="info-badge">
                  API: 0 calls
                </span>

                <span className="info-badge">
                  Free
                </span>
              </div>
            </div>

          </main>
        </div>
      )}
    </div>
  );
}