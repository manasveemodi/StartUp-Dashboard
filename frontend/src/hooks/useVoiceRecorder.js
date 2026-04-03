import { useState, useRef, useCallback } from "react";

export function useVoiceRecorder() {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [duration, setDuration] = useState(0);
  const [audioBlob, setAudioBlob] = useState(null);
  const [error, setError] = useState(null);

  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);
  const startTimeRef = useRef(null);
  const elapsedRef = useRef(0);

  const startRecording = useCallback(async () => {
    try {
      setError(null);
      setAudioBlob(null);
      chunksRef.current = [];
      elapsedRef.current = 0;
      setDuration(0);

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "audio/ogg";
      const recorder = new MediaRecorder(stream, { mimeType });

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType });
        setAudioBlob(blob);
        stream.getTracks().forEach((t) => t.stop());
        clearInterval(timerRef.current);
      };

      recorder.start(100);
      mediaRecorderRef.current = recorder;
      startTimeRef.current = Date.now();

      timerRef.current = setInterval(() => {
        setDuration(elapsedRef.current + Math.floor((Date.now() - startTimeRef.current) / 1000));
      }, 500);

      setIsRecording(true);
      setIsPaused(false);
    } catch (err) {
      setError("Microphone access denied. Please allow microphone permissions.");
    }
  }, []);

  const pauseRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording && !isPaused) {
      mediaRecorderRef.current.pause();
      elapsedRef.current += Math.floor((Date.now() - startTimeRef.current) / 1000);
      clearInterval(timerRef.current);
      setIsPaused(true);
    }
  }, [isRecording, isPaused]);

  const resumeRecording = useCallback(() => {
    if (mediaRecorderRef.current && isPaused) {
      mediaRecorderRef.current.resume();
      startTimeRef.current = Date.now();
      timerRef.current = setInterval(() => {
        setDuration(elapsedRef.current + Math.floor((Date.now() - startTimeRef.current) / 1000));
      }, 500);
      setIsPaused(false);
    }
  }, [isPaused]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsPaused(false);
    }
  }, [isRecording]);

  const resetRecording = useCallback(() => {
    setAudioBlob(null);
    setDuration(0);
    setIsRecording(false);
    setIsPaused(false);
    setError(null);
    elapsedRef.current = 0;
  }, []);

  return {
    isRecording,
    isPaused,
    duration,
    audioBlob,
    error,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    resetRecording,
  };
}
