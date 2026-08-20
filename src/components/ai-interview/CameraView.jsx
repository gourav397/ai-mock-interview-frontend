import { useEffect, useRef, useState, useCallback } from 'react';

/**
 * CameraView — Webcam access with lightweight emotion/attention detection.
 * Uses Canvas-based face tracking (no ML models for speed/performance).
 * Provides approximate engagement cues without claiming medical-grade accuracy.
 */
export default function CameraView({
  isActive = false,
  onEmotionChange,
  onFaceDetected,
  mirror = true,
}) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const animFrameRef = useRef(null);
  const [hasPermission, setHasPermission] = useState(null); // null=loading, true, false
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [error, setError] = useState(null);
  const [userState, setUserState] = useState('unknown');
  // unknown | looking | not-looking | speaking | confused | smiling
  const lastMotionRef = useRef([]);
  const motionIdxRef = useRef(0);

  // ── Start Camera ──
  const startCamera = useCallback(async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 320 },
          height: { ideal: 240 },
          facingMode: 'user',
        },
        audio: false,
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setHasPermission(true);
        setIsCameraOn(true);
      }
    } catch (err) {
      console.log('Camera access error:', err.message);
      setHasPermission(false);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setError('Camera permission denied. Voice-only mode active.');
      } else {
        setError('Camera unavailable. Voice-only mode active.');
      }
    }
  }, []);

  // ── Stop Camera ──
  const stopCamera = useCallback(() => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraOn(false);
  }, []);

  // ── Toggle ──
  useEffect(() => {
    if (isActive && hasPermission === null) {
      startCamera();
    } else if (!isActive && isCameraOn) {
      stopCamera();
    }
  }, [isActive, hasPermission, startCamera, stopCamera, isCameraOn]);

  // ── Lightweight Face Tracking (no ML, just motion detection) ──
  useEffect(() => {
    if (!isActive || !hasPermission || !videoRef.current) return;

    let frameCount = 0;
    let emotionHistory = [];

    const trackFace = () => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas || video.readyState < 2) {
        animFrameRef.current = requestAnimationFrame(trackFace);
        return;
      }

      frameCount++;
      const ctx = canvas.getContext('2d');
      canvas.width = video.videoWidth || 320;
      canvas.height = video.videoHeight || 240;

      // Draw current frame
      ctx.save();
      if (mirror) {
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
      }
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      ctx.restore();

      // ── Simple motion-based engagement detection ──
      if (frameCount % 5 === 0) {
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        // Sample brightness at center region (where face would be)
        const centerX = Math.floor(canvas.width * 0.45);
        const centerY = Math.floor(canvas.height * 0.35);
        const sampleSizeW = Math.floor(canvas.width * 0.1);
        const sampleSizeH = Math.floor(canvas.height * 0.12);

        let avgBrightness = 0;
        let pixelCount = 0;

        for (let y = centerY; y < centerY + sampleSizeH && y < canvas.height; y++) {
          for (let x = centerX; x < centerX + sampleSizeW && x < canvas.width; x++) {
            const idx = (y * canvas.width + x) * 4;
            avgBrightness += (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
            pixelCount++;
          }
        }
        avgBrightness = pixelCount > 0 ? avgBrightness / pixelCount : 0;

        // Track motion by brightness variance
        lastMotionRef.current[motionIdxRef.current % 10] = avgBrightness;
        motionIdxRef.current++;

        if (lastMotionRef.current.filter(v => v !== undefined).length > 3) {
          const variance = calculateVariance(lastMotionRef.current.filter(v => v !== undefined));
          const isLooking = variance > 3 && avgBrightness > 30;

          // Simple emotion hint based on mouth position (lip brightness difference)
          const mouthY = Math.floor(canvas.height * 0.55);
          const mouthSample = Math.floor(canvas.width * 0.1);
          let mouthBrightness = 0;
          let mouthCount = 0;

          for (let x = Math.floor(canvas.width * 0.4); x < Math.floor(canvas.width * 0.6); x++) {
            const idx = (mouthY * canvas.width + x) * 4;
            mouthBrightness += (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
            mouthCount++;
          }

          const mouthAvg = mouthCount > 0 ? mouthBrightness / mouthCount : 128;

          // Determine approximate state
          let detectedState = 'unknown';

          if (!isLooking) {
            detectedState = 'not-looking';
          } else if (mouthAvg < 60) {
            detectedState = 'speaking';
          } else if (mentionDetected(data, canvas.width, canvas.height)) {
            detectedState = 'confused';
          } else {
            detectedState = 'looking';
          }

          setUserState(detectedState);

          // Map to emotion for AI
          emotionHistory.push(detectedState);
          if (emotionHistory.length > 10) emotionHistory.shift();

          if (emotionHistory.length >= 5) {
            const dominant = getDominantState(emotionHistory);
            const emotionMap = {
              'looking': 'neutral',
              'speaking': 'neutral',
              'not-looking': 'neutral',
              'confused': 'surprised',
            };
            if (onEmotionChange) {
              onEmotionChange(emotionMap[dominant] || 'neutral');
            }
          }
        }
      }

      // Draw indicators on canvas
      ctx.strokeStyle = 'rgba(168, 85, 247, 0.3)';
      ctx.lineWidth = 1;
      ctx.strokeRect(
        mirror ? canvas.width - centerX - sampleSizeW : centerX,
        centerY,
        sampleSizeW,
        sampleSizeH
      );

      animFrameRef.current = requestAnimationFrame(trackFace);
    };

    animFrameRef.current = requestAnimationFrame(trackFace);

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [isActive, hasPermission, mirror, onEmotionChange]);

  // ── Cleanup on unmount ──
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  // ── Render ──
  if (hasPermission === false) {
    return (
      <div className="rounded-xl bg-white/5 border border-amber-500/20 p-4 text-center">
        <div className="text-3xl mb-2">🎙️</div>
        <p className="text-amber-300/70 text-sm">{error || 'Camera not available'}</p>
        <p className="text-white/40 text-xs mt-1">Voice-only mode active</p>
      </div>
    );
  }

  return (
    <div className="relative rounded-xl overflow-hidden bg-gray-900/60 border border-white/10">
      {/* Video (hidden, used for canvas processing) */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="hidden"
      />

      {/* Canvas overlay */}
      <canvas
        ref={canvasRef}
        className="w-full aspect-[4/3] object-cover"
        style={{ transform: mirror ? 'scaleX(-1)' : 'none' }}
      />

      {/* User state indicator */}
      <div className="absolute bottom-2 left-2 right-2 flex justify-between items-center">
        <div className={`px-2 py-1 rounded-md text-[10px] font-semibold backdrop-blur-sm ${
          userState === 'looking'
            ? 'bg-green-500/30 text-green-300'
            : userState === 'speaking'
            ? 'bg-blue-500/30 text-blue-300'
            : userState === 'confused'
            ? 'bg-amber-500/30 text-amber-300'
            : userState === 'not-looking'
            ? 'bg-red-500/20 text-red-300'
            : 'bg-white/10 text-white/40'
        }`}>
          {userState === 'looking' && '👀 Attentive'}
          {userState === 'speaking' && '🎤 Speaking'}
          {userState === 'confused' && '🤔 Confused'}
          {userState === 'not-looking' && '👁️ Not looking'}
          {userState === 'unknown' && '⏳ Detecting...'}
        </div>

        <div className="px-2 py-1 rounded-md bg-white/10 text-[10px] text-white/50 backdrop-blur-sm">
          📷 Camera
        </div>
      </div>
    </div>
  );
}

// ── Helpers ──
function calculateVariance(values) {
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance = values.reduce((a, b) => a + (b - mean) ** 2, 0) / values.length;
  return variance;
}

function getDominantState(states) {
  const counts = {};
  states.forEach(s => { counts[s] = (counts[s] || 0) + 1; });
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'looking';
}

function mentionDetected(data, width, height) {
  // Rough proxy for "confused" expression: high contrast around brow area
  const browY = Math.floor(height * 0.3);
  const browX = Math.floor(width * 0.35);
  const sampleSize = Math.floor(width * 0.02);

  let topVals = [], bottomVals = [];
  for (let x = 0; x < sampleSize; x++) {
    const idxTop = ((browY - 3) * width + browX + x) * 4;
    const idxBot = ((browY + 3) * width + browX + x) * 4;
    if (idxTop >= 0 && idxBot < data.length) {
      topVals.push((data[idxTop] + data[idxTop + 1] + data[idxTop + 2]) / 3);
      bottomVals.push((data[idxBot] + data[idxBot + 1] + data[idxBot + 2]) / 3);
    }
  }

  if (topVals.length < 2) return false;
  const topAvg = topVals.reduce((a, b) => a + b, 0) / topVals.length;
  const botAvg = bottomVals.reduce((a, b) => a + b, 0) / bottomVals.length;
  // High brow contrast might indicate confusion
  return Math.abs(topAvg - botAvg) > 25;
}