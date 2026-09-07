// ============================================================
// IMAGE EDITOR — FREE / LOCAL VERSION
// ============================================================
// ✅ No OpenAI API for normal editing
// ✅ No Gemini API for filters
// ✅ Canvas-based local processing
// ✅ Filters
// ✅ Brightness / Contrast / Saturation
// ✅ Background blur approximation
// ✅ 8 free hairstyle effects
// ✅ Local text overlay / replacement workflow
// ✅ Download edited image locally
//
// IMPORTANT:
// Real AI hairstyle generation / perfect background removal /
// automatic text reconstruction require an AI model.
// This version intentionally does NOT fake those features.
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
// FREE HAIRSTYLES
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
];

// ============================================================
// BLUR
// ============================================================

const BG_BLUR_LEVELS = [
  { id: "low", label: "Low" },
  { id: "medium", label: "Medium" },
  { id: "high", label: "High" },
];

// ============================================================
// FILE
// ============================================================

const ALLOWED_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
];

const MAX_FILE_SIZE = 10 * 1024 * 1024;

// ============================================================
// HELPERS
// ============================================================

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();

    img.onload = () => resolve(img);
    img.onerror = () =>
      reject(new Error("Image load failed."));

    img.src = src;
  });
}

function createCanvas(width, height) {
  const canvas = document.createElement("canvas");

  canvas.width = Math.max(1, Math.round(width));
  canvas.height = Math.max(1, Math.round(height));

  return canvas;
}

function canvasToUrl(canvas, type = "image/png", quality = 0.95) {
  return canvas.toDataURL(type, quality);
}

// ============================================================
// FILTER DEFINITIONS
// ============================================================

function getFilterSettings(filterId) {
  switch (filterId) {
    case "brighten":
      return {
        brightness: 1.25,
        contrast: 1,
        saturation: 1,
      };

    case "darken":
      return {
        brightness: 0.78,
        contrast: 1,
        saturation: 1,
      };

    case "contrast":
      return {
        brightness: 1,
        contrast: 1.35,
        saturation: 1,
      };

    case "saturate":
      return {
        brightness: 1,
        contrast: 1,
        saturation: 1.5,
      };

    case "desaturate":
      return {
        brightness: 1,
        contrast: 1,
        saturation: 0.35,
      };

    case "warm":
      return {
        brightness: 1.05,
        contrast: 1.05,
        saturation: 1.12,
        temperature: 18,
      };

    case "cool":
      return {
        brightness: 1,
        contrast: 1.05,
        saturation: 1.05,
        temperature: -18,
      };

    case "vintage":
      return {
        brightness: 1.05,
        contrast: 0.9,
        saturation: 0.72,
        sepia: 0.28,
      };

    case "bw":
      return {
        brightness: 1.03,
        contrast: 1.12,
        saturation: 0,
      };

    case "cinematic":
      return {
        brightness: 0.98,
        contrast: 1.28,
        saturation: 0.88,
        temperature: -3,
      };

    case "portrait":
      return {
        brightness: 1.08,
        contrast: 1.05,
        saturation: 1.08,
        soft: true,
      };

    case "soft":
      return {
        brightness: 1.08,
        contrast: 0.88,
        saturation: 0.95,
        soft: true,
      };

    case "vivid":
      return {
        brightness: 1.05,
        contrast: 1.15,
        saturation: 1.65,
      };

    case "dramatic":
      return {
        brightness: 0.92,
        contrast: 1.5,
        saturation: 1.08,
      };

    case "face-glow":
      return {
        brightness: 1.15,
        contrast: 0.94,
        saturation: 1.08,
        soft: true,
      };

    case "portrait-enhance":
      return {
        brightness: 1.08,
        contrast: 1.18,
        saturation: 1.15,
        soft: true,
      };

    case "natural":
    default:
      return {
        brightness: 1,
        contrast: 1,
        saturation: 1,
      };
  }
}

// ============================================================
// IMAGE PROCESSOR
// ============================================================

