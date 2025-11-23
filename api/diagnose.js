// ======================================
// FixMyCarAI – diagnose.js FINAL
// TOTALMENTE COMPATIBLE CON TU FRONTEND
// ======================================

import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Guías en GitHub RAW
const RAW_BASE = "https://raw.githubusercontent.com/diegonavarroalcantar-gif/fixmycarAI/main/blog/posts/";

const GUIDE_MAP = [
  { key: ["transmision", "patina", "patea", "slip"], guide: "transmision/diagnosticar-transmision.html" }
];

function detectGuide(text) {
  text = (text || "").toLowerCase();
  for (const g of GUIDE_MAP) {
    if (g.key.some(k => text.includes(k))) return g.guide;
  }
  return null;
}

export default async function handler(req, res) {
  if (req.method !== "POST")
    return res.status(405).json({ error: "Method not allowed" });

  try {
    const symptoms = req.body?.message || "";

    // Detectar guía
    let guideContent = "";
    const guide = detectGuide(symptoms);

    if (guide) {
      try {
        const url = RAW_BASE + guide;
        const r = await fetch(url);
        const html = await r.text();
        guideContent = html
          .replace(/<[^>]*>/g, " ")
          .replace(/\s+/g, " ")
          .trim();
      } catch {}
    }

    const prompt = `
Eres FixMyCarAI, experto en diagnóstico automotriz.

Síntomas:
${symptoms}

Guía técnica:
${guideContent || "No disponible"}

Devuelve SOLO JSON así:

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
      temperature: 0.1,
      messages: [{ role: "user", content: prompt }]
    });

    const raw = completion.choices[0].message.content || "";
    let out;

    try {
      out = JSON.parse(raw);
    } catch {
      out = { raw };
    }

    return res.status(200).json(out);

  } catch (e) {
    return res.status(500).json({ error: "server_error" });
  }
}
