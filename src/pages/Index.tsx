import React, { useEffect, useCallback, useRef } from 'react';
import { soundEngine } from '@/audio/SoundEngine';
import { useSoundscapeState } from '@/hooks/useSoundscapeState';
import { Visualizer } from '@/components/Visualizer';
import { StatusBar } from '@/components/StatusBar';
import { FieldConsole } from '@/components/FieldConsole';

export default function Index() {
  const state = useSoundscapeState();

  useEffect(() => {
    soundEngine.initialize();
    return () => soundEngine.dispose();
  }, []);

  useEffect(() => {
    soundEngine.applyScent(state.scent);
  }, [state.scent]);

  useEffect(() => {
    const effectiveClarity = state.clarity * (0.6 + state.focus * 0.4);
    soundEngine.updateClarity(effectiveClarity);
  }, [state.clarity, state.focus]);

  useEffect(() => {
    soundEngine.setSprayStrength(state.sprayStrength);
  }, [state.sprayStrength]);

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
      state.captureNote(noteId);
      soundEngine.playGlimmerCapture();
    },
    [state.captureNote]
  );

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
            sprayStrength={state.sprayStrength}
            onSprayStrengthChange={state.setSprayStrength}
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
