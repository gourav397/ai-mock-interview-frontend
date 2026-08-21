import React, { useEffect } from 'react';

/**
 * CameraPreview component
 * Renders the camera feed from the videoRef managed by useVoiceInterview.
 * Must be wrapped inside the component that calls useVoiceInterview().
 *
 * Usage:
 *   const { videoRef, cameraActive } = useVoiceInterview();
 *   <CameraPreview videoRef={videoRef} cameraActive={cameraActive} />
 */
export default function CameraPreview({ videoRef, cameraActive, className = '' }) {
  return (
    <div className={`camera-preview ${className} ${cameraActive ? 'active' : 'inactive'}`}>
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        className="camera-video"
        style={{
          width: '100%',
          height: 'auto',
          borderRadius: '12px',
          backgroundColor: '#1a1a2e',
          transform: 'scaleX(-1)', // Mirror for self-view
          display: cameraActive ? 'block' : 'none',
          objectFit: 'cover',
        }}
      />
      {!cameraActive && (
        <div className="camera-placeholder" style={{
          width: '100%',
          aspectRatio: '4/3',
          borderRadius: '12px',
          backgroundColor: '#1a1a2e',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#666',
          fontSize: '14px',
        }}>
          Camera unavailable
        </div>
      )}
    </div>
  );
}