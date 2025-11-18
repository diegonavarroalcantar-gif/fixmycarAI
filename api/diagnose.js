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
Eres FixMyCarAI, especialista automotriz profesional.

Usa tu conocimiento técnico, bases de datos automotrices globales 
(NHTSA, TSBs, ASE, fallas comunes, campañas de servicio, recalls, reportes de usuarios),
y en caso de existir, boletines PROFECO.

Analiza:

- VIN o modelo: "${vin || "No especificado"}"
- Síntomas: "${message}"

Devuelve EXCLUSIVAMENTE un JSON con este formato exacto:

{
  "hypotheses": ["causa1", "causa2"],
  "actions": ["accion1", "accion2"],
  "common_failures": ["fallas típicas del modelo/motor"],
  "tsbs": ["boletines técnicos relevantes"],
  "recalls": ["recalls confirmados del modelo"],
  "nhtsa_alerts": ["problemas reportados por usuarios y mecánicos"],
  "profeco_alert": "texto o null"
}

REGLAS IMPORTANTES:
- NO escribas texto fuera del JSON.
- Si el vehículo tiene datos incompletos, infiere por marca, modelo y motor.
- PROFECO solo si existe un boletín real, si no existe: null.
- NHTSA, TSB y fallas comunes SIEMPRE deben incluirse si existen para ese modelo o motor.
- Sé preciso y técnico.
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
          { role: "system", content: "Eres FixMyCarAI, experto en diagnóstico automotriz técnico." },
          { role: "user", content: prompt }
        ],
        max_tokens: 700,
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
