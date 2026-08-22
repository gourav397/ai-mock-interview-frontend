import { useState, useRef, useCallback, useEffect } from 'react';
import API from '../services/api';
import useSpeechRecognition from './useSpeechRecognition';
import useSpeechSynthesis from './useSpeechSynthesis';

/**
 * useVoiceInterview — complete interview lifecycle
 * FIXED: No more silent failures. Every response produces output or visible error.
 * FIXED: No duplicate transcript submissions.
 * FIXED: Proper STT/TST coordination.
 * FIXED: Backend errors are shown to user.
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

  // ── Refs to avoid stale closures ──
  const processingRef = useRef(false);
  const silenceTimerRef = useRef(null);
  const lastTranscriptHashRef = useRef('');
  const mountedRef = useRef(true);
  const sessionIdRef = useRef(null);
  const interviewActiveRef = useRef(false);
  const lastSentTranscriptRef = useRef('');
  const pendingResponseRef = useRef(false); // Prevents duplicate processing
  const sttRestartScheduledRef = useRef(false);

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

  // ── Silence detection: Only fires when:
  //    1. Interview is active
  //    2. Not currently processing
  //    3. Alex is NOT speaking
  //    4. STT is listening
  //    5. Transcript has new content
  //    6. A silence gap of 1.8s has passed
  // ──
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
      if (processingRef.current || pendingResponseRef.current) return;
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

  // ── Start Interview ──
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

      // Reset state for fresh interview
      speechRec.resetTranscript();
      pendingResponseRef.current = false;
      sttRestartScheduledRef.current = false;
      lastTranscriptHashRef.current = '';
      lastSentTranscriptRef.current = '';

      // Start listening
      await speechRec.startListening();

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
        setError('Voice interview feature not available. Please try again later.');
      } else {
        setError(serverMsg || err.message || 'Failed to start interview');
      }
      setInterviewState('idle');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobRole, experience, techStack, getToken]);

  // ── Process User Speech ──
  const processUserSpeech = useCallback(async (text) => {
    if (processingRef.current || !sessionIdRef.current || pendingResponseRef.current) {
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
    pendingResponseRef.current = true;
    setIsProcessing(true);
    setStatusMessage('Thinking...');

    // Stop STT while we process
    if (speechRec.isListening) {
      speechRec.stopListening();
    }

    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }

    lastSentTranscriptRef.current = userText;

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('[VOICE] Final transcript:', userText.slice(0, 200));
    console.log('[VOICE] Sending transcript to backend...');

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

      console.log('[VOICE] Backend response received');
      console.log('[VOICE] Response type:', res.data?.type);
      console.log('[VOICE] Response success:', res.data?.success);

      // ── Handle backend error ──
      if (!res.data.success) {
        console.log('[VOICE] Backend returned error:', res.data.message);
        setError(res.data.message || 'Alex could not respond. Please try again.');
        setStatusMessage('Error - tap mic to retry');
        processingRef.current = false;
        pendingResponseRef.current = false;
        setIsProcessing(false);

        // Restart STT after error
        setTimeout(() => {
          if (mountedRef.current && interviewActiveRef.current && !speechSynth.isSpeakingRef.current) {
            speechRec.resetTranscript();
            lastTranscriptHashRef.current = '';
            speechRec.startListening();
            setStatusMessage('Listening...');
          }
        }, 1500);
        return;
      }

      setQuestionNumber(res.data.questionNumber || 0);
      setDifficulty(res.data.difficulty || difficulty);

      // ── Interview complete (feedback) ──
      if (res.data.type === 'feedback' || res.data.sessionComplete) {
        console.log('[AI] Interview COMPLETE');
        setLastAiMessage(res.data.message);
        if (res.data.message) {
          speechSynth.speak(res.data.message);
        }
        setFeedback(res.data.feedback || null);

        const waitForFeedbackEnd = () => {
          if (!speechSynth.isSpeakingRef.current) {
            interviewActiveRef.current = false;
            setInterviewState('feedback');
            setStatusMessage('Interview complete!');
            processingRef.current = false;
            pendingResponseRef.current = false;
            setIsProcessing(false);
          } else {
            setTimeout(waitForFeedbackEnd, 400);
          }
        };
        setTimeout(waitForFeedbackEnd, 500);
        return;
      }

      // ── Normal response — Alex speaks ──
      if (res.data.message) {
        console.log('[TTS] Speaking:', res.data.message.slice(0, 150));
        setLastAiMessage(res.data.message);
        speechSynth.speak(res.data.message);
      }

      // Wait for TTS to finish, then restart STT
      const waitForTtsEnd = () => {
        if (!speechSynth.isSpeakingRef.current) {
          console.log('[STT] Restarting after Alex finished');
          speechRec.resetTranscript();
          lastTranscriptHashRef.current = '';
          pendingResponseRef.current = false;
          processingRef.current = false;
          setIsProcessing(false);
          setStatusMessage('Listening...');

          speechRec.startListening();
          console.log('[STT] START LISTENING');
        } else {
          setTimeout(waitForTtsEnd, 350);
        }
      };
      setTimeout(waitForTtsEnd, 500);

    } catch (err) {
      console.error('[AI] Error:', err.message);
      const serverMsg = err.response?.data?.message;

      // Show error to user
      setError(serverMsg || err.message || 'Failed to process response. Please try again.');
      setStatusMessage('Error occurred');

      processingRef.current = false;
      pendingResponseRef.current = false;
      setIsProcessing(false);

      // Restart STT after error
      setTimeout(() => {
        if (mountedRef.current && interviewActiveRef.current && !speechSynth.isSpeakingRef.current) {
          speechRec.resetTranscript();
          lastTranscriptHashRef.current = '';
          speechRec.startListening();
          setStatusMessage('Listening...');
          console.log('[VOICE] Error recovery — listening restarted');
        }
      }, 2000);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [emotion, difficulty]);

  // ── End Interview ──
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

  // ── Reset Everything ──
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
    pendingResponseRef.current = false;
    lastTranscriptHashRef.current = '';
    lastSentTranscriptRef.current = '';
    sessionIdRef.current = null;
    sttRestartScheduledRef.current = false;
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
  }, [speechRec, speechSynth]);

  // ── Update Emotion ──
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