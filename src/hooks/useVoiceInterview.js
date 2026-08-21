import { useState, useRef, useCallback, useEffect } from 'react';
import API from '../services/api';
import useSpeechRecognition from './useSpeechRecognition';
import useSpeechSynthesis from './useSpeechSynthesis';

/**
 * Core hook that manages the full voice interview lifecycle
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
  const lastTranscriptLength = useRef(0);

  // ── Helper: get JWT token from localStorage ──
  const getToken = useCallback(() => {
    try {
      // 1. First: from user object (primary)
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        const user = JSON.parse(storedUser);
        if (user?.token) return user.token;
      }
      // 2. Fallback: direct token key
      const directToken = localStorage.getItem('token');
      if (directToken && directToken !== 'undefined' && directToken !== 'null') {
        return directToken;
      }
    } catch (e) {
      console.warn('getToken error:', e.message);
    }
    return null;
  }, []);

  // Cleanup
  useEffect(() => {
    return () => {
      speechRec.stopListening();
      speechSynth.stop();
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    };
  }, []);

  // Process transcript changes with silence detection
  useEffect(() => {
    const currentTranscript = speechRec.transcript;
    if (!currentTranscript) return;

    const newContent = currentTranscript.slice(lastTranscriptLength.current);
    lastTranscriptLength.current = currentTranscript.length;

    if (
      newContent.trim() &&
      !speechSynth.isSpeaking &&
      interviewState === 'active' &&
      !isProcessing
    ) {
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);

      silenceTimerRef.current = setTimeout(() => {
        if (speechRec.isListening && !speechSynth.isSpeaking && !processingRef.current) {
          const recentText = speechRec.transcript.slice(-300);
          if (recentText.trim().length > 10) {
            processUserSpeech(recentText);
          }
        }
      }, 1800); // 1.8s silence before auto-processing
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

      // Get token using helper
      const token = getToken();
      if (!token) {
        setError('Please login first');
        setInterviewState('idle');
        return;
      }

      setStatusMessage('🎙️ Starting voice interview...');

      const res = await API.post(
        '/ai-interview/voice/start',
        {
          jobRole: role,
          difficulty: config?.difficulty || 'Medium',
          techStack: tech,
          experience: exp,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
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

      // Speak AI's greeting
      if (res.data.message) {
        speechSynth.speak(res.data.message);
      }

      setInterviewState('active');
      setStatusMessage('');
    } catch (err) {
      console.error('Start interview error:', err);
      const serverMsg = err.response?.data?.message;
      const status = err.response?.status;
      if (status === 401) {
        setError('Session expired. Please login again.');
      } else if (status === 404) {
        setError('Voice interview feature not available. The server may not have the latest code deployed. Please run `git push` and redeploy Railway.');
      } else {
        setError(serverMsg || err.message || 'Failed to start interview');
      }
      setInterviewState('idle');
    }
  }, [jobRole, experience, techStack, speechRec, speechSynth, getToken]);

  // ── Process User Speech ──
  const processUserSpeech = useCallback(async (text) => {
    if (processingRef.current || !sessionId) return;

    const userText = (text || speechRec.transcript || '').trim();
    if (!userText || userText.length < 5) return;

    processingRef.current = true;
    setIsProcessing(true);
    setStatusMessage('🤔 Thinking...');
    speechRec.stopListening();

    try {
      const token = getToken();

      const res = await API.post(
        '/ai-interview/voice/chat',
        {
          sessionId,
          message: userText,
          emotion,
          isFinal: true,
        },
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          timeout: 45000,
        }
      );

      if (!res.data.success) {
        throw new Error(res.data.message || 'Failed to process');
      }

      setQuestionNumber(res.data.questionNumber || 0);
      setDifficulty(res.data.difficulty || difficulty);

      if (res.data.type === 'feedback' || res.data.sessionComplete) {
        setLastAiMessage(res.data.message);
        speechSynth.speak(res.data.message);
        setFeedback(res.data.feedback || null);
        setInterviewState('feedback');
        setStatusMessage('✅ Interview complete!');
        processingRef.current = false;
        setIsProcessing(false);
        return;
      }

      if (res.data.message) {
        setLastAiMessage(res.data.message);
        speechSynth.speak(res.data.message);
      }

      // Resume listening after AI finishes speaking
      const waitForSpeechEnd = () => {
        if (!speechSynth.isSpeaking) {
          speechRec.resetTranscript();
          lastTranscriptLength.current = 0;
          speechRec.startListening();
          setIsProcessing(false);
          processingRef.current = false;
          setStatusMessage('');
        } else {
          setTimeout(waitForSpeechEnd, 500);
        }
      };

      setTimeout(waitForSpeechEnd, 300);
    } catch (err) {
      console.error('Process speech error:', err);
      const serverMsg = err.response?.data?.message;
      setError(serverMsg || err.message || 'Failed to process response');
      setIsProcessing(false);
      processingRef.current = false;
      speechRec.startListening();
      setStatusMessage('');
    }
  }, [sessionId, speechRec, speechSynth, emotion, difficulty, getToken]);

  // ── End Interview ──
  const endInterview = useCallback(async () => {
    try {
      speechRec.stopListening();
      speechSynth.stop();

      if (sessionId) {
        const token = getToken();

        const res = await API.post(
          '/ai-interview/voice/end',
          { sessionId },
          { headers: token ? { Authorization: `Bearer ${token}` } : {} }
        );
        if (res.data?.feedback) {
          setFeedback(res.data.feedback);
        }
      }
    } catch (err) {
      console.error('End interview error:', err);
    }

    setInterviewState('complete');
    setStatusMessage('✅ Interview ended');
  }, [sessionId, speechRec, speechSynth, getToken]);

  // ── Reset ──
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