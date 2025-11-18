// ==========================
// FixMyCarAI - FRONTEND LOGIC
// ==========================

// Función para agregar mensajes al chat
function addMessage(sender, text) {
  const chat = document.getElementById("chat");
  const div = document.createElement("div");
  div.className = `message ${sender}`;
  div.innerHTML = `<div class="msg-title">${sender === "user" ? "Tú" : "FixMyCar AI"}</div><div>${text}</div>`;
  chat.appendChild(div);
  chat.scrollTop = chat.scrollHeight;
}

// Manejo del formulario
document.getElementById("diagnose-form").addEventListener("submit", async (e) => {
  e.preventDefault();

  const vin = document.getElementById("vin").value.trim();
  const symptoms = document.getElementById("symptoms").value.trim();

  if (!vin || !symptoms) {
    alert("Ingresa vehículo y síntomas");
    return;
  }

  // Mensaje del usuario
  addMessage("user", `<strong>Vehículo:</strong> ${vin}<br><strong>Síntomas:</strong> ${symptoms}`);

  // Mostrar cargando
  addMessage("bot", "Analizando… por favor espera 3–5 segundos.");

  try {
    const res = await fetch("/api/diagnose", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: symptoms, vin })
    });

    const data = await res.json();
    let botMessage = "";

    // ---------------------------
    // RESPUESTA COMPLETA JSON
    // ---------------------------
    if (data.hypotheses || data.actions) {

      botMessage += "<strong>Posibles causas:</strong><br>";
      (data.hypotheses || []).forEach(h => botMessage += "• " + h + "<br>");

      botMessage += "<br><strong>Acciones recomendadas:</strong><br>";
      (data.actions || []).forEach(a => botMessage += "• " + a + "<br>");

      botMessage += "<br><strong>Fallas comunes del modelo:</strong><br>";
      (data.common_failures || []).forEach(f => botMessage += "• " + f + "<br>");

      botMessage += "<br><strong>Boletines técnicos (TSBs):</strong><br>";
      (data.tsbs || []).forEach(t => botMessage += "• " + t + "<br>");

      botMessage += "<br><strong>Recalls del vehículo:</strong><br>";
      (data.recalls || []).forEach(r => botMessage += "• " + r + "<br>");

      botMessage += "<br><strong>Alertas NHTSA:</strong><br>";
      (data.nhtsa_alerts || []).forEach(n => botMessage += "• " + n + "<br>");

      if (data.profeco_alert) {
        botMessage += `<br><strong>PROFECO:</strong><br>${data.profeco_alert}<br>`;
      }
    }

    // RAW fallback
    else if (data.raw) {
      botMessage = data.raw;
    }

    // ANY fallback
    else {
      botMessage = JSON.stringify(data, null, 2);
    }

    addMessage("bot", botMessage);

  } catch (error) {
    addMessage("bot", "⚠️ Error conectando al servidor. Inténtalo de nuevo.");
  }
});
