import * as Tone from 'tone';

export type ScentVariant = 
  | 'mandarin-cedarwood' 
  | 'eucalyptus-hinoki' 
  | 'bergamot-amber' 
  | 'blacktea-palo';

interface ScentConfig {
  baseFreq: number;
  chordNotes: number[]; // Semitones from base for the chord
  filterFreq: number;
  filterQ: number;
  reverbDecay: number;
  padDetune: number;
  sparkleFreqRange: [number, number];
  chorusDepth: number;
  oscillatorType: 'sine' | 'triangle';
  character: 'airy' | 'warm' | 'bright' | 'deep';
}

const SCENT_CONFIGS: Record<ScentVariant, ScentConfig> = {
  // Mandarin-Cedarwood: Warm, grounded major 7th chord
  'mandarin-cedarwood': {
    baseFreq: 196, // G3
    chordNotes: [0, 4, 7, 11], // Gmaj7
    filterFreq: 1000,
    filterQ: 0.6,
    reverbDecay: 3.5,
    padDetune: 4,
    sparkleFreqRange: [700, 1200],
    chorusDepth: 0.3,
    oscillatorType: 'sine',
    character: 'warm',
  },
  // Eucalyptus-Hinoki: Very airy and twinkly, high ethereal
  'eucalyptus-hinoki': {
    baseFreq: 330, // E4 - higher register
    chordNotes: [0, 7, 12, 19], // Open fifths, very airy
    filterFreq: 2200,
    filterQ: 0.3,
    reverbDecay: 5,
    padDetune: 1,
    sparkleFreqRange: [1400, 2400],
    chorusDepth: 0.15,
    oscillatorType: 'triangle',
    character: 'airy',
  },
  // Bergamot-Amber: Bright, uplifting add9 chord
  'bergamot-amber': {
    baseFreq: 261, // C4
    chordNotes: [0, 4, 7, 14], // Cadd9
    filterFreq: 1600,
    filterQ: 0.5,
    reverbDecay: 3,
    padDetune: 3,
    sparkleFreqRange: [1000, 1800],
    chorusDepth: 0.25,
    oscillatorType: 'triangle',
    character: 'bright',
  },
  // Blacktea-Palo: Deep, contemplative minor 7th
  'blacktea-palo': {
    baseFreq: 146, // D3 - lower register
    chordNotes: [0, 3, 7, 10], // Dm7
    filterFreq: 800,
    filterQ: 0.8,
    reverbDecay: 5,
    padDetune: 6,
    sparkleFreqRange: [500, 900],
    chorusDepth: 0.4,
    oscillatorType: 'sine',
    character: 'deep',
  },
};

const SPRAY_SCALE = [0, 2, 4, 7, 9, 12, 14];

class SoundEngine {
  private isInitialized = false;
  private currentScent: ScentVariant = 'eucalyptus-hinoki';
  private focus = 0.5;
  private noteCount = 0;

  // Audio nodes
  private padSynth: Tone.PolySynth | null = null;
  private padFilter: Tone.Filter | null = null;
  private padGain: Tone.Gain | null = null;
  private reverb: Tone.Reverb | null = null;
  private chorus: Tone.Chorus | null = null;
  private limiter: Tone.Limiter | null = null;
  private masterGain: Tone.Gain | null = null;
  private spraySynth: Tone.Synth | null = null;
  private noteSynth: Tone.Synth | null = null;
  private loopSynth: Tone.PolySynth | null = null;
  
  // Loop state
  private loopInterval: number | null = null;

