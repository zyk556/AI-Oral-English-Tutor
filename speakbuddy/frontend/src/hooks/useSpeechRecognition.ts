import { useRef, useCallback, useState } from "react";

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
      recognition.continuous = true;       // 持续监听，不自动停止
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      transcriptRef.current = "";

      recognition.onstart = () => {
        setIsListening(true);
        console.log("[Speech] Listening...");
      };

      recognition.onresult = (event: any) => {
        // 累积所有结果
        let finalTranscript = "";
        for (let i = 0; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript + " ";
          }
        }
        transcriptRef.current = finalTranscript.trim();
        console.log(`[Speech] Accumulated: "${transcriptRef.current}"`);
      };

      recognition.onerror = (event: any) => {
        console.error("[Speech] Error:", event.error);
        if (event.error !== "aborted") {
          setIsListening(false);
        }
      };

      recognition.onend = () => {
        setIsListening(false);
        // 手动停止后，返回累积的文本
        const text = transcriptRef.current.trim();
        if (text) {
          console.log(`[Speech] Final result: "${text}"`);
          onResult(text);
        }
      };

      // 保存 onResult 回调，供 stopListening 使用
      (recognition as any)._onResult = onResult;

      recognitionRef.current = recognition;
      recognition.start();
    },
    []
  );

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop(); // 触发 onend，返回结果
      recognitionRef.current = null;
    }
  }, []);

  return { startListening, stopListening, isListening };
}
