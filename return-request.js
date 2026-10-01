(() => {
  const form = document.getElementById('return-form');
  if (!form) return;
  const feedback = document.getElementById('return-feedback');
  const submit = form.querySelector('button[type="submit"]');
  let requestId = crypto.randomUUID();
  let attempted = null;
  let receiptUrl = null;
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    const data = Object.fromEntries(new FormData(form));
    const fingerprint = JSON.stringify(data);
    if (attempted !== null && attempted !== fingerprint) requestId = crypto.randomUUID();
    attempted = fingerprint;
    submit.disabled = true;
    feedback.textContent = 'Registrando tu solicitud…';
    try {
      const response = await fetch('https://panel.tucasaesnatural.com/api/request-return.php', {
        method: 'POST', headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({...data, request_id: requestId}), signal: AbortSignal.timeout(20000)
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'No se pudo registrar. Reintentá.');
      if (!/^CN-AR-\d{8}-[A-F0-9]{12}$/.test(result.id) || !Number.isFinite(Date.parse(result.created_at))) throw new Error('No pudimos confirmar el registro. Reintentá.');
      const date = new Date(result.created_at).toLocaleString('es-AR', {timeZone:'America/Argentina/Buenos_Aires'});
      feedback.replaceChildren();
      const title = document.createElement('strong');
      title.textContent = `Solicitud registrada: ${result.id}`;
      const detail = document.createElement('p');
      detail.textContent = `${date} (hora de Argentina). Conservá este número para el seguimiento. Recibimos tu solicitud; la resolución y el reintegro, si corresponde, se coordinan por separado.`;
      const download = document.createElement('a');
      if (receiptUrl) URL.revokeObjectURL(receiptUrl);
      receiptUrl = URL.createObjectURL(new Blob([`Casa Natural — Solicitud de arrepentimiento\nNúmero: ${result.id}\nFecha: ${date} (Argentina)\nNombre: ${data.name}\nContacto: ${data.contact}\nPedido: ${data.order || 'No informado'}\nDetalle: ${data.detail || 'No informado'}\n\nSolicitud recibida. Este comprobante no confirma un reembolso.\nContacto: WhatsApp +54 9 11 5843-6511\n`], {type:'text/plain;charset=utf-8'}));
      download.href = receiptUrl; download.download = `${result.id}.txt`; download.textContent = 'Descargar comprobante';
      feedback.append(title, detail, download);
      form.hidden = true;
    } catch (error) {
      feedback.textContent = error.name === 'TimeoutError' ? 'No recibimos confirmación a tiempo. Reintentá sin cambiar los datos: si ya se guardó, recibirás el mismo número.' : (error.message === 'Failed to fetch' ? 'No pudimos confirmar el registro. Revisá la conexión y reintentá; también podés contactarnos por WhatsApp.' : error.message);
    } finally {submit.disabled = false;}
  });
})();
