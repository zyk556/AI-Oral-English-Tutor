import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { createNodeWebSocket } from "@hono/node-ws";
import { config } from "dotenv";
import { execFile } from "child_process";
import { writeFile, unlink, readFile } from "fs/promises";
import { tmpdir } from "os";
import { join } from "path";
import { randomUUID } from "crypto";

// 加载环境变量
config();

const MIMO_API_KEY = process.env.MIMO_API_KEY!;
const MIMO_BASE_URL = "https://api.xiaomimimo.com/v1";
const MIMO_LLM_MODEL = "mimo-v2.5-flash";
const MIMO_ASR_MODEL = "mimo-v2.5-asr";
const MIMO_TTS_MODEL = "mimo-v2.5-tts";
const MIMO_TTS_VOICE = "Chloe"; // 英文女声

// 场景 System Prompt 配置
const SCENARIO_PROMPTS: Record<string, string> = {
  interview:
    "You are an experienced HR interviewer at a tech company. You are interviewing a candidate for a software engineer position. Guidelines: - Ask behavioral and technical questions naturally. - React to the candidate's responses with follow-up questions. - Keep the tone professional but friendly. - Limit each response to 2-3 sentences to keep the conversation moving.",
  ordering:
    "You are a friendly waiter at a nice restaurant. Take the customer's order, suggest dishes based on their preferences, and handle any special requests. Use casual, polite English. Keep responses short and natural.",
  meeting:
    "You are a project manager leading a daily standup meeting. Ask each team member (the user) about their progress, any blockers, and plans for the day. Be encouraging and efficient. Keep the tone professional but supportive.",
};

// 会话状态
interface SessionState {
  scenario: string | null;
  history: Array<{ role: "user" | "assistant"; content: string }>;
  audioChunks: Buffer[];
}

const app = new Hono();
const { injectWebSocket, upgradeWebSocket } = createNodeWebSocket({ app });

// WebSocket 路由
app.get(
  "/ws",
  upgradeWebSocket(() => {
    const state: SessionState = {
      scenario: null,
      history: [],
      audioChunks: [],
    };

    return {
      onOpen(_event: unknown, ws: any) {
        console.log("[WS] Client connected");
        ws.send(JSON.stringify({ type: "ready", message: "Connected" }));
      },

      async onMessage(event: any, ws: any) {
        try {
          // 二进制消息 = 音频数据块
          if (
            event.data instanceof ArrayBuffer ||
            Buffer.isBuffer(event.data)
          ) {
            if (!state.scenario) return;
            state.audioChunks.push(Buffer.from(event.data as ArrayBuffer));
            return;
          }

          // 文本消息 = JSON 控制消息
          const msg = JSON.parse(String(event.data));

          switch (msg.type) {
            case "set_scenario":
              console.log(`[WS] Setting scenario: ${msg.scenario}`);
              state.scenario = msg.scenario;
              state.history = [];
              state.audioChunks = [];
              ws.send(
                JSON.stringify({
                  type: "scenario_set",
                  scenario: msg.scenario,
                })
              );
              break;

            case "stop_recording":
              console.log(
                `[WS] Stop recording, ${state.audioChunks.length} chunks`
              );
              if (state.audioChunks.length < 3) {
                state.audioChunks = [];
                ws.send(JSON.stringify({ type: "ai_text", text: "I didn't hear anything. Please hold the button and speak." }));
                break;
              }

              // 合并所有音频块
              const webmBuffer = Buffer.concat(state.audioChunks);
              state.audioChunks = [];

              try {
                // WebM → WAV 转换
                const wavBuffer = await convertWebmToWav(webmBuffer);
                console.log(
                  `[Audio] Converted to WAV, ${wavBuffer.length} bytes`
                );

                // ASR 语音识别
                const transcript = await transcribeAudio(wavBuffer);
                console.log(`[ASR] Transcript: "${transcript}"`);

                if (!transcript || transcript.trim() === "") {
                  ws.send(
                    JSON.stringify({
                      type: "user_text",
                      text: "(no speech detected)",
                    })
                  );
                  break;
                }

                // 发送用户识别文本
                ws.send(
                  JSON.stringify({ type: "user_text", text: transcript })
                );

                // 更新对话历史
                state.history.push({ role: "user", content: transcript });

                // LLM 生成回复
                const aiResponse = await generateAIReply(
                  state.scenario!,
                  state.history
                );
                state.history.push({
                  role: "assistant",
                  content: aiResponse,
                });

                // 发送 AI 文本
                ws.send(
                  JSON.stringify({ type: "ai_text", text: aiResponse })
                );

                // TTS 生成语音
                const audioBuffer = await generateTTS(aiResponse);
                console.log(
                  `[TTS] Generated audio, ${audioBuffer.length} bytes`
                );
                ws.send(audioBuffer);
              } catch (err) {
                console.error("[Pipeline] Error:", err);
                ws.send(
                  JSON.stringify({
                    type: "ai_text",
                    text: "Sorry, I encountered an error. Please try again.",
                  })
                );
              }
              break;
          }
        } catch (err) {
          console.error("[WS] Error:", err);
        }
      },

      onClose() {
        console.log("[WS] Client disconnected");
        state.audioChunks = [];
      },
    };
  })
);

