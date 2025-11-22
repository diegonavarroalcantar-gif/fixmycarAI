// ======================================
// FixMyCarAI – diagnose.js PRO FINAL
// Con runtime NodeJS + limpiador HTML
// ======================================

export const config = {
  runtime: "nodejs"
};

import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// -------------------------------------------------
// 🔍 MOTOR DE PALABRAS CLAVE → ASIGNACIÓN DE GUÍAS
// -------------------------------------------------
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

  // Transmisión (nuevo)
  { key: ["transmision", "patina", "p074", "p075", "p076", "slip", "golpea cambio"], guide: "transmision/diagnosticar-transmision.html" }
];

// -------------------------------
// BASE del Blog
// -------------------------------
const BLOG_BASE = "https://fixmycar-ai-three.vercel.app/blog/posts/";

// -------------------------------------------------
// FUNCIÓN: Detectar la guía correcta
// -------------------------------------------------
function detectGuide(symptoms) {
  const text = symptoms.toLowerCase();
  for (const entry of GUIDE_MAP) {
    if (entry.key.some(k => text.includes(k))) {
      return entry.guide;
    }
  }
  return null;
}

// -------------------------------------------------
// 🔥 API POST – Diagnóstico PRO
// -------------------------------------------------
export async function POST(req) {
  try {
    const { message } = await req.json();

    if (!message) {
      return new Response(JSON.stringify({ error: "No symptoms provided" }), { status: 400 });
    }

    // -------------------------------------------------
    // 1️⃣ Detectar la guía basada en palabras clave
    // -------------------------------------------------
    const guidePath = detectGuide(message);
    let guideContent = "";

    // -------------------------------------------------
    // 2️⃣ Descargar & limpiar la guía HTML
    // -------------------------------------------------
    if (guidePath) {
      const url = BLOG_BASE + guidePath;

      try {
        const res = await fetch(url, {
          headers: { "User-Agent": "FixMyCarAI" }
        });

        const html = await res.text();

        // LIMPIADOR HTML PRO (evita tokens altos)
        guideContent = html
          .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
          .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
          .replace(/<[^>]+>/g, " ")
          .replace(/\s+/g, " ")
          .trim();

      } catch (err) {
        console.error("Error fetching guide:", err);
      }
    }

    // -------------------------------------------------
    // 3️⃣ Prompt PROFESIONAL optimizado para transmisión
    // -------------------------------------------------
    const prompt = `
Eres FixMyCarAI PRO, un asistente de diagnóstico automotriz profesional.

Tu objetivo:
- Diagnóstico certero y detallado
- Basado en las guías técnicas proporcionadas
- NO inventes cosas fuera de la guía

Guía técnica cargada (limpia):
${guideContent || "No guide found"}

Síntomas del usuario:
${message}

Devuelve SIEMPRE:
1. Posibles causas más probables
2. Acciones recomendadas
3. Qué revisar primero
4. Probabilidad de cada causa (%)
5. Advertencias técnicas importantes
    `;

    // -------------------------------------------------
    // 4️⃣ Llamada al modelo OpenAI (estable)
    // -------------------------------------------------
    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.2,
      messages: [{ role: "system", content: prompt }]
    });

    return Response.json({
      reply: completion.choices[0].message.content
    });

  } catch (error) {
    console.error("Fatal error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), { status: 500 });
  }
}
