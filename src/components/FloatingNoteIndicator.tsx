import React from 'react';
import { Music } from 'lucide-react';

interface FloatingNoteIndicatorProps {
  count: number;
}

export function FloatingNoteIndicator({ count }: FloatingNoteIndicatorProps) {
  return (
    <div className="flex items-center gap-2 text-xs text-muted-foreground">
      <Music className="h-3.5 w-3.5" />
      <span>
        {count > 0 ? (
          <span className="text-foreground">
            {count} note{count !== 1 ? 's' : ''} floating
          </span>
        ) : (
          <span className="italic">Spray to reveal notes</span>
        )}
      </span>
    </div>
  );
}
