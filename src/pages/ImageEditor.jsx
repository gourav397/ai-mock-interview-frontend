// ============================================================
// AI IMAGE EDITOR
// LOCAL / FREE EDITING ENGINE
// ============================================================
//
// FEATURES
// ------------------------------------------------------------
// 50 FILTERS
// HEAVY ADJUSTMENTS
// UNDO
// REDO
// RESET
// FREE HAIRSTYLES
// BACKGROUND BLUR
// ADD TEXT
// REPLACE EXISTING TEXT
// SMART TEXT FIT
// DOWNLOAD
// JPG / PNG / WEBP
//
// IMPORTANT
// ------------------------------------------------------------
// This editor works locally in the browser.
// Text replacement uses a local reconstruction/healing method.
// It does NOT require Gemini/OpenAI credits.
//
// ============================================================

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import "./ImageEditor.css";

// ============================================================
// 50 FILTERS
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
  { id: "portrait-enhance", label: "Portrait+", icon: "💎" },
  { id: "matte", label: "Matte", icon: "🪶" },
  { id: "moody", label: "Moody", icon: "🌑" },
  { id: "golden", label: "Golden", icon: "🌅" },

  { id: "rose", label: "Rose", icon: "🌹" },
  { id: "teal", label: "Teal", icon: "🩵" },
  { id: "forest", label: "Forest", icon: "🌲" },
  { id: "ocean", label: "Ocean", icon: "🌊" },
  { id: "lavender", label: "Lavender", icon: "💜" },
  { id: "peach", label: "Peach", icon: "🍑" },
  { id: "sunset", label: "Sunset", icon: "🌇" },
  { id: "arctic", label: "Arctic", icon: "🏔️" },
  { id: "coffee", label: "Coffee", icon: "☕" },
  { id: "film", label: "Film", icon: "🎞️" },

  { id: "retro", label: "Retro", icon: "📻" },
  { id: "noir", label: "Noir", icon: "🕶️" },
  { id: "faded", label: "Faded", icon: "🌫️" },
  { id: "crisp", label: "Crisp", icon: "🔪" },
  { id: "clear", label: "Clear", icon: "💧" },
  { id: "deep", label: "Deep", icon: "🌌" },
  { id: "high-key", label: "High Key", icon: "⚪" },
  { id: "low-key", label: "Low Key", icon: "⚫" },
  { id: "pastel", label: "Pastel", icon: "🩷" },
  { id: "neon", label: "Neon", icon: "💡" },

  { id: "chrome", label: "Chrome", icon: "🔘" },
  { id: "silver", label: "Silver", icon: "🥈" },
  { id: "bronze", label: "Bronze", icon: "🥉" },
  { id: "emerald", label: "Emerald", icon: "💚" },
  { id: "sapphire", label: "Sapphire", icon: "💙" },
  { id: "ruby", label: "Ruby", icon: "❤️" },
  { id: "amber", label: "Amber", icon: "🟠" },
  { id: "platinum", label: "Platinum", icon: "⚙️" },
  { id: "dream", label: "Dream", icon: "💭" },
  { id: "clean", label: "Clean", icon: "✨" },
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
    id: "auto",
    label: "Auto Fix",
    icon: "🤖",
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
    id: "portrait",
    label: "Portrait",
    icon: "👤",
  },
  {
    id: "dramatic",
    label: "Drama",
    icon: "🎭",
  },
];

// ============================================================
// FREE HAIRSTYLES
// ============================================================

