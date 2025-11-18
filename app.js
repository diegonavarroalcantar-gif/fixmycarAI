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
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ message: symptoms })
    });

    const data = await res.json();

    let botMessage = "";

    // ---------------------------
    // Caso 1: respuesta completa JSON (diagnóstico estructurado)
    // ---------------------------
    if (data.hypotheses || data.actions || data.profeco_alert) {
      botMessage += "<strong>Posibles causas:</strong><br>";
      (data.hypotheses || []).forEach(h => botMessage += "• " + h + "<br>");

      botMessage += "<br><strong>Acciones recomendadas:</strong><br>";
      (data.actions || []).forEach(a => botMessage += "• " + a + "<br>");

      if (data.profeco_alert) {
        botMessage += `<br><strong>Alerta PROFECO:</strong><br>${data.profeco_alert}<br>`;
      }
    }

    // ---------------------------
    // Caso 2: respuesta cruda desde diagnose.js (raw)
    // ---------------------------
    else if (data.raw) {
      botMessage = data.raw;
    }

    // ---------------------------
    // Caso 3: respuesta con .reply
    // ---------------------------
    else if (data.reply) {
      botMessage = data.reply;
    }

    // ---------------------------
    // Caso 4: cualquier otra cosa
    // ---------------------------
    else {
      botMessage = JSON.stringify(data, null, 2);
    }

    addMessage("bot", botMessage);

  } catch (error) {
    addMessage("bot", "⚠️ Error conectando al servidor. Inténtalo de nuevo.");
  }
});
