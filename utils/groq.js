const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const DEFAULT_MODEL = "openai/gpt-oss-20b";

async function groqChatCompletion(messages) {
  if (!process.env.GROQ_API_KEY) {
    const error = new Error("AI assistant is not configured (missing GROQ_API_KEY)");
    error.status = 503;
    throw error;
  }

  const res = await fetch(GROQ_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: process.env.GROQ_MODEL || DEFAULT_MODEL,
      messages,
      temperature: 0.3,
      max_tokens: 700,
    }),
  });

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    const error = new Error(data?.error?.message || "The AI assistant request failed");
    error.status = 502;
    throw error;
  }

  return data?.choices?.[0]?.message?.content?.trim() || "";
}

module.exports = { groqChatCompletion };
