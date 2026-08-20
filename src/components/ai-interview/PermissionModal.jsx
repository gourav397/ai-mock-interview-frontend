import { useState } from 'react';

/**
 * PermissionModal — Clear, clean permission request UI for mic and camera.
 * Shows before the interview starts.
 */
export default function PermissionModal({
  isOpen,
  onAllow,
  onDeny,
  cameraAllowed = false,
  micAllowed = false,
}) {
  const [cameraGranted, setCameraGranted] = useState(cameraAllowed);
  const [micGranted, setMicGranted] = useState(micAllowed);
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  const handleAllowAll = async () => {
    setIsProcessing(true);
    try {
      // Request microphone
      try {
        const micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        micStream.getTracks().forEach(t => t.stop());
        setMicGranted(true);
      } catch (micErr) {
        console.log('Mic denied');
      }

      // Request camera
      try {
        const camStream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 320 }, height: { ideal: 240 }, facingMode: 'user' },
        });
        camStream.getTracks().forEach(t => t.stop());
        setCameraGranted(true);
      } catch (camErr) {
        console.log('Camera denied');
      }

      onAllow(micGranted, cameraGranted);
    } catch (err) {
      console.log('Permission error:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeny = () => {
    setMicGranted(false);
    setCameraGranted(false);
    onDeny();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-gradient-to-b from-gray-800 to-gray-900 rounded-3xl p-8 max-w-md w-full mx-4 border border-white/10 shadow-2xl">
        {/* Icon */}
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center shadow-lg shadow-purple-500/30">
            <span className="text-4xl">🎙️</span>
          </div>
        </div>

        <h2 className="text-2xl font-bold text-white text-center mb-2">
          Permissions Required
        </h2>
        <p className="text-white/60 text-center text-sm mb-6">
          AI Voice Interview needs access to your microphone and camera.
        </p>

        {/* Permission Items */}
        <div className="space-y-3 mb-6">
          <div className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
            micGranted
              ? 'bg-green-500/10 border-green-400/30'
              : 'bg-white/5 border-white/10'
          }`}>
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg ${
              micGranted ? 'bg-green-500/20' : 'bg-white/10'
            }`}>
              🎤
            </div>
            <div className="flex-1">
              <p className="text-white font-semibold text-sm">Microphone</p>
              <p className="text-white/40 text-xs">Required for voice conversation</p>
            </div>
            {micGranted && (
              <span className="text-green-400 text-xs font-bold px-2 py-1 bg-green-500/15 rounded-md">✅ Granted</span>
            )}
          </div>

          <div className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
            cameraGranted
              ? 'bg-green-500/10 border-green-400/30'
              : 'bg-white/5 border-white/10'
          }`}>
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg ${
              cameraGranted ? 'bg-green-500/20' : 'bg-white/10'
            }`}>
              📷
            </div>
            <div className="flex-1">
              <p className="text-white font-semibold text-sm">Camera</p>
              <p className="text-white/40 text-xs">Optional — improves experience</p>
            </div>
            {cameraGranted && (
              <span className="text-green-400 text-xs font-bold px-2 py-1 bg-green-500/15 rounded-md">✅ Granted</span>
            )}
          </div>
        </div>

        {/* Info */}
        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 mb-6">
          <p className="text-amber-300/70 text-xs text-center">
            🔒 Your data is processed locally and never stored. Camera feed is not recorded.
            You can deny camera and continue with voice-only mode.
          </p>
        </div>

        {/* Buttons */}
        <div className="flex gap-3">
          <button
            onClick={handleDeny}
            disabled={isProcessing}
            className="flex-1 px-4 py-3 bg-white/10 text-white/70 rounded-xl border border-white/10 hover:bg-white/20 font-semibold transition disabled:opacity-50"
          >
            Deny All
          </button>
          <button
            onClick={handleAllowAll}
            disabled={isProcessing}
            className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-purple-600/30 transition disabled:opacity-50"
          >
            {isProcessing ? '⏳ Requesting...' : 'Allow All'}
          </button>
        </div>
      </div>
    </div>
  );
}