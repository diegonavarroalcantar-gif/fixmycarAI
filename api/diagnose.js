// api/diagnose.js
// FixMyCarAI – Diagnóstico con IA + Guías del blog + Videos + Herramientas
// Compatible con Vercel Edge (sin SDK)

export const config = {
  runtime: "edge"
};

// ---------------------------------------------
// MAPEOS AUTOMÁTICOS (Guías / Videos / Herramientas)
// ---------------------------------------------
function getExtraContent(originalMessage, hypotheses, actions, failureTags) {
  const guides = [];
  const videos = [];
  const tools = [];

  const parts = [];
  if (originalMessage) parts.push(originalMessage);
  (hypotheses || []).forEach(h => parts.push(h));
  (actions || []).forEach(a => parts.push(a));
  (failureTags || []).forEach(t => parts.push(t));

  const text = parts.join(" ").toLowerCase();

  const already = {
    guideUrls: new Set(),
    videoUrls: new Set()
  };

  const addGuide = (title, url) => {
    if (!already.guideUrls.has(url)) {
      guides.push({ title, url });
      already.guideUrls.add(url);
    }
  };

  const addVideo = (title, url) => {
    if (!already.videoUrls.has(url)) {
      videos.push({ title, url });
      already.videoUrls.add(url);
    }
  };

  const addTool = (name, url = "#") => {
    tools.push({ name, url });
  };

  // 1) Bobina COP
  if (
    text.includes("bobina") ||
    text.includes("coil on plug") ||
    text.includes("cop") ||
    text.includes("misfire") ||
    text.includes("ignición") ||
    text.includes("ignicion")
  ) {
    addGuide("Guía: Cómo cambiar una bobina COP", "/blog/posts/cambiar-bobina-cop.html");
    addVideo("Video: Cambiar bobinas COP en motor Tritón", "https://www.youtube.com/watch?v=0slUo4NctEI");
    addTool("Bobina COP compatible (Amazon)");
    addTool("Llave de 7mm");
    addTool("Escáner OBD2 recomendado");
  }

  // 2) Bujías
  if (
    text.includes("bujía") ||
    text.includes("bujia") ||
    text.includes("bujías") ||
    text.includes("bujias") ||
    text.includes("spark plug")
  ) {
    addGuide("Guía: Cómo cambiar bujías", "/blog/posts/cambiar-bujias.html");
    addVideo("Video: Cambiar bujías paso a paso", "https://www.youtube.com/watch?v=tP6gGgJU1vI");
    addTool("Juego de bujías compatibles (Amazon)");
    addTool("Dado para bujías");
    addTool("Grasa dieléctrica");
  }

  // 3) Cuerpo de aceleración
  if (
    text.includes("cuerpo de aceleración") ||
    text.includes("cuerpo de aceleracion") ||
    text.includes("ralentí inestable") ||
    text.includes("ralenti inestable")
  ) {
    addGuide("Guía: Cómo limpiar el cuerpo de aceleración", "/blog/posts/limpiar-cuerpo-aceleracion.html");
    addVideo("Video: Limpiar cuerpo de aceleración", "https://www.youtube.com/watch?v=GHN9z3ARS0k");
    addTool("Limpiador de cuerpo de aceleración (Amazon)");
    addTool("Juego básico de dados");
  }

  // 4) Sensor MAF
  if (
    text.includes("maf") ||
    text.includes("sensor maf") ||
    text.includes("flujo de aire") ||
    text.includes("p0100") ||
    text.includes("p0101") ||
    text.includes("p0102") ||
    text.includes("p0103") ||
    text.includes("p0171") ||
    text.includes("p0174")
  ) {
    addGuide("Guía: Cómo limpiar el sensor MAF", "/blog/posts/limpiar-sensor-maf.html");
    addVideo("Video: Cómo limpiar el sensor MAF", "https://www.youtube.com/watch?v=bF9dWl1Ff6I");
    addTool("Limpiador MAF (Amazon)");
    addTool("Juego de desarmadores Torx");
  }

  // 5) Sensor TPS
  if (
    text.includes("tps") ||
    text.includes("sensor de posición del acelerador") ||
    text.includes("sensor de posicion del acelerador") ||
    text.includes("p0120") ||
    text.includes("p0121") ||
    text.includes("p0122") ||
    text.includes("p0123") ||
    text.includes("p2135")
  ) {
    addGuide("Guía: Cómo cambiar el sensor TPS", "/blog/posts/cambiar-sensor-tps.html");
    addVideo("Video: Reemplazar y calibrar sensor TPS", "https://www.youtube.com/watch?v=bUqWKK3iLZI");
    addTool("Sensor TPS compatible");
    addTool("Juego de puntas Torx");
  }

  // 6) Sensor CKP / CMP
  if (
    text.includes("ckp") ||
    text.includes("cmp") ||
    text.includes("sensor cigüeñal") ||
    text.includes("sensor cigueñal") ||
    text.includes("sensor de cigüeñal") ||
    text.includes("sensor de cigueñal") ||
    text.includes("sensor árbol de levas") ||
    text.includes("sensor arbol de levas") ||
    text.includes("p0335") ||
    text.includes("p0336") ||
    text.includes("p0340") ||
    text.includes("p0344") ||
    text.includes("p0339")
  ) {
    addGuide("Guía: Cambiar sensor CKP / CMP", "/blog/posts/cambiar-sensor-ckp-cmp.html");
    addVideo("Video: Cambiar sensor CKP/CMP", "https://www.youtube.com/watch?v=9AIhR-j6KCw");
    addTool("Sensor CKP compatible");
    addTool("Sensor CMP compatible");
    addTool("Juego de dados 1/4 y 3/8");
  }

  // 7) Termostato
  if (
    text.includes("termostato") ||
    text.includes("sobrecalent") ||
    text.includes("temperatura alta") ||
    text.includes("se calienta")
  ) {
    addGuide("Guía: Cómo cambiar el termostato", "/blog/posts/cambiar-termostato.html");
    addVideo("Video: Cambiar termostato correctamente", "https://www.youtube.com/watch?v=Tcf80FkZ5cI");
    addTool("Termostato compatible");
    addTool("Anticongelante");
  }

  // 8) Filtro de gasolina
  if (
    text.includes("filtro de gasolina") ||
    text.includes("filtro gasolina") ||
    text.includes("filtro de combustible") ||
    text.includes("filtro combustible")
  ) {
    addGuide("Guía: Cómo cambiar el filtro de gasolina", "/blog/posts/cambiar-filtro-gasolina.html");
    addVideo("Video: Cambiar filtro de gasolina", "https://www.youtube.com/watch?v=3YzI6FfA0Ug");
    addTool("Filtro de gasolina compatible");
    addTool("Desconectores de líneas de combustible");
  }

  // 9) Bomba de gasolina
  if (
    text.includes("bomba de gasolina") ||
    text.includes("bomba gasolina") ||
    text.includes("se apaga en carretera") ||
    text.includes("perdida de potencia") ||
    text.includes("p0087") ||
    text.includes("p0191")
  ) {
    addGuide("Guía: Diagnóstico de bomba de gasolina", "/blog/posts/diagnostico-bomba-gasolina.html");
    addVideo("Video: Diagnóstico de bomba de gasolina", "https://www.youtube.com/watch?v=bPuA8yK7c6Q");
    addTool("Bomba de gasolina compatible");
    addTool("Manómetro de presión de combustible");
  }

  // 10) Diagnóstico OBD2
  if (
    text.includes("obd2") ||
    text.includes("escáner") ||
    text.includes("escaner") ||
    text.includes("scanner") ||
    text.includes("check engine") ||
    text.includes("código") ||
    text.includes("codigo")
  ) {
    addGuide("Guía: Diagnóstico básico con OBD2", "/blog/posts/diagnostico-obd2.html");
    addVideo("Video: Cómo usar un escáner OBD2", "https://www.youtube.com/watch?v=qX5xZ0M3H8U");
    addTool("Escáner OBD2 Bluetooth");
    addTool("Escáner OBD2 profesional");
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

Usuario describe el problema así:
"${message}"

Debes responder EXCLUSIVAMENTE con un JSON válido (sin comentarios, sin texto extra) con esta estructura:

{
  "hypotheses": ["posible falla 1", "posible falla 2"],
  "actions": ["acción 1", "acción 2"],
  "common_failures": ["falla común del modelo (si se conoce)"],
  "tsbs": ["boletín técnico relevante (si se conoce)"],
  "recalls": ["campaña o recall relevante (si se conoce)"],
  "nhtsa_alerts": ["alerta de seguridad relevante (si se conoce)"],
  "failure_tags": ["palabras clave cortas de la falla principal, como: 'bujias', 'bobina', 'sensor maf', 'cuerpo aceleracion', 'sensor tps', 'sensor ckp', 'bomba gasolina', 'filtro gasolina', 'termostato', 'obd2'"]
}

Si desconoces algún dato, deja ese arreglo en [].
`;

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

    if (!openaiRes.ok) {
      const errText = await openaiRes.text();
      return Response.json(
        { error: "Error desde OpenAI", details: errText },
        { status: 500 }
      );
    }

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
        failure_tags: [],
        raw
      };
    }

    const hypotheses = parsed.hypotheses || [];
    const actions = parsed.actions || [];
    const common_failures = parsed.common_failures || [];
    const tsbs = parsed.tsbs || [];
    const recalls = parsed.recalls || [];
    const nhtsa_alerts = parsed.nhtsa_alerts || [];
    const failure_tags = parsed.failure_tags || [];

    const extra = getExtraContent(message, hypotheses, actions, failure_tags);

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
