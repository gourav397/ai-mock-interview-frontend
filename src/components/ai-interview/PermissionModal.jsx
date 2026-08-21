import { useState, useRef, useEffect } from 'react';

/**
 * PermissionsModal — Requests mic + camera before starting interview
 */
export default function PermissionsModal({
  isOpen,
  onAllow,
  onDeny,
  cameraAllowed: initialCameraAllowed = false,
  micAllowed: initialMicAllowed = false,
}) {
  const [step, setStep] = useState('request');
  const [micStatus, setMicStatus] = useState(initialMicAllowed ? 'granted' : 'pending');
  const [camStatus, setCamStatus] = useState(initialCameraAllowed ? 'granted' : 'pending');
  const [error, setError] = useState(null);
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  // Reset when modal opens
  useEffect(() => {
    if (isOpen) {
      setStep('request');
      setMicStatus(initialMicAllowed ? 'granted' : 'pending');
      setCamStatus(initialCameraAllowed ? 'granted' : 'pending');
      setError(null);
    } else {
      // Cleanup when closing
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
        streamRef.current = null;
      }
    }
  }, [isOpen, initialMicAllowed, initialCameraAllowed]);

  const requestPermissions = async () => {
    setStep('requesting');
    setError(null);

    let micGranted = initialMicAllowed;
    let camGranted = initialCameraAllowed;

    // Request microphone
    if (!micGranted) {
      try {
        const micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        micStream.getTracks().forEach(t => t.stop()); // Stop test stream, SpeechRecognition will re-request
        micGranted = true;
        setMicStatus('granted');
      } catch (err) {
        setMicStatus('denied');
        setError('Microphone access is required for voice interview.');
        setStep('request');
        return;
      }
    }

    // Request camera
    if (!camGranted) {
      try {
        const camStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        streamRef.current = camStream;
        if (videoRef.current) {
          videoRef.current.srcObject = camStream;
        }
        camGranted = true;
        setCamStatus('granted');
      } catch (err) {
        setCamStatus('denied');
        // Camera is optional — don't block
      }
    }

    setStep('done');
    // Cleanup test stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    // Continue
    setTimeout(() => onAllow(micGranted, camGranted), 500);
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 1000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(0,0,0,0.7)',
      backdropFilter: 'blur(4px)',
    }}>
      <div style={{
        backgroundColor: '#1a1a2e',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '20px',
        padding: '32px',
        maxWidth: '420px',
        width: '90%',
        textAlign: 'center',
      }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>
          {step === 'done' ? '✅' : '🎤📷'}
        </div>

        <h2 style={{ color: '#fff', fontSize: '20px', fontWeight: 'bold', marginBottom: '8px' }}>
          {step === 'done'
            ? 'Permissions Granted!'
            : 'Microphone & Camera Access'}
        </h2>

        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '14px', marginBottom: '20px' }}>
          {step === 'done'
            ? 'Starting your interview...'
            : 'Alex needs access to your microphone (required) and camera (optional) for the voice interview.'}
        </p>

        {/* Status indicators */}
        {step !== 'done' && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: '24px', marginBottom: '24px' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{
                fontSize: '32px',
                opacity: micStatus === 'granted' ? 1 : micStatus === 'denied' ? 0.4 : 0.6,
              }}>🎙️</div>
              <div style={{
                color: micStatus === 'granted' ? '#4ade80' : micStatus === 'denied' ? '#f87171' : '#999',
                fontSize: '12px',
                fontWeight: 600,
                marginTop: '4px',
              }}>
                {micStatus === 'granted' ? 'Mic ✓' : micStatus === 'denied' ? 'Blocked' : 'Microphone'}
              </div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{
                fontSize: '32px',
                opacity: camStatus === 'granted' ? 1 : camStatus === 'denied' ? 0.4 : 0.6,
              }}>📷</div>
              <div style={{
                color: camStatus === 'granted' ? '#4ade80' : camStatus === 'denied' ? '#f87171' : '#999',
                fontSize: '12px',
                fontWeight: 600,
                marginTop: '4px',
              }}>
                {camStatus === 'granted' ? 'Camera ✓' : camStatus === 'denied' ? 'Blocked' : 'Camera'}
              </div>
            </div>
          </div>
        )}

        {error && (
          <div style={{
            padding: '10px',
            backgroundColor: 'rgba(248,113,113,0.15)',
            borderRadius: '10px',
            color: '#fca5a5',
            fontSize: '13px',
            marginBottom: '16px',
          }}>
            {error}
          </div>
        )}

        {/* Video preview for camera test */}
        {camStatus === 'granted' && (
          <div style={{
            width: '120px',
            height: '90px',
            margin: '0 auto 16px',
            borderRadius: '8px',
            overflow: 'hidden',
            backgroundColor: '#111',
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
                transform: 'scaleX(-1)',
              }}
            />
          </div>
        )}

        {step === 'request' && (
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={onDeny}
              style={{
                flex: 1,
                padding: '12px',
                backgroundColor: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.15)',
                borderRadius: '12px',
                color: '#ccc',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Skip
            </button>
            <button
              onClick={requestPermissions}
              style={{
                flex: 1,
                padding: '12px',
                background: 'linear-gradient(135deg, #9333ea, #3b82f6)',
                border: 'none',
                borderRadius: '12px',
                color: '#fff',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Allow Access
            </button>
          </div>
        )}

        {step === 'requesting' && (
          <div style={{ color: '#aaa', fontSize: '14px' }}>
            <div style={{
              width: '28px',
              height: '28px',
              border: '3px solid #9333ea',
              borderTopColor: 'transparent',
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite',
              margin: '0 auto 12px',
            }} />
            Requesting permissions...
          </div>
        )}

        {step === 'done' && (
          <div style={{
            width: '28px',
            height: '28px',
            border: '3px solid #4ade80',
            borderTopColor: 'transparent',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
            margin: '0 auto',
          }} />
        )}

        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    </div>
  );
}