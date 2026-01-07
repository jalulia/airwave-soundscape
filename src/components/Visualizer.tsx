import React, { useRef, useEffect, useCallback } from 'react';
import { ScentVariant } from '@/audio/SoundEngine';
import { Glimmer } from '@/hooks/useSoundscapeState';

interface MistParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
  life: number;
  maxLife: number;
}

interface SprayNode {
  x: number;
  y: number;
  radius: number;
  opacity: number;
  particles: Array<{ x: number; y: number; vx: number; vy: number; life: number }>;
}

interface VisualizerProps {
  clarity: number;
  scent: ScentVariant;
  mode: 'neutralizing' | 'locking' | 'stable';
  activeGlimmers: Glimmer[];
  onSpray: (x: number, y: number) => void;
  onGlimmerCapture: (glimmerId: string) => void;
}

// Blue/teal misty color palettes per scent
const SCENT_COLORS: Record<ScentVariant, { primary: string; secondary: string; accent: string; mist: string }> = {
  'mandarin-cedarwood': {
    primary: 'rgba(180, 210, 230, 0.25)',
    secondary: 'rgba(200, 180, 160, 0.15)',
    accent: 'rgba(255, 200, 140, 0.7)',
    mist: 'rgba(160, 200, 220, 0.3)',
  },
  'eucalyptus-hinoki': {
    primary: 'rgba(160, 210, 220, 0.25)',
    secondary: 'rgba(140, 200, 200, 0.15)',
    accent: 'rgba(140, 220, 210, 0.7)',
    mist: 'rgba(140, 200, 210, 0.35)',
  },
  'bergamot-amber': {
    primary: 'rgba(190, 210, 200, 0.25)',
    secondary: 'rgba(180, 200, 170, 0.15)',
    accent: 'rgba(220, 210, 160, 0.7)',
    mist: 'rgba(170, 200, 190, 0.3)',
  },
  'blacktea-palo': {
    primary: 'rgba(180, 190, 210, 0.25)',
    secondary: 'rgba(160, 170, 190, 0.15)',
    accent: 'rgba(200, 180, 160, 0.7)',
    mist: 'rgba(160, 180, 200, 0.3)',
  },
};

