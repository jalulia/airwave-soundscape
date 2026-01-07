import React from 'react';
import { Sparkles } from 'lucide-react';

interface GlimmerIndicatorProps {
  collected: number;
  total?: number;
}

export function GlimmerIndicator({ collected, total = 3 }: GlimmerIndicatorProps) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <Sparkles className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="control-label">Glimmers</span>
      </div>
      <div className="flex gap-2">
        {Array.from({ length: total }, (_, i) => (
          <div
            key={i}
            className={`
              w-6 h-6 rounded-full border-2 transition-all duration-300
              flex items-center justify-center
              ${i < collected
                ? 'bg-airwave-teal/20 border-airwave-teal shadow-[0_0_8px_hsl(var(--airwave-teal)/0.4)]'
                : 'bg-muted/30 border-muted-foreground/20'
              }
            `}
          >
            {i < collected && (
              <div className="w-2 h-2 rounded-full bg-airwave-teal animate-pulse" />
            )}
          </div>
        ))}
      </div>
      {collected >= total && (
        <span className="text-xs text-airwave-teal font-medium animate-fade-in">
          LOCK READY
        </span>
      )}
    </div>
  );
}
