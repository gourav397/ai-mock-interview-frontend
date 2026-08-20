import { useEffect, useRef, useState, useMemo } from 'react';

/**
 * AIAvatar — A realistic, expressive AI interviewer avatar.
 * Features:
 * - Natural lip sync while speaking
 * - Blinking eyes
 * - Facial expressions (happy, thinking, listening, speaking)
 * - Gentle head movements
 * - Clean, professional appearance
 */
export default function AIAvatar({
  state = 'idle', // idle | listening | thinking | speaking
  emotion = 'neutral', // neutral | happy | concerned | encouraging
}) {
  const canvasRef = useRef(null);
  const animFrameRef = useRef(null);
  const timeRef = useRef(0);
  const blinkRef = useRef(0);
  const [dimensions, setDimensions] = useState({ width: 320, height: 360 });

  // ── Responsive sizing ──
  useEffect(() => {
    const updateSize = () => {
      const vw = window.innerWidth;
      if (vw < 480) setDimensions({ width: 240, height: 270 });
      else if (vw < 768) setDimensions({ width: 280, height: 315 });
      else setDimensions({ width: 320, height: 360 });
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // ── Animation Loop ──
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let running = true;

    const animate = (timestamp) => {
      if (!running) return;
      timeRef.current = timestamp / 1000;

      // Auto-blink every 3-5 seconds
      if (blinkRef.current <= 0) {
        blinkRef.current = 3 + Math.random() * 2;
      }

      drawAvatar(ctx, dimensions, state, emotion, timestamp);
      animFrameRef.current = requestAnimationFrame(animate);
    };

    animFrameRef.current = requestAnimationFrame(animate);
    return () => {
      running = false;
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [state, emotion, dimensions]);

  return (
    <div className="relative flex flex-col items-center">
      {/* Glow effect */}
      <div className={`absolute -inset-4 rounded-full blur-2xl transition-opacity duration-700 ${
        state === 'speaking'
          ? 'bg-purple-500/20 opacity-100'
          : state === 'listening'
          ? 'bg-blue-500/15 opacity-70'
          : state === 'thinking'
          ? 'bg-amber-400/10 opacity-50'
          : 'bg-transparent opacity-0'
      }`} />

      {/* Avatar Canvas */}
      <canvas
        ref={canvasRef}
        width={dimensions.width}
        height={dimensions.height}
        className="relative z-10 rounded-2xl"
        style={{
          filter: 'drop-shadow(0 8px 32px rgba(0,0,0,0.3))',
        }}
      />

      {/* State Label */}
      <div className={`mt-3 px-4 py-1.5 rounded-full text-xs font-semibold transition-all duration-500 ${
        state === 'speaking'
          ? 'bg-purple-500/30 text-purple-300 border border-purple-400/30'
          : state === 'listening'
          ? 'bg-blue-500/30 text-blue-300 border border-blue-400/30'
          : state === 'thinking'
          ? 'bg-amber-500/30 text-amber-300 border border-amber-400/30'
          : 'bg-white/10 text-white/50 border border-white/10'
      }`}>
        {state === 'speaking' && '🎙️ Speaking...'}
        {state === 'listening' && '👂 Listening...'}
        {state === 'thinking' && '🤔 Thinking...'}
        {state === 'idle' && '😊 Ready'}
      </div>
    </div>
  );
}

// ── Drawing Engine ──
function drawAvatar(ctx, dims, state, emotion, timestamp) {
  const { width, height } = dims;
  const cx = width / 2;
  const cy = height / 2;
  const scale = width / 320;

  // Clear
  ctx.clearRect(0, 0, width, height);

  // ── Background (gradient circle) ──
  const bgGrad = ctx.createRadialGradient(cx, cy - 30 * scale, 0, cx, cy, 140 * scale);
  bgGrad.addColorStop(0, '#1a1a2e');
  bgGrad.addColorStop(0.6, '#16213e');
  bgGrad.addColorStop(1, '#0f0f23');
  ctx.fillStyle = bgGrad;
  ctx.beginPath();
  ctx.arc(cx, cy - 10 * scale, 130 * scale, 0, Math.PI * 2);
  ctx.fill();

  // ── Subtle border ──
  ctx.strokeStyle = 'rgba(168, 85, 247, 0.15)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(cx, cy - 10 * scale, 130 * scale, 0, Math.PI * 2);
  ctx.stroke();

  // ── Head movement (gentle sway) ──
  const sway = state === 'idle'
    ? Math.sin(timestamp * 0.0005) * 2
    : state === 'speaking'
    ? Math.sin(timestamp * 0.003) * 3
    : Math.sin(timestamp * 0.001) * 1.5;

  ctx.save();
  ctx.translate(cx + sway * scale, cy - 10 * scale);

  // ── Head Shape ──
  const headY = -20 * scale;
  ctx.save();

  // Face oval
  const faceGrad = ctx.createRadialGradient(0, headY - 10 * scale, 10 * scale, 0, headY, 75 * scale);
  faceGrad.addColorStop(0, '#e8d5b7');
  faceGrad.addColorStop(0.5, '#d4b896');
  faceGrad.addColorStop(1, '#c4a07a');
  ctx.fillStyle = faceGrad;

  ctx.beginPath();
  ctx.ellipse(0, headY, 55 * scale, 65 * scale, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(180, 140, 100, 0.3)';
  ctx.lineWidth = 1;
  ctx.stroke();

  // ── Hair ──
  ctx.fillStyle = '#2c2c3a';
  ctx.beginPath();
  ctx.ellipse(0, headY - 38 * scale, 50 * scale, 30 * scale, 0, Math.PI, 0);
  ctx.fill();

  // ── Eyes ──
  const eyeY = headY - 8 * scale;
  const eyeSpacing = 22 * scale;

  // Blink
  const blinkCycle = (timestamp % 5000) / 5000;
  const isBlinking = blinkCycle > 0.95;
  const eyeOpen = isBlinking ? 0.1 : 1;

  // Eye state based on avatar state
  const eyeWidth = 14 * scale;
  const eyeHeight = 14 * scale * eyeOpen;

  // Left eye
  ctx.fillStyle = '#f5f5f5';
  ctx.beginPath();
  ctx.ellipse(-eyeSpacing, eyeY, eyeWidth, eyeHeight, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#888';
  ctx.lineWidth = 0.5;
  ctx.stroke();

  // Right eye
  ctx.beginPath();
  ctx.ellipse(eyeSpacing, eyeY, eyeWidth, eyeHeight, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Iris / pupil (move slightly based on state)
  if (eyeOpen > 0.3) {
    const irisOffset = state === 'listening' ? 2 : state === 'thinking' ? -2 : 0;
    const irisSize = 6 * scale;

    for (const xOff of [-eyeSpacing, eyeSpacing]) {
      // Iris
      const irisGrad = ctx.createRadialGradient(
        xOff + irisOffset * scale, eyeY, 0,
        xOff + irisOffset * scale, eyeY, irisSize
      );
      irisGrad.addColorStop(0, '#4a3728');
      irisGrad.addColorStop(0.7, '#3d2e20');
      irisGrad.addColorStop(1, '#2c1f14');
      ctx.fillStyle = irisGrad;
      ctx.beginPath();
      ctx.arc(xOff + irisOffset * scale, eyeY, irisSize, 0, Math.PI * 2);
      ctx.fill();

      // Pupil highlight
      ctx.fillStyle = 'rgba(255,255,255,0.6)';
      ctx.beginPath();
      ctx.arc(xOff + irisOffset * scale + 2 * scale, eyeY - 2 * scale, 2.5 * scale, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // ── Eyebrows ──
  const browY = eyeY - 20 * scale;
  const browLength = 16 * scale;
  const browThickness = 2.5 * scale;

  // Emotion-based eyebrow position
  let browAngle = 0;
  if (emotion === 'happy' || state === 'speaking') browAngle = -3;
  else if (emotion === 'concerned') browAngle = 5;
  else if (emotion === 'encouraging') browAngle = -2;

  ctx.strokeStyle = '#6b5b4e';
  ctx.lineWidth = browThickness;
  ctx.lineCap = 'round';

  // Left brow
  ctx.beginPath();
  ctx.moveTo(-eyeSpacing - browLength, browY + browAngle * scale);
  ctx.quadraticCurveTo(-eyeSpacing, browY - 3 * scale + browAngle * scale, -eyeSpacing + browLength, browY + browAngle * scale);
  ctx.stroke();

  // Right brow
  ctx.beginPath();
  ctx.moveTo(eyeSpacing - browLength, browY + browAngle * scale);
  ctx.quadraticCurveTo(eyeSpacing, browY - 3 * scale + browAngle * scale, eyeSpacing + browLength, browY + browAngle * scale);
  ctx.stroke();

  // ── Nose ──
  ctx.strokeStyle = '#c4a07a';
  ctx.lineWidth = 1.5 * scale;
  ctx.beginPath();
  ctx.moveTo(0, headY);
  ctx.lineTo(4 * scale, headY + 12 * scale);
  ctx.lineTo(0, headY + 14 * scale);
  ctx.stroke();

  // ── Mouth / Lips ──
  const mouthY = headY + 28 * scale;

  // Lip sync based on speaking state
  let mouthOpen = 0;
  let mouthShape = 0;

  if (state === 'speaking') {
    // Animated lip sync
    const speechFreq = timestamp * 0.015;
    const sineVal = Math.sin(speechFreq);
    mouthOpen = Math.max(0, sineVal) * 12 * scale;
    mouthShape = Math.sin(speechFreq * 0.7) * 3 * scale;
  } else if (state === 'listening') {
    mouthOpen = 2 * scale; // slightly open (smile)
  } else if (emotion === 'happy') {
    mouthOpen = 4 * scale; // smile
  } else {
    mouthOpen = 0;
  }

  // Upper lip
  ctx.strokeStyle = '#c97a5e';
  ctx.lineWidth = 2 * scale;

  if (mouthOpen > 0) {
    // Open mouth
    ctx.fillStyle = '#8b3a2a';
    ctx.beginPath();
    ctx.ellipse(0, mouthY + mouthOpen * 0.5, 16 * scale + mouthShape, mouthOpen * 0.7, 0, 0, Math.PI * 2);
    ctx.fill();

    // Upper lip line
    ctx.beginPath();
    ctx.moveTo(-16 * scale, mouthY);
    ctx.quadraticCurveTo(-8 * scale, mouthY - 3 * scale, 0, mouthY - 2 * scale);
    ctx.quadraticCurveTo(8 * scale, mouthY - 3 * scale, 16 * scale, mouthY);
    ctx.stroke();

    // Lower lip line
    ctx.strokeStyle = '#b06a4e';
    ctx.beginPath();
    ctx.moveTo(-14 * scale, mouthY + mouthOpen * 0.5);
    ctx.quadraticCurveTo(0, mouthY + mouthOpen * 0.8, 14 * scale, mouthY + mouthOpen * 0.5);
    ctx.stroke();
  } else {
    // Closed/smiling mouth
    const smileCurve = emotion === 'happy' || state === 'listening' ? -3 * scale : 0;
    ctx.beginPath();
    ctx.moveTo(-15 * scale, mouthY + smileCurve);
    ctx.quadraticCurveTo(0, mouthY - 4 * scale + smileCurve, 15 * scale, mouthY + smileCurve);
    ctx.stroke();
  }

  // ── Cheek blush (subtle) ──
  if (emotion === 'happy' || state === 'speaking') {
    ctx.fillStyle = 'rgba(255, 150, 150, 0.12)';
    ctx.beginPath();
    ctx.ellipse(-30 * scale, headY + 15 * scale, 12 * scale, 8 * scale, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(30 * scale, headY + 15 * scale, 12 * scale, 8 * scale, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
  ctx.restore();
}