(() => {
  if (window.__jubberUiV4) return;
  window.__jubberUiV4 = true;

  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const instances = [...document.querySelectorAll('[data-jubber],[data-jub],[data-flub],[data-jub-showcase]')];
  let pointerX = -9999;
  let pointerY = -9999;
  let lastActivity = performance.now();
  let frame = 0;

  const range = (min, max) => min + Math.random() * (max - min);
  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  const shuffle = (items) => {
    const copy = [...items];
    for (let i = copy.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  };

  const ensureLayers = (jubber) => {
    const visual = jubber.querySelector('.jubber-ui__visual,.amh-jubber-visual');
    if (!visual) return { motion: jubber, visual: null };
    let motion = visual.closest('.jubber-ui__motion,.amh-jubber-motion');
    if (!motion) {
      motion = document.createElement('span');
      motion.className = jubber.classList.contains('amh-jubber') ? 'amh-jubber-motion' : 'jubber-ui__motion';
      motion.setAttribute('aria-hidden', 'true');
      visual.parentNode.insertBefore(motion, visual);
      const glow = document.createElement('span');
      glow.className = jubber.classList.contains('amh-jubber') ? 'amh-jubber-glow' : 'jubber-ui__glow';
      motion.append(glow, visual);
    }
    return { motion, visual };
  };

  const actions = {
    breathe: { duration: 1050, frames: [
      { transform: 'translate3d(0,0,0) scale(1)' },
      { transform: 'translate3d(0,1px,0) scale(1.035,.97)', offset: .48 },
      { transform: 'translate3d(0,0,0) scale(1)' }
    ]},
    sway: { duration: 1350, frames: [
      { transform: 'rotate(0) translateY(0)' },
      { transform: 'rotate(-3.2deg) translateY(-2px)', offset: .3 },
      { transform: 'rotate(2.5deg) translateY(0)', offset: .68 },
      { transform: 'rotate(0) translateY(0)' }
    ]},
    jubb: { duration: 980, frames: [
      { transform: 'scale(1)' },
      { transform: 'scale(1.07,.91) rotate(-1.5deg)', offset: .24 },
      { transform: 'scale(.96,1.08) rotate(1.2deg)', offset: .48 },
      { transform: 'scale(1.035,.97)', offset: .72 },
      { transform: 'scale(1)' }
    ]},
    float: { duration: 1650, frames: [
      { transform: 'translate3d(0,0,0) scale(1)' },
      { transform: 'translate3d(2px,-10px,0) scale(.98,1.035)', offset: .42 },
      { transform: 'translate3d(-1px,2px,0) scale(1.025,.975)', offset: .78 },
      { transform: 'translate3d(0,0,0) scale(1)' }
    ]},
    hop: { duration: 1120, frames: [
      { transform: 'translateY(0) scale(1)' },
      { transform: 'translateY(4px) scale(1.11,.86)', offset: .18 },
      { transform: 'translateY(-22px) scale(.92,1.13)', offset: .42 },
      { transform: 'translateY(-6px) scale(.98,1.03)', offset: .66 },
      { transform: 'translateY(3px) scale(1.09,.9)', offset: .82 },
      { transform: 'translateY(0) scale(1)' }
    ]},
    stretch: { duration: 1450, frames: [
      { transform: 'translateY(0) scale(1)' },
      { transform: 'translateY(3px) scale(1.08,.9)', offset: .2 },
      { transform: 'translateY(-8px) scale(.84,1.19)', offset: .48 },
      { transform: 'translateY(1px) scale(1.05,.96)', offset: .76 },
      { transform: 'translateY(0) scale(1)' }
    ]},
    peek: { duration: 1500, frames: [
      { transform: 'translateX(0) rotate(0)' },
      { transform: 'translateX(-12px) rotate(-5deg)', offset: .36 },
      { transform: 'translateX(-12px) rotate(-5deg)', offset: .62 },
      { transform: 'translateX(2px) rotate(1deg)', offset: .84 },
      { transform: 'translateX(0) rotate(0)' }
    ]},
    flip: { duration: 1850, frames: [
      { transform: 'translateY(0) rotateY(0) scale(1)' },
      { transform: 'translateY(4px) rotateY(0) scale(1.08,.9)', offset: .15 },
      { transform: 'translateY(-15px) rotateY(180deg) scale(.94,1.08)', offset: .48 },
      { transform: 'translateY(1px) rotateY(360deg) scale(1.04,.96)', offset: .82 },
      { transform: 'translateY(0) rotateY(360deg) scale(1)' }
    ]}
  };

  const ambientNames = ['breathe', 'sway', 'jubb', 'float'];
  const idleNames = ['jubb', 'float', 'hop', 'stretch', 'peek', 'breathe', 'sway', 'flip'];

  const findTip = (jubber) => jubber.querySelector('.jubber-ui__tip,.amh-jubber-tip') ||
    [...jubber.children].find((child) => child.tagName === 'SPAN' &&
      !child.classList.contains('jubber-ui__motion') &&
      !child.classList.contains('amh-jubber-motion') &&
      !child.classList.contains('amh-jubber-body'));

  const react = (jubber, forced) => {
    const emotion = forced || (Math.random() < .64 ? 'excited' : 'scared');
    jubber.dataset.jubEmotion = emotion;
    const tip = findTip(jubber);
    if (tip) {
      if (!tip.dataset.jubOriginal) tip.dataset.jubOriginal = tip.textContent;
      tip.textContent = emotion === 'excited' ? 'WHEEE! · AGAIN!' : 'OOH! · EASY!';
    }
    clearTimeout(jubber.__jubberReactionTimer);
    jubber.__jubberReactionTimer = setTimeout(() => {
      delete jubber.dataset.jubEmotion;
      if (tip?.dataset.jubOriginal) tip.textContent = tip.dataset.jubOriginal;
    }, 1450);
  };

  const scheduleMotion = (jubber, delay = range(2600, 5200)) => {
    const state = jubber.__jubberMotion;
    clearTimeout(state.timer);
    state.timer = setTimeout(async () => {
      if (reduceMotion.matches || document.hidden || state.hovered || state.dragging || state.physics) {
        scheduleMotion(jubber, range(2400, 4300));
        return;
      }
      const idle = performance.now() - lastActivity > 10500;
      const names = idle ? idleNames : ambientNames;
      if (!state.bag.length || state.mode !== (idle ? 'idle' : 'ambient')) {
        state.bag = shuffle(names).filter((name) => name !== state.last);
        state.mode = idle ? 'idle' : 'ambient';
      }
      const name = state.bag.pop() || names[0];
      const action = actions[name];
      state.last = name;
      state.animation?.cancel();
      state.animation = state.motion.animate(action.frames, {
        duration: action.duration * range(.92, 1.1),
        easing: 'cubic-bezier(.22,.75,.25,1)',
        iterations: 1
      });
      try { await state.animation.finished; } catch (_) {}
      scheduleMotion(jubber, idle ? range(3100, 7600) : range(5200, 9800));
    }, delay);
  };

  const settle = (jubber, state) => {
    state.physics = null;
    delete jubber.dataset.jubThrowing;
    state.animation?.cancel();
    state.animation = state.motion.animate(actions.jubb.frames, {
      duration: 900,
      easing: 'cubic-bezier(.22,.78,.25,1)'
    });
    scheduleMotion(jubber, range(3200, 5600));
  };

  const throwJubber = (jubber, state, start) => {
    const box = jubber.getBoundingClientRect();
    const physics = {
      x: box.left,
      y: box.top,
      vx: clamp(start.vx * 1.08, -2.8, 2.8),
      vy: clamp(start.vy * 1.08, -2.8, 2.8),
      last: performance.now(),
      born: performance.now(),
      lastReaction: 0
    };
    state.physics = physics;
    jubber.dataset.jubThrowing = '1';

    const tick = (now) => {
      if (state.physics !== physics) return;
      const dt = Math.min(32, Math.max(1, now - physics.last));
      physics.last = now;
      physics.vy += .00105 * dt;
      physics.x += physics.vx * dt;
      physics.y += physics.vy * dt;

      const liveBox = jubber.getBoundingClientRect();
      const maxX = Math.max(6, innerWidth - liveBox.width - 6);
      const maxY = Math.max(6, innerHeight - liveBox.height - 6);
      let bounced = false;

      if (physics.x <= 6 || physics.x >= maxX) {
        physics.x = clamp(physics.x, 6, maxX);
        physics.vx *= -.76;
        bounced = true;
      }
      if (physics.y <= 6) {
        physics.y = 6;
        physics.vy = Math.abs(physics.vy) * .72;
        bounced = true;
      }
      if (physics.y >= maxY) {
        physics.y = maxY;
        physics.vy = -Math.abs(physics.vy) * .62;
        physics.vx *= .91;
        bounced = true;
        if (Math.abs(physics.vy) < .095) physics.vy = 0;
      }

      const damping = Math.pow(.987, dt / 16);
      physics.vx *= damping;
      physics.vy *= Math.pow(.994, dt / 16);
      jubber.style.left = physics.x.toFixed(2) + 'px';
      jubber.style.top = physics.y.toFixed(2) + 'px';
      jubber.style.right = 'auto';
      jubber.style.bottom = 'auto';

      if (bounced) {
        state.animation?.cancel();
        state.animation = state.motion.animate([
          { transform: 'scale(1)' },
          { transform: Math.abs(physics.vx) > Math.abs(physics.vy) ? 'scale(.86,1.12)' : 'scale(1.14,.84)', offset: .34 },
          { transform: 'scale(.97,1.04)', offset: .72 },
          { transform: 'scale(1)' }
        ], { duration: 430, easing: 'cubic-bezier(.2,.8,.25,1)' });
        if (now - physics.lastReaction > 520) {
          react(jubber);
          physics.lastReaction = now;
        }
      }

      const onFloor = physics.y >= maxY - .5;
      const slow = Math.abs(physics.vx) < .035 && Math.abs(physics.vy) < .06;
      if ((onFloor && slow) || now - physics.born > 7200) {
        settle(jubber, state);
        return;
      }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };

  const setupDrag = (jubber, state) => {
    if (jubber.hasAttribute('data-jub-showcase')) return;
    jubber.dataset.jubDraggable = '1';
    let drag = null;

    jubber.addEventListener('pointerdown', (event) => {
      if (event.button !== 0 || reduceMotion.matches) return;
      state.physics = null;
      state.animation?.cancel();
      const box = jubber.getBoundingClientRect();
      drag = {
        id: event.pointerId,
        offsetX: event.clientX - box.left,
        offsetY: event.clientY - box.top,
        startX: event.clientX,
        startY: event.clientY,
        lastX: event.clientX,
        lastY: event.clientY,
        lastT: performance.now(),
        vx: 0,
        vy: 0,
        moved: false
      };
      state.dragging = true;
      jubber.dataset.jubDragging = '1';
      jubber.style.transition = 'none';
      jubber.setPointerCapture?.(event.pointerId);
      event.preventDefault();
      event.stopPropagation();
    }, true);

    jubber.addEventListener('pointermove', (event) => {
      if (!drag || drag.id !== event.pointerId) return;
      const now = performance.now();
      const distance = Math.hypot(event.clientX - drag.startX, event.clientY - drag.startY);
      if (distance > 5) drag.moved = true;
      if (!drag.moved) return;
      const box = jubber.getBoundingClientRect();
      const x = clamp(event.clientX - drag.offsetX, 6, Math.max(6, innerWidth - box.width - 6));
      const y = clamp(event.clientY - drag.offsetY, 6, Math.max(6, innerHeight - box.height - 6));
      const dt = Math.max(8, now - drag.lastT);
      drag.vx = drag.vx * .42 + ((event.clientX - drag.lastX) / dt) * .58;
      drag.vy = drag.vy * .42 + ((event.clientY - drag.lastY) / dt) * .58;
      drag.lastX = event.clientX;
      drag.lastY = event.clientY;
      drag.lastT = now;
      jubber.style.left = x.toFixed(2) + 'px';
      jubber.style.top = y.toFixed(2) + 'px';
      jubber.style.right = 'auto';
      jubber.style.bottom = 'auto';
      event.preventDefault();
      event.stopPropagation();
    }, true);

    const release = (event) => {
      if (!drag || drag.id !== event.pointerId) return;
      const released = drag;
      drag = null;
      state.dragging = false;
      delete jubber.dataset.jubDragging;
      jubber.releasePointerCapture?.(event.pointerId);
      if (released.moved) {
        state.suppressClickUntil = performance.now() + 650;
        react(jubber);
        throwJubber(jubber, state, released);
        event.preventDefault();
        event.stopPropagation();
      } else {
        jubber.style.transition = '';
        state.suppressClickUntil = performance.now() + 450;
        const tapDown = new MouseEvent('mousedown', {
          bubbles: true, cancelable: true, clientX: event.clientX, clientY: event.clientY, button: 0
        });
        const tapUp = new MouseEvent('mouseup', {
          bubbles: true, cancelable: true, clientX: event.clientX, clientY: event.clientY, button: 0
        });
        jubber.dispatchEvent(tapDown);
        window.dispatchEvent(tapUp);
        state.allowProgrammaticClick = true;
        jubber.click();
      }
    };
    jubber.addEventListener('pointerup', release, true);
    jubber.addEventListener('pointercancel', release, true);
    jubber.addEventListener('click', (event) => {
      if (state.allowProgrammaticClick) {
        state.allowProgrammaticClick = false;
        return;
      }
      if (performance.now() < state.suppressClickUntil) {
        event.preventDefault();
        event.stopImmediatePropagation();
      }
    }, true);
  };

  instances.forEach((jubber, index) => {
    const layers = ensureLayers(jubber);
    const motion = layers.motion;
    jubber.__jubberMotion = {
      motion, visual: layers.visual, timer: 0, animation: null, bag: [], last: '',
      mode: '', hovered: false, dragging: false, physics: null, suppressClickUntil: 0
    };
    setupDrag(jubber, jubber.__jubberMotion);
    jubber.addEventListener('pointerenter', () => {
      jubber.__jubberMotion.hovered = true;
      if (!jubber.__jubberMotion.dragging) jubber.__jubberMotion.animation?.cancel();
    });
    jubber.addEventListener('pointerleave', () => {
      jubber.__jubberMotion.hovered = false;
      if (!jubber.__jubberMotion.physics) scheduleMotion(jubber, range(2400, 4200));
    });
    jubber.addEventListener('focus', () => { jubber.__jubberMotion.hovered = true; });
    jubber.addEventListener('blur', () => {
      jubber.__jubberMotion.hovered = false;
      scheduleMotion(jubber, range(2400, 4200));
    });
    scheduleMotion(jubber, 2200 + index * 850 + range(0, 1200));
  });

  const paint = () => {
    frame = 0;
    instances.forEach((jubber) => {
      const box = jubber.getBoundingClientRect();
      if (!box.width || !box.height) return;
      const centerX = box.left + box.width / 2;
      const centerY = box.top + box.height / 2;
      const dx = pointerX - centerX;
      const dy = pointerY - centerY;
      const distance = Math.hypot(dx, dy);
      const reach = Math.max(250, box.width * 4.4);
      const near = Math.max(0, Math.min(1, (reach - distance) / reach));
      const pull = near * 7;
      const divisor = distance || 1;
      jubber.style.setProperty('--jub-near', near.toFixed(3));
      jubber.style.setProperty('--jub-pull-x', (dx / divisor * pull).toFixed(2) + 'px');
      jubber.style.setProperty('--jub-pull-y', (dy / divisor * pull).toFixed(2) + 'px');
    });
  };

  const requestPaint = () => {
    if (!frame) frame = requestAnimationFrame(paint);
  };
  const markActivity = () => { lastActivity = performance.now(); };

  addEventListener('pointermove', (event) => {
    pointerX = event.clientX;
    pointerY = event.clientY;
    markActivity();
    requestPaint();
  }, { passive: true });
  addEventListener('pointerdown', markActivity, { passive: true });
  addEventListener('keydown', markActivity, { passive: true });
  addEventListener('touchstart', markActivity, { passive: true });
  addEventListener('pointerout', (event) => {
    if (!event.relatedTarget) {
      pointerX = -9999;
      pointerY = -9999;
      requestPaint();
    }
  }, { passive: true });

  const dialog = document.querySelector('[data-jubber-chat]');
  const opener = document.querySelector('[data-jubber]');
  if (dialog && opener) {
    opener.addEventListener('click', () => {
      dialog.showModal?.();
      setTimeout(() => dialog.querySelector('input,textarea')?.focus(), 60);
    });
    dialog.querySelectorAll('[data-jubber-chat-close]').forEach((button) => {
      button.addEventListener('click', () => dialog.close?.());
    });
    dialog.addEventListener('click', (event) => {
      if (event.target === dialog) dialog.close?.();
    });
    const form = dialog.querySelector('form');
    form?.addEventListener('submit', (event) => {
      event.preventDefault();
      const input = form.querySelector('input,textarea');
      const log = dialog.querySelector('[data-jubber-chat-log]');
      const value = input?.value.trim();
      if (!value || !log) return;
      log.insertAdjacentHTML('beforeend', '<div class="jubber-chat__message jubber-chat__message--user"></div><div class="jubber-chat__message jubber-chat__message--jubber">Got it. Connect this demo to your chat handler and I will answer here.</div>');
      log.children[log.children.length - 2].textContent = value;
      input.value = '';
      log.scrollTop = log.scrollHeight;
    });
  }

  setTimeout(paint, 300);
})();



