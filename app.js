const chatBox = document.getElementById("chat");
const analyzeBtn = document.getElementById("analyzeBtn");

function addMessage(sender, text) {
  const msg = document.createElement("div");
  msg.className = sender;
  msg.innerHTML = `<p>${text.replace(/\n/g, "<br>")}</p>`;
  chatBox.appendChild(msg);
  chatBox.scrollTop = chatBox.scrollHeight;
}

analyzeBtn.addEventListener("click", async () => {
  const vehicle = document.getElementById("vehicle").value;
  const message = document.getElementById("message").value;

  addMessage("user", `<strong>Vehículo:</strong> ${vehicle}<br><strong>Síntomas:</strong> ${message}`);

  addMessage("ai", `🔧 Analizando... por favor espera unos segundos.`);

  const res = await fetch("/api/diagnose", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message })
  });

  const data = await res.json();

  let text = "";

  if (data.hypotheses) {
    text += `<strong>Posibles causas:</strong><br>• ${data.hypotheses.join("<br>• ")}<br><br>`;
  }

  if (data.actions) {
    text += `<strong>Acciones recomendadas:</strong><br>• ${data.actions.join("<br>• ")}<br><br>`;
  }

  if (data.common_failures) {
    text += `<strong>Fallas comunes del modelo:</strong><br>• ${data.common_failures.join("<br>• ")}`;
  }

  addMessage("ai", text);
});
