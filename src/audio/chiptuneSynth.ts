import type { BiomeId, ClassId, ConsumableGroup, ElementType, Rarity } from "../data/types";

export const AUDIO_STORAGE_KEY = "pixtel_audio_settings_v1";

export const HYBRID_SFX_IDS = [
  "step_town",
  "step_meadow",
  "step_quartz",
  "step_amber",
  "step_ruins",
  "step_water",
  "boss_roar_warden",
  "boss_roar_blight",
  "boss_roar_gilded",
  "boss_roar_eraser",
  "chest_open",
  "waypoint_chime",
  "mine_hit",
  "mine_break",
  "forge_anvil",
  "coop_ping",
] as const;

export type HybridSfxId = (typeof HYBRID_SFX_IDS)[number];

export type FootstepSurfaceId = BiomeId | "water";

export type NpcVoiceId =
  | "npc_elder"
  | "npc_blacksmith"
  | "npc_merchant"
  | "narrator"
  | "prism_knight"
  | "chroma_mage"
  | "bit_rogue"
  | "pixel_tinker"
  | "boss_xing_warden"
  | "boss_blight_root"
  | "boss_gilded_null"
  | "boss_the_eraser";

export interface NpcVoiceProfile {
  id: NpcVoiceId;
  baseFreq: number;
  wave: OscillatorType;
  dur: number;
  vol: number;
  harmonicRatio?: number;
  glitch?: boolean;
}

export const NPC_VOICE_PROFILES: Record<NpcVoiceId, NpcVoiceProfile> = {
  npc_elder: { id: "npc_elder", baseFreq: 215, wave: "triangle", dur: 0.052, vol: 0.16, harmonicRatio: 1.5 },
  npc_blacksmith: { id: "npc_blacksmith", baseFreq: 154, wave: "sawtooth", dur: 0.055, vol: 0.15, harmonicRatio: 2.0 },
  npc_merchant: { id: "npc_merchant", baseFreq: 432, wave: "triangle", dur: 0.044, vol: 0.15, harmonicRatio: 1.25 },
  narrator: { id: "narrator", baseFreq: 312, wave: "triangle", dur: 0.046, vol: 0.13, harmonicRatio: 2.0 },
  prism_knight: { id: "prism_knight", baseFreq: 274, wave: "square", dur: 0.045, vol: 0.13 },
  chroma_mage: { id: "chroma_mage", baseFreq: 392, wave: "triangle", dur: 0.046, vol: 0.14, harmonicRatio: 1.5 },
  bit_rogue: { id: "bit_rogue", baseFreq: 342, wave: "square", dur: 0.038, vol: 0.12 },
  pixel_tinker: { id: "pixel_tinker", baseFreq: 468, wave: "square", dur: 0.04, vol: 0.12, harmonicRatio: 1.33 },
  boss_xing_warden: { id: "boss_xing_warden", baseFreq: 118, wave: "sawtooth", dur: 0.064, vol: 0.17, harmonicRatio: 1.5 },
  boss_blight_root: { id: "boss_blight_root", baseFreq: 252, wave: "sawtooth", dur: 0.056, vol: 0.16, harmonicRatio: 2.5 },
  boss_gilded_null: { id: "boss_gilded_null", baseFreq: 104, wave: "sawtooth", dur: 0.066, vol: 0.18, harmonicRatio: 2.0 },
  boss_the_eraser: { id: "boss_the_eraser", baseFreq: 142, wave: "square", dur: 0.052, vol: 0.17, glitch: true },
};

export type SpatialSfxKind =
  | "slash"
  | "charge"
  | "skill"
  | "ult"
  | "dash"
  | "reaction"
  | "waypoint"
  | "ping"
  | "footstep"
  | "boss_roar"
  | "explosion"
  | "hit";

export interface SpatialAudioParams {
  distance: number;
  gain: number;
  pan: number;
  filterHz: number;
  audible: boolean;
}

export interface SfxEventRecord {
  tag: string;
  mode: "procedural" | "hybrid_buffer" | "hybrid_fallback" | "spatial";
  freq?: number;
  gain?: number;
  pan?: number;
  detail?: string;
}

export interface ChiptuneSynthOptions {
  contextFactory?: () => AudioContext | null;
  fetchFn?: (url: string) => Promise<{ ok: boolean; arrayBuffer: () => Promise<ArrayBuffer> }>;
  storage?: Pick<Storage, "getItem" | "setItem">;
  preferredFormat?: "ogg" | "mp3";
  basePath?: string;
  autoBindDom?: boolean;
  maxVoices?: number;
}

const MAX_GAIN_AT_FULL_VOLUME = 0.34;
const DEFAULT_VOLUME = 0.8;

/**
 * Computes 2D Retro Spatial Audio attenuation, stereo pan, and distance low-pass cutoff
 * for Co-op teammates and off-center world events (calibrated to PixTel's 480x270 viewport & 420px sync radius).
 */
export function computeSpatialParams(
  listenerX: number,
  listenerY: number,
  sourceX: number,
  sourceY: number,
  maxDist = 420,
  refDist = 48
): SpatialAudioParams {
  const dx = sourceX - listenerX;
  const dy = sourceY - listenerY;
  const distance = Math.hypot(dx, dy);
  if (!Number.isFinite(distance) || distance >= maxDist) {
    return { distance, gain: 0, pan: 0, filterHz: 1600, audible: false };
  }
  const pan = Math.max(-0.85, Math.min(0.85, dx / 180));
  if (distance <= refDist) {
    return { distance, gain: 1, pan, filterHz: 12000, audible: true };
  }
  const norm = Math.max(0, Math.min(1, 1 - (distance - refDist) / Math.max(1, maxDist - refDist)));
  const gain = Math.round(Math.pow(norm, 1.55) * 1000) / 1000;
  const filterHz = Math.round(1800 + norm * 10200);
  return {
    distance,
    gain,
    pan,
    filterHz,
    audible: gain >= 0.025,
  };
}

function detectPreferredAudioFormat(): "ogg" | "mp3" {
  if (typeof document === "undefined") return "ogg";
  try {
    const probe = document.createElement("audio");
    if (typeof probe.canPlayType === "function") {
      const oggSupport = probe.canPlayType('audio/ogg; codecs="vorbis"');
      if (oggSupport === "probably" || oggSupport === "maybe") {
        return "ogg";
      }
    }
  } catch {
    // ignore in headless environments
  }
  return "mp3";
}

function isMobileAudioEnvironment(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent || "";
  if (/Android|iPhone|iPad|iPod|Mobile/i.test(ua)) return true;
  if (typeof window !== "undefined" && typeof window.matchMedia === "function") {
    try {
      return window.matchMedia("(pointer: coarse)").matches;
    } catch {
      return false;
    }
  }
  return false;
}

/**
 * Retro 16-bit JRPG Hybrid Sound Engine (`ChiptuneSynth`):
 * 1. Zero-latency Web Audio API procedural chiptune synthesizer (4 Classes, 41 Weapon Skills,
 *    9 Elements + Pairwise/Prismatic Reactions, UI, Forge, Gacha, Character-specific NPC voices).
 * 2. Hybrid `AudioBuffer` loader (`/sfx/*.ogg` & `.mp3` 22050 Hz Mono -3 dBFS) for footsteps,
 *    Boss roars, chests, waypoints, mining, anvil & Co-op beacons — with instant procedural fallback.
 * 3. Mobile-optimized auto-unlock, voice polyphony cap, reusable LFSR/white noise buffers,
 *    2D Co-op Spatial Audio (`playSpatialSfx`), and `localStorage` volume/mute persistence.
 */
export class ChiptuneSynth {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private whiteNoiseBuf: AudioBuffer | null = null;
  private lfsrNoiseBuf: AudioBuffer | null = null;

  muted = false;
  private volume = DEFAULT_VOLUME;
  private lastTick: Record<string, number> = {};
  private activeVoices = 0;
  private maxVoices = 24;

