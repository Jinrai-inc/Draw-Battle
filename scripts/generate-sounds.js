/**
 * Generate placeholder SE & BGM WAV files for Draw Battle.
 *
 * Usage: node scripts/generate-sounds.js
 *
 * Generates cyberpunk-style electronic sounds as 16-bit PCM WAV files.
 * These are functional placeholders - replace with professionally produced audio later.
 */

const fs = require('fs');
const path = require('path');

const SAMPLE_RATE = 44100;
const OUTPUT_DIR = path.join(__dirname, '..', 'assets', 'sounds');

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// ── WAV Writer ──────────────────────────────────────────────

function writeWav(filename, samples) {
  const numSamples = samples.length;
  const byteRate = SAMPLE_RATE * 2; // 16-bit mono
  const dataSize = numSamples * 2;
  const buffer = Buffer.alloc(44 + dataSize);

  // RIFF header
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write('WAVE', 8);

  // fmt chunk
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16); // chunk size
  buffer.writeUInt16LE(1, 20);  // PCM
  buffer.writeUInt16LE(1, 22);  // mono
  buffer.writeUInt32LE(SAMPLE_RATE, 24);
  buffer.writeUInt32LE(byteRate, 28);
  buffer.writeUInt16LE(2, 32);  // block align
  buffer.writeUInt16LE(16, 34); // bits per sample

  // data chunk
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataSize, 40);

  for (let i = 0; i < numSamples; i++) {
    const val = Math.max(-1, Math.min(1, samples[i]));
    buffer.writeInt16LE(Math.round(val * 32767), 44 + i * 2);
  }

  const filepath = path.join(OUTPUT_DIR, filename);
  fs.writeFileSync(filepath, buffer);
  console.log(`  ✓ ${filename} (${(buffer.length / 1024).toFixed(1)}KB)`);
}

// ── Oscillators ─────────────────────────────────────────────

function sine(freq, t) {
  return Math.sin(2 * Math.PI * freq * t);
}

function square(freq, t) {
  return sine(freq, t) >= 0 ? 1 : -1;
}

function saw(freq, t) {
  const p = (freq * t) % 1;
  return 2 * p - 1;
}

function noise() {
  return Math.random() * 2 - 1;
}

function triangle(freq, t) {
  const p = (freq * t) % 1;
  return p < 0.5 ? 4 * p - 1 : 3 - 4 * p;
}

// ── Envelope ────────────────────────────────────────────────

function adsr(t, duration, attack, decay, sustain, release) {
  const releaseStart = duration - release;
  if (t < attack) return t / attack;
  if (t < attack + decay) return 1 - (1 - sustain) * ((t - attack) / decay);
  if (t < releaseStart) return sustain;
  if (t < duration) return sustain * (1 - (t - releaseStart) / release);
  return 0;
}

function expDecay(t, duration, speed = 5) {
  return Math.exp(-speed * t / duration);
}

// ── SE Generators ───────────────────────────────────────────

function genTap() {
  const dur = 0.08;
  const samples = [];
  for (let i = 0; i < SAMPLE_RATE * dur; i++) {
    const t = i / SAMPLE_RATE;
    const env = expDecay(t, dur, 15);
    samples.push(env * (sine(800, t) * 0.5 + sine(1200, t) * 0.3) * 0.6);
  }
  return samples;
}

function genDrawStart() {
  const dur = 0.4;
  const samples = [];
  for (let i = 0; i < SAMPLE_RATE * dur; i++) {
    const t = i / SAMPLE_RATE;
    const freq = 300 + 500 * (t / dur);
    const env = adsr(t, dur, 0.02, 0.1, 0.6, 0.15);
    samples.push(env * (sine(freq, t) * 0.4 + triangle(freq * 1.5, t) * 0.2) * 0.7);
  }
  return samples;
}

function genDrawComplete() {
  const dur = 0.6;
  const samples = [];
  for (let i = 0; i < SAMPLE_RATE * dur; i++) {
    const t = i / SAMPLE_RATE;
    const env = adsr(t, dur, 0.01, 0.15, 0.4, 0.25);
    const s = sine(523, t) * 0.3 + sine(659, t) * 0.3 + sine(784, t) * 0.2;
    samples.push(env * s * 0.7);
  }
  return samples;
}

