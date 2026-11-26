#!/usr/bin/env python3
"""
PIXTEL Retro 16-Bit JRPG SFX Converter & Normalizer (`scripts/convert_sfx.py`)

Processes `.wav`, `.ogg`, and `.mp3` source files from `raw_sfx/` and exports
mobile/PWA-ready dual-format assets into `public/sfx/`:
  - Sample Rate : 22050 Hz (authentic 16-bit JRPG crunch & tiny RAM footprint)
  - Channels    : Mono (1 ch — ideal for Web Audio API 2D spatial panning)
  - Peak Level  : Normalized to -3.0 dBFS (consistent punch without mobile speaker clipping)
  - Formats     : `.ogg` (64 kbps Vorbis for Chrome/Android/Desktop)
                  `.mp3` (64 kbps MP3 for Safari / iOS / iPadOS PWA)
  - Manifest    : `public/sfx/manifest.json`

Supports both `ffmpeg` CLI (default, zero extra pip packages required) and
`pydub` (`--engine pydub`) when installed, plus `--seed-cc0` (auto-run when
`raw_sfx/` is empty) to synthesize a CC0 16-bit JRPG source `.wav` bank.
"""

from __future__ import annotations

import argparse
import array
import json
import math
import os
import random
import re
import shutil
import subprocess
import sys
import tempfile
import wave
from pathlib import Path
from typing import Callable, Dict, List, Optional, Tuple

SUPPORTED_EXTS = {".wav", ".ogg", ".mp3"}
DEFAULT_SR = 22050
DEFAULT_TARGET_DBFS = -3.0
DEFAULT_BITRATE = "64k"


def slugify_stem(stem: str) -> str:
    s = stem.strip().lower()
    s = re.sub(r"[^a-z0-9]+", "_", s)
    return s.strip("_") or "sfx"


# ============================================================================
# CC0 16-Bit JRPG Seed Bank Generator (used when `raw_sfx/` has missing clips)
# ============================================================================
def _clamp(v: float, lo: float = -1.0, hi: float = 1.0) -> float:
    return lo if v < lo else hi if v > hi else v


def _lfsr_noise(length: int, seed: int = 0xACE1, period_step: int = 1) -> List[float]:
    """Authentic 15-bit NES/SNES-style linear feedback shift register noise."""
    reg = seed & 0x7FFF or 1
    out: List[float] = []
    cur = 1.0
    for i in range(length):
        if i % max(1, period_step) == 0:
            bit = ((reg >> 0) ^ (reg >> 1)) & 1
            reg = (reg >> 1) | (bit << 14)
            cur = 1.0 if (reg & 1) else -1.0
        out.append(cur)
    return out


def _write_pcm16_wav(path: Path, samples: List[float], sr: int = 44100) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    peak = max((abs(x) for x in samples), default=1.0) or 1.0
    scale = 0.85 / peak
    pcm = array.array("h", (int(_clamp(x * scale) * 32767) for x in samples))
    with wave.open(str(path), "wb") as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)
        wf.setframerate(sr)
        wf.writeframes(pcm.tobytes())


def _synth_step_town(sr: int) -> List[float]:
    n = int(sr * 0.095)
    noise = _lfsr_noise(n, 0x3141, 2)
    out = []
    for i in range(n):
        t = i / sr
        env = math.exp(-t * 46.0)
        thud = math.sin(2 * math.pi * (195.0 * math.exp(-t * 18.0)) * t) * 0.65
        click = noise[i] * math.exp(-t * 75.0) * 0.55
        out.append((thud + click) * env)
    return out


def _synth_step_meadow(sr: int) -> List[float]:
    n = int(sr * 0.11)
    rng = random.Random(102)
    out = []
    lp = 0.0
    for i in range(n):
        t = i / sr
        raw = rng.uniform(-1.0, 1.0)
        lp = lp * 0.62 + raw * 0.38
        rustle = (raw - lp) * math.exp(-t * 30.0) * 0.75
        soft = math.sin(2 * math.pi * 128.0 * math.exp(-t * 12.0) * t) * math.exp(-t * 36.0) * 0.35
        out.append(rustle + soft)
    return out


def _synth_step_quartz(sr: int) -> List[float]:
    n = int(sr * 0.12)
    noise = _lfsr_noise(n, 0x5177, 1)
    out = []
    for i in range(n):
        t = i / sr
        crunch = noise[i] * math.exp(-t * 52.0) * 0.45
        ping1 = math.sin(2 * math.pi * 1480.0 * t) * math.exp(-t * 32.0) * 0.42
        ping2 = math.sin(2 * math.pi * 2210.0 * t) * math.exp(-t * 42.0) * 0.32
        out.append(crunch + ping1 + ping2)
    return out


