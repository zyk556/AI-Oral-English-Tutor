import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { createNodeWebSocket } from "@hono/node-ws";
import { config } from "dotenv";
import { readFile } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";

// 加载环境变量（从 .env 文件读取 MIMO_API_KEY）
config();

const MIMO_API_KEY = process.env.MIMO_API_KEY!;
const MIMO_BASE_URL = "https://api.xiaomimimo.com/v1";
const MIMO_LLM_MODEL = "mimo-v2-flash";
const MIMO_TTS_MODEL = "mimo-v2.5-tts";
const MIMO_TTS_VOICE = "Chloe";

// 评估数据类型
interface Evaluation {
  corrected: string;
  grammar: Array<{ original: string; corrected: string; explanation: string }>;
  vocabulary: Array<{ suggestion: string; context: string }>;
  score: { fluency: number; grammar: number; vocabulary: number; overall: number };
  comment: string;
}

// 语音设置
interface VoiceSettings {
  voice: string;
  speed: number;
  volume: number;
}

// 会话状态
interface SessionState {
  scenario: string | null;
  histories: Record<string, Array<{ role: "user" | "assistant"; content: string }>>;
  voiceSettings: VoiceSettings;
  difficulty: "low" | "mid" | "high";
}

const app = new Hono();
const { injectWebSocket, upgradeWebSocket } = createNodeWebSocket({ app });

