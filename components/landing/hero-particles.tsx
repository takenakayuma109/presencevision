"use client";

import { useEffect, useRef } from "react";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  life: number;
  maxLife: number;
  hue: number;
}

export function HeroParticles() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let particles: Particle[] = [];
    let w = 0;
    let h = 0;
    const CONNECTION_DIST = 150;
    const PARTICLE_COUNT = 90;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      w = rect.width;
      h = rect.height;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const createParticle = (x?: number, y?: number): Particle => ({
      x: x ?? Math.random() * w,
      y: y ?? Math.random() * h,
      vx: (Math.random() - 0.5) * 0.6,
      vy: (Math.random() - 0.5) * 0.6,
      r: Math.random() * 2.5 + 1.5,
      life: 0,
      maxLife: 400 + Math.random() * 500,
      hue: Math.random() > 0.5 ? 220 + Math.random() * 30 : 260 + Math.random() * 20,
    });

    const burst = (x: number, y: number) => {
      const count = 8 + Math.floor(Math.random() * 8);
      for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 * i) / count + Math.random() * 0.4;
        const speed = 2 + Math.random() * 3;
        const p = createParticle(x, y);
        p.vx = Math.cos(angle) * speed;
        p.vy = Math.sin(angle) * speed;
        p.maxLife = 60 + Math.random() * 90;
        p.r = 2 + Math.random() * 2.5;
        p.hue = 200 + Math.random() * 80;
        particles.push(p);
      }
    };

    const init = () => {
      resize();
      particles = [];
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        const p = createParticle();
        p.life = Math.random() * p.maxLife * 0.5; // stagger start
        particles.push(p);
      }
    };

    let burstTimer = 0;

    const fadeAlpha = (p: Particle) => {
      const t = p.life / p.maxLife;
      if (t < 0.05) return t / 0.05;
      if (t > 0.75) return (1 - t) / 0.25;
      return 1;
    };

    const animate = () => {
      ctx.clearRect(0, 0, w, h);

      // Random bursts
      burstTimer++;
      if (burstTimer > 70 + Math.random() * 50) {
        burst(w * 0.15 + Math.random() * w * 0.7, h * 0.15 + Math.random() * h * 0.7);
        burstTimer = 0;
      }

      // Draw connections first (behind particles)
      for (let i = 0; i < particles.length; i++) {
        const pi = particles[i];
        const ai = fadeAlpha(pi);
        if (ai <= 0) continue;

        for (let j = i + 1; j < particles.length; j++) {
          const pj = particles[j];
          const dx = pi.x - pj.x;
          const dy = pi.y - pj.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < CONNECTION_DIST) {
            const aj = fadeAlpha(pj);
            if (aj <= 0) continue;
            const lineAlpha = (1 - dist / CONNECTION_DIST) * 0.35 * Math.min(ai, aj);

            ctx.beginPath();
            ctx.moveTo(pi.x, pi.y);
            ctx.lineTo(pj.x, pj.y);
            ctx.strokeStyle = `hsla(240, 70%, 65%, ${lineAlpha})`;
            ctx.lineWidth = 0.8;
            ctx.stroke();
          }
        }
      }

      // Update & draw particles
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vx *= 0.999;
        p.vy *= 0.999;
        p.life++;

        const a = fadeAlpha(p);

        if (p.life >= p.maxLife || p.x < -30 || p.x > w + 30 || p.y < -30 || p.y > h + 30) {
          particles.splice(i, 1);
          if (particles.length < PARTICLE_COUNT) particles.push(createParticle());
          continue;
        }

        // Glow
        const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 3);
        gradient.addColorStop(0, `hsla(${p.hue}, 80%, 65%, ${a * 0.8})`);
        gradient.addColorStop(0.4, `hsla(${p.hue}, 70%, 60%, ${a * 0.3})`);
        gradient.addColorStop(1, `hsla(${p.hue}, 60%, 50%, 0)`);
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r * 3, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();

        // Core
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${p.hue}, 80%, 70%, ${a * 0.9})`;
        ctx.fill();
      }

      animId = requestAnimationFrame(animate);
    };

    init();
    animate();

    window.addEventListener("resize", resize);
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 h-full w-full"
      style={{ zIndex: 0 }}
    />
  );
}
