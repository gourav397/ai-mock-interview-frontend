// ============================================================
// AI MOCK INTERVIEW — IMAGE EDITOR
// ============================================================
// LOCAL IMAGE EDITOR
// NO AI REQUIRED
// NO IMAGE EDITOR API REQUIRED
//
// Includes:
// - Upload
// - 50+ filters
// - Heavy adjustments
// - Quick actions
// - Background blur
// - Local hairstyle preview
// - Undo / Back
// - Reset
// - Download
// - Add text
// - Replace Existing Text
//
// IMPORTANT:
// Replace Existing Text is 100% local.
// User selects the existing text area,
// enters new text and replaces it inside
// the same selected region.
// No separate textbox / black box is shown.
// ============================================================

import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import "./ImageEditor.css";

// ============================================================
// 50+ FILTERS
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

  { id: "clarity", label: "Clarity", icon: "🔎" },
  { id: "sharp", label: "Sharp", icon: "🔪" },
  { id: "matte", label: "Matte", icon: "⬜" },
  { id: "fade", label: "Fade", icon: "🌫️" },
  { id: "moody", label: "Moody", icon: "🌌" },
  { id: "dreamy", label: "Dreamy", icon: "☁️" },
  { id: "golden", label: "Golden", icon: "🌅" },
  { id: "sunset", label: "Sunset", icon: "🌇" },
  { id: "ocean", label: "Ocean", icon: "🌊" },
  { id: "forest", label: "Forest", icon: "🌲" },
  { id: "rose", label: "Rose", icon: "🌹" },
  { id: "lavender", label: "Lavender", icon: "🪻" },
  { id: "teal", label: "Teal", icon: "🟦" },
  { id: "orange", label: "Orange", icon: "🟧" },
  { id: "cold", label: "Cold", icon: "🥶" },
  { id: "film", label: "Film", icon: "🎞️" },
  { id: "retro", label: "Retro", icon: "📺" },
  { id: "classic", label: "Classic", icon: "🎩" },
  { id: "high-contrast", label: "High Contrast", icon: "⚡" },
  { id: "low-contrast", label: "Low Contrast", icon: "🌥️" },
  { id: "highlights", label: "Highlights", icon: "💡" },
  { id: "shadows", label: "Shadows", icon: "🌑" },
  { id: "exposure", label: "Exposure", icon: "☀️" },
  { id: "brilliant", label: "Brilliant", icon: "💫" },
  { id: "clear", label: "Clear", icon: "🔷" },
  { id: "crisp", label: "Crisp", icon: "❄️" },
  { id: "soft-light", label: "Soft Light", icon: "🕯️" },
  { id: "deep", label: "Deep", icon: "🌑" },
  { id: "cinema", label: "Cinema", icon: "🎥" },
  { id: "editorial", label: "Editorial", icon: "📰" },
  { id: "fashion", label: "Fashion", icon: "👗" },
  { id: "studio", label: "Studio", icon: "💡" },
  { id: "skin-tone", label: "Skin Tone", icon: "🙂" },
  { id: "pop", label: "Pop", icon: "💥" },
  { id: "neon", label: "Neon", icon: "🌈" },
  { id: "black-crush", label: "Black Crush", icon: "⬛" },
  { id: "white", label: "White Glow", icon: "🤍" },
  { id: "night", label: "Night", icon: "🌙" },
  { id: "morning", label: "Morning", icon: "🌤️" },
  { id: "natural-plus", label: "Natural+", icon: "🍃" },
  { id: "pro", label: "Pro", icon: "⭐" },
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
  { id: "clarity", label: "Clarity", icon: "🔎" },
  { id: "sharp", label: "Sharp", icon: "✦" },
  { id: "vivid", label: "Vivid", icon: "🌈" },
];

