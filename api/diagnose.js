import fetch from "node-fetch";

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(400).json({ error: "Método inválido" });
    }

    let body = "";

    await new Promise(resolve => {
      req.on("data", chunk => body += chunk);
      req.on("end", resolve);
    });

    const { symptoms } = JSON.parse(body || "{}");

    if (!symptoms) {
      return res.status(400).json({ error: "Debes enviar 'symptoms'." });
    }

    const prompt = `Eres un mecánico experto. Analiza los siguientes síntomas: ${symptoms}`;

    const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.4
      })
    });

    const data = await openaiRes.json();

    return res.status(200).json({
      diagnosis: data.choices[0].message.content,
      youtube: "https://www.youtube.com/results?search_query=" + encodeURIComponent(symptoms)
    });

  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
