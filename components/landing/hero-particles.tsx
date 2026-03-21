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
    const CONNECTION_DIST = 120;
    const PARTICLE_COUNT = 80;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
    };

    const createParticle = (x?: number, y?: number): Particle => {
      const rect = canvas.getBoundingClientRect();
      return {
        x: x ?? Math.random() * rect.width,
        y: y ?? Math.random() * rect.height,
        vx: (Math.random() - 0.5) * 0.8,
        vy: (Math.random() - 0.5) * 0.8,
        r: Math.random() * 2 + 1,
        life: 0,
        maxLife: 300 + Math.random() * 400,
        hue: Math.random() > 0.5 ? 220 + Math.random() * 30 : 260 + Math.random() * 20, // blue to violet
      };
    };

    const burst = (x: number, y: number) => {
      const count = 6 + Math.floor(Math.random() * 6);
      for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 * i) / count + Math.random() * 0.3;
        const speed = 1.5 + Math.random() * 2;
        const p = createParticle(x, y);
        p.vx = Math.cos(angle) * speed;
        p.vy = Math.sin(angle) * speed;
        p.maxLife = 80 + Math.random() * 80;
        p.r = 1.5 + Math.random() * 1.5;
        particles.push(p);
      }
    };

    const init = () => {
      resize();
      particles = [];
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        particles.push(createParticle());
      }
    };

    let burstTimer = 0;

    const animate = () => {
      const rect = canvas.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;

      ctx.clearRect(0, 0, w, h);

      // Random bursts
      burstTimer++;
      if (burstTimer > 90 + Math.random() * 60) {
        burst(Math.random() * w, Math.random() * h);
        burstTimer = 0;
      }

      // Update & draw particles
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life++;

        // Fade in/out
        const progress = p.life / p.maxLife;
        const alpha = progress < 0.1 ? progress / 0.1 : progress > 0.8 ? (1 - progress) / 0.2 : 1;
        const a = Math.max(0, Math.min(alpha * 0.6, 1));

        // Remove dead or out-of-bounds
        if (p.life >= p.maxLife || p.x < -20 || p.x > w + 20 || p.y < -20 || p.y > h + 20) {
          particles.splice(i, 1);
          if (particles.length < PARTICLE_COUNT) {
            particles.push(createParticle());
          }
          continue;
        }

        // Draw particle
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${p.hue}, 70%, 60%, ${a})`;
        ctx.fill();
      }

      // Draw connections
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < CONNECTION_DIST) {
            const a1 = particles[i].life / particles[i].maxLife;
            const a2 = particles[j].life / particles[j].maxLife;
            const fadeA1 = a1 < 0.1 ? a1 / 0.1 : a1 > 0.8 ? (1 - a1) / 0.2 : 1;
            const fadeA2 = a2 < 0.1 ? a2 / 0.1 : a2 > 0.8 ? (1 - a2) / 0.2 : 1;
            const lineAlpha = (1 - dist / CONNECTION_DIST) * 0.15 * Math.min(fadeA1, fadeA2);

            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `hsla(240, 60%, 60%, ${lineAlpha})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
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
      className="absolute inset-0 -z-10 h-full w-full"
      style={{ opacity: 0.7 }}
    />
  );
}