// WebSocket 路由
app.get(
  "/ws",
  upgradeWebSocket(() => {
    const state: SessionState = {
      scenario: null,
      histories: {},
      voiceSettings: { voice: "Chloe", speed: 1.0, volume: 1.0 },
      difficulty: "mid",
    };

    // 获取当前场景的历史
    const getHistory = () => {
      if (!state.scenario) return [];
      if (!state.histories[state.scenario]) state.histories[state.scenario] = [];
      return state.histories[state.scenario];
    };

    return {
      onOpen(_event: unknown, ws: any) {
        console.log("[WS] Client connected");
        ws.send(JSON.stringify({ type: "ready", message: "Connected" }));
      },

      async onMessage(event: any, ws: any) {
        try {
          const msg = JSON.parse(String(event.data));

          switch (msg.type) {
            case "difficulty":
              console.log(`[WS] Difficulty:`, msg.difficulty);
              state.difficulty = msg.difficulty;
              break;

            case "voice_settings":
              console.log(`[WS] Voice settings:`, msg.settings);
              state.voiceSettings = { ...state.voiceSettings, ...msg.settings };
              ws.send(JSON.stringify({ type: "voice_settings_set", settings: state.voiceSettings }));
              break;

            case "preview_voice":
              console.log(`[WS] Preview voice request`);
              try {
                const audioBuffer = await generateTTS(msg.text || "Hello! This is a voice preview.", state.voiceSettings);
                ws.send(audioBuffer);
              } catch (err) {
                console.error("[Preview] Error:", err);
              }
              break;

            case "set_scenario":
              console.log(`[WS] Setting scenario: ${msg.scenario}`);
              state.scenario = msg.scenario;
              // 不清空历史，每个场景独立保留
              ws.send(
                JSON.stringify({ type: "scenario_set", scenario: msg.scenario })
              );
              break;

            case "user_speech":
              console.log(`[WS] User speech: "${msg.text}"`);
              if (!state.scenario) break;

              ws.send(JSON.stringify({ type: "user_text", text: msg.text }));
              const history = getHistory();
              history.push({ role: "user", content: msg.text });

              try {
                // 双角色 LLM：一次调用，返回对话回复 + 评估
                const result = await generateReplyAndEvaluation(
                  state.scenario,
                  history,
                  state.difficulty
                );
                const { reply, evaluation } = result;
                const translation = result.translation;

                // 对话历史只存 reply
                history.push({ role: "assistant", content: reply });

                // 发送对话文本（含翻译）
                ws.send(JSON.stringify({ type: "ai_text", text: reply, translation }));

                // 发送评估数据
                ws.send(
                  JSON.stringify({ type: "ai_evaluation", evaluation })
                );

                // TTS 用 reply 文本生成语音
                const audioBuffer = await generateTTS(reply, state.voiceSettings);
                console.log(`[TTS] Generated audio, ${audioBuffer.length} bytes`);
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
      },
    };
  })
);

// 双角色 LLM：并行调用对话 + 评估
async function generateReplyAndEvaluation(
  scenario: string,
  history: Array<{ role: "user" | "assistant"; content: string }>,
  difficulty: "low" | "mid" | "high" = "mid"
): Promise<{ reply: string; translation: string; evaluation: Evaluation }> {
  const difficultyGuide: Record<string, string> = {
    low: "Use simple vocabulary and short sentences. Speak like talking to a middle school student. Use basic words and simple grammar.",
    mid: "Use everyday vocabulary and natural sentences. Speak like talking to a high school student. Use common expressions.",
    high: "Use advanced vocabulary and complex sentences. Speak like talking to a professional. Use idioms and sophisticated expressions.",
  };

  const scenarioPrompts: Record<string, string> = {
    interview:
      "You are an experienced HR interviewer at a tech company. Ask behavioral and technical questions naturally. Keep the tone professional but friendly. Limit each response to 2-3 sentences.",
    ordering:
      "You are a friendly waiter at a nice restaurant. Take the customer's order, suggest dishes. Use casual, polite English. Keep responses short and natural.",
    meeting:
      "You are a project manager leading a daily standup meeting. Ask about progress, blockers, and plans. Be encouraging and efficient. Keep responses short.",
    directions:
      "You are a helpful local person on the street. The user is asking you for directions. Give clear, simple directions. Use friendly English. Keep responses short and practical.",
    doctor:
      "You are a friendly doctor at a clinic. Ask the patient about their symptoms, give simple advice, and be reassuring. Use clear English that a non-native speaker can understand. Keep responses short.",
    airport:
      "You are an airline staff member at the airport check-in counter. Help the user with check-in, boarding, luggage, and gate questions. Be polite and professional. Keep responses short.",
    hotel:
      "You are a hotel receptionist. Help the user with check-in, room requests, and hotel services. Be warm and professional. Keep responses short.",
    dating:
      "You are the user's date at a cozy cafe. Be charming, curious, and warm. Ask about hobbies, travel, food, and life. Use casual, friendly English. Keep responses natural and flirty but respectful.",
  };
  const scenarioPrompt = scenarioPrompts[scenario] || scenarioPrompts["interview"];

  const userMsg = history[history.length - 1]?.content || "";

  // 串行：先对话，再评估（更稳定）
  const diffGuide = difficultyGuide[difficulty] || difficultyGuide.mid;
  let reply = "I didn't catch that, could you repeat?";
  try {
    reply = await callLLM([
      { role: "system", content: `${scenarioPrompt}\n\n${diffGuide}` },
      ...history,
    ], 300) || reply;
  } catch (err) {
    console.error("[LLM] Reply call failed:", err);
  }

  // 评估用户英语
  let evalRaw = "";
  try {
    evalRaw = await callLLM([
      {
        role: "system",
        content: `You are an English teacher. Evaluate the student's English. Reply with ONLY a JSON object, no markdown. Keep the comment under 20 words. Do NOT use double quotes inside string values. The "corrected" field should be a BETTER version of the student's original sentence - keep the same meaning and structure, just fix errors and make it sound more natural. Do NOT rewrite it completely. Example:
{"corrected":"I worked on many projects last year","grammar":[{"original":"I work on many project","corrected":"I worked on many projects","explanation":"past tense needed, plural noun"}],"vocabulary":[],"score":{"fluency":8,"grammar":7,"vocabulary":8,"overall":7},"comment":"Good job. Watch your verb tenses."}`,
      },
      { role: "user", content: `Student said: "${userMsg}"` },
    ], 800);
    console.log("[Eval] Raw response:", evalRaw.substring(0, 300));
  } catch (err) {
    console.error("[Eval] Call failed:", err);
  }

  // 解析评估
  let evaluation: Evaluation = {
    corrected: "", grammar: [], vocabulary: [],
    score: { fluency: 7, grammar: 7, vocabulary: 7, overall: 7 },
    comment: "",
  };

  if (evalRaw) {
    try {
      let jsonStr = evalRaw.trim();
      jsonStr = jsonStr.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");
      jsonStr = jsonStr.replace(/^[^{]*/, "");
      const first = jsonStr.indexOf("{");
      let last = jsonStr.lastIndexOf("}");
      // 如果 JSON 被截断（没有闭合的 }），尝试修复
      if (first !== -1 && (last === -1 || last <= first)) {
        jsonStr = jsonStr.substring(first);
        // 截断到最后一个完整的值，补上引号和括号
        if (!jsonStr.endsWith('"')) jsonStr += '"';
        if (!jsonStr.endsWith('}')) jsonStr += '}}';
        jsonStr = jsonStr.replace(/,\s*$/, ''); // 去掉尾部逗号
      } else if (first !== -1) {
        jsonStr = jsonStr.substring(first, last + 1);
      }
      jsonStr = jsonStr.replace(/,\s*([}\]])/g, "$1");

      console.log("[Eval] JSON:", jsonStr.substring(0, 500));
      const parsed = JSON.parse(jsonStr);
      evaluation = {
        corrected: parsed.corrected || "",
        grammar: parsed.grammar || [],
        vocabulary: parsed.vocabulary || [],
        score: parsed.score || evaluation.score,
        comment: parsed.comment || "",
      };
    } catch (err) {
      console.error("[Eval] Parse failed:", evalRaw.substring(0, 300));
    }
  } else {
    console.error("[Eval] Call failed:", evalResult.reason);
  }

  // 翻译（从对话回复生成）
  let translation = "";
  try {
    translation = await callLLM([
      { role: "system", content: "Translate the following English text to natural spoken Chinese. Reply with ONLY the translation, nothing else." },
      { role: "user", content: reply },
    ], 200);
  } catch (err) {
    console.error("[Translation] Failed:", err);
  }

  return { reply, translation, evaluation };
}

// 通用 LLM 调用
async function callLLM(
  messages: Array<{ role: string; content: string }>,
  maxTokens: number
): Promise<string> {
  const resp = await fetch(`${MIMO_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${MIMO_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: MIMO_LLM_MODEL,
      messages,
      max_tokens: maxTokens,
      temperature: 0.7,
    }),
  });

  if (!resp.ok) {
    const errText = await resp.text();
    throw new Error(`LLM API error ${resp.status}: ${errText}`);
  }

  const data = await resp.json();
  return data.choices?.[0]?.message?.content || "";
}

// TTS 语音合成
async function generateTTS(text: string, voiceSettings?: VoiceSettings): Promise<Buffer> {
  const voice = voiceSettings?.voice || MIMO_TTS_VOICE;
  const speed = voiceSettings?.speed || 1.0;

  // 构建 messages：速度控制通过 user 指令实现
  const messages: Array<{ role: string; content: string }> = [];
  if (speed !== 1.0) {
    const speedDesc = speed < 1 ? "Speak slowly and clearly" : speed > 1.2 ? "Speak quickly and briskly" : "Speak at a slightly faster pace";
    messages.push({ role: "user", content: speedDesc });
  }
  messages.push({ role: "assistant", content: text });

  const resp = await fetch(`${MIMO_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${MIMO_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: MIMO_TTS_MODEL,
      messages,
      audio: {
        format: "wav",
        voice,
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

// 查词翻译 API
app.post("/api/translate", async (c: any) => {
  try {
    const body = await c.req.json();
    const { word, definitions } = body;

    const prompt = `Translate these English word definitions to concise Chinese. Reply with ONLY a JSON array of Chinese strings, one per definition. No extra text.
Word: ${word}
Definitions:
${definitions.map((d: string, i: number) => `${i + 1}. ${d}`).join("\n")}

Example reply: ["定义1的中文","定义2的中文"]`;

    const raw = await callLLM(
      [{ role: "system", content: prompt }, { role: "user", content: word }],
      300
    );

    // 解析 JSON 数组
    let translated: string[] = definitions;
    try {
      let jsonStr = raw.trim();
      const start = jsonStr.indexOf("[");
      const end = jsonStr.lastIndexOf("]");
      if (start !== -1 && end > start) {
        jsonStr = jsonStr.substring(start, end + 1);
      }
      translated = JSON.parse(jsonStr);
    } catch {
      console.error("[Translate] Parse failed:", raw.substring(0, 200));
    }

    return c.json({ definitions: translated });
  } catch (err) {
    console.error("[Translate] Error:", err);
    return c.json({ definitions: [] }, 500);
  }
});

// 静态文件服务（前端打包产物）
const PUBLIC_DIR = join(import.meta.dirname, "public");

const MIME_TYPES: Record<string, string> = {
  ".html": "text/html",
  ".js": "application/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
};

// 所有非 /ws 路由都返回静态文件或 index.html（SPA）
app.get("*", async (c: any) => {
  const path = c.req.path === "/" ? "/index.html" : c.req.path;
  const filePath = join(PUBLIC_DIR, path);

  if (existsSync(filePath)) {
    const ext = filePath.substring(filePath.lastIndexOf("."));
    const mime = MIME_TYPES[ext] || "application/octet-stream";
    const content = await readFile(filePath);
    return new Response(content, {
      headers: { "Content-Type": mime },
    });
  }

  // SPA 回退
  const indexPath = join(PUBLIC_DIR, "index.html");
  if (existsSync(indexPath)) {
    const content = await readFile(indexPath);
    return new Response(content, {
      headers: { "Content-Type": "text/html" },
    });
  }

  return c.text("Not Found", 404);
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
