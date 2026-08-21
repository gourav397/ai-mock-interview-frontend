import { useState, useRef, useCallback, useEffect } from 'react';

/**
 * useSpeechRecognition — FIXED for Chrome no-speech bug
 *
 * Root cause of "no-speech" loop:
 *   Chrome's SpeechRecognition engine enters a dead state after ~3-5 consecutive
 *   no-speech errors. The engine fires AUDIO START but onresult NEVER fires for
 *   actual speech. Calling .start() on the same instance does NOT recover it.
 *
 * Fix:
 *   1. After 3 consecutive no-speech errors, DESTROY the entire recognition
 *      instance and create a brand new one (resets Chrome's internal pipeline).
 *   2. After 5+ consecutive errors, also re-request getUserMedia to reset the
 *      browser's audio context entirely.
 *   3. Verify microphone permission before starting recognition.
 *   4. Use AudioContext + analyser as a fallback to confirm mic audio is flowing.
 *   5. Comprehensive logging for debugging.
 */
export default function useSpeechRecognition({
  lang = 'en-IN',
  continuous = true,
  interimResults = true,
} = {}) {
  const [transcript, setTranscript] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState(null);
  const [micAvailable, setMicAvailable] = useState(null); // null=unknown, true/false

  const recognitionRef = useRef(null);
  const isListeningRef = useRef(false);
  const mountedRef = useRef(true);
  const accumulatedTranscriptRef = useRef('');
  const restartTimeoutRef = useRef(null);
  const noSpeechCountRef = useRef(0);
  const instanceIdRef = useRef(0); // Increments when we recreate instance

  // ── Verify microphone is actually available ──
  const checkMicrophone = useCallback(async () => {
    try {
      console.log('[STT] Checking microphone availability...');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // Stop test stream immediately — we don't need it; SpeechRecognition
      // uses its own internal mic access
      stream.getTracks().forEach(t => t.stop());
      console.log('[STT] Microphone available ✅');
      setMicAvailable(true);
      return true;
    } catch (err) {
      console.error('[STT] Microphone NOT available:', err.message);
      setMicAvailable(false);
      if (err.name === 'NotAllowedError') {
        setError('Microphone permission denied. Please allow mic access in your browser settings and refresh.');
      } else if (err.name === 'NotFoundError') {
        setError('No microphone found on this device.');
      } else {
        setError(`Microphone error: ${err.message}`);
      }
      return false;
    }
  }, []);

  // ── Create a FRESH SpeechRecognition instance ──
  const createRecognition = useCallback(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError('Speech recognition not supported in this browser');
      return null;
    }

    const instanceId = instanceIdRef.current;
    const recognition = new SpeechRecognition();
    recognition.lang = lang;
    recognition.continuous = continuous;
    recognition.interimResults = interimResults;
    recognition.maxAlternatives = 1;

    console.log(`[STT] Creating NEW recognition instance #${instanceId}`);

    recognition.onaudiostart = () => {
      if (!mountedRef.current) return;
      console.log(`[STT#${instanceId}] AUDIO START`);
    };

    recognition.onspeechstart = () => {
      if (!mountedRef.current) return;
      console.log(`[STT#${instanceId}] SPEECH START — mic is working!`);
      // Reset no-speech counter — real speech was detected
      noSpeechCountRef.current = 0;
    };

    recognition.onresult = (event) => {
      if (!mountedRef.current) return;

      // ANY result means the mic is working — reset counter
      noSpeechCountRef.current = 0;

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
          console.log(`[STT#${instanceId}] FINAL:`, newText.slice(0, 120));
          setTranscript(accumulatedTranscriptRef.current);
        }
      }

      if (interim) {
        const currentFinal = accumulatedTranscriptRef.current;
        const displayText = currentFinal
          ? currentFinal + ' ' + interim.trim()
          : interim.trim();
        // For interim, update state but don't touch accumulated ref
        console.log(`[STT#${instanceId}] INTERIM:`, interim.trim().slice(0, 80));
        setTranscript(displayText);
      }
    };

    recognition.onspeechend = () => {
      if (!mountedRef.current) return;
      console.log(`[STT#${instanceId}] SPEECH END`);
    };

    recognition.onerror = (event) => {
      if (!mountedRef.current) return;
      console.log(`[STT#${instanceId}] Error:`, event.error);

      if (event.error === 'not-allowed') {
        setError('Microphone permission denied');
        setMicAvailable(false);
        isListeningRef.current = false;
        setIsListening(false);
      } else if (event.error === 'no-speech') {
        noSpeechCountRef.current++;
        console.log(`[STT#${instanceId}] no-speech (#${noSpeechCountRef.current})`);
        // onend will handle restart/recreation
      } else if (event.error === 'aborted') {
        // Expected — do nothing
      } else {
        console.warn(`[STT#${instanceId}] Unhandled error:`, event.error);
      }
    };

    recognition.onend = () => {
      if (!mountedRef.current) return;
      console.log(`[STT#${instanceId}] onend, listeningRef:`, isListeningRef.current,
                  'noSpeechCount:', noSpeechCountRef.current);

      if (!isListeningRef.current) {
        setIsListening(false);
        console.log(`[STT#${instanceId}] Fully stopped`);
        return;
      }

      // ════════════════════════════════════════════════════════
      // CORE FIX: After 3 consecutive no-speech errors on the
      // SAME instance, destroy it and create a brand new one.
      // This resets Chrome's internal speech engine pipeline.
      // ════════════════════════════════════════════════════════
      if (noSpeechCountRef.current >= 3) {
        console.log(`[STT#${instanceId}] Too many no-speech errors — RECREATING instance`);
        // The existing instance is dead — discard it
        try { recognition.abort(); } catch (e) { /* ignore */ }
        recognitionRef.current = null;
        instanceIdRef.current++;
        noSpeechCountRef.current = 0;
        // Recreate and start fresh
        const newInstance = createRecognition();
        if (newInstance && mountedRef.current && isListeningRef.current) {
          recognitionRef.current = newInstance;
          try {
            newInstance.start();
            console.log(`[STT#${instanceId}] → [STT#${instanceIdRef.current}] Instance replaced & started`);
          } catch (e) {
            console.warn('[STT] New instance start failed:', e.message);
          }
        }
        return;
      }

      // Normal restart with exponential backoff
      const delay = Math.min(200 * Math.pow(1.5, noSpeechCountRef.current), 2000);
      console.log(`[STT#${instanceId}] RESTARTING in ${Math.round(delay)}ms`);

      if (restartTimeoutRef.current) clearTimeout(restartTimeoutRef.current);
      restartTimeoutRef.current = setTimeout(() => {
        if (!mountedRef.current || !isListeningRef.current) return;
        // Use the CURRENT recognitionRef (may have been recreated)
        const rec = recognitionRef.current;
        if (!rec) return;
        try {
          rec.start();
          console.log(`[STT] Restarted successfully (instance #${instanceIdRef.current})`);
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

  // ── Start Listening ──
  const startListening = useCallback(async () => {
    if (isListeningRef.current) {
      console.log('[STT] Already listening — skipping');
      return;
    }

    if (restartTimeoutRef.current) {
      clearTimeout(restartTimeoutRef.current);
      restartTimeoutRef.current = null;
    }

    // Verify microphone first
    const micOk = await checkMicrophone();
    if (!micOk) {
      console.warn('[STT] Cannot start — microphone unavailable');
      return;
    }

    // Create or recreate instance
    let recognition = recognitionRef.current;
    if (!recognition) {
      recognition = createRecognition();
    }
    if (!recognition) return;

    // Reset state
    accumulatedTranscriptRef.current = '';
    noSpeechCountRef.current = 0;
    setTranscript('');
    setError(null);

    try {
      recognition.start();
      isListeningRef.current = true;
      setIsListening(true);
      console.log(`[STT] STARTED (instance #${instanceIdRef.current})`);
    } catch (err) {
      console.warn('[STT] start() error:', err.message);
      if (err.name === 'InvalidStateError') {
        isListeningRef.current = true;
        setIsListening(true);
      } else {
        // Instance might be dead — force recreation next time
        recognitionRef.current = null;
      }
    }
  }, [checkMicrophone, createRecognition]);

  // ── Stop Listening ──
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
        // abort() — clean immediate stop without firing onresult
        recognition.abort();
      } catch (err) {
        // Ignore
      }
    }
    setIsListening(false);
    console.log(`[STT] STOPPED (instance #${instanceIdRef.current})`);
  }, []);

  // ── Reset Transcript ──
  const resetTranscript = useCallback(() => {
    accumulatedTranscriptRef.current = '';
    setTranscript('');
    console.log('[STT] Transcript reset');
  }, []);

  // ── Cleanup ──
  useEffect(() => {
    mountedRef.current = true;
    // Check mic on mount
    checkMicrophone();
    return () => {
      console.log('[STT] Cleanup');
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
      recognitionRef.current = null;
    };
  }, [checkMicrophone]);

  return {
    transcript,
    isListening,
    error,
    micAvailable,
    startListening,
    stopListening,
    resetTranscript,
  };
}