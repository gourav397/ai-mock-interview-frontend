import { useEffect, useRef, useState, useCallback } from 'react';

/**
 * Custom hook for browser Text-to-Speech (SpeechSynthesis API)
 * Provides natural voice playback with queue management
 */
export default function useSpeechSynthesis() {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [voices, setVoices] = useState([]);
  const [selectedVoice, setSelectedVoice] = useState(null);
  const [rate, setRate] = useState(1.0);
  const [pitch, setPitch] = useState(1.0);
  const queueRef = useRef([]);
  const speakingRef = useRef(false);

  useEffect(() => {
    const supported = 'speechSynthesis' in window;
    setIsSupported(supported);

    if (supported) {
      const loadVoices = () => {
        const availableVoices = window.speechSynthesis.getVoices();
        setVoices(availableVoices);

        // Prefer a natural Indian English voice, then Google UK, then any English
        const preferred = availableVoices.find(
          v => v.lang.startsWith('en-IN') && v.name.includes('Google')
        ) || availableVoices.find(
          v => v.lang.startsWith('en-IN')
        ) || availableVoices.find(
          v => v.lang.startsWith('en-GB') && v.name.includes('Google')
        ) || availableVoices.find(
          v => v.lang.startsWith('en-US') && v.name.includes('Google')
        ) || availableVoices.find(
          v => v.lang.startsWith('en')
        );

        if (preferred) setSelectedVoice(preferred);
      };

      loadVoices();
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }

    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const speak = useCallback((text) => {
    if (!window.speechSynthesis || !text) return;

    // Cancel previous speech
    window.speechSynthesis.cancel();

    // Split long text into smaller chunks for better natural flow
    const sentences = text.match(/[^.!?\n]+[.!?\n]*/g) || [text];
    queueRef.current = sentences;

    const speakNext = (index) => {
      if (index >= queueRef.current.length) {
        setIsSpeaking(false);
        speakingRef.current = false;
        return;
      }

      const utterance = new SpeechSynthesisUtterance(queueRef.current[index].trim());
      if (selectedVoice) utterance.voice = selectedVoice;
      utterance.rate = rate;
      utterance.pitch = pitch;
      utterance.volume = 1;

      utterance.onstart = () => {
        setIsSpeaking(true);
        speakingRef.current = true;
      };

      utterance.onend = () => {
        // Natural pause between sentences (150ms)
        setTimeout(() => speakNext(index + 1), 150);
      };

      utterance.onerror = (e) => {
        console.log('Speech synthesis error:', e.error);
        speakNext(index + 1);
      };

      window.speechSynthesis.speak(utterance);
    };

    speakNext(0);
  }, [selectedVoice, rate, pitch]);

  const stop = useCallback(() => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    queueRef.current = [];
    setIsSpeaking(false);
    setIsPaused(false);
    speakingRef.current = false;
  }, []);

  const pause = useCallback(() => {
    if (window.speechSynthesis && speakingRef.current) {
      window.speechSynthesis.pause();
      setIsPaused(true);
    }
  }, []);

  const resume = useCallback(() => {
    if (window.speechSynthesis && speakingRef.current) {
      window.speechSynthesis.resume();
      setIsPaused(false);
    }
  }, []);

  return {
    isSpeaking,
    isPaused,
    isSupported,
    voices,
    selectedVoice,
    setSelectedVoice,
    rate,
    setRate,
    pitch,
    setPitch,
    speak,
    stop,
    pause,
    resume,
  };
}