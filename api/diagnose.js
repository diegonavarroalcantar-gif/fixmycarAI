// api/diagnose.js (Vercel - Node serverless)
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const { message } = req.body || {};
    if (!message) return res.status(400).json({ error: 'message required' });

    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
    if (!OPENAI_API_KEY) return res.status(500).json({ error: 'OpenAI key not configured' });

    const prompt = `Eres FixMyCarAI, un asistente experto en diagnóstico automotriz. Usuario: "${message}"\nDevuelve JSON con: hypotheses (array de strings), actions (array de strings), profeco_alert (string|null).`;

    const resp = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'Eres un asistente técnico automotriz. Responde sólo con JSON cuando se solicita.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.1,
        max_tokens: 500
      })
    });

    if (!resp.ok) {
      const txt = await resp.text();
      console.error('OpenAI error', resp.status, txt);
      return res.status(502).json({ error: 'OpenAI API error', detail: txt });
    }

    const data = await resp.json();
    const text = data.choices?.[0]?.message?.content || '';

    // Intento de parsear JSON desde la respuesta del modelo
    let parsed = { hypotheses: [], actions: [], profeco_alert: null };
    try {
      parsed = JSON.parse(text);
    } catch (err) {
      // Si no es JSON válido, retornamos el texto crudo para depuración
      return res.status(200).json({ raw: text });
    }

    return res.status(200).json(parsed);
  } catch (err) {
    console.error('handler error', err);
    return res.status(500).json({ error: 'Server error', detail: err.message });
  }
}