def _synth_step_amber(sr: int) -> List[float]:
    n = int(sr * 0.115)
    noise = _lfsr_noise(n, 0x7711, 4)
    out = []
    for i in range(n):
        t = i / sr
        gravel = noise[i] * math.exp(-t * 34.0) * 0.55
        low = math.sin(2 * math.pi * (145.0 * math.exp(-t * 14.0)) * t) * math.exp(-t * 28.0) * 0.65
        out.append(gravel + low)
    return out


def _synth_step_ruins(sr: int) -> List[float]:
    n = int(sr * 0.135)
    noise = _lfsr_noise(n, 0x2299, 3)
    out = []
    for i in range(n):
        t = i / sr
        tap = (
            math.sin(2 * math.pi * 260.0 * math.exp(-t * 10.0) * t) * math.exp(-t * 26.0) * 0.55
            + noise[i] * math.exp(-t * 64.0) * 0.38
        )
        echo_t = max(0.0, t - 0.038)
        echo = (
            math.sin(2 * math.pi * 390.0 * echo_t) * math.exp(-echo_t * 28.0) * 0.26
            if t >= 0.038
            else 0.0
        )
        out.append(tap + echo)
    return out


def _synth_step_water(sr: int) -> List[float]:
    n = int(sr * 0.135)
    rng = random.Random(404)
    out = []
    for i in range(n):
        t = i / sr
        sweep = math.sin(2 * math.pi * (320.0 + 620.0 * t) * t) * math.exp(-t * 24.0) * 0.45
        spray = rng.uniform(-1.0, 1.0) * math.exp(-t * 22.0) * 0.48
        out.append(sweep + spray)
    return out


def _synth_boss_warden(sr: int) -> List[float]:
    n = int(sr * 0.62)
    noise = _lfsr_noise(n, 0x1988, 6)
    out = []
    for i in range(n):
        t = i / sr
        atk = min(1.0, t / 0.04)
        env = atk * math.exp(-t * 2.9)
        f0 = 112.0 - 38.0 * (t / 0.62)
        vib = math.sin(2 * math.pi * 14.0 * t) * 5.0
        horn = math.tanh(
            2.1 * math.sin(2 * math.pi * (f0 + vib) * t)
            + 1.1 * math.sin(2 * math.pi * (f0 * 1.5) * t)
        )
        bark = noise[i] * 0.32 * math.exp(-t * 3.8)
        out.append((horn * 0.75 + bark) * env)
    return out


def _synth_boss_blight(sr: int) -> List[float]:
    n = int(sr * 0.64)
    noise = _lfsr_noise(n, 0x4242, 2)
    out = []
    for i in range(n):
        t = i / sr
        atk = min(1.0, t / 0.025)
        env = atk * math.exp(-t * 2.7)
        f0 = 620.0 * math.exp(-t * 1.35) + 140.0
        mod = math.sin(2 * math.pi * 43.0 * t) * 85.0
        cry = (
            math.sin(2 * math.pi * (f0 + mod) * t) * 0.55
            + (1.0 if math.sin(2 * math.pi * (f0 * 0.5) * t) >= 0 else -1.0) * 0.28
            + noise[i] * 0.25 * math.exp(-t * 4.5)
        )
        out.append(cry * env)
    return out


def _synth_boss_gilded(sr: int) -> List[float]:
    n = int(sr * 0.65)
    noise = _lfsr_noise(n, 0x6060, 5)
    out = []
    for i in range(n):
        t = i / sr
        atk = min(1.0, t / 0.03)
        env = atk * math.exp(-t * 2.6)
        f0 = 96.0 - 34.0 * (t / 0.65)
        saw = 2.0 * ((t * f0) - math.floor(0.5 + t * f0))
        brass = math.tanh(2.5 * saw + math.sin(2 * math.pi * (f0 * 2.02) * t) * 0.9)
        magma = noise[i] * 0.36 * (0.6 + 0.4 * math.sin(2 * math.pi * 22.0 * t))
        out.append((brass * 0.72 + magma) * env)
    return out


