import { useState, useRef, useCallback, useEffect } from 'react';
import API from '../services/api';
import useSpeechRecognition from './useSpeechRecognition';
import useSpeechSynthesis from './useSpeechSynthesis';

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
  const [lastUserMessage, setLastUserMessage] = useState('');
  const [emotion, setEmotion] = useState(null);

  const [jobRole, setJobRole] = useState('');
  const [experience, setExperience] = useState('Fresher');
  const [techStack, setTechStack] = useState('');

  const speechRec = useSpeechRecognition({
    lang: 'hi-IN',
    continuous: true,
  });

  const speechSynth = useSpeechSynthesis();

  const mountedRef = useRef(false);
  const interviewActiveRef = useRef(false);
  const interviewStateRef = useRef('idle');
  const sessionIdRef = useRef(null);

  const processingRef = useRef(false);
  const pendingResponseRef = useRef(false);
  const requestVersionRef = useRef(0);

  const silenceTimerRef = useRef(null);
  const speechPollTimerRef = useRef(null);
  const restartTimerRef = useRef(null);

  const lastSentTranscriptRef = useRef('');
  const lastTranscriptForProcessingRef = useRef('');

  // Keep current state available to asynchronous callbacks.
  useEffect(() => {
    interviewStateRef.current = interviewState;
  }, [interviewState]);

  useEffect(() => {
    sessionIdRef.current = sessionId;
  }, [sessionId]);

  const getToken = useCallback(() => {
    try {
      const storedUser = localStorage.getItem('user');

      if (storedUser) {
        const user = JSON.parse(storedUser);

        if (user?.token) {
          return user.token;
        }
      }

      const directToken = localStorage.getItem('token');

      if (
        directToken &&
        directToken !== 'undefined' &&
        directToken !== 'null'
      ) {
        return directToken;
      }
    } catch (err) {
      console.error('[VOICE] Could not read login token:', err);
    }

    return null;
  }, []);

  const clearTimers = useCallback(() => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }

    if (speechPollTimerRef.current) {
      clearTimeout(speechPollTimerRef.current);
      speechPollTimerRef.current = null;
    }

    if (restartTimerRef.current) {
      clearTimeout(restartTimerRef.current);
      restartTimerRef.current = null;
    }
  }, []);

  const stopAudioAndListening = useCallback(() => {
    clearTimers();

    try {
      speechRec.stopListening();
    } catch (err) {
      console.warn('[VOICE] Stop listening:', err);
    }

    try {
      speechSynth.stop();
    } catch (err) {
      console.warn('[VOICE] Stop speech:', err);
    }
  }, [clearTimers, speechRec, speechSynth]);

  // Prevent old requests from changing an ended or reset interview.
  const isCurrentInterview = useCallback(
    (version, expectedSessionId) => {
      return (
        mountedRef.current &&
        interviewActiveRef.current &&
        requestVersionRef.current === version &&
        sessionIdRef.current === expectedSessionId
      );
    },
    []
  );

  // Let ALEX finish speaking before starting the microphone.
  
  const speakThenListen = useCallback(
    (message, version, expectedSessionId, onFinished) => {
      clearTimers();

      if (!isCurrentInterview(version, expectedSessionId)) {
        return;
      }

      let finished = false;
      const startedAt = Date.now();

      const finishOnce = () => {
        if (finished) return;
        finished = true;

        if (speechPollTimerRef.current) {
          clearTimeout(speechPollTimerRef.current);
          speechPollTimerRef.current = null;
        }

        if (typeof onFinished === 'function') {
          onFinished();
        }
      };

      const waitForSpeech = () => {
        speechPollTimerRef.current = null;

        if (finished) return;

        if (!isCurrentInterview(version, expectedSessionId)) {
          return;
        }

        const speaking = Boolean(
          speechSynth.isSpeakingRef?.current
        );

        // Wait for speech to start and finish.
        // Do not start the microphone while speech is active.
        if (speaking) {
          speechPollTimerRef.current = setTimeout(
            waitForSpeech,
            250
          );
          return;
        }

        // Allow the browser time to begin playback.
        if (Date.now() - startedAt < 3000) {
          speechPollTimerRef.current = setTimeout(
            waitForSpeech,
            250
          );
          return;
        }

        finishOnce();
      };

      if (!message?.trim()) {
        finishOnce();
        return;
      }

      console.log('[VOICE DEBUG] Greeting/response:', message);
      console.log('[VOICE DEBUG] Calling speechSynth.speak()');

      try {
        speechSynth.speak(message);
      } catch (err) {
        console.error('[VOICE] Speech synthesis failed:', err);
        finishOnce();
        return;
      }

      speechPollTimerRef.current = setTimeout(
        waitForSpeech,
        250
      );
    },
    [clearTimers, isCurrentInterview, speechSynth]
  );


  const restartListening = useCallback(
    (version, expectedSessionId) => {
      if (!isCurrentInterview(version, expectedSessionId)) {
        return;
      }

      if (processingRef.current || pendingResponseRef.current) {
        return;
      }

      speechRec.resetTranscript();
      lastTranscriptForProcessingRef.current = '';

      setStatusMessage('Listening...');

      Promise.resolve(speechRec.startListening()).catch((err) => {
        if (isCurrentInterview(version, expectedSessionId)) {
          console.error(
            '[VOICE] Could not restart microphone:',
            err
          );
          setStatusMessage(
            'Mic restart failed. Tap mic to retry.'
          );
        }
      });
    },
    [isCurrentInterview, speechRec]
  );

  // Process either a spoken answer or a typed answer.
  const processUserSpeech = useCallback(
    async (text) => {
      const expectedSessionId = sessionIdRef.current;
      const version = requestVersionRef.current;
      const userText = (text || '').trim();

      if (
        !userText ||
        userText.length < 1 ||
        !expectedSessionId ||
        !isCurrentInterview(version, expectedSessionId) ||
        processingRef.current ||
        pendingResponseRef.current
      ) {
        return;
      }

      if (userText === lastSentTranscriptRef.current) {
        return;
      }

      // Display the user's answer in the chat.
      setLastUserMessage(userText);

      // Lock immediately to prevent duplicate API calls.
      processingRef.current = true;
      pendingResponseRef.current = true;
      lastSentTranscriptRef.current = userText;

      setError(null);
      setIsProcessing(true);
      setStatusMessage('Thinking...');

      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = null;
      }

      if (speechPollTimerRef.current) {
        clearTimeout(speechPollTimerRef.current);
        speechPollTimerRef.current = null;
      }

      try {
        // Microphone stays off while the answer is processed.
        speechRec.stopListening();

        console.log(
          '[VOICE] User answer:',
          userText.slice(0, 160)
        );

        const res = await API.post(
          '/api/ai-interview/voice/chat',
          {
            sessionId: expectedSessionId,
            message: userText,
            emotion,
            isFinal: true,
          },
          { timeout: 45000 }
        );

        if (!isCurrentInterview(version, expectedSessionId)) {
          return;
        }

        if (!res.data?.success) {
          throw new Error(
            res.data?.message ||
              'ALEX could not process your answer.'
          );
        }

        const data = res.data;

        setQuestionNumber(data.questionNumber ?? 0);

        if (data.difficulty) {
          setDifficulty(data.difficulty);
        }

        const isComplete =
          data.type === 'feedback' ||
          data.sessionComplete === true;

        if (isComplete) {
          setFeedback(data.feedback || null);
          setLastAiMessage(data.message || '');

          pendingResponseRef.current = false;
          processingRef.current = false;
          setIsProcessing(false);

          speakThenListen(
            data.message || '',
            version,
            expectedSessionId,
            () => {
              if (
                !isCurrentInterview(
                  version,
                  expectedSessionId
                )
              ) {
                return;
              }

              interviewActiveRef.current = false;
              setInterviewState('feedback');
              setStatusMessage('Interview complete!');
            }
          );

          return;
        }

        const answerMessage = (data.message || '').trim();

        setLastAiMessage(answerMessage);

        // Release the request lock before the next listening cycle.
        pendingResponseRef.current = false;
        processingRef.current = false;
        setIsProcessing(false);

        speakThenListen(
          answerMessage,
          version,
          expectedSessionId,
          () => {
            restartListening(version, expectedSessionId);
          }
        );
      } catch (err) {
        if (!isCurrentInterview(version, expectedSessionId)) {
          return;
        }

        console.error(
          '[VOICE] Answer processing failed:',
          err.response?.data || err.message || err
        );

        setError(
          err.response?.data?.message ||
            err.message ||
            'Could not process your answer.'
        );

        setStatusMessage(
          'Could not process answer. Listening will retry.'
        );

        pendingResponseRef.current = false;
        processingRef.current = false;
        setIsProcessing(false);

        restartTimerRef.current = setTimeout(() => {
          restartTimerRef.current = null;

          if (
            isCurrentInterview(version, expectedSessionId)
          ) {
            restartListening(version, expectedSessionId);
          }
        }, 1000);
      }
    },
    [
      emotion,
      isCurrentInterview,
      restartListening,
      speechRec,
      speakThenListen,
    ]
  );

  // Detect silence and automatically submit a completed spoken answer.
  useEffect(() => {
    if (
      interviewState !== 'active' ||
      !interviewActiveRef.current ||
      isProcessing ||
      !speechRec.isListening ||
      speechSynth.isSpeakingRef?.current ||
      pendingResponseRef.current ||
      processingRef.current
    ) {
      return;
    }

    const transcript = (speechRec.transcript || '').trim();

    if (transcript.length < 3) {
      return;
    }

    if (transcript === lastTranscriptForProcessingRef.current) {
      return;
    }

    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
    }

    const version = requestVersionRef.current;
    const expectedSessionId = sessionIdRef.current;
    const transcriptSnapshot = transcript;

    silenceTimerRef.current = setTimeout(() => {
      silenceTimerRef.current = null;

      if (!isCurrentInterview(version, expectedSessionId)) {
        return;
      }

      if (
        processingRef.current ||
        pendingResponseRef.current ||
        speechSynth.isSpeakingRef?.current
      ) {
        return;
      }

      if (!speechRec.isListening) {
        return;
      }

      // Submit only if the transcript has not changed.
      const latestTranscript = (
        speechRec.transcript || ''
      ).trim();

      if (latestTranscript !== transcriptSnapshot) {
        return;
      }

      lastTranscriptForProcessingRef.current = latestTranscript;

      void processUserSpeech(latestTranscript);
    }, 1200);

    return () => {
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = null;
      }
    };
  }, [
    interviewState,
    isProcessing,
    speechRec.transcript,
    speechRec.isListening,
    speechSynth.isSpeakingRef,
    processUserSpeech,
    isCurrentInterview,
  ]);

  // Start interview.
  const startInterview = useCallback(
    async (config = {}) => {
      const version = ++requestVersionRef.current;

      stopAudioAndListening();

      interviewActiveRef.current = false;
      processingRef.current = false;
      pendingResponseRef.current = false;
      sessionIdRef.current = null;

      setSessionId(null);
      setError(null);
      setFeedback(null);
      setLastAiMessage('');
      setLastUserMessage('');
      setQuestionNumber(0);
      setIsProcessing(false);
      setInterviewState('configuring');
      setStatusMessage('Starting interview...');

      lastSentTranscriptRef.current = '';
      lastTranscriptForProcessingRef.current = '';

      try {
        const role = (config.jobRole ?? jobRole).trim();
        const exp = config.experience ?? experience;
        const tech = config.techStack ?? techStack;
        const selectedDifficulty = config.difficulty || 'Medium';

        if (!role) {
          setError('Please enter a job role.');
          setInterviewState('idle');
          setStatusMessage('');
          return;
        }

        const token = getToken();

        if (!token) {
          setError('Please login first.');
          setInterviewState('idle');
          setStatusMessage('');
          return;
        }

        setJobRole(role);
        setExperience(exp);
        setTechStack(tech);
        setDifficulty(selectedDifficulty);

        speechRec.resetTranscript();

        const res = await API.post(
          '/api/ai-interview/voice/start',
          {
            jobRole: role,
            difficulty: selectedDifficulty,
            techStack: tech,
            experience: exp,
          }
        );

        if (
          !mountedRef.current ||
          requestVersionRef.current !== version
        ) {
          return;
        }

        if (!res.data?.success || !res.data?.sessionId) {
          throw new Error(
            res.data?.message ||
              'Failed to start the interview.'
          );
        }

        const newSessionId = res.data.sessionId;

        sessionIdRef.current = newSessionId;
        setSessionId(newSessionId);
        setQuestionNumber(res.data.questionNumber ?? 0);
        setLastAiMessage(res.data.message || '');

        interviewActiveRef.current = true;
        setInterviewState('active');
        setStatusMessage('ALEX is speaking...');

        // Start the microphone only after the greeting.
        speakThenListen(
          res.data.message || '',
          version,
          newSessionId,
          () => {
            restartListening(version, newSessionId);
          }
        );

        console.log(
          '[VOICE] Interview started:',
          newSessionId
        );
      } catch (err) {
        if (
          !mountedRef.current ||
          requestVersionRef.current !== version
        ) {
          return;
        }

        console.error(
          '[VOICE] Start failed:',
          err.response?.data || err.message || err
        );

        interviewActiveRef.current = false;

        setError(
          err.response?.data?.message ||
            err.message ||
            'Failed to start interview.'
        );

        setInterviewState('idle');
        setStatusMessage('');
      }
    },
    [
      experience,
      getToken,
      jobRole,
      restartListening,
      speakThenListen,
      speechRec,
      stopAudioAndListening,
      techStack,
    ]
  );

  // End interview.
  const endInterview = useCallback(async () => {
    const endingSessionId = sessionIdRef.current;

    ++requestVersionRef.current;
    interviewActiveRef.current = false;
    processingRef.current = false;
    pendingResponseRef.current = false;

    stopAudioAndListening();

    setIsProcessing(false);
    setInterviewState('complete');
    setStatusMessage('Interview ended');

    if (endingSessionId) {
      try {
        await API.post('/api/ai-interview/voice/end', {
          sessionId: endingSessionId,
        });
      } catch (err) {
        console.error(
          '[VOICE] End-session request failed:',
          err.response?.data || err.message || err
        );
      }
    }
  }, [stopAudioAndListening]);

  // Reset interview.
  const reset = useCallback(() => {
    ++requestVersionRef.current;
    interviewActiveRef.current = false;
    processingRef.current = false;
    pendingResponseRef.current = false;

    stopAudioAndListening();

    sessionIdRef.current = null;
    lastSentTranscriptRef.current = '';
    lastTranscriptForProcessingRef.current = '';

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
    setLastUserMessage('');
    setEmotion(null);
  }, [speechRec, stopAudioAndListening]);

  const updateEmotion = useCallback((newEmotion) => {
    if (newEmotion && newEmotion !== 'neutral') {
      setEmotion(newEmotion);
    }
  }, []);


  // Cleanup when the component unmounts.
  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
      interviewActiveRef.current = false;
      ++requestVersionRef.current;

      clearTimers();

      try {
        speechRec.stopListening();
      } catch (err) {
        // Ignore cleanup errors.
      }

      try {
        speechSynth.stop();
      } catch (err) {
        // Ignore cleanup errors.
      }
    };
  }, [
    clearTimers,
    speechRec.stopListening,
    speechSynth.stop,
  ]);


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
  };
}