import { useState, useRef, useCallback, useEffect } from 'react';

/**
 * useSpeechSynthesis — with ref-based tracking, Chrome workarounds, smart voice selection
 */
export default function useSpeechSynthesis() {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voices, setVoices] = useState([]);
  const isSpeakingRef = useRef(false);
  const utteranceRef = useRef(null);
  const keepAliveTimerRef = useRef(null);
  const cancelledRef = useRef(false);
  const speakTimeoutRef = useRef(null);

  useEffect(() => {
    const loadVoices = () => {
      try {
        const available = window.speechSynthesis.getVoices();
        if (available && available.length > 0) {
          setVoices(available);
        }
      } catch (e) {
        // ignore
      }
    };

    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;

    const pingInterval = setInterval(() => {
      try {
        window.speechSynthesis.getVoices();
      } catch (e) {
        // ignore
      }
    }, 30000);

    return () => {
      window.speechSynthesis.onvoiceschanged = null;
      clearInterval(pingInterval);
      if (keepAliveTimerRef.current) clearInterval(keepAliveTimerRef.current);
      if (speakTimeoutRef.current) clearTimeout(speakTimeoutRef.current);
    };
  }, []);

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
    const hasArabic = /[\u0600-\u06FF]/.test(text);
    const hasChinese = /[\u4E00-\u9FFF]/.test(text);
    const hasJapanese = /[\u3040-\u309F\u30A0-\u30FF]/.test(text);

    const langPrefs = [];

    if (hasDevanagari) langPrefs.push('hi-IN', 'hi', 'mr-IN', 'en-IN');
    if (hasGurmukhi) langPrefs.push('pa-IN', 'pa', 'hi-IN', 'en-IN');
    if (hasBengali) langPrefs.push('bn-IN', 'bn', 'en-IN');
    if (hasGujarati) langPrefs.push('gu-IN', 'gu', 'en-IN');
    if (hasTamil) langPrefs.push('ta-IN', 'ta', 'en-IN');
    if (hasTelugu) langPrefs.push('te-IN', 'te', 'en-IN');
    if (hasKannada) langPrefs.push('kn-IN', 'kn', 'en-IN');
    if (hasMalayalam) langPrefs.push('ml-IN', 'ml', 'en-IN');
    if (hasArabic) langPrefs.push('ar', 'en-IN');
    if (hasChinese) langPrefs.push('zh-CN', 'zh', 'en-US');
    if (hasJapanese) langPrefs.push('ja-JP', 'ja', 'en-US');

    if (hasDevanagari || hasGurmukhi || hasBengali || hasGujarati ||
        hasTamil || hasTelugu || hasKannada || hasMalayalam) {
      langPrefs.push('en-IN');
    }

    langPrefs.push('en-IN', 'en-GB', 'en-US');

    for (const lang of langPrefs) {
      const match = voices.find(
        v => v.lang.toLowerCase().startsWith(lang.toLowerCase())
      );
      if (match) return match;
    }

    const anyEnglish = voices.find(v => v.lang.startsWith('en'));
    if (anyEnglish) return anyEnglish;

    return voices[0] || null;
  }, [voices]);

  const startKeepAlive = useCallback(() => {
    if (keepAliveTimerRef.current) clearInterval(keepAliveTimerRef.current);
    keepAliveTimerRef.current = setInterval(() => {
      try {
        if (window.speechSynthesis.speaking) {
          window.speechSynthesis.pause();
          window.speechSynthesis.resume();
        }
      } catch (e) {
        // ignore
      }
    }, 10000);
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

    if (speakTimeoutRef.current) {
      clearTimeout(speakTimeoutRef.current);
      speakTimeoutRef.current = null;
    }

    try {
      window.speechSynthesis.cancel();
    } catch (e) {
      // ignore
    }

    speakTimeoutRef.current = setTimeout(() => {
      if (cancelledRef.current) return;

      try {
        const utterance = new SpeechSynthesisUtterance(text);
        const selectedVoice = findVoice(text);
        if (selectedVoice) {
          utterance.voice = selectedVoice;
          console.log('[TTS] Voice:', selectedVoice.name, selectedVoice.lang);
        }

        utterance.rate = 0.88;
        utterance.pitch = 1.05;
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
        console.log('[TTS] Speaking:', text.slice(0, 80) + '...');
        window.speechSynthesis.speak(utterance);
      } catch (err) {
        console.error('[TTS] speak() threw:', err.message);
        setIsSpeaking(false);
        isSpeakingRef.current = false;
        stopKeepAlive();
      }
    }, 150);
  }, [findVoice, startKeepAlive, stopKeepAlive]);

  const stop = useCallback(() => {
    console.log('[TTS] STOP requested');
    cancelledRef.current = true;
    stopKeepAlive();
    if (speakTimeoutRef.current) {
      clearTimeout(speakTimeoutRef.current);
      speakTimeoutRef.current = null;
    }
    try {
      window.speechSynthesis.cancel();
    } catch (e) {
      // ignore
    }
    setIsSpeaking(false);
    isSpeakingRef.current = false;
    console.log('[TTS] STOPPED');
  }, [stopKeepAlive]);

  useEffect(() => {
    return () => {
      cancelledRef.current = true;
      stopKeepAlive();
      if (speakTimeoutRef.current) clearTimeout(speakTimeoutRef.current);
      try { window.speechSynthesis.cancel(); } catch (e) { /* ignore */ }
    };
  }, [stopKeepAlive]);

  return {
    speak,
    stop,
    isSpeaking,
    isSpeakingRef,
    voices,
  };
}