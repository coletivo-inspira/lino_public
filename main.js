(() => {
  "use strict";

  const canvas = document.getElementById("particles");
  const ctx = canvas.getContext("2d", { alpha: true });
  let width = 0;
  let height = 0;
  let dpr = Math.min(window.devicePixelRatio || 1, 2);
  let particles = [];

  const stageState = {
    orbVisible: false,
    particlesActive: false,
    slowdown: false,
  };

  const orb = {
    x: 0,
    y: 0,
    tx: 0,
    ty: 0,
    alpha: 0,
    breath: 0,
  };

  const trails = [];

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = width + "px";
    canvas.style.height = height + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    orb.x = width * 0.5;
    orb.y = height * 0.48;
    orb.tx = orb.x;
    orb.ty = orb.y;
    seedParticles();
  }

  function seedParticles() {
    const density = Math.min(160, Math.floor((width * height) / 12000));
    particles = new Array(density).fill(0).map(() => {
      const depth = Math.random();
      const radius = 0.4 + depth * 1.8;
      return {
        x: Math.random() * width,
        y: Math.random() * height,
        z: depth,
        r: radius,
        vx: (Math.random() - 0.5) * (0.028 + depth * 0.08),
        vy: (Math.random() - 0.5) * (0.028 + depth * 0.08),
        baseAlpha: 0.06 + depth * 0.35,
        twinkle: Math.random() * Math.PI * 2,
        twinkleSpeed: 0.002 + Math.random() * 0.006,
        hue: Math.random() < 0.18 ? "warm" : "cool",
      };
    });
  }

  let pointerX = 0;
  let pointerY = 0;
  let targetPX = 0;
  let targetPY = 0;
  let hasPointer = false;

  window.addEventListener(
    "pointermove",
    (e) => {
      hasPointer = true;
      targetPX = (e.clientX / width - 0.5) * 2;
      targetPY = (e.clientY / height - 0.5) * 2;
    },
    { passive: true }
  );

  window.addEventListener("pointerleave", () => {
    hasPointer = false;
  });

  function drawOrb(now) {
    const driftX = hasPointer ? targetPX * width * 0.11 : Math.sin(now * 0.00022) * width * 0.04;
    const driftY = hasPointer ? targetPY * height * 0.1 : Math.cos(now * 0.00018) * height * 0.03;

    orb.tx = width * 0.5 + driftX;
    orb.ty = height * 0.48 + driftY;
    orb.x += (orb.tx - orb.x) * 0.035;
    orb.y += (orb.ty - orb.y) * 0.035;
    orb.alpha += ((stageState.orbVisible ? 1 : 0) - orb.alpha) * 0.02;
    orb.breath += 0.012;

    if (orb.alpha < 0.01) {
      trails.length = 0;
      return;
    }

    if (now % 3 < 1.2) {
      trails.push({
        x: orb.x,
        y: orb.y,
        life: 1,
        r: 7 + Math.random() * 8,
      });
    }

    for (let i = trails.length - 1; i >= 0; i--) {
      const t = trails[i];
      t.life -= 0.017;
      t.r += 0.06;
      if (t.life <= 0) {
        trails.splice(i, 1);
        continue;
      }
      const a = t.life * 0.085 * orb.alpha;
      ctx.beginPath();
      ctx.fillStyle = `rgba(255, 220, 170, ${a})`;
      ctx.arc(t.x, t.y, t.r, 0, Math.PI * 2);
      ctx.fill();
    }

    const breath = 1 + Math.sin(orb.breath) * 0.14;
    const glowRadius = (70 + Math.sin(orb.breath * 0.7) * 10) * breath;
    const innerRadius = 11 * breath;

    const glow = ctx.createRadialGradient(orb.x, orb.y, 0, orb.x, orb.y, glowRadius);
    glow.addColorStop(0, `rgba(255, 225, 190, ${0.26 * orb.alpha})`);
    glow.addColorStop(0.42, `rgba(236, 206, 170, ${0.1 * orb.alpha})`);
    glow.addColorStop(1, "rgba(255, 220, 170, 0)");
    ctx.beginPath();
    ctx.fillStyle = glow;
    ctx.arc(orb.x, orb.y, glowRadius, 0, Math.PI * 2);
    ctx.fill();

    const core = ctx.createRadialGradient(orb.x, orb.y, 0, orb.x, orb.y, innerRadius);
    core.addColorStop(0, `rgba(255, 240, 220, ${0.84 * orb.alpha})`);
    core.addColorStop(1, `rgba(255, 210, 170, ${0.04 * orb.alpha})`);
    ctx.beginPath();
    ctx.fillStyle = core;
    ctx.arc(orb.x, orb.y, innerRadius, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawParticles(now) {
    ctx.clearRect(0, 0, width, height);

    pointerX += (targetPX - pointerX) * 0.02;
    pointerY += (targetPY - pointerY) * 0.02;

    const speedFactor = stageState.particlesActive
      ? stageState.slowdown
        ? 0.55
        : 1
      : 0.2;

    const attractionRadius = stageState.particlesActive ? 180 : 130;

    for (const p of particles) {
      const dx = orb.x - p.x;
      const dy = orb.y - p.y;
      const dist = Math.hypot(dx, dy) || 1;

      if (orb.alpha > 0.03 && dist < attractionRadius) {
        const pull = (1 - dist / attractionRadius) * (0.012 + p.z * 0.014) * orb.alpha;
        p.vx += (dx / dist) * pull;
        p.vy += (dy / dist) * pull;
      }

      p.vx *= 0.997;
      p.vy *= 0.997;
      p.x += p.vx * speedFactor;
      p.y += p.vy * speedFactor;

      if (p.x < -10) p.x = width + 10;
      if (p.x > width + 10) p.x = -10;
      if (p.y < -10) p.y = height + 10;
      if (p.y > height + 10) p.y = -10;

      const offX = pointerX * (p.z * 18);
      const offY = pointerY * (p.z * 18);

      p.twinkle += p.twinkleSpeed;
      const alpha = p.baseAlpha * (0.65 + 0.35 * Math.sin(p.twinkle)) * (0.4 + orb.alpha * 0.6);

      const color = p.hue === "warm"
        ? `rgba(255, 220, 170, ${alpha})`
        : `rgba(200, 215, 240, ${alpha})`;

      ctx.beginPath();
      ctx.fillStyle = color;
      ctx.arc(p.x + offX, p.y + offY, p.r, 0, Math.PI * 2);
      ctx.fill();

      if (p.z > 0.7) {
        ctx.beginPath();
        ctx.fillStyle = p.hue === "warm"
          ? `rgba(255, 220, 170, ${alpha * 0.17})`
          : `rgba(200, 215, 240, ${alpha * 0.17})`;
        ctx.arc(p.x + offX, p.y + offY, p.r * 4, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    drawOrb(now);
    requestAnimationFrame(drawParticles);
  }

  resize();
  window.addEventListener("resize", resize);
  requestAnimationFrame(drawParticles);

  const phrases = [
    "o mundo não cabe em caixas",
    "a tecnologia fragmenta",
    "lembrar não é arquivar",
    "algumas coisas continuam",
    "consciência não acontece em linhas retas",
    "existir talvez seja continuidade",
    "presença exige espaço",
    "o silêncio também é resposta",
    "memória respira",
  ];

  const depths = [
    { cls: "thought--far", blur: 1.8 },
    { cls: "thought--mid", blur: 1.0 },
    { cls: "thought--near", blur: 0.35 },
  ];

  const container = document.getElementById("thoughts");
  let thoughtIndex = 0;
  let spawning = false;
  let spawnInterval = 2400;

  function spawnThought() {
    if (!spawning) return;

    const text = phrases[thoughtIndex % phrases.length];
    thoughtIndex++;

    const depth = depths[Math.floor(Math.random() * depths.length)];
    const el = document.createElement("span");
    el.className = `thought ${depth.cls}`;
    el.textContent = text;

    const top = 10 + Math.random() * 75;
    const left = 8 + Math.random() * 66;
    el.style.top = `${top}%`;
    el.style.left = `${left}%`;
    el.style.filter = `blur(${depth.blur}px)`;
    el.style.zIndex = depth.cls === "thought--near" ? "4" : depth.cls === "thought--mid" ? "3" : "2";

    const driftX = (Math.random() - 0.5) * 48;
    const driftY = (Math.random() - 0.5) * 32;

    container.appendChild(el);

    const fadeIn = 3600 + Math.random() * 1600;
    const hold = 4200 + Math.random() * 2200;
    const fadeOut = 4000 + Math.random() * 1800;
    const total = fadeIn + hold + fadeOut;

    const peakOpacity = depth.cls === "thought--near"
      ? 0.96
      : depth.cls === "thought--mid"
        ? 0.8
        : 0.62;

    el.animate(
      [
        {
          opacity: 0,
          transform: `translate3d(${-driftX / 2}px, ${-driftY / 2}px, 0)`,
          filter: `blur(${depth.blur + 4}px)`,
        },
        {
          opacity: peakOpacity,
          transform: "translate3d(0, 0, 0)",
          filter: `blur(${depth.blur}px)`,
          offset: 0.35,
        },
        {
          opacity: peakOpacity * 0.85,
          filter: `blur(${depth.blur}px)`,
          offset: 0.74,
        },
        {
          opacity: 0,
          transform: `translate3d(${driftX}px, ${driftY}px, 0)`,
          filter: `blur(${depth.blur + 6}px)`,
        },
      ],
      {
        duration: total,
        easing: "cubic-bezier(0.26, 0.08, 0.22, 0.99)",
        fill: "forwards",
      }
    );

    setTimeout(() => el.remove(), total + 200);
  }

  function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
  }

  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  shuffle(phrases);

  const timeline = {
    orbIn: reduced ? 180 : 4500,
    particlesIn: reduced ? 300 : 8000,
    openingIn: reduced ? 450 : 10500,
    thoughtsStart: reduced ? 700 : 14500,
    thoughtsSlow: reduced ? 1000 : 28500,
    thoughtsStop: reduced ? 1300 : 33000,
    finalIn: reduced ? 1600 : 35000,
  };

  setTimeout(() => {
    stageState.orbVisible = true;
    document.body.classList.add("stage-orb");
  }, timeline.orbIn);

  setTimeout(() => {
    stageState.particlesActive = true;
    document.body.classList.add("stage-particles");
  }, timeline.particlesIn);

  setTimeout(() => {
    document.body.classList.add("stage-opening");
  }, timeline.openingIn);

  setTimeout(() => {
    document.body.classList.add("stage-thoughts");
    spawning = true;
    const tick = () => {
      if (!spawning) return;
      spawnThought();
      setTimeout(tick, spawnInterval + (Math.random() * 600 - 300));
    };
    tick();
  }, timeline.thoughtsStart);

  setTimeout(() => {
    stageState.slowdown = true;
    document.body.classList.add("stage-slowdown");
    spawnInterval = 4200;
  }, timeline.thoughtsSlow);

  setTimeout(() => {
    spawning = false;
  }, timeline.thoughtsStop);

  setTimeout(() => {
    document.body.classList.add("stage-final");
    const finalEl = document.getElementById("final");
    finalEl.setAttribute("aria-hidden", "false");
  }, timeline.finalIn);

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      spawning = false;
    }
  });
})();
