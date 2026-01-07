import { useState, useCallback, useEffect } from 'react';
import { ScentVariant } from '@/audio/SoundEngine';

export interface Moment {
  id: string;
  timestamp: number;
  name: string;
  scent: ScentVariant;
  clarity: number;
  glimmersCollected: number;
}

export interface Glimmer {
  id: string;
  x: number;
  y: number;
  spawnTime: number;
}

interface SoundscapeState {
  clarity: number;
  focus: number;
  sprayStrength: number;
  scent: ScentVariant;
  mode: 'neutralizing' | 'locking' | 'stable';
  isAudioStarted: boolean;
  glimmersCollected: number;
  isLocked: boolean;
  moments: Moment[];
  activeGlimmers: Glimmer[];
}

const STORAGE_KEY = 'airwave-soundscape-moments';
const GLIMMER_LIFETIME = 5000; // 5 seconds

function loadMoments(): Moment[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveMoments(moments: Moment[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(moments));
  } catch {
    console.warn('Failed to save moments to localStorage');
  }
}

export function useSoundscapeState() {
  const [state, setState] = useState<SoundscapeState>({
    clarity: 0.15,
    focus: 0.3,
    sprayStrength: 0.5,
    scent: 'eucalyptus-hinoki',
    mode: 'neutralizing',
    isAudioStarted: false,
    glimmersCollected: 0,
    isLocked: false,
    moments: loadMoments(),
    activeGlimmers: [],
  });

  // Update mode based on clarity and glimmers
  useEffect(() => {
    if (state.isLocked) {
      if (state.mode !== 'stable') {
        setState(s => ({ ...s, mode: 'stable' }));
      }
    } else if (state.glimmersCollected >= 3) {
      // Trigger lock
      setState(s => ({ ...s, isLocked: true, mode: 'stable' }));
    } else if (state.clarity >= 0.6) {
      if (state.mode !== 'locking') {
        setState(s => ({ ...s, mode: 'locking' }));
      }
    } else {
      if (state.mode !== 'neutralizing') {
        setState(s => ({ ...s, mode: 'neutralizing', glimmersCollected: 0, isLocked: false }));
      }
    }
  }, [state.clarity, state.glimmersCollected, state.isLocked, state.mode]);

  // Spawn glimmers when in locking mode
  useEffect(() => {
    if (state.mode !== 'locking' || state.isLocked) return;

    const spawnInterval = setInterval(() => {
      if (state.activeGlimmers.length < 3) {
        const newGlimmer: Glimmer = {
          id: `glimmer-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          x: 0.2 + Math.random() * 0.6,
          y: 0.2 + Math.random() * 0.6,
          spawnTime: Date.now(),
        };
        setState(s => ({
          ...s,
          activeGlimmers: [...s.activeGlimmers, newGlimmer],
        }));
      }
    }, 2000);

    return () => clearInterval(spawnInterval);
  }, [state.mode, state.isLocked, state.activeGlimmers.length]);

  // Remove expired glimmers
  useEffect(() => {
    const cleanupInterval = setInterval(() => {
      const now = Date.now();
      setState(s => ({
        ...s,
        activeGlimmers: s.activeGlimmers.filter(
          g => now - g.spawnTime < GLIMMER_LIFETIME
        ),
      }));
    }, 500);

    return () => clearInterval(cleanupInterval);
  }, []);

  const setClarity = useCallback((value: number) => {
    setState(s => ({ ...s, clarity: Math.max(0, Math.min(1, value)) }));
  }, []);

  const setFocus = useCallback((value: number) => {
    setState(s => ({ ...s, focus: Math.max(0, Math.min(1, value)) }));
  }, []);

  const setSprayStrength = useCallback((value: number) => {
    setState(s => ({ ...s, sprayStrength: Math.max(0, Math.min(1, value)) }));
  }, []);

  const setScent = useCallback((scent: ScentVariant) => {
    setState(s => ({ ...s, scent }));
  }, []);

  const setAudioStarted = useCallback((started: boolean) => {
    setState(s => ({ ...s, isAudioStarted: started }));
  }, []);

  const incrementClarity = useCallback((amount: number = 0.02) => {
    setState(s => ({
      ...s,
      clarity: Math.min(1, s.clarity + amount * (0.5 + s.focus * 0.5)),
    }));
  }, []);

  const captureGlimmer = useCallback((glimmerId: string) => {
    setState(s => {
      const glimmer = s.activeGlimmers.find(g => g.id === glimmerId);
      if (!glimmer) return s;

      return {
        ...s,
        glimmersCollected: s.glimmersCollected + 1,
        activeGlimmers: s.activeGlimmers.filter(g => g.id !== glimmerId),
      };
    });
  }, []);

  const captureMoment = useCallback(() => {
    if (!state.isLocked) return null;

    const newMoment: Moment = {
      id: `moment-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      name: `Moment ${state.moments.length + 1}`,
      scent: state.scent,
      clarity: state.clarity,
      glimmersCollected: state.glimmersCollected,
    };

    const updatedMoments = [...state.moments, newMoment];
    saveMoments(updatedMoments);

    setState(s => ({
      ...s,
      moments: updatedMoments,
      // Soft reset after capture
      glimmersCollected: 0,
      isLocked: false,
      clarity: Math.max(0.5, s.clarity - 0.2),
      mode: 'neutralizing',
    }));

    return newMoment;
  }, [state.isLocked, state.scent, state.clarity, state.glimmersCollected, state.moments]);

  const renameMoment = useCallback((momentId: string, newName: string) => {
    setState(s => {
      const updatedMoments = s.moments.map(m =>
        m.id === momentId ? { ...m, name: newName } : m
      );
      saveMoments(updatedMoments);
      return { ...s, moments: updatedMoments };
    });
  }, []);

  const deleteMoment = useCallback((momentId: string) => {
    setState(s => {
      const updatedMoments = s.moments.filter(m => m.id !== momentId);
      saveMoments(updatedMoments);
      return { ...s, moments: updatedMoments };
    });
  }, []);

  const clearMoments = useCallback(() => {
    saveMoments([]);
    setState(s => ({ ...s, moments: [] }));
  }, []);

  // Anti-drift: maintain stability in stable mode
  useEffect(() => {
    if (state.mode !== 'stable') return;

    const interval = setInterval(() => {
      setState(s => {
        if (s.mode !== 'stable') return s;
        const drift = (Math.random() - 0.5) * 0.01;
        const newClarity = Math.max(0.7, Math.min(1, s.clarity + drift * 0.3));
        return { ...s, clarity: newClarity };
      });
    }, 2000);

    return () => clearInterval(interval);
  }, [state.mode]);

  return {
    ...state,
    setClarity,
    setFocus,
    setSprayStrength,
    setScent,
    setAudioStarted,
    incrementClarity,
    captureGlimmer,
    captureMoment,
    renameMoment,
    deleteMoment,
    clearMoments,
  };
}
