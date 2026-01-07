import React from 'react';
import airwaveLogo from '@/assets/airwave-logo.png';
import { Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface StatusBarProps {
  clarity: number;
  mode: 'neutralizing' | 'locking' | 'stable';
  isAudioStarted: boolean;
  onToggleAudio: () => void;
}

const MODE_LABELS: Record<string, { label: string; className: string }> = {
  neutralizing: { label: 'Neutralizing', className: 'bg-airwave-sky/20 text-airwave-sky' },
  locking: { label: 'Locking', className: 'bg-amber-500/20 text-amber-600' },
  stable: { label: 'Stable', className: 'bg-airwave-teal/20 text-airwave-teal' },
};

export function StatusBar({ clarity, mode, isAudioStarted, onToggleAudio }: StatusBarProps) {
  const modeInfo = MODE_LABELS[mode] || MODE_LABELS.neutralizing;

  return (
    <div className="glass-panel flex items-center justify-between px-5 py-3">
      <div className="flex items-center gap-3">
        <img src={airwaveLogo} alt="Airwave" className="h-7 w-auto" />
        <span className="text-sm font-medium text-foreground/80 tracking-wide">
          Soundscape Lab
        </span>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex flex-col items-end gap-1">
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
            Clarity
          </span>
          <div className="flex items-center gap-2">
            <div className="w-20 h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-airwave-sky to-airwave-teal rounded-full transition-all duration-300"
                style={{ width: `${clarity * 100}%` }}
              />
            </div>
            <span className="text-xs font-medium tabular-nums w-8 text-right">
              {(clarity * 100).toFixed(0)}%
            </span>
          </div>
        </div>

        <div className={`status-pill ${modeInfo.className}`}>
          {modeInfo.label}
        </div>

        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onToggleAudio}>
          {isAudioStarted ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4 text-muted-foreground" />}
        </Button>
      </div>
    </div>
  );
}
