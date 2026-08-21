import { useState, useRef, useCallback, useEffect } from 'react';

/**
 * useSpeechRecognition — fixed version
 *
 * Fixes:
 * - No infinite no-speech restart loop (exponential backoff)
 * - Proper transcript accumulation with ref-based clean reset
 * - Clean stop/abort without double events
 * - Comprehensive debug logging
 */
export default function useSpeechRecognition({
  lang = 'en-IN',
  continuous = true,
  interimResults = true,
} = {}) {
  const [transcript, setTranscript] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState(null);

  const recognitionRef = useRef(null);
  const isListeningRef = useRef(false);
  const mountedRef = useRef(true);
  const accumulatedTranscriptRef = useRef('');
  const restartTimeoutRef = useRef(null);
  const noSpeechCountRef = useRef(0);

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

    recognition.onaudiostart = () => {
      if (!mountedRef.current) return;
      console.log('[STT] AUDIO START');
    };

    recognition.onspeechstart = () => {
      if (!mountedRef.current) return;
      console.log('[STT] SPEECH START');
      noSpeechCountRef.current = 0;
    };

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
        const newText = final.trim();
        if (newText) {
          accumulatedTranscriptRef.current =
            (accumulatedTranscriptRef.current
              ? accumulatedTranscriptRef.current + ' ' + newText
              : newText)
              .trim();
          if (accumulatedTranscriptRef.current.length > 2000) {
            accumulatedTranscriptRef.current =
              accumulatedTranscriptRef.current.slice(-2000).trim();
          }
          console.log('[STT] FINAL:', newText.slice(0, 120));
          noSpeechCountRef.current = 0;
          setTranscript(accumulatedTranscriptRef.current);
        }
      }

      if (interim) {
        const currentFinal = accumulatedTranscriptRef.current;
        const displayText = currentFinal
          ? currentFinal + ' ' + interim.trim()
          : interim.trim();
        setTranscript(displayText);
      }
    };

    recognition.onspeechend = () => {
      if (!mountedRef.current) return;
      console.log('[STT] SPEECH END');
    };

    recognition.onerror = (event) => {
      if (!mountedRef.current) return;
      console.log('[STT] Error:', event.error);

      if (event.error === 'not-allowed') {
        setError('Microphone permission denied');
        isListeningRef.current = false;
        setIsListening(false);
      } else if (event.error === 'no-speech') {
        noSpeechCountRef.current++;
      } else if (event.error === 'aborted') {
        // Expected — do nothing
      } else {
        console.warn('[STT] Unhandled error:', event.error);
      }
    };

    recognition.onend = () => {
      if (!mountedRef.current) return;
      console.log('[STT] onend, listeningRef:', isListeningRef.current, 'noSpeechCount:', noSpeechCountRef.current);

      if (!isListeningRef.current) {
        setIsListening(false);
        console.log('[STT] Fully stopped');
        return;
      }

      const delay = Math.min(200 * Math.pow(1.5, noSpeechCountRef.current), 3000);
      console.log(`[STT] RESTARTING in ${Math.round(delay)}ms`);

      if (restartTimeoutRef.current) clearTimeout(restartTimeoutRef.current);
      restartTimeoutRef.current = setTimeout(() => {
        if (!mountedRef.current || !isListeningRef.current) return;
        try {
          const rec = recognitionRef.current;
          if (rec) {
            rec.start();
            console.log('[STT] Restarted successfully');
          }
        } catch (e) {
          if (e.name === 'InvalidStateError') {
            console.log('[STT] Already started — OK');
          } else {
            console.warn('[STT] Restart failed:', e.message);
          }
        }
      }, delay);
    };

    recognitionRef.current = recognition;
    return recognition;
  }, [lang, continuous, interimResults]);

  const startListening = useCallback(() => {
    const recognition = getRecognition();
    if (!recognition) return;

    if (isListeningRef.current) {
      console.log('[STT] Already listening — skipping');
      return;
    }

    if (restartTimeoutRef.current) {
      clearTimeout(restartTimeoutRef.current);
      restartTimeoutRef.current = null;
    }

    try {
      accumulatedTranscriptRef.current = '';
      noSpeechCountRef.current = 0;
      setTranscript('');
      recognition.start();
      isListeningRef.current = true;
      setIsListening(true);
      setError(null);
      console.log('[STT] STARTED');
    } catch (err) {
      console.warn('[STT] start() error:', err.message);
      if (err.name === 'InvalidStateError') {
        isListeningRef.current = true;
        setIsListening(true);
      }
    }
  }, [getRecognition]);

  const stopListening = useCallback(() => {
    console.log('[STT] STOPPING...');
    isListeningRef.current = false;

    if (restartTimeoutRef.current) {
      clearTimeout(restartTimeoutRef.current);
      restartTimeoutRef.current = null;
    }

    const recognition = recognitionRef.current;
    if (recognition) {
      try {
        recognition.abort();
      } catch (err) {
        // Ignore
      }
    }
    setIsListening(false);
    console.log('[STT] STOPPED');
  }, []);

  const resetTranscript = useCallback(() => {
    accumulatedTranscriptRef.current = '';
    setTranscript('');
    console.log('[STT] Transcript reset');
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      isListeningRef.current = false;
      if (restartTimeoutRef.current) {
        clearTimeout(restartTimeoutRef.current);
        restartTimeoutRef.current = null;
      }
      const recognition = recognitionRef.current;
      if (recognition) {
        try {
          recognition.onend = null;
          recognition.onresult = null;
          recognition.onerror = null;
          recognition.onaudiostart = null;
          recognition.onspeechstart = null;
          recognition.onspeechend = null;
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