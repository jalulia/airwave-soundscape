import React from 'react';
import { CapturedEvent } from '@/hooks/useSoundscapeState';
import { Download, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EventsTrayProps {
  events: CapturedEvent[];
  onExport: () => void;
  onClear: () => void;
}

const SCENT_LABELS: Record<string, string> = {
  'mandarin-cedarwood': 'Mandarin + Cedar',
  'eucalyptus-hinoki': 'Eucalyptus + Hinoki',
  'bergamot-amber': 'Bergamot + Amber',
  'blacktea-palo': 'Black Tea + Palo',
};

function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

export function EventsTray({ events, onExport, onClear }: EventsTrayProps) {
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-3">
        <h3 className="control-label">Neutralized Events</h3>
        <div className="flex gap-1">
          {events.length > 0 && (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={onExport}
                title="Export JSON"
              >
                <Download className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground hover:text-destructive"
                onClick={onClear}
                title="Clear all"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </>
          )}
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto space-y-2 min-h-0">
        {events.length === 0 ? (
          <p className="text-xs text-muted-foreground italic">
            No events captured yet. Reach high clarity and press Capture.
          </p>
        ) : (
          events.slice().reverse().map((event) => (
            <div key={event.id} className="event-card">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium">
                  {formatTime(event.timestamp)}
                </span>
                <span className="text-xs text-muted-foreground tabular-nums">
                  {(event.clarity * 100).toFixed(0)}%
                </span>
              </div>
              <span className="text-xs text-muted-foreground">
                {SCENT_LABELS[event.scent]}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
