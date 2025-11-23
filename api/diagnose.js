// ======================================
// FixMyCarAI – /api/diagnose.js
// Versión estable, compatible con Vercel Node.js 22.x
// y con tu frontend actual (envía { message: "..." }).
// ======================================

const OpenAI = require("openai");

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Guías alojadas en tu propio repositorio de GitHub (RAW)
const RAW_BASE =
  "https://raw.githubusercontent.com/diegonavarroalcantar-gif/fixmycarAI/main/blog/posts/";

// Palabras clave -> ruta de guía
const GUIDE_MAP = [
  {
    key: ["transmision", "patina", "patea", "slip", "sobrecalentamiento transmision"],
    guide: "transmision/diagnosticar-transmision.html"
  },
  {
    key: ["misfire", "rateo", "bujia", "bobina", "p030"],
    guide: "encendido/diagnosticar-encendido.html"
  },
  {
    key: ["bomba", "gasolina", "inyector", "falta de potencia"],
    guide: "combustible/diagnosticar-combustible.html"
  },
  {
    key: ["sobrecalienta", "temperatura", "antifreeze", "anticongelante"],
    guide: "enfriamiento/diagnosticar-enfriamiento.html"
  }
];

// Detectar guía según texto de síntomas
function detectGuide(text) {
  text = (text || "").toLowerCase();
  for (const g of GUIDE_MAP) {
    if (g.key.some(k => text.includes(k))) {
      return g.guide;
    }
  }
  return null;
}

// Handler para Vercel (CommonJS)
module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    const body = req.body || {};
    const symptoms = body.message ? String(body.message) : "";

    if (!symptoms) {
      res.status(400).json({ error: "Missing message" });
      return;
    }

    // 1) Detectar guía
    const guidePath = detectGuide(symptoms);
    let guideContent = "";

    if (guidePath) {
      try {
        const url = RAW_BASE + guidePath;
        const r = await fetch(url);
        if (r.ok) {
          const html = await r.text();
          // Limpiar HTML -> solo texto
          guideContent = html
            .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
            .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
            .replace(/<[^>]+>/g, " ")
            .replace(/\s+/g, " ")
            .trim();
        }
      } catch (e) {
        console.error("Error leyendo guía:", e);
      }
    }

    // 2) Prompt al modelo
    const prompt = `
Eres FixMyCarAI, experto en diagnóstico automotriz.

Síntomas del usuario:
${symptoms}

Resumen técnico de la guía relacionada:
${guideContent || "Sin guía disponible, usa tu criterio general de mecánica automotriz."}

Responde SOLO en JSON válido con esta estructura exacta:

{
  "hypotheses": [
    "Posible causa 1",
    "Posible causa 2"
  ],
  "actions": [
    "Acción recomendada 1",
    "Acción recomendada 2"
  ],
  "common_failures": [
    "Falla común relacionada 1"
  ],
  "tsbs": [],
  "recalls": [],
  "nhtsa_alerts": []
}
    `.trim();

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.2,
      messages: [{ role: "user", content: prompt }]
    });

    const raw = completion.choices[0].message.content || "";
    let parsed;

    try {
      parsed = JSON.parse(raw);
    } catch (e) {
      // Si no viene JSON perfecto, devolvemos el texto crudo
      parsed = { raw };
    }

    res.status(200).json(parsed);
  } catch (err) {
    console.error("Error en /api/diagnose:", err);
    res.status(500).json({ error: "server_error" });
  }
};