function genStatReveal() {
  const dur = 0.35;
  const samples = [];
  for (let i = 0; i < SAMPLE_RATE * dur; i++) {
    const t = i / SAMPLE_RATE;
    const freq = 400 + 300 * Math.min(1, t / 0.15);
    const env = expDecay(t, dur, 4);
    samples.push(env * (square(freq, t) * 0.15 + sine(freq, t) * 0.3) * 0.6);
  }
  return samples;
}

function genRarity(baseFreq, duration, shimmer) {
  const dur = duration;
  const samples = [];
  for (let i = 0; i < SAMPLE_RATE * dur; i++) {
    const t = i / SAMPLE_RATE;
    const env = adsr(t, dur, 0.02, 0.2, 0.5, 0.3);
    let s = sine(baseFreq, t) * 0.3 + sine(baseFreq * 1.5, t) * 0.2;
    if (shimmer) {
      s += sine(baseFreq * 2, t) * 0.15 * Math.sin(12 * Math.PI * t);
      s += sine(baseFreq * 3, t) * 0.1 * Math.sin(8 * Math.PI * t);
    }
    samples.push(env * s * 0.7);
  }
  return samples;
}

function genNamingInput() {
  const dur = 0.1;
  const samples = [];
  for (let i = 0; i < SAMPLE_RATE * dur; i++) {
    const t = i / SAMPLE_RATE;
    const env = expDecay(t, dur, 20);
    samples.push(env * sine(1000, t) * 0.4);
  }
  return samples;
}

function genMatching() {
  const dur = 1.5;
  const samples = [];
  for (let i = 0; i < SAMPLE_RATE * dur; i++) {
    const t = i / SAMPLE_RATE;
    const pulse = Math.sin(2 * Math.PI * 2 * t) > 0 ? 1 : 0.3;
    const env = adsr(t, dur, 0.1, 0.1, 0.8, 0.3) * pulse;
    samples.push(env * (sine(440, t) * 0.3 + sine(550, t) * 0.2) * 0.5);
  }
  return samples;
}

function genMatchFound() {
  const dur = 0.8;
  const samples = [];
  for (let i = 0; i < SAMPLE_RATE * dur; i++) {
    const t = i / SAMPLE_RATE;
    const freq = t < 0.2 ? 523 : t < 0.4 ? 659 : 784;
    const env = adsr(t, dur, 0.01, 0.1, 0.6, 0.2);
    samples.push(env * (sine(freq, t) * 0.4 + sine(freq * 2, t) * 0.15) * 0.7);
  }
  return samples;
}

function genSummonCircle() {
  const dur = 2.0;
  const samples = [];
  for (let i = 0; i < SAMPLE_RATE * dur; i++) {
    const t = i / SAMPLE_RATE;
    const freq = 200 + 100 * Math.sin(2 * Math.PI * 0.5 * t);
    const env = adsr(t, dur, 0.5, 0.3, 0.6, 0.5);
    const s = sine(freq, t) * 0.3 + sine(freq * 1.5, t) * 0.15 + noise() * 0.03;
    samples.push(env * s * 0.6);
  }
  return samples;
}

function genSummonRise() {
  const dur = 1.2;
  const samples = [];
  for (let i = 0; i < SAMPLE_RATE * dur; i++) {
    const t = i / SAMPLE_RATE;
    const freq = 200 + 800 * Math.pow(t / dur, 2);
    const env = adsr(t, dur, 0.1, 0.1, 0.8, 0.2);
    samples.push(env * (sine(freq, t) * 0.4 + saw(freq * 0.5, t) * 0.1) * 0.7);
  }
  return samples;
}

function genVS() {
  const dur = 0.8;
  const samples = [];
  for (let i = 0; i < SAMPLE_RATE * dur; i++) {
    const t = i / SAMPLE_RATE;
    const env = t < 0.05 ? t / 0.05 : expDecay(t - 0.05, dur - 0.05, 3);
    const s = sine(200, t) * 0.3 + square(100, t) * 0.15 + noise() * 0.08 * expDecay(t, dur, 8);
    samples.push(env * s * 0.7);
  }
  return samples;
}

