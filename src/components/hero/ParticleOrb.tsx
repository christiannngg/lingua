"use client";

import { useEffect, useRef } from "react";

interface Particle {
  x: number;
  y: number;
  z: number;
}

export default function ParticleOrb() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const SIZE = 1000;
    const dpr = window.devicePixelRatio ?? 1;
    canvas.width = SIZE * dpr;
    canvas.height = SIZE * dpr;
    canvas.style.width = `${SIZE}px`;
    canvas.style.height = `${SIZE}px`;
    ctx.scale(dpr, dpr);

    const RADIUS = 200;
    const PARTICLE_COUNT = 1000;
    const FOCAL = 5000;
    const DEPTH = 700;

    // Generate particles on sphere surface + slight interior scatter
    const particles: Particle[] = Array.from({ length: PARTICLE_COUNT }, () => {
      const r = RADIUS * (0.85 + Math.random() * 0.15);
      const theta = Math.acos(2 * Math.random() - 1);
      const phi = Math.random() * Math.PI * 2;
      return {
        x: r * Math.sin(theta) * Math.cos(phi),
        y: r * Math.sin(theta) * Math.sin(phi),
        z: r * Math.cos(theta),
      };
    });

    // Slow noise state for organic drift
    let rotX = 0;
    let rotY = 0;
    let noiseX = 0;
    let noiseY = 0;
    let rafId: number;

    const draw = () => {
      ctx.clearRect(0, 0, SIZE, SIZE);

      // Drift noise
      noiseX += 0.003;
      noiseY += 0.002;
      rotY += 0.004 + Math.sin(noiseX) * 0.002;
      rotX += 0.001 + Math.cos(noiseY) * 0.001;

      const cosY = Math.cos(rotY),
        sinY = Math.sin(rotY);
      const cosX = Math.cos(rotX),
        sinX = Math.sin(rotX);

      // Project + sort back-to-front
      const projected = particles.map((p) => {
        // Rotate Y
        const x1 = p.x * cosY - p.z * sinY;
        const z1 = p.x * sinY + p.z * cosY;
        // Rotate X
        const y2 = p.y * cosX - z1 * sinX;
        const z2 = p.y * sinX + z1 * cosX;

        const scale = FOCAL / (FOCAL + z2 + DEPTH);
        return {
          sx: SIZE / 2 + x1 * scale,
          sy: SIZE / 2 + y2 * scale,
          z: z2,
          scale,
        };
      });

      projected.sort((a, b) => a.z - b.z);

      for (const p of projected) {
        // Depth-based opacity and size
        const t = (p.z + RADIUS) / (RADIUS * 2); // 0 = back, 1 = front
        const alpha = 0.15 + t * 0.55;
        const size = p.scale * 4.8;

        // Distance from center for edge fade
        const dx = p.sx - SIZE / 2;
        const dy = p.sy - SIZE / 2;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const edgeFade = Math.max(0, 1 - dist / (RADIUS * 1.05));

        ctx.globalAlpha = alpha * edgeFade;
        ctx.fillStyle = "#9406ec"; // neutral gray — swap to your brand color if desired

        // Draw cross/T shape (two thin rects)
        const w = size * 2.2;
        const h = size * 0.3;
        ctx.fillRect(p.sx - w / 2, p.sy - h / 2, w, h); // horizontal
        ctx.fillRect(p.sx - h / 2, p.sy - w / 2, h, w); // vertical
      }

      ctx.globalAlpha = 1;
      rafId = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(rafId);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{ width: "100%", height: "100%" }}
    />
  );
}