def _synth_boss_eraser(sr: int) -> List[float]:
    n = int(sr * 0.72)
    noise = _lfsr_noise(n, 0x7F7F, 1)
    out = []
    for i in range(n):
        t = i / sr
        atk = min(1.0, t / 0.015)
        env = atk * math.exp(-t * 2.35)
        step_idx = int(t * 26.0)
        glitch_mul = [1.0, 1.5, 0.75, 2.0, 0.5, 1.25][step_idx % 6]
        sub = math.sin(2 * math.pi * (78.0 * math.exp(-t * 1.1)) * t) * 0.62
        sq = (1.0 if math.sin(2 * math.pi * 210.0 * glitch_mul * t) >= 0 else -1.0) * 0.34
        tear = noise[i] * (0.42 if (step_idx % 2 == 0) else 0.14)
        out.append((sub + sq + tear) * env)
    return out


def _synth_chest_open(sr: int) -> List[float]:
    n = int(sr * 0.58)
    notes = [392.0, 493.88, 587.33, 783.99, 987.77, 1174.66]
    noise = _lfsr_noise(n, 0x1234, 3)
    out = []
    for i in range(n):
        t = i / sr
        latch = noise[i] * math.exp(-t * 38.0) * 0.42 if t < 0.09 else 0.0
        tone_sum = 0.0
        if t >= 0.06:
            nt = t - 0.06
            idx = min(len(notes) - 1, int(nt / 0.075))
            local_t = nt - idx * 0.075
            freq = notes[idx]
            dur_env = math.exp(-local_t * (4.5 if idx == len(notes) - 1 else 11.0))
            sq = 1.0 if math.sin(2 * math.pi * freq * t) >= 0 else -1.0
            tri = (2.0 / math.pi) * math.asin(math.sin(2 * math.pi * (freq * 0.5) * t))
            tone_sum = (sq * 0.42 + tri * 0.38) * dur_env
        out.append(latch + tone_sum)
    return out


def _synth_waypoint_chime(sr: int) -> List[float]:
    n = int(sr * 0.68)
    chord = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99, 1046.50]
    out = [0.0] * n
    for idx, freq in enumerate(chord):
        start = int(idx * 0.055 * sr)
        for i in range(start, n):
            lt = (i - start) / sr
            env = min(1.0, lt / 0.01) * math.exp(-lt * 4.2)
            tri = (2.0 / math.pi) * math.asin(math.sin(2 * math.pi * freq * lt))
            shimmer = math.sin(2 * math.pi * (freq * 2.0) * lt) * 0.25
            out[i] += (tri * 0.45 + shimmer) * env
    return out


def _synth_mine_hit(sr: int) -> List[float]:
    n = int(sr * 0.15)
    noise = _lfsr_noise(n, 0x55AA, 1)
    out = []
    for i in range(n):
        t = i / sr
        clink = (
            math.sin(2 * math.pi * 1320.0 * t) * math.exp(-t * 28.0) * 0.55
            + math.sin(2 * math.pi * 2490.0 * t) * math.exp(-t * 40.0) * 0.42
            + noise[i] * math.exp(-t * 65.0) * 0.38
        )
        out.append(clink)
    return out


def _synth_mine_break(sr: int) -> List[float]:
    n = int(sr * 0.34)
    noise = _lfsr_noise(n, 0x6789, 2)
    shards = [1568.0, 1318.5, 1046.5, 1975.5]
    out = [0.0] * n
    for i in range(n):
        t = i / sr
        crumble = noise[i] * math.exp(-t * 11.0) * 0.48
        thud = math.sin(2 * math.pi * (240.0 * math.exp(-t * 8.0)) * t) * math.exp(-t * 14.0) * 0.52
        out[i] += crumble + thud
    for idx, freq in enumerate(shards):
        st = int((0.02 + idx * 0.045) * sr)
        for i in range(st, n):
            lt = (i - st) / sr
            out[i] += math.sin(2 * math.pi * freq * lt) * math.exp(-lt * 18.0) * 0.32
    return out


def _synth_forge_anvil(sr: int) -> List[float]:
    n = int(sr * 0.38)
    noise = _lfsr_noise(n, 0x3A7F, 1)
    out = []
    for i in range(n):
        t = i / sr
        ring = (
            math.sin(2 * math.pi * 880.0 * t) * math.exp(-t * 9.5) * 0.52
            + math.sin(2 * math.pi * 1760.0 * t) * math.exp(-t * 14.0) * 0.38
            + math.sin(2 * math.pi * 2794.0 * t) * math.exp(-t * 22.0) * 0.26
        )
        spark = noise[i] * math.exp(-t * 18.0) * 0.34
        out.append(ring + spark)
    return out


