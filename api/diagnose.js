// ======================================
// FixMyCarAI – /api/diagnose.js FINAL
// 100% COMPATIBLE CON VERCEL NODE 22.X
// ======================================

const OpenAI = require("openai");

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Guías RAW desde tu repo
const RAW_BASE =
  "https://raw.githubusercontent.com/diegonavarroalcantar-gif/fixmycarAI/main/blog/posts/";

// Mapeo de palabras clave → guía
const GUIDE_MAP = [
  {
    key: ["transmision", "patina", "patea", "slip", "sobrecalentamiento"],
    guide: "transmision/diagnosticar-transmision.html"
  }
];

function detectGuide(text) {
  text = (text || "").toLowerCase();
  for (const g of GUIDE_MAP) {
    if (g.key.some(k => text.includes(k))) return g.guide;
  }
  return null;
}

module.exports = async (req, res) => {
  if (req.method !== "POST")
    return res.status(405).json({ error: "Method not allowed" });

  try {
    const symptoms = req.body?.message || "";

    let guideContent = "";
    const guidePath = detectGuide(symptoms);

    if (guidePath) {
      const url = RAW_BASE + guidePath;
      const r = await fetch(url);
      if (r.ok) {
        const html = await r.text();
        guideContent = html
          .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
          .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
          .replace(/<[^>]+>/g, " ")
          .replace(/\s+/g, " ")
          .trim();
      }
    }

    const prompt = `
Eres FixMyCarAI, experto en diagnóstico automotriz.

Síntomas del usuario:
${symptoms}

Resumen técnico de la guía:
${guideContent || "Sin guía, usa tu criterio profesional."}

Responde en este JSON exacto:

{
  "hypotheses": [],
  "actions": [],
  "common_failures": [],
  "tsbs": [],
  "recalls": [],
  "nhtsa_alerts": []
}
    `;

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.2,
      messages: [{ role: "user", content: prompt }]
    });

    const raw = completion.choices[0].message.content;
    let json;
    try {
      json = JSON.parse(raw);
    } catch {
      json = { raw };
    }

    return res.status(200).json(json);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "server_error" });
  }
};
