(() => {
  const bar = document.querySelector('[data-announcement-rotation]');
  const messages = [...bar.querySelectorAll('.announcement-message')];
  const next = bar.querySelector('button');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  let current = 0;
  let timer;
  let interacted = false;

  function showNext() {
    messages[current].hidden = true;
    current = (current + 1) % messages.length;
    messages[current].hidden = false;
  }

  function syncRotation() {
    clearInterval(timer);
    if (!interacted && !reducedMotion.matches && !bar.matches(':hover, :focus-within')) {
      timer = setInterval(showNext, 5000);
    }
  }

  next.hidden = false;
  next.addEventListener('click', () => {
    interacted = true;
    syncRotation();
    showNext();
  });
  for (const event of ['mouseenter', 'mouseleave', 'focusin', 'focusout']) {
    bar.addEventListener(event, () => queueMicrotask(syncRotation));
  }
  reducedMotion.addEventListener('change', syncRotation);
  syncRotation();
})();