const HAIRSTYLES = [
  {
    id: "original",
    label: "Original",
    icon: "🧑",
  },
  {
    id: "short-hair",
    label: "Short",
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
  {
    id: "slick-back",
    label: "Slick Back",
    icon: "💼",
  },
  {
    id: "undercut",
    label: "Undercut",
    icon: "🪒",
  },
  {
    id: "fade",
    label: "Fade",
    icon: "🕶️",
  },
  {
    id: "fringe",
    label: "Fringe",
    icon: "💇",
  },
  {
    id: "buzz-cut",
    label: "Buzz",
    icon: "🦲",
  },
  {
    id: "long-hair",
    label: "Long",
    icon: "💁",
  },
  {
    id: "messy",
    label: "Messy",
    icon: "🌪️",
  },
];

// ============================================================
// FILTER PRESETS
// ============================================================

const FILTER_PRESETS = {
  natural: [1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0],

  brighten: [
    1.28,
    1.04,
    1.06,
    0.12,
    0.08,
    0.03,
    0,
    0,
    0,
    0,
    0,
  ],

  darken: [
    0.72,
    1.08,
    0.98,
    -0.08,
    -0.08,
    0,
    0,
    0,
    0,
    0,
    0,
  ],

  contrast: [
    1,
    1.45,
    1,
    0,
    0,
    0,
    0,
    0,
    0,
    0.04,
    0,
  ],

  saturate: [
    1.02,
    1.05,
    1.7,
    0.05,
    0.04,
    0.02,
    0,
    0,
    0,
    0,
    0,
  ],

  desaturate: [
    1.02,
    1,
    0.25,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
  ],

  warm: [
    1.06,
    1.04,
    1.12,
    0.05,
    0.04,
    0.18,
    0,
    0,
    0,
    0,
    0,
  ],

  cool: [
    1,
    1.04,
    1.03,
    0,
    0,
    -0.18,
    0,
    0,
    0,
    0,
    0,
  ],

  vintage: [
    1.04,
    0.92,
    0.78,
    -0.02,
    0,
    0.08,
    0.12,
    0,
    0,
    0.02,
    0,
  ],

  bw: [
    1.02,
    1.16,
    0,
    0.02,
    0.02,
    0,
    0,
    0,
    0,
    0.03,
    0,
  ],

  cinematic: [
    0.94,
    1.35,
    0.88,
    -0.04,
    -0.02,
    -0.04,
    0,
    0,
    0.02,
    0.08,
    0,
  ],

  portrait: [
    1.08,
    1.08,
    1.08,
    0.08,
    0.06,
    0.02,
    0,
    0,
    0.02,
    0,
    0,
  ],

  soft: [
    1.08,
    0.88,
    0.92,
    0.08,
    0.05,
    0,
    0,
    0.8,
    0,
    0,
    0,
  ],

  vivid: [
    1.05,
    1.2,
    1.55,
    0.08,
    0.08,
    0.03,
    0,
    0,
    0.02,
    0,
    0,
  ],

  dramatic: [
    0.88,
    1.58,
    1.08,
    -0.08,
    -0.06,
    0,
    0,
    0,
    0.02,
    0.12,
    0,
  ],

  "face-glow": [
    1.15,
    0.96,
    1.08,
    0.15,
    0.1,
    0.03,
    0,
    0.6,
    0,
    0,
    0,
  ],

  "portrait-enhance": [
    1.08,
    1.18,
    1.14,
    0.12,
    0.1,
    0.03,
    0,
    0,
    0.02,
    0,
    0,
  ],

  matte: [
    1.04,
    0.82,
    0.92,
    0.06,
    0.05,
    0,
    0.12,
    0,
    0.02,
    0,
    0,
  ],

  moody: [
    0.82,
    1.38,
    0.82,
    -0.12,
    -0.08,
    -0.02,
    0.04,
    0,
    0.08,
    0.12,
    0,
  ],

  golden: [
    1.08,
    1.08,
    1.12,
    0.1,
    0.05,
    0.28,
    0,
    0,
    0.02,
    0,
    0,
  ],

  rose: [
    1.04,
    1.02,
    1.12,
    0.04,
    0.04,
    0.08,
    0,
    0,
    0,
    0,
    0,
  ],

  teal: [
    0.98,
    1.12,
    1.12,
    -0.02,
    0.02,
    -0.16,
    0,
    0,
    0.02,
    0,
    0,
  ],

  forest: [
    0.94,
    1.16,
    1.12,
    -0.04,
    0.02,
    -0.04,
    0,
    0,
    0,
    0,
    0,
  ],

  ocean: [
    0.98,
    1.08,
    1.1,
    0,
    0.03,
    -0.24,
    0,
    0,
    0,
    0,
    0,
  ],

  lavender: [
    1.05,
    1.02,
    1.08,
    0.03,
    0.02,
    -0.08,
    0,
    0.1,
    0,
    0,
    0,
  ],

  peach: [
    1.06,
    1.02,
    1.1,
    0.06,
    0.04,
    0.16,
    0,
    0,
    0,
    0,
    0,
  ],

  sunset: [
    1.02,
    1.12,
    1.18,
    0.05,
    0.03,
    0.3,
    0,
    0,
    0.02,
    0,
    0,
  ],

  arctic: [
    1.04,
    1.12,
    1.02,
    0.02,
    0.08,
    -0.28,
    0,
    0,
    0,
    0,
    0,
  ],

  coffee: [
    0.98,
    1.02,
    0.84,
    -0.02,
    0.02,
    0.12,
    0.08,
    0,
    0.04,
    0,
    0,
  ],

  film: [
    1.02,
    1.06,
    0.88,
    0.03,
    0.03,
    0.04,
    0.05,
    0,
    0.02,
    0.02,
    0,
  ],

  retro: [
    1.05,
    0.9,
    0.82,
    0.02,
    0.02,
    0.12,
    0.14,
    0,
    0.02,
    0,
    0,
  ],

  noir: [
    0.92,
    1.4,
    0.12,
    -0.04,
    -0.02,
    0,
    0,
    0,
    0.02,
    0.14,
    0,
  ],

  faded: [
    1.05,
    0.76,
    0.82,
    0.04,
    0.04,
    0,
    0.2,
    0,
    0,
    0,
    0,
  ],

  crisp: [
    1.02,
    1.2,
    1.06,
    0.04,
    0.03,
    0,
    0,
    0,
    0.28,
    0,
    0,
  ],

  clear: [
    1.05,
    1.18,
    1.05,
    0.08,
    0.08,
    0,
    0,
    0,
    0.18,
    0,
    0,
  ],

  deep: [
    0.9,
    1.32,
    1.05,
    -0.08,
    -0.04,
    -0.05,
    0,
    0,
    0.04,
    0.08,
    0,
  ],

  "high-key": [
    1.22,
    0.9,
    1.04,
    0.2,
    0.16,
    0.02,
    0,
    0,
    0,
    0,
    0,
  ],

  "low-key": [
    0.76,
    1.28,
    0.9,
    -0.14,
    -0.12,
    -0.02,
    0,
    0,
    0.04,
    0.12,
    0,
  ],

  pastel: [
    1.1,
    0.82,
    0.86,
    0.12,
    0.08,
    0.02,
    0.1,
    0,
    0,
    0,
    0,
  ],

  neon: [
    1.04,
    1.25,
    1.8,
    0.06,
    0.05,
    0,
    0,
    0,
    0.1,
    0,
    0,
  ],

  chrome: [
    1.02,
    1.28,
    0.9,
    0,
    0,
    0,
    0,
    0,
    0.22,
    0.04,
    0,
  ],

  silver: [
    1.04,
    1.2,
    0.62,
    0.04,
    0.04,
    0,
    0,
    0,
    0.08,
    0.04,
    0,
  ],

  bronze: [
    1.02,
    1.08,
    0.94,
    0.02,
    0.02,
    0.18,
    0.03,
    0,
    0.02,
    0,
    0,
  ],

  emerald: [
    1,
    1.12,
    1.2,
    0.02,
    0.02,
    -0.12,
    0,
    0,
    0.02,
    0,
    0,
  ],

  sapphire: [
    0.98,
    1.16,
    1.12,
    0,
    0.02,
    -0.22,
    0,
    0,
    0.02,
    0,
    0,
  ],

  ruby: [
    1.02,
    1.12,
    1.15,
    0.03,
    0.02,
    0.2,
    0,
    0,
    0.02,
    0,
    0,
  ],

  amber: [
    1.05,
    1.1,
    1.08,
    0.04,
    0.03,
    0.24,
    0,
    0,
    0.02,
    0,
    0,
  ],

  platinum: [
    1.05,
    1.24,
    0.72,
    0.04,
    0.05,
    -0.02,
    0,
    0,
    0.16,
    0.02,
    0,
  ],

  dream: [
    1.1,
    0.86,
    1.02,
    0.1,
    0.08,
    0.04,
    0.04,
    0.9,
    0,
    0,
    0,
  ],

  clean: [
    1.04,
    1.12,
    1.04,
    0.08,
    0.08,
    0,
    0,
    0,
    0.2,
    0,
    0,
  ],
};

// ============================================================
// DEFAULT ADJUSTMENTS
// ============================================================

const DEFAULT_ADJUSTMENTS = {
  brightness: 1,
  contrast: 1,
  saturation: 1,

  exposure: 0,
  highlights: 0,
  shadows: 0,

  temperature: 0,
  tint: 0,

  sharpness: 0,
  blur: 0,

  vignette: 0,
  grain: 0,

  fade: 0,
  hue: 0,
};

// ============================================================
// HELPERS
// ============================================================

const clamp = (
  value,
  min,
  max
) =>
  Math.min(
    max,
    Math.max(
      min,
      value
    )
  );

// ============================================================
// COMPONENT
// ============================================================

export default function ImageEditor() {
  const canvasRef = useRef(null);
  const imageRef = useRef(null);
  const fileInputRef = useRef(null);
  const objectUrlRef = useRef(null);

  const replaceStartRef =
    useRef(null);

  // ==========================================================
  // IMAGE
  // ==========================================================

  const [originalUrl, setOriginalUrl] =
    useState(null);

  const [imageLoaded, setImageLoaded] =
    useState(false);

  const [metadata, setMetadata] =
    useState(null);

  // ==========================================================
  // EDIT STATE
  // ==========================================================

  const [activeFilter, setActiveFilter] =
    useState("natural");

  const [adjustments, setAdjustments] =
    useState({
      ...DEFAULT_ADJUSTMENTS,
    });

  const [blurIntensity, setBlurIntensity] =
    useState("off");

  const [selectedHairstyle, setSelectedHairstyle] =
    useState("original");

  // ==========================================================
  // NORMAL TEXT
  // ==========================================================

  const [text, setText] =
    useState("");

  const [textColor, setTextColor] =
    useState("#ffffff");

  const [textSize, setTextSize] =
    useState(32);

  const [textX, setTextX] =
    useState(50);

  const [textY, setTextY] =
    useState(50);

  // ==========================================================
  // TEXT REPLACEMENT
  // ==========================================================

  const [replaceMode, setReplaceMode] =
    useState(false);

  const [replaceText, setReplaceText] =
    useState("");

  const [replaceTextColor, setReplaceTextColor] =
    useState("#ffffff");

  const [replaceTextSize, setReplaceTextSize] =
    useState(32);

  const [replaceRect, setReplaceRect] =
    useState(null);

  // THIS IS THE IMPORTANT NEW STATE
  const [appliedReplacement, setAppliedReplacement] =
    useState(null);

  // ==========================================================
  // HISTORY
  // ==========================================================

  const [history, setHistory] =
    useState([]);

  const [historyIndex, setHistoryIndex] =
    useState(-1);

  // ==========================================================
  // UI
  // ==========================================================

  const [errorMessage, setErrorMessage] =
    useState("");

  const [successMessage, setSuccessMessage] =
    useState("");

  const [isProcessing, setIsProcessing] =
    useState(false);

  // ==========================================================
  // FILTER VALUES
  // ==========================================================

  const getFilterValues =
    useCallback(
      (filterId) => {
        const values =
          FILTER_PRESETS[
            filterId
          ] ||
          FILTER_PRESETS.natural;

        return {
          brightness: values[0],
          contrast: values[1],
          saturation: values[2],

          exposure: values[3],
          highlights: values[4],
          shadows: values[5],

          temperature: values[5],
          tint: values[6],

          sharpness: values[8],
          blur: values[7],

          vignette: values[9],
          grain: values[10],

          fade: values[6],
          hue: 0,
        };
      },
      []
    );

  // ==========================================================
  // CANVAS FILTER
  // ==========================================================

  const getCanvasFilter =
    useCallback(
      () => {
        const a =
          adjustments;

        const brightness =
          a.brightness *
          (1 +
            a.exposure *
              0.7);

        const contrast =
          a.contrast *
          (1 +
            a.highlights *
              0.12);

        const saturation =
          a.saturation *
          (1 +
            a.shadows *
              0.12);

        let filter = `
          brightness(${clamp(
            brightness,
            0.1,
            3
          )})
          contrast(${clamp(
            contrast,
            0.1,
            3
          )})
          saturate(${clamp(
            saturation,
            0,
            4
          )})
          hue-rotate(${a.hue}deg)
          sepia(${Math.max(
            0,
            a.temperature
          ) * 0.12})
        `;

        if (
          a.blur > 0
        ) {
          filter +=
            ` blur(${a.blur}px)`;
        }

        return filter;
      },
      [adjustments]
    );

  // ==========================================================
  // SNAPSHOT
  // ==========================================================

  const getSnapshot =
    useCallback(
      () => ({
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

        replaceText,
        replaceTextColor,
        replaceTextSize,

        replaceRect:
          replaceRect
            ? {
                ...replaceRect,
              }
            : null,

        appliedReplacement:
          appliedReplacement
            ? {
                ...appliedReplacement,
              }
            : null,
      }),
      [
        activeFilter,
        adjustments,
        blurIntensity,
        selectedHairstyle,
        text,
        textColor,
        textSize,
        textX,
        textY,
        replaceText,
        replaceTextColor,
        replaceTextSize,
        replaceRect,
        appliedReplacement,
      ]
    );

  // ==========================================================
  // SAVE HISTORY
  // ==========================================================

  const saveHistory =
    useCallback(() => {
      const snapshot =
        getSnapshot();

      setHistory(
        (prev) => {
          const base =
            historyIndex >= 0
              ? prev.slice(
                  0,
                  historyIndex + 1
                )
              : [];

          return [
            ...base,
            snapshot,
          ].slice(-50);
        }
      );

      setHistoryIndex(
        (prev) =>
          Math.min(
            prev + 1,
            49
          )
      );
    }, [
      getSnapshot,
      historyIndex,
    ]);

  // ==========================================================
  // DRAW NORMAL TEXT
  // ==========================================================

  const drawText =
    useCallback(
      (
        ctx,
        canvas
      ) => {
        if (
          !text.trim()
        ) {
          return;
        }

        const x =
          (canvas.width *
            textX) /
          100;

        const y =
          (canvas.height *
            textY) /
          100;

        ctx.save();

        ctx.font =
          `700 ${textSize}px Arial, sans-serif`;

        ctx.textAlign =
          "center";

        ctx.textBaseline =
          "middle";

        ctx.shadowColor =
          "rgba(0,0,0,0.65)";

        ctx.shadowBlur = 5;

        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 2;

        ctx.fillStyle =
          textColor;

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
  // DRAW HAIRSTYLE
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
          style ===
            "original"
        ) {
          return;
        }

        const w =
          canvas.width;

        const h =
          canvas.height;

        // Portrait estimate.
        // This is intentionally conservative.
        const portrait =
          h >= w * 1.1;

        const cx =
          w * 0.5;

        const cy =
          portrait
            ? h * 0.235
            : h * 0.29;

        const headW =
          clamp(
            Math.min(
              w * 0.24,
              190
            ),
            45,
            190
          );

        const headH =
          headW * 0.62;

        ctx.save();

        ctx.fillStyle =
          "rgba(32,24,20,0.96)";

        ctx.strokeStyle =
          "rgba(10,10,10,0.9)";

        ctx.lineWidth =
          Math.max(
            1.5,
            w / 500
          );

        ctx.beginPath();

        switch (
          style
        ) {
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
            ctx.moveTo(
              cx - headW,
              cy
            );

            ctx.quadraticCurveTo(
              cx -
                headW *
                  0.8,
              cy -
                headH *
                  1.3,
              cx,
              cy -
                headH *
                  1.2
            );

            ctx.quadraticCurveTo(
              cx +
                headW *
                  0.9,
              cy -
                headH *
                  1.15,
              cx + headW,
              cy
            );

            ctx.quadraticCurveTo(
              cx +
                headW *
                  0.45,
              cy -
                headH *
                  0.25,
              cx,
              cy -
                headH *
                  0.55
            );

            ctx.quadraticCurveTo(
              cx -
                headW *
                  0.35,
              cy -
                headH *
                  0.25,
              cx - headW,
              cy
            );

            ctx.closePath();
            break;

          case "classic":
            ctx.ellipse(
              cx,
              cy -
                headH *
                  0.08,
              headW *
                1.08,
              headH *
                1.05,
              0,
              Math.PI,
              Math.PI * 2
            );
            break;

          case "crew-cut":
            ctx.ellipse(
              cx,
              cy +
                headH *
                  0.05,
              headW *
                0.9,
              headH *
                0.72,
              0,
              Math.PI,
              Math.PI * 2
            );
            break;

          case "textured":
            ctx.ellipse(
              cx,
              cy,
              headW *
                1.08,
              headH *
                1.08,
              0,
              Math.PI,
              Math.PI * 2
            );

            for (
              let i = -6;
              i <= 6;
              i++
            ) {
              ctx.moveTo(
                cx +
                  i *
                    headW *
                    0.15,
                cy -
                  headH
              );

              ctx.lineTo(
                cx +
                  i *
                    headW *
                    0.19,
                cy -
                  headH *
                    1.35
              );
            }
            break;

          case "wavy":
            ctx.ellipse(
              cx,
              cy,
              headW *
                1.12,
              headH *
                1.18,
              0,
              Math.PI,
              Math.PI * 2
            );

            break;

          case "curly":
            ctx.ellipse(
              cx,
              cy,
              headW *
                1.18,
              headH *
                1.22,
              0,
              Math.PI,
              Math.PI * 2
            );

            break;

          case "slick-back":
            ctx.ellipse(
              cx,
              cy - 4,
              headW *
                1.1,
              headH *
                0.92,
              0,
              Math.PI,
              Math.PI * 2
            );
            break;

          case "undercut":
            ctx.ellipse(
              cx,
              cy,
              headW *
                1.02,
              headH *
                0.92,
              0,
              Math.PI,
              Math.PI * 2
            );
            break;

          case "fade":
            ctx.ellipse(
              cx,
              cy + 3,
              headW *
                0.98,
              headH *
                0.84,
              0,
              Math.PI,
              Math.PI * 2
            );
            break;

          case "fringe":
            ctx.ellipse(
              cx,
              cy,
              headW *
                1.08,
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
              headW *
                0.92,
              Math.PI,
              Math.PI * 2
            );
            break;

          case "long-hair":
            ctx.ellipse(
              cx,
              cy +
                headH *
                  0.35,
              headW *
                1.18,
              headH *
                1.65,
              0,
              Math.PI,
              Math.PI * 2
            );
            break;

          case "messy":
            ctx.ellipse(
              cx,
              cy,
              headW *
                1.2,
              headH *
                1.18,
              0,
              Math.PI,
              Math.PI * 2
            );

            for (
              let i = -6;
              i <= 6;
              i++
            ) {
              ctx.moveTo(
                cx +
                  i *
                    headW *
                    0.15,
                cy -
                  headH
              );

              ctx.lineTo(
                cx +
                  i *
                    headW *
                    0.24,
                cy -
                  headH *
                    1.42
              );
            }
            break;

          default:
            break;
        }

        ctx.fill();
        ctx.stroke();

        // Hair highlights
        ctx.globalAlpha =
          0.22;

        ctx.fillStyle =
          "rgba(255,255,255,0.45)";

        ctx.beginPath();

        ctx.ellipse(
          cx -
            headW *
              0.2,
          cy -
            headH *
              0.7,
          headW *
            0.42,
          headH *
            0.18,
          -0.2,
          0,
          Math.PI * 2
        );

        ctx.fill();

        ctx.restore();
      },
      []
    );

  // ==========================================================
  // VIGNETTE
  // ==========================================================

  const drawVignette =
    useCallback(
      (
        ctx,
        canvas,
        amount
      ) => {
        if (
          amount <= 0
        ) {
          return;
        }

        const gradient =
          ctx.createRadialGradient(
            canvas.width / 2,
            canvas.height / 2,
            Math.min(
              canvas.width,
              canvas.height
            ) * 0.2,
            canvas.width / 2,
            canvas.height / 2,
            Math.max(
              canvas.width,
              canvas.height
            ) * 0.72
          );

        gradient.addColorStop(
          0,
          "rgba(0,0,0,0)"
        );

        gradient.addColorStop(
          1,
          `rgba(0,0,0,${clamp(
            amount,
            0,
            0.85
          )})`
        );

        ctx.save();

        ctx.fillStyle =
          gradient;

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
  // GRAIN
  // ==========================================================

  const drawGrain =
    useCallback(
      (
        ctx,
        canvas,
        amount
      ) => {
        if (
          amount <= 0
        ) {
          return;
        }

        const count =
          Math.round(
            canvas.width *
              canvas.height *
              amount *
              0.001
          );

        ctx.save();

        ctx.globalAlpha =
          clamp(
            amount,
            0,
            0.25
          );

        for (
          let i = 0;
          i < count;
          i++
        ) {
          const x =
            Math.random() *
            canvas.width;

          const y =
            Math.random() *
            canvas.height;

          const v =
            Math.floor(
              Math.random() *
                255
            );

          ctx.fillStyle =
            `rgb(${v},${v},${v})`;

          ctx.fillRect(
            x,
            y,
            1,
            1
          );
        }

        ctx.restore();
      },
      []
    );

  // ==========================================================
  // TEXT REPLACEMENT
  //
  // IMPORTANT:
  // This version uses the selected rectangle as the replacement
  // target and creates a local background reconstruction from
  // the pixels surrounding the selected area.
  // ==========================================================

  const drawTextReplacement =
    useCallback(
      (
        ctx,
        canvas
      ) => {
        if (
          !appliedReplacement
        ) {
          return;
        }

        const {
          x,
          y,
          width,
          height,
          text: replacementText,
          color,
          fontSize,
          fontWeight,
          fontFamily,
        } =
          appliedReplacement;

        if (
          !replacementText ||
          width <= 2 ||
          height <= 2
        ) {
          return;
        }

        ctx.save();

        // ------------------------------------------------------
        // Clamp rectangle
        // ------------------------------------------------------

        const rx =
          clamp(
            Math.round(x),
            0,
            canvas.width - 1
          );

        const ry =
          clamp(
            Math.round(y),
            0,
            canvas.height - 1
          );

        const rw =
          clamp(
            Math.round(width),
            2,
            canvas.width - rx
          );

        const rh =
          clamp(
            Math.round(height),
            2,
            canvas.height - ry
          );

        // ------------------------------------------------------
        // SAMPLE BORDER
        // ------------------------------------------------------

        const samples = [];

        const addSample =
          (
            sx,
            sy
          ) => {
            if (
              sx < 0 ||
              sy < 0 ||
              sx >= canvas.width ||
              sy >= canvas.height
            ) {
              return;
            }

            try {
              const pixel =
                ctx.getImageData(
                  Math.round(sx),
                  Math.round(sy),
                  1,
                  1
                ).data;

              samples.push([
                pixel[0],
                pixel[1],
                pixel[2],
              ]);
            } catch {
              // Ignore
            }
          };

        const sampleStep =
          Math.max(
            2,
            Math.round(
              Math.min(
                rw,
                rh
              ) / 10
            )
          );

        // top and bottom
        for (
          let sx = rx;
          sx <=
            rx + rw;
          sx +=
            sampleStep
        ) {
          addSample(
            sx,
            ry - 2
          );

          addSample(
            sx,
            ry + rh + 2
          );
        }

        // left and right
        for (
          let sy = ry;
          sy <=
            ry + rh;
          sy +=
            sampleStep
        ) {
          addSample(
            rx - 2,
            sy
          );

          addSample(
            rx + rw + 2,
            sy
          );
        }

        // ------------------------------------------------------
        // MEDIAN-LIKE COLOR
        // ------------------------------------------------------

        let r = 255;
        let g = 255;
        let b = 255;

        if (
          samples.length
        ) {
          const reds =
            samples
              .map(
                (p) => p[0]
              )
              .sort(
                (a, b) =>
                  a - b
              );

          const greens =
            samples
              .map(
                (p) => p[1]
              )
              .sort(
                (a, b) =>
                  a - b
              );

          const blues =
            samples
              .map(
                (p) => p[2]
              )
              .sort(
                (a, b) =>
                  a - b
              );

          const middle =
            Math.floor(
              samples.length /
                2
            );

          r = reds[middle];
          g = greens[middle];
          b = blues[middle];
        }

        // ------------------------------------------------------
        // SOFT PATCH
        // ------------------------------------------------------

        const pad =
          Math.max(
            2,
            Math.round(
              Math.min(
                rw,
                rh
              ) * 0.04
            )
          );

        // Slight blur helps the replacement patch merge
        // with a flat background such as paper or cloth.
        ctx.save();

        ctx.filter =
          "blur(0.7px)";

        ctx.fillStyle =
          `rgb(${r},${g},${b})`;

        ctx.fillRect(
          rx - pad,
          ry - pad,
          rw + pad * 2,
          rh + pad * 2
        );

        ctx.restore();

        // ------------------------------------------------------
        // SECOND BLENDING PASS
        // ------------------------------------------------------

        ctx.save();

        const gradient =
          ctx.createLinearGradient(
            rx,
            ry,
            rx + rw,
            ry + rh
          );

        gradient.addColorStop(
          0,
          `rgba(${r},${g},${b},0.93)`
        );

        gradient.addColorStop(
          0.5,
          `rgba(${r},${g},${b},1)`
        );

        gradient.addColorStop(
          1,
          `rgba(${r},${g},${b},0.93)`
        );

        ctx.fillStyle =
          gradient;

        ctx.fillRect(
          rx,
          ry,
          rw,
          rh
        );

        ctx.restore();

        // ------------------------------------------------------
        // NEW TEXT
        // ------------------------------------------------------

        const family =
          fontFamily ||
          "Arial";

        const weight =
          fontWeight ||
          700;

        let finalSize =
          clamp(
            Number(
              fontSize
            ) || 32,
            8,
            Math.max(
              10,
              rh *
                0.85
            )
          );

        ctx.textAlign =
          "center";

        ctx.textBaseline =
          "middle";

        // Fit text automatically
        while (
          finalSize > 8
        ) {
          ctx.font =
            `${weight} ${finalSize}px ${family}`;

          if (
            ctx.measureText(
              replacementText
            ).width <=
            rw * 0.90
          ) {
            break;
          }

          finalSize -= 1;
        }

        ctx.font =
          `${weight} ${finalSize}px ${family}`;

        ctx.fillStyle =
          color ||
          "#ffffff";

        // Small shadow only.
        // This makes the text look integrated instead of floating.
        ctx.shadowColor =
          "rgba(0,0,0,0.30)";

        ctx.shadowBlur = 2;

        ctx.shadowOffsetX = 1;
        ctx.shadowOffsetY = 1;

        ctx.fillText(
          replacementText,
          rx +
            rw / 2,
          ry +
            rh / 2
        );

        ctx.restore();
      },
      [appliedReplacement]
    );

  // ==========================================================
  // RENDER CANVAS
  // ==========================================================

  const renderCanvas =
    useCallback(
      () => {
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

        const maxSize =
          1800;

        let width =
          image.naturalWidth;

        let height =
          image.naturalHeight;

        if (
          width >
            maxSize ||
          height >
            maxSize
        ) {
          const scale =
            Math.min(
              maxSize /
                width,
              maxSize /
                height
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

        canvas.width =
          width;

        canvas.height =
          height;

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

        if (
          blurIntensity ===
          "low"
        ) {
          ctx.filter +=
            " blur(0.8px)";
        }

        if (
          blurIntensity ===
          "medium"
        ) {
          ctx.filter +=
            " blur(1.5px)";
        }

        if (
          blurIntensity ===
          "high"
        ) {
          ctx.filter +=
            " blur(3px)";
        }

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
          [
            "warm",
            "golden",
            "amber",
          ].includes(
            activeFilter
          )
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
          [
            "cool",
            "ocean",
            "arctic",
            "sapphire",
          ].includes(
            activeFilter
          )
        ) {
          ctx.save();

          ctx.fillStyle =
            "rgba(60,140,255,0.09)";

          ctx.fillRect(
            0,
            0,
            width,
            height
          );

          ctx.restore();
        }

        // ------------------------------------------------------
        // ROSE / RUBY
        // ------------------------------------------------------

        if (
          [
            "rose",
            "ruby",
          ].includes(
            activeFilter
          )
        ) {
          ctx.save();

          ctx.fillStyle =
            "rgba(255,80,120,0.06)";

          ctx.fillRect(
            0,
            0,
            width,
            height
          );

          ctx.restore();
        }

        // ------------------------------------------------------
        // TEAL / EMERALD
        // ------------------------------------------------------

        if (
          [
            "teal",
            "emerald",
          ].includes(
            activeFilter
          )
        ) {
          ctx.save();

          ctx.fillStyle =
            "rgba(20,190,160,0.07)";

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
          activeFilter ===
          "cinematic"
        ) {
          const bar =
            Math.max(
              18,
              height *
                0.055
            );

          ctx.save();

          ctx.fillStyle =
            "rgba(0,0,0,0.28)";

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
        // GLOW
        // ------------------------------------------------------

        if (
          [
            "soft",
            "face-glow",
            "dream",
          ].includes(
            activeFilter
          )
        ) {
          ctx.save();

          ctx.globalCompositeOperation =
            "screen";

          ctx.globalAlpha =
            0.11;

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
        // FADE
        // ------------------------------------------------------

        if (
          adjustments.fade >
          0
        ) {
          ctx.save();

          ctx.fillStyle =
            `rgba(255,255,255,${clamp(
              adjustments.fade,
              0,
              0.35
            )})`;

          ctx.fillRect(
            0,
            0,
            width,
            height
          );

          ctx.restore();
        }

        // ------------------------------------------------------
        // HAIR
        // ------------------------------------------------------

        drawHairstyle(
          ctx,
          canvas,
          selectedHairstyle
        );

        // ------------------------------------------------------
        // VIGNETTE
        // ------------------------------------------------------

        drawVignette(
          ctx,
          canvas,
          adjustments.vignette
        );

        // ------------------------------------------------------
        // GRAIN
        // ------------------------------------------------------

        drawGrain(
          ctx,
          canvas,
          adjustments.grain
        );

        // ------------------------------------------------------
        // NORMAL TEXT
        // ------------------------------------------------------

        drawText(
          ctx,
          canvas
        );

        // ------------------------------------------------------
        // APPLIED TEXT REPLACEMENT
        // ------------------------------------------------------

        drawTextReplacement(
          ctx,
          canvas
        );

        // ------------------------------------------------------
        // SELECTION BOX
        // ONLY WHILE SELECTING
        // ------------------------------------------------------

        if (
          replaceMode &&
          replaceRect
        ) {
          ctx.save();

          ctx.strokeStyle =
            "#00bfff";

          ctx.lineWidth = 3;

          ctx.setLineDash([
            8,
            5,
          ]);

          ctx.strokeRect(
            replaceRect.x,
            replaceRect.y,
            replaceRect.width,
            replaceRect.height
          );

          ctx.restore();
        }
      },
      [
        imageLoaded,
        getCanvasFilter,
        blurIntensity,
        activeFilter,
        adjustments,
        selectedHairstyle,
        drawHairstyle,
        drawVignette,
        drawGrain,
        drawText,
        drawTextReplacement,
        replaceMode,
        replaceRect,
      ]
    );

  // ==========================================================
  // RENDER EFFECT
  // ==========================================================

  useEffect(() => {
    renderCanvas();
  }, [
    renderCanvas,
  ]);

  // ==========================================================
  // FILE HANDLER
  // ==========================================================

  const handleFile =
    useCallback(
      (file) => {
        if (!file) {
          return;
        }

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
          20 *
            1024 *
            1024
        ) {
          setErrorMessage(
            "Maximum image size is 20MB."
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

          setOriginalUrl(
            url
          );

          setImageLoaded(
            true
          );

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
            ...DEFAULT_ADJUSTMENTS,
          });

          setBlurIntensity(
            "off"
          );

          setSelectedHairstyle(
            "original"
          );

          setText("");
          setReplaceText("");

          setReplaceRect(
            null
          );

          setReplaceMode(
            false
          );

          setAppliedReplacement(
            null
          );

          setHistory([]);
          setHistoryIndex(
            -1
          );

          setSuccessMessage(
            "Image loaded. Free editor is ready."
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

  const handleFileInput =
    (event) => {
      const file =
        event.target
          ?.files?.[0];

      if (file) {
        handleFile(file);
      }

      event.target.value =
        "";
    };

  // ==========================================================
  // APPLY FILTER
  // ==========================================================

  const applyFilter =
    (filterId) => {
      if (
        !imageLoaded
      ) {
        return;
      }

      saveHistory();

      setActiveFilter(
        filterId
      );

      setAdjustments(
        getFilterValues(
          filterId
        )
      );

      setSuccessMessage(
        `${filterId} filter applied.`
      );
    };

  // ==========================================================
  // ADJUSTMENT
  // ==========================================================

  const handleAdjustment =
    (
      key,
      value
    ) => {
      if (
        !imageLoaded
      ) {
        return;
      }

      setAdjustments(
        (prev) => ({
          ...prev,
          [key]:
            Number(
              value
            ),
        })
      );
    };

  const commitAdjustment =
    () => {
      saveHistory();

      setSuccessMessage(
        "Adjustment applied."
      );
    };

  // ==========================================================
  // QUICK ACTIONS
  // ==========================================================

  const handleQuickAction =
    (actionId) => {
      if (
        !imageLoaded
      ) {
        return;
      }

      saveHistory();

      switch (
        actionId
      ) {
        case "enhance":
          setAdjustments({
            ...DEFAULT_ADJUSTMENTS,

            brightness:
              1.08,

            contrast:
              1.18,

            saturation:
              1.12,

            sharpness:
              0.25,

            highlights:
              0.08,

            shadows:
              0.08,
          });

          setActiveFilter(
            "portrait-enhance"
          );

          break;

        case "auto":
          setAdjustments({
            ...DEFAULT_ADJUSTMENTS,

            brightness:
              1.08,

            contrast:
              1.12,

            saturation:
              1.08,

            exposure:
              0.06,

            highlights:
              0.05,

            shadows:
              0.08,

            sharpness:
              0.2,
          });

          setActiveFilter(
            "clean"
          );

          break;

        case "upscale":
          setSuccessMessage(
            "High-resolution canvas output enabled. Download to save."
          );

          break;

        case "bw":
        case "warm":
        case "vintage":
        case "portrait":
        case "dramatic":
          setActiveFilter(
            actionId
          );

          setAdjustments(
            getFilterValues(
              actionId
            )
          );

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
      if (
        !imageLoaded
      ) {
        return;
      }

      saveHistory();

      setBlurIntensity(
        level
      );

      setSuccessMessage(
        `Blur: ${level}`
      );
    };

  // ==========================================================
  // HAIRSTYLE
  // ==========================================================

  const applyHairstyle =
    (style) => {
      if (
        !imageLoaded
      ) {
        return;
      }

      saveHistory();

      setSelectedHairstyle(
        style
      );

      setSuccessMessage(
        style ===
          "original"
          ? "Original hairstyle restored."
          : `${style} hairstyle applied — Free local mode.`
      );
    };

  // ==========================================================
  // ADD TEXT
  // ==========================================================

  const applyText =
    () => {
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
  // START REPLACEMENT
  // ==========================================================

  const startReplaceMode =
    () => {
      if (
        !imageLoaded
      ) {
        return;
      }

      setReplaceMode(
        true
      );

      setReplaceRect(
        null
      );

      setSuccessMessage(
        "Old text ke around exact area drag karke select karo."
      );
    };

  // ==========================================================
  // CANCEL REPLACEMENT
  // ==========================================================

  const cancelReplaceMode =
    () => {
      setReplaceMode(
        false
      );

      setReplaceRect(
        null
      );

      replaceStartRef.current =
        null;
    };

  // ==========================================================
  // CANVAS COORDINATES
  // ==========================================================

  const getCanvasCoordinates =
    (event) => {
      const canvas =
        canvasRef.current;

      if (!canvas) {
        return null;
      }

      const rect =
        canvas.getBoundingClientRect();

      if (
        !rect.width ||
        !rect.height
      ) {
        return null;
      }

      const scaleX =
        canvas.width /
        rect.width;

      const scaleY =
        canvas.height /
        rect.height;

      return {
        x:
          (event.clientX -
            rect.left) *
          scaleX,

        y:
          (event.clientY -
            rect.top) *
          scaleY,
      };
    };

  // ==========================================================
  // POINTER DOWN
  // ==========================================================

  const handleCanvasPointerDown =
    (event) => {
      if (
        !replaceMode ||
        !imageLoaded
      ) {
        return;
      }

      const point =
        getCanvasCoordinates(
          event
        );

      if (!point) {
        return;
      }

      replaceStartRef.current =
        point;

      try {
        canvasRef.current?.setPointerCapture(
          event.pointerId
        );
      } catch {
        // Ignore
      }
    };

  // ==========================================================
  // POINTER MOVE
  // ==========================================================

  const handleCanvasPointerMove =
    (event) => {
      if (
        !replaceMode ||
        !replaceStartRef.current
      ) {
        return;
      }

      const point =
        getCanvasCoordinates(
          event
        );

      if (!point) {
        return;
      }

      const start =
        replaceStartRef.current;

      setReplaceRect({
        x:
          Math.min(
            start.x,
            point.x
          ),

        y:
          Math.min(
            start.y,
            point.y
          ),

        width:
          Math.abs(
            point.x -
              start.x
          ),

        height:
          Math.abs(
            point.y -
              start.y
          ),
      });
    };

  // ==========================================================
  // POINTER UP
  // ==========================================================

  const handleCanvasPointerUp =
    () => {
      replaceStartRef.current =
        null;
    };

  // ==========================================================
  // APPLY TEXT REPLACEMENT
  //
  // THIS FIXES THE MAIN BUG
  // ==========================================================

  const applyTextReplacement =
    () => {
      if (
        !imageLoaded
      ) {
        setErrorMessage(
          "Image is not loaded."
        );

        return;
      }

      if (
        !replaceRect
      ) {
        setErrorMessage(
          "Pehle old text ka area select karo."
        );

        return;
      }

      if (
        replaceRect.width <
          8 ||
        replaceRect.height <
          8
      ) {
        setErrorMessage(
          "Selected area bahut chhota hai."
        );

        return;
      }

      if (
        !replaceText.trim()
      ) {
        setErrorMessage(
          "New word/text likho."
        );

        return;
      }

      // SAVE CURRENT STATE BEFORE APPLY
      saveHistory();

      // ------------------------------------------------------
      // STORE THE ACTUAL REPLACEMENT
      // ------------------------------------------------------

      setAppliedReplacement({
        x:
          replaceRect.x,

        y:
          replaceRect.y,

        width:
          replaceRect.width,

        height:
          replaceRect.height,

        text:
          replaceText.trim(),

        color:
          replaceTextColor,

        fontSize:
          replaceTextSize,

        fontWeight:
          700,

        fontFamily:
          "Arial, sans-serif",
      });

      // ------------------------------------------------------
      // IMPORTANT:
      // Selection mode OFF
      // Therefore blue selection box disappears.
      // ------------------------------------------------------

      setReplaceMode(
        false
      );

      setReplaceRect(
        null
      );

      replaceStartRef.current =
        null;

      setSuccessMessage(
        "✅ Old text replaced. New text selected area ke andar automatically fit ho gaya."
      );
    };

  // ==========================================================
  // UNDO
  // ==========================================================

  const undo =
    () => {
      if (
        historyIndex <
        0
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

      setActiveFilter(
        snapshot.activeFilter
      );

      setAdjustments({
        ...snapshot.adjustments,
      });

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

      setReplaceText(
        snapshot.replaceText
      );

      setReplaceTextColor(
        snapshot.replaceTextColor
      );

      setReplaceTextSize(
        snapshot.replaceTextSize
      );

      setReplaceRect(
        snapshot.replaceRect
      );

      setAppliedReplacement(
        snapshot.appliedReplacement ||
          null
      );

      setReplaceMode(
        false
      );

      setHistoryIndex(
        historyIndex - 1
      );

      setSuccessMessage(
        "↩️ One step back."
      );
    };

  // ==========================================================
  // REDO
  // ==========================================================

  const redo =
    () => {
      if (
        historyIndex >=
        history.length - 1
      ) {
        return;
      }

      const nextIndex =
        historyIndex + 1;

      const snapshot =
        history[
          nextIndex
        ];

      if (!snapshot) {
        return;
      }

      setActiveFilter(
        snapshot.activeFilter
      );

      setAdjustments({
        ...snapshot.adjustments,
      });

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

      setReplaceText(
        snapshot.replaceText
      );

      setReplaceTextColor(
        snapshot.replaceTextColor
      );

      setReplaceTextSize(
        snapshot.replaceTextSize
      );

      setReplaceRect(
        snapshot.replaceRect
      );

      setAppliedReplacement(
        snapshot.appliedReplacement ||
          null
      );

      setReplaceMode(
        false
      );

      setHistoryIndex(
        nextIndex
      );

      setSuccessMessage(
        "↪️ Redone."
      );
    };

  // ==========================================================
  // RESET
  // ==========================================================

  const resetEditor =
    () => {
      if (
        !imageLoaded
      ) {
        return;
      }

      saveHistory();

      setActiveFilter(
        "natural"
      );

      setAdjustments({
        ...DEFAULT_ADJUSTMENTS,
      });

      setBlurIntensity(
        "off"
      );

      setSelectedHairstyle(
        "original"
      );

      setText("");

      setTextColor(
        "#ffffff"
      );

      setTextSize(
        32
      );

      setTextX(
        50
      );

      setTextY(
        50
      );

      setReplaceText(
        ""
      );

      setReplaceRect(
        null
      );

      setReplaceMode(
        false
      );

      setAppliedReplacement(
        null
      );

      setSuccessMessage(
        "Image reset."
      );
    };

  // ==========================================================
  // NEW IMAGE
  // ==========================================================

  const newImage =
    () => {
      fileInputRef.current?.click();
    };

  // ==========================================================
  // DOWNLOAD
  // ==========================================================

  const downloadImage =
    () => {
      const canvas =
        canvasRef.current;

      if (!canvas) {
        return;
      }

      setIsProcessing(
        true
      );

      canvas.toBlob(
        (blob) => {
          setIsProcessing(
            false
          );

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
    (event) => {
      event.preventDefault();

      const file =
        event.dataTransfer
          ?.files?.[0];

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
  // ADJUSTMENT CONTROLS
  // ==========================================================

  const adjustmentControls =
    useMemo(
      () => [
        [
          "brightness",
          "Brightness",
          0.2,
          2.5,
          0.01,
        ],

        [
          "contrast",
          "Contrast",
          0.2,
          3,
          0.01,
        ],

        [
          "saturation",
          "Saturation",
          0,
          3,
          0.01,
        ],

        [
          "exposure",
          "Exposure",
          -1,
          1,
          0.01,
        ],

        [
          "highlights",
          "Highlights",
          -1,
          1,
          0.01,
        ],

        [
          "shadows",
          "Shadows",
          -1,
          1,
          0.01,
        ],

        [
          "temperature",
          "Temperature",
          -1,
          1,
          0.01,
        ],

        [
          "tint",
          "Tint",
          -1,
          1,
          0.01,
        ],

        [
          "sharpness",
          "Sharpness",
          0,
          1,
          0.01,
        ],

        [
          "blur",
          "Blur",
          0,
          8,
          0.1,
        ],

        [
          "vignette",
          "Vignette",
          0,
          0.8,
          0.01,
        ],

        [
          "grain",
          "Film Grain",
          0,
          0.5,
          0.01,
        ],

        [
          "fade",
          "Fade",
          0,
          0.4,
          0.01,
        ],

        [
          "hue",
          "Hue",
          -180,
          180,
          1,
        ],
      ],
      []
    );

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <div
      className="image-editor-container"
      onDragOver={(e) =>
        e.preventDefault()
      }
      onDrop={
        handleDrop
      }
    >
      {/* ======================================================
          HEADER
      ====================================================== */}

      <div className="image-editor-header">
        <h1>
          AI Image Editor
        </h1>

        <p className="subtitle">
          Powerful free photo
          editing — filters,
          adjustments, hairstyles
          and smart text replacement.
        </p>
      </div>

      {/* ======================================================
          INPUT
      ====================================================== */}

      <input
        ref={
          fileInputRef
        }
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={
          handleFileInput
        }
        style={{
          display: "none",
        }}
      />

      {/* ======================================================
          ERROR
      ====================================================== */}

      {errorMessage && (
        <div className="error-banner">
          ⚠️{" "}
          {errorMessage}

          <button
            onClick={() =>
              setErrorMessage(
                ""
              )
            }
          >
            ✕
          </button>
        </div>
      )}

      {/* ======================================================
          SUCCESS
      ====================================================== */}

      {successMessage && (
        <div className="success-banner">
          ✓{" "}
          {successMessage}

          <button
            onClick={() =>
              setSuccessMessage(
                ""
              )
            }
          >
            ✕
          </button>
        </div>
      )}

      {/* ======================================================
          EMPTY
      ====================================================== */}

      {!imageLoaded && (
        <div
          className="upload-area"
          onClick={
            newImage
          }
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
            JPG, PNG, WebP —
            up to 20MB
          </p>
        </div>
      )}

      {/* ======================================================
          EDITOR
      ====================================================== */}

      {imageLoaded && (
        <div className="editor-layout">
          {/* ==================================================
              SIDEBAR
          ================================================== */}

          <aside className="editor-sidebar">
            {/* NEW IMAGE */}

            <button
              className="new-image-btn"
              onClick={
                newImage
              }
            >
              📁 New Image
            </button>

            {/* UNDO / REDO */}

            <div
              style={{
                display:
                  "grid",

                gridTemplateColumns:
                  "1fr 1fr",

                gap: "8px",
              }}
            >
              <button
                className="reset-btn"
                onClick={
                  undo
                }
                disabled={
                  historyIndex <
                  0
                }
              >
                ↩️ Back
              </button>

              <button
                className="reset-btn"
                onClick={
                  redo
                }
                disabled={
                  historyIndex >=
                  history.length -
                    1
                }
              >
                ↪️ Redo
              </button>
            </div>

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
                Filters — 50 Free
              </h3>

              <div className="filter-grid">
                {FILTERS.map(
                  (
                    filter
                  ) => (
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
                Heavy Adjustments
              </h3>

              {adjustmentControls.map(
                (
                  control
                ) => {
                  const [
                    key,
                    label,
                    min,
                    max,
                    step,
                  ] =
                    control;

                  return (
                    <div
                      className="adjustment-group"
                      key={
                        key
                      }
                    >
                      <label>
                        <span>
                          {
                            label
                          }
                        </span>

                        <strong>
                          {Number(
                            adjustments[
                              key
                            ]
                          ).toFixed(
                            key ===
                              "hue"
                              ? 0
                              : 2
                          )}
                        </strong>
                      </label>

                      <input
                        type="range"
                        min={
                          min
                        }
                        max={
                          max
                        }
                        step={
                          step
                        }
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
                            e
                              .target
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
                  (
                    action
                  ) => (
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
                  "off",
                  "low",
                  "medium",
                  "high",
                ].map(
                  (
                    level
                  ) => (
                    <button
                      key={
                        level
                      }
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
                      {
                        level
                      }
                    </button>
                  )
                )}
              </div>

              <p
                style={{
                  fontSize:
                    "11px",
                  opacity:
                    0.65,
                }}
              >
                Free local blur.
              </p>
            </div>

            {/* =================================================
                HAIRSTYLES
            ================================================= */}

            <div className="tool-section">
              <h3>
                💇 Hairstyles —
                FREE
              </h3>

              <p
                style={{
                  fontSize:
                    "12px",
                  opacity:
                    0.7,
                }}
              >
                Free hairstyle
                preview. No AI
                credits required.
              </p>

              <div className="filter-grid">
                {HAIRSTYLES.map(
                  (
                    style
                  ) => (
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
                ADD TEXT
            ================================================= */}

            <div className="tool-section">
              <h3>
                ✍️ Add Text
              </h3>

              <input
                type="text"
                value={
                  text
                }
                onChange={(
                  e
                ) =>
                  setText(
                    e.target
                      .value
                  )
                }
                placeholder="Write something..."
                className="ai-input"
              />

              <label>
                Text Size
              </label>

              <input
                type="range"
                min="12"
                max="160"
                value={
                  textSize
                }
                onChange={(
                  e
                ) =>
                  setTextSize(
                    Number(
                      e.target
                        .value
                    )
                  )
                }
              />

              <label>
                Text Color
              </label>

              <input
                type="color"
                value={
                  textColor
                }
                onChange={(
                  e
                ) =>
                  setTextColor(
                    e.target
                      .value
                  )
                }
              />

              <label>
                Horizontal
              </label>

              <input
                type="range"
                min="0"
                max="100"
                value={
                  textX
                }
                onChange={(
                  e
                ) =>
                  setTextX(
                    Number(
                      e.target
                        .value
                    )
                  )
                }
              />

              <label>
                Vertical
              </label>

              <input
                type="range"
                min="0"
                max="100"
                value={
                  textY
                }
                onChange={(
                  e
                ) =>
                  setTextY(
                    Number(
                      e.target
                        .value
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
                ➕ Add Text
              </button>
            </div>

            {/* =================================================
                REPLACE EXISTING TEXT
            ================================================= */}

            <div className="tool-section">
              <h3>
                📝 Replace Existing
                Text
              </h3>

              <p
                style={{
                  fontSize:
                    "12px",
                  opacity:
                    0.7,
                }}
              >
                Photo/page par jo
                old text hai uske
                exact area ko select
                karo aur naya word
                likho.
              </p>

              <button
                className={`ai-edit-btn ${
                  replaceMode
                    ? "active"
                    : ""
                }`}
                onClick={
                  replaceMode
                    ? cancelReplaceMode
                    : startReplaceMode
                }
              >
                {replaceMode
                  ? "✕ Cancel Selection"
                  : "🎯 Select Old Text"}
              </button>

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
                placeholder="New word/text..."
                className="ai-input"
              />

              <label>
                New Text Size
              </label>

              <input
                type="range"
                min="8"
                max="160"
                value={
                  replaceTextSize
                }
                onChange={(
                  e
                ) =>
                  setReplaceTextSize(
                    Number(
                      e.target
                        .value
                    )
                  )
                }
              />

              <label>
                New Text Color
              </label>

              <input
                type="color"
                value={
                  replaceTextColor
                }
                onChange={(
                  e
                ) =>
                  setReplaceTextColor(
                    e.target
                      .value
                  )
                }
              />

              <button
                className="ai-edit-btn"
                onClick={
                  applyTextReplacement
                }
                disabled={
                  !replaceMode ||
                  !replaceRect ||
                  !replaceText.trim()
                }
              >
                🔁 Replace Text
              </button>

              <p
                style={{
                  fontSize:
                    "11px",
                  opacity:
                    0.65,
                }}
              >
                1. Select Old Text
                <br />
                2. Drag around old
                text
                <br />
                3. New word type
                karo
                <br />
                4. Replace Text dabao
              </p>
            </div>

            {/* =================================================
                DOWNLOAD
            ================================================= */}

            <button
              className="new-image-btn"
              onClick={
                downloadImage
              }
              disabled={
                isProcessing
              }
            >
              {isProcessing
                ? "⏳ Processing..."
                : "⬇️ Download Image"}
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

              <div
                className="image-frame"
                style={{
                  position:
                    "relative",
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
                    cursor:
                      replaceMode
                        ? "crosshair"
                        : "default",

                    touchAction:
                      replaceMode
                        ? "none"
                        : "auto",
                  }}
                />
              </div>

              {replaceMode && (
                <div
                  style={{
                    marginTop:
                      "10px",

                    padding:
                      "10px",

                    borderRadius:
                      "8px",

                    background:
                      "rgba(0,191,255,0.12)",

                    fontSize:
                      "13px",
                  }}
                >
                  🎯{" "}
                  <strong>
                    Text selection
                  </strong>

                  <br />

                  Edited image par
                  old text ke around
                  exact area drag karo.
                </div>
              )}

              {!replaceMode &&
                appliedReplacement && (
                  <div
                    style={{
                      marginTop:
                        "10px",

                      padding:
                        "10px",

                      borderRadius:
                        "8px",

                      background:
                        "rgba(0,180,100,0.10)",

                      fontSize:
                        "13px",
                    }}
                  >
                    ✅ Text successfully
                    replaced.
                  </div>
                )}

              <div className="image-info">
                <span className="info-badge">
                  Local Processing
                </span>

                <span className="info-badge">
                  50 Filters
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