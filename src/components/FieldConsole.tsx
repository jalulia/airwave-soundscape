import React from 'react';
import { ScentVariant } from '@/audio/SoundEngine';
import { ScentTrack } from '@/hooks/useSoundscapeState';
import { ScentSelector } from './ScentSelector';
import { FocusDial } from './FocusDial';
import { FloatingNoteIndicator } from './FloatingNoteIndicator';
import { NoteTrack } from './NoteTrack';

interface FieldConsoleProps {
  scent: ScentVariant;
  onScentChange: (scent: ScentVariant) => void;
  focus: number;
  onFocusChange: (value: number) => void;
  onFocusChangeEnd?: () => void;
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
  onFocusChangeEnd,
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

      {/* Section: Focus Control */}
      <section>
        <div className="flex justify-center">
          <FocusDial
            value={focus}
            onChange={onFocusChange}
            onChangeEnd={onFocusChangeEnd}
            size="lg"
            label="FOCUS"
          />
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
        <h3 className="control-label mb-2">Loops</h3>
        <p className="text-[10px] text-muted-foreground mb-3">
          Each scent saves its own loop
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