// ============================================================
// HAIRSTYLES
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

  const [activeFilter, setActiveFilter] =
    useState("natural");

  const [adjustments, setAdjustments] = useState({
    brightness: 1,
    contrast: 1,
    saturation: 1,
    exposure: 0,
    highlights: 0,
    shadows: 0,
    temperature: 0,
    tint: 0,
    sharpness: 0,
    clarity: 0,
    fade: 0,
    vignette: 0,
    grain: 0,
    blur: 0,
  });

  const [blurIntensity, setBlurIntensity] =
    useState("medium");

  const [selectedHairstyle, setSelectedHairstyle] =
    useState("original");

  // ==========================================================
  // ADD TEXT
  // ==========================================================

  const [text, setText] = useState("");
  const [textColor, setTextColor] =
    useState("#ffffff");
  const [textSize, setTextSize] = useState(32);
  const [textX, setTextX] = useState(50);
  const [textY, setTextY] = useState(50);

  // ==========================================================
  // REPLACE TEXT
  // ==========================================================

  const [replaceMode, setReplaceMode] =
    useState(false);

  const [replaceText, setReplaceText] =
    useState("");

  const [selection, setSelection] =
    useState(null);

  const [isSelecting, setIsSelecting] =
    useState(false);

  const selectionStartRef = useRef(null);

  // ==========================================================
  // HISTORY
  // ==========================================================

  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] =
    useState(-1);

  // ==========================================================
  // UI
  // ==========================================================

  const [errorMessage, setErrorMessage] =
    useState("");

  const [successMessage, setSuccessMessage] =
    useState("");

  // ==========================================================
  // FILTER VALUES
  // ==========================================================

  const getFilterValues = useCallback(
    (filterId) => {
      const filters = {
        natural: {
          brightness: 1,
          contrast: 1,
          saturation: 1,
        },

        brighten: {
          brightness: 1.3,
          contrast: 1.05,
          saturation: 1.05,
        },

        darken: {
          brightness: 0.7,
          contrast: 1.05,
          saturation: 1,
        },

        contrast: {
          brightness: 1,
          contrast: 1.45,
          saturation: 1,
        },

        saturate: {
          brightness: 1,
          contrast: 1.05,
          saturation: 1.7,
        },

        desaturate: {
          brightness: 1,
          contrast: 1,
          saturation: 0.35,
        },

        warm: {
          brightness: 1.08,
          contrast: 1.05,
          saturation: 1.15,
          temperature: 20,
        },

        cool: {
          brightness: 0.98,
          contrast: 1.05,
          saturation: 1.05,
          temperature: -20,
        },

        vintage: {
          brightness: 1.05,
          contrast: 0.9,
          saturation: 0.75,
          fade: 10,
        },

        bw: {
          brightness: 1.02,
          contrast: 1.15,
          saturation: 0,
        },

        cinematic: {
          brightness: 0.95,
          contrast: 1.3,
          saturation: 0.85,
          vignette: 18,
        },

        portrait: {
          brightness: 1.08,
          contrast: 1.08,
          saturation: 1.08,
          clarity: 8,
        },

        soft: {
          brightness: 1.08,
          contrast: 0.85,
          saturation: 0.95,
          blur: 1,
        },

        vivid: {
          brightness: 1.05,
          contrast: 1.2,
          saturation: 1.55,
          clarity: 10,
        },

        dramatic: {
          brightness: 0.9,
          contrast: 1.55,
          saturation: 1.1,
          shadows: -10,
        },

        "face-glow": {
          brightness: 1.15,
          contrast: 0.95,
          saturation: 1.08,
          highlights: 12,
        },

        "portrait-enhance": {
          brightness: 1.08,
          contrast: 1.18,
          saturation: 1.15,
          sharpness: 10,
          clarity: 10,
        },

        clarity: {
          brightness: 1.02,
          contrast: 1.18,
          saturation: 1.05,
          clarity: 25,
          sharpness: 15,
        },

        sharp: {
          brightness: 1,
          contrast: 1.2,
          saturation: 1.05,
          sharpness: 35,
        },

        matte: {
          brightness: 1.05,
          contrast: 0.85,
          saturation: 0.9,
          fade: 25,
        },

        fade: {
          brightness: 1.08,
          contrast: 0.82,
          saturation: 0.88,
          fade: 30,
        },

        moody: {
          brightness: 0.82,
          contrast: 1.35,
          saturation: 0.85,
          shadows: -15,
          vignette: 25,
        },

        dreamy: {
          brightness: 1.12,
          contrast: 0.88,
          saturation: 1.05,
          blur: 1,
          highlights: 18,
        },

        golden: {
          brightness: 1.1,
          contrast: 1.08,
          saturation: 1.18,
          temperature: 30,
        },

        sunset: {
          brightness: 1.04,
          contrast: 1.12,
          saturation: 1.25,
          temperature: 35,
        },

        ocean: {
          brightness: 1.02,
          contrast: 1.12,
          saturation: 1.18,
          temperature: -25,
          tint: -8,
        },

        forest: {
          brightness: 0.98,
          contrast: 1.15,
          saturation: 1.18,
          temperature: -5,
          tint: -12,
        },

        rose: {
          brightness: 1.05,
          contrast: 1.05,
          saturation: 1.18,
          tint: 18,
        },

        lavender: {
          brightness: 1.08,
          contrast: 0.98,
          saturation: 1.1,
          tint: 25,
        },

        teal: {
          brightness: 0.98,
          contrast: 1.2,
          saturation: 1.2,
          temperature: -15,
          tint: -15,
        },

        orange: {
          brightness: 1.05,
          contrast: 1.12,
          saturation: 1.3,
          temperature: 30,
        },

        cold: {
          brightness: 0.98,
          contrast: 1.1,
          saturation: 1.02,
          temperature: -35,
        },

        film: {
          brightness: 1.02,
          contrast: 1.12,
          saturation: 0.9,
          grain: 8,
          fade: 8,
        },

        retro: {
          brightness: 1.05,
          contrast: 0.92,
          saturation: 0.82,
          temperature: 15,
          grain: 12,
        },

        classic: {
          brightness: 1.03,
          contrast: 1.1,
          saturation: 1.02,
        },

        "high-contrast": {
          brightness: 1,
          contrast: 1.75,
          saturation: 1.1,
        },

        "low-contrast": {
          brightness: 1.05,
          contrast: 0.7,
          saturation: 0.95,
        },

        highlights: {
          brightness: 1.08,
          contrast: 1.02,
          saturation: 1.05,
          highlights: 25,
        },

        shadows: {
          brightness: 1.02,
          contrast: 1.05,
          saturation: 1.05,
          shadows: 25,
        },

        exposure: {
          brightness: 1.25,
          contrast: 1.02,
          saturation: 1.02,
        },

        brilliant: {
          brightness: 1.15,
          contrast: 1.18,
          saturation: 1.15,
          highlights: 20,
          clarity: 12,
        },

        clear: {
          brightness: 1.04,
          contrast: 1.22,
          saturation: 1.08,
          clarity: 20,
        },

        crisp: {
          brightness: 1.02,
          contrast: 1.25,
          saturation: 1.08,
          sharpness: 25,
        },

        "soft-light": {
          brightness: 1.12,
          contrast: 0.88,
          saturation: 1.02,
          highlights: 15,
          blur: 1,
        },

        deep: {
          brightness: 0.88,
          contrast: 1.4,
          saturation: 1.08,
          shadows: -20,
        },

        cinema: {
          brightness: 0.94,
          contrast: 1.35,
          saturation: 0.9,
          vignette: 20,
        },

        editorial: {
          brightness: 1.04,
          contrast: 1.3,
          saturation: 0.92,
          clarity: 20,
        },

        fashion: {
          brightness: 1.08,
          contrast: 1.25,
          saturation: 1.08,
          sharpness: 15,
        },

        studio: {
          brightness: 1.12,
          contrast: 1.12,
          saturation: 1.04,
          highlights: 12,
        },

        "skin-tone": {
          brightness: 1.06,
          contrast: 1.02,
          saturation: 1.08,
          temperature: 8,
        },

        pop: {
          brightness: 1.08,
          contrast: 1.35,
          saturation: 1.55,
        },

        neon: {
          brightness: 1.02,
          contrast: 1.4,
          saturation: 1.8,
        },

        "black-crush": {
          brightness: 0.9,
          contrast: 1.65,
          saturation: 1.05,
        },

        white: {
          brightness: 1.18,
          contrast: 1.08,
          saturation: 1.04,
          highlights: 20,
        },

        night: {
          brightness: 0.72,
          contrast: 1.25,
          saturation: 0.92,
          temperature: -20,
          vignette: 22,
        },

        morning: {
          brightness: 1.12,
          contrast: 1.02,
          saturation: 1.08,
          temperature: 10,
        },

        "natural-plus": {
          brightness: 1.06,
          contrast: 1.08,
          saturation: 1.08,
          clarity: 8,
        },

        pro: {
          brightness: 1.05,
          contrast: 1.22,
          saturation: 1.12,
          sharpness: 18,
          clarity: 15,
        },
      };

      return {
        brightness: 1,
        contrast: 1,
        saturation: 1,
        exposure: 0,
        highlights: 0,
        shadows: 0,
        temperature: 0,
        tint: 0,
        sharpness: 0,
        clarity: 0,
        fade: 0,
        vignette: 0,
        grain: 0,
        blur: 0,
        ...(filters[filterId] || {}),
      };
    },
    []
  );

  // ==========================================================
  // CANVAS FILTER
  // ==========================================================

  const getCanvasFilter = useCallback(() => {
    const a = adjustments;

    let brightness =
      a.brightness + a.exposure * 0.01;

    if (brightness < 0.1) {
      brightness = 0.1;
    }

    let filter = `
      brightness(${brightness})
      contrast(${a.contrast})
      saturate(${a.saturation})
    `;

    if (a.blur > 0) {
      filter += ` blur(${a.blur}px)`;
    }

    if (a.temperature > 0) {
      filter += ` sepia(${Math.min(
        0.35,
        a.temperature / 100
      )})`;
    }

    if (a.temperature < 0) {
      filter += ` hue-rotate(${Math.abs(
        a.temperature
      ) / 2}deg)`;
    }

    if (a.tint !== 0) {
      filter += ` hue-rotate(${a.tint / 2}deg)`;
    }

    return filter;
  }, [adjustments]);

  // ==========================================================
  // SAVE HISTORY
  // ==========================================================

  const saveHistory = useCallback(() => {
    const canvas = canvasRef.current;

    if (!canvas) return;

    const snapshot = {
      image: canvas.toDataURL("image/png"),

      activeFilter,

      adjustments: {
        ...adjustments,
      },

      blurIntensity,

      selectedHairstyle,

      text,
      textColor,
      textSize,
      textX,
      textY,

      replaceMode: false,
      selection: null,
    };

    setHistory((prev) => {
      const next = prev.slice(
        0,
        historyIndex + 1
      );

      next.push(snapshot);

      if (next.length > 30) {
        next.shift();
      }

      return next;
    });

    setHistoryIndex((prev) => {
      return Math.min(prev + 1, 29);
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

      const x =
        (canvas.width * textX) / 100;

      const y =
        (canvas.height * textY) / 100;

      ctx.save();

      ctx.font =
        `700 ${textSize}px Arial`;

      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      ctx.shadowColor =
        "rgba(0,0,0,0.65)";

      ctx.shadowBlur = 5;

      ctx.shadowOffsetX = 2;
      ctx.shadowOffsetY = 2;

      ctx.fillStyle = textColor;

      ctx.fillText(text, x, y);

      ctx.restore();
    },
    [
      text,
      textColor,
      textSize,
      textX,
      textY,
    ]
  );

  // ==========================================================
  // LOCAL HAIRSTYLE
  // ==========================================================

  const drawHairstyle = useCallback(
    (ctx, canvas, style) => {
      if (
        !style ||
        style === "original"
      ) {
        return;
      }

      const w = canvas.width;
      const h = canvas.height;

      const cx = w / 2;
      const cy = h * 0.22;

      const headW =
        Math.min(w * 0.32, 180);

      const headH =
        headW * 0.65;

      ctx.save();

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

          ctx.moveTo(
            cx,
            cy - headH
          );

          ctx.lineTo(
            cx + headW * 0.65,
            cy - headH * 0.1
          );
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

          for (
            let i = -5;
            i <= 5;
            i++
          ) {
            ctx.moveTo(
              cx + i * 18,
              cy - headH
            );

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
          break;

        default:
          break;
      }

      ctx.fillStyle =
        "rgba(35,25,20,0.92)";

      ctx.fill();

      ctx.strokeStyle =
        "rgba(15,15,15,0.95)";

      ctx.lineWidth =
        Math.max(2, w / 350);

      ctx.stroke();

      ctx.restore();
    },
    []
  );

  // ==========================================================
  // DRAW VIGNETTE
  // ==========================================================

  const drawVignette = useCallback(
    (ctx, canvas, amount) => {
      if (!amount) return;

      const gradient =
        ctx.createRadialGradient(
          canvas.width / 2,
          canvas.height / 2,
          canvas.width * 0.15,
          canvas.width / 2,
          canvas.height / 2,
          Math.max(
            canvas.width,
            canvas.height
          ) * 0.75
        );

      gradient.addColorStop(
        0,
        "rgba(0,0,0,0)"
      );

      gradient.addColorStop(
        1,
        `rgba(0,0,0,${Math.min(
          0.7,
          amount / 100
        )})`
      );

      ctx.save();

      ctx.fillStyle = gradient;

      ctx.fillRect(
        0,
        0,
        canvas.width,
        canvas.height
      );

      ctx.restore();
    },
    []
  );

  // ==========================================================
  // RENDER
  // ==========================================================

  const renderCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const image = imageRef.current;

    if (
      !canvas ||
      !image ||
      !imageLoaded
    ) {
      return;
    }

    const ctx =
      canvas.getContext("2d", {
        alpha: false,
      });

    const maxSize = 1600;

    let width =
      image.naturalWidth;

    let height =
      image.naturalHeight;

    if (
      width > maxSize ||
      height > maxSize
    ) {
      const scale =
        Math.min(
          maxSize / width,
          maxSize / height
        );

      width =
        Math.round(width * scale);

      height =
        Math.round(height * scale);
    }

    canvas.width = width;
    canvas.height = height;

    ctx.clearRect(
      0,
      0,
      width,
      height
    );

    // IMAGE
    ctx.save();

    ctx.filter =
      getCanvasFilter();

    ctx.drawImage(
      image,
      0,
      0,
      width,
      height
    );

    ctx.restore();

    // WARM
    if (
      activeFilter === "warm" ||
      adjustments.temperature > 15
    ) {
      ctx.save();

      ctx.fillStyle =
        "rgba(255,150,50,0.08)";

      ctx.fillRect(
        0,
        0,
        width,
        height
      );

      ctx.restore();
    }

    // COOL
    if (
      activeFilter === "cool" ||
      adjustments.temperature < -15
    ) {
      ctx.save();

      ctx.fillStyle =
        "rgba(60,130,255,0.08)";

      ctx.fillRect(
        0,
        0,
        width,
        height
      );

      ctx.restore();
    }

    // VINTAGE
    if (
      activeFilter === "vintage" ||
      activeFilter === "retro"
    ) {
      ctx.save();

      ctx.fillStyle =
        "rgba(120,80,40,0.09)";

      ctx.fillRect(
        0,
        0,
        width,
        height
      );

      ctx.restore();
    }

    // CINEMATIC
    if (
      activeFilter === "cinematic" ||
      activeFilter === "cinema"
    ) {
      ctx.save();

      const bar =
        Math.max(
          20,
          height * 0.045
        );

      ctx.fillStyle =
        "rgba(0,0,0,0.20)";

      ctx.fillRect(
        0,
        0,
        width,
        bar
      );

      ctx.fillRect(
        0,
        height - bar,
        width,
        bar
      );

      ctx.restore();
    }

    // SOFT GLOW
    if (
      activeFilter === "soft" ||
      activeFilter === "face-glow" ||
      activeFilter === "dreamy"
    ) {
      ctx.save();

      ctx.globalCompositeOperation =
        "screen";

      ctx.globalAlpha = 0.1;

      ctx.filter =
        "blur(16px)";

      ctx.drawImage(
        canvas,
        0,
        0,
        width,
        height
      );

      ctx.restore();
    }

    // VIGNETTE
    drawVignette(
      ctx,
      canvas,
      adjustments.vignette
    );

    // HAIRSTYLE
    drawHairstyle(
      ctx,
      canvas,
      selectedHairstyle
    );

    // ADD TEXT
    drawText(
      ctx,
      canvas
    );
  }, [
    imageLoaded,
    getCanvasFilter,
    activeFilter,
    adjustments,
    selectedHairstyle,
    drawHairstyle,
    drawText,
    drawVignette,
  ]);

  useEffect(() => {
    renderCanvas();
  }, [renderCanvas]);

  // ==========================================================
  // LOAD IMAGE
  // ==========================================================

  const handleFile = useCallback(
    (file) => {
      if (!file) return;

      if (
        !file.type.startsWith("image/")
      ) {
        setErrorMessage(
          "Please select a valid image."
        );
        return;
      }

      if (
        file.size >
        10 * 1024 * 1024
      ) {
        setErrorMessage(
          "Maximum image size is 10MB."
        );
        return;
      }

      setErrorMessage("");
      setSuccessMessage("");

      if (
        objectUrlRef.current
      ) {
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
          format: file.type
            .replace(
              "image/",
              ""
            )
            .toUpperCase(),
          size: file.size,
        });

        setActiveFilter(
          "natural"
        );

        setAdjustments({
          brightness: 1,
          contrast: 1,
          saturation: 1,
          exposure: 0,
          highlights: 0,
          shadows: 0,
          temperature: 0,
          tint: 0,
          sharpness: 0,
          clarity: 0,
          fade: 0,
          vignette: 0,
          grain: 0,
          blur: 0,
        });

        setBlurIntensity(
          "medium"
        );

        setSelectedHairstyle(
          "original"
        );

        setText("");

        setReplaceMode(false);
        setReplaceText("");
        setSelection(null);

        setHistory([]);
        setHistoryIndex(-1);

        setSuccessMessage(
          "Image loaded successfully."
        );
      };

      img.onerror = () => {
        setErrorMessage(
          "Image load failed."
        );
      };

      img.src = url;
    },
    []
  );

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
      getFilterValues(
        filterId
      );

    setActiveFilter(
      filterId
    );

    setAdjustments(
      (prev) => ({
        ...prev,
        ...values,
      })
    );

    setSuccessMessage(
      `${filterId} applied.`
    );
  };

  // ==========================================================
  // ADJUSTMENTS
  // ==========================================================

  const handleAdjustment = (
    key,
    value
  ) => {
    if (!imageLoaded) return;

    setAdjustments(
      (prev) => ({
        ...prev,
        [key]: Number(value),
      })
    );
  };

  const commitAdjustment = () => {
    saveHistory();

    setSuccessMessage(
      "Adjustment applied."
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

        setAdjustments(
          (prev) => ({
            ...prev,
            brightness: 1.1,
            contrast: 1.18,
            saturation: 1.12,
            sharpness: 15,
            clarity: 15,
          })
        );

        setActiveFilter(
          "portrait-enhance"
        );

        break;

      case "upscale":
        saveHistory();

        setSuccessMessage(
          "High-quality canvas output selected."
        );

        break;

      default:
        applyFilter(
          actionId
        );

        break;
    }
  };

  // ==========================================================
  // BACKGROUND BLUR
  // ==========================================================

  const applyBlur = (
    level
  ) => {
    if (!imageLoaded) return;

    saveHistory();

    setBlurIntensity(level);

    const amount =
      level === "low"
        ? 0.7
        : level === "medium"
        ? 1.5
        : 3;

    setAdjustments(
      (prev) => ({
        ...prev,
        blur: amount,
      })
    );

    setSuccessMessage(
      `Background blur: ${level}.`
    );
  };

  // ==========================================================
  // HAIRSTYLE
  // ==========================================================

  const applyHairstyle = (
    style
  ) => {
    if (!imageLoaded) return;

    saveHistory();

    setSelectedHairstyle(
      style
    );

    setSuccessMessage(
      style === "original"
        ? "Original hairstyle restored."
        : `${style} hairstyle applied locally.`
    );
  };

  // ==========================================================
  // ADD TEXT
  // ==========================================================

  const applyText = () => {
    if (
      !imageLoaded ||
      !text.trim()
    ) {
      return;
    }

    saveHistory();

    setSuccessMessage(
      "Text added."
    );
  };

  // ==========================================================
  // ==========================================================
  // REPLACE EXISTING TEXT
  // ==========================================================
  // ==========================================================

  const startReplaceText = () => {
    if (!imageLoaded) return;

    setReplaceMode(true);
    setSelection(null);
    setReplaceText("");

    setSuccessMessage(
      "Edited image par old text ke around area drag karke select karo."
    );
  };

  const cancelReplaceText = () => {
    setReplaceMode(false);
    setSelection(null);
    setReplaceText("");
  };

  // ==========================================================
  // CANVAS COORDINATES
  // ==========================================================

  const getCanvasCoordinates = (
    event
  ) => {
    const canvas =
      canvasRef.current;

    if (!canvas) {
      return null;
    }

    const rect =
      canvas.getBoundingClientRect();

    const scaleX =
      canvas.width /
      rect.width;

    const scaleY =
      canvas.height /
      rect.height;

    return {
      x: Math.max(
        0,
        Math.min(
          canvas.width,
          (event.clientX -
            rect.left) *
            scaleX
        )
      ),

      y: Math.max(
        0,
        Math.min(
          canvas.height,
          (event.clientY -
            rect.top) *
            scaleY
        )
      ),
    };
  };

  // ==========================================================
  // START SELECTION
  // ==========================================================

  const handleCanvasPointerDown =
    (event) => {
      if (!replaceMode) return;

      event.preventDefault();

      const point =
        getCanvasCoordinates(
          event
        );

      if (!point) return;

      selectionStartRef.current =
        point;

      setIsSelecting(true);

      setSelection({
        x: point.x,
        y: point.y,
        width: 0,
        height: 0,
      });
    };

  // ==========================================================
  // MOVE SELECTION
  // ==========================================================

  const handleCanvasPointerMove =
    (event) => {
      if (
        !replaceMode ||
        !isSelecting
      ) {
        return;
      }

      const start =
        selectionStartRef.current;

      const point =
        getCanvasCoordinates(
          event
        );

      if (
        !start ||
        !point
      ) {
        return;
      }

      const x =
        Math.min(
          start.x,
          point.x
        );

      const y =
        Math.min(
          start.y,
          point.y
        );

      const width =
        Math.abs(
          point.x -
            start.x
        );

      const height =
        Math.abs(
          point.y -
            start.y
        );

      setSelection({
        x,
        y,
        width,
        height,
      });
    };

  // ==========================================================
  // END SELECTION
  // ==========================================================

  const handleCanvasPointerUp =
    () => {
      if (!isSelecting) {
        return;
      }

      setIsSelecting(false);

      if (
        !selection ||
        selection.width < 5 ||
        selection.height < 5
      ) {
        setSelection(null);

        setErrorMessage(
          "Text ke around thoda bada area select karo."
        );

        return;
      }

      setSuccessMessage(
        "Area selected. Ab naya word type karke Replace Text dabao."
      );
    };

  // ==========================================================
  // COLOR DISTANCE
  // ==========================================================

  const getPixelBrightness = (
    data,
    index
  ) => {
    const r =
      data[index];

    const g =
      data[index + 1];

    const b =
      data[index + 2];

    return (
      0.299 * r +
      0.587 * g +
      0.114 * b
    );
  };

  // ==========================================================
  // SAMPLE TEXT COLOR
  // ==========================================================

  const detectTextColor = (
    ctx,
    box
  ) => {
    const x =
      Math.max(
        0,
        Math.floor(box.x)
      );

    const y =
      Math.max(
        0,
        Math.floor(box.y)
      );

    const w =
      Math.max(
        1,
        Math.floor(box.width)
      );

    const h =
      Math.max(
        1,
        Math.floor(box.height)
      );

    const imageData =
      ctx.getImageData(
        x,
        y,
        Math.min(
          w,
          ctx.canvas.width -
            x
        ),
        Math.min(
          h,
          ctx.canvas.height -
            y
        )
      );

    const values = [];

    for (
      let i = 0;
      i <
        imageData.data.length;
      i += 4
    ) {
      const r =
        imageData.data[i];

      const g =
        imageData.data[
          i + 1
        ];

      const b =
        imageData.data[
          i + 2
        ];

      const brightness =
        getPixelBrightness(
          imageData.data,
          i
        );

      values.push({
        r,
        g,
        b,
        brightness,
      });
    }

    if (!values.length) {
      return "#ffffff";
    }

    values.sort(
      (a, b) =>
        a.brightness -
        b.brightness
    );

    // Text is commonly darker than
    // surrounding background.
    const darkSample =
      values[
        Math.floor(
          values.length *
            0.15
        )
      ];

    const lightSample =
      values[
        Math.floor(
          values.length *
            0.85
        )
      ];

    const average =
      values.reduce(
        (sum, p) =>
          sum +
          p.brightness,
        0
      ) /
      values.length;

    const candidate =
      average > 145
        ? darkSample
        : lightSample;

    return `rgb(
      ${candidate.r},
      ${candidate.g},
      ${candidate.b}
    )`;
  };

  // ==========================================================
  // BACKGROUND RECONSTRUCTION
  // ==========================================================
  // No black rectangle.
  //
  // The selected region is filled by extending
  // pixels from its surrounding edges.
  //
  // This is a local canvas approximation.
  // ==========================================================

  const repairSelectedArea = (
    ctx,
    box
  ) => {
    const x =
      Math.max(
        0,
        Math.floor(box.x)
      );

    const y =
      Math.max(
        0,
        Math.floor(box.y)
      );

    const w =
      Math.min(
        Math.floor(box.width),
        ctx.canvas.width - x
      );

    const h =
      Math.min(
        Math.floor(box.height),
        ctx.canvas.height - y
      );

    if (
      w <= 2 ||
      h <= 2
    ) {
      return;
    }

    const padding =
      Math.max(
        4,
        Math.min(
          20,
          Math.floor(
            Math.min(w, h) *
              0.18
          )
        )
      );

    // Save original selected image.
    const source =
      ctx.getImageData(
        x,
        y,
        w,
        h
      );

    const result =
      ctx.createImageData(
        w,
        h
      );

    // --------------------------------------------------------
    // First pass:
    // Estimate each pixel from nearby pixels outside
    // the selected text area.
    // --------------------------------------------------------

    for (
      let py = 0;
      py < h;
      py++
    ) {
      for (
        let px = 0;
        px < w;
        px++
      ) {
        const index =
          (py * w + px) * 4;

        let sampleX;
        let sampleY;

        const leftDistance =
          px;

        const rightDistance =
          w - px - 1;

        const topDistance =
          py;

        const bottomDistance =
          h - py - 1;

        const minDistance =
          Math.min(
            leftDistance,
            rightDistance,
            topDistance,
            bottomDistance
          );

        // Pick closest edge.
        if (
          minDistance ===
          leftDistance
        ) {
          sampleX =
            Math.min(
              padding,
              w - 1
            );

          sampleY = py;
        } else if (
          minDistance ===
          rightDistance
        ) {
          sampleX =
            Math.max(
              0,
              w -
                padding -
                1
            );

          sampleY = py;
        } else if (
          minDistance ===
          topDistance
        ) {
          sampleX = px;

          sampleY =
            Math.min(
              padding,
              h - 1
            );
        } else {
          sampleX = px;

          sampleY =
            Math.max(
              0,
              h -
                padding -
                1
            );
        }

        const sampleIndex =
          (sampleY * w +
            sampleX) *
          4;

        result.data[index] =
          source.data[
            sampleIndex
          ];

        result.data[
          index + 1
        ] =
          source.data[
            sampleIndex + 1
          ];

        result.data[
          index + 2
        ] =
          source.data[
            sampleIndex + 2
          ];

        result.data[
          index + 3
        ] = 255;
      }
    }

    // --------------------------------------------------------
    // Smooth reconstruction.
    // --------------------------------------------------------

    const smoothed =
      ctx.createImageData(
        w,
        h
      );

    for (
      let py = 0;
      py < h;
      py++
    ) {
      for (
        let px = 0;
        px < w;
        px++
      ) {
        let r = 0;
        let g = 0;
        let b = 0;
        let count = 0;

        for (
          let oy = -2;
          oy <= 2;
          oy++
        ) {
          for (
            let ox = -2;
            ox <= 2;
            ox++
          ) {
            const sx =
              Math.max(
                0,
                Math.min(
                  w - 1,
                  px + ox
                )
              );

            const sy =
              Math.max(
                0,
                Math.min(
                  h - 1,
                  py + oy
                )
              );

            const idx =
              (sy * w + sx) *
              4;

            r +=
              result.data[
                idx
              ];

            g +=
              result.data[
                idx + 1
              ];

            b +=
              result.data[
                idx + 2
              ];

            count++;
          }
        }

        const idx =
          (py * w + px) * 4;

        smoothed.data[idx] =
          r / count;

        smoothed.data[
          idx + 1
        ] =
          g / count;

        smoothed.data[
          idx + 2
        ] =
          b / count;

        smoothed.data[
          idx + 3
        ] = 255;
      }
    }

    ctx.putImageData(
      smoothed,
      x,
      y
    );
  };

  // ==========================================================
  // FIT TEXT INSIDE SELECTED BOX
  // ==========================================================

  const calculateTextSize = (
    ctx,
    value,
    box
  ) => {
    if (!value) {
      return 20;
    }

    let size =
      Math.max(
        10,
        box.height * 0.65
      );

    const maxWidth =
      box.width * 0.9;

    while (
      size > 8
    ) {
      ctx.font =
        `700 ${size}px Arial`;

      const width =
        ctx.measureText(
          value
        ).width;

      if (
        width <= maxWidth
      ) {
        break;
      }

      size -= 1;
    }

    return size;
  };

  // ==========================================================
  // REPLACE TEXT
  // ==========================================================

  const replaceSelectedText =
    () => {
      if (
        !imageLoaded ||
        !selection
      ) {
        setErrorMessage(
          "Pehle existing text ka area select karo."
        );

        return;
      }

      if (
        !replaceText.trim()
      ) {
        setErrorMessage(
          "Naya text type karo."
        );

        return;
      }

      const canvas =
        canvasRef.current;

      if (!canvas) return;

      // Save before edit.
      saveHistory();

      const ctx =
        canvas.getContext(
          "2d"
        );

      // --------------------------------------------------------
      // Detect old text color BEFORE repairing area.
      // --------------------------------------------------------

      const detectedColor =
        detectTextColor(
          ctx,
          selection
        );

      // --------------------------------------------------------
      // Repair old text area.
      // --------------------------------------------------------

      repairSelectedArea(
        ctx,
        selection
      );

      // --------------------------------------------------------
      // Automatically calculate text size.
      // --------------------------------------------------------

      const fittedSize =
        calculateTextSize(
          ctx,
          replaceText.trim(),
          selection
        );

      // --------------------------------------------------------
      // Draw replacement directly inside image.
      // No textbox.
      // No black box.
      // No separate overlay.
      // --------------------------------------------------------

      ctx.save();

      ctx.font =
        `700 ${fittedSize}px Arial`;

      ctx.textAlign =
        "center";

      ctx.textBaseline =
        "middle";

      ctx.fillStyle =
        detectedColor;

      // Very subtle shadow only when useful.
      // It helps blend with normal text.
      ctx.shadowColor =
        "rgba(0,0,0,0.18)";

      ctx.shadowBlur = 1;

      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 1;

      const centerX =
        selection.x +
        selection.width /
          2;

      const centerY =
        selection.y +
        selection.height /
          2;

      ctx.fillText(
        replaceText.trim(),
        centerX,
        centerY
      );

      ctx.restore();

      // --------------------------------------------------------
      // Exit replacement mode.
      // --------------------------------------------------------

      setReplaceMode(false);
      setSelection(null);
      setReplaceText("");

      setSuccessMessage(
        "Text successfully replaced inside the selected area."
      );
    };

  // ==========================================================
  // UNDO / BACK
  // ==========================================================

  const undo = () => {
    if (
      historyIndex < 0
    ) {
      return;
    }

    const snapshot =
      history[
        historyIndex
      ];

    if (!snapshot) {
      return;
    }

    // Restore canvas snapshot directly.
    const img =
      new Image();

    img.onload = () => {
      const canvas =
        canvasRef.current;

      if (!canvas) return;

      const ctx =
        canvas.getContext(
          "2d"
        );

      canvas.width =
        img.width;

      canvas.height =
        img.height;

      ctx.clearRect(
        0,
        0,
        canvas.width,
        canvas.height
      );

      ctx.drawImage(
        img,
        0,
        0
      );

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

      setText(
        snapshot.text
      );

      setTextColor(
        snapshot.textColor
      );

      setTextSize(
        snapshot.textSize
      );

      setTextX(
        snapshot.textX
      );

      setTextY(
        snapshot.textY
      );

      setHistoryIndex(
        historyIndex - 1
      );

      setReplaceMode(false);
      setSelection(null);

      setSuccessMessage(
        "One step back."
      );
    };

    img.src =
      snapshot.image;
  };

  // ==========================================================
  // RESET
  // ==========================================================

  const resetEditor = () => {
    if (!imageLoaded) return;

    setActiveFilter(
      "natural"
    );

    setAdjustments({
      brightness: 1,
      contrast: 1,
      saturation: 1,
      exposure: 0,
      highlights: 0,
      shadows: 0,
      temperature: 0,
      tint: 0,
      sharpness: 0,
      clarity: 0,
      fade: 0,
      vignette: 0,
      grain: 0,
      blur: 0,
    });

    setBlurIntensity(
      "medium"
    );

    setSelectedHairstyle(
      "original"
    );

    setText("");

    setTextColor(
      "#ffffff"
    );

    setTextSize(32);
    setTextX(50);
    setTextY(50);

    setReplaceMode(false);
    setReplaceText("");
    setSelection(null);

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
          URL.createObjectURL(
            blob
          );

        const a =
          document.createElement(
            "a"
          );

        a.href = url;

        a.download =
          `edited-image-${Date.now()}.png`;

        document.body.appendChild(
          a
        );

        a.click();

        a.remove();

        URL.revokeObjectURL(
          url
        );

        setSuccessMessage(
          "Image downloaded successfully."
        );
      },
      "image/png",
      1
    );
  };

  // ==========================================================
  // DROP
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
      if (
        objectUrlRef.current
      ) {
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
      {/* ====================================================
          HEADER
      ==================================================== */}

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

      {/* ====================================================
          INPUT
      ==================================================== */}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileInput}
        style={{
          display: "none",
        }}
      />

      {/* ====================================================
          ERROR
      ==================================================== */}

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

      {/* ====================================================
          SUCCESS
      ==================================================== */}

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

      {/* ====================================================
          EMPTY
      ==================================================== */}

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

      {/* ====================================================
          EDITOR
      ==================================================== */}

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

            {/* BACK */}

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
            </div>

            {/* =================================================
                HEAVY ADJUSTMENTS
            ================================================= */}

            <div className="tool-section">
              <h3>
                Advanced Adjustments
              </h3>

              {[
                [
                  "brightness",
                  "Brightness",
                  0.3,
                  2.2,
                  0.05,
                  "x",
                ],

                [
                  "contrast",
                  "Contrast",
                  0.2,
                  3,
                  0.05,
                  "x",
                ],

                [
                  "saturation",
                  "Saturation",
                  0,
                  3,
                  0.05,
                  "x",
                ],

                [
                  "exposure",
                  "Exposure",
                  -100,
                  100,
                  1,
                  "",
                ],

                [
                  "highlights",
                  "Highlights",
                  -100,
                  100,
                  1,
                  "",
                ],

                [
                  "shadows",
                  "Shadows",
                  -100,
                  100,
                  1,
                  "",
                ],

                [
                  "temperature",
                  "Temperature",
                  -100,
                  100,
                  1,
                  "",
                ],

                [
                  "tint",
                  "Tint",
                  -100,
                  100,
                  1,
                  "",
                ],

                [
                  "sharpness",
                  "Sharpness",
                  0,
                  100,
                  1,
                  "",
                ],

                [
                  "clarity",
                  "Clarity",
                  0,
                  100,
                  1,
                  "",
                ],

                [
                  "fade",
                  "Fade",
                  0,
                  100,
                  1,
                  "",
                ],

                [
                  "vignette",
                  "Vignette",
                  0,
                  100,
                  1,
                  "",
                ],

                [
                  "blur",
                  "Blur",
                  0,
                  8,
                  0.2,
                  "px",
                ],
              ].map(
                (item) => {
                  const [
                    key,
                    label,
                    min,
                    max,
                    step,
                    suffix,
                  ] = item;

                  return (
                    <div
                      className="adjustment-group"
                      key={key}
                    >
                      <label>
                        {label}

                        <span>
                          {Number(
                            adjustments[
                              key
                            ]
                          ).toFixed(
                            step < 1
                              ? 1
                              : 0
                          )}

                          {suffix}
                        </span>
                      </label>

                      <input
                        type="range"
                        min={min}
                        max={max}
                        step={step}
                        value={
                          adjustments[
                            key
                          ]
                        }
                        onChange={(
                          e
                        ) =>
                          handleAdjustment(
                            key,
                            e.target
                              .value
                          )
                        }
                        onMouseUp={
                          commitAdjustment
                        }
                        onTouchEnd={
                          commitAdjustment
                        }
                      />
                    </div>
                  );
                }
              )}
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
                      key={
                        action.id
                      }
                      className="quick-action-btn"
                      onClick={() =>
                        handleQuickAction(
                          action.id
                        )
                      }
                    >
                      <span>
                        {
                          action.icon
                        }
                      </span>

                      <span>
                        {
                          action.label
                        }
                      </span>
                    </button>
                  )
                )}
              </div>
            </div>

            {/* =================================================
                BACKGROUND BLUR
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
                ].map(
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
                        applyBlur(
                          level
                        )
                      }
                    >
                      {level}
                    </button>
                  )
                )}
              </div>
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
                      key={
                        style.id
                      }
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
            </div>

            {/* =================================================
                ADD / CHANGE TEXT
            ================================================= */}

            <div className="tool-section">
              <h3>
                Add / Change Text
              </h3>

              <input
                type="text"
                value={text}
                onChange={(e) =>
                  setText(
                    e.target.value
                  )
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
                value={
                  textSize
                }
                onChange={(e) =>
                  setTextSize(
                    Number(
                      e.target.value
                    )
                  )
                }
              />

              <label>
                Text color
              </label>

              <input
                type="color"
                value={
                  textColor
                }
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
                    Number(
                      e.target.value
                    )
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
                    Number(
                      e.target.value
                    )
                  )
                }
              />

              <button
                className="ai-edit-btn"
                onClick={
                  applyText
                }
                disabled={
                  !text.trim()
                }
              >
                Add Text
              </button>
            </div>

            {/* =================================================
                REPLACE EXISTING TEXT
            ================================================= */}

            <div className="tool-section">
              <h3>
                Replace Existing Text
              </h3>

              {!replaceMode ? (
                <>
                  <p
                    style={{
                      fontSize:
                        "12px",
                      opacity:
                        0.75,
                      lineHeight:
                        1.5,
                    }}
                  >
                    Image/page par jo
                    text already
                    likha hai us
                    area ko select
                    karke naya
                    word directly
                    replace karo.
                  </p>

                  <button
                    className="ai-edit-btn"
                    onClick={
                      startReplaceText
                    }
                  >
                    ✏️ Select Text Area
                  </button>
                </>
              ) : (
                <>
                  <p
                    style={{
                      fontSize:
                        "12px",
                      opacity:
                        0.8,
                      lineHeight:
                        1.5,
                    }}
                  >
                    Edited image par
                    old text ke
                    around exact
                    area drag karo.
                  </p>

                  <input
                    type="text"
                    value={
                      replaceText
                    }
                    onChange={(
                      e
                    ) =>
                      setReplaceText(
                        e.target
                          .value
                      )
                    }
                    placeholder="Naya word..."
                    className="ai-input"
                    autoFocus
                  />

                  <button
                    className="ai-edit-btn"
                    onClick={
                      replaceSelectedText
                    }
                    disabled={
                      !selection ||
                      !replaceText.trim()
                    }
                  >
                    🔁 Replace Text
                  </button>

                  <button
                    className="reset-btn"
                    onClick={
                      cancelReplaceText
                    }
                  >
                    ✕ Cancel Selection
                  </button>

                  <p
                    style={{
                      fontSize:
                        "11px",
                      opacity:
                        0.65,
                      lineHeight:
                        1.4,
                    }}
                  >
                    Replacement
                    directly image
                    ke andar hoga.
                    Separate textbox
                    ya black box
                    nahi banega.
                  </p>
                </>
              )}
            </div>

            {/* =================================================
                DOWNLOAD
            ================================================= */}

            <button
              className="new-image-btn"
              onClick={
                downloadImage
              }
            >
              ⬇️ Download Image
            </button>
          </aside>

          {/* =================================================
              PREVIEW
          ================================================= */}

          <main className="editor-preview">
            {/* ORIGINAL */}

            <div className="preview-section">
              <h3>
                Original Image
              </h3>

              <div className="image-frame">
                <img
                  src={
                    originalUrl
                  }
                  alt="Original"
                  className="preview-image"
                />
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
                    {(
                      metadata.size /
                      1024 /
                      1024
                    ).toFixed(
                      2
                    )}{" "}
                    MB
                  </span>
                </div>
              )}
            </div>

            {/* EDITED */}

            <div className="preview-section">
              <h3>
                Edited Result
              </h3>

              <div
                className="image-frame"
                style={{
                  position:
                    "relative",
                  cursor:
                    replaceMode
                      ? "crosshair"
                      : "default",
                  userSelect:
                    "none",
                }}
              >
                <canvas
                  ref={
                    canvasRef
                  }
                  className="preview-image"
                  onPointerDown={
                    handleCanvasPointerDown
                  }
                  onPointerMove={
                    handleCanvasPointerMove
                  }
                  onPointerUp={
                    handleCanvasPointerUp
                  }
                  onPointerCancel={
                    handleCanvasPointerUp
                  }
                  style={{
                    touchAction:
                      replaceMode
                        ? "none"
                        : "auto",
                  }}
                />

                {/* =================================================
                    SELECTION BORDER
                    IMPORTANT:
                    This is ONLY shown while selecting.
                    It is NOT rendered into downloaded image.
                ================================================= */}

                {replaceMode &&
                  selection &&
                  canvasRef.current && (
                    <div
                      style={{
                        position:
                          "absolute",

                        left: `${
                          (selection.x /
                            canvasRef
                              .current
                              .width) *
                          100
                        }%`,

                        top: `${
                          (selection.y /
                            canvasRef
                              .current
                              .height) *
                          100
                        }%`,

                        width: `${
                          (selection.width /
                            canvasRef
                              .current
                              .width) *
                          100
                        }%`,

                        height: `${
                          (selection.height /
                            canvasRef
                              .current
                              .height) *
                          100
                        }%`,

                        border:
                          "2px dashed #00cfff",

                        background:
                          "rgba(0,200,255,0.08)",

                        pointerEvents:
                          "none",

                        boxSizing:
                          "border-box",
                      }}
                    />
                  )}
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