function processCanvas(sourceCanvas, settings = {}) {
  const width = sourceCanvas.width;
  const height = sourceCanvas.height;

  const output = createCanvas(width, height);
  const ctx = output.getContext("2d", {
    willReadFrequently: true,
  });

  const {
    brightness = 1,
    contrast = 1,
    saturation = 1,
    temperature = 0,
    sepia = 0,
    soft = false,
  } = settings;

  ctx.save();

  const cssFilters = [
    `brightness(${brightness})`,
    `contrast(${contrast})`,
    `saturate(${saturation})`,
    sepia > 0 ? `sepia(${sepia})` : "",
  ]
    .filter(Boolean)
    .join(" ");

  ctx.filter = cssFilters;

  ctx.drawImage(
    sourceCanvas,
    0,
    0,
    width,
    height
  );

  ctx.restore();

  // ----------------------------------------------------------
  // Temperature adjustment
  // ----------------------------------------------------------

  if (temperature !== 0) {
    const imageData = ctx.getImageData(
      0,
      0,
      width,
      height
    );

    const data = imageData.data;

    for (let i = 0; i < data.length; i += 4) {
      const amount = temperature;

      data[i] = clamp(
        data[i] + amount,
        0,
        255
      );

      data[i + 2] = clamp(
        data[i + 2] - amount,
        0,
        255
      );
    }

    ctx.putImageData(
      imageData,
      0,
      0
    );
  }

  // ----------------------------------------------------------
  // Soft glow
  // ----------------------------------------------------------

  if (soft) {
    const glow = createCanvas(
      width,
      height
    );

    const glowCtx = glow.getContext("2d");

    glowCtx.filter =
      "blur(8px) brightness(1.08)";

    glowCtx.globalAlpha = 0.12;

    glowCtx.drawImage(
      output,
      0,
      0,
      width,
      height
    );

    ctx.drawImage(
      glow,
      0,
      0,
      width,
      height
    );
  }

  return output;
}

// ============================================================
// BACKGROUND BLUR
// ============================================================
//
// This is a FREE local approximation.
// It blurs the outer/edge region rather than performing
// AI-level human segmentation.
// ============================================================

function applyLocalBackgroundBlur(
  sourceCanvas,
  intensity
) {
  const width = sourceCanvas.width;
  const height = sourceCanvas.height;

  const output = createCanvas(
    width,
    height
  );

  const ctx = output.getContext("2d");

  const blurAmount =
    intensity === "high"
      ? 18
      : intensity === "low"
      ? 7
      : 12;

  // Blurred copy
  ctx.save();

  ctx.filter = `blur(${blurAmount}px)`;

  ctx.drawImage(
    sourceCanvas,
    0,
    0,
    width,
    height
  );

  ctx.restore();

  // Center sharp region.
  // This gives a portrait-style local blur.
  const mask = createCanvas(
    width,
    height
  );

  const maskCtx = mask.getContext("2d");

  const gradient =
    maskCtx.createRadialGradient(
      width * 0.5,
      height * 0.43,
      Math.min(width, height) * 0.12,
      width * 0.5,
      height * 0.45,
      Math.min(width, height) * 0.42
    );

  gradient.addColorStop(
    0,
    "rgba(0,0,0,1)"
  );

  gradient.addColorStop(
    0.65,
    "rgba(0,0,0,0.95)"
  );

  gradient.addColorStop(
    1,
    "rgba(0,0,0,0)"
  );

  maskCtx.fillStyle = gradient;

  maskCtx.fillRect(
    0,
    0,
    width,
    height
  );

  const original =
    createCanvas(width, height);

  original
    .getContext("2d")
    .drawImage(
      sourceCanvas,
      0,
      0,
      width,
      height
    );

  const originalData =
    original
      .getContext("2d")
      .getImageData(
        0,
        0,
        width,
        height
      );

  const blurredData =
    output
      .getContext("2d")
      .getImageData(
        0,
        0,
        width,
        height
      );

  const maskData =
    maskCtx.getImageData(
      0,
      0,
      width,
      height
    );

  for (
    let i = 0;
    i < originalData.data.length;
    i += 4
  ) {
    const alpha =
      maskData.data[i] / 255;

    blurredData.data[i] =
      originalData.data[i] * alpha +
      blurredData.data[i] * (1 - alpha);

    blurredData.data[i + 1] =
      originalData.data[i + 1] * alpha +
      blurredData.data[i + 1] * (1 - alpha);

    blurredData.data[i + 2] =
      originalData.data[i + 2] * alpha +
      blurredData.data[i + 2] * (1 - alpha);

    blurredData.data[i + 3] = 255;
  }

  const finalCanvas =
    createCanvas(width, height);

  finalCanvas
    .getContext("2d")
    .putImageData(
      blurredData,
      0,
      0
    );

  return finalCanvas;
}

// ============================================================
// LOCAL UPSCALE
// ============================================================

function upscaleCanvas(sourceCanvas, scale = 2) {
  const output = createCanvas(
    sourceCanvas.width * scale,
    sourceCanvas.height * scale
  );

  const ctx = output.getContext("2d");

  ctx.imageSmoothingEnabled = true;

  ctx.imageSmoothingQuality =
    "high";

  ctx.drawImage(
    sourceCanvas,
    0,
    0,
    output.width,
    output.height
  );

  return output;
}

// ============================================================
// LOCAL ENHANCE
// ============================================================

function enhanceCanvas(sourceCanvas) {
  return processCanvas(
    sourceCanvas,
    {
      brightness: 1.08,
      contrast: 1.12,
      saturation: 1.12,
      soft: true,
    }
  );
}

// ============================================================
// HAIRSTYLE LOCAL EFFECT
// ============================================================
//
// These are decorative/local overlays.
// They are NOT AI hair replacement.
// ============================================================

