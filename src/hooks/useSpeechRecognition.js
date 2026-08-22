import { useState, useRef, useCallback, useEffect } from 'react';

/**
 * useSpeechRecognition — FIXED for Indian languages
 *
 * Key changes:
 * - Default lang: hi-IN (Hindi) — Chrome detects Hindi, Hinglish AND English with this
 * - Auto-language adaptation based on transcript content
 * - Faster restart, better dedup
 */
export default function useSpeechRecognition({
  lang: initialLang = 'hi-IN',
  continuous = true,
  interimResults = true,
} = {}) {
  const [transcript, setTranscript] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState(null);
  const [micAvailable, setMicAvailable] = useState(null);
  const [currentLang, setCurrentLang] = useState(initialLang);

  const recognitionRef = useRef(null);
  const isListeningRef = useRef(false);
  const mountedRef = useRef(true);
  const accumulatedTranscriptRef = useRef('');
  const restartTimeoutRef = useRef(null);
  const noSpeechCountRef = useRef(0);
  const instanceIdRef = useRef(0);
  const hasSpeechEverRef = useRef(false);
  const langRef = useRef(initialLang);
  const consecutiveEnglishRef = useRef(0);
  const lastFinalTranscriptRef = useRef('');

  const checkMicrophone = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(t => t.stop());
      setMicAvailable(true);
      return true;
    } catch (err) {
      setMicAvailable(false);
      if (err.name === 'NotAllowedError') {
        setError('Microphone permission denied. Please allow mic access.');
      } else if (err.name === 'NotFoundError') {
        setError('No microphone found on this device.');
      } else {
        setError(`Microphone error: ${err.message}`);
      }
      return false;
    }
  }, []);

  const createRecognition = useCallback((lang) => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError('Speech recognition not supported in this browser');
      return null;
    }

    const instanceId = ++instanceIdRef.current;
    const recognition = new SpeechRecognition();
    recognition.lang = lang;
    recognition.continuous = continuous;
    recognition.interimResults = interimResults;
    recognition.maxAlternatives = 1;

    console.log(`[STT] Creating NEW instance #${instanceId} lang: ${lang}`);

    recognition.onaudiostart = () => {
      if (!mountedRef.current) return;
    };

    recognition.onspeechstart = () => {
      if (!mountedRef.current) return;
      noSpeechCountRef.current = 0;
      hasSpeechEverRef.current = true;
    };

    recognition.onresult = (event) => {
      if (!mountedRef.current) return;
      noSpeechCountRef.current = 0;
      hasSpeechEverRef.current = true;

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
        if (newText && newText !== lastFinalTranscriptRef.current) {
          lastFinalTranscriptRef.current = newText;
          accumulatedTranscriptRef.current = (
            accumulatedTranscriptRef.current
              ? accumulatedTranscriptRef.current + ' ' + newText
              : newText
          ).trim();
          if (accumulatedTranscriptRef.current.length > 2000) {
            accumulatedTranscriptRef.current = accumulatedTranscriptRef.current.slice(-2000).trim();
          }
          setTranscript(accumulatedTranscriptRef.current);

          // Auto-detect language and switch if needed
          const hasHindi = /[\u0900-\u097F]/.test(newText);
          if (hasHindi) {
            consecutiveEnglishRef.current = 0;
            if (langRef.current !== 'hi-IN' && langRef.current !== 'hi') {
              console.log('[STT] Hindi detected — keeping hi-IN');
            }
          } else {
            // Check if it's Hinglish (Roman Hindi words)
            const hinglishWords = ['hai','hoon','nahi','ka','ki','ke','ko','se','mein','main','mera','meri','tera','aap','tum','hum','kya','kyu','kaise','kahan','acha','bahut','chahiye','sakta','yaar','bhai','baat','kuch','sab','kar','ho','ja','de','le','raha','gaya','liya','diya','kiya','hoga','aaunga'];
            const words = newText.toLowerCase().split(/\s+/);
            const hinglishCount = words.filter(w => hinglishWords.includes(w)).length;
            if (hinglishCount >= 2) {
              consecutiveEnglishRef.current = 0;
            } else {
              consecutiveEnglishRef.current++;
              // If 5+ consecutive English-only transcripts, switch STT to English
              if (consecutiveEnglishRef.current >= 5 && langRef.current !== 'en-IN') {
                console.log('[STT] Switching to en-IN — user seems to speak English');
                langRef.current = 'en-IN';
                setCurrentLang('en-IN');
                stopListening();
                setTimeout(() => {
                  if (mountedRef.current && isListeningRef.current) {
                    startListening();
                  }
                }, 500);
              }
            }
          }
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

    recognition.onspeechend = () => {};

    recognition.onerror = (event) => {
      if (!mountedRef.current) return;
      if (event.error === 'not-allowed') {
        setError('Microphone permission denied');
        setMicAvailable(false);
        isListeningRef.current = false;
        setIsListening(false);
      } else if (event.error === 'no-speech') {
        noSpeechCountRef.current++;
      } else if (event.error === 'aborted') {
        // Expected
      } else if (event.error === 'network') {
        // Network error — happens sometimes, just restart
        console.log('[STT] Network error — will restart');
      }
    };

    recognition.onend = () => {
      if (!mountedRef.current) return;

      if (!isListeningRef.current) {
        setIsListening(false);
        return;
      }

      if (noSpeechCountRef.current >= 3) {
        // Recreate instance
        try { recognition.abort(); } catch (e) {}
        recognitionRef.current = null;
        noSpeechCountRef.current = 0;
        const newInstance = createRecognition(langRef.current);
        if (newInstance && mountedRef.current && isListeningRef.current) {
          recognitionRef.current = newInstance;
          try { newInstance.start(); } catch (e) {}
        }
        return;
      }

      const delay = Math.min(100 * Math.pow(1.3, noSpeechCountRef.current), 1000);
      if (restartTimeoutRef.current) clearTimeout(restartTimeoutRef.current);
      restartTimeoutRef.current = setTimeout(() => {
        if (!mountedRef.current || !isListeningRef.current) return;
        const rec = recognitionRef.current;
        if (!rec) return;
        try {
          rec.start();
        } catch (e) {
          if (e.name !== 'InvalidStateError') {
            console.warn('[STT] Restart failed:', e.message);
          }
        }
      }, delay);
    };

    recognitionRef.current = recognition;
    return recognition;
  }, [continuous, interimResults]);

  const startListening = useCallback(async () => {
    if (isListeningRef.current) return;

    if (restartTimeoutRef.current) {
      clearTimeout(restartTimeoutRef.current);
      restartTimeoutRef.current = null;
    }

    const micOk = await checkMicrophone();
    if (!micOk) return;

    const currentLangValue = langRef.current;
    let recognition = recognitionRef.current;
    if (!recognition) {
      recognition = createRecognition(currentLangValue);
    }
    if (!recognition) return;

    accumulatedTranscriptRef.current = '';
    noSpeechCountRef.current = 0;
    lastFinalTranscriptRef.current = '';
    setTranscript('');
    setError(null);

    try {
      recognition.start();
      isListeningRef.current = true;
      setIsListening(true);
      console.log(`[STT] STARTED lang: ${currentLangValue} instance #${instanceIdRef.current}`);
    } catch (err) {
      if (err.name === 'InvalidStateError') {
        isListeningRef.current = true;
        setIsListening(true);
      } else {
        recognitionRef.current = null;
      }
    }
  }, [checkMicrophone, createRecognition]);

  const stopListening = useCallback(() => {
    isListeningRef.current = false;
    if (restartTimeoutRef.current) {
      clearTimeout(restartTimeoutRef.current);
      restartTimeoutRef.current = null;
    }
    const recognition = recognitionRef.current;
    if (recognition) {
      try { recognition.abort(); } catch (e) {}
    }
    setIsListening(false);
  }, []);

  const resetTranscript = useCallback(() => {
    accumulatedTranscriptRef.current = '';
    lastFinalTranscriptRef.current = '';
    consecutiveEnglishRef.current = 0;
    setTranscript('');
  }, []);

  const setLanguage = useCallback((newLang) => {
    if (newLang === langRef.current) return;
    console.log('[STT] Setting language to:', newLang);
    langRef.current = newLang;
    setCurrentLang(newLang);
    const wasListening = isListeningRef.current;
    if (wasListening) stopListening();
    if (recognitionRef.current) {
      try { recognitionRef.current.abort(); } catch (e) {}
      recognitionRef.current = null;
    }
    if (wasListening) {
      setTimeout(() => {
        if (mountedRef.current) startListening();
      }, 300);
    }
  }, [stopListening, startListening]);

  useEffect(() => {
    mountedRef.current = true;
    checkMicrophone();
    return () => {
      mountedRef.current = false;
      isListeningRef.current = false;
      if (restartTimeoutRef.current) clearTimeout(restartTimeoutRef.current);
      const recognition = recognitionRef.current;
      if (recognition) {
        try {
          recognition.onend = null;
          recognition.onresult = null;
          recognition.onerror = null;
          recognition.abort();
        } catch (e) {}
      }
      recognitionRef.current = null;
    };
  }, [checkMicrophone]);

  return {
    transcript,
    isListening,
    error,
    micAvailable,
    currentLang,
    startListening,
    stopListening,
    resetTranscript,
    setLanguage,
  };
}