// WebM → WAV 转换（使用 ffmpeg）
const FFMPEG_PATH = "F:\\anaconda\\envs\\patchcore\\Library\\bin\\ffmpeg.exe";

async function convertWebmToWav(webmBuffer: Buffer): Promise<Buffer> {
  const id = randomUUID();
  const inputPath = join(tmpdir(), `${id}.webm`);
  const outputPath = join(tmpdir(), `${id}.wav`);

  try {
    await writeFile(inputPath, webmBuffer);
    await new Promise<void>((resolve, reject) => {
      execFile(
        FFMPEG_PATH,
        [
          "-i",
          inputPath,
          "-ar",
          "16000",
          "-ac",
          "1",
          "-f",
          "wav",
          "-y",
          outputPath,
        ],
        { timeout: 15000 },
        (err) => (err ? reject(err) : resolve())
      );
    });
    return await readFile(outputPath);
  } finally {
    unlink(inputPath).catch(() => {});
    unlink(outputPath).catch(() => {});
  }
}

// ASR 语音识别（MiMo-V2.5-ASR）
async function transcribeAudio(wavBuffer: Buffer): Promise<string> {
  const base64Audio = `data:audio/wav;base64,${wavBuffer.toString("base64")}`;

  const resp = await fetch(`${MIMO_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${MIMO_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: MIMO_ASR_MODEL,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "input_audio",
              input_audio: {
                data: base64Audio,
                format: "wav",
              },
            },
          ],
        },
      ],
      asr_options: { language: "en" },
    }),
  });

  if (!resp.ok) {
    const errText = await resp.text();
    throw new Error(`ASR API error ${resp.status}: ${errText}`);
  }

  const data = await resp.json();
  return data.choices?.[0]?.message?.content || "";
}

// LLM 对话生成（MiMo 对话模型）
async function generateAIReply(
  scenario: string,
  history: Array<{ role: "user" | "assistant"; content: string }>
): Promise<string> {
  const systemPrompt =
    SCENARIO_PROMPTS[scenario] || SCENARIO_PROMPTS["interview"];

  const resp = await fetch(`${MIMO_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${MIMO_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: MIMO_LLM_MODEL,
      messages: [{ role: "system", content: systemPrompt }, ...history],
      max_tokens: 200,
      temperature: 0.7,
    }),
  });

  if (!resp.ok) {
    const errText = await resp.text();
    throw new Error(`LLM API error ${resp.status}: ${errText}`);
  }

  const data = await resp.json();
  return (
    data.choices?.[0]?.message?.content ||
    "I didn't catch that, could you repeat?"
  );
}

// TTS 语音合成（MiMo-V2.5-TTS）
async function generateTTS(text: string): Promise<Buffer> {
  const resp = await fetch(`${MIMO_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${MIMO_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: MIMO_TTS_MODEL,
      messages: [
        { role: "assistant", content: text },
      ],
      audio: {
        format: "wav",
        voice: MIMO_TTS_VOICE,
      },
    }),
  });

  if (!resp.ok) {
    const errText = await resp.text();
    throw new Error(`TTS API error ${resp.status}: ${errText}`);
  }

  const data = await resp.json();
  const audioBase64 = data.choices?.[0]?.message?.audio?.data;
  if (!audioBase64) throw new Error("TTS response missing audio data");

  return Buffer.from(audioBase64, "base64");
}

// 健康检查
app.get("/", (c: any) => {
  return c.json({ status: "ok", message: "SpeakBuddy Backend Running" });
});

// 启动服务器
const port = 3000;
const server = serve(
  { fetch: app.fetch, port },
  (info: { port: number }) => {
    console.log(
      `[Server] SpeakBuddy backend running on http://localhost:${info.port}`
    );
  }
);

injectWebSocket(server);
