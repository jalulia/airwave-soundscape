import React from 'react';
import { ScentVariant } from '@/audio/SoundEngine';
import { cn } from '@/lib/utils';

interface ScentSelectorProps {
  value: ScentVariant;
  onChange: (scent: ScentVariant) => void;
}

const SCENT_OPTIONS: { id: ScentVariant; label: string; description: string }[] = [
  { id: 'mandarin-cedarwood', label: 'Mandarin + Cedarwood', description: 'Warm citrus, clean wood' },
  { id: 'eucalyptus-hinoki', label: 'Eucalyptus + Hinoki', description: 'Cool, breathable, spa-wood' },
  { id: 'bergamot-amber', label: 'Bergamot + Amber Moss', description: 'Bright citrus, smooth amber' },
  { id: 'blacktea-palo', label: 'Black Tea + Palo Santo', description: 'Dark tea, sacred wood' },
];

export function ScentSelector({ value, onChange }: ScentSelectorProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {SCENT_OPTIONS.map((scent) => (
        <button
          key={scent.id}
          onClick={() => onChange(scent.id)}
          className={cn(
            'scent-pill',
            value === scent.id && 'scent-pill-active'
          )}
          title={scent.description}
        >
          {scent.label}
        </button>
      ))}
    </div>
  );
}
