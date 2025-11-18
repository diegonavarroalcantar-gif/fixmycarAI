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
Eres FixMyCarAI, especialista en diagnóstico automotriz.

Debes devolver SIEMPRE un JSON con TODOS estos campos, sin omitir ninguno:

{
  "hypotheses": [],
  "actions": [],
  "common_failures": [],
  "tsbs": [],
  "recalls": [],
  "nhtsa_alerts": [],
  "profeco_alert": null
}

Reglas:
- NO puedes omitir campos.
- Si no hay información real, devuelve listas vacías o "null".
- "profeco_alert" solo puede ser string o null.
- NO escribas nada fuera del JSON.
- Usa conocimiento global: NHTSA, TSBs, reportes de usuarios, fallas comunes de la marca, motor y año.

Datos a analizar:
Vehículo/VIN: "${vin || "No especificado"}"
Síntomas: "${message}"
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
          { role: "system", content: "Eres FixMyCarAI, experto automotriz técnico." },
          { role: "user", content: prompt }
        ],
        max_tokens: 700,
        temperature: 0.1
      })
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
