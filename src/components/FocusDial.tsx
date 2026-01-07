import React, { useRef, useState, useEffect, useCallback } from 'react';

interface FocusDialProps {
  value: number;
  onChange: (value: number) => void;
  onChangeEnd?: () => void;
  size?: 'sm' | 'md' | 'lg';
  label?: string;
}

const SIZES = {
  sm: { outer: 80, inner: 60 },
  md: { outer: 100, inner: 76 },
  lg: { outer: 130, inner: 100 },
};

export function FocusDial({ value, onChange, onChangeEnd, size = 'lg', label }: FocusDialProps) {
  const dialRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const { outer, inner } = SIZES[size];
  const rotation = value * 270 - 135;

  const handleStart = useCallback(() => {
    setIsDragging(true);
  }, []);

  const handleMove = useCallback(
    (clientX: number, clientY: number) => {
      if (!isDragging || !dialRef.current) return;

      const rect = dialRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      const angle = Math.atan2(clientY - centerY, clientX - centerX);
      const degrees = (angle * 180) / Math.PI + 90;

      let normalized = (degrees + 135) / 270;
      normalized = Math.max(0, Math.min(1, normalized));

      onChange(normalized);
    },
    [isDragging, onChange]
  );

  const handleEnd = useCallback(() => {
    if (isDragging) {
      setIsDragging(false);
      onChangeEnd?.();
    }
  }, [isDragging, onChangeEnd]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => handleMove(e.clientX, e.clientY);
    const handleMouseUp = () => handleEnd();
    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches[0]) {
        handleMove(e.touches[0].clientX, e.touches[0].clientY);
      }
    };
    const handleTouchEnd = () => handleEnd();

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('touchmove', handleTouchMove);
      window.addEventListener('touchend', handleTouchEnd);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isDragging, handleMove, handleEnd]);

  // Visual feedback based on focus level
  const glowIntensity = value * 0.4;
  const arcColor = value > 0.7 ? 'hsl(var(--airwave-teal))' : 
                   value > 0.3 ? 'hsl(180 40% 55%)' : 
                   'hsl(180 20% 60%)';

  return (
    <div className="flex flex-col items-center gap-2">
      {label && (
        <div className="flex items-center gap-2">
          <span className="control-label">{label}</span>
          <span className="text-[10px] text-muted-foreground">
            {value < 0.3 ? 'Hazy' : value < 0.7 ? 'Clearing' : 'Sharp'}
          </span>
        </div>
      )}
      <div
        ref={dialRef}
        className="dial-track relative cursor-pointer select-none transition-shadow duration-300"
        style={{ 
          width: outer, 
          height: outer,
          boxShadow: isDragging ? `0 0 ${20 + value * 20}px hsla(180, 50%, 50%, ${glowIntensity})` : undefined,
        }}
        onMouseDown={handleStart}
        onTouchStart={handleStart}
      >
        {/* Background ring with tick marks */}
        <svg
          className="absolute inset-0"
          viewBox={`0 0 ${outer} ${outer}`}
          style={{ transform: 'rotate(-135deg)' }}
        >
          {/* Tick marks - brighter as value increases */}
          {Array.from({ length: 21 }, (_, i) => {
            const angle = (i / 20) * 270;
            const radians = (angle * Math.PI) / 180;
            const isMain = i % 5 === 0;
            const isActive = (i / 20) <= value;
            const innerRadius = outer / 2 - (isMain ? 12 : 8);
            const outerRadius = outer / 2 - 4;

            return (
              <line
                key={i}
                x1={outer / 2 + Math.cos(radians) * innerRadius}
                y1={outer / 2 + Math.sin(radians) * innerRadius}
                x2={outer / 2 + Math.cos(radians) * outerRadius}
                y2={outer / 2 + Math.sin(radians) * outerRadius}
                stroke={isActive ? arcColor : 'currentColor'}
                strokeWidth={isMain ? 2 : 1}
                className={isActive ? '' : 'text-muted-foreground/30'}
                style={{
                  transition: 'stroke 0.15s ease',
                }}
              />
            );
          })}

          {/* Value arc */}
          <path
            d={describeArc(outer / 2, outer / 2, outer / 2 - 8, 0, value * 270)}
            fill="none"
            stroke={arcColor}
            strokeWidth="3"
            strokeLinecap="round"
            style={{ transition: 'stroke 0.15s ease' }}
          />
        </svg>

        {/* Inner dial knob */}
        <div
          className={`dial-knob absolute transition-transform ${isDragging ? 'scale-105' : ''}`}
          style={{
            width: inner,
            height: inner,
            left: (outer - inner) / 2,
            top: (outer - inner) / 2,
            transform: `rotate(${rotation}deg)`,
          }}
        >
          {/* Indicator line */}
          <div
            className="absolute rounded-full transition-colors"
            style={{
              width: 3,
              height: inner / 3,
              left: '50%',
              top: '10%',
              transform: 'translateX(-50%)',
              backgroundColor: arcColor,
            }}
          />
        </div>

        {/* Center value display */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <span 
            className="text-lg font-medium tabular-nums transition-colors"
            style={{ color: arcColor }}
          >
            {(value * 100).toFixed(0)}
          </span>
        </div>
      </div>
      
      {/* Helper text */}
      <p className="text-[10px] text-muted-foreground text-center max-w-[120px]">
        Higher focus reveals more notes & brightens the sound
      </p>
    </div>
  );
}

function polarToCartesian(centerX: number, centerY: number, radius: number, angleInDegrees: number) {
  const angleInRadians = (angleInDegrees * Math.PI) / 180;
  return {
    x: centerX + radius * Math.cos(angleInRadians),
    y: centerY + radius * Math.sin(angleInRadians),
  };
}

function describeArc(x: number, y: number, radius: number, startAngle: number, endAngle: number) {
  if (endAngle <= 0) return '';

  const start = polarToCartesian(x, y, radius, endAngle);
  const end = polarToCartesian(x, y, radius, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';

  return ['M', start.x, start.y, 'A', radius, radius, 0, largeArcFlag, 0, end.x, end.y].join(' ');
}
