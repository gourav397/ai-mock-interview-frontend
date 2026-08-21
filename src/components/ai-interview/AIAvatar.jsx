/**
 * AIAvatar — animated avatar for Alex the interviewer
 *
 * Props:
 *   state: 'idle' | 'listening' | 'thinking' | 'speaking'
 *   emotion: 'neutral' | 'happy' | 'encouraging'
 */
export default function AIAvatar({ state = 'idle', emotion = 'neutral' }) {
  const getAvatarColor = () => {
    switch (state) {
      case 'speaking': return '#9333ea';
      case 'listening': return '#3b82f6';
      case 'thinking': return '#f59e0b';
      default: return '#6366f1';
    }
  };

  const getGlowColor = () => {
    switch (state) {
      case 'speaking': return 'rgba(147, 51, 234, 0.4)';
      case 'listening': return 'rgba(59, 130, 246, 0.3)';
      case 'thinking': return 'rgba(245, 158, 11, 0.3)';
      default: return 'rgba(99, 102, 241, 0.2)';
    }
  };

  const getMouthPath = () => {
    if (state === 'speaking') {
      // Two states for animation — alternating via CSS
      return 'M12 16 Q16 20 20 16';
    }
    return 'M12 17 Q16 19 20 17';
  };

  const getEyeStyle = () => {
    if (state === 'thinking') {
      return { transform: 'translateY(-2px)' };
    }
    if (state === 'speaking') {
      return { transform: 'scaleY(0.85)' };
    }
    return {};
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
    }}>
      {/* Avatar circle */}
      <div style={{
        position: 'relative',
        width: '120px',
        height: '120px',
        borderRadius: '50%',
        background: `radial-gradient(circle at 40% 35%, ${getAvatarColor()}44, ${getAvatarColor()}22)`,
        border: `2px solid ${getAvatarColor()}55`,
        boxShadow: `0 0 30px ${getGlowColor()}, 0 0 60px ${getGlowColor()}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'all 0.4s ease',
        animation: state === 'speaking' ? 'speakPulse 1.2s ease-in-out infinite' : 'none',
      }}>
        {/* Face */}
        <svg width="80" height="80" viewBox="0 0 32 32" fill="none">
          {/* Left eye */}
          <ellipse cx="11" cy="13" rx="2.5" ry="3" fill="white" style={getEyeStyle()} />
          <circle cx="11" cy="13" r="1.2" fill="#1a1a2e" />

          {/* Right eye */}
          <ellipse cx="21" cy="13" rx="2.5" ry="3" fill="white" style={getEyeStyle()} />
          <circle cx="21" cy="13" r="1.2" fill="#1a1a2e" />

          {/* Mouth */}
          <path
            d={getMouthPath()}
            stroke="white"
            strokeWidth="1.5"
            strokeLinecap="round"
            fill="none"
            style={{
              transition: 'd 0.2s ease',
              animation: state === 'speaking' ? 'mouthMove 0.6s ease-in-out infinite alternate' : 'none',
            }}
          />
        </svg>

        {/* Emotion indicator */}
        {emotion === 'happy' && (
          <div style={{
            position: 'absolute',
            top: '4px',
            right: '4px',
            fontSize: '16px',
            transform: 'rotate(15deg)',
          }}>
            ✨
          </div>
        )}
        {emotion === 'encouraging' && (
          <div style={{
            position: 'absolute',
            top: '4px',
            right: '4px',
            fontSize: '16px',
          }}>
            💪
          </div>
        )}
      </div>

      {/* Name */}
      <div style={{
        marginTop: '12px',
        fontSize: '16px',
        fontWeight: 700,
        background: 'linear-gradient(135deg, #a78bfa, #60a5fa)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
      }}>
        Alex 🤖
      </div>

      {/* State label */}
      <div style={{
        marginTop: '4px',
        fontSize: '12px',
        color: state === 'speaking' ? '#c084fc' :
               state === 'listening' ? '#93c5fd' :
               state === 'thinking' ? '#fcd34d' : '#999',
        fontWeight: 600,
        textTransform: 'uppercase',
        letterSpacing: '1px',
        transition: 'color 0.3s ease',
      }}>
        {state === 'speaking' ? 'Speaking...' :
         state === 'listening' ? 'Listening' :
         state === 'thinking' ? 'Thinking...' :
         'Ready'}
      </div>

      <style>{`
        @keyframes speakPulse {
          0%, 100% { box-shadow: 0 0 20px ${getGlowColor()}, 0 0 40px ${getGlowColor()}; }
          50% { box-shadow: 0 0 35px ${getGlowColor()}, 0 0 70px ${getGlowColor()}; }
        }
        @keyframes mouthMove {
          0% { d: path('M12 16 Q16 19 20 16'); }
          100% { d: path('M12 17 Q16 20 20 17'); }
        }
      `}</style>
    </div>
  );
}