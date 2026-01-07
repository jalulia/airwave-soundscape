import React, { useState } from 'react';
import { Moment } from '@/hooks/useSoundscapeState';
import { Play, Pencil, Trash2, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface MomentsListProps {
  moments: Moment[];
  onRename: (momentId: string, newName: string) => void;
  onDelete: (momentId: string) => void;
  onPlay?: (moment: Moment) => void;
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
  });
}

export function MomentsList({ moments, onRename, onDelete, onPlay }: MomentsListProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  const startEditing = (moment: Moment) => {
    setEditingId(moment.id);
    setEditValue(moment.name);
  };

  const confirmEdit = () => {
    if (editingId && editValue.trim()) {
      onRename(editingId, editValue.trim());
    }
    setEditingId(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditValue('');
  };

  if (moments.length === 0) {
    return (
      <p className="text-xs text-muted-foreground italic py-2">
        Capture glimmers to create moments.
      </p>
    );
  }

  return (
    <div className="space-y-2 max-h-48 overflow-y-auto">
      {moments.slice().reverse().map((moment) => (
        <div key={moment.id} className="event-card group">
          <div className="flex items-center justify-between gap-2">
            {editingId === moment.id ? (
              <div className="flex items-center gap-1 flex-1">
                <Input
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  className="h-6 text-xs py-0 px-2"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') confirmEdit();
                    if (e.key === 'Escape') cancelEdit();
                  }}
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5"
                  onClick={confirmEdit}
                >
                  <Check className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5"
                  onClick={cancelEdit}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ) : (
              <>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground tabular-nums">
                      {formatTime(moment.timestamp)}
                    </span>
                    <span className="text-xs font-medium truncate">
                      {moment.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] text-muted-foreground">
                      {SCENT_LABELS[moment.scent]}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      •
                    </span>
                    <span className="text-[10px] text-muted-foreground tabular-nums">
                      {(moment.clarity * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>
                <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  {onPlay && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => onPlay(moment)}
                    >
                      <Play className="h-3 w-3" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => startEditing(moment)}
                  >
                    <Pencil className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-muted-foreground hover:text-destructive"
                    onClick={() => onDelete(moment.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
