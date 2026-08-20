import { useEffect, useRef, useState, useCallback } from 'react';

/**
 * Custom hook for browser Speech Recognition (Web Speech API)
 * Works in Chrome, Edge, Safari 14.1+
 */
export default function useSpeechRecognition({ lang = 'en-IN', continuous = true, interimResults = true } = {}) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [isSupported, setIsSupported] = useState(false);
  const [error, setError] = useState(null);
  const recognitionRef = useRef(null);
  const finalTranscriptRef = useRef('');

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    setIsSupported(!!SpeechRecognition);
  }, []);

  const startListening = useCallback(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError('Speech recognition not supported in this browser');
      return;
    }

    if (recognitionRef.current) {
      try { recognitionRef.current.abort(); } catch (e) {}
    }

    const recognition = new SpeechRecognition();
    recognition.lang = lang;
    recognition.continuous = continuous;
    recognition.interimResults = interimResults;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event) => {
      let interim = '';
      let final = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          final += result[0].transcript;
          finalTranscriptRef.current += ' ' + result[0].transcript;
        } else {
          interim += result[0].transcript;
        }
      }

      if (final) setTranscript(prev => prev + ' ' + final);
      if (interim) setInterimTranscript(interim);
      else setInterimTranscript('');
    };

    recognition.onerror = (event) => {
      console.log('Speech recognition error:', event.error);
      if (event.error === 'not-allowed') {
        setError('Microphone permission denied');
      } else if (event.error === 'no-speech') {
        // Ignore — user might be thinking
      } else {
        setError(`Speech error: ${event.error}`);
      }
    };

    recognition.onend = () => {
      // Auto-restart if still supposed to be listening
      if (isListening && recognitionRef.current) {
        try {
          recognition.start();
        } catch (e) {
          console.log('Auto-restart failed:', e.message);
        }
      }
    };

    recognitionRef.current = recognition;
    finalTranscriptRef.current = '';

    try {
      recognition.start();
      setIsListening(true);
      setError(null);
    } catch (e) {
      console.log('Recognition start error:', e.message);
      setError('Failed to start speech recognition');
    }
  }, [lang, continuous, interimResults, isListening]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
        recognitionRef.current.onend = null; // prevent auto-restart
      } catch (e) {}
      recognitionRef.current = null;
    }
    setIsListening(false);
  }, []);

  const resetTranscript = useCallback(() => {
    setTranscript('');
    setInterimTranscript('');
    finalTranscriptRef.current = '';
  }, []);

  // Cleanup
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch (e) {}
      }
    };
  }, []);

  return {
    isListening,
    transcript,
    interimTranscript,
    isSupported,
    error,
    startListening,
    stopListening,
    resetTranscript,
  };
}