  private bufferCache = new Map<HybridSfxId, AudioBuffer>();
  private loadingPromises = new Map<HybridSfxId, Promise<AudioBuffer | null>>();
  private failedClips = new Set<string>();
  private prewarmed = false;

  private readonly contextFactory?: () => AudioContext | null;
  private readonly fetchFn?: ChiptuneSynthOptions["fetchFn"];
  private readonly storage?: Pick<Storage, "getItem" | "setItem">;
  private readonly preferredFormat: "ogg" | "mp3";
  private readonly basePath: string;
  private changeListeners = new Set<(muted: boolean, volume: number) => void>();
  private recentEvents: SfxEventRecord[] = [];
  private domBound = false;

  constructor(opts?: ChiptuneSynthOptions) {
    this.contextFactory = opts?.contextFactory;
    this.fetchFn = opts?.fetchFn;
    this.storage =
      opts?.storage ??
      (typeof window !== "undefined" && window.localStorage ? window.localStorage : undefined);
    this.preferredFormat = opts?.preferredFormat ?? detectPreferredAudioFormat();
    this.basePath = opts?.basePath ?? "./sfx";
    this.maxVoices = opts?.maxVoices ?? (isMobileAudioEnvironment() ? 14 : 24);

    this._loadPersistedSettings();
    if (opts?.autoBindDom !== false && typeof window !== "undefined" && typeof document !== "undefined") {
      this._bindMobileAutoUnlock();
    }
  }

  private _recordEvent(ev: SfxEventRecord) {
    this.recentEvents.push(ev);
    if (this.recentEvents.length > 64) {
      this.recentEvents.shift();
    }
  }

  getRecentEvents(): readonly SfxEventRecord[] {
    return this.recentEvents;
  }

  resetTelemetry() {
    this.recentEvents.length = 0;
    this.lastTick = {};
    this.activeVoices = 0;
  }

  getPreferredFormat(): "ogg" | "mp3" {
    return this.preferredFormat;
  }

  hasCachedBuffer(id: HybridSfxId): boolean {
    return this.bufferCache.has(id);
  }

  onChange(listener: (muted: boolean, volume: number) => void): () => void {
    this.changeListeners.add(listener);
    return () => this.changeListeners.delete(listener);
  }

  private _emitChange() {
    for (const cb of this.changeListeners) {
      try {
        cb(this.muted, this.volume);
      } catch {
        // ignore listener errors
      }
    }
  }

