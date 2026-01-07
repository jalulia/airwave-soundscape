import React, { useEffect, useCallback, useRef } from 'react';
import { soundEngine } from '@/audio/SoundEngine';
import { useSoundscapeState } from '@/hooks/useSoundscapeState';
import { Visualizer } from '@/components/Visualizer';
import { StatusBar } from '@/components/StatusBar';
import { FieldConsole } from '@/components/FieldConsole';

export default function Index() {
  const state = useSoundscapeState();
  const prevLockedRef = useRef(false);

  useEffect(() => {
    soundEngine.initialize();
    return () => soundEngine.dispose();
  }, []);

  useEffect(() => {
    soundEngine.applyScent(state.scent);
  }, [state.scent]);

  useEffect(() => {
    soundEngine.updateClarity(state.clarity);
  }, [state.clarity]);

  useEffect(() => {
    soundEngine.setSprayStrength(state.sprayStrength);
  }, [state.sprayStrength]);

  useEffect(() => {
    if (state.isLocked && !prevLockedRef.current) {
      soundEngine.playLockCue();
    }
    prevLockedRef.current = state.isLocked;
  }, [state.isLocked]);

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

  const handleGlimmerCapture = useCallback(
    (glimmerId: string) => {
      state.captureGlimmer(glimmerId);
      soundEngine.playGlimmerCapture();
    },
    [state.captureGlimmer]
  );

  const handleCaptureMoment = useCallback(() => {
    state.captureMoment();
  }, [state.captureMoment]);

  return (
    <div className="h-screen w-full flex flex-col bg-gradient-to-br from-airwave-cream via-background to-airwave-sky/10">
      <StatusBar
        clarity={state.clarity}
        mode={state.mode}
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
            glimmersCollected={state.glimmersCollected}
            isLocked={state.isLocked}
            onCaptureMoment={handleCaptureMoment}
            moments={state.moments}
            onRenameMoment={state.renameMoment}
            onDeleteMoment={state.deleteMoment}
          />
        </div>

        <div className="flex-1 glass-panel p-2 relative">
          <Visualizer
            clarity={state.clarity}
            scent={state.scent}
            mode={state.mode}
            activeGlimmers={state.activeGlimmers}
            onSpray={handleSpray}
            onGlimmerCapture={handleGlimmerCapture}
          />

          {!state.isAudioStarted && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="glass-panel px-6 py-3 animate-fade-in">
                <p className="text-sm text-muted-foreground">
                  Click anywhere to spray and neutralize
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
