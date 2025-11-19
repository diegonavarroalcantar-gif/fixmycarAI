document.getElementById("analyzeBtn").addEventListener("click", async () => {
  const symptoms = document.getElementById("symptoms").value.trim();

  if (!symptoms) {
    alert("Describe los síntomas del vehículo.");
    return;
  }

  document.getElementById("result").innerHTML = "<p>Analizando...</p>";

  try {
    const response = await fetch("/api/diagnose", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ symptoms: symptoms })
    });

    const text = await response.text();

    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      document.getElementById("result").innerHTML =
        "<p>Error: Respuesta inválida del servidor.</p>";
      console.error("Respuesta recibida:", text);
      return;
    }

    if (data.error) {
      document.getElementById("result").innerHTML =
        "<p>Error: " + data.error + "</p>";
      return;
    }

    let html = `
      <h2>Diagnóstico</h2>
      <p>${data.diagnosis}</p>

      <h3>Videos recomendados</h3>
      <a href="${data.youtube}" target="_blank">Ver en YouTube</a>

      <h3>Guías recomendadas</h3>
      <ul>
    `;

    data.guides.forEach(g => {
      html += `<li><a href="${g.url}" target="_blank">${g.title}</a></li>`;
    });

    html += "</ul>";

    document.getElementById("result").innerHTML = html;

  } catch (err) {
    console.error(err);
    document.getElementById("result").innerHTML =
      "<p>Error procesando el diagnóstico.</p>";
  }
});