function applyHairstyleCanvas(
  sourceCanvas,
  styleId
) {
  if (styleId === "original") {
    return sourceCanvas;
  }

  const output = createCanvas(
    sourceCanvas.width,
    sourceCanvas.height
  );

  const ctx = output.getContext("2d");

  ctx.drawImage(
    sourceCanvas,
    0,
    0
  );

  const w = output.width;
  const h = output.height;

  // Approximate head region.
  const cx = w * 0.5;
  const cy = h * 0.29;

  const rx = w * 0.18;
  const ry = h * 0.14;

  ctx.save();

  ctx.fillStyle =
    "rgba(35,25,20,0.82)";

  ctx.strokeStyle =
    "rgba(20,15,12,0.95)";

  ctx.lineWidth =
    Math.max(2, w * 0.006);

  // ----------------------------------------------------------
  // Base hair shape
  // ----------------------------------------------------------

  ctx.beginPath();

  ctx.ellipse(
    cx,
    cy,
    rx,
    ry,
    0,
    Math.PI,
    Math.PI * 2
  );

  ctx.fill();

  // ----------------------------------------------------------
  // Style-specific changes
  // ----------------------------------------------------------

  if (styleId === "short-hair") {
    for (let i = -5; i <= 5; i++) {
      ctx.beginPath();

      ctx.moveTo(
        cx + i * rx * 0.17,
        cy - ry * 0.8
      );

      ctx.lineTo(
        cx + i * rx * 0.19,
        cy - ry * 1.08
      );

      ctx.stroke();
    }
  }

  if (styleId === "side-part") {
    ctx.lineWidth =
      Math.max(3, w * 0.008);

    ctx.beginPath();

    ctx.moveTo(
      cx - rx * 0.05,
      cy - ry
    );

    ctx.quadraticCurveTo(
      cx + rx * 0.25,
      cy - ry * 0.3,
      cx + rx * 0.75,
      cy - ry * 0.15
    );

    ctx.stroke();
  }

  if (styleId === "classic") {
    ctx.beginPath();

    ctx.ellipse(
      cx,
      cy - ry * 0.25,
      rx * 1.12,
      ry * 0.9,
      0,
      Math.PI,
      Math.PI * 2
    );

    ctx.fill();
  }

  if (styleId === "crew-cut") {
    ctx.beginPath();

    ctx.ellipse(
      cx,
      cy,
      rx * 0.92,
      ry * 0.75,
      0,
      Math.PI,
      Math.PI * 2
    );

    ctx.fill();
  }

  if (styleId === "textured") {
    for (let i = 0; i < 22; i++) {
      const x =
        cx - rx +
        Math.random() * rx * 2;

      const y =
        cy - Math.random() * ry;

      ctx.beginPath();

      ctx.moveTo(x, y);

      ctx.lineTo(
        x + (Math.random() - 0.5) * rx * 0.5,
        y - ry * 0.35
      );

      ctx.stroke();
    }
  }

  if (styleId === "wavy") {
    ctx.lineWidth =
      Math.max(2, w * 0.005);

    for (let i = -2; i <= 2; i++) {
      ctx.beginPath();

      ctx.moveTo(
        cx + i * rx * 0.35,
        cy
      );

      ctx.quadraticCurveTo(
        cx + i * rx * 0.35 + rx * 0.18,
        cy - ry * 0.6,
        cx + i * rx * 0.35,
        cy - ry
      );

      ctx.stroke();
    }
  }

  if (styleId === "curly") {
    ctx.lineWidth =
      Math.max(2, w * 0.005);

    for (let i = 0; i < 14; i++) {
      const angle =
        Math.random() *
        Math.PI *
        2;

      const x =
        cx +
        Math.cos(angle) *
          rx *
          (0.3 + Math.random() * 0.7);

      const y =
        cy -
        Math.random() *
          ry *
          0.9;

      ctx.beginPath();

      ctx.arc(
        x,
        y,
        Math.max(4, w * 0.012),
        0,
        Math.PI * 2
      );

      ctx.stroke();
    }
  }

  ctx.restore();

  return output;
}

// ============================================================
// TEXT OVERLAY
// ============================================================

