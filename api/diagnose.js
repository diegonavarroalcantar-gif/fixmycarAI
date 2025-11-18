export const config = {
  runtime: "edge",
};

export default async function handler(req) {
  try {
    const { message } = await req.json();

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "API key missing in environment variables" }),
        { status: 500 }
      );
    }

    const prompt = `
Eres FixMyCarAI, un asistente experto en diagnóstico automotriz basado en síntomas.
El usuario describe una falla y tú:

1. Identificas causas probables
2. Propones el diagnóstico más lógico
3. Explicas pasos para confirmar el diagnóstico
4. Sugieres reparaciones que NO pongan en riesgo al usuario
5. Aclaras siempre que no eres responsable si intentan reparar solos
6. Si es una falla común de PROFECO, menciónalo

Síntoma del usuario:
"${message}"
    `;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 400,
      }),
    });

    const data = await response.json();

    return new Response(JSON.stringify({ reply: data.choices[0].message.content }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500 }
    );
  }
}
