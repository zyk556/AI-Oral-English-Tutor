import { useRef, useCallback, useState } from "react";

// 浏览器内置语音识别（Web Speech API）
// Chrome/Edge 支持，免费，实时识别
export function useSpeechRecognition() {
  const recognitionRef = useRef<any>(null);
  const [isListening, setIsListening] = useState(false);
  const transcriptRef = useRef("");

  const startListening = useCallback(
    (onResult: (text: string) => void) => {
      const SpeechRecognition =
        (window as any).SpeechRecognition ||
        (window as any).webkitSpeechRecognition;

      if (!SpeechRecognition) {
        console.error("[Speech] Web Speech API not supported");
        return;
      }

      const recognition = new SpeechRecognition();
      recognition.lang = "en-US";
      recognition.continuous = false;
      recognition.interimResults = false;

      transcriptRef.current = "";

      recognition.onstart = () => {
        setIsListening(true);
        console.log("[Speech] Listening...");
      };

      recognition.onresult = (event: any) => {
        const result = event.results[event.results.length - 1];
        const text = result[0].transcript;
        transcriptRef.current = text;
        console.log(`[Speech] Result: "${text}"`);
        onResult(text);
      };

      recognition.onerror = (event: any) => {
        console.error("[Speech] Error:", event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
        console.log("[Speech] Stopped");
      };

      recognitionRef.current = recognition;
      recognition.start();
    },
    []
  );

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
  }, []);

  return { startListening, stopListening, isListening };
}