  async initialize(): Promise<void> {
    if (this.isInitialized) return;
    await Tone.start();

    // Very quiet master
    this.limiter = new Tone.Limiter(-8).toDestination();
    this.masterGain = new Tone.Gain(0.18).connect(this.limiter);

    // Dreamy reverb
    this.reverb = new Tone.Reverb({ decay: 4, wet: 0.5 }).connect(this.masterGain);
    await this.reverb.generate();

    // Gentle chorus
    this.chorus = new Tone.Chorus({ frequency: 0.1, delayTime: 5, depth: 0.2, wet: 0.2 }).connect(this.reverb);
    this.chorus.start();

    // Pad - extremely soft, barely there drone
    this.padFilter = new Tone.Filter({ frequency: 600, type: 'lowpass', rolloff: -24, Q: 0.4 }).connect(this.chorus);
    this.padGain = new Tone.Gain(0.15).connect(this.padFilter);
    this.padSynth = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'sine' },
      envelope: { attack: 5, decay: 3, sustain: 0.5, release: 6 },
      volume: -38,
    }).connect(this.padGain);

    // Spray synth - gentle bell tones
    this.spraySynth = new Tone.Synth({
      oscillator: { type: 'sine' },
      envelope: { attack: 0.03, decay: 0.4, sustain: 0, release: 0.5 },
      volume: -20,
    }).connect(this.reverb);

    // Note capture synth - bright chime
    this.noteSynth = new Tone.Synth({
      oscillator: { type: 'triangle' },
      envelope: { attack: 0.02, decay: 0.4, sustain: 0.1, release: 0.6 },
      volume: -18,
    }).connect(this.reverb);

    // Loop synth for playing back captured notes
    this.loopSynth = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'sine' },
      envelope: { attack: 0.05, decay: 0.3, sustain: 0.2, release: 0.5 },
      volume: -22,
    }).connect(this.reverb);

    this.applyScent(this.currentScent);
    this.isInitialized = true;
  }

  applyScent(scent: ScentVariant): void {
    this.currentScent = scent;
    const config = SCENT_CONFIGS[scent];
    
    // Update pad oscillator type for character
    if (this.padSynth) {
      this.padSynth.set({ oscillator: { type: config.oscillatorType } });
    }
    
    if (this.padFilter) this.padFilter.Q.value = config.filterQ;
    if (this.reverb) this.reverb.decay = config.reverbDecay;
    if (this.chorus) this.chorus.depth = config.chorusDepth;
    
    // Crossfade to new chord
    if (this.padSynth && this.isInitialized) {
      this.padSynth.releaseAll();
      setTimeout(() => {
        const notes = config.chordNotes.map(semitone => 
          Tone.Frequency(config.baseFreq * Math.pow(2, semitone / 12)).toNote()
        );
        this.padSynth?.triggerAttack(notes);
      }, 200);
    }
    
    this.updateFocus(this.focus);
  }

  updateFocus(value: number): void {
    this.focus = Math.max(0, Math.min(1, value));
    const config = SCENT_CONFIGS[this.currentScent];

    // Focus controls the pad brightness and presence
    if (this.padFilter) {
      // Higher focus = brighter, more open filter
      this.padFilter.frequency.rampTo(300 + this.focus * config.filterFreq, 0.3);
    }
    if (this.padSynth) {
      // Higher focus = less detune (cleaner)
      this.padSynth.set({ detune: config.padDetune * (1 - this.focus * 0.9) });
    }
    if (this.padGain) {
      // Higher focus = slightly louder pad
      this.padGain.gain.rampTo(0.1 + this.focus * 0.1, 0.3);
    }
    if (this.reverb) {
      // Higher focus = slightly drier
      this.reverb.wet.rampTo(0.55 - this.focus * 0.15, 0.3);
    }
  }

  // Called when notes are captured - affects the ambient bed
  setNoteCount(count: number): void {
    this.noteCount = count;
    // More notes = slightly richer ambient texture
    if (this.padGain) {
      const boost = Math.min(count * 0.02, 0.12);
      this.padGain.gain.rampTo(0.1 + this.focus * 0.1 + boost, 0.5);
    }
  }

  start(): void {
    if (!this.isInitialized) return;
    const config = SCENT_CONFIGS[this.currentScent];
    if (this.padSynth) {
      const notes = config.chordNotes.map(semitone => 
        Tone.Frequency(config.baseFreq * Math.pow(2, semitone / 12)).toNote()
      );
      this.padSynth.triggerAttack(notes);
    }
  }

  stop(): void {
    this.padSynth?.releaseAll();
    this.stopLoop();
  }

  playSprayClick(x: number, y: number): void {
    if (!this.isInitialized || !this.spraySynth) return;
    const config = SCENT_CONFIGS[this.currentScent];
    
    const scaleIndex = Math.floor(x * SPRAY_SCALE.length);
    const interval = SPRAY_SCALE[Math.min(scaleIndex, SPRAY_SCALE.length - 1)];
    const baseFreq = config.sparkleFreqRange[0] + (config.sparkleFreqRange[1] - config.sparkleFreqRange[0]) * 0.3;
    const freq = baseFreq * Math.pow(2, interval / 12);
    
    this.spraySynth.triggerAttackRelease(freq, 0.35);
  }

  playNoteCapture(x: number, y: number): void {
    if (!this.isInitialized || !this.noteSynth) return;
    const config = SCENT_CONFIGS[this.currentScent];
    
    // Two-note chime based on position
    const baseFreq = config.sparkleFreqRange[1];
    const freq1 = baseFreq * (0.8 + x * 0.4);
    const freq2 = freq1 * 1.5;
    
    this.noteSynth.triggerAttackRelease(freq1, 0.25);
    setTimeout(() => {
      this.noteSynth?.triggerAttackRelease(freq2, 0.2);
    }, 80);
  }

  // Play focus change sound
  playFocusChange(value: number): void {
    if (!this.isInitialized || !this.spraySynth) return;
    const config = SCENT_CONFIGS[this.currentScent];
    const freq = config.baseFreq * (1 + value);
    this.spraySynth.triggerAttackRelease(freq, 0.15);
  }

  // Start loop playback for a track
  startLoop(notes: Array<{x: number, y: number}>, scent: ScentVariant): void {
    this.stopLoop();
    if (notes.length === 0) return;
    
    const config = SCENT_CONFIGS[scent];
    let noteIndex = 0;
    
    // Play notes in sequence
    const playNext = () => {
      if (!this.loopSynth || notes.length === 0) return;
      
      const note = notes[noteIndex % notes.length];
      const scaleIndex = Math.floor(note.x * SPRAY_SCALE.length);
      const interval = SPRAY_SCALE[Math.min(scaleIndex, SPRAY_SCALE.length - 1)];
      const baseFreq = config.sparkleFreqRange[0];
      const freq = baseFreq * Math.pow(2, interval / 12);
      
      this.loopSynth.triggerAttackRelease(Tone.Frequency(freq).toNote(), 0.2);
      noteIndex++;
    };
    
    playNext(); // Play first immediately
    this.loopInterval = window.setInterval(playNext, 600);
  }

  stopLoop(): void {
    if (this.loopInterval) {
      clearInterval(this.loopInterval);
      this.loopInterval = null;
    }
  }

  getFocus(): number { return this.focus; }
  getCurrentScent(): ScentVariant { return this.currentScent; }

  dispose(): void {
    this.stop();
    [this.padSynth, this.padFilter, this.padGain,
     this.reverb, this.chorus, this.limiter, this.masterGain, 
     this.spraySynth, this.noteSynth, this.loopSynth].forEach(n => n?.dispose());
    this.isInitialized = false;
  }
}

export const soundEngine = new SoundEngine();
