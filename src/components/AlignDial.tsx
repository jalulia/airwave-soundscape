import React, { useRef, useState, useCallback, useEffect } from 'react';

interface AlignDialProps {
  value: number;
  onChange: (value: number) => void;
  size?: 'sm' | 'md' | 'lg';
  label?: string;
}

const SIZES = {
  sm: { outer: 60, inner: 48 },
  md: { outer: 100, inner: 80 },
  lg: { outer: 140, inner: 112 },
};

export function AlignDial({ value, onChange, size = 'lg', label }: AlignDialProps) {
  const dialRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  
  const { outer, inner } = SIZES[size];
  
  // Convert value (0-1) to rotation angle (-135 to 135 degrees)
  const rotation = -135 + value * 270;
  
  const handleStart = useCallback((clientX: number, clientY: number) => {
    setIsDragging(true);
  }, []);
  
  const handleMove = useCallback((clientX: number, clientY: number) => {
    if (!isDragging || !dialRef.current) return;
    
    const rect = dialRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    const angle = Math.atan2(clientY - centerY, clientX - centerX);
    const degrees = (angle * 180) / Math.PI + 90;
    
    // Map degrees to value (0-1)
    let normalized = (degrees + 135) / 270;
    normalized = Math.max(0, Math.min(1, normalized));
    
    onChange(normalized);
  }, [isDragging, onChange]);
  
  const handleEnd = useCallback(() => {
    setIsDragging(false);
  }, []);
  
  useEffect(() => {
    if (!isDragging) return;
    
    const onMouseMove = (e: MouseEvent) => handleMove(e.clientX, e.clientY);
    const onMouseUp = () => handleEnd();
    const onTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      handleMove(e.touches[0].clientX, e.touches[0].clientY);
    };
    const onTouchEnd = () => handleEnd();
    
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    window.addEventListener('touchmove', onTouchMove, { passive: false });
    window.addEventListener('touchend', onTouchEnd);
    
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
    };
  }, [isDragging, handleMove, handleEnd]);
  
  // Generate tick marks
  const ticks = [];
  for (let i = 0; i <= 10; i++) {
    const angle = -135 + i * 27;
    const isMainTick = i % 5 === 0;
    ticks.push({ angle, isMain: isMainTick });
  }
  
  return (
    <div className="flex flex-col items-center gap-2">
      {label && (
        <span className="control-label">{label}</span>
      )}
      <div
        ref={dialRef}
        className="relative select-none cursor-pointer"
        style={{ width: outer, height: outer }}
        onMouseDown={(e) => handleStart(e.clientX, e.clientY)}
        onTouchStart={(e) => handleStart(e.touches[0].clientX, e.touches[0].clientY)}
      >
        {/* Track background */}
        <div
          className="absolute inset-0 dial-track"
          style={{ borderRadius: '50%' }}
        />
        
        {/* Tick marks */}
        <svg
          className="absolute inset-0 w-full h-full"
          viewBox={`0 0 ${outer} ${outer}`}
        >
          {ticks.map((tick, i) => {
            const radians = (tick.angle * Math.PI) / 180;
            const outerR = outer / 2 - 4;
            const innerR = outerR - (tick.isMain ? 8 : 5);
            const x1 = outer / 2 + Math.sin(radians) * innerR;
            const y1 = outer / 2 - Math.cos(radians) * innerR;
            const x2 = outer / 2 + Math.sin(radians) * outerR;
            const y2 = outer / 2 - Math.cos(radians) * outerR;
            
            return (
              <line
                key={i}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke="hsl(var(--muted-foreground))"
                strokeWidth={tick.isMain ? 2 : 1}
                strokeOpacity={tick.isMain ? 0.6 : 0.3}
              />
            );
          })}
        </svg>
        
        {/* Knob */}
        <div
          className="absolute dial-knob transition-shadow"
          style={{
            width: inner,
            height: inner,
            left: (outer - inner) / 2,
            top: (outer - inner) / 2,
            transform: `rotate(${rotation}deg)`,
            boxShadow: isDragging
              ? '0 4px 16px hsl(200 30% 20% / 0.25)'
              : undefined,
          }}
        >
          {/* Indicator line */}
          <div
            className="absolute left-1/2 -translate-x-1/2 bg-primary rounded-full"
            style={{
              width: 3,
              height: inner * 0.25,
              top: 6,
            }}
          />
        </div>
        
        {/* Value arc */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none"
          viewBox={`0 0 ${outer} ${outer}`}
        >
          <path
            d={describeArc(outer / 2, outer / 2, outer / 2 - 2, -135, rotation)}
            fill="none"
            stroke="hsl(var(--primary))"
            strokeWidth={3}
            strokeLinecap="round"
            opacity={0.7}
          />
        </svg>
      </div>
      
      {/* Value display */}
      <span className="text-sm font-medium text-foreground tabular-nums">
        {(value * 100).toFixed(0)}%
      </span>
    </div>
  );
}

function polarToCartesian(centerX: number, centerY: number, radius: number, angleInDegrees: number) {
  const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180;
  return {
    x: centerX + radius * Math.cos(angleInRadians),
    y: centerY + radius * Math.sin(angleInRadians),
  };
}

function describeArc(x: number, y: number, radius: number, startAngle: number, endAngle: number) {
  const start = polarToCartesian(x, y, radius, endAngle);
  const end = polarToCartesian(x, y, radius, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? 0 : 1;
  
  return [
    'M', start.x, start.y,
    'A', radius, radius, 0, largeArcFlag, 0, end.x, end.y,
  ].join(' ');
}
