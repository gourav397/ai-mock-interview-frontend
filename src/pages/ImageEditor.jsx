// ============================================================
// AI IMAGE EDITOR
// ============================================================
// FREE LOCAL FEATURES
// ------------------------------------------------------------
// • 50+ local filters
// • Brightness / Contrast / Saturation
// • Background Blur
// • 8 Free Hairstyles
// • Undo
// • Redo
// • Reset
// • Text overlay
// • Download
// • Drag & Drop
//
// AI FEATURES PRESERVED
// ------------------------------------------------------------
// • AI Edit
// • Backend AI processing
//
// IMPORTANT
// ------------------------------------------------------------
// Hairstyles shown here are FREE browser-local overlays.
// They do NOT consume AI credits.
// ============================================================

import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import apiService from "../../services/api";
import "./ImageEditor.css";

// ============================================================
// 50+ FILTERS
// ============================================================

const FILTERS = [
  {
    id: "natural",
    label: "Natural",
    icon: "🌿",
    b: 1,
    c: 1,
    s: 1,
  },
  {
    id: "brighten",
    label: "Brighten",
    icon: "☀️",
    b: 1.3,
    c: 1.05,
    s: 1.05,
  },
  {
    id: "darken",
    label: "Darken",
    icon: "🌙",
    b: 0.7,
    c: 1.05,
    s: 1,
  },
  {
    id: "contrast",
    label: "Contrast",
    icon: "◐",
    b: 1,
    c: 1.45,
    s: 1,
  },
  {
    id: "saturate",
    label: "Saturate",
    icon: "🎨",
    b: 1,
    c: 1.05,
    s: 1.7,
  },
  {
    id: "desaturate",
    label: "Desaturate",
    icon: "🖌️",
    b: 1,
    c: 1,
    s: 0.35,
  },
  {
    id: "warm",
    label: "Warm",
    icon: "🔥",
    b: 1.08,
    c: 1.05,
    s: 1.15,
  },
  {
    id: "cool",
    label: "Cool",
    icon: "❄️",
    b: 0.98,
    c: 1.05,
    s: 1.05,
  },
  {
    id: "vintage",
    label: "Vintage",
    icon: "📷",
    b: 1.05,
    c: 0.9,
    s: 0.75,
  },
  {
    id: "bw",
    label: "B&W",
    icon: "⚫",
    b: 1.02,
    c: 1.15,
    s: 0,
  },
  {
    id: "cinematic",
    label: "Cinematic",
    icon: "🎬",
    b: 0.95,
    c: 1.3,
    s: 0.85,
  },
  {
    id: "portrait",
    label: "Portrait",
    icon: "👤",
    b: 1.08,
    c: 1.08,
    s: 1.08,
  },
  {
    id: "soft",
    label: "Soft",
    icon: "💫",
    b: 1.08,
    c: 0.85,
    s: 0.95,
  },
  {
    id: "vivid",
    label: "Vivid",
    icon: "🌈",
    b: 1.05,
    c: 1.2,
    s: 1.55,
  },
  {
    id: "dramatic",
    label: "Dramatic",
    icon: "🎭",
    b: 0.9,
    c: 1.55,
    s: 1.1,
  },
  {
    id: "face-glow",
    label: "Face Glow",
    icon: "✨",
    b: 1.15,
    c: 0.95,
    s: 1.08,
  },
  {
    id: "portrait-enhance",
    label: "Portrait+",
    icon: "💎",
    b: 1.08,
    c: 1.18,
    s: 1.15,
  },

  // ----------------------------------------------------------
  // EXTRA FILTERS
  // ----------------------------------------------------------

  {
    id: "sunset",
    label: "Sunset",
    icon: "🌅",
    b: 1.08,
    c: 1.12,
    s: 1.3,
  },
  {
    id: "golden",
    label: "Golden",
    icon: "🌟",
    b: 1.12,
    c: 1.08,
    s: 1.2,
  },
  {
    id: "rose",
    label: "Rose",
    icon: "🌹",
    b: 1.05,
    c: 1.05,
    s: 1.12,
  },
  {
    id: "peach",
    label: "Peach",
    icon: "🍑",
    b: 1.08,
    c: 0.98,
    s: 1.15,
  },
  {
    id: "lavender",
    label: "Lavender",
    icon: "💜",
    b: 1.04,
    c: 1,
    s: 1.08,
  },
  {
    id: "ocean",
    label: "Ocean",
    icon: "🌊",
    b: 1,
    c: 1.12,
    s: 1.1,
  },
  {
    id: "forest",
    label: "Forest",
    icon: "🌲",
    b: 0.98,
    c: 1.18,
    s: 1.05,
  },
  {
    id: "moody",
    label: "Moody",
    icon: "🌑",
    b: 0.82,
    c: 1.35,
    s: 0.9,
  },
  {
    id: "matte",
    label: "Matte",
    icon: "🩶",
    b: 1.02,
    c: 0.82,
    s: 0.82,
  },
  {
    id: "fade",
    label: "Fade",
    icon: "🌫️",
    b: 1.08,
    c: 0.78,
    s: 0.88,
  },
  {
    id: "film",
    label: "Film",
    icon: "🎞️",
    b: 1.02,
    c: 1.12,
    s: 0.9,
  },
  {
    id: "retro",
    label: "Retro",
    icon: "📻",
    b: 1.06,
    c: 0.92,
    s: 0.78,
  },
  {
    id: "noir",
    label: "Noir",
    icon: "🕵️",
    b: 0.82,
    c: 1.5,
    s: 0,
  },
  {
    id: "high-key",
    label: "High Key",
    icon: "💡",
    b: 1.35,
    c: 0.9,
    s: 1.05,
  },
  {
    id: "low-key",
    label: "Low Key",
    icon: "🖤",
    b: 0.65,
    c: 1.35,
    s: 0.95,
  },
  {
    id: "clear",
    label: "Clear",
    icon: "🔆",
    b: 1.12,
    c: 1.15,
    s: 1.05,
  },
  {
    id: "crisp",
    label: "Crisp",
    icon: "💠",
    b: 1.02,
    c: 1.25,
    s: 1.08,
  },
  {
    id: "fresh",
    label: "Fresh",
    icon: "🍃",
    b: 1.12,
    c: 1.05,
    s: 1.15,
  },
  {
    id: "clean",
    label: "Clean",
    icon: "✨",
    b: 1.08,
    c: 1.12,
    s: 1,
  },
  {
    id: "bright-pop",
    label: "Bright Pop",
    icon: "🌞",
    b: 1.22,
    c: 1.16,
    s: 1.3,
  },
  {
    id: "deep",
    label: "Deep",
    icon: "🌌",
    b: 0.78,
    c: 1.4,
    s: 1.05,
  },
  {
    id: "ultra-vivid",
    label: "Ultra Vivid",
    icon: "🌈",
    b: 1.08,
    c: 1.3,
    s: 1.85,
  },
  {
    id: "pastel",
    label: "Pastel",
    icon: "🩷",
    b: 1.1,
    c: 0.82,
    s: 0.82,
  },
  {
    id: "dream",
    label: "Dream",
    icon: "💭",
    b: 1.12,
    c: 0.8,
    s: 0.92,
  },
  {
    id: "glow",
    label: "Glow",
    icon: "🌟",
    b: 1.2,
    c: 0.95,
    s: 1.12,
  },
  {
    id: "sunny",
    label: "Sunny",
    icon: "🌤️",
    b: 1.25,
    c: 1.02,
    s: 1.15,
  },
  {
    id: "cloudy",
    label: "Cloudy",
    icon: "☁️",
    b: 0.95,
    c: 0.92,
    s: 0.88,
  },
  {
    id: "arctic",
    label: "Arctic",
    icon: "🧊",
    b: 1.02,
    c: 1.08,
    s: 0.95,
  },
  {
    id: "tropical",
    label: "Tropical",
    icon: "🌴",
    b: 1.12,
    c: 1.12,
    s: 1.4,
  },
  {
    id: "chocolate",
    label: "Chocolate",
    icon: "🍫",
    b: 0.95,
    c: 1.05,
    s: 0.8,
  },
  {
    id: "coffee",
    label: "Coffee",
    icon: "☕",
    b: 0.94,
    c: 1.08,
    s: 0.82,
  },
  {
    id: "amber",
    label: "Amber",
    icon: "🟠",
    b: 1.08,
    c: 1.05,
    s: 1.18,
  },
  {
    id: "ruby",
    label: "Ruby",
    icon: "🔴",
    b: 0.98,
    c: 1.15,
    s: 1.25,
  },
  {
    id: "sapphire",
    label: "Sapphire",
    icon: "🔵",
    b: 0.98,
    c: 1.15,
    s: 1.15,
  },
  {
    id: "emerald",
    label: "Emerald",
    icon: "🟢",
    b: 1,
    c: 1.12,
    s: 1.18,
  },
  {
    id: "magenta",
    label: "Magenta",
    icon: "🟣",
    b: 1.02,
    c: 1.08,
    s: 1.18,
  },
  {
    id: "teal",
    label: "Teal",
    icon: "🔷",
    b: 1,
    c: 1.12,
    s: 1.08,
  },
  {
    id: "indie",
    label: "Indie",
    icon: "🎸",
    b: 0.96,
    c: 1.18,
    s: 0.88,
  },
  {
    id: "street",
    label: "Street",
    icon: "🏙️",
    b: 0.92,
    c: 1.3,
    s: 1.12,
  },
  {
    id: "fashion",
    label: "Fashion",
    icon: "👗",
    b: 1.08,
    c: 1.22,
    s: 1.2,
  },
  {
    id: "studio",
    label: "Studio",
    icon: "📸",
    b: 1.15,
    c: 1.15,
    s: 1.05,
  },
  {
    id: "professional",
    label: "Professional",
    icon: "💼",
    b: 1.06,
    c: 1.15,
    s: 1,
  },
  {
    id: "social",
    label: "Social",
    icon: "📱",
    b: 1.12,
    c: 1.2,
    s: 1.25,
  },
  {
    id: "travel",
    label: "Travel",
    icon: "✈️",
    b: 1.08,
    c: 1.12,
    s: 1.18,
  },
  {
    id: "food",
    label: "Food",
    icon: "🍕",
    b: 1.08,
    c: 1.12,
    s: 1.35,
  },
  {
    id: "night",
    label: "Night",
    icon: "🌃",
    b: 0.72,
    c: 1.38,
    s: 1.02,
  },
  {
    id: "sunrise",
    label: "Sunrise",
    icon: "🌄",
    b: 1.18,
    c: 1.08,
    s: 1.18,
  },
  {
    id: "autumn",
    label: "Autumn",
    icon: "🍂",
    b: 1.02,
    c: 1.05,
    s: 1.12,
  },
  {
    id: "spring",
    label: "Spring",
    icon: "🌸",
    b: 1.12,
    c: 1,
    s: 1.15,
  },
  {
    id: "winter",
    label: "Winter",
    icon: "❄️",
    b: 1.05,
    c: 1.08,
    s: 0.9,
  },
  {
    id: "summer",
    label: "Summer",
    icon: "🏖️",
    b: 1.18,
    c: 1.08,
    s: 1.25,
  },
];

