import React, { useEffect, useCallback, useRef } from 'react';
import { soundEngine } from '@/audio/SoundEngine';
import { useSoundscapeState } from '@/hooks/useSoundscapeState';
import { Visualizer } from '@/components/Visualizer';
import { StatusBar } from '@/components/StatusBar';
import { FieldConsole } from '@/components/FieldConsole';

export default function Index() {
  const state = useSoundscapeState();
  const prevPlayingTracksRef = useRef<Record<string, boolean>>({});

  useEffect(() => {
    soundEngine.initialize();
    return () => soundEngine.dispose();
  }, []);

  useEffect(() => {
    soundEngine.applyScent(state.scent);
  }, [state.scent]);

  // Focus affects the audio
  useEffect(() => {
    soundEngine.updateFocus(state.focus);
  }, [state.focus]);

  // Note count affects ambient bed richness
  useEffect(() => {
    const totalNotes = Object.values(state.tracks).reduce(
      (sum, track) => sum + track.notes.length, 0
    );
    soundEngine.setNoteCount(totalNotes);
  }, [state.tracks]);

  // Handle track loop playback
  useEffect(() => {
    Object.values(state.tracks).forEach(track => {
      const wasPlaying = prevPlayingTracksRef.current[track.scent];
      const isPlaying = track.isPlaying && track.notes.length > 0;
      
      if (isPlaying && !wasPlaying) {
        soundEngine.startLoop(
          track.notes.map(n => ({ x: n.x, y: n.y })),
          track.scent
        );
      } else if (!isPlaying && wasPlaying) {
        soundEngine.stopLoop();
      }
      
      prevPlayingTracksRef.current[track.scent] = isPlaying;
    });
  }, [state.tracks]);

  const toggleAudio = useCallback(async () => {
    if (state.isAudioStarted) {
      soundEngine.stop();
      state.setAudioStarted(false);
    } else {
      await soundEngine.initialize();
      soundEngine.start();
      state.setAudioStarted(true);
    }
  }, [state.isAudioStarted, state.setAudioStarted]);

  const handleSpray = useCallback(
    (x: number, y: number) => {
      if (!state.isAudioStarted) {
        soundEngine.initialize().then(() => {
          soundEngine.start();
          state.setAudioStarted(true);
        });
      }
      soundEngine.playSprayClick(x, y);
      state.incrementClarity();
    },
    [state.isAudioStarted, state.setAudioStarted, state.incrementClarity]
  );

  const handleCaptureNote = useCallback(
    (noteId: string) => {
      const note = state.floatingNotes.find(n => n.id === noteId);
      if (note) {
        soundEngine.playNoteCapture(note.x, note.y);
      }
      state.captureNote(noteId);
    },
    [state.floatingNotes, state.captureNote]
  );

  const handleFocusChangeEnd = useCallback(() => {
    soundEngine.playFocusChange(state.focus);
  }, [state.focus]);

  // Map mode for StatusBar
  const statusMode = state.mode === 'looping' ? 'stable' 
    : state.mode === 'collecting' ? 'locking' 
    : 'neutralizing';

  return (
    <div className="h-screen w-full flex flex-col bg-gradient-to-br from-airwave-cream via-background to-airwave-sky/10">
      <StatusBar
        clarity={state.clarity}
        mode={statusMode}
        isAudioStarted={state.isAudioStarted}
        onToggleAudio={toggleAudio}
      />

      <div className="flex-1 flex min-h-0 p-4 gap-4">
        <div className="w-72 shrink-0">
          <FieldConsole
            scent={state.scent}
            onScentChange={state.setScent}
            focus={state.focus}
            onFocusChange={state.setFocus}
            onFocusChangeEnd={handleFocusChangeEnd}
            floatingNoteCount={state.floatingNotes.length}
            tracks={state.tracks}
            onToggleTrackLoop={state.toggleTrackLoop}
            onClearTrack={state.clearTrack}
            onDeleteNote={state.deleteNote}
          />
        </div>

        <div className="flex-1 glass-panel p-2 relative">
          <Visualizer
            clarity={state.clarity}
            focus={state.focus}
            scent={state.scent}
            mode={state.mode}
            floatingNotes={state.floatingNotes}
            onSpray={handleSpray}
            onCaptureNote={handleCaptureNote}
          />

          {!state.isAudioStarted && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="glass-panel px-6 py-3 animate-fade-in">
                <p className="text-sm text-muted-foreground">
                  Click anywhere to start
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
