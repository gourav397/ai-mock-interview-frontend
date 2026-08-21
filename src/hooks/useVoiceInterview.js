import { useState, useRef, useCallback, useEffect } from 'react';
import API from '../services/api';
import useSpeechRecognition from './useSpeechRecognition';
import useSpeechSynthesis from './useSpeechSynthesis';

/**
 * useVoiceInterview — complete interview lifecycle
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

  const speechRec = useSpeechRecognition({ lang: 'en-IN', continuous: true });
  const speechSynth = useSpeechSynthesis();

  const processingRef = useRef(false);
  const silenceTimerRef = useRef(null);
  const lastTranscriptHashRef = useRef('');
  const mountedRef = useRef(true);
  const sessionIdRef = useRef(null);
  const interviewActiveRef = useRef(false);
  const lastSentTranscriptRef = useRef('');

  useEffect(() => {
    sessionIdRef.current = sessionId;
  }, [sessionId]);

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
    } catch (e) {
      console.warn('getToken error:', e.message);
    }
    return null;
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      console.log('[HOOK] Unmounting');
      mountedRef.current = false;
      interviewActiveRef.current = false;
      speechRec.stopListening();
      speechSynth.stop();
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Silence detection — only fires when NO speech is happening and NEW transcript content appears ──
  useEffect(() => {
    if (
      interviewState !== 'active' ||
      isProcessing ||
      speechSynth.isSpeakingRef.current ||
      !speechRec.isListening
    ) {
      return;
    }

    const currentTranscript = speechRec.transcript;
    if (!currentTranscript || currentTranscript.trim().length < 5) return;

    // Hash-based dedup: only process NEW content
    const hash = currentTranscript.slice(-300);
    if (hash === lastTranscriptHashRef.current) return;
    lastTranscriptHashRef.current = hash;

    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);

    silenceTimerRef.current = setTimeout(() => {
      if (!mountedRef.current) return;
      if (interviewState !== 'active') return;
      if (speechSynth.isSpeakingRef.current) {
        console.log('[VOICE] Alex speaking — aborting silence callback');
        return;
      }
      if (processingRef.current) return;
      if (!speechRec.isListening) return;

      const textToSend = speechRec.transcript;
      if (!textToSend || textToSend.trim().length < 5) return;

      lastTranscriptHashRef.current = '';
      processUserSpeech(textToSend);
    }, 1800);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    speechRec.transcript,
    speechRec.isListening,
    speechSynth.isSpeakingRef.current,
    interviewState,
    isProcessing,
  ]);

  const startInterview = useCallback(async (config) => {
    try {
      setError(null);
      setInterviewState('configuring');
      setStatusMessage('Setting up...');

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

      const res = await API.post(
        '/ai-interview/voice/start',
        {
          jobRole: role,
          difficulty: config?.difficulty || 'Medium',
          techStack: tech,
          experience: exp,
        }
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
      interviewActiveRef.current = true;

      // Start listening — startInterview is async so .startListening() awaits mic check
      speechRec.resetTranscript();
      await speechRec.startListening(); // await so we know mic is working
      lastTranscriptHashRef.current = '';
      lastSentTranscriptRef.current = '';

      // Speak greeting
      if (res.data.message) {
        speechSynth.speak(res.data.message);
      }

      setInterviewState('active');
      setStatusMessage('Listening...');
      console.log('[HOOK] Interview started, session:', res.data.sessionId);
    } catch (err) {
      console.error('[HOOK] Start error:', err.message);
      const serverMsg = err.response?.data?.message;
      const status = err.response?.status;
      if (status === 401) {
        setError('Session expired. Please login again.');
      } else if (status === 404) {
        setError('Voice interview feature not available. Redeploy server.');
      } else {
        setError(serverMsg || err.message || 'Failed to start interview');
      }
      setInterviewState('idle');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobRole, experience, techStack, getToken]);

  const processUserSpeech = useCallback(async (text) => {
    if (processingRef.current || !sessionIdRef.current) {
      console.log('[VOICE] Blocked — already processing or no session');
      return;
    }

    const userText = (text || '').trim();
    if (!userText || userText.length < 5) {
      console.log('[VOICE] Blocked — text too short');
      return;
    }

    if (userText === lastSentTranscriptRef.current) {
      console.log('[VOICE] Duplicate — skipping');
      return;
    }

    processingRef.current = true;
    setIsProcessing(true);
    setStatusMessage('Thinking...');
    speechRec.stopListening();
    lastSentTranscriptRef.current = userText;

    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('[AI] SENDING USER MESSAGE:', userText.slice(0, 150));

    try {
      const res = await API.post(
        '/ai-interview/voice/chat',
        {
          sessionId: sessionIdRef.current,
          message: userText,
          emotion,
          isFinal: true,
        },
        { timeout: 45000 }
      );

      console.log('[AI] RESPONSE:', res.data?.type, 'success:', res.data?.success);

      if (!res.data.success) {
        throw new Error(res.data.message || 'Failed to process');
      }

      setQuestionNumber(res.data.questionNumber || 0);
      setDifficulty(res.data.difficulty || difficulty);

      // ── Interview complete ──
      if (res.data.type === 'feedback' || res.data.sessionComplete) {
        console.log('[AI] Interview COMPLETE');
        setLastAiMessage(res.data.message);
        if (res.data.message) speechSynth.speak(res.data.message);
        setFeedback(res.data.feedback || null);

        const waitForFeedbackEnd = () => {
          if (!speechSynth.isSpeakingRef.current) {
            interviewActiveRef.current = false;
            setInterviewState('feedback');
            setStatusMessage('Interview complete!');
            processingRef.current = false;
            setIsProcessing(false);
          } else {
            setTimeout(waitForFeedbackEnd, 400);
          }
        };
        setTimeout(waitForFeedbackEnd, 500);
        return;
      }

      // ── Normal response ──
      if (res.data.message) {
        console.log('[TTS] START (AI response)');
        setLastAiMessage(res.data.message);
        speechSynth.speak(res.data.message);
      }

      const waitForTtsEnd = () => {
        if (!speechSynth.isSpeakingRef.current) {
          console.log('[VOICE] Alex finished — restarting STT');
          speechRec.resetTranscript();
          lastTranscriptHashRef.current = '';
          speechRec.startListening();
          setIsProcessing(false);
          processingRef.current = false;
          setStatusMessage('Listening...');
          console.log('[VOICE] START LISTENING');
        } else {
          setTimeout(waitForTtsEnd, 350);
        }
      };
      setTimeout(waitForTtsEnd, 500);
    } catch (err) {
      console.error('[AI] Error:', err.message);
      const serverMsg = err.response?.data?.message;
      setError(serverMsg || err.message || 'Failed to process response');
      setIsProcessing(false);
      processingRef.current = false;
      speechRec.resetTranscript();
      lastTranscriptHashRef.current = '';
      speechRec.startListening();
      setStatusMessage('Listening...');
      console.log('[VOICE] Error recovery — listening restarted');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [emotion, difficulty]);

  const endInterview = useCallback(async () => {
    console.log('[HOOK] Ending...');
    interviewActiveRef.current = false;
    speechRec.stopListening();
    speechSynth.stop();

    if (sessionIdRef.current) {
      try {
        const res = await API.post('/ai-interview/voice/end', {
          sessionId: sessionIdRef.current,
        });
        if (res.data?.feedback) setFeedback(res.data.feedback);
      } catch (err) {
        console.error('[HOOK] End error:', err.message);
      }
    }

    setInterviewState('complete');
    setStatusMessage('Interview ended');
  }, []);

  const reset = useCallback(() => {
    console.log('[HOOK] Resetting...');
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
    lastTranscriptHashRef.current = '';
    lastSentTranscriptRef.current = '';
    sessionIdRef.current = null;
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
  }, [speechRec, speechSynth]);

  const updateEmotion = useCallback((newEmotion) => {
    if (newEmotion && newEmotion !== 'neutral') {
      setEmotion(newEmotion);
    }
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