// app.js - frontend light
const chat = document.getElementById('chat');
const form = document.getElementById('inputForm');
const vehicleInput = document.getElementById('vehicle');
const symptomInput = document.getElementById('symptom');

function appendMessage(text, who='bot', meta='') {
  const el = document.createElement('div');
  el.className = 'message ' + (who==='bot' ? 'bot' : 'user');
  el.innerHTML = `<div class="msg-title">${who==='bot' ? 'FixMyCar AI' : 'Tú'}</div>
                  <div style="margin-top:6px">${text}</div>
                  ${meta ? `<div class="msg-sub" style="margin-top:8px">${meta}</div>` : ''}`;
  chat.appendChild(el);
  chat.scrollTop = chat.scrollHeight;
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const vehicle = vehicleInput.value.trim();
  const symptom = symptomInput.value.trim();
  if(!vehicle || !symptom) return;
  appendMessage(`<strong>${vehicle}</strong><br/>${symptom}`, 'user');
  appendMessage('Analizando... esto puede tardar unos segundos.', 'bot');

  try {
    const res = await fetch('/api/diagnose', {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
     body: JSON.stringify({ message: symptom })

    });
    const data = await res.json();

// Maneja varios formatos de respuesta del backend:
let botMessage = "";

// Caso 1: JSON estructurado desde diagnose.js
if (data.hypotheses || data.actions || data.profeco_alert) {
  botMessage += "<strong>Posibles causas:</strong><br>";
  (data.hypotheses || []).forEach(h => botMessage += "• " + h + "<br>");

  botMessage += "<br><strong>Acciones recomendadas:</strong><br>";
  (data.actions || []).forEach(a => botMessage += "• " + a + "<br>");

  if (data.profeco_alert) {
    botMessage += "<br><strong>Alerta PROFECO:</strong><br>" + data.profeco_alert + "<br>";
  }
}

// Caso 2: Si el modelo envió RAW texto
else if (data.raw) {
  botMessage = data.raw;
}

// Caso 3: Si solo hay 'reply'
else if (data.reply) {
  botMessage = data.reply;
}

// Caso 4: Si nada coincide, mostrar todo el JSON
else {
  botMessage = JSON.stringify(data, null, 2);
}

// Insertar en pantalla
addMessage("bot", botMessage);

      appendMessage(out.join(''), 'bot');
    } else {
      appendMessage('Error en el servidor: ' + (data.error || res.statusText), 'bot');
    }
  } catch(err){
    appendMessage('No fue posible conectar con el servicio. Revisa tu conexión o intenta de nuevo.', 'bot');
    console.error(err);
  }
  vehicleInput.value = ''; symptomInput.value = '';
});
