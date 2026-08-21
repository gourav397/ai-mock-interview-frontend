import { useState, useRef, useCallback, useEffect } from 'react';

/**
 * Enhanced useSpeechRecognition hook
 * - Single SpeechRecognition instance managed by ref
 * - Proper cleanup on unmount
 * - No duplicate event listeners
 * - Reliable start/stop/abort flow
 */
export default function useSpeechRecognition({ lang = 'en-IN', continuous = true, interimResults = true } = {}) {
  const [transcript, setTranscript] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState(null);

  const recognitionRef = useRef(null);
  const isListeningRef = useRef(false);
  const mountedRef = useRef(true);

  // Initialize SpeechRecognition once
  const getRecognition = useCallback(() => {
    if (recognitionRef.current) return recognitionRef.current;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError('Speech recognition not supported in this browser');
      return null;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = lang;
    recognition.continuous = continuous;
    recognition.interimResults = interimResults;
    recognition.maxAlternatives = 1;

    let finalTranscript = '';

    recognition.onresult = (event) => {
      if (!mountedRef.current) return;

      let interim = '';
      let final = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          final += result[0].transcript;
        } else {
          interim += result[0].transcript;
        }
      }

      if (final) {
        finalTranscript += ' ' + final;
        // Trim and keep the last ~1000 chars to avoid memory bloat
        if (finalTranscript.length > 1000) {
          finalTranscript = finalTranscript.slice(-1000);
        }
        setTranscript(finalTranscript.trim());
      } else if (interim) {
        // For interim results, append to current transcript for real-time feel
        setTranscript(prev => {
          // Keep the final part, replace the interim part
          const finalPart = finalTranscript.trim();
          return finalPart ? finalPart + ' ' + interim : interim;
        });
      }
    };

    recognition.onerror = (event) => {
      if (!mountedRef.current) return;
      console.warn('[STT] Error:', event.error);

      if (event.error === 'not-allowed') {
        setError('Microphone permission denied');
        setIsListening(false);
        isListeningRef.current = false;
      } else if (event.error === 'no-speech') {
        // No speech detected — just restart silently if we're supposed to be listening
        if (isListeningRef.current && mountedRef.current) {
          try { recognition.start(); } catch (e) { /* ignore */ }
        }
      } else if (event.error === 'aborted') {
        // Expected when we call stop() — do nothing
      } else {
        setError(`Recognition error: ${event.error}`);
        setIsListening(false);
        isListeningRef.current = false;
      }
    };

    recognition.onend = () => {
      if (!mountedRef.current) return;
      console.log('[STT] onend fired, isListeningRef:', isListeningRef.current);
      // Auto-restart if we're supposed to be listening (continuous mode)
      if (isListeningRef.current && mountedRef.current) {
        try {
          recognition.start();
        } catch (e) {
          if (e.name !== 'InvalidStateError') {
            console.warn('[STT] Restart error:', e.message);
          }
        }
      } else {
        setIsListening(false);
      }
    };

    recognitionRef.current = recognition;
    return recognition;
  }, [lang, continuous, interimResults]);

  const startListening = useCallback(() => {
    const recognition = getRecognition();
    if (!recognition) return;

    if (isListeningRef.current) {
      console.log('[STT] Already listening — skipping start');
      return;
    }

    try {
      setTranscript('');
      recognition.start();
      isListeningRef.current = true;
      setIsListening(true);
      setError(null);
      console.log('[STT] STARTED');
    } catch (err) {
      console.warn('[STT] start() error:', err.message);
      if (err.name === 'InvalidStateError') {
        // Already started — this is fine
        isListeningRef.current = true;
        setIsListening(true);
      }
    }
  }, [getRecognition]);

  const stopListening = useCallback(() => {
    isListeningRef.current = false;
    const recognition = recognitionRef.current;
    if (!recognition) return;

    try {
      recognition.stop();
      // Also abort to prevent onend from auto-restarting
      recognition.abort();
    } catch (err) {
      // Ignore errors during stop
    }
    setIsListening(false);
    console.log('[STT] STOPPED');
  }, []);

  const resetTranscript = useCallback(() => {
    setTranscript('');
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      isListeningRef.current = false;
      const recognition = recognitionRef.current;
      if (recognition) {
        try {
          recognition.onend = null;
          recognition.onresult = null;
          recognition.onerror = null;
          recognition.abort();
        } catch (e) {
          // Ignore
        }
      }
    };
  }, []);

  return {
    transcript,
    isListening,
    error,
    startListening,
    stopListening,
    resetTranscript,
  };
}