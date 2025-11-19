export const config = {
  runtime: "edge",
};

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

const guides = [
  { id: 1, keywords: ["bobina", "cop", "chispa", "coil"], title: "Cómo cambiar bobina COP", slug: "cambiar-bobina-cop" },
  { id: 2, keywords: ["bujia", "bujías", "misfire", "p030"], title: "Cómo cambiar bujías", slug: "cambiar-bujias" },
  { id: 3, keywords: ["filtro gasolina", "no tiene fuerza", "se apaga", "fuel filter"], title: "Cambiar filtro de gasolina", slug: "cambiar-filtro-gasolina" },
  { id: 4, keywords: ["ckp", "cmp", "sensor cigüeñal", "arbol levas", "p033", "p034"], title: "Cambiar sensor CKP/CMP", slug: "cambiar-sensor-ckp-cmp" },
  { id: 5, keywords: ["tps", "acelerador", "sensor posición", "tironea"], title: "Cambiar sensor TPS", slug: "cambiar-sensor-tps" },
  { id: 6, keywords: ["termostato", "temperatura", "sobrecalienta"], title: "Cambiar termostato", slug: "cambiar-termostato" },
  { id: 7, keywords: ["bomba gasolina", "fuel pump", "presión", "no arranca"], title: "Diagnóstico bomba de gasolina", slug: "diagnostico-bomba-gasolina" },
  { id: 8, keywords: ["obd2", "codigo", "p0", "scanner", "dtc"], title: "Diagnóstico OBD2", slug: "diagnostico-obd2" },
  { id: 9, keywords: ["ralenti", "ralentí", "se acelera", "cuerpo aceleración"], title: "Limpiar cuerpo de aceleración", slug: "limpiar-cuerpo-aceleracion" },
  { id: 10, keywords: ["maf", "sensor maf", "aire", "mass air flow"], title: "Limpiar sensor MAF", slug: "limpiar-sensor-maf" }
];

function rankGuides(symptoms) {
  const text = symptoms.toLowerCase();
  return guides
    .map(g => ({
      guide: g,
      score: g.keywords.reduce((acc, kw) => acc + (text.includes(kw) ? 1 : 0), 0)
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map(i => i.guide);
}

function youtubeQuery(txt) {
  return "https://www.youtube.com/results?search_query=" +
    encodeURIComponent("cómo reparar " + txt + " auto");
}

async function askOpenAI(prompt) {
  const body = {
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.4
  };

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });

  const data = await response.json();
  return data.choices[0].message.content;
}

export default async (req) => {
  try {
    const { symptoms } = await req.json();

    if (!symptoms) {
      return new Response(JSON.stringify({ error: "Debes enviar 'symptoms'." }), { status: 400 });
    }

    const recommended = rankGuides(symptoms);

    const prompt = `
Eres un mecánico profesional. Analiza este síntoma: "${symptoms}".
Entrega:
1. Posibles causas.
2. Pruebas de diagnóstico.
3. Qué revisar primero.
4. Solución paso a paso.
5. Nivel de urgencia.
`;

    const diagnosis = await askOpenAI(prompt);

    const result = {
      input: symptoms,
      diagnosis,
      youtube: youtubeQuery(symptoms),
      guides: recommended.map(g => ({
        id: g.id,
        title: g.title,
        url: `/blog/posts/${g.slug}.html`
      }))
    };

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
};