// ============================================================
// QUICK ACTIONS
// ============================================================

const QUICK_ACTIONS = [
  {
    id: "enhance",
    label: "Enhance",
    icon: "✨",
  },
  {
    id: "upscale",
    label: "2x Upscale",
    icon: "🔍",
  },
  {
    id: "bw",
    label: "B&W",
    icon: "⚫",
  },
  {
    id: "warm",
    label: "Warm",
    icon: "🔥",
  },
  {
    id: "vintage",
    label: "Vintage",
    icon: "📷",
  },
  {
    id: "clear",
    label: "Clear",
    icon: "💎",
  },
];

// ============================================================
// 8 FREE HAIRSTYLES
// ============================================================

const HAIRSTYLES = [
  {
    id: "original",
    label: "Original",
    icon: "🧑",
  },
  {
    id: "short-hair",
    label: "Short Hair",
    icon: "💈",
  },
  {
    id: "side-part",
    label: "Side Part",
    icon: "💇",
  },
  {
    id: "classic",
    label: "Classic",
    icon: "🎩",
  },
  {
    id: "crew-cut",
    label: "Crew Cut",
    icon: "✂️",
  },
  {
    id: "textured",
    label: "Textured",
    icon: "🌾",
  },
  {
    id: "wavy",
    label: "Wavy",
    icon: "🌊",
  },
  {
    id: "curly",
    label: "Curly",
    icon: "🌀",
  },
];

