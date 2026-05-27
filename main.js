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
    finalActive: false,
  };

  const orb = {
    x: 0,
    y: 0,
    tx: 0,
    ty: 0,
    px: 0,
    py: 0,
    alpha: 0,
    breath: 0,
  };

  const TAU = Math.PI * 2;
  const trails = [];

  function createOrbSystem(config) {
    const sats = new Array(config.count).fill(0).map(() => {
      const dir = Math.random() > 0.5 ? 1 : -1;
      const baseRadius = config.radiusMin + Math.random() * (config.radiusMax - config.radiusMin);
      return {
        angle: Math.random() * TAU,
        baseRadius,
        radius: baseRadius,
        speed: dir * (config.speedMin + Math.random() * (config.speedMax - config.speedMin)),
        size: config.sizeMin + Math.random() * (config.sizeMax - config.sizeMin),
        phase: Math.random() * TAU,
      };
    });

    return {
      sats,
      fusion: 0,
      singularitySpin: 0,
    };
  }

  const resetOrbSystem = createOrbSystem({
    count: 12,
    radiusMin: 16,
    radiusMax: 36,
    speedMin: 0.008,
    speedMax: 0.018,
    sizeMin: 1.4,
    sizeMax: 3.4,
  });

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
    orb.px = orb.x;
    orb.py = orb.y;
    pointerAbsX = width * 0.5;
    pointerAbsY = height * 0.5;
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
  let pointerAbsX = 0;
  let pointerAbsY = 0;
  let targetPX = 0;
  let targetPY = 0;
  let hasPointer = false;

  window.addEventListener(
    "pointermove",
    (e) => {
      hasPointer = true;
      pointerAbsX = e.clientX;
      pointerAbsY = e.clientY;
      targetPX = (e.clientX / width - 0.5) * 2;
      targetPY = (e.clientY / height - 0.5) * 2;
    },
    { passive: true }
  );

  window.addEventListener("pointerleave", () => {
    hasPointer = false;
  });

  function drawResetSatellites(now, centerX, centerY, alpha, system) {
    const speedBoost = 1 + system.fusion * 2.6;

    for (const sat of system.sats) {
      sat.angle += sat.speed * speedBoost;
      const orbitRadius = sat.baseRadius * (1 + 0.12 * Math.sin(now * 0.0017 + sat.phase));
      const fusedRadius = 7 + 2.2 * Math.sin(now * 0.005 + sat.phase);
      const targetRadius = orbitRadius * (1 - system.fusion) + fusedRadius * system.fusion;
      sat.radius += (targetRadius - sat.radius) * (0.08 + system.fusion * 0.12);

      const sx = centerX + Math.cos(sat.angle) * sat.radius;
      const sy = centerY + Math.sin(sat.angle) * sat.radius;
      const satAlpha = alpha * (0.66 + system.fusion * 0.26);

      ctx.beginPath();
      ctx.fillStyle = `rgba(255, 224, 182, ${satAlpha * 0.52})`;
      ctx.arc(sx, sy, sat.size * 2.3, 0, TAU);
      ctx.fill();

      ctx.beginPath();
      ctx.fillStyle = `rgba(255, 238, 214, ${satAlpha})`;
      ctx.arc(sx, sy, sat.size, 0, TAU);
      ctx.fill();
    }

    if (system.fusion > 0.52) {
      system.singularitySpin += 0.16;
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.strokeStyle = `rgba(255, 225, 180, ${alpha * system.fusion * (0.2 - i * 0.04)})`;
        ctx.lineWidth = 1.4 - i * 0.25;
        ctx.arc(centerX, centerY, 14 + i * 5, system.singularitySpin + i * 0.9, system.singularitySpin + i * 0.9 + 2.1);
        ctx.stroke();
      }
    }
  }

  function drawOrbCore(centerX, centerY, alpha, breathFactor) {
    const glowRadius = (68 + Math.sin(orb.breath * 0.6) * 8) * breathFactor;
    const innerRadius = 10.5 * breathFactor;

    const glow = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, glowRadius);
    glow.addColorStop(0, `rgba(255, 225, 190, ${0.24 * alpha})`);
    glow.addColorStop(0.45, `rgba(236, 206, 170, ${0.095 * alpha})`);
    glow.addColorStop(1, "rgba(255, 220, 170, 0)");
    ctx.beginPath();
    ctx.fillStyle = glow;
    ctx.arc(centerX, centerY, glowRadius, 0, TAU);
    ctx.fill();

    const core = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, innerRadius);
    core.addColorStop(0, `rgba(255, 240, 220, ${0.88 * alpha})`);
    core.addColorStop(1, `rgba(255, 210, 170, ${0.05 * alpha})`);
    ctx.beginPath();
    ctx.fillStyle = core;
    ctx.arc(centerX, centerY, innerRadius, 0, TAU);
    ctx.fill();
  }

  function getResetCenter() {
    const resetControl = document.getElementById("resetExperience");
    if (!resetControl || !stageState.finalActive) return null;
    const rect = resetControl.getBoundingClientRect();
    return {
      x: rect.left + rect.width * 0.5,
      y: rect.top + rect.height * 0.42,
    };
  }

  function drawOrb(now) {
    if (hasPointer) {
      orb.tx = pointerAbsX;
      orb.ty = pointerAbsY;
    } else {
      const driftX = Math.sin(now * 0.00019) * width * 0.22;
      const driftY = Math.cos(now * 0.00015) * height * 0.18;
      orb.tx = width * 0.5 + driftX;
      orb.ty = height * 0.5 + driftY;
    }

    orb.x += (orb.tx - orb.x) * 0.035;
    orb.y += (orb.ty - orb.y) * 0.035;
    orb.alpha += ((stageState.orbVisible ? 1 : 0) - orb.alpha) * 0.02;
    orb.breath += 0.012;

    if (orb.alpha < 0.01) {
      trails.length = 0;
      return;
    }

    const speed = Math.hypot(orb.x - orb.px, orb.y - orb.py);
    orb.px = orb.x;
    orb.py = orb.y;

    if (speed > 0.25 || Math.random() < 0.14) {
      trails.push({
        x: orb.x,
        y: orb.y,
        life: 1,
        r: 5 + Math.min(9, speed * 0.85),
      });
    }

    while (trails.length > 34) {
      trails.shift();
    }

    for (let i = trails.length - 1; i >= 0; i--) {
      const t = trails[i];
      t.life -= 0.024;
      t.r += 0.07;
      if (t.life <= 0) {
        trails.splice(i, 1);
        continue;
      }
      const a = t.life * 0.11 * orb.alpha;
      ctx.beginPath();
      ctx.fillStyle = `rgba(255, 220, 170, ${a})`;
      ctx.arc(t.x, t.y, t.r, 0, TAU);
      ctx.fill();
    }

    const resetCenter = getResetCenter();
    let mainAlpha = orb.alpha;

    if (resetCenter) {
      const resetDist = Math.hypot(resetCenter.x - orb.x, resetCenter.y - orb.y);
      const engageRadius = 180;
      const releaseRadius = 250;
      let targetFusion = resetOrbSystem.fusion;

      if (resetDist <= engageRadius) {
        targetFusion = 1;
      } else if (resetDist >= releaseRadius) {
        targetFusion = 0;
      }

      resetOrbSystem.fusion += (targetFusion - resetOrbSystem.fusion) * 0.12;
      mainAlpha *= 1 - resetOrbSystem.fusion * 0.22;

      const resetAlpha = 0.95;
      drawResetSatellites(now, resetCenter.x, resetCenter.y, resetAlpha, resetOrbSystem);
      drawOrbCore(
        resetCenter.x,
        resetCenter.y,
        resetAlpha,
        0.78 + Math.sin(orb.breath * 1.1) * 0.08 + resetOrbSystem.fusion * 0.12
      );
    } else {
      resetOrbSystem.fusion += (0 - resetOrbSystem.fusion) * 0.08;
    }

    drawOrbCore(orb.x, orb.y, mainAlpha, 1 + Math.sin(orb.breath) * 0.13);
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

    const attractionRadius = stageState.particlesActive
      ? Math.hypot(width, height) * 0.52
      : Math.hypot(width, height) * 0.34;

    const resetCenter = getResetCenter();
    const resetInfluence = resetCenter ? (1.05 + resetOrbSystem.fusion * 1.35) : 0;

    for (const p of particles) {
      const dx = orb.x - p.x;
      const dy = orb.y - p.y;
      const dist = Math.hypot(dx, dy) || 1;

      if (orb.alpha > 0.03 && dist < attractionRadius) {
        const pull = (1 - dist / attractionRadius) * (0.006 + p.z * 0.01) * orb.alpha;
        p.vx += (dx / dist) * pull;
        p.vy += (dy / dist) * pull;
      }

      if (orb.alpha > 0.25 && stageState.particlesActive && dist >= attractionRadius) {
        const globalPull = (0.00055 + p.z * 0.00045) * orb.alpha;
        p.vx += (dx / dist) * globalPull;
        p.vy += (dy / dist) * globalPull;
      }

      if (resetCenter && stageState.finalActive) {
        const rdx = resetCenter.x - p.x;
        const rdy = resetCenter.y - p.y;
        const rdist = Math.hypot(rdx, rdy) || 1;
        const resetRadius = attractionRadius * (0.28 + resetOrbSystem.fusion * 0.2);
        if (rdist < resetRadius) {
          const pullReset = (1 - rdist / resetRadius) * (0.006 + p.z * 0.008) * resetInfluence;
          p.vx += (rdx / rdist) * pullReset;
          p.vy += (rdy / rdist) * pullReset;
        }
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

  const resetControl = document.getElementById("resetExperience");
  if (resetControl) {
    resetControl.addEventListener("click", () => {
      window.location.reload();
    });
  }

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
    stageState.finalActive = true;
    const finalEl = document.getElementById("final");
    finalEl.setAttribute("aria-hidden", "false");
  }, timeline.finalIn);

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      spawning = false;
    }
  });
})();
