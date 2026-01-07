import React from 'react';
import { ScentVariant } from '@/audio/SoundEngine';
import { Moment } from '@/hooks/useSoundscapeState';
import { ScentSelector } from './ScentSelector';
import { FocusDial } from './FocusDial';
import { GlimmerIndicator } from './GlimmerIndicator';
import { MomentsList } from './MomentsList';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Camera } from 'lucide-react';

interface FieldConsoleProps {
  scent: ScentVariant;
  onScentChange: (scent: ScentVariant) => void;
  focus: number;
  onFocusChange: (value: number) => void;
  sprayStrength: number;
  onSprayStrengthChange: (value: number) => void;
  glimmersCollected: number;
  isLocked: boolean;
  onCaptureMoment: () => void;
  moments: Moment[];
  onRenameMoment: (id: string, name: string) => void;
  onDeleteMoment: (id: string) => void;
}

const SCENT_DESCRIPTIONS: Record<ScentVariant, string> = {
  'mandarin-cedarwood': 'Warm citrus, clean wood',
  'eucalyptus-hinoki': 'Cool, breathable, spa-wood',
  'bergamot-amber': 'Bright citrus, smooth amber',
  'blacktea-palo': 'Dark tea, soft sacred wood',
};

export function FieldConsole({
  scent,
  onScentChange,
  focus,
  onFocusChange,
  sprayStrength,
  onSprayStrengthChange,
  glimmersCollected,
  isLocked,
  onCaptureMoment,
  moments,
  onRenameMoment,
  onDeleteMoment,
}: FieldConsoleProps) {
  return (
    <div className="glass-panel h-full flex flex-col gap-5 p-5 overflow-y-auto">
      {/* Section: Scent Profile */}
      <section>
        <h3 className="control-label mb-3">Scent Profile</h3>
        <ScentSelector value={scent} onChange={onScentChange} />
        <p className="text-xs text-muted-foreground mt-2 italic">
          {SCENT_DESCRIPTIONS[scent]}
        </p>
      </section>

      <div className="h-px bg-border/50" />

      {/* Section: Tools */}
      <section>
        <h3 className="control-label mb-4">Tools</h3>
        
        <div className="flex justify-center mb-5">
          <FocusDial
            value={focus}
            onChange={onFocusChange}
            size="lg"
            label="FOCUS"
          />
        </div>

        <div className="space-y-4">
          <div className="flex flex-col gap-2">
            <span className="text-xs text-muted-foreground uppercase tracking-wider">
              Spray Strength
            </span>
            <Slider
              value={[sprayStrength * 100]}
              onValueChange={(vals) => onSprayStrengthChange(vals[0] / 100)}
              min={0}
              max={100}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span>Soft</span>
              <span>Strong</span>
            </div>
          </div>
        </div>
      </section>

      <div className="h-px bg-border/50" />

      {/* Section: Glimmer Capture */}
      <section>
        <GlimmerIndicator collected={glimmersCollected} />
        
        <Button
          className="w-full mt-3"
          variant={isLocked ? 'default' : 'outline'}
          disabled={!isLocked}
          onClick={onCaptureMoment}
        >
          <Camera className="h-4 w-4 mr-2" />
          Capture Moment
        </Button>
      </section>

      <div className="h-px bg-border/50" />

      {/* Section: Moments */}
      <section className="flex-1 min-h-0">
        <h3 className="control-label mb-3">Moments</h3>
        <MomentsList
          moments={moments}
          onRename={onRenameMoment}
          onDelete={onDeleteMoment}
        />
      </section>
    </div>
  );
}
