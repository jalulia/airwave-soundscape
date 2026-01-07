import React from 'react';
import { Slider } from '@/components/ui/slider';

interface FineTuneSliderProps {
  value: number;
  onChange: (value: number) => void;
}

export function FineTuneSlider({ value, onChange }: FineTuneSliderProps) {
  return (
    <div className="flex flex-col gap-2 w-full">
      <span className="control-label">Fine Tune</span>
      <Slider
        value={[value * 100]}
        onValueChange={(vals) => onChange(vals[0] / 100)}
        min={0}
        max={100}
        step={1}
        className="w-full"
      />
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>Soft</span>
        <span>Crisp</span>
      </div>
    </div>
  );
}
