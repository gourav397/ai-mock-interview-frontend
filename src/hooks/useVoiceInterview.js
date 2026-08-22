import { useState, useRef, useCallback, useEffect } from 'react';
import API from '../services/api';
import useSpeechRecognition from './useSpeechRecognition';
import useSpeechSynthesis from './useSpeechSynthesis';

/**
 * useVoiceInterview — FAST, MULTI-LANGUAGE interview lifecycle
 *
 * Key improvements:
 * - Faster silence detection: 1000ms instead of 1800ms
 * - Auto language detection from STT
 * - Gemini fallback built-in
 * - Clean state management
 */
export default function useVoiceInterview() {
  const [sessionId, setSessionId] = useState(null);
  const [interviewState, setInterviewState] = useState('idle');
  const [statusMessage, setStatusMessage] = useState('');
  const [error, setError] = useState(null);
  const [questionNumber, setQuestionNumber] = useState(0);
  const [difficulty, setDifficulty] = useState('Medium');
  const [feedback, setFeedback] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastAiMessage, setLastAiMessage] = useState('');
  const [emotion, setEmotion] = useState(null);

  const [jobRole, setJobRole] = useState('');
  const [experience, setExperience] = useState('Fresher');
  const [techStack, setTechStack] = useState('');

  const speechRec = useSpeechRecognition({ lang: 'hi-IN', continuous: true });
  const speechSynth = useSpeechSynthesis();

  const processingRef = useRef(false);
  const silenceTimerRef = useRef(null);
  const mountedRef = useRef(true);
  const sessionIdRef = useRef(null);
  const interviewActiveRef = useRef(false);
  const lastSentTranscriptRef = useRef('');
  const pendingResponseRef = useRef(false);
  const lastTranscriptForProcessingRef = useRef('');

  useEffect(() => { sessionIdRef.current = sessionId; }, [sessionId]);

  const getToken = useCallback(() => {
    try {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        const user = JSON.parse(storedUser);
        if (user?.token) return user.token;
      }
      const directToken = localStorage.getItem('token');
      if (directToken && directToken !== 'undefined' && directToken !== 'null' && directToken !== '') {
        return directToken;
      }
    } catch (e) {}
    return null;
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      interviewActiveRef.current = false;
      speechRec.stopListening();
      speechSynth.stop();
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Silence detection: 1000ms gap → send to backend ──
  useEffect(() => {
    if (
      interviewState !== 'active' ||
      isProcessing ||
      speechSynth.isSpeakingRef.current ||
      !speechRec.isListening ||
      pendingResponseRef.current
    ) {
      return;
    }

    const currentTranscript = speechRec.transcript;
    if (!currentTranscript || currentTranscript.trim().length < 3) return;

    // Only process if transcript CHANGED
    if (currentTranscript === lastTranscriptForProcessingRef.current) return;
    lastTranscriptForProcessingRef.current = currentTranscript;

    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);

    silenceTimerRef.current = setTimeout(() => {
      if (!mountedRef.current) return;
      if (interviewState !== 'active') return;
      if (speechSynth.isSpeakingRef.current) return;
      if (processingRef.current || pendingResponseRef.current) return;
      if (!speechRec.isListening) return;

      const textToSend = speechRec.transcript;
      if (!textToSend || textToSend.trim().length < 3) return;

      processUserSpeech(textToSend);
    }, 1000); // ⚡ 1000ms — faster response!
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    speechRec.transcript,
    speechRec.isListening,
    speechSynth.isSpeakingRef.current,
    interviewState,
    isProcessing,
  ]);

  // ── Start Interview ──
  const startInterview = useCallback(async (config) => {
    try {
      setError(null);
      setInterviewState('configuring');
      setStatusMessage('Starting...');

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

      const token = getToken();
      if (!token) {
        setError('Please login first');
        setInterviewState('idle');
        return;
      }

      setStatusMessage('Starting voice interview...');

      const res = await API.post('/ai-interview/voice/start', {
        jobRole: role,
        difficulty: config?.difficulty || 'Medium',
        techStack: tech,
        experience: exp,
      });

      if (!res.data.success) {
        setError(res.data.message || 'Failed to start interview');
        setInterviewState('idle');
        return;
      }

      setSessionId(res.data.sessionId);
      setLastAiMessage(res.data.message);
      setQuestionNumber(0);
      setDifficulty(config?.difficulty || 'Medium');
      interviewActiveRef.current = true;

      // Reset all state
      speechRec.resetTranscript();
      pendingResponseRef.current = false;
      lastSentTranscriptRef.current = '';
      lastTranscriptForProcessingRef.current = '';

      // Start listening
      await speechRec.startListening();

      // Speak greeting
      if (res.data.message) speechSynth.speak(res.data.message);

      setInterviewState('active');
      setStatusMessage('Listening...');
      console.log('[HOOK] Interview started, session:', res.data.sessionId);
    } catch (err) {
      const serverMsg = err.response?.data?.message;
      setError(serverMsg || err.message || 'Failed to start interview');
      setInterviewState('idle');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobRole, experience, techStack, getToken]);

  // ── Process User Speech ──
  const processUserSpeech = useCallback(async (text) => {
    if (processingRef.current || !sessionIdRef.current || pendingResponseRef.current) {
      return;
    }

    const userText = (text || '').trim();
    if (!userText || userText.length < 3) return;

    if (userText === lastSentTranscriptRef.current) return;

    processingRef.current = true;
    pendingResponseRef.current = true;
    setIsProcessing(true);
    setStatusMessage('Thinking...');

    // Stop STT while processing
    if (speechRec.isListening) speechRec.stopListening();

    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }

    lastSentTranscriptRef.current = userText;
    console.log('[VOICE] Sending:', userText.slice(0, 100));

    try {
      const res = await API.post('/ai-interview/voice/chat', {
        sessionId: sessionIdRef.current,
        message: userText,
        emotion,
        isFinal: true,
      }, { timeout: 45000 });

      // Handle backend error
      if (!res.data.success) {
        setStatusMessage('Tap mic to retry');
        processingRef.current = false;
        pendingResponseRef.current = false;
        setIsProcessing(false);
        setTimeout(() => {
          if (mountedRef.current && interviewActiveRef.current && !speechSynth.isSpeakingRef.current) {
            speechRec.resetTranscript();
            lastTranscriptForProcessingRef.current = '';
            speechRec.startListening();
            setStatusMessage('Listening...');
          }
        }, 1000);
        return;
      }

      setQuestionNumber(res.data.questionNumber || 0);
      setDifficulty(res.data.difficulty || difficulty);

      // Interview complete
      if (res.data.type === 'feedback' || res.data.sessionComplete) {
        setLastAiMessage(res.data.message);
        if (res.data.message) speechSynth.speak(res.data.message);
        setFeedback(res.data.feedback || null);

        const checkEnd = () => {
          if (!speechSynth.isSpeakingRef.current) {
            interviewActiveRef.current = false;
            setInterviewState('feedback');
            setStatusMessage('Interview complete!');
            processingRef.current = false;
            pendingResponseRef.current = false;
            setIsProcessing(false);
          } else {
            setTimeout(checkEnd, 400);
          }
        };
        setTimeout(checkEnd, 500);
        return;
      }

      // Normal response
      if (res.data.message) {
        setLastAiMessage(res.data.message);
        speechSynth.speak(res.data.message);
      }

      // Wait for TTS then restart STT
      const waitForTts = () => {
        if (!speechSynth.isSpeakingRef.current) {
          speechRec.resetTranscript();
          lastTranscriptForProcessingRef.current = '';
          pendingResponseRef.current = false;
          processingRef.current = false;
          setIsProcessing(false);
          setStatusMessage('Listening...');
          speechRec.startListening();
        } else {
          setTimeout(waitForTts, 300);
        }
      };
      setTimeout(waitForTts, 400);
    } catch (err) {
      setStatusMessage('Error - tap to retry');
      processingRef.current = false;
      pendingResponseRef.current = false;
      setIsProcessing(false);
      setTimeout(() => {
        if (mountedRef.current && interviewActiveRef.current && !speechSynth.isSpeakingRef.current) {
          speechRec.resetTranscript();
          lastTranscriptForProcessingRef.current = '';
          speechRec.startListening();
          setStatusMessage('Listening...');
        }
      }, 1500);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [emotion, difficulty]);

  // ── End Interview ──
  const endInterview = useCallback(async () => {
    interviewActiveRef.current = false;
    speechRec.stopListening();
    speechSynth.stop();
    if (sessionIdRef.current) {
      try { await API.post('/ai-interview/voice/end', { sessionId: sessionIdRef.current }); } catch (e) {}
    }
    setInterviewState('complete');
    setStatusMessage('Interview ended');
  }, []);

  // ── Reset ──
  const reset = useCallback(() => {
    interviewActiveRef.current = false;
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
    pendingResponseRef.current = false;
    lastSentTranscriptRef.current = '';
    lastTranscriptForProcessingRef.current = '';
    sessionIdRef.current = null;
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
  }, [speechRec, speechSynth]);

  const updateEmotion = useCallback((newEmotion) => {
    if (newEmotion && newEmotion !== 'neutral') setEmotion(newEmotion);
  }, []);

  return {
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
    jobRole, setJobRole,
    experience, setExperience,
    techStack, setTechStack,
    speechRec,
    speechSynth,
    startInterview,
    processUserSpeech,
    endInterview,
    reset,
    updateEmotion,
  };
}