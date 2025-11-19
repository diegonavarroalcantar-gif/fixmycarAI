// api/diagnose.js
// FixMyCar.ai – Diagnóstico con IA + Enlaces automáticos a guías/videos/herramientas

import OpenAI from "openai";

export const config = {
  runtime: "edge"
};

// ---------------------------------------------
// FUNCIÓN: MAPEOS AUTOMÁTICOS (guías / videos / herramientas)
// ---------------------------------------------
function getExtraContent(actions) {
  const guides = [];
  const videos = [];
  const tools = [];

  const text = actions.join(" ").toLowerCase();

  // ============================
  // 1) Bobinas COP
  // ============================
  if (
    text.includes("bobina") ||
    text.includes("cop") ||
    text.includes("ignición") ||
    text.includes("misfire")
  ) {
    guides.push({
      title: "Guía: Cómo cambiar una bobina COP",
      url: "/blog/posts/cambiar-bobina-cop.html"
    });

    videos.push({
      title: "Video: Cambiar bobinas COP (motor Tritón)",
      url: "https://www.youtube.com/watch?v=0slUo4NctEI"
    });

    tools.push(
      { name: "Bobina COP compatible Ford 5.4", url: "#" },
      { name: "Llave de 7mm", url: "#" },
      { name: "Escáner OBD2 recomendado", url: "#" }
    );
  }

  // ============================
  // 2) Bujías
  // ============================
  if (text.includes("bujía") || text.includes("bujias") || text.includes("spark")) {
    guides.push({
      title: "Guía: Cómo cambiar bujías",
      url: "/blog/posts/cambiar-bujias.html"
    });

    videos.push({
      title: "Video: Cómo cambiar bujías paso a paso",
      url: "https://www.youtube.com/watch?v=tP6gGgJU1vI"
    });

    tools.push(
      { name: "Juego de bujías compatibles", url: "#" },
      { name: "Dado para bujías", url: "#" },
      { name: "Grasa dieléctrica", url: "#" }
    );
  }

  return { guides, videos, tools };
}

// ---------------------------------------------
// API PRINCIPAL – MODELO DE DIAGNÓSTICO
// ---------------------------------------------
export default async function handler(req) {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const { message } = await req.json();

    if (!message) {
      return new Response(
        JSON.stringify({ error: "Faltan datos" }),
        { status: 400 }
      );
    }

    const client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });

    // 🔥 Prompt para diagnóstico estructurado
    const prompt = `
Eres FixMyCarAI, un experto en diagnóstico automotriz.

A partir de la descripción del usuario: "${message}"

Genera un JSON *EXCLUSIVAMENTE* con estas claves:

{
  "hypotheses": ["posible falla 1", "posible falla 2"],
  "actions": ["acción 1", "acción 2"],
  "common_failures": ["falla común del modelo"],
  "tsbs": ["boletín técnico relevante"],
  "recalls": ["recall relevante"],
  "nhtsa_alerts": ["alerta de seguridad NHTSA"]
}
    `;

    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3
    });

    const raw = response.choices[0].message.content;
    let parsed;

    try {
      parsed = JSON.parse(raw);
    } catch (e) {
      parsed = {
        hypotheses: [],
        actions: [],
        common_failures: [],
        tsbs: [],
        recalls: [],
        nhtsa_alerts: [],
        raw
      };
    }

    // Asegurar arrays
    const hypotheses = parsed.hypotheses || [];
    const actions = parsed.actions || [];
    const common_failures = parsed.common_failures || [];
    const tsbs = parsed.tsbs || [];
    const recalls = parsed.recalls || [];
    const nhtsa_alerts = parsed.nhtsa_alerts || [];

    // Obtener contenido extra (guías/videos/herramientas)
    const extra = getExtraContent(actions);

    // Respuesta final unificada
    return Response.json({
      hypotheses,
      actions,
      common_failures,
      tsbs,
      recalls,
      nhtsa_alerts,
      guides: extra.guides,
      videos: extra.videos,
      tools: extra.tools
    });

  } catch (err) {
    return new Response(
      JSON.stringify({ error: "Server error", details: err.message }),
      { status: 500 }
    );
  }
}
