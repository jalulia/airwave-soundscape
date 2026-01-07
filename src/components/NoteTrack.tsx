import React from 'react';
import { Note, ScentTrack } from '@/hooks/useSoundscapeState';
import { ScentVariant } from '@/audio/SoundEngine';
import { Play, Pause, Trash2, Music } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface NoteTrackProps {
  track: ScentTrack;
  isCurrentScent: boolean;
  onToggleLoop: () => void;
  onClear: () => void;
  onDeleteNote: (noteId: string) => void;
}

const SCENT_COLORS: Record<ScentVariant, string> = {
  'mandarin-cedarwood': 'bg-orange-400/60',
  'eucalyptus-hinoki': 'bg-teal-400/60',
  'bergamot-amber': 'bg-amber-400/60',
  'blacktea-palo': 'bg-stone-400/60',
};

const SCENT_LABELS: Record<ScentVariant, string> = {
  'mandarin-cedarwood': 'Mandarin',
  'eucalyptus-hinoki': 'Eucalyptus',
  'bergamot-amber': 'Bergamot',
  'blacktea-palo': 'Black Tea',
};

export function NoteTrack({ 
  track, 
  isCurrentScent,
  onToggleLoop, 
  onClear,
  onDeleteNote 
}: NoteTrackProps) {
  const hasNotes = track.notes.length > 0;

  return (
    <div className={`
      rounded-lg border p-3 transition-all duration-200
      ${isCurrentScent 
        ? 'border-airwave-teal/40 bg-airwave-teal/5' 
        : 'border-border/30 bg-muted/20'
      }
      ${track.isPlaying ? 'ring-1 ring-airwave-teal/30' : ''}
    `}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${SCENT_COLORS[track.scent]}`} />
          <span className="text-xs font-medium">
            {SCENT_LABELS[track.scent]}
          </span>
          {isCurrentScent && (
            <span className="text-[10px] text-airwave-teal uppercase">Active</span>
          )}
        </div>
        
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={onToggleLoop}
            disabled={!hasNotes}
          >
            {track.isPlaying ? (
              <Pause className="h-3 w-3" />
            ) : (
              <Play className="h-3 w-3" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-muted-foreground hover:text-destructive"
            onClick={onClear}
            disabled={!hasNotes}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Note visualization */}
      <div className="flex items-center gap-1 min-h-[24px]">
        {hasNotes ? (
          track.notes.map((note, i) => (
            <button
              key={note.id}
              onClick={() => onDeleteNote(note.id)}
              className={`
                w-4 h-4 rounded-full transition-all duration-200
                hover:scale-125 hover:opacity-70 cursor-pointer
                ${SCENT_COLORS[track.scent]}
                ${track.isPlaying ? 'animate-pulse' : ''}
              `}
              style={{
                animationDelay: `${i * 150}ms`,
              }}
              title="Click to remove"
            />
          ))
        ) : (
          <span className="text-[10px] text-muted-foreground italic flex items-center gap-1">
            <Music className="h-3 w-3" />
            Capture notes to build loop
          </span>
        )}
      </div>
    </div>
  );
}
