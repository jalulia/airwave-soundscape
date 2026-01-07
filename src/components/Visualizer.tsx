import React, { useRef, useEffect, useCallback } from 'react';
import { ScentVariant } from '@/audio/SoundEngine';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
  life: number;
  maxLife: number;
}

interface Sparkle {
  x: number;
  y: number;
  size: number;
  opacity: number;
  life: number;
}

interface VisualizerProps {
  clarity: number;
  scent: ScentVariant;
  mode: 'neutralizing' | 'closure' | 'stable';
  onSpray: (x: number, y: number) => void;
}

const SCENT_COLORS: Record<ScentVariant, { primary: string; secondary: string }> = {
  'mandarin-cedarwood': { primary: 'rgba(245, 158, 66, 0.6)', secondary: 'rgba(180, 120, 80, 0.4)' },
  'eucalyptus-hinoki': { primary: 'rgba(100, 180, 160, 0.6)', secondary: 'rgba(140, 200, 180, 0.4)' },
  'bergamot-amber': { primary: 'rgba(230, 190, 80, 0.6)', secondary: 'rgba(180, 150, 100, 0.4)' },
  'blacktea-palo': { primary: 'rgba(120, 90, 70, 0.6)', secondary: 'rgba(100, 80, 70, 0.4)' },
};

