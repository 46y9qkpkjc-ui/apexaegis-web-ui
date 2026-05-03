'use client';
import { useState, useCallback, useRef, useEffect } from 'react';

interface VoiceControlState {
  isListening: boolean;
  transcript: string;
  interimTranscript: string;
  isSupported: boolean;
  error: string | null;
}

interface UseVoiceControlReturn extends VoiceControlState {
  startListening: () => void;
  stopListening: () => void;
  toggleListening: () => void;
  resetTranscript: () => void;
}

export function useVoiceControl(onFinalTranscript?: (text: string) => void): UseVoiceControlReturn {
  const [state, setState] = useState<VoiceControlState>({
    isListening: false,
    transcript: '',
    interimTranscript: '',
    isSupported: false,
    error: null,
  });

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const onFinalRef = useRef(onFinalTranscript);
  onFinalRef.current = onFinalTranscript;

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setState(s => ({ ...s, isSupported: false, error: 'Speech recognition not supported in this browser' }));
      return;
    }

    setState(s => ({ ...s, isSupported: true }));
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interim = '';
      let final = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const t = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          final += t;
        } else {
          interim += t;
        }
      }
      if (final) {
        setState(s => ({ ...s, transcript: final, interimTranscript: '' }));
        onFinalRef.current?.(final);
      } else {
        setState(s => ({ ...s, interimTranscript: interim }));
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      setState(s => ({ ...s, isListening: false, error: event.error }));
    };

    recognition.onend = () => {
      setState(s => ({ ...s, isListening: false }));
    };

    recognitionRef.current = recognition;
  }, []);

  const startListening = useCallback(() => {
    if (!recognitionRef.current) return;
    setState(s => ({ ...s, isListening: true, error: null, interimTranscript: '', transcript: '' }));
    recognitionRef.current.start();
  }, []);

  const stopListening = useCallback(() => {
    if (!recognitionRef.current) return;
    recognitionRef.current.stop();
    setState(s => ({ ...s, isListening: false }));
  }, []);

  const toggleListening = useCallback(() => {
    if (state.isListening) stopListening();
    else startListening();
  }, [state.isListening, startListening, stopListening]);

  const resetTranscript = useCallback(() => {
    setState(s => ({ ...s, transcript: '', interimTranscript: '' }));
  }, []);

  return { ...state, startListening, stopListening, toggleListening, resetTranscript };
}
