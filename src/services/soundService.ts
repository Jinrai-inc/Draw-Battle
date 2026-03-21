/**
 * Sound Service - SE & BGM management
 *
 * Uses expo-av for audio playback.
 * Cyberpunk-themed electronic sounds.
 *
 * BGM: 1 track at a time, crossfade on scene change
 * SE: Multiple simultaneous playback
 */

import { Audio } from 'expo-av';

// Sound volume settings (0.0 - 1.0)
let seVolume = 0.8;
let bgmVolume = 0.5;
let isMuted = false;

// Active BGM reference
let currentBgm: Audio.Sound | null = null;
let currentBgmId: string | null = null;

/**
 * Initialize audio system.
 * Call once at app startup.
 */
export async function initSound(): Promise<void> {
  try {
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
      shouldDuckAndroid: true,
    });
  } catch (error) {
    console.warn('[SoundService] Init failed:', error);
  }
}

/**
 * Play a sound effect (short, non-blocking).
 * Multiple SE can play simultaneously.
 */
export async function playSE(seId: string): Promise<void> {
  if (isMuted) return;

  try {
    // In production, load from assets/sounds/[seId].mp3
    // For now, use Tone.js-generated sounds or placeholder
    // const { sound } = await Audio.Sound.createAsync(
    //   require(`../../assets/sounds/${seId}.mp3`),
    //   { volume: seVolume }
    // );
    // await sound.playAsync();
    // sound.setOnPlaybackStatusUpdate((status) => {
    //   if (status.isLoaded && status.didJustFinish) {
    //     sound.unloadAsync();
    //   }
    // });
    console.log(`[SE] ${seId}`);
  } catch (error) {
    console.warn(`[SoundService] SE play failed (${seId}):`, error);
  }
}

/**
 * Play BGM with crossfade.
 * Only 1 BGM track plays at a time.
 */
export async function playBGM(bgmId: string): Promise<void> {
  if (currentBgmId === bgmId) return; // Already playing
  if (isMuted) {
    currentBgmId = bgmId;
    return;
  }

  try {
    // Fade out current BGM
    if (currentBgm) {
      await fadeOut(currentBgm);
      await currentBgm.unloadAsync();
      currentBgm = null;
    }

    currentBgmId = bgmId;

    // In production, load from assets/sounds/[bgmId].mp3
    // const { sound } = await Audio.Sound.createAsync(
    //   require(`../../assets/sounds/${bgmId}.mp3`),
    //   { volume: 0, isLooping: true }
    // );
    // currentBgm = sound;
    // await sound.playAsync();
    // await fadeIn(sound);
    console.log(`[BGM] ${bgmId}`);
  } catch (error) {
    console.warn(`[SoundService] BGM play failed (${bgmId}):`, error);
  }
}

/**
 * Stop current BGM with fade out.
 */
export async function stopBGM(): Promise<void> {
  if (currentBgm) {
    await fadeOut(currentBgm);
    await currentBgm.unloadAsync();
    currentBgm = null;
    currentBgmId = null;
  }
}

/**
 * Fade in a sound from 0 to bgmVolume.
 */
async function fadeIn(sound: Audio.Sound, duration = 500): Promise<void> {
  const steps = 10;
  const stepDuration = duration / steps;
  for (let i = 1; i <= steps; i++) {
    await sound.setVolumeAsync((i / steps) * bgmVolume);
    await new Promise(r => setTimeout(r, stepDuration));
  }
}

/**
 * Fade out a sound from current volume to 0.
 */
async function fadeOut(sound: Audio.Sound, duration = 300): Promise<void> {
  const steps = 6;
  const stepDuration = duration / steps;
  for (let i = steps - 1; i >= 0; i--) {
    try {
      await sound.setVolumeAsync((i / steps) * bgmVolume);
      await new Promise(r => setTimeout(r, stepDuration));
    } catch {
      break;
    }
  }
}

// Volume control
export function setSEVolume(volume: number): void {
  seVolume = Math.max(0, Math.min(1, volume));
}

export function setBGMVolume(volume: number): void {
  bgmVolume = Math.max(0, Math.min(1, volume));
  if (currentBgm) {
    currentBgm.setVolumeAsync(bgmVolume).catch(() => {});
  }
}

export function setMuted(muted: boolean): void {
  isMuted = muted;
  if (muted && currentBgm) {
    currentBgm.setVolumeAsync(0).catch(() => {});
  } else if (!muted && currentBgm) {
    currentBgm.setVolumeAsync(bgmVolume).catch(() => {});
  }
}

export function getMuted(): boolean {
  return isMuted;
}

export function getSEVolume(): number {
  return seVolume;
}

export function getBGMVolume(): number {
  return bgmVolume;
}

/**
 * Cleanup all audio resources.
 */
export async function cleanupSound(): Promise<void> {
  if (currentBgm) {
    await currentBgm.unloadAsync().catch(() => {});
    currentBgm = null;
    currentBgmId = null;
  }
}

// SE IDs for type safety
export const SE = {
  TAP: 'se_tap',
  DRAW_START: 'se_draw_start',
  DRAW_COMPLETE: 'se_draw_complete',
  STAT_REVEAL: 'se_stat_reveal',
  RARITY_C: 'se_rarity_c',
  RARITY_R: 'se_rarity_r',
  RARITY_SR: 'se_rarity_sr',
  RARITY_SSR: 'se_rarity_ssr',
  NAMING_INPUT: 'se_naming_input',
  MATCHING: 'se_matching',
  MATCH_FOUND: 'se_match_found',
  SUMMON_CIRCLE: 'se_summon_circle',
  SUMMON_RISE: 'se_summon_rise',
  VS: 'se_vs',
  BATTLE_START: 'se_battle_start',
  ATTACK: 'se_attack',
  CRITICAL: 'se_critical',
  SPECIAL_CUTIN: 'se_special_cutin',
  SPECIAL_HIT: 'se_special_hit',
  STATUS_POISON: 'se_status_poison',
  STATUS_SLEEP: 'se_status_sleep',
  STATUS_PARALYZE: 'se_status_paralyze',
  STATUS_BURN: 'se_status_burn',
  STATUS_FREEZE: 'se_status_freeze',
  STATUS_TICK: 'se_status_tick',
  VICTORY: 'se_victory',
  DEFEAT: 'se_defeat',
  LEVELUP: 'se_levelup',
  EVOLVE: 'se_evolve',
  EQUIP: 'se_equip',
  TITLE_UNLOCK: 'se_title_unlock',
} as const;

// BGM IDs for type safety
export const BGM = {
  TITLE: 'bgm_title',
  DRAW: 'bgm_draw',
  MENU: 'bgm_menu',
  BATTLE: 'bgm_battle',
  BATTLE_BOSS: 'bgm_battle_boss',
  RESULT_WIN: 'bgm_result_win',
  RESULT_LOSE: 'bgm_result_lose',
} as const;