def _synth_coop_ping(sr: int) -> List[float]:
    n = int(sr * 0.32)
    out = []
    for i in range(n):
        t = i / sr
        if t < 0.11:
            lt = t
            f = 880.0
        else:
            lt = t - 0.11
            f = 1318.5
        env = min(1.0, lt / 0.008) * math.exp(-lt * 12.0)
        tri = (2.0 / math.pi) * math.asin(math.sin(2 * math.pi * f * lt))
        harm = math.sin(2 * math.pi * (f * 2.0) * lt) * 0.25
        out.append((tri * 0.65 + harm) * env)
    return out


CC0_SEED_GENERATORS: Dict[str, Callable[[int], List[float]]] = {
    "step_town": _synth_step_town,
    "step_meadow": _synth_step_meadow,
    "step_quartz": _synth_step_quartz,
    "step_amber": _synth_step_amber,
    "step_ruins": _synth_step_ruins,
    "step_water": _synth_step_water,
    "boss_roar_warden": _synth_boss_warden,
    "boss_roar_blight": _synth_boss_blight,
    "boss_roar_gilded": _synth_boss_gilded,
    "boss_roar_eraser": _synth_boss_eraser,
    "chest_open": _synth_chest_open,
    "waypoint_chime": _synth_waypoint_chime,
    "mine_hit": _synth_mine_hit,
    "mine_break": _synth_mine_break,
    "forge_anvil": _synth_forge_anvil,
    "coop_ping": _synth_coop_ping,
}


def seed_cc0_raw_sfx(input_dir: Path, overwrite: bool = False) -> int:
    """Generates CC0 16-bit source `.wav` files in `raw_sfx/` for any missing core clips."""
    input_dir.mkdir(parents=True, exist_ok=True)
    existing_slugs = {
        slugify_stem(p.stem)
        for p in input_dir.rglob("*")
        if p.is_file() and p.suffix.lower() in SUPPORTED_EXTS
    }
    created = 0
    for slug, gen_fn in CC0_SEED_GENERATORS.items():
        if not overwrite and slug in existing_slugs:
            continue
        wav_path = input_dir / f"{slug}.wav"
        samples = gen_fn(44100)
        _write_pcm16_wav(wav_path, samples, 44100)
        created += 1
    return created


# ============================================================================
# Conversion Engines (`ffmpeg` CLI + optional `pydub`)
# ============================================================================
def _convert_with_pydub(
    src: Path,
    ogg_out: Path,
    mp3_out: Path,
    sample_rate: int,
    target_dbfs: float,
    bitrate: str,
) -> Tuple[int, float]:
    from pydub import AudioSegment  # type: ignore

    seg = AudioSegment.from_file(str(src))
    seg = seg.set_channels(1).set_frame_rate(sample_rate).set_sample_width(2)
    if seg.max_dBFS != float("-inf"):
        gain_db = target_dbfs - seg.max_dBFS
        seg = seg.apply_gain(gain_db)
    seg.export(str(ogg_out), format="ogg", bitrate=bitrate, parameters=["-ar", str(sample_rate), "-ac", "1"])
    seg.export(str(mp3_out), format="mp3", bitrate=bitrate, parameters=["-ar", str(sample_rate), "-ac", "1"])
    return len(seg), float(seg.max_dBFS)


