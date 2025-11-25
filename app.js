// ==========================
// FixMyCarAI - FRONTEND
// ==========================

function addMessage(sender, html) {
  const chat = document.getElementById("chat");
  const div = document.createElement("div");
  div.className = `message ${sender}`;
  div.innerHTML = `
    <div class="msg-title">${sender === "user" ? "Tú" : "FixMyCar AI"}</div>
    <div>${html}</div>
  `;
  chat.appendChild(div);
  chat.scrollTop = chat.scrollHeight;
}

document.getElementById("diagnose-form").addEventListener("submit", async (e) => {
  e.preventDefault();

  const vehicle = document.getElementById("vehicle").value.trim();
  const symptoms = document.getElementById("symptoms").value.trim();

  if (!vehicle || !symptoms) {
    alert("Por favor indica vehículo y describe los síntomas.");
    return;
  }

  addMessage(
    "user",
    `<strong>Vehículo:</strong> ${vehicle}<br><strong>Síntomas:</strong> ${symptoms}`
  );

  const waitingId = `w_${Date.now()}`;
  addMessage("bot", `<span id="${waitingId}">🔧 Analizando... por favor espera unos segundos.</span>`);

  try {
    const res = await fetch("/api/diagnose", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ vehicle, message: symptoms }),
    });

    const data = await res.json();

    // Eliminamos el mensaje de "Analizando..."
    const span = document.getElementById(waitingId);
    if (span) span.parentElement.remove();

    let html = "";

    if (data.hypotheses && data.hypotheses.length) {
      html += "<strong>Posibles causas:</strong><br>";
      data.hypotheses.forEach((h) => {
        html += "• " + h + "<br>";
      });
      html += "<br>";
    }

    if (data.actions && data.actions.length) {
      html += "<strong>Acciones recomendadas:</strong><br>";
      data.actions.forEach((a) => {
        html += "• " + a + "<br>";
      });
      html += "<br>";
    }

    if (data.common_failures && data.common_failures.length) {
      html += "<strong>Fallas comunes del modelo:</strong><br>";
      data.common_failures.forEach((f) => {
        html += "• " + f + "<br>";
      });
      html += "<br>";
    }

    if (data.guide_url) {
      html += `<strong>Guía recomendada:</strong><br>
        <a href="${data.guide_url}" target="_blank">${data.guide_url}</a><br><br>`;
    }

    if (data.video_url) {
      html += `<strong>Videos relacionados en YouTube:</strong><br>
        <a href="${data.video_url}" target="_blank">${data.video_url}</a><br><br>`;
    }

    if (!html) {
      html = "No pude generar un diagnóstico estructurado, intenta describir con más detalle el problema.";
    }

    addMessage("bot", html);
  } catch (err) {
    const span = document.getElementById(waitingId);
    if (span) span.parentElement.remove();
    addMessage("bot", "⚠️ Error conectando al servidor. Inténtalo nuevamente.");
  }
});
