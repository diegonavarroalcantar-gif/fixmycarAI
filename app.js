// ==========================
// FixMyCarAI - FRONTEND LOGIC
// ==========================

// Función para agregar mensajes al chat
function addMessage(sender, html) {
  const chat = document.getElementById("chat");
  const div = document.createElement("div");
  div.className = `message ${sender}`;
  div.innerHTML = `
    <div class="msg-title">${sender === "user" ? "Tú" : "FixMyCar AI"}</div>
    <div class="msg-body">${html}</div>
  `;
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
  addMessage(
    "user",
    `<strong>Vehículo:</strong> ${vin}<br><strong>Síntomas:</strong> ${symptoms}`
  );

  // Mostrar cargando
  addMessage("bot", "🔧 Analizando… por favor espera unos segundos.");

  try {
    const res = await fetch("/api/diagnose", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: symptoms })
    });

    const data = await res.json();

    // ---------------------------
    // Armamos la respuesta
    // ---------------------------

    let botMessage = "";

    // 1. Hipótesis
    if (data.hypotheses && data.hypotheses.length) {
      botMessage += `<strong>Posibles causas:</strong><br>`;
      data.hypotheses.forEach(h => botMessage += `• ${h}<br>`);
      botMessage += `<br>`;
    }

    // 2. Acciones
    if (data.actions && data.actions.length) {
      botMessage += `<strong>Acciones recomendadas:</strong><br>`;
      data.actions.forEach(a => botMessage += `• ${a}<br>`);
      botMessage += `<br>`;
    }

    // 3. Fallas comunes
    if (data.common_failures && data.common_failures.length) {
      botMessage += `<strong>Fallas comunes del modelo:</strong><br>`;
      data.common_failures.forEach(f => botMessage += `• ${f}<br>`);
      botMessage += `<br>`;
    }

    // 4. TSBs
    if (data.tsbs && data.tsbs.length) {
      botMessage += `<strong>Boletines técnicos (TSBs):</strong><br>`;
      data.tsbs.forEach(t => botMessage += `• ${t}<br>`);
      botMessage += `<br>`;
    }

    // 5. Recalls
    if (data.recalls && data.recalls.length) {
      botMessage += `<strong>Recalls del vehículo:</strong><br>`;
      data.recalls.forEach(r => botMessage += `• ${r}<br>`);
      botMessage += `<br>`;
    }

    // 6. NHTSA
    if (data.nhtsa_alerts && data.nhtsa_alerts.length) {
      botMessage += `<strong>Alertas NHTSA:</strong><br>`;
      data.nhtsa_alerts.forEach(n => botMessage += `• ${n}<br>`);
      botMessage += `<br>`;
    }

    // ============================
    // 7. GUÍAS DEL BLOG
    // ============================
    if (data.guides && data.guides.length) {
      botMessage += `<strong>Guías relacionadas:</strong><br>`;
      data.guides.forEach(g => {
        botMessage += `📘 <a href="${g.url}" target="_blank">${g.title}</a><br>`;
      });
      botMessage += `<br>`;
    }

    // ============================
    // 8. VIDEOS RECOMENDADOS
    // ============================
    if (data.videos && data.videos.length) {
      botMessage += `<strong>Videos recomendados:</strong><br>`;
      data.videos.forEach(v => {
        botMessage += `🎥 <a href="${v.url}" target="_blank">${v.title}</a><br>`;
      });
      botMessage += `<br>`;
    }

    // ============================
    // 9. HERRAMIENTAS / PARTES
    // ============================
    if (data.tools && data.tools.length) {
      botMessage += `<strong>Herramientas y refacciones recomendadas:</strong><br>`;
      data.tools.forEach(t => {
        botMessage += `🛠️ <a href="${t.url}" target="_blank">${t.name}</a><br>`;
      });
      botMessage += `<br>`;
    }

    addMessage("bot", botMessage);

  } catch (error) {
    addMessage("bot", "⚠️ Error conectando al servidor. Inténtalo de nuevo.");
  }
});
