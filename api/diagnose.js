// ======================================
// FixMyCarAI – /api/diagnose.js
// Versión con guía + videos + diagnóstico estructurado
// 100% compatible con tu frontend actual
// ======================================

const OpenAI = require("openai");

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// URL RAW del repositorio
const RAW_BASE =
  "https://raw.githubusercontent.com/diegonavarroalcantar-gif/fixmycarAI/main/blog/posts/";

// Definición de guías mejorada
const GUIDE_MAP = [
  {
    key: ["transmision", "patina", "patea", "slip", "sobrecalentamiento"],
    guide: "transmision/diagnosticar-transmision.html",
    title: "Diagnosticar transmisión automática",
    videos: [
      "https://www.youtube.com/watch?v=Hh8C8cIPFso",
      "https://www.youtube.com/watch?v=K6cSsN8K6uA"
    ]
  },
  {
    key: ["misfire", "rateo", "bujia", "bobina", "p030"],
    guide: "encendido/diagnosticar-encendido.html",
    title: "Diagnosticar sistema de encendido",
    videos: [
      "https://www.youtube.com/watch?v=9tFnZEcRJaQ",
      "https://www.youtube.com/watch?v=I1nKxJt2YKw"
    ]
  },
  {
    key: ["bomba", "gasolina", "inyector", "falta de potencia"],
    guide: "combustible/diagnosticar-combustible.html",
    title: "Diagnosticar sistema de combustible",
    videos: [
      "https://www.youtube.com/watch?v=YEYHsU6E4xQ"
    ]
  },
  {
    key: ["sobrecalienta", "temperatura", "antifreeze", "anticongelante"],
    guide: "enfriamiento/diagnosticar-enfriamiento.html",
    title: "Diagnosticar sistema de enfriamiento",
    videos: [
      "https://www.youtube.com/watch?v=9v5dDtxZJzY"
    ]
  }
];

// Detectar mejor guía según texto
function detectGuide(text) {
  text = (text || "").toLowerCase();
  for (const g of GUIDE_MAP) {
    if (g.key.some(k => text.includes(k))) return g;
  }
  return null;
}

// Handler
module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    const symptoms = req.body?.message || "";

    if (!symptoms) {
      res.status(400).json({ error: "Missing message" });
      return;
    }

    // --------------------------
    // 1) Detectar guía relacionada
    // --------------------------
    const g = detectGuide(symptoms);
    let guideContent = "";
    let guide_url = null;
    let videos = [];
    let guide_title = null;

    if (g) {
      const rawUrl = RAW_BASE + g.guide;
      guide_url = "https://fixmycar-ai-three.vercel.app/blog/posts/" + g.guide;
      videos = g.videos;
      guide_title = g.title;

      try {
        const fetchRaw = await fetch(rawUrl);
        if (fetchRaw.ok) {
          const html = await fetchRaw.text();
          guideContent = html
            .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
            .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
            .replace(/<[^>]+>/g, " ")
            .replace(/\s+/g, " ")
            .trim();
        }
      } catch (err) {
        console.error("Error leyendo RAW:", err);
      }
    }

    // --------------------------
    // 2) Prompt al modelo
    // --------------------------
    const prompt = `
Eres FixMyCarAI, diagnostico automotriz experto.

Síntomas del usuario:
${symptoms}

Resumen técnico de guía relacionada:
${guideContent || "Sin guía disponible."}

Responde SOLO con JSON válido:

{
  "hypotheses": [],
  "actions": [],
  "common_failures": [],
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

    let parsed;
    try {
      parsed = JSON.parse(completion.choices[0].message.content);
    } catch {
      parsed = { raw: completion.choices[0].message.content };
    }

    // --------------------------
    // 3) Agregar guía + videos
    // --------------------------
    parsed.guide_url = guide_url;
    parsed.guide_title = guide_title;
    parsed.videos = videos;

    res.status(200).json(parsed);
  } catch (err) {
    console.error("ERROR /api/diagnose:", err);
    res.status(500).json({ error: "server_error" });
  }
};