function genBattleStart() {
  const dur = 1.0;
  const samples = [];
  for (let i = 0; i < SAMPLE_RATE * dur; i++) {
    const t = i / SAMPLE_RATE;
    const env = adsr(t, dur, 0.02, 0.3, 0.4, 0.3);
    const s = sine(330, t) * 0.3 + sine(440, t) * 0.2 + sine(550, t) * 0.15 + noise() * 0.05 * expDecay(t, dur, 5);
    samples.push(env * s * 0.7);
  }
  return samples;
}

function genAttack() {
  const dur = 0.25;
  const samples = [];
  for (let i = 0; i < SAMPLE_RATE * dur; i++) {
    const t = i / SAMPLE_RATE;
    const env = expDecay(t, dur, 10);
    const freq = 300 - 200 * (t / dur);
    samples.push(env * (saw(freq, t) * 0.2 + noise() * 0.3) * 0.6);
  }
  return samples;
}

function genCritical() {
  const dur = 0.5;
  const samples = [];
  for (let i = 0; i < SAMPLE_RATE * dur; i++) {
    const t = i / SAMPLE_RATE;
    const env = t < 0.02 ? t / 0.02 : expDecay(t - 0.02, dur - 0.02, 5);
    const s = sine(600, t) * 0.3 + sine(900, t) * 0.2 + noise() * 0.2 * expDecay(t, dur, 12);
    samples.push(env * s * 0.8);
  }
  return samples;
}

function genSpecialCutin() {
  const dur = 1.0;
  const samples = [];
  for (let i = 0; i < SAMPLE_RATE * dur; i++) {
    const t = i / SAMPLE_RATE;
    const freq = 200 + 600 * (t / dur);
    const env = adsr(t, dur, 0.1, 0.2, 0.7, 0.2);
    const s = sine(freq, t) * 0.3 + square(freq * 0.5, t) * 0.1 + sine(freq * 2, t) * 0.1;
    samples.push(env * s * 0.7);
  }
  return samples;
}

function genSpecialHit() {
  const dur = 0.7;
  const samples = [];
  for (let i = 0; i < SAMPLE_RATE * dur; i++) {
    const t = i / SAMPLE_RATE;
    const env = t < 0.01 ? t / 0.01 : expDecay(t - 0.01, dur - 0.01, 4);
    const s = sine(500, t) * 0.2 + sine(250, t) * 0.2 + noise() * 0.3 * expDecay(t, dur, 8);
    samples.push(env * s * 0.8);
  }
  return samples;
}

function genStatusEffect(freq, wobble) {
  const dur = 0.5;
  const samples = [];
  for (let i = 0; i < SAMPLE_RATE * dur; i++) {
    const t = i / SAMPLE_RATE;
    const env = adsr(t, dur, 0.05, 0.15, 0.4, 0.2);
    const mod = wobble ? Math.sin(2 * Math.PI * wobble * t) * 50 : 0;
    samples.push(env * sine(freq + mod, t) * 0.5);
  }
  return samples;
}

function genStatusTick() {
  const dur = 0.3;
  const samples = [];
  for (let i = 0; i < SAMPLE_RATE * dur; i++) {
    const t = i / SAMPLE_RATE;
    const env = expDecay(t, dur, 8);
    samples.push(env * (sine(350, t) * 0.3 + sine(175, t) * 0.2) * 0.5);
  }
  return samples;
}

function genVictory() {
  const dur = 2.0;
  const notes = [523, 659, 784, 1047]; // C5 E5 G5 C6
  const samples = [];
  for (let i = 0; i < SAMPLE_RATE * dur; i++) {
    const t = i / SAMPLE_RATE;
    const noteIdx = Math.min(3, Math.floor(t / 0.4));
    const noteT = t - noteIdx * 0.4;
    const freq = notes[noteIdx];
    const env = adsr(t, dur, 0.02, 0.2, 0.5, 0.5);
    const noteEnv = expDecay(noteT, 0.4, 2);
    samples.push(env * noteEnv * (sine(freq, t) * 0.3 + sine(freq * 2, t) * 0.1) * 0.7);
  }
  return samples;
}

