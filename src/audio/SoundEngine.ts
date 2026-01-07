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

    // Much softer master output
    this.limiter = new Tone.Limiter(-6).toDestination();
    this.masterGain = new Tone.Gain(0.25).connect(this.limiter);

    // Softer, more airy reverb
    this.reverb = new Tone.Reverb({ decay: 4.5, wet: 0.55 }).connect(this.masterGain);
    await this.reverb.generate();

    // Gentle chorus for dreamy quality
    this.chorus = new Tone.Chorus({ frequency: 0.15, delayTime: 4, depth: 0.15, wet: 0.25 }).connect(this.reverb);
    this.chorus.start();

    // Very soft ambient pad - barely audible drone
    this.padFilter = new Tone.Filter({ frequency: 400, type: 'lowpass', rolloff: -24, Q: 0.5 }).connect(this.chorus);
    this.padSynth = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'sine' },
      envelope: { attack: 4, decay: 2, sustain: 0.6, release: 5 },
      volume: -32, // Much quieter
    }).connect(this.padFilter);

    // Soft air noise - like gentle breeze
    this.noiseFilter = new Tone.Filter({ frequency: 1200, type: 'lowpass', rolloff: -48 }).connect(this.chorus);
    this.noiseGain = new Tone.Gain(0.03).connect(this.noiseFilter); // Very quiet
    this.noiseSource = new Tone.Noise({ type: 'pink', volume: -36 }).connect(this.noiseGain);

    // Spray synth - softer, more bell-like
    this.spraySynth = new Tone.Synth({
      oscillator: { type: 'sine' },
      envelope: { attack: 0.02, decay: 0.25, sustain: 0, release: 0.3 },
      volume: -24,
    }).connect(this.reverb);

    // Sparkle noise - whisper quiet
    this.sparkleFilter = new Tone.Filter({ frequency: 3000, type: 'bandpass', Q: 1 }).connect(this.reverb);
    this.sparkleGain = new Tone.Gain(0).connect(this.sparkleFilter);
    this.sparkleNoise = new Tone.Noise({ type: 'white', volume: -40 }).connect(this.sparkleGain);

    // Glimmer capture - gentle chime
    this.glimmerSynth = new Tone.Synth({
      oscillator: { type: 'sine' },
      envelope: { attack: 0.05, decay: 0.5, sustain: 0.1, release: 0.8 },
      volume: -22,
    }).connect(this.reverb);

    // Closure synth - soft, warm chord
    this.closureSynth = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'sine' },
      envelope: { attack: 0.1, decay: 0.5, sustain: 0.3, release: 1.5 },
      volume: -20,
    }).connect(this.reverb);

    // Suction - very subtle
    this.suctionFilter = new Tone.Filter({ frequency: 150, type: 'lowpass', rolloff: -48 }).connect(this.masterGain);
    this.suctionNoise = new Tone.Noise({ type: 'brown', volume: -32 }).connect(this.suctionFilter);

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

    // Noise fades out gently as clarity increases
    if (this.noiseGain) {
      this.noiseGain.gain.rampTo(0.04 * (1 - this.clarity * 0.85), 0.5);
    }
    // Filter opens as clarity increases
    if (this.noiseFilter) {
      this.noiseFilter.frequency.rampTo(600 + this.clarity * 1200, 0.5);
    }
    // Pad filter opens for brighter tone
    if (this.padFilter) {
      this.padFilter.frequency.rampTo(300 + config.filterFreq * this.clarity * 0.4, 0.5);
    }
    // Less detune = more focused tone
    if (this.padSynth) {
      this.padSynth.set({ detune: config.padDetune * (1 - this.clarity * 0.95) });
    }
    // Slightly drier at high clarity
    if (this.reverb) {
      this.reverb.wet.rampTo(0.6 - this.clarity * 0.2, 0.5);
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
    
    // Gentler pitch mapping - higher register, softer
    const scaleIndex = Math.floor(x * SPRAY_SCALE.length);
    const interval = SPRAY_SCALE[Math.min(scaleIndex, SPRAY_SCALE.length - 1)];
    const baseFreq = config.sparkleFreqRange[0] * 1.5; // Higher base
    const freq = baseFreq * Math.pow(2, interval / 12) + (Math.random() - 0.5) * 15;
    
    // Y affects brightness subtly
    const brightness = 2500 + (1 - y) * 2000;

    if (this.sparkleFilter) this.sparkleFilter.frequency.value = brightness;
    
    if (this.spraySynth) {
      const attack = config.sparkleAttack * (1.2 + Math.random() * 0.5);
      const decay = config.sparkleDecay * (1 + this.sprayStrength * 0.3);
      this.spraySynth.set({ 
        envelope: { attack, decay, sustain: 0, release: decay * 1.5 }
      });
      this.spraySynth.triggerAttackRelease(freq, decay);
    }
    
    // Very subtle sparkle burst
    if (this.sparkleGain) {
      const burstLevel = 0.02 + this.sprayStrength * 0.03;
      this.sparkleGain.gain.setValueAtTime(burstLevel, Tone.now());
      this.sparkleGain.gain.exponentialRampToValueAtTime(0.001, Tone.now() + 0.2);
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
