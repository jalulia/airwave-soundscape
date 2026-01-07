import { useState, useCallback, useEffect } from 'react';
import { ScentVariant } from '@/audio/SoundEngine';

export interface CapturedEvent {
  id: string;
  timestamp: number;
  scent: ScentVariant;
  clarity: number;
}

interface SoundscapeState {
  clarity: number;
  fineTune: number;
  scent: ScentVariant;
  mode: 'neutralizing' | 'closure' | 'stable';
  isAudioStarted: boolean;
  events: CapturedEvent[];
}

const STORAGE_KEY = 'airwave-soundscape-events';

function loadEvents(): CapturedEvent[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveEvents(events: CapturedEvent[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
  } catch {
    console.warn('Failed to save events to localStorage');
  }
}

export function useSoundscapeState() {
  const [state, setState] = useState<SoundscapeState>({
    clarity: 0.15,
    fineTune: 0.5,
    scent: 'eucalyptus-hinoki',
    mode: 'neutralizing',
    isAudioStarted: false,
    events: loadEvents(),
  });

  // Update mode based on clarity
  useEffect(() => {
    if (state.clarity >= 0.85) {
      if (state.mode !== 'closure' && state.mode !== 'stable') {
        setState(s => ({ ...s, mode: 'closure' }));
      }
    } else if (state.clarity < 0.7 && state.mode === 'stable') {
      setState(s => ({ ...s, mode: 'neutralizing' }));
    }
  }, [state.clarity, state.mode]);

  const setClarity = useCallback((value: number) => {
    setState(s => ({ ...s, clarity: Math.max(0, Math.min(1, value)) }));
  }, []);

  const setFineTune = useCallback((value: number) => {
    setState(s => ({ ...s, fineTune: Math.max(0, Math.min(1, value)) }));
  }, []);

  const setScent = useCallback((scent: ScentVariant) => {
    setState(s => ({ ...s, scent }));
  }, []);

  const setAudioStarted = useCallback((started: boolean) => {
    setState(s => ({ ...s, isAudioStarted: started }));
  }, []);

  const incrementClarity = useCallback((amount: number = 0.03) => {
    setState(s => ({
      ...s,
      clarity: Math.min(1, s.clarity + amount),
    }));
  }, []);

  const triggerClosure = useCallback(() => {
    setState(s => ({ ...s, mode: 'stable' }));
  }, []);

  const captureEvent = useCallback(() => {
    const newEvent: CapturedEvent = {
      id: `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      scent: state.scent,
      clarity: state.clarity,
    };
    
    const updatedEvents = [...state.events, newEvent];
    saveEvents(updatedEvents);
    setState(s => ({ ...s, events: updatedEvents }));
    
    return newEvent;
  }, [state.scent, state.clarity, state.events]);

  const clearEvents = useCallback(() => {
    saveEvents([]);
    setState(s => ({ ...s, events: [] }));
  }, []);

  const exportEvents = useCallback(() => {
    const data = JSON.stringify(state.events, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `airwave-events-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [state.events]);

  // Anti-drift: slowly maintain stability in stable mode
  useEffect(() => {
    if (state.mode !== 'stable') return;
    
    const interval = setInterval(() => {
      setState(s => {
        if (s.mode !== 'stable') return s;
        // Gentle resistance to clarity drop
        const drift = (Math.random() - 0.5) * 0.01;
        const newClarity = Math.max(0.8, Math.min(1, s.clarity + drift * 0.5));
        return { ...s, clarity: newClarity };
      });
    }, 2000);
    
    return () => clearInterval(interval);
  }, [state.mode]);

  return {
    ...state,
    setClarity,
    setFineTune,
    setScent,
    setAudioStarted,
    incrementClarity,
    triggerClosure,
    captureEvent,
    clearEvents,
    exportEvents,
  };
}
