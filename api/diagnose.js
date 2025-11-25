// ======================================
// FixMyCarAI – /api/diagnose.js
// Backend estable con guías + videos
// ======================================

const OpenAI = require("openai");

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Guías RAW desde tu repo (para contexto de IA)
const RAW_BASE =
  "https://raw.githubusercontent.com/diegonavarroalcantar-gif/fixmycarAI/main/blog/posts/";

// Palabras clave -> guía + videos
const GUIDE_MAP = [
  {
    key: [
      "transmision",
      "transmisión",
      "patina",
      "patinamiento",
      "patea",
      "slip",
      "sobrecalentamiento transmision",
      "sobrecalentamiento de la transmision"
    ],
    guide: "transmision/diagnosticar-transmision.html",
    videos: [
      "https://www.youtube.com/results?search_query=patina+transmision+automatica+diagnostico",
      "https://www.youtube.com/results?search_query=verificar+nivel+aceite+transmision+automatica"
    ]
  },
  {
    key: ["misfire", "rateo", "bujia", "bujías", "bobina", "bobinas", "p030"],
    guide: "encendido/diagnosticar-encendido.html",
    videos: [
      "https://www.youtube.com/results?search_query=diagnosticar+misfire+motor+gasolina",
      "https://www.youtube.com/results?search_query=prueba+de+bobinas+de+encendido"
    ]
  },
  {
    key: [
      "bomba gasolina",
      "bomba de gasolina",
      "falta de potencia",
      "se apaga al acelerar",
      "inyector",
      "inyectores"
    ],
    guide: "combustible/diagnosticar-combustible.html",
    videos: [
      "https://www.youtube.com/results?search_query=como+diagnosticar+bomba+de+gasolina",
      "https://www.youtube.com/results?search_query=prueba+de+inyectores+gasolina"
    ]
  },
  {
    key: [
      "se calienta",
      "sobrecalienta",
      "temperatura alta",
      "hierve",
      "anticongelante",
      "antifreeze",
      "no prenden los ventiladores"
    ],
    guide: "enfriamiento/diagnosticar-enfriamiento.html",
    videos: [
      "https://www.youtube.com/results?search_query=diagnosticar+sobrecalentamiento+motor",
      "https://www.youtube.com/results?search_query=ventilador+radiador+no+enciende+diagnostico"
    ]
  }
];

function detectGuide(text) {
  const t = (text || "").toLowerCase();
  for (const g of GUIDE_MAP) {
    if (g.key.some(k => t.includes(k))) {
      return g;
    }
  }
  return null;
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const symptoms = (req.body && req.body.message) || "";

    if (!symptoms) {
      return res.status(400).json({ error: "Missing message" });
    }

    const match = detectGuide(symptoms);
    let guideContent = "";
    let guideUrl = null;
    let videoLinks = [];

    if (match) {
      guideUrl = `/blog/posts/${match.guide}`;
      videoLinks = match.videos || [];

      try {
        const r = await fetch(RAW_BASE + match.guide);
        if (r.ok) {
          const html = await r.text();
          guideContent = html
            .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
            .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
            .replace(/<[^>]+>/g, " ")
            .replace(/\s+/g, " ")
            .trim();
        }
      } catch (e) {
        console.error("Error leyendo guía RAW:", e);
      }
    }

    const prompt = `
Eres FixMyCarAI, experto en diagnóstico automotriz.

Síntomas del usuario:
${symptoms}

Resumen técnico de la guía relacionada (si existe):
${guideContent || "Sin guía disponible, usa tu criterio profesional de mecánico."}

Responde SOLO en JSON válido con esta estructura EXACTA:

{
  "hypotheses": ["..."],
  "actions": ["..."],
  "common_failures": ["..."],
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
    let base;

    try {
      base = JSON.parse(raw);
    } catch {
      base = { raw };
    }

    const payload =
      base && typeof base === "object" ? { ...base } : { raw: String(raw) };

    if (guideUrl) payload.guide_url = guideUrl;
    if (videoLinks.length) payload.video_links = videoLinks;

    return res.status(200).json(payload);
  } catch (e) {
    console.error("Error en /api/diagnose:", e);
    return res.status(500).json({ error: "server_error" });
  }
};
