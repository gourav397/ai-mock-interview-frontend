import { useState, useRef, useCallback, useEffect } from 'react';
import API from '../services/api';
import useSpeechRecognition from './useSpeechRecognition';
import useSpeechSynthesis from './useSpeechSynthesis';

/**
 * Core hook that manages the full voice interview lifecycle:
 * - Session management
 * - Speech recognition (user input)
 * - Speech synthesis (AI output)
 * - Camera-based emotion detection
 * - Conversation context
 */
export default function useVoiceInterview() {
  // ── Session State ──
  const [sessionId, setSessionId] = useState(null);
  const [interviewState, setInterviewState] = useState('idle');
  // idle → configuring → active → feedback → complete
  const [statusMessage, setStatusMessage] = useState('');
  const [error, setError] = useState(null);
  const [questionNumber, setQuestionNumber] = useState(0);
  const [difficulty, setDifficulty] = useState('Medium');
  const [feedback, setFeedback] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastAiMessage, setLastAiMessage] = useState('');
  const [emotion, setEmotion] = useState(null);

  // ── Config ──
  const [jobRole, setJobRole] = useState('');
  const [experience, setExperience] = useState('Fresher');
  const [techStack, setTechStack] = useState('');

  // ── Sub-hooks ──
  const speechRec = useSpeechRecognition({ lang: 'en-IN', continuous: true });
  const speechSynth = useSpeechSynthesis();

  // ── Refs ──
  const userMessageRef = useRef('');
  const processingRef = useRef(false);
  const autoResponseTimeout = useRef(null);
  const silenceTimerRef = useRef(null);
  const lastTranscriptLength = useRef(0);

  // ── Cleanup ──
  useEffect(() => {
    return () => {
      speechRec.stopListening();
      speechSynth.stop();
      if (autoResponseTimeout.current) clearTimeout(autoResponseTimeout.current);
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      // End session if active
      if (sessionId) {
        API.post('/ai-interview/voice/end', { sessionId })
          .catch(() => {});
      }
    };
  }, [sessionId]);

  // ── Process transcript changes ──
  useEffect(() => {
    const currentTranscript = speechRec.transcript;
    if (!currentTranscript) return;

    const newContent = currentTranscript.slice(lastTranscriptLength.current);
    lastTranscriptLength.current = currentTranscript.length;

    if (newContent.trim() && !speechSynth.isSpeaking && interviewState === 'active' && !isProcessing) {
      // Reset silence timer — user is speaking
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);

      // After 1.5s of silence since last speech, auto-process
      silenceTimerRef.current = setTimeout(() => {
        if (speechRec.isListening && !speechSynth.isSpeaking && !processingRef.current) {
          const recentText = speechRec.transcript.slice(-200);
          if (recentText.trim().length > 10) {
            processUserSpeech(recentText);
          }
        }
      }, 1500);
    }
  }, [speechRec.transcript, speechRec.isListening, speechSynth.isSpeaking, interviewState, isProcessing]);

  // ── Start Interview ──
  const startInterview = useCallback(async (config) => {
    try {
      setError(null);
      setInterviewState('configuring');
      setStatusMessage('🤖 Setting up your AI interview...');

      const role = config?.jobRole || jobRole;
      const exp = config?.experience || experience;
      const tech = config?.techStack || techStack;

      if (!role.trim()) {
        setError('Please enter a job role');
        setInterviewState('idle');
        return;
      }

      setJobRole(role);
      setExperience(exp);
      setTechStack(tech);

      // First — check auth
      const stored = localStorage.getItem('user');
      if (!stored) {
        setError('Please login first');
        setInterviewState('idle');
        return;
      }

      const token = JSON.parse(stored).token || '';

      // Start session via API
      setStatusMessage('🎙️ Starting voice interview...');
      const res = await API.post(
        '/ai-interview/voice/start',
        { jobRole: role, difficulty: config?.difficulty || 'Medium', techStack: tech, experience: exp },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (!res.data.success) {
        setError(res.data.message || 'Failed to start interview');
        setInterviewState('idle');
        return;
      }

      setSessionId(res.data.sessionId);
      setLastAiMessage(res.data.message);
      setQuestionNumber(0);
      setDifficulty(config?.difficulty || 'Medium');

      // Start listening
      speechRec.resetTranscript();
      speechRec.startListening();
      lastTranscriptLength.current = 0;

      // Speak AI's greeting
      speechSynth.speak(res.data.message);

      setInterviewState('active');
      setStatusMessage('');
    } catch (err) {
      console.error('Start interview error:', err);
      setError(err.response?.data?.message || err.message || 'Failed to start interview');
      setInterviewState('idle');
    }
  }, [jobRole, experience, techStack, speechRec, speechSynth]);

  // ── Process User Speech ──
  const processUserSpeech = useCallback(async (text) => {
    if (processingRef.current || !sessionId) return;

    const userText = (text || speechRec.transcript || '').trim();
    if (!userText || userText.length < 3) return;

    processingRef.current = true;
    setIsProcessing(true);
    setStatusMessage('🤔 Thinking...');

    // Stop listening temporarily while AI processes
    speechRec.stopListening();

    try {
      const stored = localStorage.getItem('user');
      const token = stored ? JSON.parse(stored).token : '';

      const res = await API.post(
        '/ai-interview/voice/chat',
        {
          sessionId,
          message: userText,
          emotion,
          isFinal: true,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (!res.data.success) {
        throw new Error(res.data.message || 'Failed to process');
      }

      setQuestionNumber(res.data.questionNumber || 0);
      setDifficulty(res.data.difficulty || difficulty);

      if (res.data.type === 'feedback' || res.data.sessionComplete) {
        // Interview complete — show feedback
        setLastAiMessage(res.data.message);
        speechSynth.speak(res.data.message);
        setFeedback(res.data.feedback || null);
        setInterviewState('feedback');
        setStatusMessage('✅ Interview complete!');
        return;
      }

      if (res.data.message) {
        setLastAiMessage(res.data.message);
        speechSynth.speak(res.data.message);
      }

      // Resume listening after AI finishes speaking
      const checkSpeaking = () => {
        if (!speechSynth.isSpeaking) {
          speechRec.resetTranscript();
          lastTranscriptLength.current = 0;
          speechRec.startListening();
          setIsProcessing(false);
          processingRef.current = false;
          setStatusMessage('');
        } else {
          setTimeout(checkSpeaking, 300);
        }
      };

      setTimeout(checkSpeaking, speechSynth.isSpeaking ? 0 : 500);
    } catch (err) {
      console.error('Process speech error:', err);
      setError(err.response?.data?.message || err.message || 'Failed to process response');
      setIsProcessing(false);
      processingRef.current = false;

      // Resume listening on error
      speechRec.startListening();
      setStatusMessage('');
    }
  }, [sessionId, speechRec, speechSynth, emotion, difficulty]);

  // ── End Interview ──
  const endInterview = useCallback(async () => {
    try {
      speechRec.stopListening();
      speechSynth.stop();

      if (sessionId) {
        const stored = localStorage.getItem('user');
        const token = stored ? JSON.parse(stored).token : '';
        const res = await API.post(
          '/ai-interview/voice/end',
          { sessionId },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (res.data.feedback) {
          setFeedback(res.data.feedback);
        }
      }
    } catch (err) {
      console.error('End interview error:', err);
    }

    setInterviewState('complete');
    setStatusMessage('✅ Interview ended');
  }, [sessionId, speechRec, speechSynth]);

  // ── Reset Everything ──
  const reset = useCallback(() => {
    speechRec.stopListening();
    speechSynth.stop();
    speechRec.resetTranscript();
    setSessionId(null);
    setInterviewState('idle');
    setStatusMessage('');
    setError(null);
    setQuestionNumber(0);
    setDifficulty('Medium');
    setFeedback(null);
    setIsProcessing(false);
    setLastAiMessage('');
    setEmotion(null);
    processingRef.current = false;
    lastTranscriptLength.current = 0;
  }, [speechRec, speechSynth]);

  // ── Update Emotion from Camera ──
  const updateEmotion = useCallback((newEmotion) => {
    if (newEmotion && newEmotion !== 'neutral') {
      setEmotion(newEmotion);
    }
  }, []);

  return {
    // State
    sessionId,
    interviewState,
    statusMessage,
    error,
    questionNumber,
    difficulty,
    feedback,
    isProcessing,
    lastAiMessage,
    emotion,

    // Config
    jobRole,
    setJobRole,
    experience,
    setExperience,
    techStack,
    setTechStack,

    // Sub-hook states
    speechRec,
    speechSynth,

    // Actions
    startInterview,
    processUserSpeech,
    endInterview,
    reset,
    updateEmotion,
  };
}