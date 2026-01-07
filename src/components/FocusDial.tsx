import React, { useRef, useState, useEffect, useCallback } from 'react';

interface FocusDialProps {
  value: number;
  onChange: (value: number) => void;
  size?: 'sm' | 'md' | 'lg';
  label?: string;
}

const SIZES = {
  sm: { outer: 80, inner: 60 },
  md: { outer: 100, inner: 76 },
  lg: { outer: 140, inner: 110 },
};

export function FocusDial({ value, onChange, size = 'lg', label }: FocusDialProps) {
  const dialRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const { outer, inner } = SIZES[size];
  const rotation = value * 270 - 135;

  const handleStart = useCallback((clientX: number, clientY: number) => {
    if (!dialRef.current) return;
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
    setIsDragging(false);
  }, []);

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

  return (
    <div className="flex flex-col items-center gap-3">
      {label && <span className="control-label">{label}</span>}
      <div
        ref={dialRef}
        className="dial-track relative cursor-pointer select-none"
        style={{ width: outer, height: outer }}
        onMouseDown={(e) => handleStart(e.clientX, e.clientY)}
        onTouchStart={(e) => {
          if (e.touches[0]) {
            handleStart(e.touches[0].clientX, e.touches[0].clientY);
          }
        }}
      >
        {/* Background ring with tick marks */}
        <svg
          className="absolute inset-0"
          viewBox={`0 0 ${outer} ${outer}`}
          style={{ transform: 'rotate(-135deg)' }}
        >
          {/* Tick marks */}
          {Array.from({ length: 27 }, (_, i) => {
            const angle = (i / 26) * 270;
            const radians = (angle * Math.PI) / 180;
            const isMain = i % 9 === 0;
            const innerRadius = outer / 2 - (isMain ? 14 : 10);
            const outerRadius = outer / 2 - 6;

            return (
              <line
                key={i}
                x1={outer / 2 + Math.cos(radians) * innerRadius}
                y1={outer / 2 + Math.sin(radians) * innerRadius}
                x2={outer / 2 + Math.cos(radians) * outerRadius}
                y2={outer / 2 + Math.sin(radians) * outerRadius}
                stroke="currentColor"
                strokeWidth={isMain ? 2 : 1}
                className="text-muted-foreground/40"
              />
            );
          })}

          {/* Value arc */}
          <path
            d={describeArc(outer / 2, outer / 2, outer / 2 - 10, 0, value * 270)}
            fill="none"
            stroke="hsl(var(--airwave-teal))"
            strokeWidth="3"
            strokeLinecap="round"
          />
        </svg>

        {/* Inner dial knob */}
        <div
          className="dial-knob absolute"
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
            className="absolute bg-foreground/70 rounded-full"
            style={{
              width: 3,
              height: inner / 3,
              left: '50%',
              top: '8%',
              transform: 'translateX(-50%)',
            }}
          />
        </div>

        {/* Center value display */}
        <div
          className="absolute inset-0 flex items-center justify-center pointer-events-none"
        >
          <span className="text-lg font-medium tabular-nums text-foreground/80">
            {(value * 100).toFixed(0)}
          </span>
        </div>
      </div>
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
