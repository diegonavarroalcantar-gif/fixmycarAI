// ============================
// FixMyCarAI - frontend simple
// ============================

const chatBox = document.getElementById("chat");
const analyzeBtn = document.getElementById("analyzeBtn");

function addMessage(sender, html) {
  const msg = document.createElement("div");
  msg.className = sender === "user" ? "msg-user" : "msg-bot";
  msg.innerHTML = html;
  chatBox.appendChild(msg);
  chatBox.scrollTop = chatBox.scrollHeight;
}

analyzeBtn.addEventListener("click", async () => {
  const vehicle = document.getElementById("vehicle").value.trim();
  const message = document.getElementById("message").value.trim();

  if (!message) {
    alert("Describe los síntomas del vehículo.");
    return;
  }

  addMessage(
    "user",
    `<strong>Vehículo:</strong> ${vehicle || "(no especificado)"}<br><strong>Síntomas:</strong> ${message}`
  );

  addMessage("bot", "🔎 Analizando... por favor espera unos segundos.");

  try {
    const res = await fetch("/api/diagnose", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message })
    });

    if (!res.ok) {
      addMessage(
        "bot",
        `⚠️ No pude conectar con el servidor (error ${res.status}). Intenta nuevamente más tarde.`
      );
      return;
    }

    const data = await res.json();

    let text = "";

    if (Array.isArray(data.hypotheses) && data.hypotheses.length) {
      text +=
        "<strong>Posibles causas:</strong><br>• " +
        data.hypotheses.join("<br>• ") +
        "<br><br>";
    }

    if (Array.isArray(data.actions) && data.actions.length) {
      text +=
        "<strong>Acciones recomendadas:</strong><br>• " +
        data.actions.join("<br>• ") +
        "<br><br>";
    }

    if (Array.isArray(data.common_failures) && data.common_failures.length) {
      text +=
        "<strong>Fallas comunes del modelo:</strong><br>• " +
        data.common_failures.join("<br>• ") +
        "<br><br>";
    }

    if (data.guide_url) {
      text +=
        `<strong>Guía recomendada:</strong><br>` +
        `<a href="${data.guide_url}" target="_blank" rel="noopener">Ver guía paso a paso</a><br><br>`;
    }

    if (Array.isArray(data.video_links) && data.video_links.length) {
      const linksHtml = data.video_links
        .map(
          (url, i) =>
            `<a href="${url}" target="_blank" rel="noopener">Video ${i + 1}</a>`
        )
        .join("<br>");
      text += `<strong>Videos recomendados:</strong><br>${linksHtml}<br><br>`;
    }

    if (!text) {
      text =
        "No pude generar un diagnóstico estructurado, intenta describir con más detalle el problema.";
    }

    addMessage("bot", text);
  } catch (err) {
    console.error(err);
    addMessage(
      "bot",
      "⚠️ Ocurrió un error inesperado conectando con FixMyCarAI. Inténtalo otra vez."
    );
  }
});
