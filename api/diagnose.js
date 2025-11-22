import { OpenAI } from "openai";
import fetch from "node-fetch";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método no permitido" });
  }

  try {
    const { vehicle, symptoms, guidePath } = req.body;

    // Cargar guía técnica
    let guideContent = "";
    if (guidePath) {
      try {
        const guideUrl = `https://fixmycar-ai-three.vercel.app/${guidePath}`;
        const html = await (await fetch(guideUrl)).text();

        // limpiar HTML
        guideContent = html
          .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
          .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
          .replace(/<[^>]+>/g, " ")
          .replace(/\s+/g, " ")
          .trim();
      } catch (e) {
        guideContent = "";
      }
    }

    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const prompt = `
Eres FixMyCarAI, experto en diagnóstico automotriz.

Vehículo: ${vehicle}
Síntomas: ${symptoms}

Guía técnica relacionada:
${guideContent}

Genera JSON:
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
      messages: [{ role: "user", content: prompt }]
    });

    let outText = completion.choices[0].message.content;
    let parsed;

    try {
      parsed = JSON.parse(outText);
    } catch (error) {
      parsed = { raw: outText };
    }

    return res.status(200).json(parsed);

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
}
