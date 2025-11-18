export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { message } = req.body || {};

    if (!message) {
      return res.status(400).json({ error: "Missing symptom message" });
    }

    const API_KEY = process.env.OPENAI_API_KEY;
    if (!API_KEY) {
      return res.status(500).json({ error: "Missing OPENAI_API_KEY" });
    }

    const prompt = `
Eres FixMyCarAI. Analiza el siguiente síntoma automotriz:

"${message}"

Devuelve SIEMPRE un JSON EXACTO con este formato:

{
  "hypotheses": ["causa1", "causa2"],
  "actions": ["accion1", "accion2"],
  "profeco_alert": null
}
    `.trim();

    const openai = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "Eres FixMyCarAI." },
          { role: "user", content: prompt }
        ],
        max_tokens: 400,
      })
    });

    const json = await openai.json();
    const content = json?.choices?.[0]?.message?.content || "";

    try {
      // Intentamos parsear JSON válido
      const parsed = JSON.parse(content);
      return res.status(200).json(parsed);
    } catch (e) {
      // Si no es JSON, regresamos raw
      return res.status(200).json({ raw: content });
    }

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
