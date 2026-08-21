import { useState, useRef, useCallback, useEffect } from 'react';

/**
 * Enhanced useSpeechSynthesis hook
 * - Exposes isSpeakingRef for reliable cross-closure reading
 * - Smart voice selection matching response language
 * - Chrome speech synthesis stall workaround
 * - Chrome 15-second cutoff workaround via pause/resume
 */
export default function useSpeechSynthesis() {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voices, setVoices] = useState([]);
  const isSpeakingRef = useRef(false);
  const utteranceRef = useRef(null);
  const keepAliveTimerRef = useRef(null);
  const cancelledRef = useRef(false);

  // Load available voices and refresh periodically to prevent Chrome stall
  useEffect(() => {
    const loadVoices = () => {
      try {
        const available = window.speechSynthesis.getVoices();
        if (available && available.length > 0) {
          setVoices(available);
        }
      } catch (e) {
        // Silently fail
      }
    };

    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;

    // Periodic voice refresh to prevent Chrome speech synthesis from stalling
    const pingInterval = setInterval(() => {
      try {
        window.speechSynthesis.getVoices();
      } catch (e) {
        // Silently fail
      }
    }, 30000);

    return () => {
      window.speechSynthesis.onvoiceschanged = null;
      clearInterval(pingInterval);
      if (keepAliveTimerRef.current) clearInterval(keepAliveTimerRef.current);
    };
  }, []);

  // Find the best voice for a given text based on script/language
  const findVoice = useCallback((text) => {
    if (!voices.length || !text) return null;

    const hasDevanagari = /[\u0900-\u097F]/.test(text);
    const hasGurmukhi = /[\u0A00-\u0A7F]/.test(text);
    const hasBengali = /[\u0980-\u09FF]/.test(text);
    const hasGujarati = /[\u0A80-\u0AFF]/.test(text);
    const hasTamil = /[\u0B80-\u0BFF]/.test(text);
    const hasTelugu = /[\u0C00-\u0C7F]/.test(text);
    const hasKannada = /[\u0C80-\u0CFF]/.test(text);
    const hasMalayalam = /[\u0D00-\u0D7F]/.test(text);
    const hasChinese = /[\u4E00-\u9FFF]/.test(text);
    const hasJapanese = /[\u3040-\u309F\u30A0-\u30FF]/.test(text);
    const hasArabic = /[\u0600-\u06FF]/.test(text);

    // Language to voice preference map
    const langPreferences = [];
    if (hasDevanagari) {
      langPreferences.push('hi-IN', 'hi', 'en-IN');
    }
    if (hasGurmukhi) {
      langPreferences.push('pa-IN', 'pa', 'hi-IN', 'en-IN');
    }
    // Add Indian English as fallback for Indian languages
    if (hasDevanagari || hasGurmukhi || hasBengali || hasGujarati ||
        hasTamil || hasTelugu || hasKannada || hasMalayalam) {
      langPreferences.push('en-IN');
    }
    // Always prefer Indian English, then US/UK English as base
    langPreferences.push('en-IN', 'en-GB', 'en-US');

    for (const lang of langPreferences) {
      const match = voices.find(v => v.lang.toLowerCase().startsWith(lang.toLowerCase()));
      if (match) return match;
    }

    // Final fallback: first available English voice
    const anyEnglish = voices.find(v => v.lang.startsWith('en'));
    if (anyEnglish) return anyEnglish;

    return voices[0] || null;
  }, [voices]);

  // Chrome 15-second utterance cutoff workaround
  const startKeepAlive = useCallback(() => {
    if (keepAliveTimerRef.current) clearInterval(keepAliveTimerRef.current);
    keepAliveTimerRef.current = setInterval(() => {
      try {
        if (window.speechSynthesis.speaking) {
          window.speechSynthesis.pause();
          window.speechSynthesis.resume();
        }
      } catch (e) {
        // Silently fail
      }
    }, 10000); // Every 10 seconds, before the 15s cutoff
  }, []);

  const stopKeepAlive = useCallback(() => {
    if (keepAliveTimerRef.current) {
      clearInterval(keepAliveTimerRef.current);
      keepAliveTimerRef.current = null;
    }
  }, []);

  const speak = useCallback((text) => {
    if (!text || !window.speechSynthesis) {
      console.warn('[TTS] No text or speechSynthesis unavailable');
      return;
    }

    cancelledRef.current = false;

    // Cancel any current speech
    try {
      window.speechSynthesis.cancel();
    } catch (e) {
      // Silently fail
    }

    // Brief delay to let cancel settle (Chrome workaround)
    setTimeout(() => {
      if (cancelledRef.current) return;

      try {
        const utterance = new SpeechSynthesisUtterance(text);
        const selectedVoice = findVoice(text);
        if (selectedVoice) {
          utterance.voice = selectedVoice;
          console.log('[TTS] Voice selected:', selectedVoice.name, selectedVoice.lang);
        }

        utterance.rate = 0.9;
        utterance.pitch = 1.0;
        utterance.volume = 1.0;

        utterance.onstart = () => {
          console.log('[TTS] START');
          setIsSpeaking(true);
          isSpeakingRef.current = true;
          startKeepAlive();
        };

        utterance.onend = () => {
          console.log('[TTS] END');
          setIsSpeaking(false);
          isSpeakingRef.current = false;
          stopKeepAlive();
        };

        utterance.onerror = (event) => {
          console.error('[TTS] ERROR:', event.error);
          setIsSpeaking(false);
          isSpeakingRef.current = false;
          stopKeepAlive();
        };

        utteranceRef.current = utterance;

        console.log('[TTS] Speaking:', text.slice(0, 60) + '...');
        window.speechSynthesis.speak(utterance);
      } catch (err) {
        console.error('[TTS] speak() threw:', err.message);
        setIsSpeaking(false);
        isSpeakingRef.current = false;
        stopKeepAlive();
      }
    }, 100);
  }, [findVoice, startKeepAlive, stopKeepAlive]);

  const stop = useCallback(() => {
    cancelledRef.current = true;
    stopKeepAlive();
    try {
      window.speechSynthesis.cancel();
    } catch (e) {
      // Silently fail
    }
    setIsSpeaking(false);
    isSpeakingRef.current = false;
    console.log('[TTS] STOP');
  }, [stopKeepAlive]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cancelledRef.current = true;
      stopKeepAlive();
      try {
        window.speechSynthesis.cancel();
      } catch (e) {
        // Silently fail
      }
    };
  }, [stopKeepAlive]);

  return {
    speak,
    stop,
    isSpeaking,
    isSpeakingRef, // REF that stays current — use this in closures/polling
    voices,
  };
}