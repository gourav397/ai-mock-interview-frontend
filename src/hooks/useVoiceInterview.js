import { useState, useRef, useCallback, useEffect } from 'react';
import API from '../services/api';
import useSpeechRecognition from './useSpeechRecognition';
import useSpeechSynthesis from './useSpeechSynthesis';

/**
 * Core hook that manages the full voice interview lifecycle
 * - Camera management (Problem 1 fix)
 * - Reliable TTS coordination with ref-based polling (Problem 2 fix)
 * - Language-matched responses (Problem 3 fix — passes user transcript to backend)
 * - Comprehensive logging for debugging
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
  const [cameraActive, setCameraActive] = useState(false);

  const [jobRole, setJobRole] = useState('');
  const [experience, setExperience] = useState('Fresher');
  const [techStack, setTechStack] = useState('');

  const speechRec = useSpeechRecognition({ lang: 'en-IN', continuous: true });
  const speechSynth = useSpeechSynthesis();

  const processingRef = useRef(false);
  const silenceTimerRef = useRef(null);
  const lastTranscriptLength = useRef(0);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const mountedRef = useRef(true);
  const lastUserTranscriptRef = useRef('');

  // ── Helper: get JWT token from localStorage ──
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

  // ── Camera Management (Problem 1) ──
  const startCamera = useCallback(async () => {
    try {
      console.log('[CAMERA] REQUESTING permission...');
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 320 },
          height: { ideal: 240 },
          facingMode: 'user',
        },
        audio: false, // Separate from SpeechRecognition to avoid conflicts
      });

      if (!mountedRef.current) {
        stream.getTracks().forEach(t => t.stop());
        return false;
      }

      streamRef.current = stream;
      console.log('[CAMERA] STREAM STARTED, tracks:', stream.getTracks().length);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        console.log('[CAMERA] STREAM ATTACHED to video element');
        // Chrome workaround: sometimes need to re-assign srcObject
        setTimeout(() => {
          if (videoRef.current && streamRef.current) {
            videoRef.current.srcObject = streamRef.current;
          }
        }, 200);
      } else {
        console.warn('[CAMERA] videoRef.current is null — video element not mounted yet');
      }

      setCameraActive(true);
      console.log('[CAMERA] ACTIVE');
      return true;
    } catch (err) {
      console.warn('[CAMERA] ERROR:', err.message);
      if (err.name === 'NotAllowedError') {
        console.warn('[CAMERA] Permission denied by user');
      } else if (err.name === 'NotFoundError') {
        console.warn('[CAMERA] No camera found on this device');
      }
      setCameraActive(false);
      return false;
    }
  }, []);

  const stopCamera = useCallback(() => {
    console.log('[CAMERA] STOPPING...');
    if (streamRef.current) {
      const tracks = streamRef.current.getTracks();
      tracks.forEach(track => {
        track.stop();
        console.log('[CAMERA] Track stopped:', track.kind);
      });
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
    console.log('[CAMERA] STOPPED');
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      console.log('[HOOK] Unmounting — cleanup');
      speechRec.stopListening();
      speechSynth.stop();
      stopCamera();
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    };
  }, [speechRec.stopListening, speechSynth.stop, stopCamera]);

  // ── Silence detection → auto-process user speech ──
  useEffect(() => {
    const currentTranscript = speechRec.transcript;
    if (!currentTranscript || interviewState !== 'active' || isProcessing) return;

    const newContent = currentTranscript.slice(lastTranscriptLength.current);
    if (!newContent.trim()) return;

    // Store the latest transcript for processing
    lastUserTranscriptRef.current = currentTranscript;

    // Only process if Alex is NOT speaking (check REF for current value)
    if (speechSynth.isSpeakingRef.current) {
      console.log('[VOICE] Alex is speaking — ignoring transcript change');
      return;
    }

    // Clear any existing silence timer
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);

    // Start silence timer: after 1.8s of silence, process the speech
    silenceTimerRef.current = setTimeout(() => {
      if (!mountedRef.current) return;
      if (!speechRec.isListening) {
        console.log('[VOICE] Not listening — skipping silence callback');
        return;
      }
      if (speechSynth.isSpeakingRef.current) {
        console.log('[VOICE] Alex started speaking — skipping silence callback');
        return;
      }
      if (processingRef.current) {
        console.log('[VOICE] Already processing — skipping silence callback');
        return;
      }

      const recentText = speechRec.transcript.slice(-500);
      if (recentText.trim().length < 5) {
        console.log('[VOICE] Transcript too short — skipping');
        return;
      }

      processUserSpeech(recentText);
    }, 1800);

    // Update lastTranscriptLength so we don't re-process same content
    lastTranscriptLength.current = currentTranscript.length;
  }, [
    speechRec.transcript,
    speechRec.isListening,
    speechSynth.isSpeakingRef,
    interviewState,
    isProcessing,
  ]);

  // ── Start Interview ──
  const startInterview = useCallback(async (config) => {
    try {
      setError(null);
      setInterviewState('configuring');
      setStatusMessage('Setting up your AI interview...');

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

      // Start camera (non-blocking — interview works without camera)
      startCamera().then(success => {
        console.log('[CAMERA] Init result:', success ? 'ON' : 'OFF or failed');
      });

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

      // Start listening
      speechRec.resetTranscript();
      speechRec.startListening();
      lastTranscriptLength.current = 0;
      lastUserTranscriptRef.current = '';

      // Speak AI's greeting
      if (res.data.message) {
        speechSynth.speak(res.data.message);
      }

      setInterviewState('active');
      setStatusMessage('');
      console.log('[HOOK] Interview started, session:', res.data.sessionId);
    } catch (err) {
      console.error('[HOOK] Start interview error:', err);
      const serverMsg = err.response?.data?.message;
      const status = err.response?.status;
      if (status === 401) {
        setError('Session expired. Please login again.');
      } else if (status === 404) {
        setError('Voice interview feature not available. Server may need redeployment.');
      } else {
        setError(serverMsg || err.message || 'Failed to start interview');
      }
      setInterviewState('idle');
    }
  }, [jobRole, experience, techStack, speechRec, speechSynth, getToken, startCamera]);

  // ── Process User Speech ──
  const processUserSpeech = useCallback(async (text) => {
    if (processingRef.current || !sessionId) {
      console.log('[VOICE] Blocked — already processing or no session');
      return;
    }

    const userText = (text || '').trim();
    if (!userText || userText.length < 5) {
      console.log('[VOICE] Blocked — text too short:', userText);
      return;
    }

    processingRef.current = true;
    setIsProcessing(true);
    setStatusMessage('Thinking...');
    speechRec.stopListening();
    lastUserTranscriptRef.current = userText;

    console.log('[VOICE] FINAL TRANSCRIPT:', userText.slice(0, 120));
    console.log('[VOICE] SENDING TO BACKEND...');

    try {
      const res = await API.post(
        '/ai-interview/voice/chat',
        {
          sessionId,
          message: userText,
          emotion,
          isFinal: true,
        },
        { timeout: 45000 }
      );

      console.log('[VOICE] BACKEND RESPONSE:', res.data?.type, res.data?.success);

      if (!res.data.success) {
        throw new Error(res.data.message || 'Failed to process');
      }

      setQuestionNumber(res.data.questionNumber || 0);
      setDifficulty(res.data.difficulty || difficulty);

      if (res.data.type === 'feedback' || res.data.sessionComplete) {
        console.log('[VOICE] Interview complete — feedback received');
        setLastAiMessage(res.data.message);
        if (res.data.message) {
          speechSynth.speak(res.data.message);
        }
        setFeedback(res.data.feedback || null);
        // Wait for TTS to finish before transitioning state
        const waitForFeedback = () => {
          if (!speechSynth.isSpeakingRef.current) {
            setInterviewState('feedback');
            setStatusMessage('Interview complete!');
            processingRef.current = false;
            setIsProcessing(false);
          } else {
            setTimeout(waitForFeedback, 500);
          }
        };
        setTimeout(waitForFeedback, 500);
        return;
      }

      if (res.data.message) {
        console.log('[VOICE] AI MESSAGE:', res.data.message.slice(0, 100));
        setLastAiMessage(res.data.message);
        speechSynth.speak(res.data.message);
      }

      // Wait for Alex to finish speaking, then restart listening
      const waitForTtsEnd = () => {
        if (!speechSynth.isSpeakingRef.current) {
          console.log('[VOICE] Alex finished speaking — restarting listening');
          speechRec.resetTranscript();
          lastTranscriptLength.current = 0;
          speechRec.startListening();
          setIsProcessing(false);
          processingRef.current = false;
          setStatusMessage('');
          console.log('[VOICE] START LISTENING');
        } else {
          // Alex is still speaking — keep waiting
          setTimeout(waitForTtsEnd, 300);
        }
      };

      // Start checking after a brief delay (to let TTS initialize)
      setTimeout(waitForTtsEnd, 400);
    } catch (err) {
      console.error('[VOICE] Process speech error:', err.message);
      const serverMsg = err.response?.data?.message;
      setError(serverMsg || err.message || 'Failed to process response');
      setIsProcessing(false);
      processingRef.current = false;
      speechRec.startListening();
      setStatusMessage('');
      console.log('[VOICE] Error recovery — listening restarted');
    }
  }, [sessionId, speechRec, speechSynth, emotion, difficulty]);

  // ── End Interview ──
  const endInterview = useCallback(async () => {
    console.log('[HOOK] Ending interview...');
    speechRec.stopListening();
    speechSynth.stop();
    stopCamera();

    if (sessionId) {
      try {
        const res = await API.post('/ai-interview/voice/end', { sessionId });
        if (res.data?.feedback) {
          setFeedback(res.data.feedback);
        }
      } catch (err) {
        console.error('[HOOK] End interview error:', err);
      }
    }

    setInterviewState('complete');
    setStatusMessage('Interview ended');
    console.log('[HOOK] Interview ended');
  }, [sessionId, speechRec, speechSynth, stopCamera]);

  // ── Reset ──
  const reset = useCallback(() => {
    console.log('[HOOK] Resetting interview state...');
    speechRec.stopListening();
    speechSynth.stop();
    speechRec.resetTranscript();
    stopCamera();
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
    lastUserTranscriptRef.current = '';
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    console.log('[HOOK] Reset complete');
  }, [speechRec, speechSynth, stopCamera]);

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
    cameraActive,
    videoRef,          // Attach to <video> element
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