export function Visualizer({
  clarity,
  scent,
  mode,
  activeGlimmers,
  onSpray,
  onGlimmerCapture,
}: VisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mistParticlesRef = useRef<MistParticle[]>([]);
  const sprayNodesRef = useRef<SprayNode[]>([]);
  const animationFrameRef = useRef<number>();
  const timeRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const particleCount = 50;
    mistParticlesRef.current = Array.from({ length: particleCount }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.3 - 0.15,
      size: 40 + Math.random() * 100,
      opacity: 0.15 + Math.random() * 0.2,
      life: Math.random() * 1000,
      maxLife: 1000,
    }));
  }, []);

  const spawnSprayNode = useCallback((x: number, y: number) => {
    const particles = Array.from({ length: 10 }, () => ({
      x, y,
      vx: (Math.random() - 0.5) * 2.5,
      vy: (Math.random() - 0.5) * 2.5 - 0.8,
      life: 1,
    }));
    sprayNodesRef.current.push({ x, y, radius: 0, opacity: 0.5, particles });
  }, []);

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      const x = (e.clientX - rect.left) * scaleX / window.devicePixelRatio;
      const y = (e.clientY - rect.top) * scaleY / window.devicePixelRatio;
      const normalizedX = (e.clientX - rect.left) / rect.width;
      const normalizedY = (e.clientY - rect.top) / rect.height;

      const clickedGlimmer = activeGlimmers.find(g => {
        const gx = g.x * rect.width;
        const gy = g.y * rect.height;
        const dist = Math.sqrt(((e.clientX - rect.left) - gx) ** 2 + ((e.clientY - rect.top) - gy) ** 2);
        return dist < 35;
      });

      if (clickedGlimmer) {
        onGlimmerCapture(clickedGlimmer.id);
        return;
      }

      spawnSprayNode(x, y);
      onSpray(normalizedX, normalizedY);
    },
    [activeGlimmers, onSpray, onGlimmerCapture, spawnSprayNode]
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * window.devicePixelRatio;
      canvas.height = rect.height * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    const colors = SCENT_COLORS[scent];

    const animate = () => {
      const width = canvas.width / window.devicePixelRatio;
      const height = canvas.height / window.devicePixelRatio;
      const centerX = width / 2;
      const centerY = height / 2;
      timeRef.current += 0.016;
      const time = timeRef.current;

      // Background gradient
      const bgGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, Math.max(width, height) * 0.7);
      bgGradient.addColorStop(0, 'rgba(248, 252, 255, 1)');
      bgGradient.addColorStop(1, 'rgba(235, 245, 250, 1)');
      ctx.fillStyle = bgGradient;
      ctx.fillRect(0, 0, width, height);

      // Layer 1: Mist particles (blue/teal cloudy)
      const mistDensity = 1 - clarity * 0.6;
      mistParticlesRef.current.forEach(particle => {
        particle.x += particle.vx + Math.sin(time * 0.4 + particle.y * 0.008) * 0.25;
        particle.y += particle.vy + Math.cos(time * 0.25 + particle.x * 0.008) * 0.15;

        if (particle.x < -particle.size) particle.x = width + particle.size;
        if (particle.x > width + particle.size) particle.x = -particle.size;
        if (particle.y < -particle.size) particle.y = height + particle.size;
        if (particle.y > height + particle.size) particle.y = -particle.size;

        const gradient = ctx.createRadialGradient(particle.x, particle.y, 0, particle.x, particle.y, particle.size);
        const opacityMod = particle.opacity * mistDensity;
        gradient.addColorStop(0, colors.mist.replace('0.3', String(opacityMod)));
        gradient.addColorStop(0.4, colors.primary.replace('0.25', String(opacityMod * 0.6)));
        gradient.addColorStop(1, 'transparent');

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fill();
      });

      // Layer 2: Interference rings
      const ringCount = 6;
      const maxRingRadius = Math.min(width, height) * 0.38;
      const wobbleAmount = (1 - clarity) * 12;

      ctx.strokeStyle = `rgba(100, 160, 180, ${0.12 + clarity * 0.18})`;
      ctx.lineWidth = 1;

      for (let i = 0; i < ringCount; i++) {
        const baseRadius = (maxRingRadius / ringCount) * (i + 1);
        const wobble = Math.sin(time * 1.8 + i * 0.4) * wobbleAmount;
        const jitter = (1 - clarity) * (Math.random() - 0.5) * 4;

        ctx.beginPath();
        ctx.arc(centerX + jitter, centerY + jitter, baseRadius + wobble, 0, Math.PI * 2);
        ctx.stroke();

        if (clarity > 0.35) {
          const tickCount = 12;
          for (let t = 0; t < tickCount; t++) {
            const angle = (t / tickCount) * Math.PI * 2;
            const innerR = baseRadius + wobble - 3;
            const outerR = baseRadius + wobble + 3;
            ctx.beginPath();
            ctx.moveTo(centerX + Math.cos(angle) * innerR, centerY + Math.sin(angle) * innerR);
            ctx.lineTo(centerX + Math.cos(angle) * outerR, centerY + Math.sin(angle) * outerR);
            ctx.stroke();
          }
        }
      }

      // Stable mode glow
      if (mode === 'stable') {
        const glowGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, maxRingRadius);
        glowGradient.addColorStop(0, 'rgba(140, 210, 200, 0.12)');
        glowGradient.addColorStop(0.6, 'rgba(140, 210, 200, 0.04)');
        glowGradient.addColorStop(1, 'transparent');
        ctx.fillStyle = glowGradient;
        ctx.fillRect(0, 0, width, height);
      }

      // Layer 3: Spray nodes (blue misty ripples)
      sprayNodesRef.current = sprayNodesRef.current.filter(node => {
        node.radius += 2.5;
        node.opacity *= 0.95;

        // Ripple ring - blue tinted
        ctx.strokeStyle = `rgba(120, 180, 200, ${node.opacity * 0.6})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
        ctx.stroke();

        // Inner mist burst
        const mistGrad = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, node.radius * 0.6);
        mistGrad.addColorStop(0, `rgba(180, 220, 240, ${node.opacity * 0.3})`);
        mistGrad.addColorStop(1, 'transparent');
        ctx.fillStyle = mistGrad;
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius * 0.6, 0, Math.PI * 2);
        ctx.fill();

        // Particles - blue/white sparkles
        node.particles = node.particles.filter(p => {
          p.x += p.vx;
          p.y += p.vy;
          p.vy += 0.03;
          p.life *= 0.94;

          if (p.life > 0.1) {
            const pGrad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, 4 + p.life * 4);
            pGrad.addColorStop(0, `rgba(220, 240, 255, ${p.life * 0.8})`);
            pGrad.addColorStop(0.5, `rgba(160, 200, 220, ${p.life * 0.4})`);
            pGrad.addColorStop(1, 'transparent');
            ctx.fillStyle = pGrad;
            ctx.beginPath();
            ctx.arc(p.x, p.y, 4 + p.life * 4, 0, Math.PI * 2);
            ctx.fill();
          }
          return p.life > 0.05;
        });

        return node.opacity > 0.05;
      });

      // Layer 4: Glimmer targets
      activeGlimmers.forEach(glimmer => {
        const gx = glimmer.x * width;
        const gy = glimmer.y * height;
        const age = (Date.now() - glimmer.spawnTime) / 1000;
        const pulse = Math.sin(age * 4) * 0.3 + 0.7;
        const fadeIn = Math.min(age * 2, 1);

        const glowGradient = ctx.createRadialGradient(gx, gy, 0, gx, gy, 28);
        glowGradient.addColorStop(0, `rgba(255, 255, 255, ${0.9 * pulse * fadeIn})`);
        glowGradient.addColorStop(0.35, `rgba(180, 230, 240, ${0.5 * pulse * fadeIn})`);
        glowGradient.addColorStop(1, 'transparent');
        ctx.fillStyle = glowGradient;
        ctx.beginPath();
        ctx.arc(gx, gy, 28, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = `rgba(255, 255, 255, ${0.95 * fadeIn})`;
        ctx.beginPath();
        ctx.arc(gx, gy, 4 + pulse * 2, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = `rgba(200, 240, 255, ${0.6 * pulse * fadeIn})`;
        ctx.lineWidth = 1.5;
        for (let r = 0; r < 4; r++) {
          const angle = (r / 4) * Math.PI * 2 + age;
          ctx.beginPath();
          ctx.moveTo(gx + Math.cos(angle) * 6, gy + Math.sin(angle) * 6);
          ctx.lineTo(gx + Math.cos(angle) * (12 + pulse * 4), gy + Math.sin(angle) * (12 + pulse * 4));
          ctx.stroke();
        }
      });

      // Subtle grid
      ctx.strokeStyle = 'rgba(140, 180, 200, 0.04)';
      ctx.lineWidth = 1;
      const gridSize = 50;
      for (let x = 0; x < width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [clarity, scent, mode, activeGlimmers]);

  return (
    <canvas
      ref={canvasRef}
      onClick={handleClick}
      className="w-full h-full cursor-crosshair rounded-lg"
      style={{ touchAction: 'none' }}
    />
  );
}
