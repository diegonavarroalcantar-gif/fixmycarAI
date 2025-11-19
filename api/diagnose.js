// api/diagnose.js
// TOTALMENTE COMPATIBLE CON VERCEL EDGE

export const config = {
  runtime: "edge"
};

// ---------------------------------------------
// MAPEOS AUTOMÁTICOS (guías / videos / herramientas)
// ---------------------------------------------
function getExtraContent(actions) {
  const guides = [];
  const videos = [];
  const tools = [];

  const text = actions.join(" ").toLowerCase();

  // Bobinas COP
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

  // Bujías
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
// API PRINCIPAL — LLAMADA A OPENAI SIN SDK
// ---------------------------------------------
export default async function handler(req) {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const { message } = await req.json();
    if (!message) {
      return Response.json({ error: "Faltan datos" }, { status: 400 });
    }

    const prompt = `
Eres FixMyCarAI, un experto en diagnóstico automotriz.

A partir de: "${message}"

Genera SOLO este JSON:

{
  "hypotheses": ["posible falla 1", "posible falla 2"],
  "actions": ["acción 1", "acción 2"],
  "common_failures": ["falla común"],
  "tsbs": ["boletín técnico"],
  "recalls": ["recall"],
  "nhtsa_alerts": ["alerta"]
}
`;

    // -------------- LLAMADA API OPENAI (EDGE SAFE) --------------
    const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.3
      })
    });

    const data = await openaiRes.json();
    const raw = data.choices?.[0]?.message?.content || "{}";

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

    const hypotheses = parsed.hypotheses || [];
    const actions = parsed.actions || [];
    const common_failures = parsed.common_failures || [];
    const tsbs = parsed.tsbs || [];
    const recalls = parsed.recalls || [];
    const nhtsa_alerts = parsed.nhtsa_alerts || [];

    const extra = getExtraContent(actions);

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
    return Response.json(
      { error: "Server error", details: err.message },
      { status: 500 }
    );
  }
}
