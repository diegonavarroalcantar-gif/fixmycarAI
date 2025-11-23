// ======================================
// FixMyCarAI – diagnose.js (versión simple y estable)
// Usa Node.js clásico de Vercel y lee guías desde GitHub
// ======================================

import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Mapa de palabras clave -> ruta de guía en el repo
const GUIDE_MAP = [
  // Encendido
  { key: ["misfire", "tironeo", "rateo", "p030", "p035", "bobina", "bujia"], guide: "encendido/diagnosticar-encendido.html" },

  // Combustible
  { key: ["bomba", "gasolina", "inyector", "p02", "p008", "ralenti pobre"], guide: "combustible/diagnosticar-combustible.html" },

  // Enfriamiento
  { key: ["se calienta", "sobrecalent", "antifreeze", "anticongelante", "refrigerante"], guide: "enfriamiento/diagnosticar-enfriamiento.html" },

  // Escape
  { key: ["p0420", "catalizador", "huele a azufre", "escape"], guide: "escape/diagnosticar-escape.html" },

  // Sensores
  { key: ["maf", "map", "ckp", "cmp", "sensor", "p010", "p011", "p033", "p034"], guide: "sensores/diagnosticar-sensores.html" },

  // OBD2 en general
  { key: ["p0", "p1", "p2", "p3"], guide: "obd2/interpretar-codigos-obd2.html" },

  // Transmisión
  { key: ["transmision", "patina", "patea", "p074", "p075", "p076", "slip", "golpea cambio", "sobrecalentamiento transmision"], guide: "transmision/diagnosticar-transmision.html" }
];

// Base fija al RAW de GitHub (no depende de Vercel)
const RAW_BASE =
  "https://raw.githubusercontent.com/diegonavarroalcantar-gif/fixmycarAI/main/blog/posts/";

// Detectar guía por síntomas
function detectGuide(symptoms) {
  const txt = (symptoms || "").toLowerCase();
  for (const entry of GUIDE_MAP) {
    if (entry.key.some(k => txt.includes(k))) {
      return entry.guide;
    }
  }
  return null;
}

// Handler clásico para Vercel Node.js
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { message } = req.body || {}; // tu frontend manda { message: symptoms }

    if (!message) {
      return res.status(400).json({ error: "No symptoms provided" });
    }

    // 1) Detectar guía según los síntomas
    const guidePath = detectGuide(message);
    let guideContent = "";

    // 2) Leer guía desde GitHub RAW (no desde Vercel)
    if (guidePath) {
      const url = RAW_BASE + guidePath;
      try {
        const resp = await fetch(url);
        if (resp.ok) {
          const html = await resp.text();
          // limpiar HTML → sólo texto
          guideContent = html
            .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
            .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
            .replace(/<[^>]+>/g, " ")
            .replace(/\s+/g, " ")
            .trim();
        }
      } catch (err) {
        console.error("Error fetching guide from GitHub:", err);
      }
    }

    // 3) Prompt al modelo
    const prompt = `
Eres FixMyCarAI, un experto en diagnóstico automotriz.

Síntomas del usuario:
${message}

Resumen técnico de la guía asociada:
${guideContent || "Sin guía técnica disponible, usa únicamente tu conocimiento general de mecánica automotriz."}

Responde SIEMPRE en JSON válido con esta estructura:

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
      // Si por lo que sea no vino JSON perfecto, devolvemos el texto crudo
      parsed = { raw };
    }

    return res.status(200).json(parsed);
  } catch (error) {
    console.error("Fatal error in diagnose:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