def _convert_with_ffmpeg(
    ffmpeg_bin: str,
    src: Path,
    ogg_out: Path,
    mp3_out: Path,
    sample_rate: int,
    target_dbfs: float,
    bitrate: str,
) -> Tuple[int, float]:
    # Step 1: Decode any `.wav/.ogg/.mp3` to 22050 Hz Mono 16-bit signed PCM in memory
    decode_cmd = [
        ffmpeg_bin,
        "-hide_banner",
        "-loglevel",
        "error",
        "-i",
        str(src),
        "-vn",
        "-ac",
        "1",
        "-ar",
        str(sample_rate),
        "-f",
        "s16le",
        "-acodec",
        "pcm_s16le",
        "-",
    ]
    proc = subprocess.run(decode_cmd, capture_output=True, check=True)
    raw_bytes = proc.stdout
    if len(raw_bytes) < 2:
        raise RuntimeError(f"Decoded empty PCM stream from {src}")

    samples = array.array("h")
    samples.frombytes(raw_bytes[: len(raw_bytes) - (len(raw_bytes) % 2)])
    if sys.byteorder != "little":
        samples.byteswap()

    # Step 2: Exact peak normalization to target_dbfs (-3.0 dBFS -> ~23197 peak int16)
    peak = max((abs(int(s)) for s in samples), default=0)
    target_linear = 10.0 ** (target_dbfs / 20.0)
    target_int16 = target_linear * 32767.0
    if peak > 0:
        gain = target_int16 / float(peak)
        norm_samples = array.array(
            "h",
            (max(-32767, min(32767, int(round(s * gain)))) for s in samples),
        )
    else:
        norm_samples = samples

    final_peak = max((abs(int(s)) for s in norm_samples), default=1)
    achieved_dbfs = 20.0 * math.log10(final_peak / 32767.0)
    duration_ms = max(1, int(round(len(norm_samples) * 1000.0 / sample_rate)))

    with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tmp:
        tmp_wav = Path(tmp.name)
    try:
        with wave.open(str(tmp_wav), "wb") as wf:
            wf.setnchannels(1)
            wf.setsampwidth(2)
            wf.setframerate(sample_rate)
            if sys.byteorder != "little":
                swapped = array.array("h", norm_samples)
                swapped.byteswap()
                wf.writeframes(swapped.tobytes())
            else:
                wf.writeframes(norm_samples.tobytes())

        # Step 3a: Export `.ogg` (64kbps Vorbis, 22050 Hz, Mono)
        ogg_cmd = [
            ffmpeg_bin,
            "-y",
            "-hide_banner",
            "-loglevel",
            "error",
            "-i",
            str(tmp_wav),
            "-c:a",
            "libvorbis",
            "-b:a",
            bitrate,
            "-ar",
            str(sample_rate),
            "-ac",
            "1",
            str(ogg_out),
        ]
        ogg_res = subprocess.run(ogg_cmd, capture_output=True)
        if ogg_res.returncode != 0:
            # Fallback to built-in vorbis encoder if libvorbis is absent
            subprocess.run(
                [
                    ffmpeg_bin,
                    "-y",
                    "-hide_banner",
                    "-loglevel",
                    "error",
                    "-i",
                    str(tmp_wav),
                    "-c:a",
                    "vorbis",
                    "-strict",
                    "-2",
                    "-b:a",
                    bitrate,
                    "-ar",
                    str(sample_rate),
                    "-ac",
                    "1",
                    str(ogg_out),
                ],
                check=True,
            )

        # Step 3b: Export `.mp3` (64kbps LAME MP3, 22050 Hz, Mono)
        subprocess.run(
            [
                ffmpeg_bin,
                "-y",
                "-hide_banner",
                "-loglevel",
                "error",
                "-i",
                str(tmp_wav),
                "-c:a",
                "libmp3lame",
                "-b:a",
                bitrate,
                "-ar",
                str(sample_rate),
                "-ac",
                "1",
                str(mp3_out),
            ],
            check=True,
        )
    finally:
        tmp_wav.unlink(missing_ok=True)

    return duration_ms, round(achieved_dbfs, 2)


def discover_inputs(input_dir: Path) -> List[Path]:
    if not input_dir.exists():
        return []
    files = [
        p
        for p in sorted(input_dir.rglob("*"))
        if p.is_file() and p.suffix.lower() in SUPPORTED_EXTS
    ]
    # Deduplicate by slug (prefer .wav > .ogg > .mp3 when same stem exists)
    priority = {".wav": 0, ".ogg": 1, ".mp3": 2}
    chosen: Dict[str, Path] = {}
    for p in files:
        slug = slugify_stem(p.stem)
        prev = chosen.get(slug)
        if prev is None or priority[p.suffix.lower()] < priority[prev.suffix.lower()]:
            chosen[slug] = p
    return [chosen[k] for k in sorted(chosen.keys())]


