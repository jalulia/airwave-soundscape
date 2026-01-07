import * as Tone from 'tone';

export type ScentVariant = 
  | 'mandarin-cedarwood' 
  | 'eucalyptus-hinoki' 
  | 'bergamot-amber' 
  | 'blacktea-palo';

interface ScentConfig {
  baseFreq: number;
  harmonicRatios: number[];
  filterFreq: number;
  filterQ: number;
  noiseColor: 'white' | 'pink' | 'brown';
  reverbDecay: number;
  padDetune: number;
  sparkleFreqRange: [number, number];
  sparkleAttack: number;
  sparkleDecay: number;
  chorusDepth: number;
}

const SCENT_CONFIGS: Record<ScentVariant, ScentConfig> = {
  'mandarin-cedarwood': {
    baseFreq: 220,
    harmonicRatios: [1, 1.5, 2, 3],
    filterFreq: 1800,
    filterQ: 1.2,
    noiseColor: 'pink',
    reverbDecay: 2.5,
    padDetune: 8,
    sparkleFreqRange: [800, 1600],
    sparkleAttack: 0.01,
    sparkleDecay: 0.15,
    chorusDepth: 0.3,
  },
  'eucalyptus-hinoki': {
    baseFreq: 260,
    harmonicRatios: [1, 2, 3, 5],
    filterFreq: 2400,
    filterQ: 0.8,
    noiseColor: 'white',
    reverbDecay: 3.0,
    padDetune: 4,
    sparkleFreqRange: [1200, 2400],
    sparkleAttack: 0.005,
    sparkleDecay: 0.1,
    chorusDepth: 0.2,
  },
  'bergamot-amber': {
    baseFreq: 196,
    harmonicRatios: [1, 1.25, 2, 2.5],
    filterFreq: 2000,
    filterQ: 1.0,
    noiseColor: 'pink',
    reverbDecay: 3.5,
    padDetune: 6,
    sparkleFreqRange: [900, 1800],
    sparkleAttack: 0.02,
    sparkleDecay: 0.2,
    chorusDepth: 0.5,
  },
  'blacktea-palo': {
    baseFreq: 174,
    harmonicRatios: [1, 1.5, 2, 2.5],
    filterFreq: 1400,
    filterQ: 1.5,
    noiseColor: 'brown',
    reverbDecay: 4.0,
    padDetune: 10,
    sparkleFreqRange: [600, 1200],
    sparkleAttack: 0.03,
    sparkleDecay: 0.25,
    chorusDepth: 0.35,
  },
};

const SPRAY_SCALE = [0, 2, 4, 7, 9, 12, 14, 16, 19, 21];

class SoundEngine {
  private isInitialized = false;
  private currentScent: ScentVariant = 'eucalyptus-hinoki';
  private clarity = 0.15;
  private sprayStrength = 0.5;

  private padSynth: Tone.PolySynth | null = null;
  private padFilter: Tone.Filter | null = null;
  private noiseSource: Tone.Noise | null = null;
  private noiseFilter: Tone.Filter | null = null;
  private noiseGain: Tone.Gain | null = null;
  private reverb: Tone.Reverb | null = null;
  private chorus: Tone.Chorus | null = null;
  private limiter: Tone.Limiter | null = null;
  private masterGain: Tone.Gain | null = null;
  private spraySynth: Tone.Synth | null = null;
  private sparkleNoise: Tone.Noise | null = null;
  private sparkleFilter: Tone.Filter | null = null;
  private sparkleGain: Tone.Gain | null = null;
  private glimmerSynth: Tone.Synth | null = null;
  private closureSynth: Tone.PolySynth | null = null;
  private suctionNoise: Tone.Noise | null = null;
  private suctionFilter: Tone.Filter | null = null;

