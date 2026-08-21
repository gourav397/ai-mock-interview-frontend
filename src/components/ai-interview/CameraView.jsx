import { useState, useRef, useEffect, useCallback } from 'react';

/**
 * CameraView — self-contained camera component
 *
 * Manages its own getUserMedia lifecycle so there's no conflict with the hook.
 * Props:
 *   isActive {boolean} — start/stop camera based on interview state
 *   mirror {boolean} — flip preview horizontally (default true)
 *   onEmotionChange {function} — optional callback for detected emotion
 */
export default function CameraView({ isActive = false, mirror = true, onEmotionChange = null }) {
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const mountedRef = useRef(true);

  // Cleanup function
  const stopCamera = useCallback(() => {
    console.log('[CameraView] Stopping camera');
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        track.stop();
        console.log('[CameraView] Track stopped:', track.kind);
      });
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  }, []);

  // Start camera
  const startCamera = useCallback(async () => {
    if (!mountedRef.current) return false;

    // Already have a stream
    if (streamRef.current) {
      console.log('[CameraView] Already have stream');
      return true;
    }

    console.log('[CameraView] Requesting camera...');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 320 },
          height: { ideal: 240 },
          facingMode: 'user',
        },
        audio: false,
      });

      if (!mountedRef.current) {
        stream.getTracks().forEach(t => t.stop());
        return false;
      }

      streamRef.current = stream;
      console.log('[CameraView] Stream obtained, tracks:', stream.getTracks().length);

      // Attach to video
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        console.log('[CameraView] Stream attached to video');
        // Chrome workaround — re-assign after short delay
        setTimeout(() => {
          if (videoRef.current && streamRef.current) {
            videoRef.current.srcObject = streamRef.current;
          }
        }, 200);
      } else {
        console.warn('[CameraView] videoRef null at attach time — will retry');
        // Retry after mount
        setTimeout(() => {
          if (videoRef.current && streamRef.current && mountedRef.current) {
            videoRef.current.srcObject = streamRef.current;
            console.log('[CameraView] Stream attached (delayed)');
          }
        }, 500);
      }

      setCameraActive(true);
      setCameraError(null);
      return true;
    } catch (err) {
      console.warn('[CameraView] Error:', err.name, err.message);
      setCameraActive(false);
      if (err.name === 'NotAllowedError') {
        setCameraError('Camera permission denied. You can still continue without video.');
      } else if (err.name === 'NotFoundError') {
        setCameraError('No camera found on this device.');
      } else {
        setCameraError(`Camera error: ${err.message}`);
      }
      return false;
    }
  }, []);

  // React to isActive prop changes
  useEffect(() => {
    mountedRef.current = true;

    if (isActive) {
      // Small delay to let the page render
      const timer = setTimeout(() => {
        if (mountedRef.current) startCamera();
      }, 300);
      return () => clearTimeout(timer);
    } else {
      stopCamera();
    }

    return () => {
      mountedRef.current = false;
    };
  }, [isActive, startCamera, stopCamera]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      stopCamera();
    };
  }, [stopCamera]);

  return (
    <div className="camera-view-wrapper">
      <div className="camera-container" style={{
        position: 'relative',
        width: '100%',
        maxWidth: '320px',
        margin: '0 auto',
        borderRadius: '12px',
        overflow: 'hidden',
        backgroundColor: '#1a1a2e',
        aspectRatio: '4/3',
      }}>
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            transform: mirror ? 'scaleX(-1)' : 'none',
            display: cameraActive ? 'block' : 'none',
          }}
        />

        {!cameraActive && (
          <div className="camera-placeholder" style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#666',
            fontSize: '14px',
            padding: '20px',
            textAlign: 'center',
          }}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="1.5">
              <path d="M23 7l-7 5 7 5V7z" />
              <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
            </svg>
            <p style={{ marginTop: '8px', color: '#888' }}>
              {cameraError || (isActive ? 'Starting camera...' : 'Camera inactive')}
            </p>
          </div>
        )}

        {/* Recording indicator */}
        {cameraActive && (
          <div style={{
            position: 'absolute',
            top: '8px',
            right: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '4px 10px',
            borderRadius: '20px',
            backgroundColor: 'rgba(0,0,0,0.6)',
            fontSize: '11px',
            color: '#4ade80',
          }}>
            <span style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: '#4ade80',
              animation: cameraActive ? 'pulse 1.5s infinite' : 'none',
            }} />
            Camera
          </div>
        )}
      </div>

      {/* Simple emotion status (optional visual feedback) */}
      {cameraActive && onEmotionChange && (
        <div style={{ textAlign: 'center', marginTop: '4px', fontSize: '11px', color: '#888' }}>
          Camera active
        </div>
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  );
}