function genDefeat() {
  const dur = 1.5;
  const samples = [];
  for (let i = 0; i < SAMPLE_RATE * dur; i++) {
    const t = i / SAMPLE_RATE;
    const freq = 400 - 200 * (t / dur);
    const env = adsr(t, dur, 0.1, 0.3, 0.3, 0.5);
    samples.push(env * (sine(freq, t) * 0.3 + sine(freq * 0.5, t) * 0.2) * 0.5);
  }
  return samples;
}

function genLevelup() {
  const dur = 1.2;
  const samples = [];
  for (let i = 0; i < SAMPLE_RATE * dur; i++) {
    const t = i / SAMPLE_RATE;
    const freq = 400 + 800 * Math.pow(t / dur, 1.5);
    const env = adsr(t, dur, 0.05, 0.2, 0.6, 0.3);
    const shimmer = 1 + 0.3 * Math.sin(20 * Math.PI * t);
    samples.push(env * shimmer * (sine(freq, t) * 0.3 + triangle(freq * 1.5, t) * 0.15) * 0.7);
  }
  return samples;
}

function genEvolve() {
  const dur = 2.5;
  const samples = [];
  for (let i = 0; i < SAMPLE_RATE * dur; i++) {
    const t = i / SAMPLE_RATE;
    const phase = t / dur;
    const freq = 200 + 1000 * Math.pow(phase, 2);
    const env = adsr(t, dur, 0.3, 0.3, 0.7, 0.5);
    const shimmer = 1 + 0.5 * Math.sin(30 * Math.PI * t * phase);
    const s = sine(freq, t) * 0.25 + sine(freq * 1.5, t) * 0.15 + sine(freq * 2, t) * 0.1;
    samples.push(env * shimmer * s * 0.7);
  }
  return samples;
}

function genEquip() {
  const dur = 0.4;
  const samples = [];
  for (let i = 0; i < SAMPLE_RATE * dur; i++) {
    const t = i / SAMPLE_RATE;
    const env = expDecay(t, dur, 5);
    const s = sine(600, t) * 0.3 + sine(900, t) * 0.2 + noise() * 0.05 * expDecay(t, dur, 15);
    samples.push(env * s * 0.6);
  }
  return samples;
}

function genTitleUnlock() {
  const dur = 1.0;
  const samples = [];
  for (let i = 0; i < SAMPLE_RATE * dur; i++) {
    const t = i / SAMPLE_RATE;
    const freq = t < 0.3 ? 440 : t < 0.6 ? 554 : 659;
    const env = adsr(t, dur, 0.02, 0.1, 0.6, 0.2);
    const s = sine(freq, t) * 0.3 + sine(freq * 2, t) * 0.1 + triangle(freq * 0.5, t) * 0.1;
    samples.push(env * s * 0.7);
  }
  return samples;
}

// ── BGM Generators ──────────────────────────────────────────

function genBGM(name, durationSec, config) {
  const { bassFreq, chordFreqs, tempo, style } = config;
  const samples = [];
  const beatLen = 60 / tempo;

  for (let i = 0; i < SAMPLE_RATE * durationSec; i++) {
    const t = i / SAMPLE_RATE;
    const beat = (t / beatLen) % 4;

    // Bass line
    let s = sine(bassFreq, t) * 0.15;

    // Kick on beats 0, 2
    if (beat < 0.1 || (beat > 2 && beat < 2.1)) {
      const kickT = (beat < 0.1 ? beat : beat - 2) * beatLen;
      s += sine(60 - 40 * (kickT / 0.1), t) * 0.2 * expDecay(kickT, 0.1, 10);
    }

    // Hi-hat on 8th notes
    const eighth = (t / (beatLen / 2)) % 1;
    if (eighth < 0.05) {
      s += noise() * 0.08 * expDecay(eighth * beatLen / 2, 0.05, 20);
    }

    // Chord pad
    for (const freq of chordFreqs) {
      if (style === 'dark') {
        s += square(freq, t) * 0.04;
      } else {
        s += sine(freq, t) * 0.06;
      }
    }

    // Arpeggio (cyberpunk feel)
    if (style === 'cyber' || style === 'battle') {
      const arpIdx = Math.floor((t / (beatLen / 4)) % chordFreqs.length);
      const arpFreq = chordFreqs[arpIdx] * 2;
      const arpEnv = expDecay((t / (beatLen / 4)) % 1 * (beatLen / 4), beatLen / 4, 8);
      s += saw(arpFreq, t) * 0.05 * arpEnv;
    }

    // Master envelope: fade in/out
    let masterEnv = 1;
    if (t < 0.5) masterEnv = t / 0.5;
    if (t > durationSec - 0.5) masterEnv = (durationSec - t) / 0.5;

    samples.push(s * masterEnv * 0.8);
  }

  return samples;
}