  async initialize(): Promise<void> {
    if (this.isInitialized) return;
    await Tone.start();

    this.limiter = new Tone.Limiter(-3).toDestination();
    this.masterGain = new Tone.Gain(0.5).connect(this.limiter);

    this.reverb = new Tone.Reverb({ decay: 3, wet: 0.4 }).connect(this.masterGain);
    await this.reverb.generate();

    this.chorus = new Tone.Chorus({ frequency: 0.5, delayTime: 3.5, depth: 0.3, wet: 0.3 }).connect(this.reverb);
    this.chorus.start();

    this.padFilter = new Tone.Filter({ frequency: 800, type: 'lowpass', rolloff: -12, Q: 1 }).connect(this.chorus);
    this.padSynth = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'sine' },
      envelope: { attack: 2, decay: 1, sustain: 0.8, release: 3 },
      volume: -20,
    }).connect(this.padFilter);

    this.noiseFilter = new Tone.Filter({ frequency: 2000, type: 'lowpass', rolloff: -24 }).connect(this.chorus);
    this.noiseGain = new Tone.Gain(0.12).connect(this.noiseFilter);
    this.noiseSource = new Tone.Noise({ type: 'pink', volume: -22 }).connect(this.noiseGain);

    this.spraySynth = new Tone.Synth({
      oscillator: { type: 'triangle' },
      envelope: { attack: 0.005, decay: 0.1, sustain: 0, release: 0.1 },
      volume: -18,
    }).connect(this.reverb);

    this.sparkleFilter = new Tone.Filter({ frequency: 4000, type: 'bandpass', Q: 2 }).connect(this.reverb);
    this.sparkleGain = new Tone.Gain(0).connect(this.sparkleFilter);
    this.sparkleNoise = new Tone.Noise({ type: 'white', volume: -28 }).connect(this.sparkleGain);

    this.glimmerSynth = new Tone.Synth({
      oscillator: { type: 'sine' },
      envelope: { attack: 0.01, decay: 0.3, sustain: 0.2, release: 0.5 },
      volume: -14,
    }).connect(this.reverb);

    this.closureSynth = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'sine' },
      envelope: { attack: 0.05, decay: 0.3, sustain: 0.4, release: 1 },
      volume: -12,
    }).connect(this.reverb);

    this.suctionFilter = new Tone.Filter({ frequency: 200, type: 'lowpass', rolloff: -24 }).connect(this.masterGain);
    this.suctionNoise = new Tone.Noise({ type: 'brown', volume: -22 }).connect(this.suctionFilter);

    this.applyScent(this.currentScent);
    this.isInitialized = true;
  }

  applyScent(scent: ScentVariant): void {
    this.currentScent = scent;
    const config = SCENT_CONFIGS[scent];
    if (this.noiseSource) this.noiseSource.type = config.noiseColor;
    if (this.padFilter) this.padFilter.Q.value = config.filterQ;
    if (this.reverb) this.reverb.decay = config.reverbDecay;
    if (this.chorus) this.chorus.depth = config.chorusDepth;
    this.updateClarity(this.clarity);
  }

  updateClarity(value: number): void {
    this.clarity = Math.max(0, Math.min(1, value));
    const config = SCENT_CONFIGS[this.currentScent];

    if (this.noiseGain) {
      this.noiseGain.gain.rampTo(0.15 * (1 - this.clarity * 0.8), 0.3);
    }
    if (this.noiseFilter) {
      this.noiseFilter.frequency.rampTo(800 + this.clarity * 2000, 0.3);
    }
    if (this.padFilter) {
      this.padFilter.frequency.rampTo(config.filterFreq * (0.5 + this.clarity * 0.5), 0.3);
    }
    if (this.padSynth) {
      this.padSynth.set({ detune: config.padDetune * (1 - this.clarity * 0.9) });
    }
    if (this.reverb) {
      this.reverb.wet.rampTo(0.5 - this.clarity * 0.3, 0.3);
    }
  }

  setSprayStrength(value: number): void {
    this.sprayStrength = Math.max(0, Math.min(1, value));
  }

  start(): void {
    if (!this.isInitialized) return;
    const config = SCENT_CONFIGS[this.currentScent];
    if (this.padSynth) {
      const notes = config.harmonicRatios.map(r => Tone.Frequency(config.baseFreq * r).toNote());
      this.padSynth.triggerAttack(notes);
    }
    this.noiseSource?.start();
    this.sparkleNoise?.start();
  }

  stop(): void {
    this.padSynth?.releaseAll();
    this.noiseSource?.stop();
    this.sparkleNoise?.stop();
  }

  playSprayClick(x: number, y: number): void {
    if (!this.isInitialized) return;
    const config = SCENT_CONFIGS[this.currentScent];
    const scaleIndex = Math.floor(x * SPRAY_SCALE.length);
    const interval = SPRAY_SCALE[Math.min(scaleIndex, SPRAY_SCALE.length - 1)];
    const freq = config.sparkleFreqRange[0] * Math.pow(2, interval / 12);
    const brightness = 2000 + (1 - y) * 4000;

    if (this.sparkleFilter) this.sparkleFilter.frequency.value = brightness;
    if (this.spraySynth) {
      this.spraySynth.set({ envelope: { attack: config.sparkleAttack * (0.8 + Math.random() * 0.4), decay: config.sparkleDecay } });
      this.spraySynth.triggerAttackRelease(freq + (Math.random() - 0.5) * 20, config.sparkleDecay * (0.8 + this.sprayStrength * 0.4));
    }
    if (this.sparkleGain) {
      const burstLevel = 0.08 + this.sprayStrength * 0.1;
      this.sparkleGain.gain.setValueAtTime(burstLevel, Tone.now());
      this.sparkleGain.gain.exponentialRampToValueAtTime(0.001, Tone.now() + 0.15);
    }
  }

  playGlimmerCapture(): void {
    if (!this.isInitialized || !this.glimmerSynth) return;
    const config = SCENT_CONFIGS[this.currentScent];
    const freq = config.sparkleFreqRange[1] * 1.2;
    this.glimmerSynth.triggerAttackRelease(freq, 0.3);
    setTimeout(() => this.glimmerSynth?.triggerAttackRelease(freq * 1.5, 0.2), 100);
  }

  playLockCue(): void {
    if (!this.isInitialized) return;
    const config = SCENT_CONFIGS[this.currentScent];

    if (this.suctionNoise && this.suctionFilter) {
      this.suctionNoise.start();
      this.suctionFilter.frequency.setValueAtTime(400, Tone.now());
      this.suctionFilter.frequency.exponentialRampToValueAtTime(50, Tone.now() + 0.4);
      setTimeout(() => this.suctionNoise?.stop(), 500);
    }

    setTimeout(() => {
      if (this.closureSynth) {
        const root = config.baseFreq * 2;
        this.closureSynth.triggerAttackRelease([
          Tone.Frequency(root).toNote(),
          Tone.Frequency(root * 1.25).toNote(),
          Tone.Frequency(root * 1.5).toNote(),
        ], 0.8);
      }
    }, 300);
  }

  getClarity(): number { return this.clarity; }
  getCurrentScent(): ScentVariant { return this.currentScent; }

  dispose(): void {
    this.stop();
    [this.padSynth, this.padFilter, this.noiseSource, this.noiseFilter, this.noiseGain,
     this.reverb, this.chorus, this.limiter, this.masterGain, this.spraySynth,
     this.sparkleNoise, this.sparkleFilter, this.sparkleGain, this.glimmerSynth,
     this.closureSynth, this.suctionNoise, this.suctionFilter].forEach(n => n?.dispose());
    this.isInitialized = false;
  }
}

export const soundEngine = new SoundEngine();
