import { useRef, useCallback, useState } from "react";

export function useSpeechRecognition() {
  const recognitionRef = useRef<any>(null);
  const [isListening, setIsListening] = useState(false);
  const transcriptRef = useRef("");
  const manualStopRef = useRef(false);

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
      recognition.continuous = true;
      recognition.interimResults = false;

      transcriptRef.current = "";
      manualStopRef.current = false;

      recognition.onstart = () => {
        setIsListening(true);
        console.log("[Speech] Started");
      };

      recognition.onresult = (event: any) => {
        for (let i = 0; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            transcriptRef.current += event.results[i][0].transcript + " ";
          }
        }
        console.log("[Speech] Accumulated:", transcriptRef.current.trim());
      };

      recognition.onerror = (event: any) => {
        console.error("[Speech] Error:", event.error);
        if (event.error === "no-speech" || event.error === "aborted") {
          // 浏览器因无声自动结束 → 重启继续监听
          if (!manualStopRef.current) {
            try { recognition.start(); } catch {}
            return;
          }
        }
        setIsListening(false);
      };

      recognition.onend = () => {
        // 如果不是用户手动停止，自动重启
        if (!manualStopRef.current) {
          try { recognition.start(); } catch {}
          return;
        }
        // 用户手动停止 → 发送结果
        setIsListening(false);
        const text = transcriptRef.current.trim();
        if (text) {
          console.log("[Speech] Sending:", text);
          onResult(text);
        }
        recognitionRef.current = null;
      };

      recognitionRef.current = recognition;
      recognition.start();
    },
    []
  );

  const stopListening = useCallback(() => {
    manualStopRef.current = true;
    if (recognitionRef.current) {
      recognitionRef.current.stop(); // 触发 onend → 发送结果
    }
  }, []);

  return { startListening, stopListening, isListening };
}
