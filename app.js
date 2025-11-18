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
      body: JSON.stringify({ vehicle, symptom })
    });
    const data = await res.json();
    if(res.ok) {
      // Expect JSON structure from the API
      const out = [];
      if(data.hypotheses && data.hypotheses.length){
        out.push('<strong>Hipótesis:</strong>');
        out.push('<ul>' + data.hypotheses.map(h=>`<li>${h}</li>`).join('') + '</ul>');
      }
      if(data.actions && data.actions.length){
        out.push('<strong>Acciones recomendadas:</strong>');
        out.push('<ol>' + data.actions.map(a=>`<li>${a}</li>`).join('') + '</ol>');
      }
      if(data.profeco_alert){
        out.push(`<div style="background:#2b2b2b;padding:8px;border-radius:6px;margin-top:8px"><strong>Alerta PROFECO:</strong> ${data.profeco_alert}</div>`);
      }
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
