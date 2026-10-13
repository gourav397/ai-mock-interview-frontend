import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AIAvatar from '../components/ai-interview/AIAvatar';
import CameraView from '../components/ai-interview/CameraView';
import PermissionsModal from '../components/ai-interview/PermissionModal';
import useVoiceInterview from '../hooks/useVoiceInterview';

export default function AIInterview() {
  const navigate = useNavigate();

  const {
    interviewState,
    statusMessage,
    error,
    questionNumber,
    difficulty,
    feedback,
    isProcessing,
    lastAiMessage,
    lastUserMessage,
    emotion,
    jobRole,
    setJobRole,
    experience,
    setExperience,
    techStack,
    setTechStack,
    speechRec,
    speechSynth,
    startInterview,
    processUserSpeech,
    endInterview,
    reset,
    updateEmotion,
  } = useVoiceInterview();

  const [showPermissions, setShowPermissions] = useState(false);
  const [messages, setMessages] = useState([]);
  const [typedMessage, setTypedMessage] = useState('');
  const [isSendingTyped, setIsSendingTyped] = useState(false);
  const [aiState, setAiState] = useState('idle');
  const [aiEmotion, setAiEmotion] = useState('neutral');

  const messageEndRef = useRef(null);
  const processedAiMessagesRef = useRef(new Set());
  const processedUserMessagesRef = useRef(new Set());
  const lastUserMessageRef = useRef('');

  const experienceLevels = [
    'Fresher',
    'Junior (0-2 yrs)',
    'Mid-Level (3-5 yrs)',
    'Senior (6-9 yrs)',
    'Lead (10+ yrs)',
  ];

  const addUserMessage = useCallback((text) => {
    const content = (text || '').trim();

    if (!content) return;

    // Avoid adding the same answer twice.
    if (processedUserMessagesRef.current.has(content)) {
      return;
    }

    processedUserMessagesRef.current.add(content);

    setMessages((previous) => [
      ...previous,
      {
        role: 'user',
        content,
      },
    ]);
  }, []);

  // Send a typed answer.
  const sendTypedMessage = async (event) => {
    event.preventDefault();

    const text = typedMessage.trim();

    if (
      !text ||
      isSendingTyped ||
      isProcessing ||
      interviewState !== 'active'
    ) {
      return;
    }

    // Add the message here; the hook may publish it too.
    addUserMessage(text);
    lastUserMessageRef.current = text;

    setTypedMessage('');
    setIsSendingTyped(true);

    try {
      if (speechSynth?.stop) {
        speechSynth.stop();
      }

      await processUserSpeech(text);
    } catch (err) {
      console.error('[AIInterview] Typed answer failed:', err);
    } finally {
      setIsSendingTyped(false);
    }
  };

  // Add each new AI response to the chat once.
  useEffect(() => {
    if (
      !lastAiMessage ||
      (interviewState !== 'active' &&
        interviewState !== 'feedback')
    ) {
      return;
    }

    const content = lastAiMessage.trim();

    if (!content || processedAiMessagesRef.current.has(content)) {
      return;
    }

    processedAiMessagesRef.current.add(content);

    setMessages((previous) => [
      ...previous,
      {
        role: 'ai',
        content,
      },
    ]);
  }, [lastAiMessage, interviewState]);

  // Add microphone-recognized or hook-published user answers.
  useEffect(() => {
    if (
      !lastUserMessage ||
      interviewState !== 'active'
    ) {
      return;
    }

    const content = lastUserMessage.trim();

    if (!content) return;

    // The typed-message handler already displayed this answer.
    // Don't add it again when the hook publishes the same text.
    if (content === lastUserMessageRef.current) {
      lastUserMessageRef.current = '';
      return;
    }

    addUserMessage(content);
  }, [lastUserMessage, interviewState, addUserMessage]);

  // Show the current speech-recognition transcript while speaking.
  useEffect(() => {
    if (interviewState !== 'active') return;

    const transcript = (speechRec.transcript || '').trim();

    if (!transcript) return;

    // Keep the live transcript visible without sending it early.
    // The completed answer is added by lastUserMessage after submission.
  }, [speechRec.transcript, interviewState]);

  // Update the avatar according to interview state.
  useEffect(() => {
    const interval = setInterval(() => {
      if (speechSynth.isSpeakingRef?.current) {
        setAiState('speaking');
        setAiEmotion('happy');
      } else if (isProcessing) {
        setAiState('thinking');
        setAiEmotion('neutral');
      } else if (
        speechRec.isListening &&
        interviewState === 'active'
      ) {
        setAiState('listening');
        setAiEmotion('neutral');
      } else if (interviewState === 'feedback') {
        setAiState('idle');
        setAiEmotion('neutral');
      } else if (interviewState === 'active') {
        setAiState('listening');
        setAiEmotion('neutral');
      } else {
        setAiState('idle');
        setAiEmotion('neutral');
      }
    }, 300);

    return () => clearInterval(interval);
  }, [
    speechSynth.isSpeakingRef,
    isProcessing,
    speechRec.isListening,
    interviewState,
  ]);

  // Scroll chat to the newest message or live transcript.
  useEffect(() => {
    messageEndRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'end',
    });
  }, [messages, speechRec.transcript]);

  const clearChat = () => {
    setMessages([]);
    setTypedMessage('');
    setIsSendingTyped(false);
    processedAiMessagesRef.current.clear();
    processedUserMessagesRef.current.clear();
    lastUserMessageRef.current = '';
  };

  const handleStartInterview = () => {
    clearChat();
    startInterview({
      jobRole,
      experience,
      techStack,
    });
  };

  // Interview setup screen.
  if (interviewState === 'idle') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-indigo-950 to-slate-900">
        <header className="bg-white/5 backdrop-blur-xl border-b border-white/10 sticky top-0 z-50">
          <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
            <Link to="/dashboard" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xs">AI</span>
              </div>
              <span className="text-white font-bold">Interview</span>
            </Link>

            <button
              onClick={() => navigate('/dashboard')}
              className="text-purple-300 hover:text-white transition text-sm"
            >
              ← Dashboard
            </button>
          </div>
        </header>

        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="flex flex-col items-center justify-center bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10">
              <AIAvatar state="idle" emotion="neutral" />

              <h2 className="text-white text-xl font-bold mt-6">
                AI Interview
              </h2>

              <p className="text-white/50 text-sm text-center mt-1">
                Have a voice conversation with Alex, your AI interviewer.
              </p>

              <div className="flex flex-wrap justify-center gap-2 mt-3">
                <span className="px-3 py-1 bg-green-500/15 text-green-300 text-xs rounded-full border border-green-400/30">
                  🎙️ Voice
                </span>
                <span className="px-3 py-1 bg-blue-500/15 text-blue-300 text-xs rounded-full border border-blue-400/30">
                  📷 Camera
                </span>
                <span className="px-3 py-1 bg-purple-500/15 text-purple-300 text-xs rounded-full border border-purple-400/30">
                  🧠 Adaptive
                </span>
              </div>
            </div>

            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10">
              <h2 className="text-2xl font-bold text-white">
                🎤 Start Interview
              </h2>

              <p className="text-white/50 text-sm mt-1">
                Fill in your details to begin.
              </p>

              <div className="mt-6 space-y-4">
                <div>
                  <label className="text-white/70 text-sm font-semibold block mb-1.5">
                    💼 Job Role <span className="text-red-400">*</span>
                  </label>

                  <input
                    type="text"
                    placeholder="e.g. Frontend Developer, DevOps Engineer"
                    value={jobRole}
                    onChange={(event) => setJobRole(event.target.value)}
                    className="w-full bg-white/10 border border-white/20 text-white p-3 rounded-xl placeholder-white/30 focus:border-purple-400 focus:outline-none focus:ring-1 focus:ring-purple-400/50"
                  />
                </div>

                <div>
                  <label className="text-white/70 text-sm font-semibold block mb-1.5">
                    🛠️ Tech Stack <span className="text-red-400">*</span>
                  </label>

                  <input
                    type="text"
                    placeholder="e.g. React, Node.js, Python, AWS"
                    value={techStack}
                    onChange={(event) => setTechStack(event.target.value)}
                    className="w-full bg-white/10 border border-white/20 text-white p-3 rounded-xl placeholder-white/30 focus:border-purple-400 focus:outline-none focus:ring-1 focus:ring-purple-400/50"
                  />
                </div>

                <div>
                  <label className="text-white/70 text-sm font-semibold block mb-1.5">
                    📅 Experience
                  </label>

                  <select
                    value={experience}
                    onChange={(event) => setExperience(event.target.value)}
                    className="w-full bg-white/10 border border-white/20 text-white p-3 rounded-xl"
                  >
                    {experienceLevels.map((level) => (
                      <option
                        key={level}
                        className="bg-gray-800"
                        value={level}
                      >
                        {level}
                      </option>
                    ))}
                  </select>
                </div>

                {error && (
                  <div className="p-3 rounded-xl bg-red-500/15 border border-red-400/30 text-red-300 text-sm">
                    ⚠️ {error}
                  </div>
                )}

                {speechRec.micAvailable === false && (
                  <div className="p-3 rounded-xl bg-red-500/15 border border-red-400/30 text-red-300 text-sm">
                    🎙️ Microphone is unavailable. Please allow microphone access in your browser settings.
                  </div>
                )}

                <button
                  onClick={() => setShowPermissions(true)}
                  disabled={speechRec.micAvailable === false}
                  className="w-full py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-purple-600/30 transition-all text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  🚀 Start Voice Interview
                </button>

                <p className="text-white/30 text-xs text-center">
                  By starting, you agree to microphone and camera access for the interview session.
                </p>
              </div>
            </div>
          </div>
        </div>

        <PermissionsModal
          isOpen={showPermissions}
          onAllow={() => {
            setShowPermissions(false);
            handleStartInterview();
          }}
          onDeny={() => {
            setShowPermissions(false);
            handleStartInterview();
          }}
          cameraAllowed={false}
          micAllowed={false}
        />
      </div>
    );
  }

  // Active interview and feedback screen.
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-indigo-950 to-slate-900">
      <header className="bg-white/5 backdrop-blur-xl border-b border-white/10 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xs">AI</span>
            </div>
            <span className="text-white font-bold">Voice Interview</span>
          </Link>

          <div className="flex items-center gap-4 text-sm">
            <span className="text-white/50">
              {jobRole || 'Interview'}
            </span>

            <span
              className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                difficulty === 'Hard'
                  ? 'bg-red-500/20 text-red-300'
                  : difficulty === 'Medium'
                    ? 'bg-yellow-500/20 text-yellow-300'
                    : 'bg-green-500/20 text-green-300'
              }`}
            >
              {difficulty}
            </span>

            <span className="text-white/50">Q: {questionNumber}</span>

            {interviewState === 'active' && (
              <button
                onClick={endInterview}
                className="px-3 py-1.5 bg-red-500/20 text-red-300 rounded-lg border border-red-400/30 hover:bg-red-500/30 transition text-xs font-semibold"
              >
                ⏹️ End
              </button>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 sticky top-24">
              <AIAvatar state={aiState} emotion={aiEmotion} />

              <div className="mt-4 space-y-2">
                <div
                  className={`p-2.5 rounded-xl text-center text-sm font-semibold transition-all ${
                    speechSynth.isSpeaking
                      ? 'bg-purple-500/20 text-purple-300 border border-purple-400/30 animate-pulse'
                      : isProcessing
                        ? 'bg-amber-500/15 text-amber-300 border border-amber-400/20'
                        : speechRec.isListening && interviewState === 'active'
                          ? 'bg-blue-500/15 text-blue-300 border border-blue-400/20'
                          : interviewState === 'feedback'
                            ? 'bg-green-500/15 text-green-300 border border-green-400/20'
                            : 'bg-white/5 text-white/50 border border-white/10'
                  }`}
                >
                  {speechSynth.isSpeaking && '🎙️ Alex is speaking...'}
                  {!speechSynth.isSpeaking && isProcessing && '🤔 Thinking...'}
                  {!speechSynth.isSpeaking &&
                    !isProcessing &&
                    speechRec.isListening &&
                    interviewState === 'active' &&
                    '👂 Listening...'}
                  {!speechSynth.isSpeaking &&
                    !isProcessing &&
                    !speechRec.isListening &&
                    interviewState === 'active' &&
                    '⏳ Processing...'}
                  {interviewState === 'feedback' && '✅ Interview Complete'}
                  {interviewState === 'configuring' && '⚙️ Setting up...'}
                </div>

                {statusMessage && (
                  <div className="text-xs text-purple-300/70 text-center">
                    {statusMessage}
                  </div>
                )}

                {speechRec.micAvailable === false && (
                  <div className="text-xs text-red-300/80 text-center p-2 bg-red-500/10 rounded-xl">
                    🎙️ Microphone unavailable. Check browser permissions.
                  </div>
                )}
              </div>

              <div className="mt-4 flex justify-center">
                <div
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold transition-all ${
                    speechRec.isListening
                      ? 'bg-green-500/20 text-green-300 border border-green-400/30'
                      : 'bg-white/10 text-white/40 border border-white/10'
                  }`}
                >
                  <span
                    className={`w-2.5 h-2.5 rounded-full ${
                      speechRec.isListening
                        ? 'bg-green-400 animate-pulse'
                        : 'bg-white/30'
                    }`}
                  />
                  {speechRec.isListening ? 'Mic Active' : 'Mic Off'}
                </div>
              </div>

              <div className="mt-3 flex justify-center">
                <div className="text-[11px] px-3 py-1 rounded-full bg-white/5 text-white/40 border border-white/10">
                  🌐 Alex matches your language
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-3 border border-white/10">
              <CameraView
                isActive={interviewState === 'active'}
                onEmotionChange={updateEmotion}
                mirror={true}
              />
            </div>

            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-5 border border-white/10">
              <div className="max-h-[400px] overflow-y-auto">
                <div className="space-y-3">
                  {messages.length === 0 &&
                    interviewState === 'configuring' && (
                      <div className="text-center py-8">
                        <div className="w-10 h-10 border-4 border-purple-400 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                        <p className="text-white/50 text-sm">
                          {statusMessage || 'Setting up...'}
                        </p>
                      </div>
                    )}

                  {messages.length === 0 &&
                    interviewState === 'active' && (
                      <div className="text-center py-8">
                        <p className="text-white/50">
                          🎤 Alex is saying something...
                        </p>
                      </div>
                    )}

                  {messages.map((msg, idx) => (
                    <div
                      key={`${idx}-${msg.role}`}
                      className={`flex ${
                        msg.role === 'user'
                          ? 'justify-end'
                          : 'justify-start'
                      }`}
                    >
                      <div
                        className={`max-w-[80%] p-3 rounded-2xl text-sm leading-relaxed ${
                          msg.role === 'user'
                            ? 'bg-gradient-to-l from-purple-600/40 to-blue-600/40 text-white border border-purple-400/30 rounded-tr-sm'
                            : 'bg-white/10 text-white/90 border border-white/10 rounded-tl-sm'
                        }`}
                      >
                        <span
                          className={`font-bold text-xs block mb-1 ${
                            msg.role === 'user'
                              ? 'text-blue-300'
                              : 'text-purple-300'
                          }`}
                        >
                          {msg.role === 'user' ? 'You 👤' : 'Alex 🤖'}
                        </span>

                        <p className="whitespace-pre-wrap">
                          {msg.content}
                        </p>
                      </div>
                    </div>
                  ))}

                  {/* Show live speech recognition before submission. */}
                  {interviewState === 'active' &&
                    speechRec.isListening &&
                    speechRec.transcript?.trim() &&
                    !isProcessing && (
                      <div className="flex justify-end">
                        <div className="max-w-[80%] p-3 rounded-2xl text-sm leading-relaxed bg-blue-500/10 text-white/80 border border-blue-400/30 rounded-tr-sm">
                          <span className="text-blue-300 font-bold text-xs block mb-1">
                            You 👤 · Listening transcript
                          </span>
                          <p className="whitespace-pre-wrap">
                            {speechRec.transcript.trim()}
                          </p>
                        </div>
                      </div>
                    )}

                  <div ref={messageEndRef} />
                </div>
              </div>

              {interviewState === 'active' && (
                <form
                  onSubmit={sendTypedMessage}
                  className="mt-4 flex gap-2 border-t border-white/10 pt-4"
                >
                  <input
                    type="text"
                    value={typedMessage}
                    onChange={(event) => setTypedMessage(event.target.value)}
                    placeholder="Type your answer to Alex..."
                    disabled={isSendingTyped || isProcessing}
                    aria-label="Type your interview answer"
                    className="min-w-0 flex-1 rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm text-white placeholder-white/40 outline-none focus:border-purple-400 disabled:opacity-50"
                  />

                  <button
                    type="submit"
                    disabled={
                      !typedMessage.trim() ||
                      isSendingTyped ||
                      isProcessing
                    }
                    className="rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 px-5 py-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {isSendingTyped ? 'Sending...' : 'Send'}
                  </button>
                </form>
              )}
            </div>

            {interviewState === 'feedback' && feedback && (
              <div className="bg-gradient-to-br from-purple-600/20 via-blue-600/10 to-indigo-800/20 backdrop-blur-sm rounded-2xl p-6 border border-purple-500/20">
                <h3 className="text-white font-bold text-xl mb-4">
                  📊 Interview Feedback
                </h3>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                  <div className="bg-white/5 rounded-xl p-3 text-center">
                    <p className="text-2xl font-bold text-purple-300">
                      {feedback.totalQuestions || questionNumber}
                    </p>
                    <p className="text-white/50 text-xs mt-1">Questions</p>
                  </div>

                  <div className="bg-white/5 rounded-xl p-3 text-center">
                    <p className="text-2xl font-bold text-blue-300">
                      {feedback.averageQuality || 0}%
                    </p>
                    <p className="text-white/50 text-xs mt-1">Quality</p>
                  </div>

                  <div className="bg-white/5 rounded-xl p-3 text-center">
                    <p className="text-2xl font-bold text-emerald-300">
                      {feedback.technicalDepth || 0}%
                    </p>
                    <p className="text-white/50 text-xs mt-1">Technical</p>
                  </div>

                  <div className="bg-white/5 rounded-xl p-3 text-center">
                    <p className="text-2xl font-bold text-amber-300">
                      {feedback.duration || 0}m
                    </p>
                    <p className="text-white/50 text-xs mt-1">Duration</p>
                  </div>
                </div>

                {feedback.strongAreas?.length > 0 && (
                  <div className="mb-3">
                    <p className="text-green-400 font-semibold text-sm mb-1">
                      ✅ Strong Areas
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {feedback.strongAreas.map((area, idx) => (
                        <span
                          key={idx}
                          className="px-3 py-1 bg-green-500/15 text-green-300 text-xs rounded-full border border-green-400/30"
                        >
                          {area}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {feedback.improvementAreas?.length > 0 && (
                  <div className="mb-3">
                    <p className="text-amber-400 font-semibold text-sm mb-1">
                      📖 Areas to Improve
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {feedback.improvementAreas.map((area, idx) => (
                        <span
                          key={idx}
                          className="px-3 py-1 bg-amber-500/15 text-amber-300 text-xs rounded-full border border-amber-400/30"
                        >
                          {area}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {feedback.recommendation && (
                  <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-400/20 mb-4">
                    <p className="text-blue-200 text-sm">
                      <b>💡 Recommendation:</b>{' '}
                      {feedback.recommendation}
                    </p>
                  </div>
                )}

                <div className="mt-6 flex gap-3">
                  <button
                    onClick={() => {
                      clearChat();
                      reset();
                    }}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-purple-600/30 transition"
                  >
                    🔄 New Interview
                  </button>

                  <button
                    onClick={() => navigate('/dashboard')}
                    className="flex-1 px-6 py-3 bg-white/10 text-white rounded-xl border border-white/20 hover:bg-white/20 font-bold transition"
                  >
                    📋 Dashboard
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {interviewState === 'active' && (
        <div className="fixed bottom-6 right-6 z-50">
          <button
            onClick={() => {
              if (speechSynth?.stop) {
                speechSynth.stop();
              }

              if (!speechRec.isListening) {
                speechRec.resetTranscript();

                Promise.resolve(speechRec.startListening()).catch(
                  (err) => {
                    console.error(
                      '[AIInterview] Could not start microphone:',
                      err
                    );
                  }
                );
              } else {
                speechRec.stopListening();
              }
            }}
            className="w-14 h-14 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 text-white shadow-lg shadow-purple-600/30 flex items-center justify-center hover:scale-110 transition-all active:scale-95"
            title="Toggle voice listening"
            aria-label="Toggle voice listening"
          >
            {speechRec.isListening ? '🎤' : '🔇'}
          </button>
        </div>
      )}
    </div>
  );
}