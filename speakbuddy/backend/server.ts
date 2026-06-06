import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { createNodeWebSocket } from "@hono/node-ws";
import { config } from "dotenv";

// 加载环境变量
config();

const MIMO_API_KEY = process.env.MIMO_API_KEY!;
const MIMO_BASE_URL = "https://api.xiaomimimo.com/v1";
const MIMO_LLM_MODEL = "mimo-v2-flash";
const MIMO_TTS_MODEL = "mimo-v2.5-tts";
const MIMO_TTS_VOICE = "Chloe";

// 场景 System Prompt
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
            case "set_scenario":
              console.log(`[WS] Setting scenario: ${msg.scenario}`);
              state.scenario = msg.scenario;
              state.history = [];
              ws.send(
                JSON.stringify({ type: "scenario_set", scenario: msg.scenario })
              );
              break;

            case "user_speech":
              // 前端浏览器语音识别后的文本
              console.log(`[WS] User speech: "${msg.text}"`);
              if (!state.scenario) break;

              // 发送用户文本给前端显示
              ws.send(JSON.stringify({ type: "user_text", text: msg.text }));
              state.history.push({ role: "user", content: msg.text });

              try {
                // LLM 生成回复
                const aiResponse = await generateAIReply(
                  state.scenario,
                  state.history
                );
                state.history.push({ role: "assistant", content: aiResponse });

                // 发送 AI 文本
                ws.send(JSON.stringify({ type: "ai_text", text: aiResponse }));

                // TTS 生成语音
                const audioBuffer = await generateTTS(aiResponse);
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

// LLM 对话生成
async function generateAIReply(
  scenario: string,
  history: Array<{ role: "user" | "assistant"; content: string }>
): Promise<string> {
  const systemPrompt =
    SCENARIO_PROMPTS[scenario] || SCENARIO_PROMPTS["interview"];

  const resp = await fetch(`${MIMO_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${MIMO_API_KEY}`,
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

// TTS 语音合成
async function generateTTS(text: string): Promise<Buffer> {
  const resp = await fetch(`${MIMO_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${MIMO_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: MIMO_TTS_MODEL,
      messages: [{ role: "assistant", content: text }],
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
