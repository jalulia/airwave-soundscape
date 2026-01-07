import { useState, useCallback, useEffect } from 'react';
import { ScentVariant } from '@/audio/SoundEngine';

export interface Note {
  id: string;
  timestamp: number;
  x: number;
  y: number;
  scent: ScentVariant;
}

export interface ScentTrack {
  scent: ScentVariant;
  notes: Note[];
  isPlaying: boolean;
}

export interface FloatingNote {
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
  mode: 'exploring' | 'collecting' | 'looping';
  isAudioStarted: boolean;
  tracks: Record<ScentVariant, ScentTrack>;
  floatingNotes: FloatingNote[];
}

const STORAGE_KEY = 'airwave-soundscape-tracks';
const NOTE_LIFETIME = 6000;

function loadTracks(): Record<ScentVariant, ScentTrack> {
  const defaultTracks: Record<ScentVariant, ScentTrack> = {
    'mandarin-cedarwood': { scent: 'mandarin-cedarwood', notes: [], isPlaying: false },
    'eucalyptus-hinoki': { scent: 'eucalyptus-hinoki', notes: [], isPlaying: false },
    'bergamot-amber': { scent: 'bergamot-amber', notes: [], isPlaying: false },
    'blacktea-palo': { scent: 'blacktea-palo', notes: [], isPlaying: false },
  };
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return { ...defaultTracks, ...parsed };
    }
    return defaultTracks;
  } catch {
    return defaultTracks;
  }
}

function saveTracks(tracks: Record<ScentVariant, ScentTrack>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tracks));
  } catch {
    console.warn('Failed to save tracks');
  }
}

export function useSoundscapeState() {
  const [state, setState] = useState<SoundscapeState>({
    clarity: 0.15,
    focus: 0.5,
    sprayStrength: 0.5,
    scent: 'eucalyptus-hinoki',
    mode: 'exploring',
    isAudioStarted: false,
    tracks: loadTracks(),
    floatingNotes: [],
  });

  // Spawn floating notes when clarity is decent
  useEffect(() => {
    if (!state.isAudioStarted) return;
    
    const spawnInterval = setInterval(() => {
      if (state.floatingNotes.length < 4 && state.clarity > 0.3) {
        const newNote: FloatingNote = {
          id: `note-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
          x: 0.15 + Math.random() * 0.7,
          y: 0.15 + Math.random() * 0.7,
          spawnTime: Date.now(),
        };
        setState(s => ({
          ...s,
          floatingNotes: [...s.floatingNotes, newNote],
        }));
      }
    }, 2500);

    return () => clearInterval(spawnInterval);
  }, [state.isAudioStarted, state.floatingNotes.length, state.clarity]);

  // Remove expired floating notes
  useEffect(() => {
    const cleanupInterval = setInterval(() => {
      const now = Date.now();
      setState(s => ({
        ...s,
        floatingNotes: s.floatingNotes.filter(n => now - n.spawnTime < NOTE_LIFETIME),
      }));
    }, 500);

    return () => clearInterval(cleanupInterval);
  }, []);

  // Update mode based on track state
  useEffect(() => {
    const currentTrack = state.tracks[state.scent];
    if (currentTrack.isPlaying && currentTrack.notes.length > 0) {
      if (state.mode !== 'looping') {
        setState(s => ({ ...s, mode: 'looping' }));
      }
    } else if (currentTrack.notes.length > 0) {
      if (state.mode !== 'collecting') {
        setState(s => ({ ...s, mode: 'collecting' }));
      }
    } else {
      if (state.mode !== 'exploring') {
        setState(s => ({ ...s, mode: 'exploring' }));
      }
    }
  }, [state.tracks, state.scent, state.mode]);

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

  const incrementClarity = useCallback((amount: number = 0.025) => {
    setState(s => ({
      ...s,
      clarity: Math.min(1, s.clarity + amount * (0.5 + s.focus * 0.5)),
    }));
  }, []);

  // Capture a floating note - adds it to the current scent's track
  const captureNote = useCallback((noteId: string) => {
    setState(s => {
      const floatingNote = s.floatingNotes.find(n => n.id === noteId);
      if (!floatingNote) return s;

      const newNote: Note = {
        id: `captured-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        timestamp: Date.now(),
        x: floatingNote.x,
        y: floatingNote.y,
        scent: s.scent,
      };

      const updatedTracks = {
        ...s.tracks,
        [s.scent]: {
          ...s.tracks[s.scent],
          notes: [...s.tracks[s.scent].notes, newNote],
        },
      };

      saveTracks(updatedTracks);

      return {
        ...s,
        floatingNotes: s.floatingNotes.filter(n => n.id !== noteId),
        tracks: updatedTracks,
      };
    });
  }, []);

  // Toggle loop playback for a scent track
  const toggleTrackLoop = useCallback((scent: ScentVariant) => {
    setState(s => {
      const updatedTracks = {
        ...s.tracks,
        [scent]: {
          ...s.tracks[scent],
          isPlaying: !s.tracks[scent].isPlaying,
        },
      };
      saveTracks(updatedTracks);
      return { ...s, tracks: updatedTracks };
    });
  }, []);

  // Clear all notes from a scent track
  const clearTrack = useCallback((scent: ScentVariant) => {
    setState(s => {
      const updatedTracks = {
        ...s.tracks,
        [scent]: {
          ...s.tracks[scent],
          notes: [],
          isPlaying: false,
        },
      };
      saveTracks(updatedTracks);
      return { ...s, tracks: updatedTracks };
    });
  }, []);

  // Delete a single note from a track
  const deleteNote = useCallback((scent: ScentVariant, noteId: string) => {
    setState(s => {
      const updatedTracks = {
        ...s.tracks,
        [scent]: {
          ...s.tracks[scent],
          notes: s.tracks[scent].notes.filter(n => n.id !== noteId),
        },
      };
      saveTracks(updatedTracks);
      return { ...s, tracks: updatedTracks };
    });
  }, []);

  return {
    ...state,
    currentTrack: state.tracks[state.scent],
    setClarity,
    setFocus,
    setSprayStrength,
    setScent,
    setAudioStarted,
    incrementClarity,
    captureNote,
    toggleTrackLoop,
    clearTrack,
    deleteNote,
  };
}