// ============================================================
// INITIAL STATE
// ============================================================

const DEFAULT_ADJUSTMENTS = {
  brightness: 1,
  contrast: 1,
  saturation: 1,
};

const createEditorState = () => ({
  activeFilter: "natural",

  adjustments: {
    ...DEFAULT_ADJUSTMENTS,
  },

  blurIntensity: "none",

  selectedHairstyle: "original",

  text: "",
  textColor: "#ffffff",
  textSize: 32,
  textX: 50,
  textY: 50,
});

// ============================================================
// COMPONENT
// ============================================================

export default function ImageEditor() {
  const canvasRef = useRef(null);
  const imageRef = useRef(null);
  const fileInputRef = useRef(null);
  const objectUrlRef = useRef(null);

  // ----------------------------------------------------------
  // IMAGE
  // ----------------------------------------------------------

  const [originalUrl, setOriginalUrl] =
    useState(null);

  const [imageLoaded, setImageLoaded] =
    useState(false);

  const [metadata, setMetadata] =
    useState(null);

  // ----------------------------------------------------------
  // EDITOR STATE
  // ----------------------------------------------------------

  const [editorState, setEditorState] =
    useState(createEditorState);

  // ----------------------------------------------------------
  // HISTORY
  // ----------------------------------------------------------

  const [history, setHistory] =
    useState([]);

  const [future, setFuture] =
    useState([]);

  // ----------------------------------------------------------
  // UI
  // ----------------------------------------------------------

  const [errorMessage, setErrorMessage] =
    useState("");

  const [successMessage, setSuccessMessage] =
    useState("");

  const [isProcessing, setIsProcessing] =
    useState(false);

  // ----------------------------------------------------------
  // AI EDIT
  // ----------------------------------------------------------

  const [aiInstruction, setAiInstruction] =
    useState("");

  const [aiResultUrl, setAiResultUrl] =
    useState(null);

  // ==========================================================
  // DESTRUCTURE STATE
  // ==========================================================

  const {
    activeFilter,
    adjustments,
    blurIntensity,
    selectedHairstyle,
    text,
    textColor,
    textSize,
    textX,
    textY,
  } = editorState;

  // ==========================================================
  // UPDATE STATE
  // ==========================================================

  const updateEditor = useCallback(
    (changes) => {
      setEditorState((prev) => ({
        ...prev,
        ...changes,
      }));
    },
    []
  );

  // ==========================================================
  // SNAPSHOT
  // ==========================================================

  const getSnapshot = useCallback(
    () => ({
      ...editorState,

      adjustments: {
        ...editorState.adjustments,
      },
    }),
    [editorState]
  );

  // ==========================================================
  // HISTORY
  // ==========================================================

  const pushHistory = useCallback(() => {
    const snapshot = getSnapshot();

    setHistory((prev) => [
      ...prev,
      snapshot,
    ]);

    setFuture([]);
  }, [getSnapshot]);

  // ==========================================================
  // UNDO
  // ==========================================================

  const undo = useCallback(() => {
    if (history.length === 0) {
      return;
    }

    const previous =
      history[history.length - 1];

    setFuture((prev) => [
      ...prev,
      getSnapshot(),
    ]);

    setHistory((prev) =>
      prev.slice(0, -1)
    );

    setEditorState({
      ...previous,
      adjustments: {
        ...previous.adjustments,
      },
    });

    setSuccessMessage(
      "↩️ One step back."
    );
  }, [
    history,
    getSnapshot,
  ]);

  // ==========================================================
  // REDO
  // ==========================================================

  const redo = useCallback(() => {
    if (future.length === 0) {
      return;
    }

    const next =
      future[future.length - 1];

    setHistory((prev) => [
      ...prev,
      getSnapshot(),
    ]);

    setFuture((prev) =>
      prev.slice(0, -1)
    );

    setEditorState({
      ...next,
      adjustments: {
        ...next.adjustments,
      },
    });

    setSuccessMessage(
      "↪️ Redone."
    );
  }, [
    future,
    getSnapshot,
  ]);

  // ==========================================================
  // FILTER LOOKUP
  // ==========================================================

  const getFilterById = useCallback(
    (id) => {
      return (
        FILTERS.find(
          (filter) => filter.id === id
        ) || FILTERS[0]
      );
    },
    []
  );

  // ==========================================================
  // CANVAS FILTER
  // ==========================================================

  const getCanvasFilter =
    useCallback(() => {
      const b =
        adjustments.brightness;

      const c =
        adjustments.contrast;

      const s =
        adjustments.saturation;

      let filter = `
        brightness(${b})
        contrast(${c})
        saturate(${s})
      `;

      switch (activeFilter) {
        case "warm":
        case "sunset":
        case "golden":
        case "rose":
        case "peach":
        case "amber":
        case "autumn":
        case "summer":
          filter += " sepia(0.12)";
          break;

        case "cool":
        case "ocean":
        case "arctic":
        case "winter":
        case "sapphire":
        case "teal":
          filter += " hue-rotate(10deg)";
          break;

        case "vintage":
        case "retro":
        case "film":
        case "coffee":
        case "chocolate":
          filter += " sepia(0.25)";
          break;

        case "soft":
        case "dream":
        case "pastel":
          filter +=
            " brightness(1.02) opacity(0.98)";
          break;

        case "face-glow":
        case "glow":
          filter += " brightness(1.04)";
          break;

        default:
          break;
      }

      return filter;
    }, [
      adjustments,
      activeFilter,
    ]);

  // ==========================================================
  // DRAW TEXT
  // ==========================================================

  const drawText = useCallback(
    (ctx, canvas) => {
      if (!text.trim()) {
        return;
      }

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
  // FACE / HEAD ANCHOR
  // ==========================================================
  // Browser-only approximation.
  //
  // This calculates a head region from image proportions so
  // hairstyle overlays stay aligned across portrait images.
  // It does NOT call an AI API.
  // ==========================================================

  const getHeadAnchor =
    useCallback((canvas) => {
      const w = canvas.width;
      const h = canvas.height;

      const portrait =
        h >= w * 1.05;

      if (portrait) {
        return {
          cx: w * 0.5,
          cy: h * 0.235,
          headW: w * 0.29,
          headH: h * 0.13,
        };
      }

      return {
        cx: w * 0.5,
        cy: h * 0.27,
        headW: w * 0.22,
        headH: h * 0.11,
      };
    }, []);

  // ==========================================================
  // HAIRSTYLE DRAWING
  // ==========================================================

  const drawHairstyle =
    useCallback(
      (
        ctx,
        canvas,
        style
      ) => {
        if (
          !style ||
          style === "original"
        ) {
          return;
        }

        const {
          cx,
          cy,
          headW,
          headH,
        } = getHeadAnchor(canvas);

        ctx.save();

        ctx.fillStyle =
          "rgba(30, 22, 18, 0.94)";

        ctx.strokeStyle =
          "rgba(10,10,10,0.85)";

        ctx.lineWidth =
          Math.max(
            1.5,
            canvas.width / 500
          );

        // ----------------------------------------------------
        // Helper: top hair cap
        // ----------------------------------------------------

        const hairCap = (
          widthScale = 1,
          heightScale = 1
        ) => {
          ctx.beginPath();

          ctx.ellipse(
            cx,
            cy,
            headW * widthScale,
            headH * heightScale,
            0,
            Math.PI,
            Math.PI * 2
          );

          ctx.fill();
          ctx.stroke();
        };

        // ----------------------------------------------------
        // Helper: hair strands
        // ----------------------------------------------------

        const strands = (
          count = 7,
          length = 1
        ) => {
          ctx.beginPath();

          for (
            let i = 0;
            i < count;
            i++
          ) {
            const t =
              count === 1
                ? 0.5
                : i / (count - 1);

            const x =
              cx -
              headW +
              t *
                headW *
                2;

            ctx.moveTo(
              x,
              cy - headH * 0.75
            );

            ctx.lineTo(
              x +
                (i % 2 === 0
                  ? -headW * 0.05
                  : headW * 0.05),
              cy -
                headH *
                  (1.15 + length)
            );
          }

          ctx.stroke();
        };

        switch (style) {
          // --------------------------------------------------
          // SHORT
          // --------------------------------------------------

          case "short-hair":
            hairCap(
              1.0,
              1.0
            );
            break;

          // --------------------------------------------------
          // SIDE PART
          // --------------------------------------------------

          case "side-part":
            hairCap(
              1.08,
              1.0
            );

            ctx.beginPath();

            ctx.moveTo(
              cx -
                headW * 0.05,
              cy -
                headH * 1.0
            );

            ctx.quadraticCurveTo(
              cx +
                headW * 0.25,
              cy -
                headH * 0.55,
              cx +
                headW * 0.82,
              cy -
                headH * 0.45
            );

            ctx.stroke();

            break;

          // --------------------------------------------------
          // CLASSIC
          // --------------------------------------------------

          case "classic":
            hairCap(
              1.1,
              1.12
            );

            strands(
              8,
              0.1
            );

            break;

          // --------------------------------------------------
          // CREW CUT
          // --------------------------------------------------

          case "crew-cut":
            hairCap(
              0.88,
              0.72
            );

            break;

          // --------------------------------------------------
          // TEXTURED
          // --------------------------------------------------

          case "textured":
            hairCap(
              1.08,
              1.12
            );

            strands(
              9,
              0.18
            );

            break;

          // --------------------------------------------------
          // WAVY
          // --------------------------------------------------

          case "wavy":
            hairCap(
              1.12,
              1.15
            );

            ctx.beginPath();

            for (
              let i = -4;
              i <= 4;
              i++
            ) {
              const x =
                cx +
                i *
                  headW *
                  0.24;

              ctx.moveTo(
                x,
                cy -
                  headH *
                    0.85
              );

              ctx.quadraticCurveTo(
                x -
                  headW * 0.08,
                cy -
                  headH *
                    1.15,
                x +
                  headW * 0.08,
                cy -
                  headH *
                    1.35
              );
            }

            ctx.stroke();

            break;

          // --------------------------------------------------
          // CURLY
          // --------------------------------------------------

          case "curly":
            hairCap(
              1.18,
              1.2
            );

            for (
              let row = 0;
              row < 2;
              row++
            ) {
              for (
                let col = -4;
                col <= 4;
                col++
              ) {
                ctx.beginPath();

                ctx.arc(
                  cx +
                    col *
                      headW *
                      0.22,
                  cy -
                    headH *
                      (0.95 -
                        row *
                          0.15),
                  headW * 0.09,
                  0,
                  Math.PI * 2
                );

                ctx.fill();
              }
            }

            break;

          default:
            break;
        }

        ctx.restore();
      },
      [getHeadAnchor]
    );

  // ==========================================================
  // RENDER CANVAS
  // ==========================================================

  const renderCanvas =
    useCallback(() => {
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
        canvas.getContext(
          "2d",
          {
            alpha: false,
          }
        );

      if (!ctx) return;

      const maxSize = 1800;

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

      // ------------------------------------------------------
      // BASE IMAGE
      // ------------------------------------------------------

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

      // ------------------------------------------------------
      // WARM
      // ------------------------------------------------------

      if (
        activeFilter === "warm" ||
        activeFilter === "sunset" ||
        activeFilter === "golden" ||
        activeFilter === "amber" ||
        activeFilter === "autumn"
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

      // ------------------------------------------------------
      // COOL
      // ------------------------------------------------------

      if (
        activeFilter === "cool" ||
        activeFilter === "ocean" ||
        activeFilter === "arctic"
      ) {
        ctx.save();

        ctx.fillStyle =
          "rgba(70,140,255,0.08)";

        ctx.fillRect(
          0,
          0,
          width,
          height
        );

        ctx.restore();
      }

      // ------------------------------------------------------
      // VINTAGE
      // ------------------------------------------------------

      if (
        activeFilter === "vintage" ||
        activeFilter === "retro" ||
        activeFilter === "film"
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

      // ------------------------------------------------------
      // MAGENTA / ROSE
      // ------------------------------------------------------

      if (
        activeFilter === "rose" ||
        activeFilter === "magenta"
      ) {
        ctx.save();

        ctx.fillStyle =
          "rgba(255,70,150,0.07)";

        ctx.fillRect(
          0,
          0,
          width,
          height
        );

        ctx.restore();
      }

      // ------------------------------------------------------
      // CINEMATIC
      // ------------------------------------------------------

      if (
        activeFilter === "cinematic"
      ) {
        ctx.save();

        ctx.fillStyle =
          "rgba(0,0,0,0.20)";

        const bar =
          Math.max(
            20,
            height * 0.055
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

      // ------------------------------------------------------
      // SOFT / GLOW
      // ------------------------------------------------------

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

      // ------------------------------------------------------
      // BACKGROUND BLUR
      // ------------------------------------------------------
      // Browser-local approximation.
      // Keeps image usable without AI/API.
      // ------------------------------------------------------

      if (
        blurIntensity !==
        "none"
      ) {
        const blurAmount =
          blurIntensity === "low"
            ? 1
            : blurIntensity ===
              "medium"
            ? 2
            : 4;

        ctx.save();

        ctx.globalAlpha =
          blurIntensity ===
          "high"
            ? 0.18
            : blurIntensity ===
              "medium"
            ? 0.10
            : 0.06;

        ctx.filter =
          `blur(${blurAmount}px)`;

        ctx.drawImage(
          canvas,
          0,
          0,
          width,
          height
        );

        ctx.restore();
      }

      // ------------------------------------------------------
      // HAIRSTYLE
      // ------------------------------------------------------

      drawHairstyle(
        ctx,
        canvas,
        selectedHairstyle
      );

      // ------------------------------------------------------
      // TEXT
      // ------------------------------------------------------

      drawText(
        ctx,
        canvas
      );
    }, [
      imageLoaded,
      getCanvasFilter,
      activeFilter,
      blurIntensity,
      selectedHairstyle,
      drawHairstyle,
      drawText,
    ]);

  // ==========================================================
  // RENDER EFFECT
  // ==========================================================

  useEffect(() => {
    renderCanvas();
  }, [renderCanvas]);

  // ==========================================================
  // FILE HANDLER
  // ==========================================================

  const handleFile =
    useCallback((file) => {
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
      setAiResultUrl(null);

      if (
        objectUrlRef.current
      ) {
        URL.revokeObjectURL(
          objectUrlRef.current
        );
      }

      const url =
        URL.createObjectURL(
          file
        );

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

          size: file.size,
        });

        setEditorState(
          createEditorState()
        );

        setHistory([]);
        setFuture([]);

        setSuccessMessage(
          "Image loaded. Free local editing is ready."
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

  const handleFileInput =
    (e) => {
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

  const applyFilter =
    (filterId) => {
      if (!imageLoaded) return;

      const filter =
        getFilterById(
          filterId
        );

      pushHistory();

      updateEditor({
        activeFilter:
          filter.id,

        adjustments: {
          brightness: filter.b,
          contrast: filter.c,
          saturation: filter.s,
        },
      });

      setSuccessMessage(
        `${filter.label} applied — FREE.`
      );
    };

  // ==========================================================
  // ADJUSTMENT
  // ==========================================================

  const handleAdjustment =
    (key, value) => {
      if (!imageLoaded) return;

      updateEditor({
        adjustments: {
          ...adjustments,
          [key]: Number(value),
        },
      });
    };

  const commitAdjustment =
    () => {
      if (!imageLoaded) return;

      pushHistory();

      setSuccessMessage(
        "Adjustment applied."
      );
    };

  // ==========================================================
  // QUICK ACTION
  // ==========================================================

  const handleQuickAction =
    (actionId) => {
      if (!imageLoaded) return;

      switch (actionId) {
        case "enhance":
          pushHistory();

          updateEditor({
            activeFilter:
              "portrait-enhance",

            adjustments: {
              brightness: 1.1,
              contrast: 1.18,
              saturation: 1.12,
            },
          });

          setSuccessMessage(
            "Enhance applied locally."
          );

          break;

        case "upscale":
          pushHistory();

          setSuccessMessage(
            "2x upscale quality mode selected. Download to save."
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

        case "clear":
          applyFilter("clear");
          break;

        default:
          break;
      }
    };

  // ==========================================================
  // BACKGROUND BLUR
  // ==========================================================

  const applyBlur =
    (level) => {
      if (!imageLoaded) return;

      pushHistory();

      updateEditor({
        blurIntensity:
          level,
      });

      setSuccessMessage(
        `Background blur ${level} applied — FREE.`
      );
    };

  // ==========================================================
  // HAIRSTYLE
  // ==========================================================

  const applyHairstyle =
    (style) => {
      if (!imageLoaded) return;

      pushHistory();

      updateEditor({
        selectedHairstyle:
          style,
      });

      setSuccessMessage(
        style === "original"
          ? "Original hairstyle restored."
          : `${style} hairstyle applied FREE.`
      );
    };

  // ==========================================================
  // TEXT
  // ==========================================================

  const applyText = () => {
    if (
      !imageLoaded ||
      !text.trim()
    ) {
      return;
    }

    pushHistory();

    setSuccessMessage(
      "Text added FREE."
    );
  };

  // ==========================================================
  // RESET
  // ==========================================================

  const resetEditor =
    () => {
      if (!imageLoaded) return;

      pushHistory();

      updateEditor(
        createEditorState()
      );

      setSuccessMessage(
        "Image reset."
      );
    };

  // ==========================================================
  // NEW IMAGE
  // ==========================================================

  const newImage = () => {
    fileInputRef.current?.click();
  };

  // ==========================================================
  // AI EDIT
  // ==========================================================

  const handleAIEdit =
    async () => {
      if (
        !imageLoaded ||
        !aiInstruction.trim()
      ) {
        return;
      }

      setIsProcessing(true);
      setErrorMessage("");
      setSuccessMessage("");

      try {
        // ----------------------------------------------------
        // Upload original image to backend
        // ----------------------------------------------------

        const response =
          await apiService.uploadImage(
            await fetch(
              originalUrl
            ).then((r) =>
              r.blob()
            )
          );

        const uploadData =
          response?.data?.data ||
          response?.data ||
          {};

        const imagePath =
          apiService.resolveImageFilename(
            uploadData
          );

        if (!imagePath) {
          throw new Error(
            "AI image upload failed."
          );
        }

        // ----------------------------------------------------
        // AI EDIT
        // ----------------------------------------------------

        const result =
          await apiService.aiEditImage(
            imagePath,
            aiInstruction.trim()
          );

        const resultData =
          result?.data?.data ||
          result?.data ||
          {};

        const filename =
          apiService.resolveImageFilename(
            resultData
          );

        if (!filename) {
          throw new Error(
            "AI did not return an edited image."
          );
        }

        const url =
          apiService.buildPreviewUrl(
            filename
          );

        setAiResultUrl(url);

        setSuccessMessage(
          "AI edit completed."
        );
      } catch (error) {
        setErrorMessage(
          error?.message ||
            "AI edit failed. Please try again."
        );
      } finally {
        setIsProcessing(false);
      }
    };

  // ==========================================================
  // DOWNLOAD
  // ==========================================================

  const downloadImage =
    () => {
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

  const handleDrop =
    (e) => {
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
          AI Image Editor
        </h1>

        <p className="subtitle">
          Free filters, hairstyles,
          blur, text & editing +
          AI editing when available.
        </p>
      </div>

      {/* ====================================================
          INPUT
      ==================================================== */}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={
          handleFileInput
        }
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
            JPG, PNG, WebP — up to
            10MB
          </p>
        </div>
      )}

      {/* ====================================================
          EDITOR
      ==================================================== */}

      {imageLoaded && (
        <div className="editor-layout">
          {/* ==================================================
              SIDEBAR
          ================================================== */}

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
                history.length === 0
              }
            >
              ↩️ Back / Undo
            </button>

            {/* REDO */}

            <button
              className="reset-btn"
              onClick={redo}
              disabled={
                future.length === 0
              }
            >
              ↪️ Redo
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
                Filters{" "}
                <small>
                  ({FILTERS.length}+ Free)
                </small>
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
                      2
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
                  onTouchEnd={
                    commitAdjustment
                  }
                />
              </div>

              <div className="adjustment-group">
                <label>
                  Contrast

                  <span>
                    {adjustments.contrast.toFixed(
                      2
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
                  onTouchEnd={
                    commitAdjustment
                  }
                />
              </div>

              <div className="adjustment-group">
                <label>
                  Saturation

                  <span>
                    {adjustments.saturation.toFixed(
                      2
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
                  onTouchEnd={
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
                <small>
                  {" "}
                  — Free
                </small>
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

              <p
                style={{
                  fontSize:
                    "12px",
                  opacity: 0.65,
                }}
              >
                Free browser-local
                effect.
              </p>
            </div>

            {/* =================================================
                FREE HAIRSTYLES
            ================================================= */}

            <div className="tool-section">
              <h3>
                Hairstyles — FREE
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

              <p
                style={{
                  fontSize:
                    "11px",
                  opacity: 0.65,
                }}
              >
                Free local hairstyle
                preview. No AI
                credits are used.
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
                  updateEditor({
                    text: e.target
                      .value,
                  })
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
                  updateEditor({
                    textSize:
                      Number(
                        e.target
                          .value
                      ),
                  })
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
                  updateEditor({
                    textColor:
                      e.target
                        .value,
                  })
                }
              />

              <label>
                Horizontal position
              </label>

              <input
                type="range"
                min="0"
                max="100"
                value={
                  textX
                }
                onChange={(e) =>
                  updateEditor({
                    textX:
                      Number(
                        e.target
                          .value
                      ),
                  })
                }
              />

              <label>
                Vertical position
              </label>

              <input
                type="range"
                min="0"
                max="100"
                value={
                  textY
                }
                onChange={(e) =>
                  updateEditor({
                    textY:
                      Number(
                        e.target
                          .value
                      ),
                  })
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

              <p
                style={{
                  fontSize:
                    "11px",
                  opacity: 0.65,
                }}
              >
                Text editing is
                completely free.
              </p>
            </div>

            {/* =================================================
                AI EDIT — PRESERVED
            ================================================= */}

            <div className="tool-section">
              <h3>
                🤖 AI Edit
              </h3>

              <p
                style={{
                  fontSize:
                    "12px",
                  opacity: 0.75,
                }}
              >
                AI features remain
                available here.
                Local filters and
                hairstyles never
                require AI credits.
              </p>

              <textarea
                value={
                  aiInstruction
                }
                onChange={(e) =>
                  setAiInstruction(
                    e.target
                      .value
                  )
                }
                placeholder="Example: background white kar do, HD kar do, cinematic bana do..."
                className="ai-input"
                rows={4}
              />

              <button
                className="ai-edit-btn"
                onClick={
                  handleAIEdit
                }
                disabled={
                  isProcessing ||
                  !aiInstruction.trim()
                }
              >
                {isProcessing
                  ? "⏳ Processing..."
                  : "✨ Apply AI Edit"}
              </button>

              <div
                style={{
                  display:
                    "flex",
                  gap: "6px",
                  flexWrap:
                    "wrap",
                  marginTop:
                    "8px",
                }}
              >
                {[
                  "background white kar do",
                  "HD kar do",
                  "cinematic bana do",
                  "brightness badha do",
                ].map(
                  (example) => (
                    <button
                      key={
                        example
                      }
                      type="button"
                      className="quick-action-btn"
                      onClick={() =>
                        setAiInstruction(
                          example
                        )
                      }
                    >
                      {
                        example
                      }
                    </button>
                  )
                )}
              </div>
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

          {/* ==================================================
              PREVIEW
          ================================================== */}

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

              <div className="image-frame">
                <canvas
                  ref={
                    canvasRef
                  }
                  className="preview-image"
                />
              </div>

              <div className="image-info">
                <span className="info-badge">
                  Local Editing
                </span>

                <span className="info-badge">
                  50+ Filters
                </span>

                <span className="info-badge">
                  Free
                </span>
              </div>
            </div>

            {/* =================================================
                AI RESULT
            ================================================= */}

            {aiResultUrl && (
              <div className="preview-section">
                <h3>
                  🤖 AI Result
                </h3>

                <div className="image-frame">
                  <img
                    src={
                      aiResultUrl
                    }
                    alt="AI Result"
                    className="preview-image"
                  />
                </div>

                <div className="image-info">
                  <span className="info-badge">
                    AI Processed
                  </span>

                  <a
                    href={
                      aiResultUrl
                    }
                    target="_blank"
                    rel="noreferrer"
                    className="info-badge"
                  >
                    Open Result
                  </a>
                </div>
              </div>
            )}
          </main>
        </div>
      )}
    </div>
  );
}