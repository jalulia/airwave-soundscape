import * as Tone from 'tone';

export type ScentVariant = 'mandarin-cedarwood' | 'eucalyptus-hinoki' | 'bergamot-amber' | 'blacktea-palo';

interface ScentConfig {
  baseFreq: number;
  harmonicRatios: number[];
  filterBase: number;
  noiseColor: 'white' | 'pink' | 'brown';
  reverbDecay: number;
  warmth: number;
}

const SCENT_CONFIGS: Record<ScentVariant, ScentConfig> = {
  'mandarin-cedarwood': {
    baseFreq: 220,
    harmonicRatios: [1, 1.5, 2, 2.5],
    filterBase: 800,
    noiseColor: 'pink',
    reverbDecay: 2.5,
    warmth: 0.6,
  },
  'eucalyptus-hinoki': {
    baseFreq: 280,
    harmonicRatios: [1, 1.33, 2, 3],
    filterBase: 1200,
    noiseColor: 'white',
    reverbDecay: 3,
    warmth: 0.3,
  },
  'bergamot-amber': {
    baseFreq: 196,
    harmonicRatios: [1, 1.25, 1.5, 2],
    filterBase: 900,
    noiseColor: 'pink',
    reverbDecay: 2.8,
    warmth: 0.5,
  },
  'blacktea-palo': {
    baseFreq: 165,
    harmonicRatios: [1, 1.2, 1.5, 1.8],
    filterBase: 600,
    noiseColor: 'brown',
    reverbDecay: 3.5,
    warmth: 0.7,
  },
};

export class SoundEngine {
  private noise: Tone.Noise | null = null;
  private noiseFilter: Tone.Filter | null = null;
  private noiseGain: Tone.Gain | null = null;
  private pad: Tone.PolySynth | null = null;
  private padFilter: Tone.Filter | null = null;
  private padGain: Tone.Gain | null = null;
  private reverb: Tone.Reverb | null = null;
  private masterGain: Tone.Gain | null = null;
  private clickSynth: Tone.MembraneSynth | null = null;
  private closureSynth: Tone.PolySynth | null = null;
  
  private currentScent: ScentVariant = 'eucalyptus-hinoki';
  private clarity: number = 0;
  private isPlaying: boolean = false;
  private padNotes: string[] = [];
  private detuneOsc: Tone.LFO | null = null;

