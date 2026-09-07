import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import "./ImageEditor.css";

// ============================================================
// FREE LOCAL IMAGE EDITOR
// ============================================================
// IMPORTANT:
// - Image processing is LOCAL in browser.
// - Replace Text does NOT use AI.
// - No Gemini.
// - No OpenAI.
// - No backend image API.
// ============================================================

// ============================================================
// 50+ FREE FILTERS
// ============================================================

const FILTERS = [
  { id: "natural", label: "Natural", icon: "🌿", b: 1, c: 1, s: 1 },
  { id: "brighten", label: "Brighten", icon: "☀️", b: 1.25, c: 1.05, s: 1.05 },
  { id: "darken", label: "Darken", icon: "🌙", b: 0.72, c: 1.05, s: 1 },
  { id: "contrast", label: "Contrast", icon: "◐", b: 1, c: 1.45, s: 1 },
  { id: "saturate", label: "Saturate", icon: "🎨", b: 1, c: 1.05, s: 1.65 },
  { id: "desaturate", label: "Desaturate", icon: "🖌️", b: 1, c: 1, s: 0.35 },
  { id: "warm", label: "Warm", icon: "🔥", b: 1.08, c: 1.05, s: 1.15 },
  { id: "cool", label: "Cool", icon: "❄️", b: 0.98, c: 1.05, s: 1.05 },
  { id: "vintage", label: "Vintage", icon: "📷", b: 1.04, c: 0.9, s: 0.75 },
  { id: "bw", label: "B&W", icon: "⚫", b: 1.02, c: 1.15, s: 0 },
  { id: "cinematic", label: "Cinematic", icon: "🎬", b: 0.96, c: 1.3, s: 0.85 },
  { id: "portrait", label: "Portrait", icon: "👤", b: 1.08, c: 1.08, s: 1.08 },
  { id: "soft", label: "Soft", icon: "💫", b: 1.08, c: 0.86, s: 0.95 },
  { id: "vivid", label: "Vivid", icon: "🌈", b: 1.05, c: 1.2, s: 1.55 },
  { id: "dramatic", label: "Dramatic", icon: "🎭", b: 0.9, c: 1.55, s: 1.1 },
  { id: "face-glow", label: "Face Glow", icon: "✨", b: 1.15, c: 0.95, s: 1.08 },
  { id: "portrait-enhance", label: "Portrait Enhance", icon: "💎", b: 1.08, c: 1.18, s: 1.15 },

  { id: "sunny", label: "Sunny", icon: "🌞", b: 1.18, c: 1.08, s: 1.18 },
  { id: "clear", label: "Clear", icon: "🔆", b: 1.08, c: 1.18, s: 1.08 },
  { id: "matte", label: "Matte", icon: "🪶", b: 1.03, c: 0.82, s: 0.88 },
  { id: "moody", label: "Moody", icon: "🌑", b: 0.84, c: 1.35, s: 0.82 },
  { id: "faded", label: "Faded", icon: "🌫️", b: 1.04, c: 0.76, s: 0.72 },
  { id: "deep", label: "Deep", icon: "🖤", b: 0.82, c: 1.4, s: 1.02 },
  { id: "high-key", label: "High Key", icon: "⚪", b: 1.32, c: 0.92, s: 1.03 },
  { id: "low-key", label: "Low Key", icon: "⚫", b: 0.68, c: 1.28, s: 0.95 },
  { id: "golden", label: "Golden", icon: "🏆", b: 1.1, c: 1.05, s: 1.2 },
  { id: "sunset", label: "Sunset", icon: "🌅", b: 1.02, c: 1.15, s: 1.22 },
  { id: "ocean", label: "Ocean", icon: "🌊", b: 0.98, c: 1.08, s: 1.1 },
  { id: "forest", label: "Forest", icon: "🌲", b: 0.94, c: 1.18, s: 1.12 },
  { id: "rose", label: "Rose", icon: "🌹", b: 1.05, c: 1.02, s: 1.15 },
  { id: "lavender", label: "Lavender", icon: "💜", b: 1.04, c: 1.03, s: 1.08 },
  { id: "fresh", label: "Fresh", icon: "🍃", b: 1.12, c: 1.08, s: 1.15 },
  { id: "clean", label: "Clean", icon: "✨", b: 1.08, c: 1.1, s: 1.03 },
  { id: "film", label: "Film", icon: "🎞️", b: 1.02, c: 1.12, s: 0.82 },
  { id: "retro", label: "Retro", icon: "📻", b: 1.06, c: 0.94, s: 0.8 },
  { id: "noir", label: "Noir", icon: "🕵️", b: 0.9, c: 1.5, s: 0 },
  { id: "crisp", label: "Crisp", icon: "💠", b: 1.03, c: 1.3, s: 1.12 },
  { id: "sharp", label: "Sharp", icon: "🔷", b: 1.02, c: 1.38, s: 1.08 },
  { id: "glow", label: "Glow", icon: "💡", b: 1.16, c: 0.94, s: 1.1 },
  { id: "dream", label: "Dream", icon: "💭", b: 1.1, c: 0.82, s: 0.94 },
  { id: "mist", label: "Mist", icon: "☁️", b: 1.08, c: 0.75, s: 0.9 },
  { id: "coffee", label: "Coffee", icon: "☕", b: 1.02, c: 0.96, s: 0.78 },
  { id: "chocolate", label: "Chocolate", icon: "🍫", b: 0.96, c: 1.12, s: 0.82 },
  { id: "ice", label: "Ice", icon: "🧊", b: 1.02, c: 1.08, s: 0.9 },
  { id: "neon", label: "Neon", icon: "🌈", b: 1.04, c: 1.3, s: 1.85 },
  { id: "pop", label: "Pop", icon: "🎨", b: 1.1, c: 1.22, s: 1.7 },
  { id: "bright-pop", label: "Bright Pop", icon: "💥", b: 1.25, c: 1.2, s: 1.5 },
  { id: "skin-tone", label: "Skin Tone", icon: "🙂", b: 1.06, c: 1.04, s: 1.06 },
  { id: "editorial", label: "Editorial", icon: "📰", b: 0.98, c: 1.22, s: 0.92 },
  { id: "luxury", label: "Luxury", icon: "💎", b: 1.02, c: 1.25, s: 1.05 },
  { id: "travel", label: "Travel", icon: "✈️", b: 1.12, c: 1.14, s: 1.22 },
  { id: "summer", label: "Summer", icon: "🏖️", b: 1.2, c: 1.08, s: 1.28 },
  { id: "winter", label: "Winter", icon: "❄️", b: 1.04, c: 1.12, s: 0.9 },
  { id: "street", label: "Street", icon: "🏙️", b: 0.94, c: 1.3, s: 1.15 },
  { id: "classic-film", label: "Classic Film", icon: "🎥", b: 1.03, c: 1.08, s: 0.76 },
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
// FREE LOCAL HAIRSTYLES
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
    exposure: 0,
    highlights: 0,
    shadows: 0,
    temperature: 0,
    tint: 0,
    fade: 0,
    sharpen: 0,
    vignette: 0,
    grain: 0,
  });

  const [blurIntensity, setBlurIntensity] = useState("none");

  const [selectedHairstyle, setSelectedHairstyle] =
    useState("original");

  // ==========================================================
  // TEXT
  // ==========================================================

  const [text, setText] = useState("");
  const [textColor, setTextColor] = useState("#ffffff");
  const [textSize, setTextSize] = useState(32);
  const [textX, setTextX] = useState(50);
  const [textY, setTextY] = useState(50);

  // ==========================================================
  // TEXT REPLACEMENT
  // ==========================================================

  const [replaceMode, setReplaceMode] = useState(false);

  const [replaceStart, setReplaceStart] = useState(null);
  const [replaceEnd, setReplaceEnd] = useState(null);

  const [replacementText, setReplacementText] = useState("");

  const [replacementFont, setReplacementFont] =
    useState("Arial");

  const [replacementColor, setReplacementColor] =
    useState("#ffffff");

  const [replacementWeight, setReplacementWeight] =
    useState("700");

  const [replacementAlign, setReplacementAlign] =
    useState("center");

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
  // HELPERS
  // ==========================================================

  const clamp = (value, min, max) =>
    Math.max(min, Math.min(max, value));

  // ==========================================================
  // FILTER VALUES
  // ==========================================================

  const getFilterValues = useCallback((filterId) => {
    const filter = FILTERS.find(
      (item) => item.id === filterId
    );

    if (!filter) {
      return {
        brightness: 1,
        contrast: 1,
        saturation: 1,
      };
    }

    return {
      brightness: filter.b,
      contrast: filter.c,
      saturation: filter.s,
    };
  }, []);

  // ==========================================================
  // CANVAS FILTER
  // ==========================================================

  const getCanvasFilter = useCallback(() => {
    const {
      brightness,
      contrast,
      saturation,
      exposure,
    } = adjustments;

    const exposureMultiplier =
      Math.pow(2, exposure / 100);

    return `
      brightness(${brightness * exposureMultiplier})
      contrast(${contrast})
      saturate(${saturation})
    `;
  }, [adjustments]);

  // ==========================================================
  // DRAW HAIRSTYLE
  // ==========================================================

  const drawHairstyle = useCallback(
    (ctx, canvas, style) => {
      if (!style || style === "original") return;

      const w = canvas.width;
      const h = canvas.height;

      const cx = w / 2;
      const cy = h * 0.22;

      const headW = Math.min(w * 0.32, 180);
      const headH = headW * 0.65;

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
            ctx.moveTo(
              cx + i * 18,
              cy - headH
            );

            ctx.lineTo(
              cx + i * 28,
              cy - headH * 1.45
            );
          }

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
  // DRAW NORMAL TEXT
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

      ctx.fillText(
        text,
        x,
        y
      );

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
  // SAVE HISTORY
  // ==========================================================

  const saveHistory = useCallback(() => {
    const canvas = canvasRef.current;

    if (!canvas) return;

    const snapshot = {
      image: canvas.toDataURL(
        "image/png"
      ),

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
    };

    setHistory((prev) => {
      const next =
        prev.slice(
          0,
          historyIndex + 1
        );

      next.push(snapshot);

      if (next.length > 30) {
        next.shift();
      }

      return next;
    });

    setHistoryIndex((prev) =>
      Math.min(prev + 1, 29)
    );
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
  // RENDER CANVAS
  // ==========================================================

  const renderCanvas = useCallback(() => {
    const canvas =
      canvasRef.current;

    const image =
      imageRef.current;

    if (
      !canvas ||
      !image ||
      !imageLoaded
    ) {
      return;
    }

    const ctx =
      canvas.getContext("2d");

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
        Math.round(
          width * scale
        );

      height =
        Math.round(
          height * scale
        );
    }

    canvas.width = width;
    canvas.height = height;

    ctx.clearRect(
      0,
      0,
      width,
      height
    );

    // --------------------------------------------------------
    // IMAGE
    // --------------------------------------------------------

    ctx.save();

    ctx.filter =
      getCanvasFilter();

    if (
      blurIntensity === "low"
    ) {
      ctx.filter +=
        " blur(1px)";
    }

    if (
      blurIntensity === "medium"
    ) {
      ctx.filter +=
        " blur(2px)";
    }

    if (
      blurIntensity === "high"
    ) {
      ctx.filter +=
        " blur(4px)";
    }

    ctx.drawImage(
      image,
      0,
      0,
      width,
      height
    );

    ctx.restore();

    // --------------------------------------------------------
    // TEMPERATURE
    // --------------------------------------------------------

    if (
      adjustments.temperature !== 0
    ) {
      ctx.save();

      const amount =
        Math.abs(
          adjustments.temperature
        ) / 100;

      if (
        adjustments.temperature > 0
      ) {
        ctx.fillStyle =
          `rgba(255,150,60,${amount * 0.18})`;
      } else {
        ctx.fillStyle =
          `rgba(60,140,255,${amount * 0.18})`;
      }

      ctx.fillRect(
        0,
        0,
        width,
        height
      );

      ctx.restore();
    }

    // --------------------------------------------------------
    // TINT
    // --------------------------------------------------------

    if (
      adjustments.tint !== 0
    ) {
      ctx.save();

      const amount =
        Math.abs(
          adjustments.tint
        ) / 100;

      ctx.fillStyle =
        adjustments.tint > 0
          ? `rgba(40,220,120,${amount * 0.1})`
          : `rgba(180,60,220,${amount * 0.1})`;

      ctx.fillRect(
        0,
        0,
        width,
        height
      );

      ctx.restore();
    }

    // --------------------------------------------------------
    // WARM
    // --------------------------------------------------------

    if (
      activeFilter === "warm" ||
      activeFilter === "golden" ||
      activeFilter === "sunset"
    ) {
      ctx.save();

      ctx.fillStyle =
        "rgba(255,145,50,0.10)";

      ctx.fillRect(
        0,
        0,
        width,
        height
      );

      ctx.restore();
    }

    // --------------------------------------------------------
    // COOL
    // --------------------------------------------------------

    if (
      activeFilter === "cool" ||
      activeFilter === "ocean" ||
      activeFilter === "ice"
    ) {
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

    // --------------------------------------------------------
    // VINTAGE
    // --------------------------------------------------------

    if (
      activeFilter === "vintage" ||
      activeFilter === "retro" ||
      activeFilter === "classic-film"
    ) {
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

    // --------------------------------------------------------
    // CINEMATIC
    // --------------------------------------------------------

    if (
      activeFilter === "cinematic"
    ) {
      ctx.save();

      ctx.fillStyle =
        "rgba(0,0,0,0.20)";

      const bar =
        Math.max(
          20,
          height * 0.06
        );

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

    // --------------------------------------------------------
    // VIGNETTE
    // --------------------------------------------------------

    if (
      adjustments.vignette > 0
    ) {
      const gradient =
        ctx.createRadialGradient(
          width / 2,
          height / 2,
          Math.min(width, height) * 0.2,
          width / 2,
          height / 2,
          Math.max(width, height) * 0.75
        );

      gradient.addColorStop(
        0,
        "rgba(0,0,0,0)"
      );

      gradient.addColorStop(
        1,
        `rgba(0,0,0,${
          adjustments.vignette / 100
        })`
      );

      ctx.fillStyle =
        gradient;

      ctx.fillRect(
        0,
        0,
        width,
        height
      );
    }

    // --------------------------------------------------------
    // SOFT GLOW
    // --------------------------------------------------------

    if (
      activeFilter === "soft" ||
      activeFilter === "face-glow" ||
      activeFilter === "glow" ||
      activeFilter === "dream"
    ) {
      ctx.save();

      ctx.globalCompositeOperation =
        "screen";

      ctx.globalAlpha =
        0.10;

      ctx.filter =
        "blur(18px)";

      ctx.drawImage(
        canvas,
        0,
        0,
        width,
        height
      );

      ctx.restore();
    }

    // --------------------------------------------------------
    // HAIRSTYLE
    // --------------------------------------------------------

    drawHairstyle(
      ctx,
      canvas,
      selectedHairstyle
    );

    // --------------------------------------------------------
    // NORMAL TEXT
    // --------------------------------------------------------

    drawText(
      ctx,
      canvas
    );
  }, [
    imageLoaded,
    getCanvasFilter,
    blurIntensity,
    adjustments,
    activeFilter,
    selectedHairstyle,
    drawHairstyle,
    drawText,
  ]);

  useEffect(() => {
    renderCanvas();
  }, [renderCanvas]);

  // ==========================================================
  // FILE HANDLER
  // ==========================================================

  const handleFile = useCallback(
    (file) => {
      if (!file) return;

      if (
        !file.type.startsWith(
          "image/"
        )
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

      objectUrlRef.current =
        url;

      const img =
        new Image();

      img.onload = () => {
        imageRef.current =
          img;

        setOriginalUrl(url);
        setImageLoaded(true);

        setMetadata({
          width:
            img.naturalWidth,

          height:
            img.naturalHeight,

          format:
            file.type
              .replace(
                "image/",
                ""
              )
              .toUpperCase(),

          size:
            file.size,
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
          fade: 0,
          sharpen: 0,
          vignette: 0,
          grain: 0,
        });

        setBlurIntensity(
          "none"
        );

        setSelectedHairstyle(
          "original"
        );

        setText("");

        setReplaceMode(
          false
        );

        setReplaceStart(
          null
        );

        setReplaceEnd(
          null
        );

        setReplacementText(
          ""
        );

        setHistory([]);
        setHistoryIndex(-1);

        setSuccessMessage(
          "Image loaded. Local editor ready."
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

  const applyFilter = (
    filterId
  ) => {
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
      `${filterId} applied locally.`
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
      "Adjustment applied locally."
    );
  };

  // ==========================================================
  // QUICK ACTIONS
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
            sharpen: 35,
          })
        );

        setActiveFilter(
          "portrait-enhance"
        );

        break;

      case "upscale":
        setSuccessMessage(
          "High-quality local canvas output selected. Download to save."
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

  const applyBlur = (
    level
  ) => {
    if (!imageLoaded) return;

    saveHistory();

    setBlurIntensity(
      level
    );

    setSuccessMessage(
      `Blur ${level} applied locally.`
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
  // NORMAL TEXT
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
      "Text added locally."
    );
  };

  // ==========================================================
  // ==========================================================
  // LOCAL EXISTING TEXT REPLACEMENT
  // ==========================================================
  // ==========================================================

  const getCanvasPoint = (
    event
  ) => {
    const canvas =
      canvasRef.current;

    if (!canvas) return null;

    const rect =
      canvas.getBoundingClientRect();

    const scaleX =
      canvas.width /
      rect.width;

    const scaleY =
      canvas.height /
      rect.height;

    return {
      x: clamp(
        (event.clientX -
          rect.left) *
          scaleX,
        0,
        canvas.width
      ),

      y: clamp(
        (event.clientY -
          rect.top) *
          scaleY,
        0,
        canvas.height
      ),
    };
  };

  // ==========================================================
  // START SELECTION
  // ==========================================================

  const startReplaceSelection = (
    event
  ) => {
    if (!replaceMode) return;

    const point =
      getCanvasPoint(event);

    if (!point) return;

    setReplaceStart(
      point
    );

    setReplaceEnd(
      point
    );
  };

  // ==========================================================
  // MOVE SELECTION
  // ==========================================================

  const moveReplaceSelection = (
    event
  ) => {
    if (
      !replaceMode ||
      !replaceStart
    ) {
      return;
    }

    const point =
      getCanvasPoint(event);

    if (!point) return;

    setReplaceEnd(
      point
    );
  };

  // ==========================================================
  // FINISH SELECTION
  // ==========================================================

  const finishReplaceSelection = (
    event
  ) => {
    if (
      !replaceMode ||
      !replaceStart
    ) {
      return;
    }

    const point =
      getCanvasPoint(event);

    if (!point) return;

    setReplaceEnd(
      point
    );
  };

  // ==========================================================
  // NORMALIZE RECTANGLE
  // ==========================================================

  const getSelectionRect = () => {
    if (
      !replaceStart ||
      !replaceEnd
    ) {
      return null;
    }

    const left =
      Math.min(
        replaceStart.x,
        replaceEnd.x
      );

    const top =
      Math.min(
        replaceStart.y,
        replaceEnd.y
      );

    const right =
      Math.max(
        replaceStart.x,
        replaceEnd.x
      );

    const bottom =
      Math.max(
        replaceStart.y,
        replaceEnd.y
      );

    return {
      x: left,
      y: top,
      width: right - left,
      height: bottom - top,
    };
  };

  // ==========================================================
  // SAMPLE BACKGROUND
  // ==========================================================

  const sampleBackgroundColor = (
    ctx,
    rect
  ) => {
    const padding =
      Math.max(
        2,
        Math.round(
          Math.min(
            rect.width,
            rect.height
          ) * 0.06
        )
      );

    const samples = [];

    const addSampleArea = (
      x,
      y,
      w,
      h
    ) => {
      if (
        w <= 0 ||
        h <= 0
      ) {
        return;
      }

      try {
        const data =
          ctx.getImageData(
            Math.max(0, x),
            Math.max(0, y),
            Math.max(1, w),
            Math.max(1, h)
          ).data;

        for (
          let i = 0;
          i < data.length;
          i += 16
        ) {
          samples.push({
            r: data[i],
            g: data[i + 1],
            b: data[i + 2],
          });
        }
      } catch {
        // Ignore sampling errors.
      }
    };

    // Top
    addSampleArea(
      rect.x,
      rect.y - padding,
      rect.width,
      padding
    );

    // Bottom
    addSampleArea(
      rect.x,
      rect.y + rect.height,
      rect.width,
      padding
    );

    // Left
    addSampleArea(
      rect.x - padding,
      rect.y,
      padding,
      rect.height
    );

    // Right
    addSampleArea(
      rect.x + rect.width,
      rect.y,
      padding,
      rect.height
    );

    if (!samples.length) {
      return {
        r: 40,
        g: 40,
        b: 40,
      };
    }

    let r = 0;
    let g = 0;
    let b = 0;

    for (const color of samples) {
      r += color.r;
      g += color.g;
      b += color.b;
    }

    return {
      r: Math.round(
        r / samples.length
      ),

      g: Math.round(
        g / samples.length
      ),

      b: Math.round(
        b / samples.length
      ),
    };
  };

  // ==========================================================
  // ESTIMATE TEXT COLOR
  // ==========================================================

  const estimateTextColor = (
    ctx,
    rect,
    background
  ) => {
    const x =
      Math.max(
        0,
        Math.floor(rect.x)
      );

    const y =
      Math.max(
        0,
        Math.floor(rect.y)
      );

    const w =
      Math.max(
        1,
        Math.floor(rect.width)
      );

    const h =
      Math.max(
        1,
        Math.floor(rect.height)
      );

    let data;

    try {
      data =
        ctx.getImageData(
          x,
          y,
          w,
          h
        ).data;
    } catch {
      return "#ffffff";
    }

    const bgLum =
      0.299 * background.r +
      0.587 * background.g +
      0.114 * background.b;

    let bestLight = null;
    let bestDark = null;

    for (
      let i = 0;
      i < data.length;
      i += 20
    ) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];

      const lum =
        0.299 * r +
        0.587 * g +
        0.114 * b;

      if (
        bestLight === null ||
        lum > bestLight.lum
      ) {
        bestLight = {
          r,
          g,
          b,
          lum,
        };
      }

      if (
        bestDark === null ||
        lum < bestDark.lum
      ) {
        bestDark = {
          r,
          g,
          b,
          lum,
        };
      }
    }

    if (
      !bestLight ||
      !bestDark
    ) {
      return "#ffffff";
    }

    const darkDistance =
      Math.abs(
        bestDark.lum -
          bgLum
      );

    const lightDistance =
      Math.abs(
        bestLight.lum -
          bgLum
      );

    const selected =
      darkDistance >
      lightDistance
        ? bestDark
        : bestLight;

    return (
      "#" +
      [selected.r, selected.g, selected.b]
        .map((v) =>
          Math.round(v)
            .toString(16)
            .padStart(2, "0")
        )
        .join("")
    );
  };

  // ==========================================================
  // COVER OLD TEXT
  // ==========================================================
  // Local clone-style reconstruction.
  //
  // We don't simply draw a black/grey rectangle.
  // We copy pixels from the surrounding image so the replacement
  // stays visually integrated with the original picture.
  // ==========================================================

  const coverOldText = (
    ctx,
    rect
  ) => {
    const pad =
      Math.max(
        2,
        Math.round(
          Math.min(
            rect.width,
            rect.height
          ) * 0.08
        )
      );

    const temp =
      document.createElement(
        "canvas"
      );

    temp.width =
      Math.ceil(rect.width);

    temp.height =
      Math.ceil(rect.height);

    const tctx =
      temp.getContext(
        "2d"
      );

    // --------------------------------------------------------
    // 1. Try surrounding strips.
    // --------------------------------------------------------

    let filled = false;

    // Above
    if (
      rect.y - rect.height >=
      0
    ) {
      tctx.drawImage(
        ctx.canvas,
        rect.x,
        rect.y -
          rect.height,
        rect.width,
        rect.height,
        0,
        0,
        rect.width,
        rect.height
      );

      filled = true;
    }

    // If top copy isn't available, use bottom.
    if (
      !filled &&
      rect.y + rect.height * 2 <=
        ctx.canvas.height
    ) {
      tctx.drawImage(
        ctx.canvas,
        rect.x,
        rect.y +
          rect.height,
        rect.width,
        rect.height,
        0,
        0,
        rect.width,
        rect.height
      );

      filled = true;
    }

    // --------------------------------------------------------
    // 2. If needed, use average surrounding color.
    // --------------------------------------------------------

    if (!filled) {
      const bg =
        sampleBackgroundColor(
          ctx,
          rect
        );

      tctx.fillStyle =
        `rgb(${bg.r},${bg.g},${bg.b})`;

      tctx.fillRect(
        0,
        0,
        rect.width,
        rect.height
      );
    }

    // --------------------------------------------------------
    // 3. Blend edges with surrounding pixels.
    // --------------------------------------------------------

    ctx.save();

    ctx.globalAlpha = 0.95;

    ctx.drawImage(
      temp,
      rect.x,
      rect.y,
      rect.width,
      rect.height
    );

    ctx.restore();

    // --------------------------------------------------------
    // 4. Edge blending.
    // --------------------------------------------------------

    const bg =
      sampleBackgroundColor(
        ctx,
        rect
      );

    const gradient =
      ctx.createLinearGradient(
        rect.x,
        rect.y,
        rect.x + rect.width,
        rect.y
      );

    gradient.addColorStop(
      0,
      `rgba(${bg.r},${bg.g},${bg.b},0.08)`
    );

    gradient.addColorStop(
      0.5,
      "rgba(0,0,0,0)"
    );

    gradient.addColorStop(
      1,
      `rgba(${bg.r},${bg.g},${bg.b},0.08)`
    );

    ctx.save();

    ctx.fillStyle =
      gradient;

    ctx.fillRect(
      rect.x,
      rect.y,
      rect.width,
      rect.height
    );

    ctx.restore();

    return bg;
  };

  // ==========================================================
  // FIT TEXT INTO SELECTED AREA
  // ==========================================================

  const getFittedFontSize = (
    ctx,
    value,
    rect,
    fontFamily,
    fontWeight
  ) => {
    const cleanText =
      value.trim();

    if (!cleanText) {
      return 16;
    }

    let size =
      Math.max(
        8,
        rect.height * 0.72
      );

    const maxWidth =
      rect.width * 0.92;

    while (
      size > 8
    ) {
      ctx.font =
        `${fontWeight} ${size}px ${fontFamily}`;

      const metrics =
        ctx.measureText(
          cleanText
        );

      if (
        metrics.width <=
        maxWidth
      ) {
        break;
      }

      size -= 1;
    }

    return Math.max(
      8,
      Math.floor(size)
    );
  };

  // ==========================================================
  // REPLACE TEXT
  // ==========================================================

  const replaceExistingText = () => {
    if (!imageLoaded) {
      return;
    }

    const rect =
      getSelectionRect();

    if (!rect) {
      setErrorMessage(
        "First drag over the old text area."
      );
      return;
    }

    if (
      rect.width < 8 ||
      rect.height < 8
    ) {
      setErrorMessage(
        "Please select a larger text area."
      );
      return;
    }

    if (
      !replacementText.trim()
    ) {
      setErrorMessage(
        "Enter the new text first."
      );
      return;
    }

    const canvas =
      canvasRef.current;

    if (!canvas) return;

    const ctx =
      canvas.getContext(
        "2d"
      );

    setIsProcessing(true);

    try {
      // ------------------------------------------------------
      // Save current state for undo.
      // ------------------------------------------------------

      saveHistory();

      // ------------------------------------------------------
      // Estimate original background.
      // ------------------------------------------------------

      const background =
        sampleBackgroundColor(
          ctx,
          rect
        );

      // ------------------------------------------------------
      // Estimate original text color.
      // ------------------------------------------------------

      const autoColor =
        estimateTextColor(
          ctx,
          rect,
          background
        );

      // ------------------------------------------------------
      // Cover old text.
      // ------------------------------------------------------

      coverOldText(
        ctx,
        rect
      );

      // ------------------------------------------------------
      // Select replacement color.
      // ------------------------------------------------------

      const color =
        replacementColor ===
          "auto"
          ? autoColor
          : replacementColor;

      // ------------------------------------------------------
      // Automatically calculate font size.
      // ------------------------------------------------------

      const fontSize =
        getFittedFontSize(
          ctx,
          replacementText,
          rect,
          replacementFont,
          replacementWeight
        );

      // ------------------------------------------------------
      // Draw new text directly inside selected image area.
      // ------------------------------------------------------

      ctx.save();

      ctx.font =
        `${replacementWeight} ${fontSize}px ${replacementFont}`;

      ctx.fillStyle =
        color;

      ctx.textAlign =
        replacementAlign;

      ctx.textBaseline =
        "middle";

      ctx.shadowColor =
        "transparent";

      ctx.shadowBlur = 0;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;

      let textX;

      if (
        replacementAlign ===
        "left"
      ) {
        textX =
          rect.x +
          rect.width * 0.04;
      } else if (
        replacementAlign ===
        "right"
      ) {
        textX =
          rect.x +
          rect.width * 0.96;
      } else {
        textX =
          rect.x +
          rect.width / 2;
      }

      const textY =
        rect.y +
        rect.height / 2;

      ctx.fillText(
        replacementText.trim(),
        textX,
        textY
      );

      ctx.restore();

      // ------------------------------------------------------
      // Remove selection.
      // ------------------------------------------------------

      setReplaceMode(
        false
      );

      setReplaceStart(
        null
      );

      setReplaceEnd(
        null
      );

      setSuccessMessage(
        "Text replaced directly inside the selected image area."
      );
    } catch (error) {
      console.error(
        "Local text replacement error:",
        error
      );

      setErrorMessage(
        "Text replacement failed."
      );
    } finally {
      setIsProcessing(false);
    }
  };

  // ==========================================================
  // UNDO
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

    setSuccessMessage(
      "One step back."
    );
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
      fade: 0,
      sharpen: 0,
      vignette: 0,
      grain: 0,
    });

    setBlurIntensity(
      "none"
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

    setReplaceMode(
      false
    );

    setReplaceStart(
      null
    );

    setReplaceEnd(
      null
    );

    setReplacementText(
      ""
    );

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

  const handleDrop = (
    event
  ) => {
    event.preventDefault();

    const file =
      event.dataTransfer.files?.[0];

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
  // SELECTION RECTANGLE FOR UI
  // ==========================================================

  const selectionRect =
    getSelectionRect();

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
          Free AI Image Editor
        </h1>

        <p className="subtitle">
          Powerful local image editing —
          filters, adjustments, text replacement,
          hairstyles and more.
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
              onClick={
                resetEditor
              }
            >
              🔄 Reset
            </button>

            {/* =================================================
                FILTERS
            ================================================= */}

            <div className="tool-section">
              <h3>
                Filters — 50+
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
                  0.2,
                  2.5,
                  0.05,
                ],
                [
                  "contrast",
                  "Contrast",
                  0.2,
                  3,
                  0.05,
                ],
                [
                  "saturation",
                  "Saturation",
                  0,
                  3,
                  0.05,
                ],
                [
                  "exposure",
                  "Exposure",
                  -100,
                  100,
                  1,
                ],
                [
                  "highlights",
                  "Highlights",
                  -100,
                  100,
                  1,
                ],
                [
                  "shadows",
                  "Shadows",
                  -100,
                  100,
                  1,
                ],
                [
                  "temperature",
                  "Temperature",
                  -100,
                  100,
                  1,
                ],
                [
                  "tint",
                  "Tint",
                  -100,
                  100,
                  1,
                ],
                [
                  "fade",
                  "Fade",
                  0,
                  100,
                  1,
                ],
                [
                  "sharpen",
                  "Sharpen",
                  0,
                  100,
                  1,
                ],
                [
                  "vignette",
                  "Vignette",
                  0,
                  100,
                  1,
                ],
                [
                  "grain",
                  "Grain",
                  0,
                  100,
                  1,
                ],
              ].map(
                ([
                  key,
                  label,
                  min,
                  max,
                  step,
                ]) => (
                  <div
                    className="adjustment-group"
                    key={key}
                  >
                    <label>
                      {label}

                      <span>
                        {Number(
                          adjustments[key]
                        ).toFixed(
                          key ===
                            "brightness" ||
                            key ===
                              "contrast" ||
                            key ===
                              "saturation"
                            ? 1
                            : 0
                        )}
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
                )
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
                  "none",
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
                Free browser-local preview.
              </p>
            </div>

            {/* =================================================
                NORMAL TEXT
            ================================================= */}

            <div className="tool-section">
              <h3>
                Add Text
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
                value={textSize}
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

              <p
                style={{
                  fontSize: "12px",
                  opacity: 0.75,
                  lineHeight: 1.5,
                }}
              >
                Old text ke exact area ko
                image par drag karke select
                karo. Phir naya word likho.
                Replacement directly image ke
                andar hoga.
              </p>

              <button
                className={`ai-edit-btn ${
                  replaceMode
                    ? "active"
                    : ""
                }`}
                onClick={() => {
                  setReplaceMode(
                    (prev) => !prev
                  );

                  setReplaceStart(
                    null
                  );

                  setReplaceEnd(
                    null
                  );
                }}
              >
                {replaceMode
                  ? "✕ Cancel Selection"
                  : "✏️ Select Text Area"}
              </button>

              {replaceMode && (
                <>
                  <input
                    type="text"
                    value={
                      replacementText
                    }
                    onChange={(e) =>
                      setReplacementText(
                        e.target.value
                      )
                    }
                    placeholder="New word..."
                    className="ai-input"
                  />

                  <label>
                    Font
                  </label>

                  <select
                    value={
                      replacementFont
                    }
                    onChange={(e) =>
                      setReplacementFont(
                        e.target.value
                      )
                    }
                    className="ai-input"
                  >
                    <option value="Arial">
                      Arial
                    </option>

                    <option value="Helvetica">
                      Helvetica
                    </option>

                    <option value="Verdana">
                      Verdana
                    </option>

                    <option value="Tahoma">
                      Tahoma
                    </option>

                    <option value="Georgia">
                      Georgia
                    </option>

                    <option value="Times New Roman">
                      Times New Roman
                    </option>

                    <option value="Trebuchet MS">
                      Trebuchet MS
                    </option>

                    <option value="Courier New">
                      Courier New
                    </option>
                  </select>

                  <label>
                    Text weight
                  </label>

                  <select
                    value={
                      replacementWeight
                    }
                    onChange={(e) =>
                      setReplacementWeight(
                        e.target.value
                      )
                    }
                    className="ai-input"
                  >
                    <option value="400">
                      Regular
                    </option>

                    <option value="500">
                      Medium
                    </option>

                    <option value="600">
                      Semi Bold
                    </option>

                    <option value="700">
                      Bold
                    </option>

                    <option value="800">
                      Extra Bold
                    </option>
                  </select>

                  <label>
                    Text color
                  </label>

                  <select
                    value={
                      replacementColor
                    }
                    onChange={(e) =>
                      setReplacementColor(
                        e.target.value
                      )
                    }
                    className="ai-input"
                  >
                    <option value="auto">
                      Auto Match
                    </option>

                    <option value="#ffffff">
                      White
                    </option>

                    <option value="#000000">
                      Black
                    </option>

                    <option value="#ff0000">
                      Red
                    </option>

                    <option value="#00ff00">
                      Green
                    </option>

                    <option value="#0000ff">
                      Blue
                    </option>

                    <option value="#ffff00">
                      Yellow
                    </option>
                  </select>

                  <label>
                    Alignment
                  </label>

                  <select
                    value={
                      replacementAlign
                    }
                    onChange={(e) =>
                      setReplacementAlign(
                        e.target.value
                      )
                    }
                    className="ai-input"
                  >
                    <option value="left">
                      Left
                    </option>

                    <option value="center">
                      Center
                    </option>

                    <option value="right">
                      Right
                    </option>
                  </select>

                  <button
                    className="ai-edit-btn"
                    onClick={
                      replaceExistingText
                    }
                    disabled={
                      !replacementText.trim() ||
                      !selectionRect ||
                      isProcessing
                    }
                  >
                    {isProcessing
                      ? "⏳ Replacing..."
                      : "🔁 Replace Text"}
                  </button>

                  <p
                    style={{
                      fontSize: "11px",
                      opacity: 0.65,
                      lineHeight: 1.5,
                    }}
                  >
                    AI/API use nahi hota.
                    Selected area ke pixels
                    local canvas par reconstruct
                    hote hain aur naya text
                    directly usi area mein draw
                    hota hai.
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
                  userSelect:
                    "none",
                }}
              >
                <canvas
                  ref={canvasRef}
                  className="preview-image"
                  style={{
                    cursor:
                      replaceMode
                        ? "crosshair"
                        : "default",
                  }}
                  onMouseDown={
                    startReplaceSelection
                  }
                  onMouseMove={
                    moveReplaceSelection
                  }
                  onMouseUp={
                    finishReplaceSelection
                  }
                  onMouseLeave={() => {
                    // Selection remains visible
                    // until user replaces/cancels.
                  }}
                  onTouchStart={(e) => {
                    if (
                      !replaceMode
                    )
                      return;

                    const touch =
                      e.touches[0];

                    if (!touch)
                      return;

                    const fakeEvent =
                      {
                        clientX:
                          touch.clientX,
                        clientY:
                          touch.clientY,
                      };

                    startReplaceSelection(
                      fakeEvent
                    );
                  }}
                  onTouchMove={(e) => {
                    if (
                      !replaceMode
                    )
                      return;

                    const touch =
                      e.touches[0];

                    if (!touch)
                      return;

                    const fakeEvent =
                      {
                        clientX:
                          touch.clientX,
                        clientY:
                          touch.clientY,
                      };

                    moveReplaceSelection(
                      fakeEvent
                    );
                  }}
                  onTouchEnd={(e) => {
                    if (
                      !replaceMode
                    )
                      return;

                    const touch =
                      e.changedTouches[0];

                    if (!touch)
                      return;

                    const fakeEvent =
                      {
                        clientX:
                          touch.clientX,
                        clientY:
                          touch.clientY,
                      };

                    finishReplaceSelection(
                      fakeEvent
                    );
                  }}
                />

                {/* =================================================
                    SELECTION OVERLAY
                ================================================= */}

                {replaceMode &&
                  selectionRect && (
                    <div
                      style={{
                        position:
                          "absolute",

                        left: `${
                          (selectionRect.x /
                            (canvasRef.current?.width ||
                              1)) *
                          100
                        }%`,

                        top: `${
                          (selectionRect.y /
                            (canvasRef.current?.height ||
                              1)) *
                          100
                        }%`,

                        width: `${
                          (selectionRect.width /
                            (canvasRef.current?.width ||
                              1)) *
                          100
                        }%`,

                        height: `${
                          (selectionRect.height /
                            (canvasRef.current?.height ||
                              1)) *
                          100
                        }%`,

                        border:
                          "2px dashed #00c8ff",

                        background:
                          "rgba(0,200,255,0.10)",

                        pointerEvents:
                          "none",

                        boxSizing:
                          "border-box",

                        zIndex: 10,
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

                {replaceMode && (
                  <span className="info-badge">
                    ✏️ Drag over old text
                  </span>
                )}
              </div>
            </div>
          </main>
        </div>
      )}
    </div>
  );
}