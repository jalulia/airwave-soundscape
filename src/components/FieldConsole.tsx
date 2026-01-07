import React from 'react';
import { ScentVariant } from '@/audio/SoundEngine';
import { ScentTrack } from '@/hooks/useSoundscapeState';
import { ScentSelector } from './ScentSelector';
import { FocusDial } from './FocusDial';
import { FloatingNoteIndicator } from './FloatingNoteIndicator';
import { NoteTrack } from './NoteTrack';
import { Slider } from '@/components/ui/slider';

interface FieldConsoleProps {
  scent: ScentVariant;
  onScentChange: (scent: ScentVariant) => void;
  focus: number;
  onFocusChange: (value: number) => void;
  sprayStrength: number;
  onSprayStrengthChange: (value: number) => void;
  floatingNoteCount: number;
  tracks: Record<ScentVariant, ScentTrack>;
  onToggleTrackLoop: (scent: ScentVariant) => void;
  onClearTrack: (scent: ScentVariant) => void;
  onDeleteNote: (scent: ScentVariant, noteId: string) => void;
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
  floatingNoteCount,
  tracks,
  onToggleTrackLoop,
  onClearTrack,
  onDeleteNote,
}: FieldConsoleProps) {
  const scents: ScentVariant[] = [
    'mandarin-cedarwood',
    'eucalyptus-hinoki',
    'bergamot-amber',
    'blacktea-palo',
  ];

  return (
    <div className="glass-panel h-full flex flex-col gap-4 p-4 overflow-y-auto">
      {/* Section: Scent Profile */}
      <section>
        <h3 className="control-label mb-2">Scent Profile</h3>
        <ScentSelector value={scent} onChange={onScentChange} />
        <p className="text-xs text-muted-foreground mt-2 italic">
          {SCENT_DESCRIPTIONS[scent]}
        </p>
      </section>

      <div className="h-px bg-border/40" />

      {/* Section: Tools */}
      <section>
        <h3 className="control-label mb-3">Tools</h3>
        
        <div className="flex justify-center mb-4">
          <FocusDial
            value={focus}
            onChange={onFocusChange}
            size="lg"
            label="FOCUS"
          />
        </div>

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
      </section>

      <div className="h-px bg-border/40" />

      {/* Section: Notes in Field */}
      <section>
        <FloatingNoteIndicator count={floatingNoteCount} />
        <p className="text-[10px] text-muted-foreground mt-1">
          Click floating notes to capture them
        </p>
      </section>

      <div className="h-px bg-border/40" />

      {/* Section: Scent Tracks */}
      <section className="flex-1 min-h-0">
        <h3 className="control-label mb-2">Tracks</h3>
        <p className="text-[10px] text-muted-foreground mb-3">
          Each scent has its own loop
        </p>
        <div className="space-y-2">
          {scents.map(s => (
            <NoteTrack
              key={s}
              track={tracks[s]}
              isCurrentScent={s === scent}
              onToggleLoop={() => onToggleTrackLoop(s)}
              onClear={() => onClearTrack(s)}
              onDeleteNote={(noteId) => onDeleteNote(s, noteId)}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