function addTextToCanvas(
  sourceCanvas,
  text,
  options = {}
) {
  const output = createCanvas(
    sourceCanvas.width,
    sourceCanvas.height
  );

  const ctx = output.getContext("2d");

  ctx.drawImage(
    sourceCanvas,
    0,
    0
  );

  const {
    x = 0.5,
    y = 0.5,
    fontSize = 48,
    color = "#ffffff",
    background = "transparent",
    align = "center",
  } = options;

  const pxFontSize = Math.max(
    12,
    Math.round(
      Math.min(
        sourceCanvas.width,
        sourceCanvas.height
      ) *
        (fontSize / 1000)
    )
  );

  ctx.save();

  ctx.font = `700 ${pxFontSize}px Arial, sans-serif`;

  ctx.textAlign = align;

  ctx.textBaseline =
    "middle";

  const textWidth =
    ctx.measureText(text).width;

  if (
    background !==
    "transparent"
  ) {
    const padding =
      pxFontSize * 0.35;

    ctx.fillStyle =
      background;

    ctx.fillRect(
      sourceCanvas.width * x -
        textWidth / 2 -
        padding,
      sourceCanvas.height * y -
        pxFontSize / 2 -
        padding / 2,
      textWidth +
        padding * 2,
      pxFontSize +
        padding
    );
  }

  ctx.fillStyle = color;

  ctx.fillText(
    text,
    sourceCanvas.width * x,
    sourceCanvas.height * y
  );

  ctx.restore();

  return output;
}

// ============================================================
// COMPONENT
// ============================================================

