// ---------------------------
// Caso 1: respuesta completa JSON (diagnóstico extendido)
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
