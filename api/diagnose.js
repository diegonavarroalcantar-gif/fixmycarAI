// ===============================
// FixMyCarAI - /api/diagnose.js
// Node.js (CommonJS) para Vercel
// ===============================

const OpenAI = require("openai");

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Mapa simple para elegir guía según palabras clave
const GUIDE_MAP = [
  {
    keys: ["transmision", "transmisión", "patina", "patea", "slip", "sobrecalentamiento transmision"],
    guide: "/blog/posts/transmision/diagnosticar-transmision.html",
  },
  {
    keys: ["misfire", "rateo", "bujia", "bobina", "p030"],
    guide: "/blog/posts/encendido/diagnosticar-encendido.html",
  },
  {
    keys: ["bomba", "gasolina", "inyector", "falta de potencia"],
    guide: "/blog/posts/combustible/diagnosticar-combustible.html",
  },
  {
    keys: ["sobrecalienta", "temperatura", "antifreeze", "anticongelante"],
    guide: "/blog/posts/enfriamiento/diagnosticar-enfriamiento.html",
  },
];

function detectGuide(symptoms) {
  const text = (symptoms || "").toLowerCase();
  for (const g of GUIDE_MAP) {
    if (g.keys.some((k) => text.includes(k))) {
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
    const vehicle = body.vehicle || "";
    const symptoms = body.message || "";

    if (!symptoms) {
      res.status(400).json({ error: "Missing message" });
      return;
    }

    const guidePath = detectGuide(symptoms);
    const guide_url = guidePath ? guidePath : null;

    const youtubeQuery = encodeURIComponent(
      `diagnosticar ${symptoms} ${vehicle} paso a paso`
    );
    const video_url = `https://www.youtube.com/results?search_query=${youtubeQuery}`;

    const prompt = `
Eres FixMyCarAI, experto en diagnóstico automotriz. 

Vehículo:
${vehicle}

Síntomas:
${symptoms}

Devuelve SOLO JSON válido con esta estructura exacta:

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
  ]
}
`.trim();

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.2,
      messages: [{ role: "user", content: prompt }],
    });

    const content = completion.choices[0].message.content || "";
    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch (e) {
      parsed = {
        hypotheses: [],
        actions: [],
        common_failures: [],
      };
    }

    res.status(200).json({
      hypotheses: parsed.hypotheses || [],
      actions: parsed.actions || [],
      common_failures: parsed.common_failures || [],
      guide_url,
      video_url,
    });
  } catch (err) {
    console.error("Error en /api/diagnose:", err);
    res.status(500).json({ error: "server_error" });
  }
};
