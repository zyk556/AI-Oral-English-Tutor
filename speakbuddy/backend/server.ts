import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { createNodeWebSocket } from "@hono/node-ws";
import { config } from "dotenv";

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

// 双角色 System Prompt：对话伙伴 + 纠错评委
function buildSystemPrompt(scenario: string): string {
  const scenarioPrompts: Record<string, string> = {
    interview:
      "You are an experienced HR interviewer at a tech company. You are interviewing a candidate for a software engineer position. Ask behavioral and technical questions naturally. React to the candidate's responses with follow-up questions. Keep the tone professional but friendly. Limit each response to 2-3 sentences.",
    ordering:
      "You are a friendly waiter at a nice restaurant. Take the customer's order, suggest dishes based on their preferences, and handle any special requests. Use casual, polite English. Keep responses short and natural.",
    meeting:
      "You are a project manager leading a daily standup meeting. Ask each team member about their progress, any blockers, and plans for the day. Be encouraging and efficient. Keep the tone professional but supportive.",
  };

  const scenarioPrompt = scenarioPrompts[scenario] || scenarioPrompts["interview"];

  return `${scenarioPrompt}

You have TWO roles:
1. **Conversation Partner**: Respond naturally to keep the conversation going.
2. **English Evaluator** (invisible to user): Silently evaluate the user's English. Do NOT mention corrections in your reply.

You MUST respond with ONLY a valid JSON object (no markdown, no code fences) in this exact format:
{
  "reply": "Your conversational response here (2-3 sentences)",
  "evaluation": {
    "corrected": "A grammatically corrected version of the user's full message",
    "grammar": [
      {"original": "the wrong phrase", "corrected": "the correct phrase", "explanation": "Brief explanation of the grammar rule"}
    ],
    "vocabulary": [
      {"suggestion": "better word or phrase", "context": "Why this is better, with example usage"}
    ],
    "score": {"fluency": 7, "grammar": 6, "vocabulary": 7, "overall": 7},
    "comment": "One encouraging sentence with specific advice"
  }
}

Rules:
- "reply" must be ONLY your conversational response, as if you are just a conversation partner.
- "grammar" array: list each grammar error. If none, use empty array [].
- "vocabulary" array: suggest 1-2 better word choices. If the user's vocabulary is perfect, use empty array [].
- "score": each dimension is 1-10. Be honest but encouraging.
- "comment": be specific and helpful, not generic.
- If the user's English is perfect, the evaluation should still have scores (high) and a positive comment.
- IMPORTANT: Output ONLY the JSON object. No extra text before or after.`;
}

// 会话状态
interface SessionState {
  scenario: string | null;
  // 每个场景独立的对话历史
  histories: Record<string, Array<{ role: "user" | "assistant"; content: string }>>;
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
                const { reply, evaluation } = await generateReplyAndEvaluation(
                  state.scenario,
                  history
                );

                // 对话历史只存 reply
                history.push({ role: "assistant", content: reply });

                // 发送对话文本
                ws.send(JSON.stringify({ type: "ai_text", text: reply }));

                // 发送评估数据
                ws.send(
                  JSON.stringify({ type: "ai_evaluation", evaluation })
                );

                // TTS 用 reply 文本生成语音
                const audioBuffer = await generateTTS(reply);
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

// 双角色 LLM：对话回复 + 评估
async function generateReplyAndEvaluation(
  scenario: string,
  history: Array<{ role: "user" | "assistant"; content: string }>
): Promise<{ reply: string; evaluation: Evaluation }> {
  const systemPrompt = buildSystemPrompt(scenario);

  const resp = await fetch(`${MIMO_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${MIMO_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: MIMO_LLM_MODEL,
      messages: [{ role: "system", content: systemPrompt }, ...history],
      max_tokens: 800,
      temperature: 0.7,
    }),
  });

  if (!resp.ok) {
    const errText = await resp.text();
    throw new Error(`LLM API error ${resp.status}: ${errText}`);
  }

  const data = await resp.json();
  const content = data.choices?.[0]?.message?.content || "";

  // 解析 JSON 响应
  try {
    // 尝试提取 JSON（处理可能的 markdown 代码块包裹）
    let jsonStr = content.trim();
    if (jsonStr.startsWith("```")) {
      jsonStr = jsonStr.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
    }
    const parsed = JSON.parse(jsonStr);

    const reply = parsed.reply || "I didn't catch that, could you repeat?";
    const evaluation: Evaluation = {
      corrected: parsed.evaluation?.corrected || "",
      grammar: parsed.evaluation?.grammar || [],
      vocabulary: parsed.evaluation?.vocabulary || [],
      score: parsed.evaluation?.score || { fluency: 5, grammar: 5, vocabulary: 5, overall: 5 },
      comment: parsed.evaluation?.comment || "",
    };

    return { reply, evaluation };
  } catch (parseErr) {
    console.error("[LLM] Failed to parse JSON response:", content);
    // 降级：把整个内容当作 reply，评估为空
    return {
      reply: content || "I didn't catch that, could you repeat?",
      evaluation: {
        corrected: "",
        grammar: [],
        vocabulary: [],
        score: { fluency: 0, grammar: 0, vocabulary: 0, overall: 0 },
        comment: "Could not evaluate this response.",
      },
    };
  }
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
