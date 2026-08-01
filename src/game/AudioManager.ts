export class AudioManager {
  private ctx: AudioContext | null = null;
  private sizzleGain: GainNode | null = null;
  public bgmVolume: number = 0.5;
  public sfxVolume: number = 0.8;

  public init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.createNoiseBuffer();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  private noiseBuffer: AudioBuffer | null = null;
  private chopBuffer: AudioBuffer | null = null;
  
  private createNoiseBuffer() {
    if (!this.ctx) return;
    const bufferSize = this.ctx.sampleRate * 2; // 2 seconds of noise
    this.noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = this.noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }
    
    // Load external chopping audio
    fetch('/chop.m4a')
      .then(res => res.arrayBuffer())
      .then(data => this.ctx?.decodeAudioData(data))
      .then(buffer => {
        if (buffer) this.chopBuffer = buffer;
      })
      .catch(e => console.error("Could not load chop sound", e));
  }

  private playTone(freq: number, type: OscillatorType, duration: number, vol: number = 0.1) {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
    gain.gain.setValueAtTime(vol * this.sfxVolume, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + duration);
  }

  public playClick() { this.playTone(800, 'sine', 0.05, 0.1); }
  
  public playChop() { 
    if (!this.ctx) return;
    
    // If the real audio is loaded, play a 0.2s snippet of it
    if (this.chopBuffer) {
      const src = this.ctx.createBufferSource();
      src.buffer = this.chopBuffer;
      const gain = this.ctx.createGain();
      gain.gain.value = 1.0 * this.sfxVolume;
      src.connect(gain);
      gain.connect(this.ctx.destination);
      
      // The ASMR video is long, play a random 0.15s slice
      const duration = this.chopBuffer.duration;
      const startTime = Math.random() * Math.max(0, duration - 1); // Pick a random start time
      src.start(0, startTime, 0.15);
      return;
    }
    
    // Fallback: Impact "thwack"
    if (!this.noiseBuffer) return;
    const osc = this.ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(150, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(40, this.ctx.currentTime + 0.1);
    
    // Noise "crunch"
    const noiseSrc = this.ctx.createBufferSource();
    noiseSrc.buffer = this.noiseBuffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 1200;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(1 * this.sfxVolume, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.1);

    osc.connect(gain);
    noiseSrc.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);
    
    osc.start();
    noiseSrc.start();
    osc.stop(this.ctx.currentTime + 0.1);
    noiseSrc.stop(this.ctx.currentTime + 0.1);
  }
  
  public playEat() {
    const ctx = this.ctx;
    const noiseBuffer = this.noiseBuffer;
    if (!ctx || !noiseBuffer) return;
    
    // Quick double crunch
    const playCrunch = (timeOffset: number) => {
      const noiseSrc = ctx.createBufferSource();
      noiseSrc.buffer = noiseBuffer;
      
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 800;

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(1 * this.sfxVolume, ctx.currentTime + timeOffset);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + timeOffset + 0.15);

      noiseSrc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      
      noiseSrc.start(ctx.currentTime + timeOffset);
      noiseSrc.stop(ctx.currentTime + timeOffset + 0.15);
    };

    playCrunch(0);
    playCrunch(0.15);
  }
  
  public playTrash() {
    if (!this.ctx || !this.noiseBuffer) return;
    const noiseSrc = this.ctx.createBufferSource();
    noiseSrc.buffer = this.noiseBuffer;
    
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 300;

    const gain = this.ctx.createGain();
    // Making trash sound louder and more like a crumple
    gain.gain.setValueAtTime(1.0 * this.sfxVolume, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.4);

    noiseSrc.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);
    
    noiseSrc.start();
    noiseSrc.stop(this.ctx.currentTime + 0.3);
  }
  public playPickup() { this.playTone(600, 'sine', 0.1, 0.1); }
  public playDrop() { this.playTone(300, 'triangle', 0.1, 0.1); }
  
  public playDeliver() { 
    this.playTone(523.25, 'sine', 0.3, 0.1); // C5
    setTimeout(() => this.playTone(659.25, 'sine', 0.4, 0.1), 100); // E5
    setTimeout(() => this.playTone(783.99, 'sine', 0.5, 0.1), 200); // G5
  }
  
  public playError() { 
    this.playTone(200, 'sawtooth', 0.4, 0.1); 
    setTimeout(() => this.playTone(150, 'sawtooth', 0.4, 0.1), 150); 
  }

  public playGameOver() {
    // A descending, sad tone for game over
    this.playTone(400, 'sawtooth', 0.5, 0.3);
    setTimeout(() => this.playTone(350, 'sawtooth', 0.5, 0.3), 300);
    setTimeout(() => this.playTone(300, 'sawtooth', 0.5, 0.3), 600);
    setTimeout(() => this.playTone(200, 'sawtooth', 0.5, 0.6), 900);
  }

  public playTick() {
    this.playTone(1000, 'square', 0.05, 0.05); // High pitched, very short tick
  }

  private lastWalkTime = 0;
  public playWalk() {
    const now = Date.now();
    if (now - this.lastWalkTime > 300) {
      this.lastWalkTime = now;
      if (!this.ctx || !this.noiseBuffer) return;
      
      const noiseSrc = this.ctx.createBufferSource();
      noiseSrc.buffer = this.noiseBuffer;
      
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 400; // Low frequency for a soft footstep
      
      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.4 * this.sfxVolume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.1);
      
      noiseSrc.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);
      
      noiseSrc.start();
      noiseSrc.stop(this.ctx.currentTime + 0.1);
    }
  }

  private sizzleSrc: AudioBufferSourceNode | null = null;
  public setCooking(isCooking: boolean) {
    if (!this.ctx || !this.noiseBuffer) return;
    if (isCooking && !this.sizzleSrc) {
      this.sizzleSrc = this.ctx.createBufferSource();
      this.sizzleSrc.buffer = this.noiseBuffer;
      this.sizzleSrc.loop = true;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 3500;
      filter.Q.value = 0.5;

      this.sizzleGain = this.ctx.createGain();
      this.sizzleGain.gain.setValueAtTime(0, this.ctx.currentTime);
      this.sizzleGain.gain.linearRampToValueAtTime(0.4 * this.sfxVolume, this.ctx.currentTime + 0.5); // Fade in
      
      this.sizzleSrc.connect(filter);
      filter.connect(this.sizzleGain);
      this.sizzleGain.connect(this.ctx.destination);
      this.sizzleSrc.start();
    } else if (!isCooking && this.sizzleSrc) {
      if (this.sizzleGain) {
        this.sizzleGain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.2); // Fade out
      }
      const src = this.sizzleSrc;
      setTimeout(() => { src.stop(); src.disconnect(); }, 200);
      this.sizzleSrc = null;
      this.sizzleGain = null;
    }
  } 
  
  // Background music audio element
  private bgmAudio: HTMLAudioElement | null = null;
  public playBGM() {
    this.init();
    if (!this.bgmAudio) {
      this.bgmAudio = new Audio('/bgm.mp3');
      this.bgmAudio.loop = true;
    }
    this.bgmAudio.volume = 0.3 * this.bgmVolume;
    this.bgmAudio.play().catch(e => console.error("Audio play failed:", e));
  }

  public setBGMVolume(vol: number) {
    this.bgmVolume = vol;
    if (this.bgmAudio) {
      this.bgmAudio.volume = 0.3 * this.bgmVolume;
    }
  }

  public setSFXVolume(vol: number) {
    this.sfxVolume = vol;
    if (this.sizzleGain && this.ctx) {
      // Re-adjust sizzle if it's playing
      this.sizzleGain.gain.setTargetAtTime(0.4 * this.sfxVolume, this.ctx.currentTime, 0.1);
    }
  }

  public toggleMusic() {
    if (this.bgmAudio) {
      if (this.bgmAudio.paused) {
        this.bgmAudio.play().catch(e => console.error("Audio play failed:", e));
      } else {
        this.bgmAudio.pause();
      }
    }
  }

  public stopBGM() {
    if (this.bgmAudio) {
      this.bgmAudio.pause();
      this.bgmAudio.currentTime = 0;
    }
    this.setCooking(false);
  }
}
export const audioManager = new AudioManager();