function ImageEditor() {
  // ----------------------------------------------------------
  // SOURCE
  // ----------------------------------------------------------

  const [originalUrl, setOriginalUrl] =
    useState(null);

  const [originalCanvas, setOriginalCanvas] =
    useState(null);

  const [currentCanvas, setCurrentCanvas] =
    useState(null);

  // ----------------------------------------------------------
  // UI
  // ----------------------------------------------------------

  const [imageState, setImageState] =
    useState("empty");

  const [isProcessing, setIsProcessing] =
    useState(false);

  const [processingMessage, setProcessingMessage] =
    useState("");

  const [errorMessage, setErrorMessage] =
    useState(null);

  const [successMessage, setSuccessMessage] =
    useState(null);

  const [activeFilter, setActiveFilter] =
    useState(null);

  const [blurIntensity, setBlurIntensity] =
    useState("medium");

  const [adjustments, setAdjustments] =
    useState({
      brightness: 1,
      contrast: 1,
      saturation: 1,
    });

  const [metadata, setMetadata] =
    useState(null);

  // ----------------------------------------------------------
  // TEXT
  // ----------------------------------------------------------

  const [textValue, setTextValue] =
    useState("");

  const [textColor, setTextColor] =
    useState("#ffffff");

  const [textBackground, setTextBackground] =
    useState("transparent");

  const [textX, setTextX] =
    useState(50);

  const [textY, setTextY] =
    useState(50);

  const [textSize, setTextSize] =
    useState(48);

  // ----------------------------------------------------------
  // REFS
  // ----------------------------------------------------------

  const fileInputRef =
    useRef(null);

  const blobUrlRef =
    useRef(null);

  // ==========================================================
  // CLEANUP
  // ==========================================================

  useEffect(() => {
    return () => {
      if (blobUrlRef.current) {
        URL.revokeObjectURL(
          blobUrlRef.current
        );
      }
    };
  }, []);

  // ==========================================================
  // PROCESS WRAPPER
  // ==========================================================

  const runLocalOperation =
    useCallback(
      async (
        message,
        operation
      ) => {
        if (!currentCanvas) {
          setErrorMessage(
            "Pehle image upload karo."
          );

          return;
        }

        if (isProcessing) {
          return;
        }

        setIsProcessing(true);
        setProcessingMessage(
          message
        );
        setErrorMessage(null);
        setSuccessMessage(null);

        try {
          await new Promise(
            (resolve) =>
              requestAnimationFrame(
                resolve
              )
          );

          const result =
            await operation(
              currentCanvas
            );

          if (!result) {
            throw new Error(
              "Local image processing failed."
            );
          }

          setCurrentCanvas(
            result
          );

          setSuccessMessage(
            "Done — image locally processed. No AI API used."
          );
        } catch (error) {
          console.error(
            "[LOCAL IMAGE EDIT]",
            error
          );

          setErrorMessage(
            error?.message ||
              "Image processing failed."
          );
        } finally {
          setIsProcessing(false);
          setProcessingMessage("");
        }
      },
      [
        currentCanvas,
        isProcessing,
      ]
    );

  // ==========================================================
  // VALIDATE FILE
  // ==========================================================

  const validateFile =
    useCallback(
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
            "Only JPG, PNG and WebP images are supported."
          );
        }

        if (
          file.size >
          MAX_FILE_SIZE
        ) {
          throw new Error(
            "Maximum image size is 10MB."
          );
        }
      },
      []
    );

  // ==========================================================
  // UPLOAD
  // ==========================================================

  const handleFile =
    useCallback(
      async (file) => {
        try {
          validateFile(file);

          setErrorMessage(null);
          setSuccessMessage(null);
          setIsProcessing(true);
          setProcessingMessage(
            "Loading image locally..."
          );

          if (
            blobUrlRef.current
          ) {
            URL.revokeObjectURL(
              blobUrlRef.current
            );
          }

          const url =
            URL.createObjectURL(
              file
            );

          blobUrlRef.current =
            url;

          const img =
            await loadImage(
              url
            );

          const canvas =
            createCanvas(
              img.naturalWidth ||
                img.width,
              img.naturalHeight ||
                img.height
            );

          const ctx =
            canvas.getContext(
              "2d"
            );

          ctx.drawImage(
            img,
            0,
            0,
            canvas.width,
            canvas.height
          );

          setOriginalUrl(
            url
          );

          setOriginalCanvas(
            canvas
          );

          setCurrentCanvas(
            canvas
          );

          setMetadata({
            width:
              canvas.width,
            height:
              canvas.height,
            format:
              file.type
                .split("/")
                .pop()
                ?.toUpperCase(),
            size:
              file.size,
          });

          setImageState(
            "loaded"
          );

          setActiveFilter(
            null
          );

          setAdjustments({
            brightness: 1,
            contrast: 1,
            saturation: 1,
          });

          setSuccessMessage(
            "Image loaded locally. Editing is free."
          );
        } catch (error) {
          console.error(
            "[LOCAL UPLOAD]",
            error
          );

          setErrorMessage(
            error?.message ||
              "Could not load image."
          );

          setImageState(
            "error"
          );
        } finally {
          setIsProcessing(false);
          setProcessingMessage("");
        }
      },
      [validateFile]
    );

  // ==========================================================
  // INPUT
  // ==========================================================

  const handleFileInput =
    useCallback(
      (event) => {
        const file =
          event.target.files?.[0];

        if (file) {
          handleFile(file);
        }

        event.target.value =
          "";
      },
      [handleFile]
    );

  // ==========================================================
  // DRAG DROP
  // ==========================================================

  const handleDrop =
    useCallback(
      (event) => {
        event.preventDefault();
        event.stopPropagation();

        const file =
          event.dataTransfer
            ?.files?.[0];

        if (file) {
          handleFile(file);
        }
      },
      [handleFile]
    );

  const handleDragOver =
    useCallback(
      (event) => {
        event.preventDefault();
      },
      []
    );

  // ==========================================================
  // FILTER
  // ==========================================================

  const applyFilter =
    useCallback(
      (filterId) => {
        const settings =
          getFilterSettings(
            filterId
          );

        runLocalOperation(
          `Applying ${filterId} locally...`,
          (canvas) =>
            processCanvas(
              canvas,
              settings
            )
        );

        setActiveFilter(
          filterId
        );
      },
      [runLocalOperation]
    );

  // ==========================================================
  // ADJUSTMENTS
  // ==========================================================

  const applyAdjustments =
    useCallback(
      (newAdjustments) => {
        if (!originalCanvas) {
          return;
        }

        setIsProcessing(true);
        setProcessingMessage(
          "Applying adjustments locally..."
        );

        setTimeout(() => {
          try {
            const result =
              processCanvas(
                originalCanvas,
                newAdjustments
              );

            setCurrentCanvas(
              result
            );

            setSuccessMessage(
              "Adjustments applied locally."
            );
          } catch (error) {
            setErrorMessage(
              error.message
            );
          } finally {
            setIsProcessing(
              false
            );
            setProcessingMessage(
              ""
            );
          }
        }, 0);
      },
      [originalCanvas]
    );

  const handleAdjustmentChange =
    useCallback(
      (key, value) => {
        const next = {
          ...adjustments,
          [key]: Number(value),
        };

        setAdjustments(
          next
        );

        applyAdjustments(
          next
        );
      },
      [
        adjustments,
        applyAdjustments,
      ]
    );

  // ==========================================================
  // QUICK ACTION
  // ==========================================================

  const handleQuickAction =
    useCallback(
      (actionId) => {
        switch (actionId) {
          case "enhance":
            runLocalOperation(
              "Enhancing locally...",
              (canvas) =>
                enhanceCanvas(
                  canvas
                )
            );
            break;

          case "upscale":
            runLocalOperation(
              "Upscaling locally...",
              (canvas) =>
                upscaleCanvas(
                  canvas,
                  2
                )
            );
            break;

          case "bw":
            applyFilter("bw");
            break;

          case "warm":
            applyFilter("warm");
            break;

          case "vintage":
            applyFilter(
              "vintage"
            );
            break;

          default:
            break;
        }
      },
      [
        runLocalOperation,
        applyFilter,
      ]
    );

  // ==========================================================
  // BACKGROUND BLUR
  // ==========================================================

  const handleBackgroundBlur =
    useCallback(
      (level) => {
        setBlurIntensity(
          level
        );

        runLocalOperation(
          `Applying ${level} background blur locally...`,
          (canvas) =>
            applyLocalBackgroundBlur(
              canvas,
              level
            )
        );
      },
      [runLocalOperation]
    );

  // ==========================================================
  // HAIRSTYLE
  // ==========================================================

  const handleHairstyle =
    useCallback(
      (styleId) => {
        if (
          styleId ===
          "original"
        ) {
          if (
            originalCanvas
          ) {
            setCurrentCanvas(
              originalCanvas
            );

            setSuccessMessage(
              "Original restored."
            );
          }

          return;
        }

        runLocalOperation(
          `Applying ${styleId} local hairstyle effect...`,
          (canvas) =>
            applyHairstyleCanvas(
              canvas,
              styleId
            )
        );
      },
      [
        originalCanvas,
        runLocalOperation,
      ]
    );

  // ==========================================================
  // ADD / CHANGE TEXT
  // ==========================================================

  const handleAddText =
    useCallback(() => {
      if (
        !textValue.trim()
      ) {
        setErrorMessage(
          "Text enter karo."
        );

        return;
      }

      runLocalOperation(
        "Adding text locally...",
        (canvas) =>
          addTextToCanvas(
            canvas,
            textValue.trim(),
            {
              x: textX / 100,
              y: textY / 100,
              fontSize:
                textSize,
              color:
                textColor,
              background:
                textBackground,
            }
          )
      );
    },
    [
      textValue,
      textX,
      textY,
      textSize,
      textColor,
      textBackground,
      runLocalOperation,
    ]);

  // ==========================================================
  // RESET
  // ==========================================================

  const handleReset =
    useCallback(() => {
      if (
        !originalCanvas
      ) {
        return;
      }

      setCurrentCanvas(
        originalCanvas
      );

      setActiveFilter(
        null
      );

      setBlurIntensity(
        "medium"
      );

      setAdjustments({
        brightness: 1,
        contrast: 1,
        saturation: 1,
      });

      setSuccessMessage(
        "Reset to original."
      );

      setErrorMessage(
        null
      );
    }, [originalCanvas]);

  // ==========================================================
  // NEW IMAGE
  // ==========================================================

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

      setOriginalUrl(
        null
      );

      setOriginalCanvas(
        null
      );

      setCurrentCanvas(
        null
      );

      setMetadata(
        null
      );

      setImageState(
        "empty"
      );

      setErrorMessage(
        null
      );

      setSuccessMessage(
        null
      );

      fileInputRef.current?.click();
    }, []);

  // ==========================================================
  // PREVIEW URL
  // ==========================================================

  const currentPreviewUrl =
    currentCanvas
      ? canvasToUrl(
          currentCanvas,
          "image/png"
        )
      : null;

  // ==========================================================
  // DOWNLOAD
  // ==========================================================

  const handleDownload =
    useCallback(() => {
      if (!currentCanvas) {
        return;
      }

      const link =
        document.createElement(
          "a"
        );

      link.href =
        canvasToUrl(
          currentCanvas,
          "image/png"
        );

      link.download =
        `edited-image-${Date.now()}.png`;

      document.body.appendChild(
        link
      );

      link.click();

      link.remove();

      setSuccessMessage(
        "Edited image downloaded."
      );
    }, [currentCanvas]);

  // ==========================================================
  // FORMAT SIZE
  // ==========================================================

  const formatFileSize =
    (bytes) => {
      if (!bytes) {
        return "N/A";
      }

      if (
        bytes <
        1024 * 1024
      ) {
        return `${(
          bytes / 1024
        ).toFixed(1)} KB`;
      }

      return `${(
        bytes /
        (1024 * 1024)
      ).toFixed(2)} MB`;
    };

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <div className="image-editor-container">

      <div className="image-editor-header">
        <h1>
          Free Image Editor
        </h1>

        <p className="subtitle">
          Filters, adjustments,
          blur, hairstyles and text
          editing — processed locally
          without AI API charges.
        </p>
      </div>

      {/* ERROR */}

      {errorMessage && (
        <div className="error-banner">
          <span>
            ⚠️
          </span>

          <span>
            {errorMessage}
          </span>

          <button
            className="error-dismiss"
            onClick={() =>
              setErrorMessage(
                null
              )
            }
          >
            ✕
          </button>
        </div>
      )}

      {/* SUCCESS */}

      {successMessage &&
        !errorMessage && (
          <div
            className="success-banner"
            style={{
              display:
                "flex",
              alignItems:
                "center",
              gap: "10px",
              padding:
                "12px 16px",
              marginBottom:
                "20px",
              borderRadius:
                "8px",
            }}
          >
            <span>
              ✓
            </span>

            <span>
              {successMessage}
            </span>

            <button
              className="error-dismiss"
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

      {/* PROCESSING */}

      {isProcessing && (
        <div className="processing-overlay">
          <div className="processing-spinner" />

          <p>
            {processingMessage ||
              "Processing locally..."}
          </p>
        </div>
      )}

      {/* UPLOAD */}

      {imageState ===
        "empty" && (
        <div
          className="upload-area"
          onDrop={
            handleDrop
          }
          onDragOver={
            handleDragOver
          }
          onClick={() =>
            fileInputRef.current?.click()
          }
        >
          <input
            ref={
              fileInputRef
            }
            type="file"
            accept=".jpg,.jpeg,.png,.webp"
            onChange={
              handleFileInput
            }
            style={{
              display:
                "none",
            }}
          />

          <div className="upload-icon">
            📤
          </div>

          <h3>
            Drop your image here
          </h3>

          <p>
            or click to browse
          </p>

          <p className="upload-hint">
            JPG, PNG, WebP —
            maximum 10MB
          </p>
        </div>
      )}

      {/* EDITOR */}

      {imageState ===
        "loaded" && (
        <div className="editor-layout">

          {/* SIDEBAR */}

          <div className="editor-sidebar">

            <button
              className="new-image-btn"
              onClick={
                handleNewImage
              }
            >
              📁 New Image
            </button>

            {/* FILTERS */}

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
                        isProcessing
                      }
                      title={
                        filter.label
                      }
                    >
                      <span className="filter-icon">
                        {
                          filter.icon
                        }
                      </span>

                      <span className="filter-label">
                        {
                          filter.label
                        }
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
                    "#777",
                  marginTop:
                    "8px",
                }}
              >
                ✓ All filters
                are processed
                locally.
                No paid AI API.
              </p>
            </div>

            {/* ADJUSTMENTS */}

            <div className="tool-section">
              <h3>
                Adjustments
              </h3>

              {[
                [
                  "brightness",
                  "Brightness",
                  0.3,
                  2,
                ],
                [
                  "contrast",
                  "Contrast",
                  0.3,
                  2.5,
                ],
                [
                  "saturation",
                  "Saturation",
                  0,
                  3,
                ],
              ].map(
                (item) => {
                  const [
                    key,
                    label,
                    min,
                    max,
                  ] = item;

                  return (
                    <div
                      className="adjustment-group"
                      key={key}
                    >
                      <label>
                        {label}

                        <span className="adjust-value">
                          {adjustments[
                            key
                          ].toFixed(
                            1
                          )}
                          x
                        </span>
                      </label>

                      <input
                        type="range"
                        min={min}
                        max={max}
                        step="0.1"
                        value={
                          adjustments[
                            key
                          ]
                        }
                        onChange={(
                          event
                        ) =>
                          handleAdjustmentChange(
                            key,
                            event
                              .target
                              .value
                          )
                        }
                        disabled={
                          isProcessing
                        }
                      />
                    </div>
                  );
                }
              )}
            </div>

            {/* QUICK ACTIONS */}

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
                        isProcessing
                      }
                    >
                      <span className="action-icon">
                        {
                          action.icon
                        }
                      </span>

                      <span className="action-label">
                        {
                          action.label
                        }
                      </span>
                    </button>
                  )
                )}
              </div>
            </div>

            {/* BACKGROUND BLUR */}

            <div className="tool-section">
              <h3>
                Background Blur
              </h3>

              <div className="quick-actions-grid">
                {BG_BLUR_LEVELS.map(
                  (level) => (
                    <button
                      key={
                        level.id
                      }
                      className={`quick-action-btn ${
                        blurIntensity ===
                        level.id
                          ? "active"
                          : ""
                      }`}
                      onClick={() =>
                        handleBackgroundBlur(
                          level.id
                        )
                      }
                      disabled={
                        isProcessing
                      }
                    >
                      {
                        level.label
                      }
                    </button>
                  )
                )}
              </div>

              <p
                style={{
                  fontSize:
                    "0.7rem",
                  color:
                    "#777",
                  marginTop:
                    "8px",
                }}
              >
                Local blur
                approximation —
                no API.
              </p>
            </div>

            {/* HAIRSTYLES */}

            <div className="tool-section">
              <h3>
                Free Hairstyles
              </h3>

              <div className="filter-grid">
                {HAIRSTYLES.map(
                  (style) => (
                    <button
                      key={
                        style.id
                      }
                      className="filter-btn"
                      onClick={() =>
                        handleHairstyle(
                          style.id
                        )
                      }
                      disabled={
                        isProcessing
                      }
                    >
                      <span className="filter-icon">
                        {
                          style.icon
                        }
                      </span>

                      <span className="filter-label">
                        {
                          style.label
                        }
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
                    "#777",
                    marginTop:
                      "8px",
                }}
              >
                Free local
                hairstyle
                effects. Realistic
                AI hair replacement
                is not performed.
              </p>
            </div>

            {/* TEXT EDITOR */}

            <div className="tool-section">
              <h3>
                Add / Change Text
              </h3>

              <input
                type="text"
                value={
                  textValue
                }
                onChange={(
                  event
                ) =>
                  setTextValue(
                    event
                      .target
                      .value
                  )
                }
                placeholder="New text..."
                disabled={
                  isProcessing
                }
                className="ai-input"
              />

              <label
                style={{
                  display:
                    "block",
                  marginTop:
                    "10px",
                }}
              >
                Text color
              </label>

              <input
                type="color"
                value={
                  textColor
                }
                onChange={(
                  event
                ) =>
                  setTextColor(
                    event
                      .target
                      .value
                  )
                }
                disabled={
                  isProcessing
                }
              />

              <label
                style={{
                  display:
                    "block",
                  marginTop:
                    "10px",
                }}
              >
                Background
              </label>

              <select
                value={
                  textBackground
                }
                onChange={(
                  event
                ) =>
                  setTextBackground(
                    event
                      .target
                      .value
                  )
                }
                disabled={
                  isProcessing
                }
              >
                <option value="transparent">
                  Transparent
                </option>

                <option value="#000000">
                  Black
                </option>

                <option value="#ffffff">
                  White
                </option>

                <option value="#ff0000">
                  Red
                </option>
              </select>

              <label
                style={{
                  display:
                    "block",
                  marginTop:
                    "10px",
                }}
              >
                Size
              </label>

              <input
                type="range"
                min="20"
                max="120"
                value={
                  textSize
                }
                onChange={(
                  event
                ) =>
                  setTextSize(
                    Number(
                      event
                        .target
                        .value
                    )
                  )
                }
                disabled={
                  isProcessing
                }
              />

              <label>
                X:{" "}
                {textX}%
              </label>

              <input
                type="range"
                min="0"
                max="100"
                value={
                  textX
                }
                onChange={(
                  event
                ) =>
                  setTextX(
                    Number(
                      event
                        .target
                        .value
                    )
                  )
                }
                disabled={
                  isProcessing
                }
              />

              <label>
                Y:{" "}
                {textY}%
              </label>

              <input
                type="range"
                min="0"
                max="100"
                value={
                  textY
                }
                onChange={(
                  event
                ) =>
                  setTextY(
                    Number(
                      event
                        .target
                        .value
                    )
                  )
                }
                disabled={
                  isProcessing
                }
              />

              <button
                className="ai-edit-btn"
                onClick={
                  handleAddText
                }
                disabled={
                  isProcessing ||
                  !textValue.trim()
                }
                style={{
                  marginTop:
                    "10px",
                }}
              >
                Add Text
              </button>

              <p
                style={{
                  fontSize:
                    "0.7rem",
                  color:
                    "#777",
                  marginTop:
                    "8px",
                }}
              >
                Text overlay
                completely local
                hai. Existing
                text ko automatically
                erase/reconstruct
                karna AI ke bina
                guaranteed nahi hai.
              </p>
            </div>

            {/* RESET */}

            <button
              className="reset-btn"
              onClick={
                handleReset
              }
              disabled={
                isProcessing
              }
            >
              🔄 Reset
            </button>

            {/* DOWNLOAD */}

            <button
              className="new-image-btn"
              onClick={
                handleDownload
              }
              disabled={
                isProcessing ||
                !currentCanvas
              }
              style={{
                marginTop:
                  "10px",
              }}
            >
              ⬇ Download Edited
            </button>
          </div>

          {/* PREVIEW */}

          <div className="editor-preview">

            {/* ORIGINAL */}

            <div className="preview-section">
              <h3>
                Original Image
              </h3>

              <div className="image-frame">
                {originalUrl ? (
                  <img
                    src={
                      originalUrl
                    }
                    alt="Original"
                    className="preview-image"
                  />
                ) : (
                  <div className="no-image-placeholder">
                    No image.
                  </div>
                )}
              </div>

              {metadata && (
                <div className="image-info">
                  <span className="info-badge">
                    {
                      metadata.width
                    }{" "}
                    ×{" "}
                    {
                      metadata.height
                    }
                  </span>

                  <span className="info-badge">
                    {
                      metadata.format
                    }
                  </span>

                  <span className="info-badge">
                    {
                      formatFileSize(
                        metadata.size
                      )
                    }
                  </span>
                </div>
              )}
            </div>

            {/* EDITED */}

            <div className="preview-section">
              <h3>
                Edited Result

                <button
                  type="button"
                  onClick={
                    handleDownload
                  }
                  disabled={
                    !currentCanvas
                  }
                  className="download-link"
                  style={{
                    border:
                      "none",
                    background:
                      "transparent",
                    cursor:
                      "pointer",
                    marginLeft:
                      "15px",
                  }}
                >
                  ⬇ Download
                </button>
              </h3>

              <div className="image-frame">
                {currentPreviewUrl ? (
                  <img
                    src={
                      currentPreviewUrl
                    }
                    alt="Edited"
                    className="preview-image"
                  />
                ) : (
                  <div className="no-image-placeholder">
                    Apply an
                    edit.
                  </div>
                )}
              </div>

              {currentCanvas && (
                <div className="image-info">
                  <span className="info-badge">
                    {
                      currentCanvas.width
                    }{" "}
                    ×{" "}
                    {
                      currentCanvas.height
                    }
                  </span>

                  <span className="info-badge">
                    LOCAL
                  </span>

                  <span className="info-badge">
                    API: 0
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