// ── Main Generation ─────────────────────────────────────────

console.log('🎵 Generating SE files...\n');

// SE files
const seFiles = [
  ['se_tap.wav', genTap()],
  ['se_draw_start.wav', genDrawStart()],
  ['se_draw_complete.wav', genDrawComplete()],
  ['se_stat_reveal.wav', genStatReveal()],
  ['se_rarity_c.wav', genRarity(400, 0.5, false)],
  ['se_rarity_r.wav', genRarity(500, 0.7, false)],
  ['se_rarity_sr.wav', genRarity(600, 1.0, true)],
  ['se_rarity_ssr.wav', genRarity(700, 1.5, true)],
  ['se_naming_input.wav', genNamingInput()],
  ['se_matching.wav', genMatching()],
  ['se_match_found.wav', genMatchFound()],
  ['se_summon_circle.wav', genSummonCircle()],
  ['se_summon_rise.wav', genSummonRise()],
  ['se_vs.wav', genVS()],
  ['se_battle_start.wav', genBattleStart()],
  ['se_attack.wav', genAttack()],
  ['se_critical.wav', genCritical()],
  ['se_special_cutin.wav', genSpecialCutin()],
  ['se_special_hit.wav', genSpecialHit()],
  ['se_status_poison.wav', genStatusEffect(300, 5)],
  ['se_status_sleep.wav', genStatusEffect(250, 2)],
  ['se_status_paralyze.wav', genStatusEffect(500, 15)],
  ['se_status_burn.wav', genStatusEffect(450, 8)],
  ['se_status_freeze.wav', genStatusEffect(600, 3)],
  ['se_status_tick.wav', genStatusTick()],
  ['se_victory.wav', genVictory()],
  ['se_defeat.wav', genDefeat()],
  ['se_levelup.wav', genLevelup()],
  ['se_evolve.wav', genEvolve()],
  ['se_equip.wav', genEquip()],
  ['se_title_unlock.wav', genTitleUnlock()],
];

for (const [filename, samples] of seFiles) {
  writeWav(filename, samples);
}

console.log(`\n🎶 Generating BGM files (8 sec loops)...\n`);

// BGM files (8 second loops - short placeholders)
const bgmFiles = [
  ['bgm_title.wav', genBGM('title', 8, {
    bassFreq: 55, chordFreqs: [220, 277, 330], tempo: 100, style: 'cyber',
  })],
  ['bgm_draw.wav', genBGM('draw', 8, {
    bassFreq: 65, chordFreqs: [261, 330, 392], tempo: 90, style: 'pad',
  })],
  ['bgm_menu.wav', genBGM('menu', 8, {
    bassFreq: 55, chordFreqs: [220, 277, 330], tempo: 110, style: 'cyber',
  })],
  ['bgm_battle.wav', genBGM('battle', 8, {
    bassFreq: 82, chordFreqs: [330, 392, 494], tempo: 140, style: 'battle',
  })],
  ['bgm_battle_boss.wav', genBGM('battle_boss', 8, {
    bassFreq: 73, chordFreqs: [293, 349, 440], tempo: 150, style: 'dark',
  })],
  ['bgm_result_win.wav', genBGM('result_win', 8, {
    bassFreq: 65, chordFreqs: [261, 330, 392], tempo: 120, style: 'cyber',
  })],
  ['bgm_result_lose.wav', genBGM('result_lose', 8, {
    bassFreq: 55, chordFreqs: [220, 262, 330], tempo: 80, style: 'dark',
  })],
];

for (const [filename, samples] of bgmFiles) {
  writeWav(filename, samples);
}

console.log(`\n✅ Done! Generated ${seFiles.length} SE + ${bgmFiles.length} BGM files in ${OUTPUT_DIR}`);
