(() => {
  const panel = document.querySelector('#cart-panel');
  const indicator = document.createElement('section');
  indicator.className = 'cart-free-shipping';
  indicator.setAttribute('aria-label', 'Envío gratis');
  indicator.hidden = true;
  indicator.innerHTML = `
    <div class="cart-free-shipping-goals" aria-live="polite">
      <div><strong>Zona local</strong><span></span><progress max="40000" aria-label="Progreso para envío gratis en zona local"></progress></div>
      <div><strong>Resto del país</strong><span></span><progress max="99000" aria-label="Progreso para envío gratis en el resto del país"></progress></div>
    </div>
    <p>Calculá el envío con tu código postal en el siguiente paso.</p>`;
  panel.querySelector('.cart-total').before(indicator);

  const goals = Array.from(indicator.querySelectorAll('progress')).map(bar => ({
    bar, label: bar.previousElementSibling
  }));
  const money = new Intl.NumberFormat('es-AR', {
    style: 'currency', currency: 'ARS', maximumFractionDigits: 2
  });

  window.updateFreeShippingIndicator = (subtotal, hasItems) => {
    indicator.hidden = !hasItems;
    if (!hasItems) return;
    for (const {bar, label} of goals) {
      const remaining = Math.max(0, Math.round((bar.max - subtotal) * 100) / 100);
      const message = remaining ? `Te faltan ${money.format(remaining)}` : 'Envío gratis';
      if (label.textContent !== message) label.textContent = message;
      bar.value = Math.min(subtotal, bar.max);
    }
  };
})();