def main(argv: Optional[List[str]] = None) -> int:
    parser = argparse.ArgumentParser(
        description="Convert & normalize raw_sfx (.wav/.ogg/.mp3) to Retro 16-bit public/sfx (.ogg + .mp3)."
    )
    repo_root = Path(__file__).resolve().parent.parent
    parser.add_argument("--input-dir", type=Path, default=repo_root / "raw_sfx")
    parser.add_argument("--output-dir", type=Path, default=repo_root / "public" / "sfx")
    parser.add_argument("--sample-rate", type=int, default=DEFAULT_SR)
    parser.add_argument("--target-dbfs", type=float, default=DEFAULT_TARGET_DBFS)
    parser.add_argument("--bitrate", type=str, default=DEFAULT_BITRATE)
    parser.add_argument("--engine", choices=["auto", "ffmpeg", "pydub"], default="auto")
    parser.add_argument(
        "--seed-cc0",
        action="store_true",
        help="Ensure all 16 core CC0 16-bit JRPG seed .wav files exist in raw_sfx/ before converting.",
    )
    parser.add_argument(
        "--no-auto-seed",
        action="store_true",
        help="Do not auto-seed CC0 .wav files when raw_sfx/ is empty.",
    )
    args = parser.parse_args(argv)

    input_dir: Path = args.input_dir
    output_dir: Path = args.output_dir
    output_dir.mkdir(parents=True, exist_ok=True)

    inputs = discover_inputs(input_dir)
    if args.seed_cc0 or (not inputs and not args.no_auto_seed):
        seeded = seed_cc0_raw_sfx(input_dir)
        if seeded > 0:
            print(f"[convert_sfx] Seeded {seeded} CC0 16-bit source .wav file(s) in {input_dir}")
        inputs = discover_inputs(input_dir)

    if not inputs:
        print(f"[convert_sfx] No .wav/.ogg/.mp3 files found in {input_dir}. Nothing to convert.")
        return 0

    ffmpeg_bin = shutil.which("ffmpeg")
    has_pydub = False
    try:
        import pydub  # noqa: F401

        has_pydub = True
    except ImportError:
        has_pydub = False

    use_pydub = args.engine == "pydub" or (args.engine == "auto" and not ffmpeg_bin and has_pydub)
    if use_pydub and not has_pydub:
        print("[convert_sfx] ERROR: --engine pydub requested, but pydub is not installed.", file=sys.stderr)
        return 1
    if not ffmpeg_bin:
        print(
            "[convert_sfx] ERROR: ffmpeg was not found on PATH. Install ffmpeg (`sudo apt-get install ffmpeg`).",
            file=sys.stderr,
        )
        return 1

    manifest_clips: Dict[str, Dict[str, object]] = {}
    total_ogg = 0
    total_mp3 = 0

    print(
        f"[convert_sfx] Converting {len(inputs)} clip(s) -> {output_dir} "
        f"({args.sample_rate} Hz, Mono, {args.target_dbfs} dBFS, {args.bitrate})..."
    )

    for src in inputs:
        slug = slugify_stem(src.stem)
        ogg_out = output_dir / f"{slug}.ogg"
        mp3_out = output_dir / f"{slug}.mp3"

        if use_pydub:
            dur_ms, dbfs = _convert_with_pydub(
                src, ogg_out, mp3_out, args.sample_rate, args.target_dbfs, args.bitrate
            )
        else:
            dur_ms, dbfs = _convert_with_ffmpeg(
                ffmpeg_bin, src, ogg_out, mp3_out, args.sample_rate, args.target_dbfs, args.bitrate
            )

        ogg_sz = ogg_out.stat().st_size
        mp3_sz = mp3_out.stat().st_size
        total_ogg += ogg_sz
        total_mp3 += mp3_sz
        manifest_clips[slug] = {
            "id": slug,
            "ogg": f"./sfx/{slug}.ogg",
            "mp3": f"./sfx/{slug}.mp3",
            "durationMs": dur_ms,
            "peakDbfs": dbfs,
            "oggBytes": ogg_sz,
            "mp3Bytes": mp3_sz,
        }
        print(
            f"  ✓ {slug:<18} | {dur_ms:>4} ms | peak {dbfs:>5.2f} dBFS | "
            f"ogg {ogg_sz / 1024:>5.1f} KB | mp3 {mp3_sz / 1024:>5.1f} KB"
        )

    manifest_path = output_dir / "manifest.json"
    manifest_data = {
        "version": 1,
        "sampleRate": args.sample_rate,
        "channels": 1,
        "targetDbfs": args.target_dbfs,
        "bitrate": args.bitrate,
        "totalOggBytes": total_ogg,
        "totalMp3Bytes": total_mp3,
        "clips": manifest_clips,
    }
    manifest_path.write_text(json.dumps(manifest_data, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(
        f"[convert_sfx] Done! {len(manifest_clips)} clips exported "
        f"(OGG bank: {total_ogg / 1024:.1f} KB, MP3 bank: {total_mp3 / 1024:.1f} KB) -> {manifest_path}"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
