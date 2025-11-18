import { buffer } from "micro";

export const config = {
  api: {
    bodyParser: false
  }
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Leer body manualmente (garantizado en Vercel)
  const rawBody = (await buffer(req)).toString();
  let body = {};
  
  try {
    body = JSON.parse(rawBody);
  } catch (e) {
    return res.status(400).json({ error: "Invalid JSON body" });
  }

  const { message } = body;

  if (!message) {
    return res.status(400).json({ error: "No message provided" });
  }

  const API_KEY = process.env.OPENAI_API_KEY;
  if (!API_KEY) {
    return res.status(500).json({ error: "OPENAI_API_KEY missing" });
  }

  const prompt = `
Eres FixMyCarAI, experto en diagnóstico automotriz. Analiza este síntoma:

"${message}"

Devuelve SIEMPRE un JSON EXACTO:
{
 "hypotheses": ["causa1", "causa2"],
 "actions": ["accion1", "accion2"],
 "profeco_alert": null
}
  `.trim();

  try {
    const openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "Eres FixMyCarAI." },
          { role: "user", content: prompt }
        ],
        temperature: 0.1,
        max_tokens: 300
      })
    });

    const json = await openaiResponse.json();
    const text = json?.choices?.[0]?.message?.content || "";

    try {
      const parsed = JSON.parse(text);
      return res.status(200).json(parsed);
    } catch {
      return res.status(200).json({ raw: text });
    }

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
