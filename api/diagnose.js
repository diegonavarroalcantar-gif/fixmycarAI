// ===============================
// FixMyCarAI – diagnose.js PRO
// Usa tus guías del blog como base técnica real
// ===============================

import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// 🔍 TABLA DE PALABRAS CLAVE → GUIAS
const GUIDE_MAP = [
  // Encendido
  { key: ["misfire", "tironeo", "rateo", "p030", "bobina", "bujia"], guide: "encendido/diagnosticar-encendido.html" },
  { key: ["p035", "coil", "bobina"], guide: "encendido/fallas-en-bobinas.html" },

  // Combustible
  { key: ["bomba", "gasolina", "inyeccion", "p02", "ralenti pobre"], guide: "combustible/diagnosticar-combustible.html" },

  // Enfriamiento
  { key: ["se calienta", "sobrecalent", "antifreeze", "refrigerante"], guide: "enfriamiento/diagnosticar-enfriamiento.html" },

  // Escape
  { key: ["p0420", "catalizador", "azufre", "escape"], guide: "escape/diagnosticar-escape.html" },

  // Sensores
  { key: ["maf", "map", "ckp", "cmp", "sensor", "p010", "p011", "p033", "p034"], guide: "sensores/diagnosticar-sensores.html" },

  // OBD2 Avanzado
  { key: ["p0", "p1", "p2", "p3"], guide: "obd2/interpretar-codigos-obd2.html" }
];

// 🔗 URL BASE DE TU BLOG
const BLOG_BASE = "https://fixmycar-ai-three.vercel.app/blog/posts/";

// =============================================
// Función para detectar qué guía corresponde
// =============================================
function detectGuide(symptoms) {
  const text = symptoms.toLowerCase();
  for (const entry of GUIDE_MAP) {
    if (entry.key.some(k => text.includes(k))) {
      return entry.guide;
    }
  }
  return null; // Si no encuentra, deja que la IA responda sin guía
}

// =============================================
// API Handler – diagnóstico PRO
// =============================================
export async function POST(req) {
  try {
    const { message } = await req.json();
    if (!message) {
      return new Response(JSON.stringify({ error: "No symptoms provided" }), { status: 400 });
    }

    // 1️⃣ Detectar guía
    const guidePath = detectGuide(message);
    let guideContent = "";

    if (guidePath) {
      const url = BLOG_BASE + guidePath;

      try {
        const res = await fetch(url);
        guideContent = await res.text();
      } catch (err) {
        console.error("Error fetching guide:", err);
      }
    }

    // 2️⃣ Llamada al modelo con guía incluida
    const prompt = `
Eres FixMyCarAI PRO, un asistente de diagnóstico automotriz experto.
Analiza los síntomas y devuelve:

1. Posibles causas (muy precisas)
2. Acciones recomendadas
3. Qué revisar primero
4. Probabilidad aproximada de cada causa
5. SI HAY una guía relevante, úsala como fuente técnica obligatoria.

Guía técnica cargada:
${guideContent || "No relevant guide found"}

Síntomas del usuario:
${message}
    `;

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.2,
      messages: [{ role: "user", content: prompt }]
    });

    return Response.json({ reply: completion.choices[0].message.content });

  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: "Server error" }), { status: 500 });
  }
}