  private _loadPersistedSettings() {
    if (!this.storage) return;
    try {
      const raw = this.storage.getItem(AUDIO_STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as { muted?: unknown; volume?: unknown };
      if (typeof parsed.muted === "boolean") {
        this.muted = parsed.muted;
      }
      if (typeof parsed.volume === "number" && Number.isFinite(parsed.volume)) {
        this.volume = Math.max(0, Math.min(1, parsed.volume));
      }
    } catch {
      // ignore malformed storage
    }
  }

  private _savePersistedSettings() {
    if (!this.storage) return;
    try {
      this.storage.setItem(
        AUDIO_STORAGE_KEY,
        JSON.stringify({
          muted: this.muted,
          volume: Math.round(this.volume * 100) / 100,
        })
      );
    } catch {
      // ignore quota / private-mode errors
    }
  }

  private _syncMasterGain() {
    if (!this.master) return;
    const target = this.muted ? 0 : this.volume * MAX_GAIN_AT_FULL_VOLUME;
    this.master.gain.value = target;
  }

  getVolume(): number {
    return this.volume;
  }

  setVolume(nextVolume: number): number {
    const clamped = Math.max(0, Math.min(1, Number.isFinite(nextVolume) ? nextVolume : DEFAULT_VOLUME));
    this.volume = clamped;
    if (clamped > 0 && this.muted) {
      this.muted = false;
    }
    this._syncMasterGain();
    this._savePersistedSettings();
    this._emitChange();
    return this.volume;
  }

  setMuted(nextMuted: boolean): boolean {
    this.muted = Boolean(nextMuted);
    this._syncMasterGain();
    this._savePersistedSettings();
    this._emitChange();
    return this.muted;
  }

  toggleMute(): boolean {
    return this.setMuted(!this.muted);
  }

  private _bindMobileAutoUnlock() {
    if (this.domBound || typeof window === "undefined" || typeof document === "undefined") return;
    this.domBound = true;
    const unlockHandler = () => {
      this.unlock();
    };
    window.addEventListener("pointerdown", unlockHandler, { passive: true });
    window.addEventListener("touchstart", unlockHandler, { passive: true });
    window.addEventListener("keydown", unlockHandler, { passive: true });
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible" && this.ctx && this.ctx.state === "suspended") {
        this.ctx.resume().catch(() => {});
      }
    });
  }

  unlock() {
    if (this.ctx) {
      if (this.ctx.state === "suspended") {
        this.ctx.resume().catch(() => {});
      }
      if (!this.prewarmed) {
        this.prewarmed = true;
        void this.preloadHybridBank();
      }
      return;
    }

    let created: AudioContext | null = null;
    if (this.contextFactory) {
      created = this.contextFactory();
    } else if (typeof window !== "undefined") {
      const AC =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (AC) {
        try {
          created = new AC({ latencyHint: "interactive" });
        } catch {
          created = new AC();
        }
      }
    }
    if (!created) return;

    this.ctx = created;
    this.master = this.ctx.createGain();
    this._syncMasterGain();

    if (typeof this.ctx.createDynamicsCompressor === "function") {
      const comp = this.ctx.createDynamicsCompressor();
      comp.threshold.value = -14;
      comp.knee.value = 10;
      comp.ratio.value = 5.5;
      comp.attack.value = 0.003;
      comp.release.value = 0.14;
      this.master.connect(comp);
      comp.connect(this.ctx.destination);
    } else {
      this.master.connect(this.ctx.destination);
    }

    this._initSharedNoiseBuffers();
    this._playSilentIosUnlockPulse();

    if (this.ctx.state === "suspended") {
      this.ctx.resume().catch(() => {});
    }
    if (!this.prewarmed) {
      this.prewarmed = true;
      void this.preloadHybridBank();
    }
  }

  private _playSilentIosUnlockPulse() {
    if (!this.ctx) return;
    try {
      const buf = this.ctx.createBuffer(1, 1, this.ctx.sampleRate || 22050);
      const src = this.ctx.createBufferSource();
      src.buffer = buf;
      src.connect(this.ctx.destination);
      src.start(0);
    } catch {
      // ignore
    }
  }

  private _initSharedNoiseBuffers() {
    if (!this.ctx) return;
    const sr = this.ctx.sampleRate || 22050;
    const len = Math.max(256, Math.floor(sr * 0.5));

    const white = this.ctx.createBuffer(1, len, sr);
    const wData = white.getChannelData(0);
    let rng = 0x13579bdf;
    for (let i = 0; i < len; i++) {
      rng = (rng * 1664525 + 1013904223) | 0;
      wData[i] = ((rng >>> 8) / 8388608) - 1;
    }
    this.whiteNoiseBuf = white;

    // 15-bit NES/SNES LFSR periodic metallic noise buffer (authentic 16-bit crunch, 0 GC!)
    const lfsr = this.ctx.createBuffer(1, len, sr);
    const lData = lfsr.getChannelData(0);
    let reg = 0x7fff;
    let cur = 1;
    const hold = Math.max(1, Math.round(sr / 11025));
    for (let i = 0; i < len; i++) {
      if (i % hold === 0) {
        const bit = ((reg >> 0) ^ (reg >> 1)) & 1;
        reg = (reg >> 1) | (bit << 14);
        cur = reg & 1 ? 0.92 : -0.92;
      }
      lData[i] = cur;
    }
    this.lfsrNoiseBuf = lfsr;
  }

  private throttle(key: string, minMs: number): boolean {
    const now = typeof performance !== "undefined" ? performance.now() : Date.now();
    const prev = this.lastTick[key];
    if (prev !== undefined && now - prev < minMs) return false;
    this.lastTick[key] = now;
    return true;
  }

  private _acquireVoice(durSec: number): boolean {
    if (this.activeVoices >= this.maxVoices) return false;
    this.activeVoices += 1;
    const ms = Math.max(25, Math.ceil(durSec * 1000) + 20);
    setTimeout(() => {
      this.activeVoices = Math.max(0, this.activeVoices - 1);
    }, ms);
    return true;
  }

  // ============================================================================
  // Hybrid AudioBuffer Loader (`/sfx/<id>.ogg` or `.mp3` with auto-fallback)
  // ============================================================================
  private async _decodeAudioDataCompat(ab: ArrayBuffer): Promise<AudioBuffer | null> {
    if (!this.ctx) return null;
    const copy = ab.slice(0);
    return new Promise<AudioBuffer | null>((resolve) => {
      let settled = false;
      const done = (buf: AudioBuffer | null) => {
        if (!settled) {
          settled = true;
          resolve(buf);
        }
      };
      try {
        const maybePromise = this.ctx!.decodeAudioData(
          copy,
          (decoded) => done(decoded),
          () => done(null)
        );
        if (maybePromise && typeof maybePromise.then === "function") {
          maybePromise.then(done).catch(() => done(null));
        }
      } catch {
        done(null);
      }
    });
  }

  async loadHybridBuffer(id: HybridSfxId): Promise<AudioBuffer | null> {
    if (this.bufferCache.has(id)) {
      return this.bufferCache.get(id)!;
    }
    if (!this.ctx) return null;
    const inflight = this.loadingPromises.get(id);
    if (inflight) return inflight;

    const fetcher =
      this.fetchFn ??
      (typeof fetch === "function"
        ? (url: string) => fetch(url)
        : null);
    if (!fetcher) return null;

    const exts: ("ogg" | "mp3")[] =
      this.preferredFormat === "ogg" ? ["ogg", "mp3"] : ["mp3", "ogg"];

    const task = (async (): Promise<AudioBuffer | null> => {
      for (const ext of exts) {
        const key = `${id}.${ext}`;
        if (this.failedClips.has(key)) continue;
        const url = `${this.basePath}/${key}`;
        try {
          const res = await fetcher(url);
          if (!res || !res.ok) {
            this.failedClips.add(key);
            continue;
          }
          const ab = await res.arrayBuffer();
          if (!ab || ab.byteLength === 0) {
            this.failedClips.add(key);
            continue;
          }
          const decoded = await this._decodeAudioDataCompat(ab);
          if (decoded) {
            this.bufferCache.set(id, decoded);
            return decoded;
          }
          this.failedClips.add(key);
        } catch {
          this.failedClips.add(key);
        }
      }
      return null;
    })();

    this.loadingPromises.set(id, task);
    try {
      return await task;
    } finally {
      this.loadingPromises.delete(id);
    }
  }

  async preloadHybridBank(ids: readonly HybridSfxId[] = HYBRID_SFX_IDS): Promise<number> {
    if (!this.ctx) return 0;
    let loaded = 0;
    const results = await Promise.allSettled(ids.map((id) => this.loadHybridBuffer(id)));
    for (const r of results) {
      if (r.status === "fulfilled" && r.value) loaded++;
    }
    return loaded;
  }

  private _playBuffer(
    buf: AudioBuffer,
    vol = 0.72,
    rate = 1.0,
    delay = 0,
    dest?: AudioNode
  ): boolean {
    if (this.muted || !this.ctx || !this.master) return false;
    const dur = buf.duration / Math.max(0.25, rate);
    if (!this._acquireVoice(dur + delay)) return false;

    const t0 = this.ctx.currentTime + delay;
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    if (src.playbackRate) {
      src.playbackRate.value = rate;
    }
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(vol, t0);
    src.connect(g);
    g.connect(dest ?? this.master);
    src.start(t0);
    return true;
  }

  /**
   * Plays a Hybrid SFX from `/sfx/<id>.ogg|.mp3` if decoded, or immediately fires
   * `fallback(dest)` via Web Audio API with zero latency while warming the cache.
   */
  playHybrid(
    id: HybridSfxId,
    opts: { vol?: number; rate?: number; delay?: number; dest?: AudioNode },
    fallback: (dest?: AudioNode) => void
  ): "hybrid_buffer" | "hybrid_fallback" | "muted" {
    if (this.muted || this.volume <= 0) return "muted";
    if (!this.ctx) this.unlock();
    if (!this.ctx || !this.master) return "muted";

    const cached = this.bufferCache.get(id);
    if (cached) {
      this._playBuffer(cached, opts.vol ?? 0.78, opts.rate ?? 1.0, opts.delay ?? 0, opts.dest);
      this._recordEvent({
        tag: id,
        mode: "hybrid_buffer",
        gain: opts.vol ?? 0.78,
      });
      return "hybrid_buffer";
    }

    // Trigger async load for subsequent plays and synthesize immediately with 0ms lag!
    void this.loadHybridBuffer(id);
    fallback(opts.dest);
    this._recordEvent({
      tag: id,
      mode: "hybrid_fallback",
      gain: opts.vol ?? 0.78,
    });
    return "hybrid_fallback";
  }

  // ============================================================================
  // Low-Level Procedural Primitives (Oscillator + Shared Noise Buffers)
  // ============================================================================
  private tone(
    freq: number,
    endFreq: number,
    dur: number,
    type: OscillatorType = "square",
    vol = 0.22,
    delay = 0,
    dest?: AudioNode
  ) {
    if (this.muted || this.volume <= 0 || !this.ctx || !this.master) return;
    if (!this._acquireVoice(dur + delay)) return;
    const t0 = this.ctx.currentTime + delay;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = type;
    const fStart = Math.max(28, freq);
    const fEnd = Math.max(28, endFreq);
    osc.frequency.setValueAtTime(fStart, t0);
    if (fEnd !== fStart) {
      osc.frequency.exponentialRampToValueAtTime(fEnd, t0 + dur);
    }
    g.gain.setValueAtTime(vol, t0);
    g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
    osc.connect(g);
    g.connect(dest ?? this.master);
    osc.start(t0);
    osc.stop(t0 + dur + 0.01);
  }

  private noise(
    dur: number,
    vol = 0.16,
    filterFreq = 1800,
    delay = 0,
    metallic = false,
    filterType: BiquadFilterType = "bandpass",
    dest?: AudioNode
  ) {
    if (this.muted || this.volume <= 0 || !this.ctx || !this.master) return;
    if (!this._acquireVoice(dur + delay)) return;
    if (!this.whiteNoiseBuf || !this.lfsrNoiseBuf) {
      this._initSharedNoiseBuffers();
    }
    const buf = metallic ? this.lfsrNoiseBuf : this.whiteNoiseBuf;
    if (!buf) return;

    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    src.loop = dur > buf.duration;
    const flt = this.ctx.createBiquadFilter();
    flt.type = filterType;
    flt.frequency.value = Math.max(60, filterFreq);
    const g = this.ctx.createGain();
    const t0 = this.ctx.currentTime + delay;
    g.gain.setValueAtTime(vol, t0);
    g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
    src.connect(flt);
    flt.connect(g);
    g.connect(dest ?? this.master);
    const offset = Math.random() * Math.max(0, buf.duration - Math.min(dur, buf.duration));
    src.start(t0, offset);
    src.stop(t0 + dur + 0.01);
  }

  // ============================================================================
  // Combat: Basic Attacks, Class Combos, Charge, Weapon Skills [E] & Ultimates [Q]
  // ============================================================================
  playSlash(combo = 0, dest?: AudioNode) {
    if (!dest && !this.throttle("slash", 45)) return;
    const base = 300 + combo * 75;
    this.tone(base, 110, 0.1, "sawtooth", 0.2, 0, dest);
    this.noise(0.07, 0.14, 2400 + combo * 400, 0, true, "bandpass", dest);
    this._recordEvent({ tag: "slash", mode: "procedural", freq: base });
  }

  /** Distinct 16-bit normal/combo attack voice tailored to each of the 4 Hero Classes. */
  playClassAttack(classId: ClassId, comboStep = 0, isFinisher = false, dest?: AudioNode) {
    if (!dest && !this.throttle(`catk_${classId}`, 42)) return;
    const step = Math.max(0, Math.min(3, comboStep));
    if (classId === "prism_knight") {
      const f = 270 + step * 68 + (isFinisher ? 90 : 0);
      this.tone(f, 96, isFinisher ? 0.14 : 0.1, "sawtooth", 0.22, 0, dest);
      this.tone(f * 1.5, f * 0.65, 0.08, "square", 0.12, 0.015, dest);
      this.noise(isFinisher ? 0.1 : 0.065, 0.15, 2200 + step * 350, 0, true, "bandpass", dest);
    } else if (classId === "chroma_mage") {
      const scale = [440, 554, 659, 880];
      const f = scale[step % scale.length];
      this.tone(f, f * (isFinisher ? 1.65 : 1.35), 0.12, "triangle", 0.22, 0, dest);
      this.tone(f * 0.5, f * 0.95, 0.1, "square", 0.1, 0.02, dest);
    } else if (classId === "bit_rogue") {
      const f = 520 + step * 95;
      this.tone(f, 180, 0.065, "square", 0.18, 0, dest);
      this.noise(0.048, 0.14, 3800 + step * 420, 0, false, "highpass", dest);
      if (isFinisher || step >= 1) {
        this.tone(f * 1.18, 210, 0.06, "sawtooth", 0.15, 0.045, dest);
      }
    } else {
      // pixel_tinker
      const pitch = isFinisher ? 920 : 680 + step * 60;
      this.tone(pitch, pitch * 0.34, 0.085, "square", 0.19, 0, dest);
      this.noise(0.045, 0.11, 3200, 0, true, "bandpass", dest);
    }
    this._recordEvent({ tag: `class_atk:${classId}`, mode: "procedural", detail: `step=${step}` });
  }

  playChargeRelease(dest?: AudioNode) {
    this.tone(240, 880, 0.16, "sawtooth", 0.26, 0, dest);
    this.tone(480, 1120, 0.18, "square", 0.18, 0.03, dest);
    this.noise(0.12, 0.18, 3200, 0, true, "bandpass", dest);
    this._recordEvent({ tag: "charge_release", mode: "procedural", freq: 880 });
  }

  playClassCharge(classId: ClassId, justCharge = false, dest?: AudioNode) {
    if (classId === "prism_knight") {
      // Paladin overhead slam: golden bell + seismic impact
      this.tone(220, 660, 0.13, "sawtooth", 0.25, 0, dest);
      this.tone(150, 44, 0.24, "sawtooth", 0.28, 0.06, dest);
      this.noise(0.18, 0.22, 950, 0.05, true, "lowpass", dest);
    } else if (classId === "chroma_mage") {
      // Nova prism burst
      const chord = [523, 659, 784, 1046];
      chord.forEach((n, i) => this.tone(n, n * 1.18, 0.15, "triangle", 0.2, i * 0.025, dest));
    } else if (classId === "bit_rogue") {
      // Cross-shadow execution slice
      this.tone(780, 190, 0.09, "sawtooth", 0.22, 0, dest);
      this.tone(980, 220, 0.1, "square", 0.2, 0.05, dest);
      this.noise(0.09, 0.18, 4400, 0, true, "bandpass", dest);
    } else {
      // Pixel Tinker railgun pierce
      this.tone(1180, 180, 0.22, "sawtooth", 0.25, 0, dest);
      this.noise(0.14, 0.18, 3400, 0, true, "bandpass", dest);
    }
    if (justCharge) {
      // Golden Just-Charge Lv2 harmonic sparkle!
      this.tone(1046, 1568, 0.14, "triangle", 0.22, 0.03, dest);
      this.tone(1568, 2093, 0.18, "triangle", 0.2, 0.08, dest);
    }
    this._recordEvent({
      tag: `class_charge:${classId}`,
      mode: "procedural",
      detail: justCharge ? "just" : "normal",
    });
  }

  /** Procedural 16-bit signature cue for any of the 41 Weapon Skills [E], tinted by Element! */
  playWeaponSkill(skillId: string, element?: ElementType, dest?: AudioNode) {
    if (!dest && !this.throttle("wskill", 55)) return;
    if (/beam|rail|laser|pierce/.test(skillId)) {
      this.playLaser(dest);
    } else if (/slam|cleave|quake|hammer|meteor|reap|smash/.test(skillId)) {
      this.tone(190, 52, 0.22, "sawtooth", 0.26, 0, dest);
      this.noise(0.18, 0.22, 1100, 0, true, "bandpass", dest);
    } else if (/dash|blink|step|flurry|fang|iaido|spin|chakram/.test(skillId)) {
      this.tone(420, 980, 0.09, "square", 0.2, 0, dest);
      this.tone(740, 260, 0.11, "sawtooth", 0.2, 0.05, dest);
      this.noise(0.08, 0.15, 3600, 0, true, "bandpass", dest);
    } else if (/shot|turret|barrage|mine|bomb|grenade/.test(skillId)) {
      this.tone(760, 240, 0.11, "square", 0.21, 0, dest);
      this.tone(520, 180, 0.12, "sawtooth", 0.18, 0.05, dest);
    } else if (/shield|aegis|guard|ward|sanctuary/.test(skillId)) {
      this.playBlock(dest);
    } else {
      this.tone(392, 784, 0.14, "triangle", 0.22, 0, dest);
      this.tone(587, 1175, 0.14, "square", 0.14, 0.04, dest);
    }
    if (element) {
      this._playElementAccent(element, 0.04, dest);
    }
    this._recordEvent({ tag: `weapon_skill:${skillId}`, mode: "procedural", detail: element ?? "neutral" });
  }

  /** Signature 16-bit Ultimate [Q] fanfare + class power unleash! */
  playClassUltimate(classId: ClassId, dest?: AudioNode) {
    if (classId === "prism_knight") {
      // Bão Kiếm Ánh Sáng: radiant paladin fanfare + whirling blade cadence
      const notes = [392, 523, 659, 784, 1046];
      notes.forEach((n, i) => this.tone(n, n * 1.04, 0.16, "square", 0.2, i * 0.045, dest));
      this.noise(0.28, 0.18, 2800, 0.08, true, "bandpass", dest);
    } else if (classId === "chroma_mage") {
      // Mưa Thiên Thạch Thất Sắc: cosmic 7-color starfall glissando
      const rainbow = [523, 587, 659, 740, 880, 988, 1175];
      rainbow.forEach((n, i) => this.tone(n, n * 0.85, 0.15, "triangle", 0.21, i * 0.04, dest));
      this.tone(220, 880, 0.3, "sawtooth", 0.16, 0, dest);
    } else if (classId === "bit_rogue") {
      // Phân Thân Ảo Ảnh: ninja smoke poof + twin neon phase-shift echo
      this.noise(0.11, 0.22, 3400, 0, false, "bandpass", dest);
      this.tone(330, 990, 0.09, "square", 0.2, 0, dest);
      this.tone(440, 1320, 0.1, "square", 0.2, 0.065, dest);
      this.tone(880, 260, 0.12, "sawtooth", 0.18, 0.12, dest);
    } else {
      // Pixel Tinker Drone Quá Tải: turbine spin-up + dual lock-on chirps
      this.tone(190, 960, 0.24, "sawtooth", 0.22, 0, dest);
      this.tone(1180, 1180, 0.055, "square", 0.18, 0.16, dest);
      this.tone(1568, 1568, 0.08, "square", 0.2, 0.23, dest);
    }
    this._recordEvent({ tag: `ultimate:${classId}`, mode: "procedural" });
  }

  // ============================================================================
  // 9 Canonical Elements & 28+1 Pairwise / Prismatic Reactions
  // ============================================================================
  private _playElementAccent(element: ElementType, delay = 0, dest?: AudioNode) {
    switch (element) {
      case "fire":
        this.tone(280, 115, 0.13, "sawtooth", 0.18, delay, dest);
        this.noise(0.11, 0.16, 1500, delay, true, "bandpass", dest);
        break;
      case "ice":
        this.tone(1318, 1976, 0.09, "triangle", 0.18, delay, dest);
        this.tone(1760, 2637, 0.1, "sine", 0.15, delay + 0.035, dest);
        break;
      case "nature":
        this.tone(294, 440, 0.09, "triangle", 0.18, delay, dest);
        this.tone(392, 587, 0.09, "sine", 0.15, delay + 0.04, dest);
        break;
      case "volt":
        this.tone(980, 420, 0.05, "square", 0.18, delay, dest);
        this.tone(1420, 560, 0.06, "square", 0.17, delay + 0.04, dest);
        break;
      case "prism":
        [659, 880, 1175, 1568].forEach((n, i) =>
          this.tone(n, n * 1.05, 0.09, "triangle", 0.16, delay + i * 0.025, dest)
        );
        break;
      case "void":
        this.tone(210, 46, 0.18, "sawtooth", 0.2, delay, dest);
        this.tone(155, 62, 0.16, "square", 0.14, delay + 0.03, dest);
        break;
      case "chroma":
        this.tone(523, 784, 0.12, "triangle", 0.18, delay, dest);
        this.tone(659, 1046, 0.14, "triangle", 0.16, delay + 0.04, dest);
        break;
      case "wind":
        this.noise(0.14, 0.16, 2600, delay, false, "bandpass", dest);
        this.tone(494, 740, 0.12, "triangle", 0.13, delay + 0.02, dest);
        break;
      case "quake":
        this.tone(110, 34, 0.18, "sawtooth", 0.24, delay, dest);
        this.noise(0.14, 0.18, 420, delay, true, "lowpass", dest);
        break;
    }
  }

  /** Subtle primer aura application cue for all 9 elements. */
  playElementAura(element: ElementType, dest?: AudioNode) {
    if (!dest && !this.throttle(`aura_${element}`, 95)) return;
    this._playElementAccent(element, 0, dest);
    this._recordEvent({ tag: `element_aura:${element}`, mode: "procedural" });
  }

  /** Synthesizes a dual-layered 16-bit reaction burst combining both interacting elements! */
  playReaction(elemA: ElementType, elemB: ElementType, fromPrism = false, dest?: AudioNode) {
    const key = [elemA, elemB].sort().join("+");
    if (!dest && !this.throttle(`rx_${key}`, 65)) return;
    this._playElementAccent(elemA, 0, dest);
    this._playElementAccent(elemB, 0.045, dest);
    // Punchy impact core
    this.tone(165, 48, 0.2, "sawtooth", 0.22, 0, dest);
    if (fromPrism || elemA === "prism" || elemB === "prism") {
      const refract = [784, 1046, 1318, 1568];
      refract.forEach((f, i) => this.tone(f, f * 1.06, 0.12, "triangle", 0.18, 0.05 + i * 0.03, dest));
    }
    this._recordEvent({
      tag: `reaction:${key}`,
      mode: "procedural",
      detail: fromPrism ? "prism_refraction" : "pairwise",
    });
  }

  // ============================================================================
  // Classic Combat & Boss Encounters
  // ============================================================================
  playShoot(pitch = 680, dest?: AudioNode) {
    if (!dest && !this.throttle("shoot", 40)) return;
    this.tone(pitch, pitch * 0.35, 0.08, "square", 0.17, 0, dest);
    this._recordEvent({ tag: "shoot", mode: "procedural", freq: pitch });
  }

  playMagic(elementIdx = 0, dest?: AudioNode) {
    if (!dest && !this.throttle("magic", 55)) return;
    const base = [420, 620, 320][elementIdx % 3];
    this.tone(base, base * 1.55, 0.12, "triangle", 0.22, 0, dest);
    this.tone(base * 0.5, base * 0.9, 0.11, "square", 0.1, 0, dest);
    this._recordEvent({ tag: "magic", mode: "procedural", freq: base });
  }

  playLaser(dest?: AudioNode) {
    this.tone(920, 220, 0.28, "sawtooth", 0.26, 0, dest);
    this.tone(460, 140, 0.26, "square", 0.18, 0.02, dest);
    this.noise(0.18, 0.18, 2800, 0, true, "bandpass", dest);
    this._recordEvent({ tag: "laser", mode: "procedural", freq: 920 });
  }

  playBlock(dest?: AudioNode) {
    this.tone(520, 960, 0.09, "square", 0.24, 0, dest);
    this.tone(1040, 1480, 0.12, "triangle", 0.22, 0.04, dest);
    this._recordEvent({ tag: "block", mode: "procedural", freq: 520 });
  }

  playHit(crit = false, dest?: AudioNode) {
    if (!dest && !this.throttle(crit ? "crit" : "hit", 35)) return;
    if (crit) {
      this.tone(680, 1320, 0.09, "square", 0.24, 0, dest);
      this.noise(0.09, 0.2, 3400, 0, true, "bandpass", dest);
    } else {
      this.tone(220, 95, 0.06, "square", 0.15, 0, dest);
      this.noise(0.045, 0.12, 1600, 0, false, "bandpass", dest);
    }
    this._recordEvent({ tag: crit ? "crit_hit" : "hit", mode: "procedural" });
  }

  playExplosion(dest?: AudioNode) {
    if (!dest && !this.throttle("exp", 75)) return;
    this.tone(140, 38, 0.28, "sawtooth", 0.28, 0, dest);
    this.noise(0.26, 0.26, 650, 0, true, "lowpass", dest);
    this._recordEvent({ tag: "explosion", mode: "procedural", freq: 140 });
  }

  playDash(dest?: AudioNode) {
    this.tone(260, 580, 0.09, "triangle", 0.18, 0, dest);
    this.noise(0.07, 0.11, 3000, 0, false, "bandpass", dest);
    this._recordEvent({ tag: "dash", mode: "procedural", freq: 260 });
  }

  playPunch(dest?: AudioNode) {
    if (!dest && !this.throttle("punch", 50)) return;
    this.tone(240, 95, 0.075, "triangle", 0.2, 0, dest);
    this.noise(0.045, 0.14, 1500, 0, false, "bandpass", dest);
    this._recordEvent({ tag: "punch", mode: "procedural", freq: 240 });
  }

  playOverdrive(dest?: AudioNode) {
    this.tone(220, 880, 0.28, "sawtooth", 0.26, 0, dest);
    this.tone(440, 1320, 0.3, "square", 0.2, 0.06, dest);
    this._recordEvent({ tag: "overdrive", mode: "procedural", freq: 220 });
  }

  /** Hybrid Boss Roar: loads Boss-specific `.ogg/.mp3` sample with multi-phase procedural shockwave! */
  playBossPhaseRoar(bossDefId = "boss_the_eraser", phase = 2, dest?: AudioNode) {
    const clipId: HybridSfxId =
      bossDefId === "boss_xing_warden"
        ? "boss_roar_warden"
        : bossDefId === "boss_blight_root"
          ? "boss_roar_blight"
          : bossDefId === "boss_gilded_null"
            ? "boss_roar_gilded"
            : "boss_roar_eraser";
    const rate = phase >= 3 ? 0.9 : phase === 2 ? 0.96 : 1.02;
    this.playHybrid(clipId, { vol: 0.88, rate, dest }, (d) => {
      this.tone(138, 44, 0.48, "sawtooth", 0.3, 0, d);
      this.tone(92, 34, 0.44, "square", 0.22, 0.05, d);
      this.noise(0.38, 0.25, 520, 0, true, "lowpass", d);
    });
    if (phase >= 2) {
      // Phase-shift shockwave accent
      this.tone(phase >= 3 ? 620 : 440, 88, 0.28, "sawtooth", 0.18, 0.08, dest);
    }
  }

  playBossRoar(dest?: AudioNode) {
    this.playBossPhaseRoar("boss_the_eraser", 2, dest);
  }

  /** Distinct audio telegraphs for Boss signature attacks. */
  playBossSkill(
    kind: "beam" | "slam" | "summon" | "barrage" | "telegraph" | "glitch",
    dest?: AudioNode
  ) {
    if (!dest && !this.throttle(`bsk_${kind}`, 90)) return;
    if (kind === "beam") {
      this.tone(1080, 210, 0.32, "sawtooth", 0.24, 0, dest);
      this.noise(0.2, 0.16, 3200, 0, true, "bandpass", dest);
    } else if (kind === "slam") {
      this.tone(135, 36, 0.28, "sawtooth", 0.26, 0, dest);
      this.noise(0.22, 0.22, 520, 0, true, "lowpass", dest);
    } else if (kind === "summon") {
      [220, 277, 330, 440].forEach((f, i) =>
        this.tone(f, f * 1.08, 0.14, "triangle", 0.17, i * 0.045, dest)
      );
    } else if (kind === "barrage") {
      this.tone(540, 220, 0.11, "square", 0.18, 0, dest);
      this.tone(620, 250, 0.11, "square", 0.16, 0.055, dest);
    } else if (kind === "glitch") {
      [180, 720, 120, 960].forEach((f, i) =>
        this.tone(f, f * 0.7, 0.055, "square", 0.18, i * 0.038, dest)
      );
      this.noise(0.14, 0.18, 4200, 0, true, "bandpass", dest);
    } else {
      // danger telegraph glint
      this.tone(740, 1110, 0.08, "triangle", 0.15, 0, dest);
    }
    this._recordEvent({ tag: `boss_skill:${kind}`, mode: "procedural" });
  }

  playPlayerHit() {
    if (!this.throttle("phit", 140)) return;
    this.tone(190, 80, 0.14, "sawtooth", 0.26);
    this.noise(0.1, 0.2, 900, 0, true, "bandpass");
    this._recordEvent({ tag: "player_hit", mode: "procedural" });
  }

  // ============================================================================
  // Open-World Biome Footsteps & Environmental Interactions (Hybrid)
  // ============================================================================
  playFootstep(surface: FootstepSurfaceId = "meadow", sprinting = false, dest?: AudioNode) {
    const minMs = sprinting ? 175 : 245;
    if (!dest && !this.throttle("footstep", minMs)) return;

    const clipMap: Record<FootstepSurfaceId, HybridSfxId> = {
      town: "step_town",
      meadow: "step_meadow",
      quartz: "step_quartz",
      amber: "step_amber",
      ruins: "step_ruins",
      water: "step_water",
    };
    const clipId = clipMap[surface] ?? "step_meadow";
    const jitter = 0.93 + Math.random() * 0.14 + (sprinting ? 0.06 : 0);
    const vol = sprinting ? 0.34 : 0.26;

    this.playHybrid(clipId, { vol, rate: jitter, dest }, (d) => {
      if (surface === "town") {
        this.tone(185 * jitter, 95, 0.045, "triangle", 0.11, 0, d);
        this.noise(0.03, 0.07, 2600, 0, false, "bandpass", d);
      } else if (surface === "quartz") {
        this.tone(1380 * jitter, 1820, 0.045, "sine", 0.09, 0, d);
        this.noise(0.035, 0.07, 3600, 0, true, "bandpass", d);
      } else if (surface === "amber") {
        this.tone(140 * jitter, 72, 0.055, "triangle", 0.12, 0, d);
        this.noise(0.045, 0.09, 1300, 0, true, "lowpass", d);
      } else if (surface === "ruins") {
        this.tone(250 * jitter, 165, 0.05, "triangle", 0.1, 0, d);
        this.tone(375 * jitter, 240, 0.045, "sine", 0.06, 0.035, d);
      } else if (surface === "water") {
        this.tone(310, 560, 0.06, "sine", 0.09, 0, d);
        this.noise(0.065, 0.09, 2200, 0, false, "bandpass", d);
      } else {
        this.noise(0.045, 0.08, 1900, 0, false, "bandpass", d);
      }
    });
  }

  playMine(broken = false, dest?: AudioNode) {
    const clipId: HybridSfxId = broken ? "mine_break" : "mine_hit";
    const jitter = broken ? 1.0 : 0.94 + Math.random() * 0.12;
    this.playHybrid(clipId, { vol: broken ? 0.78 : 0.66, rate: jitter, dest }, (d) => {
      this.tone(broken ? 480 : 620, broken ? 140 : 380, broken ? 0.18 : 0.08, "triangle", 0.24, 0, d);
      this.noise(broken ? 0.16 : 0.05, broken ? 0.2 : 0.12, 2200, 0, true, "bandpass", d);
    });
  }

  playChestOpen(dest?: AudioNode) {
    this.playHybrid("chest_open", { vol: 0.82, dest }, (d) => {
      const notes = [392, 494, 587, 784, 988];
      notes.forEach((n, i) => this.tone(n, n, 0.12, "square", 0.2, i * 0.07, d));
    });
  }

  playWaypoint(dest?: AudioNode) {
    this.playHybrid("waypoint_chime", { vol: 0.8, dest }, (d) => {
      const chord = [262, 330, 392, 523, 659, 784, 1046];
      chord.forEach((n, i) => this.tone(n, n * 1.02, 0.24, "triangle", 0.2, i * 0.065, d));
    });
  }

  playLoreDecode(firstTime = true) {
    const notes = firstTime ? [440, 554, 659, 880, 1109] : [440, 659, 880];
    notes.forEach((n, i) => this.tone(n, n * 1.01, 0.16, "triangle", 0.18, i * 0.06));
    this._recordEvent({ tag: "lore_decode", mode: "procedural" });
  }

  playCoopPing(dest?: AudioNode) {
    this.playHybrid("coop_ping", { vol: 0.78, dest }, (d) => {
      this.tone(880, 880, 0.09, "triangle", 0.2, 0, d);
      this.tone(1318, 1318, 0.14, "triangle", 0.22, 0.1, d);
    });
  }

  // ============================================================================
  // NPC & Story Cutscene Character-Specific Dialogue Voice Blips
  // ============================================================================
  resolveVoiceProfile(speakerOrId?: string, fallbackClassId: ClassId = "prism_knight"): NpcVoiceProfile {
    const raw = (speakerOrId ?? "").trim().toLowerCase();
    if (!raw) return NPC_VOICE_PROFILES[fallbackClassId];
    if (raw in NPC_VOICE_PROFILES) {
      return NPC_VOICE_PROFILES[raw as NpcVoiceId];
    }
    if (raw.includes("elian") || raw.includes("trưởng làng") || raw.includes("elder")) {
      return NPC_VOICE_PROFILES.npc_elder;
    }
    if (raw.includes("kael") || raw.includes("thợ rèn") || raw.includes("blacksmith")) {
      return NPC_VOICE_PROFILES.npc_blacksmith;
    }
    if (raw.includes("mira") || raw.includes("thương nhân") || raw.includes("merchant")) {
      return NPC_VOICE_PROFILES.npc_merchant;
    }
    if (raw.includes("eraser") || raw.includes("vaelor") || raw.includes("tẩy trắng")) {
      return NPC_VOICE_PROFILES.boss_the_eraser;
    }
    if (raw.includes("warden") || raw.includes("cổ thụ")) {
      return NPC_VOICE_PROFILES.boss_xing_warden;
    }
    if (raw.includes("blight") || raw.includes("rồng lăng kính")) {
      return NPC_VOICE_PROFILES.boss_blight_root;
    }
    if (raw.includes("gilded") || raw.includes("hổ phách")) {
      return NPC_VOICE_PROFILES.boss_gilded_null;
    }
    if (raw.includes("biên niên") || raw.includes("dẫn truyện") || raw.includes("narrator") || raw.includes("bia ký")) {
      return NPC_VOICE_PROFILES.narrator;
    }
    if (raw.includes("pháp sư") || raw.includes("mage")) return NPC_VOICE_PROFILES.chroma_mage;
    if (raw.includes("sát thủ") || raw.includes("rogue")) return NPC_VOICE_PROFILES.bit_rogue;
    if (raw.includes("kỹ sư") || raw.includes("tinker")) return NPC_VOICE_PROFILES.pixel_tinker;
    if (raw.includes("vệ binh") || raw.includes("knight")) return NPC_VOICE_PROFILES.prism_knight;
    return NPC_VOICE_PROFILES[fallbackClassId] ?? NPC_VOICE_PROFILES.narrator;
  }

  /** Plays a crisp 16-bit JRPG typewriter blip using each NPC/Boss/Hero's signature frequency! */
  playNpcVoice(speakerOrId?: string, char = "a", fallbackClassId: ClassId = "prism_knight"): number {
    if (char && /[\s.,!?;:'"()[\]—–\-…]/.test(char)) return 0;
    if (!this.throttle("npc_voice", 40)) return 0;

    const prof = this.resolveVoiceProfile(speakerOrId, fallbackClassId);
    const code = char ? char.charCodeAt(0) : 97;
    const semitoneOffsets = [-2, -1, 0, 1, 2, 3];
    const semi = semitoneOffsets[code % semitoneOffsets.length];
    const glitchMul = prof.glitch ? (code % 2 === 0 ? 1.35 : 0.74) : 1.0;
    const freq = Math.round(prof.baseFreq * Math.pow(2, semi / 12) * glitchMul);

    this.tone(freq, freq * (prof.glitch ? 0.82 : 1.06), prof.dur, prof.wave, prof.vol);
    if (prof.harmonicRatio) {
      this.tone(
        freq * prof.harmonicRatio,
        freq * prof.harmonicRatio,
        prof.dur * 0.75,
        "triangle",
        prof.vol * 0.45,
        0.008
      );
    }
    this._recordEvent({
      tag: `npc_voice:${prof.id}`,
      mode: "procedural",
      freq,
    });
    return freq;
  }

  // ============================================================================
  // UI, Inventory, Prism Forge & Seasonal Gacha
  // ============================================================================
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
    this._recordEvent({ tag: rare ? "loot_rare" : "loot", mode: "procedural" });
  }

  playForgeHammer(step = 0) {
    if (!this.throttle("forge_hammer", 160)) return;
    const rate = 0.96 + (step % 4) * 0.05;
    this.playHybrid("forge_anvil", { vol: 0.56, rate }, () => {
      const f = 760 + (step % 4) * 90;
      this.tone(f, f * 1.45, 0.09, "triangle", 0.19);
      this.noise(0.06, 0.12, 3800, 0, true, "bandpass");
    });
  }

  playForgeSuccess() {
    this.playHybrid("forge_anvil", { vol: 0.72, rate: 1.06 }, () => {});
    this.tone(440, 880, 0.1, "square", 0.22, 0);
    this.tone(660, 1320, 0.14, "square", 0.22, 0.09);
    this.tone(880, 1760, 0.24, "triangle", 0.24, 0.18);
    this._recordEvent({ tag: "forge_success", mode: "procedural" });
  }

  playForgeInfuse(element: ElementType) {
    this._playElementAccent(element, 0);
    this.tone(523, 1046, 0.16, "triangle", 0.2, 0.07);
    this.tone(784, 1568, 0.2, "triangle", 0.22, 0.13);
    this._recordEvent({ tag: `forge_infuse:${element}`, mode: "procedural" });
  }

  playFateReroll() {
    // Rattling crystal dice + destiny chord
    [420, 640, 510, 780].forEach((f, i) => {
      this.tone(f, f * 1.15, 0.04, "square", 0.14, i * 0.04);
    });
    this.tone(659, 1318, 0.2, "triangle", 0.22, 0.18);
    this._recordEvent({ tag: "fate_reroll", mode: "procedural" });
  }

  playForgeFail() {
    this.tone(240, 140, 0.18, "sawtooth", 0.22, 0);
    this.tone(160, 90, 0.22, "sawtooth", 0.2, 0.14);
    this._recordEvent({ tag: "forge_fail", mode: "procedural" });
  }

  playMatrixChannel() {
    const notes = [294, 370, 440, 587, 740, 880];
    notes.forEach((n, i) => this.tone(n, n * 1.06, 0.18, "triangle", 0.17, i * 0.18));
    this._recordEvent({ tag: "matrix_channel", mode: "procedural" });
  }

  playMatrixShatter() {
    this.tone(260, 62, 0.35, "sawtooth", 0.28, 0);
    this.tone(190, 48, 0.32, "square", 0.22, 0.08);
    this.noise(0.28, 0.25, 1100, 0, true, "bandpass");
    this._recordEvent({ tag: "matrix_shatter", mode: "procedural" });
  }

  playQuestComplete() {
    const fanfare = [523, 659, 784, 1046];
    fanfare.forEach((n, i) => this.tone(n, n, 0.16, "square", 0.2, i * 0.085));
    this._recordEvent({ tag: "quest_complete", mode: "procedural" });
  }

  playLevelUp() {
    const notes = [392, 523, 659, 784, 1046, 1318];
    notes.forEach((n, i) => this.tone(n, n, 0.15, "square", 0.21, i * 0.07));
    this._recordEvent({ tag: "level_up", mode: "procedural" });
  }

  playBuy() {
    this.tone(660, 990, 0.08, "square", 0.18);
    this.tone(990, 1320, 0.1, "triangle", 0.18, 0.07);
    this._recordEvent({ tag: "buy", mode: "procedural" });
  }

  playConsumable(group: ConsumableGroup = "hp") {
    if (group === "hp") {
      [523, 659, 784].forEach((n, i) => this.tone(n, n * 1.05, 0.1, "triangle", 0.18, i * 0.045));
    } else if (group === "stamina") {
      this.tone(440, 880, 0.09, "square", 0.16, 0);
      this.tone(660, 1180, 0.1, "triangle", 0.17, 0.05);
    } else {
      this.tone(392, 784, 0.12, "triangle", 0.19, 0);
      this.tone(587, 1175, 0.14, "triangle", 0.18, 0.06);
    }
    this._recordEvent({ tag: `consumable:${group}`, mode: "procedural" });
  }

  playUiClick() {
    if (!this.throttle("ui", 35)) return;
    this.tone(540, 720, 0.045, "square", 0.12);
    this._recordEvent({ tag: "ui_click", mode: "procedural", freq: 540 });
  }

  /** Soft 16-bit parchment / slot inspection tick with subtle crystal chime on high rarity. */
  playItemInspect(rarity: Rarity = "common") {
    if (!this.throttle("item_inspect", 55)) return;
    this.tone(460, 580, 0.032, "triangle", 0.085);
    if (rarity === "legendary") {
      this.tone(1046, 1568, 0.09, "triangle", 0.12, 0.025);
    } else if (rarity === "epic" || rarity === "cursed") {
      this.tone(880, 1175, 0.075, "triangle", 0.1, 0.025);
    } else if (rarity === "rare") {
      this.tone(784, 988, 0.06, "triangle", 0.09, 0.02);
    }
    this._recordEvent({ tag: `item_inspect:${rarity}`, mode: "procedural" });
  }

  playBagOpen() {
    this.tone(330, 440, 0.06, "triangle", 0.16, 0);
    this.tone(494, 660, 0.08, "square", 0.14, 0.05);
    this.noise(0.05, 0.08, 2200, 0.01);
    this._recordEvent({ tag: "bag_open", mode: "procedural" });
  }

  playEquipWeapon() {
    this.tone(520, 1180, 0.09, "sawtooth", 0.18, 0);
    this.tone(880, 1420, 0.11, "triangle", 0.18, 0.05);
    this.noise(0.06, 0.12, 3600, 0, true);
    this._recordEvent({ tag: "equip_weapon", mode: "procedural" });
  }

  playEquipArmor() {
    this.tone(180, 110, 0.08, "square", 0.22, 0);
    this.tone(320, 460, 0.09, "square", 0.16, 0.045);
    this.noise(0.07, 0.15, 1400, 0.01, true);
    this._recordEvent({ tag: "equip_armor", mode: "procedural" });
  }

  playEquipAccessory() {
    this.tone(659, 659, 0.07, "triangle", 0.18, 0);
    this.tone(988, 1318, 0.14, "triangle", 0.2, 0.05);
    this._recordEvent({ tag: "equip_accessory", mode: "procedural" });
  }

  playUnequip() {
    this.tone(480, 290, 0.08, "triangle", 0.15, 0);
    this._recordEvent({ tag: "unequip", mode: "procedural" });
  }

  playDismantle() {
    this.noise(0.11, 0.2, 3200, 0, true);
    this.tone(420, 210, 0.1, "sawtooth", 0.18, 0);
    this.tone(740, 1046, 0.1, "triangle", 0.16, 0.07);
    this.tone(988, 1480, 0.14, "triangle", 0.18, 0.13);
    this._recordEvent({ tag: "dismantle", mode: "procedural" });
  }

  playHiddenDrop() {
    const notes = [523, 659, 784, 1046, 1318, 1568];
    notes.forEach((n, i) => this.tone(n, n * 1.03, 0.2, "triangle", 0.22, i * 0.055));
    this.noise(0.14, 0.12, 4200, 0.04);
    this._recordEvent({ tag: "hidden_drop", mode: "procedural" });
  }

  playHiddenUnlock() {
    this.tone(392, 523, 0.12, "square", 0.18, 0);
    this.tone(523, 784, 0.16, "triangle", 0.22, 0.06);
    this.tone(784, 1568, 0.28, "triangle", 0.24, 0.12);
    this._recordEvent({ tag: "hidden_unlock", mode: "procedural" });
  }

  playGachaKeyTurn() {
    this.noise(0.06, 0.16, 4600, 0, true);
    this.tone(680, 960, 0.08, "square", 0.16, 0.02);
    this.tone(1180, 1568, 0.12, "triangle", 0.18, 0.09);
  }

  playGachaTick(step: number) {
    const base = 260 + Math.min(18, step) * 44;
    this.tone(base, base * 1.12, 0.055, "square", 0.13 + Math.min(0.08, step * 0.005));
    if (step % 2 === 1) {
      this.tone(base * 1.5, base * 1.65, 0.045, "triangle", 0.1, 0.01);
    }
  }

  playGachaFakeoutCrack() {
    this.noise(0.18, 0.28, 3800, 0, true);
    this.tone(220, 92, 0.14, "sawtooth", 0.24, 0);
    const surge = [523, 659, 784, 1046, 1318, 1568, 2093];
    surge.forEach((f, i) => this.tone(f, f * 1.04, 0.16, "triangle", 0.22, 0.08 + i * 0.032));
  }

  playGachaReveal(rarity: "common" | "uncommon" | "rare" | "epic" | "cursed" | "legendary") {
    if (rarity === "legendary") {
      this.noise(0.22, 0.2, 5200, 0, true);
      const fanfare = [523, 659, 784, 1046, 988, 1046, 1318, 1568, 2093];
      fanfare.forEach((n, i) => {
        const dt = i * 0.06;
        this.tone(n, n * 1.01, i >= 7 ? 0.42 : 0.15, "triangle", 0.24, dt);
        if (i % 2 === 0) this.tone(n * 0.5, n * 0.5, 0.18, "square", 0.13, dt);
      });
      return;
    }
    if (rarity === "epic" || rarity === "cursed") {
      this.noise(0.14, 0.14, 4000, 0);
      const notes = [440, 554, 659, 880, 1109, 1318];
      notes.forEach((n, i) => this.tone(n, n * 1.02, 0.22, "triangle", 0.22, i * 0.055));
      return;
    }
    if (rarity === "rare") {
      const notes = [392, 494, 587, 784];
      notes.forEach((n, i) => this.tone(n, n * 1.02, 0.15, "triangle", 0.19, i * 0.05));
      return;
    }
    this.tone(330, 440, 0.08, "triangle", 0.16, 0);
    this.tone(440, 587, 0.12, "triangle", 0.16, 0.05);
  }

  // ============================================================================
  // Co-op 2D Spatial Audio (`playSpatialSfx`)
  // ============================================================================
  playSpatialSfx(
    kind: SpatialSfxKind,
    listenerX: number,
    listenerY: number,
    sourceX: number,
    sourceY: number,
    opts?: {
      maxDist?: number;
      refDist?: number;
      classId?: ClassId;
      element?: ElementType;
      secondaryElement?: ElementType;
      combo?: number;
      surface?: FootstepSurfaceId;
      bossDefId?: string;
    }
  ): SpatialAudioParams {
    const params = computeSpatialParams(
      listenerX,
      listenerY,
      sourceX,
      sourceY,
      opts?.maxDist ?? 420,
      opts?.refDist ?? 48
    );
    if (!params.audible || this.muted || this.volume <= 0) {
      return params;
    }
    if (!this.throttle(`spatial_${kind}`, kind === "footstep" ? 160 : 45)) {
      return params;
    }
    if (!this.ctx) this.unlock();
    if (!this.ctx || !this.master) {
      this._recordEvent({
        tag: `spatial:${kind}`,
        mode: "spatial",
        gain: params.gain,
        pan: params.pan,
      });
      return params;
    }

    // Build transient spatial routing chain: Gain (distance falloff) -> Lowpass (air muffle) -> StereoPanner -> Master
    const spatialGain = this.ctx.createGain();
    spatialGain.gain.value = params.gain * 0.88;

    const filter = this.ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = params.filterHz;
    spatialGain.connect(filter);

    let tail: AudioNode = filter;
    if (typeof this.ctx.createStereoPanner === "function") {
      const panner = this.ctx.createStereoPanner();
      panner.pan.value = params.pan;
      filter.connect(panner);
      tail = panner;
    }
    tail.connect(this.master);

    switch (kind) {
      case "slash":
        if (opts?.classId) this.playClassAttack(opts.classId, opts.combo ?? 0, false, spatialGain);
        else this.playSlash(opts?.combo ?? 0, spatialGain);
        break;
      case "charge":
        if (opts?.classId) this.playClassCharge(opts.classId, false, spatialGain);
        else this.playChargeRelease(spatialGain);
        break;
      case "skill":
        this.playWeaponSkill("coop_skill", opts?.element, spatialGain);
        break;
      case "ult":
        this.playClassUltimate(opts?.classId ?? "prism_knight", spatialGain);
        break;
      case "dash":
        this.playDash(spatialGain);
        break;
      case "reaction":
        this.playReaction(opts?.element ?? "fire", opts?.secondaryElement ?? "ice", false, spatialGain);
        break;
      case "waypoint":
        this.playWaypoint(spatialGain);
        break;
      case "ping":
        this.playCoopPing(spatialGain);
        break;
      case "footstep":
        this.playFootstep(opts?.surface ?? "meadow", false, spatialGain);
        break;
      case "boss_roar":
        this.playBossPhaseRoar(opts?.bossDefId ?? "boss_the_eraser", 2, spatialGain);
        break;
      case "explosion":
        this.playExplosion(spatialGain);
        break;
      case "hit":
        this.playHit(false, spatialGain);
        break;
    }

    setTimeout(() => {
      try {
        tail.disconnect();
        spatialGain.disconnect();
      } catch {
        // ignore cleanup error
      }
    }, 1100);

    this._recordEvent({
      tag: `spatial:${kind}`,
      mode: "spatial",
      gain: params.gain,
      pan: params.pan,
      detail: `d=${Math.round(params.distance)}`,
    });
    return params;
  }
}

export const sfx = new ChiptuneSynth();
