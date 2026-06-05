import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { createNodeWebSocket } from "@hono/node-ws";
import { createClient, LiveTranscriptionEvents } from "@deepgram/sdk";
import OpenAI from "openai";
import { config } from "dotenv";

// 加载环境变量
config();

// 初始化 API 客户端
const deepgram = createClient(process.env.DEEPGRAM_API_KEY!);
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

// 场景 System Prompt 配置
const SCENARIO_PROMPTS: Record<string, string> = {
  interview:
    "You are an experienced HR interviewer at a tech company. You are interviewing a candidate for a software engineer position. Guidelines: - Ask behavioral and technical questions naturally. - React to the candidate's responses with follow-up questions. - Keep the tone professional but friendly. - Limit each response to 2-3 sentences to keep the conversation moving.",
  ordering:
    "You are a friendly waiter at a nice restaurant. Take the customer's order, suggest dishes based on their preferences, and handle any special requests. Use casual, polite English. Keep responses short and natural.",
  meeting:
    "You are a project manager leading a daily standup meeting. Ask each team member (the user) about their progress, any blockers, and plans for the day. Be encouraging and efficient. Keep the tone professional but supportive.",
};

// 每个连接的会话状态
interface SessionState {
  scenario: string | null;
  history: Array<{ role: "user" | "assistant"; content: string }>;
  dgConnection: any | null;
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
      dgConnection: null,
    };

    return {
      onOpen(_event: any, ws: any) {
        console.log("[WS] Client connected");
        ws.send(JSON.stringify({ type: "ready", message: "Connected" }));
      },

      async onMessage(event: any, ws: any) {
        try {
          // 二进制消息 = 音频数据，转发给 Deepgram
          if (event.data instanceof ArrayBuffer || Buffer.isBuffer(event.data)) {
            if (!state.scenario) {
              console.warn("[WS] Audio received but no scenario set, ignoring");
              return;
            }

            // 如果没有 Deepgram 连接，创建一个
            if (!state.dgConnection) {
              state.dgConnection = await deepgram.listen.live({
                model: "nova-2",
                language: "en",
                encoding: "opus",
                container: "webm",
                sample_rate: 48000,
                channels: 1,
                interim_results: false,
                endpointing: 300,
                utterance_end_ms: 1000,
              });

              // 处理 Deepgram 转录结果
              state.dgConnection.on(
                LiveTranscriptionEvents.Transcript,
                async (data: any) => {
                  const transcript = data.channel?.alternatives?.[0]?.transcript;
                  if (!transcript || transcript.trim() === "") return;
                  // 只处理最终结果（is_final）
                  if (!data.is_final) return;

                  console.log(`[DG] Final transcript: "${transcript}"`);

                  // 发送用户识别文本给前端
                  ws.send(
                    JSON.stringify({ type: "user_text", text: transcript })
                  );

                  // 更新对话历史
                  state.history.push({ role: "user", content: transcript });

                  try {
                    // 并行调用 OpenAI 生成回复和 TTS
                    const aiResponse = await generateAIReply(
                      state.scenario!,
                      state.history
                    );

                    // 将 AI 回复加入历史
                    state.history.push({
                      role: "assistant",
                      content: aiResponse,
                    });

                    // 发送 AI 文本回复
                    ws.send(
                      JSON.stringify({ type: "ai_text", text: aiResponse })
                    );

                    // 生成并发送 TTS 音频
                    const audioBuffer = await generateTTS(aiResponse);
                    ws.send(audioBuffer);
                  } catch (err) {
                    console.error("[AI] Error generating reply:", err);
                    ws.send(
                      JSON.stringify({
                        type: "ai_text",
                        text: "Sorry, I encountered an error. Please try again.",
                      })
                    );
                  }
                }
              );

              state.dgConnection.on(LiveTranscriptionEvents.Error, (err: any) => {
                console.error("[DG] Error:", err);
              });

              state.dgConnection.on(LiveTranscriptionEvents.UtteranceEnd, () => {
                console.log("[DG] Utterance end detected");
              });
            }

            // 将音频数据发送给 Deepgram
            if (state.dgConnection) {
              state.dgConnection.send(event.data);
            }
            return;
          }

          // 文本消息 = JSON 控制消息
          const msg = JSON.parse(event.data.toString());

          switch (msg.type) {
            case "set_scenario":
              console.log(`[WS] Setting scenario: ${msg.scenario}`);
              state.scenario = msg.scenario;
              state.history = [];
              // 重置 Deepgram 连接以开始新的会话
              if (state.dgConnection) {
                state.dgConnection.close();
                state.dgConnection = null;
              }
              ws.send(
                JSON.stringify({
                  type: "scenario_set",
                  scenario: msg.scenario,
                })
              );
              break;

            default:
              console.warn("[WS] Unknown message type:", msg.type);
          }
        } catch (err) {
          console.error("[WS] Error processing message:", err);
        }
      },

      onClose() {
        console.log("[WS] Client disconnected");
        // 清理 Deepgram 连接
        if (state.dgConnection) {
          state.dgConnection.close();
          state.dgConnection = null;
        }
      },
    };
  })
);

// 调用 OpenAI 生成对话回复
async function generateAIReply(
  scenario: string,
  history: Array<{ role: "user" | "assistant"; content: string }>
): Promise<string> {
  const systemPrompt =
    SCENARIO_PROMPTS[scenario] || SCENARIO_PROMPTS["interview"];

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "system", content: systemPrompt }, ...history],
    max_tokens: 200,
    temperature: 0.7,
  });

  return completion.choices[0]?.message?.content || "I didn't catch that, could you repeat?";
}

// 调用 OpenAI TTS 生成语音
async function generateTTS(text: string): Promise<Buffer> {
  const response = await openai.audio.speech.create({
    model: "tts-1",
    voice: "alloy",
    input: text,
    response_format: "mp3",
  });

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

// 健康检查端点
app.get("/", (c: any) => {
  return c.json({ status: "ok", message: "SpeakBuddy Backend Running" });
});

// 启动服务器
const port = 3000;
const server = serve({ fetch: app.fetch, port }, (info: any) => {
  console.log(`[Server] SpeakBuddy backend running on http://localhost:${info.port}`);
});

injectWebSocket(server);