  async initialize() {
    await Tone.start();
    
    // Master output
    this.masterGain = new Tone.Gain(0.6).toDestination();
    
    // Reverb
    this.reverb = new Tone.Reverb({
      decay: 3,
      wet: 0.4,
    }).connect(this.masterGain);
    await this.reverb.generate();
    
    // Noise layer
    this.noiseFilter = new Tone.Filter({
      frequency: 2000,
      type: 'lowpass',
      rolloff: -24,
    }).connect(this.reverb);
    
    this.noiseGain = new Tone.Gain(0.15).connect(this.noiseFilter);
    this.noise = new Tone.Noise('pink').connect(this.noiseGain);
    
    // Pad synth
    this.padFilter = new Tone.Filter({
      frequency: 1000,
      type: 'lowpass',
      rolloff: -12,
    }).connect(this.reverb);
    
    this.padGain = new Tone.Gain(0.25).connect(this.padFilter);
    
    this.pad = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'sine' },
      envelope: {
        attack: 2,
        decay: 1,
        sustain: 0.8,
        release: 3,
      },
    }).connect(this.padGain);
    
    // Detune LFO for wobble
    this.detuneOsc = new Tone.LFO({
      frequency: 0.3,
      min: -30,
      max: 30,
    }).start();
    
    // Click synth for spray
    this.clickSynth = new Tone.MembraneSynth({
      pitchDecay: 0.02,
      octaves: 4,
      envelope: {
        attack: 0.001,
        decay: 0.1,
        sustain: 0,
        release: 0.1,
      },
    }).connect(this.masterGain);
    this.clickSynth.volume.value = -12;
    
    // Closure chord synth
    this.closureSynth = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'triangle' },
      envelope: {
        attack: 0.1,
        decay: 0.5,
        sustain: 0.3,
        release: 1.5,
      },
    }).connect(this.reverb);
    this.closureSynth.volume.value = -8;
    
    this.applyScent(this.currentScent);
  }

  applyScent(scent: ScentVariant) {
    this.currentScent = scent;
    const config = SCENT_CONFIGS[scent];
    
    if (this.noise) {
      this.noise.type = config.noiseColor;
    }
    
    if (this.reverb) {
      this.reverb.decay = config.reverbDecay;
    }
    
    // Generate pad notes based on scent
    const baseNote = Tone.Frequency(config.baseFreq).toNote();
    this.padNotes = config.harmonicRatios.map((ratio) =>
      Tone.Frequency(config.baseFreq * ratio).toNote()
    );
    
    this.updateClarity(this.clarity);
  }

  updateClarity(value: number) {
    this.clarity = Math.max(0, Math.min(1, value));
    const config = SCENT_CONFIGS[this.currentScent];
    
    // Noise decreases with clarity
    if (this.noiseGain) {
      this.noiseGain.gain.rampTo(0.2 * (1 - this.clarity * 0.8), 0.3);
    }
    
    // Filter opens with clarity
    if (this.noiseFilter) {
      const filterFreq = 800 + this.clarity * 2500;
      this.noiseFilter.frequency.rampTo(filterFreq, 0.3);
    }
    
    if (this.padFilter) {
      const padFilterFreq = config.filterBase + this.clarity * 1500;
      this.padFilter.frequency.rampTo(padFilterFreq, 0.3);
    }
    
    // Detune decreases with clarity
    if (this.detuneOsc) {
      const detuneAmount = 30 * (1 - this.clarity * 0.9);
      this.detuneOsc.min = -detuneAmount;
      this.detuneOsc.max = detuneAmount;
    }
    
    // Reverb gets drier with clarity
    if (this.reverb) {
      this.reverb.wet.rampTo(0.5 - this.clarity * 0.25, 0.3);
    }
    
    // Pad volume slightly increases with clarity
    if (this.padGain) {
      this.padGain.gain.rampTo(0.2 + this.clarity * 0.15, 0.3);
    }
  }

  start() {
    if (this.isPlaying) return;
    this.isPlaying = true;
    
    this.noise?.start();
    
    // Start pad drone
    if (this.pad && this.padNotes.length > 0) {
      this.pad.triggerAttack(this.padNotes);
    }
  }

  stop() {
    if (!this.isPlaying) return;
    this.isPlaying = false;
    
    this.noise?.stop();
    this.pad?.releaseAll();
  }

  playSprayClick() {
    if (this.clickSynth) {
      const freq = 800 + Math.random() * 400;
      this.clickSynth.triggerAttackRelease(freq, 0.05);
    }
  }

  playClosureCue() {
    if (!this.closureSynth) return;
    
    const config = SCENT_CONFIGS[this.currentScent];
    const baseFreq = config.baseFreq * 1.5;
    
    // Simple ascending arpeggio
    const notes = [
      Tone.Frequency(baseFreq).toNote(),
      Tone.Frequency(baseFreq * 1.25).toNote(),
      Tone.Frequency(baseFreq * 1.5).toNote(),
    ];
    
    const now = Tone.now();
    notes.forEach((note, i) => {
      this.closureSynth?.triggerAttackRelease(note, '4n', now + i * 0.15);
    });
  }

  getClarity() {
    return this.clarity;
  }

  getCurrentScent() {
    return this.currentScent;
  }

  dispose() {
    this.stop();
    this.noise?.dispose();
    this.noiseFilter?.dispose();
    this.noiseGain?.dispose();
    this.pad?.dispose();
    this.padFilter?.dispose();
    this.padGain?.dispose();
    this.reverb?.dispose();
    this.masterGain?.dispose();
    this.clickSynth?.dispose();
    this.closureSynth?.dispose();
    this.detuneOsc?.dispose();
  }
}

export const soundEngine = new SoundEngine();
