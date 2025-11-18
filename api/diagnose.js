export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { message, vin } = req.body || {};

    if (!message) {
      return res.status(400).json({ error: "Missing symptom message" });
    }

    const API_KEY = process.env.OPENAI_API_KEY;
    if (!API_KEY) {
      return res.status(500).json({ error: "Missing OPENAI_API_KEY" });
    }

    const prompt = `
Eres FixMyCarAI, especialista automotriz.

Analiza únicamente esta información:
- VIN o modelo: "${vin || "No especificado"}"
- Síntomas: "${message}"

Y devuelve **EXCLUSIVAMENTE** un JSON con este formato exacto:

{
  "hypotheses": ["causa1", "causa2"],
  "actions": ["accion1", "accion2"],
  "common_failures": ["falla común 1", "falla común 2"],
  "recalls": ["recall o campaña de servicio relevante"],
  "profeco_alert": "texto o null"
}

Reglas IMPORTANTES:
- NO expliques nada fuera del JSON.
- Usa conocimiento automotriz general y boletines públicos.
- Si no hay datos reales de PROFECO para ese modelo, devuelve null.
- Incluye fallas comunes típicas del modelo y motor.
    `.trim();

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "Eres FixMyCarAI, experto en diagnóstico automotriz." },
          { role: "user", content: prompt }
        ],
        max_tokens: 500,
        temperature: 0.2
      }),
    });

    const json = await response.json();
    const content = json?.choices?.[0]?.message?.content || "";

    try {
      const parsed = JSON.parse(content);
      return res.status(200).json(parsed);
    } catch (err) {
      return res.status(200).json({ raw: content });
    }

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
