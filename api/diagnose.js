// =======================================================
// FixMyCarAI – diagnose.js (VERSIÓN FINAL)
// Totalmente funcional con tu estructura real del repo
// =======================================================

const OpenAI = require("openai");

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// BASE REAL DE TU REPO (NO RAW, NO HTML PLANO)
const GUIDE_BASE =
  "https://fixmycar-ai-three.vercel.app/blog/posts/";


// MAPA DE GUÍAS + VIDEOS REALES
const GUIDE_MAP = [
  {
    key: ["transmision", "patina", "patea", "slip", "sobrecalentamiento"],
    guide: "transmision/diagnosticar-transmision.html",
    videos: [
      "https://www.youtube.com/watch?v=sZya4A1NVuY",
      "https://www.youtube.com/watch?v=9sZo4PMBVd0"
    ]
  },
  {
    key: ["misfire", "rateo", "bujia", "bobina", "p030"],
    guide: "encendido/diagnosticar-encendido.html",
    videos: [
      "https://www.youtube.com/watch?v=5T1Q0uV7lXU",
      "https://www.youtube.com/watch?v=_kGskgYz9HI"
    ]
  },
  {
    key: ["bomba", "gasolina", "inyector", "falta de potencia"],
    guide: "combustible/diagnosticar-combustible.html",
    videos: [
      "https://www.youtube.com/watch?v=GqfS5c7odsA"
    ]
  },
  {
    key: ["sobrecalienta", "temperatura", "anticongelante", "antifreeze"],
    guide: "enfriamiento/diagnosticar-enfriamiento.html",
    videos: [
      "https://www.youtube.com/watch?v=TS8uVVjD88w"
    ]
  }
];


// Función para detectar la guía correcta
function detectGuide(text) {
  text = text.toLowerCase();
  for (const g of GUIDE_MAP) {
    if (g.key.some(k => text.includes(k))) {
      return g;
    }
  }
  return null;
}


// =======================================================
// HANDLER PRINCIPAL
// =======================================================
module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const symptoms = req.body?.message || "";

    if (!symptoms) {
      return res.status(400).json({ error: "Missing message" });
    }

    // Buscar guía
    const guideInfo = detectGuide(symptoms);

    const guideUrl = guideInfo
      ? GUIDE_BASE + guideInfo.guide
      : null;

    const videos = guideInfo
      ? guideInfo.videos
      : [];

    // Prompt IA
    const prompt = `
Eres FixMyCarAI, experto mecánico.

Síntomas:
${symptoms}

Responde SOLO en JSON válido:

{
  "hypotheses": ["causa1", "causa2"],
  "actions": ["acción1", "acción2"],
  "common_failures": ["falla1"],
  "guide_url": "${guideUrl || ""}",
  "videos": ${JSON.stringify(videos)}
}
    `.trim();

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.2,
      messages: [{ role: "user", content: prompt }]
    });

    let raw = completion.choices[0].message.content;

    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch (e) {
      parsed = { raw };
    }

    return res.status(200).json(parsed);

  } catch (error) {
    console.error("ERROR EN /api/diagnose:", error);
    return res.status(500).json({ error: "server_error" });
  }
};
