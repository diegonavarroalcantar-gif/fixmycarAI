// api/diagnose.js - Vercel Serverless function (Node)
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { vehicle, symptom } = req.body || {};
  if (!vehicle || !symptom) return res.status(400).json({ error: 'vehicle and symptom required' });

  const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
  if (!OPENAI_API_KEY) return res.status(500).json({ error: 'OpenAI key not configured' });

  try {
    // Build a focused system prompt for automotive diagnostics
    const systemPrompt = `Eres un asistente técnico automotriz experto. Cuando el usuario provea "vehicle" y "symptom", responde en JSON con las claves: hypotheses (array de strings), actions (array de strings), profeco_alert (string o null). Mantén las respuestas breves y accionables. No des pasos peligrosos para usuarios sin experiencia; incluye avisos.`;

    const userPrompt = `Vehicle: ${vehicle}\nSymptom: ${symptom}\n\nDevuelve JSON con: hypotheses (máx 5), actions (máx 6 pasos accionables), profeco_alert (null si no aplica).`;

    const payload = {
      model: 'gpt-4o-mini', // si prefieres otro modelo, cámbialo en Vercel.
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.1,
      max_tokens: 600
    };

    const resp = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type':'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify(payload)
    });

    if (!resp.ok) {
      const txt = await resp.text();
      console.error('OpenAI error', resp.status, txt);
      return res.status(502).json({ error: 'OpenAI API error' });
    }

    const j = await resp.json();
    // The assistant should return a JSON string; try to parse it.
    const assistantText = j.choices?.[0]?.message?.content || '';
    let parsed = { hypotheses: [], actions: [], profeco_alert: null };

    try {
      // Some models already return JSON; try parse
      parsed = JSON.parse(assistantText);
    } catch (err) {
      // If not valid JSON, attempt to extract lines heuristically
      const lines = assistantText.split('\n').map(l=>l.trim()).filter(Boolean);
      // fallback parsing (best-effort)
      parsed.hypotheses = lines.filter(l=>l.toLowerCase().startsWith('-') || l.match(/hipótesis|hypothesis|cause/i)).slice(0,5).map(l=>l.replace(/^-+\s*/,''));
      parsed.actions = lines.filter(l=>l.match(/^\d+\.|\- /)).slice(0,6).map(l=>l.replace(/^\d+\.?\s*/,'').replace(/^-+\s*/,''));
      parsed.profeco_alert = null;
    }

    return res.status(200).json(parsed);
  } catch (e) {
    console.error('handler error', e);
    return res.status(500).json({ error: 'Server error' });
  }
}
