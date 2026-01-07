import React from 'react';
import airwaveLogo from '@/assets/airwave-logo.png';
import { cn } from '@/lib/utils';

interface StatusBarProps {
  clarity: number;
  mode: 'neutralizing' | 'closure' | 'stable';
}

const MODE_LABELS: Record<string, string> = {
  neutralizing: 'Neutralizing',
  closure: 'Closure',
  stable: 'Stable',
};

export function StatusBar({ clarity, mode }: StatusBarProps) {
  return (
    <header className="flex items-center justify-between px-6 py-4">
      <div className="flex items-center gap-3">
        <img
          src={airwaveLogo}
          alt="Airwave"
          className="h-8 w-auto"
        />
        <span className="text-sm font-medium text-muted-foreground tracking-wide">
          Soundscape Lab
        </span>
      </div>
      
      <div className="flex items-center gap-4">
        <div className="status-pill flex items-center gap-2">
          <span className="text-muted-foreground">Clarity</span>
          <span className="font-medium tabular-nums">
            {(clarity * 100).toFixed(0)}%
          </span>
        </div>
        
        <div
          className={cn(
            'status-pill flex items-center gap-2',
            mode === 'stable' && 'bg-primary/20 text-primary',
            mode === 'closure' && 'bg-accent/30 text-accent-foreground'
          )}
        >
          <span
            className={cn(
              'w-2 h-2 rounded-full',
              mode === 'neutralizing' && 'bg-muted-foreground',
              mode === 'closure' && 'bg-accent animate-pulse',
              mode === 'stable' && 'bg-primary'
            )}
          />
          <span className="font-medium">{MODE_LABELS[mode]}</span>
        </div>
      </div>
    </header>
  );
}