export function Visualizer({ clarity, scent, mode, onSpray }: VisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const sparklesRef = useRef<Sparkle[]>([]);
  const animationRef = useRef<number>();
  const timeRef = useRef(0);
  const closureFlashRef = useRef(0);

  const spawnMistParticles = useCallback((x: number, y: number) => {
    const count = 8 + Math.floor(Math.random() * 6);
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
      const speed = 0.5 + Math.random() * 1.5;
      particlesRef.current.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1,
        size: 20 + Math.random() * 30,
        opacity: 0.4 + Math.random() * 0.3,
        life: 0,
        maxLife: 60 + Math.random() * 40,
      });
    }
    
    // Add sparkles
    const sparkleCount = 4 + Math.floor(Math.random() * 4);
    for (let i = 0; i < sparkleCount; i++) {
      sparklesRef.current.push({
        x: x + (Math.random() - 0.5) * 40,
        y: y + (Math.random() - 0.5) * 40,
        size: 2 + Math.random() * 4,
        opacity: 1,
        life: 0,
      });
    }
  }, []);

  const triggerClosureFlash = useCallback(() => {
    closureFlashRef.current = 1;
  }, []);

  useEffect(() => {
    if (mode === 'closure') {
      triggerClosureFlash();
    }
  }, [mode, triggerClosureFlash]);

  const handleClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (canvas.width / rect.width);
    const y = (e.clientY - rect.top) * (canvas.height / rect.height);
    
    spawnMistParticles(x, y);
    onSpray(x, y);
  }, [onSpray, spawnMistParticles]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
    };
    
    resize();
    window.addEventListener('resize', resize);

    const colors = SCENT_COLORS[scent];

    const animate = () => {
      const rect = canvas.getBoundingClientRect();
      const width = rect.width;
      const height = rect.height;
      
      timeRef.current += 0.016;
      const time = timeRef.current;
      
      // Clear with gradient background
      const bgGradient = ctx.createRadialGradient(
        width / 2, height / 2, 0,
        width / 2, height / 2, Math.max(width, height) * 0.7
      );
      bgGradient.addColorStop(0, 'hsl(195, 75%, 95%)');
      bgGradient.addColorStop(1, 'hsl(195, 60%, 90%)');
      ctx.fillStyle = bgGradient;
      ctx.fillRect(0, 0, width, height);
      
      // Closure flash
      if (closureFlashRef.current > 0) {
        ctx.fillStyle = `rgba(255, 255, 255, ${closureFlashRef.current * 0.3})`;
        ctx.fillRect(0, 0, width, height);
        closureFlashRef.current *= 0.92;
        if (closureFlashRef.current < 0.01) closureFlashRef.current = 0;
      }
      
      // Draw interference rings
      const centerX = width / 2;
      const centerY = height / 2;
      const maxRadius = Math.min(width, height) * 0.4;
      const ringCount = 6;
      
      for (let i = 0; i < ringCount; i++) {
        const wobble = (1 - clarity) * 20;
        const phase = time * (0.5 + i * 0.1);
        const offsetX = Math.sin(phase) * wobble;
        const offsetY = Math.cos(phase * 1.3) * wobble;
        
        const baseRadius = (maxRadius / ringCount) * (i + 1);
        const radiusWobble = Math.sin(time * 2 + i) * (1 - clarity) * 15;
        const radius = baseRadius + radiusWobble;
        
        const ringOpacity = 0.15 + clarity * 0.2 - i * 0.02;
        const strokeWidth = 1 + clarity * 1.5;
        
        ctx.beginPath();
        ctx.arc(centerX + offsetX, centerY + offsetY, radius, 0, Math.PI * 2);
        ctx.strokeStyle = `hsla(185, 50%, 55%, ${ringOpacity})`;
        ctx.lineWidth = strokeWidth;
        ctx.stroke();
        
        // Inner glow ring at high clarity
        if (clarity > 0.7) {
          ctx.beginPath();
          ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
          ctx.strokeStyle = `hsla(185, 60%, 65%, ${(clarity - 0.7) * 0.5})`;
          ctx.lineWidth = strokeWidth * 2;
          ctx.stroke();
        }
      }
      
      // Draw mist particles
      particlesRef.current = particlesRef.current.filter(p => {
        p.life++;
        if (p.life >= p.maxLife) return false;
        
        p.x += p.vx;
        p.y += p.vy;
        p.vy -= 0.02; // float upward
        p.vx *= 0.98;
        
        const lifeRatio = p.life / p.maxLife;
        const currentOpacity = p.opacity * (1 - lifeRatio);
        const currentSize = p.size * (1 + lifeRatio * 0.5);
        
        const gradient = ctx.createRadialGradient(
          p.x, p.y, 0,
          p.x, p.y, currentSize
        );
        gradient.addColorStop(0, `rgba(255, 255, 255, ${currentOpacity * 0.8})`);
        gradient.addColorStop(0.5, colors.primary.replace('0.6', String(currentOpacity * 0.4)));
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(p.x, p.y, currentSize, 0, Math.PI * 2);
        ctx.fill();
        
        return true;
      });
      
      // Draw sparkles
      sparklesRef.current = sparklesRef.current.filter(s => {
        s.life++;
        if (s.life > 20) return false;
        
        const lifeRatio = s.life / 20;
        const scale = Math.sin(lifeRatio * Math.PI);
        const currentOpacity = s.opacity * (1 - lifeRatio);
        const currentSize = s.size * scale;
        
        ctx.fillStyle = `rgba(255, 255, 255, ${currentOpacity})`;
        ctx.beginPath();
        ctx.arc(s.x, s.y, currentSize, 0, Math.PI * 2);
        ctx.fill();
        
        // Cross sparkle
        ctx.strokeStyle = `rgba(255, 255, 255, ${currentOpacity * 0.7})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(s.x - currentSize * 2, s.y);
        ctx.lineTo(s.x + currentSize * 2, s.y);
        ctx.moveTo(s.x, s.y - currentSize * 2);
        ctx.lineTo(s.x, s.y + currentSize * 2);
        ctx.stroke();
        
        return true;
      });
      
      // Ambient noise/fog overlay (decreases with clarity)
      const noiseOpacity = (1 - clarity) * 0.15;
      if (noiseOpacity > 0.01) {
        for (let i = 0; i < 50; i++) {
          const x = Math.random() * width;
          const y = Math.random() * height;
          const size = 30 + Math.random() * 60;
          const alpha = Math.random() * noiseOpacity;
          
          ctx.fillStyle = `rgba(200, 220, 230, ${alpha})`;
          ctx.beginPath();
          ctx.arc(x, y, size, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      
      // Stable mode: gentle glow at center
      if (mode === 'stable') {
        const glowRadius = maxRadius * 0.3;
        const glowGradient = ctx.createRadialGradient(
          centerX, centerY, 0,
          centerX, centerY, glowRadius
        );
        glowGradient.addColorStop(0, 'rgba(255, 255, 255, 0.2)');
        glowGradient.addColorStop(0.5, colors.primary.replace('0.6', '0.1'));
        glowGradient.addColorStop(1, 'transparent');
        
        ctx.fillStyle = glowGradient;
        ctx.beginPath();
        ctx.arc(centerX, centerY, glowRadius, 0, Math.PI * 2);
        ctx.fill();
      }
      
      animationRef.current = requestAnimationFrame(animate);
    };
    
    animate();
    
    return () => {
      window.removeEventListener('resize', resize);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [clarity, scent, mode]);

  return (
    <canvas
      ref={canvasRef}
      onClick={handleClick}
      className="w-full h-full cursor-crosshair"
      style={{ touchAction: 'none' }}
    />
  );
}
