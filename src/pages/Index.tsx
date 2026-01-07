import React, { useEffect, useCallback, useRef, useState } from 'react';
import { StatusBar } from '@/components/StatusBar';
import { Visualizer } from '@/components/Visualizer';
import { AlignDial } from '@/components/AlignDial';
import { FineTuneSlider } from '@/components/FineTuneSlider';
import { ScentSelector } from '@/components/ScentSelector';
import { EventsTray } from '@/components/EventsTray';
import { Button } from '@/components/ui/button';
import { useSoundscapeState } from '@/hooks/useSoundscapeState';
import { soundEngine } from '@/audio/SoundEngine';
import { Volume2, VolumeX, Sparkles } from 'lucide-react';

const Index = () => {
  const state = useSoundscapeState();
  const closurePendingRef = useRef(false);
  const [audioMuted, setAudioMuted] = useState(true);
  
  // Initialize audio engine
  useEffect(() => {
    const init = async () => {
      await soundEngine.initialize();
    };
    init();
    
    return () => {
      soundEngine.dispose();
    };
  }, []);
  
  // Sync audio state
  useEffect(() => {
    soundEngine.updateClarity(state.clarity);
  }, [state.clarity]);
  
  useEffect(() => {
    soundEngine.applyScent(state.scent);
  }, [state.scent]);
  
  // Handle closure
  useEffect(() => {
    if (state.mode === 'closure' && !closurePendingRef.current) {
      closurePendingRef.current = true;
      soundEngine.playClosureCue();
      
      // After a moment, transition to stable
      setTimeout(() => {
        state.triggerClosure();
        closurePendingRef.current = false;
      }, 1500);
    }
  }, [state.mode, state.triggerClosure]);
  
  const handleSpray = useCallback((x: number, y: number) => {
    if (!audioMuted) {
      soundEngine.playSprayClick();
    }
    state.incrementClarity(0.025);
  }, [state.incrementClarity, audioMuted]);
  
  const handleToggleAudio = useCallback(async () => {
    if (audioMuted) {
      await soundEngine.initialize();
      soundEngine.start();
      setAudioMuted(false);
      state.setAudioStarted(true);
    } else {
      soundEngine.stop();
      setAudioMuted(true);
    }
  }, [audioMuted, state.setAudioStarted]);
  
  const handleCapture = useCallback(() => {
    if (state.clarity >= 0.75) {
      state.captureEvent();
    }
  }, [state.clarity, state.captureEvent]);
  
  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Status Bar */}
      <StatusBar clarity={state.clarity} mode={state.mode} />
      
      {/* Main Content */}
      <main className="flex-1 flex gap-4 p-4 pt-0 min-h-0">
        {/* Left Panel - Controls */}
        <aside className="w-64 flex-shrink-0 glass-panel rounded-2xl p-5 flex flex-col gap-6">
          <div className="flex flex-col items-center gap-4">
            <AlignDial
              value={state.clarity}
              onChange={state.setClarity}
              label="ALIGN"
            />
          </div>
          
          <div className="w-full">
            <FineTuneSlider
              value={state.fineTune}
              onChange={state.setFineTune}
            />
          </div>
          
          <div className="flex-1" />
          
          {/* Audio Toggle */}
          <Button
            variant="outline"
            onClick={handleToggleAudio}
            className="w-full gap-2"
          >
            {audioMuted ? (
              <>
                <VolumeX className="h-4 w-4" />
                Enable Audio
              </>
            ) : (
              <>
                <Volume2 className="h-4 w-4" />
                Audio On
              </>
            )}
          </Button>
        </aside>
        
        {/* Center - Visualizer */}
        <div className="flex-1 flex flex-col gap-4 min-w-0">
          {/* Visualizer Canvas */}
          <div className="flex-1 glass-panel rounded-2xl overflow-hidden relative">
            <Visualizer
              clarity={state.clarity}
              scent={state.scent}
              mode={state.mode}
              onSpray={handleSpray}
            />
            
            {/* Overlay hint */}
            {state.clarity < 0.3 && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <p className="text-sm text-muted-foreground/60 bg-background/50 backdrop-blur-sm px-4 py-2 rounded-full">
                  Click to spray and neutralize
                </p>
              </div>
            )}
          </div>
          
          {/* Bottom Controls */}
          <div className="glass-panel rounded-2xl p-4 flex items-center justify-between gap-4">
            <ScentSelector
              value={state.scent}
              onChange={state.setScent}
            />
            
            <Button
              onClick={handleCapture}
              disabled={state.clarity < 0.75}
              className="gap-2"
            >
              <Sparkles className="h-4 w-4" />
              Capture
            </Button>
          </div>
        </div>
        
        {/* Right Panel - Events */}
        <aside className="w-56 flex-shrink-0 glass-panel rounded-2xl p-4">
          <EventsTray
            events={state.events}
            onExport={state.exportEvents}
            onClear={state.clearEvents}
          />
        </aside>
      </main>
    </div>
  );
};

export default Index;
