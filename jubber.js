(() => {
  if (window.__jubberUiV2) return;
  window.__jubberUiV2 = true;

  let pointerX = -9999;
  let pointerY = -9999;
  let frame = 0;

  const paint = () => {
    frame = 0;
    document.querySelectorAll('[data-jubber]').forEach((jubber) => {
      const box = jubber.getBoundingClientRect();
      if (!box.width || !box.height) return;

      const centerX = box.left + box.width / 2;
      const centerY = box.top + box.height / 2;
      const dx = pointerX - centerX;
      const dy = pointerY - centerY;
      const distance = Math.hypot(dx, dy);
      const reach = Math.max(230, box.width * 4.2);
      const near = Math.max(0, Math.min(1, (reach - distance) / reach));
      const pull = near * 6;
      const divisor = distance || 1;

      jubber.style.setProperty('--jub-near', near.toFixed(3));
      jubber.style.setProperty('--jub-pull-x', `${(dx / divisor * pull).toFixed(2)}px`);
      jubber.style.setProperty('--jub-pull-y', `${(dy / divisor * pull).toFixed(2)}px`);
    });
  };

  const requestPaint = () => {
    if (!frame) frame = requestAnimationFrame(paint);
  };

  addEventListener('pointermove', (event) => {
    pointerX = event.clientX;
    pointerY = event.clientY;
    requestPaint();
  }, { passive: true });

  addEventListener('pointerout', (event) => {
    if (!event.relatedTarget) {
      pointerX = -9999;
      pointerY = -9999;
      requestPaint();
    }
  }, { passive: true });

  setTimeout(paint, 300);
})();
