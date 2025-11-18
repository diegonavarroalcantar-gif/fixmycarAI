export default async function handler(req, res) {
  // Solo permitir POST
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Captura del body
    const { message } = req.body || {};

    if (!message) {
      return res.status(400).json({ error: "No symptom message received" });
    }

    const API_KEY = process.env.OPENAI_API_KEY;

    if (!API_KEY) {
      return res.status(500).json({ error: "OPENAI_API_KEY missing in Vercel" });
    }

    const prompt = `
Eres FixMyCarAI, un experto en fallas automotrices. Analiza este síntoma:

"${message}"

Devuelve SIEMPRE un JSON EXACTO así:

{
 "hypotheses": ["causa1", "causa2"],
 "actions": ["accion1", "accion2"],
 "profeco_alert": null
}
    `.trim();

    const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
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

    const result = await openaiRes.json();

    let content = result?.choices?.[0]?.message?.content || "";

    // Intentamos parsear JSON
    try {
      const parsed = JSON.parse(content);
      return res.status(200).json(parsed);
    } catch {
      // Si no es JSON, enviamos raw
      return res.status(200).json({ raw: content });
    }

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
