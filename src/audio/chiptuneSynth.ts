/**
 * 16-bit Web Audio API Chiptune Synthesizer (zero external audio files).
 * Covers combat, mining, waypoints, chest open, forge sparks, quest turn-in, and UI.
 */
class ChiptuneSynth {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  muted = false;
  private lastTick: Record<string, number> = {};

  unlock() {
    if (this.ctx) {
      if (this.ctx.state === "suspended") this.ctx.resume().catch(() => {});
      return;
    }
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AC) return;
    this.ctx = new AC();
    const comp = this.ctx.createDynamicsCompressor();
    comp.threshold.value = -16;
    comp.ratio.value = 6;
    this.master = this.ctx.createGain();
    this.master.gain.value = 0.24;
    this.master.connect(comp);
    comp.connect(this.ctx.destination);
  }

  toggleMute(): boolean {
    this.muted = !this.muted;
    if (this.master) this.master.gain.value = this.muted ? 0 : 0.24;
    return this.muted;
  }

  private throttle(key: string, minMs: number): boolean {
    const now = performance.now();
    if (now - (this.lastTick[key] ?? 0) < minMs) return false;
    this.lastTick[key] = now;
    return true;
  }

  private tone(
    freq: number,
    endFreq: number,
    dur: number,
    type: OscillatorType = "square",
    vol = 0.22,
    delay = 0
  ) {
    if (this.muted || !this.ctx || !this.master) return;
    const t0 = this.ctx.currentTime + delay;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(Math.max(30, freq), t0);
    if (endFreq !== freq) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(30, endFreq), t0 + dur);
    }
    g.gain.setValueAtTime(vol, t0);
    g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
    osc.connect(g);
    g.connect(this.master);
    osc.start(t0);
    osc.stop(t0 + dur + 0.01);
  }

  private noise(dur: number, vol = 0.16, filterFreq = 1800, delay = 0) {
    if (this.muted || !this.ctx || !this.master) return;
    const sr = this.ctx.sampleRate;
    const len = Math.max(1, Math.floor(sr * dur));
    const buf = this.ctx.createBuffer(1, len, sr);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    const flt = this.ctx.createBiquadFilter();
    flt.type = "bandpass";
    flt.frequency.value = filterFreq;
    const g = this.ctx.createGain();
    const t0 = this.ctx.currentTime + delay;
    g.gain.setValueAtTime(vol, t0);
    g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
    src.connect(flt);
    flt.connect(g);
    g.connect(this.master);
    src.start(t0);
  }

  playSlash(combo = 0) {
    if (!this.throttle("slash", 50)) return;
    const base = 300 + combo * 75;
    this.tone(base, 110, 0.1, "sawtooth", 0.2);
    this.noise(0.07, 0.14, 2400 + combo * 400);
  }

  playChargeRelease() {
    this.tone(240, 880, 0.16, "sawtooth", 0.26);
    this.tone(480, 1120, 0.18, "square", 0.18, 0.03);
    this.noise(0.12, 0.18, 3200);
  }

  playShoot(pitch = 680) {
    if (!this.throttle("shoot", 40)) return;
    this.tone(pitch, pitch * 0.35, 0.08, "square", 0.17);
  }

  playMagic(elementIdx = 0) {
    if (!this.throttle("magic", 55)) return;
    const base = [420, 620, 320][elementIdx % 3];
    this.tone(base, base * 1.55, 0.12, "triangle", 0.22);
    this.tone(base * 0.5, base * 0.9, 0.11, "square", 0.1);
  }

  playLaser() {
    this.tone(920, 220, 0.28, "sawtooth", 0.26);
    this.tone(460, 140, 0.26, "square", 0.18, 0.02);
    this.noise(0.18, 0.18, 2800);
  }

  playBlock() {
    this.tone(520, 960, 0.09, "square", 0.24);
    this.tone(1040, 1480, 0.12, "triangle", 0.22, 0.04);
  }

  playHit(crit = false) {
    if (!this.throttle(crit ? "crit" : "hit", 35)) return;
    if (crit) {
      this.tone(680, 1320, 0.09, "square", 0.24);
      this.noise(0.09, 0.2, 3400);
    } else {
      this.tone(220, 95, 0.06, "square", 0.15);
      this.noise(0.045, 0.12, 1600);
    }
  }

  playExplosion() {
    if (!this.throttle("exp", 80)) return;
    this.tone(140, 38, 0.28, "sawtooth", 0.28);
    this.noise(0.26, 0.26, 650);
  }

  playDash() {
    this.tone(260, 580, 0.09, "triangle", 0.18);
    this.noise(0.07, 0.11, 3000);
  }

  playMine(broken = false) {
    this.tone(broken ? 480 : 620, broken ? 140 : 380, broken ? 0.18 : 0.08, "triangle", 0.24);
    this.noise(broken ? 0.16 : 0.05, broken ? 0.2 : 0.12, 2200);
  }

  playLootPickup(rare = false) {
    if (!this.throttle("loot", 45)) return;
    if (rare) {
      this.tone(523, 523, 0.08, "square", 0.18, 0);
      this.tone(659, 659, 0.08, "square", 0.18, 0.06);
      this.tone(784, 784, 0.12, "square", 0.2, 0.12);
      this.tone(1046, 1046, 0.2, "triangle", 0.22, 0.18);
    } else {
      this.tone(587, 880, 0.08, "square", 0.16);
    }
  }

  playChestOpen() {
    const notes = [392, 494, 587, 784, 988];
    notes.forEach((n, i) => this.tone(n, n, 0.12, "square", 0.2, i * 0.07));
  }

  playWaypoint() {
    const chord = [262, 330, 392, 523, 659, 784, 1046];
    chord.forEach((n, i) => this.tone(n, n * 1.02, 0.24, "triangle", 0.2, i * 0.065));
  }

  playForgeSuccess() {
    this.tone(440, 880, 0.1, "square", 0.22, 0);
    this.tone(660, 1320, 0.14, "square", 0.22, 0.09);
    this.tone(880, 1760, 0.24, "triangle", 0.24, 0.18);
  }

  playForgeFail() {
    this.tone(240, 140, 0.18, "sawtooth", 0.22, 0);
    this.tone(160, 90, 0.22, "sawtooth", 0.2, 0.14);
  }

  playMatrixChannel() {
    const notes = [294, 370, 440, 587, 740, 880];
    notes.forEach((n, i) => this.tone(n, n * 1.06, 0.18, "triangle", 0.17, i * 0.18));
  }

  playMatrixShatter() {
    this.tone(260, 62, 0.35, "sawtooth", 0.28, 0);
    this.tone(190, 48, 0.32, "square", 0.22, 0.08);
    this.noise(0.28, 0.25, 1100);
  }

  playPunch() {
    if (!this.throttle("punch", 50)) return;
    this.tone(240, 95, 0.075, "triangle", 0.2);
    this.noise(0.045, 0.14, 1500);
  }

  playQuestComplete() {
    const fanfare = [523, 659, 784, 1046];
    fanfare.forEach((n, i) => this.tone(n, n, 0.16, "square", 0.2, i * 0.085));
  }

  playLevelUp() {
    const notes = [392, 523, 659, 784, 1046, 1318];
    notes.forEach((n, i) => this.tone(n, n, 0.15, "square", 0.21, i * 0.07));
  }

  playOverdrive() {
    this.tone(220, 880, 0.28, "sawtooth", 0.26);
    this.tone(440, 1320, 0.3, "square", 0.2, 0.06);
  }

  playBossRoar() {
    this.tone(130, 52, 0.45, "sawtooth", 0.3);
    this.noise(0.35, 0.24, 480);
  }

  playPlayerHit() {
    if (!this.throttle("phit", 140)) return;
    this.tone(190, 80, 0.14, "sawtooth", 0.26);
    this.noise(0.1, 0.2, 900);
  }

  playBuy() {
    this.tone(660, 990, 0.08, "square", 0.18);
    this.tone(990, 1320, 0.1, "triangle", 0.18, 0.07);
  }

  playUiClick() {
    if (!this.throttle("ui", 35)) return;
    this.tone(540, 720, 0.045, "square", 0.12);
  }

  playBagOpen() {
    this.tone(330, 440, 0.06, "triangle", 0.16, 0);
    this.tone(494, 660, 0.08, "square", 0.14, 0.05);
    this.noise(0.05, 0.08, 2200, 0.01);
  }

  playEquipWeapon() {
    // Crisp metallic blade unsheathe sweep
    this.tone(520, 1180, 0.09, "sawtooth", 0.18, 0);
    this.tone(880, 1420, 0.11, "triangle", 0.18, 0.05);
    this.noise(0.06, 0.12, 3600, 0);
  }

  playEquipArmor() {
    // Heavy 16-bit armor / helmet / boots clank
    this.tone(180, 110, 0.08, "square", 0.22, 0);
    this.tone(320, 460, 0.09, "square", 0.16, 0.045);
    this.noise(0.07, 0.15, 1400, 0.01);
  }

  playEquipAccessory() {
    // Crystal chime for ring / charm
    this.tone(659, 659, 0.07, "triangle", 0.18, 0);
    this.tone(988, 1318, 0.14, "triangle", 0.2, 0.05);
  }

  playUnequip() {
    this.tone(480, 290, 0.08, "triangle", 0.15, 0);
  }

  playDismantle() {
    // Prism shatter + ascending crystal sparkles
    this.noise(0.11, 0.2, 3200, 0);
    this.tone(420, 210, 0.1, "sawtooth", 0.18, 0);
    this.tone(740, 1046, 0.1, "triangle", 0.16, 0.07);
    this.tone(988, 1480, 0.14, "triangle", 0.18, 0.13);
  }

  playHiddenDrop() {
    // Shimmering prismatic discovery arpeggio + resonant chime
    const notes = [523, 659, 784, 1046, 1318, 1568];
    notes.forEach((n, i) => this.tone(n, n * 1.03, 0.2, "triangle", 0.22, i * 0.055));
    this.noise(0.14, 0.12, 4200, 0.04);
  }

  playHiddenUnlock() {
    // Triumphant golden-crystal chord for permanently unlocking a Hidden Relic
    this.tone(392, 523, 0.12, "square", 0.18, 0);
    this.tone(523, 784, 0.16, "triangle", 0.22, 0.06);
    this.tone(784, 1568, 0.28, "triangle", 0.24, 0.12);
  }
}

export const sfx = new ChiptuneSynth();
