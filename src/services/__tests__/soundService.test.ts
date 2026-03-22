/**
 * Tests for soundService - volume control and mute logic.
 * Audio playback is mocked since expo-av isn't available in test env.
 */

jest.mock('expo-av', () => ({
  Audio: {
    setAudioModeAsync: jest.fn().mockResolvedValue(undefined),
    Sound: {
      createAsync: jest.fn().mockResolvedValue({
        sound: {
          playAsync: jest.fn().mockResolvedValue(undefined),
          setVolumeAsync: jest.fn().mockResolvedValue(undefined),
          unloadAsync: jest.fn().mockResolvedValue(undefined),
          setOnPlaybackStatusUpdate: jest.fn(),
        },
      }),
    },
  },
}));

// Mock require for sound assets
jest.mock('../../../assets/sounds/se_tap.wav', () => 1, { virtual: true });
jest.mock('../../../assets/sounds/se_draw_start.wav', () => 2, { virtual: true });
jest.mock('../../../assets/sounds/se_draw_complete.wav', () => 3, { virtual: true });
jest.mock('../../../assets/sounds/se_stat_reveal.wav', () => 4, { virtual: true });
jest.mock('../../../assets/sounds/se_rarity_c.wav', () => 5, { virtual: true });
jest.mock('../../../assets/sounds/se_rarity_r.wav', () => 6, { virtual: true });
jest.mock('../../../assets/sounds/se_rarity_sr.wav', () => 7, { virtual: true });
jest.mock('../../../assets/sounds/se_rarity_ssr.wav', () => 8, { virtual: true });
jest.mock('../../../assets/sounds/se_naming_input.wav', () => 9, { virtual: true });
jest.mock('../../../assets/sounds/se_matching.wav', () => 10, { virtual: true });
jest.mock('../../../assets/sounds/se_match_found.wav', () => 11, { virtual: true });
jest.mock('../../../assets/sounds/se_summon_circle.wav', () => 12, { virtual: true });
jest.mock('../../../assets/sounds/se_summon_rise.wav', () => 13, { virtual: true });
jest.mock('../../../assets/sounds/se_vs.wav', () => 14, { virtual: true });
jest.mock('../../../assets/sounds/se_battle_start.wav', () => 15, { virtual: true });
jest.mock('../../../assets/sounds/se_attack.wav', () => 16, { virtual: true });
jest.mock('../../../assets/sounds/se_critical.wav', () => 17, { virtual: true });
jest.mock('../../../assets/sounds/se_special_cutin.wav', () => 18, { virtual: true });
jest.mock('../../../assets/sounds/se_special_hit.wav', () => 19, { virtual: true });
jest.mock('../../../assets/sounds/se_status_poison.wav', () => 20, { virtual: true });
jest.mock('../../../assets/sounds/se_status_sleep.wav', () => 21, { virtual: true });
jest.mock('../../../assets/sounds/se_status_paralyze.wav', () => 22, { virtual: true });
jest.mock('../../../assets/sounds/se_status_burn.wav', () => 23, { virtual: true });
jest.mock('../../../assets/sounds/se_status_freeze.wav', () => 24, { virtual: true });
jest.mock('../../../assets/sounds/se_status_tick.wav', () => 25, { virtual: true });
jest.mock('../../../assets/sounds/se_victory.wav', () => 26, { virtual: true });
jest.mock('../../../assets/sounds/se_defeat.wav', () => 27, { virtual: true });
jest.mock('../../../assets/sounds/se_levelup.wav', () => 28, { virtual: true });
jest.mock('../../../assets/sounds/se_evolve.wav', () => 29, { virtual: true });
jest.mock('../../../assets/sounds/se_equip.wav', () => 30, { virtual: true });
jest.mock('../../../assets/sounds/se_title_unlock.wav', () => 31, { virtual: true });
jest.mock('../../../assets/sounds/bgm_title.wav', () => 101, { virtual: true });
jest.mock('../../../assets/sounds/bgm_draw.wav', () => 102, { virtual: true });
jest.mock('../../../assets/sounds/bgm_menu.wav', () => 103, { virtual: true });
jest.mock('../../../assets/sounds/bgm_battle.wav', () => 104, { virtual: true });
jest.mock('../../../assets/sounds/bgm_battle_boss.wav', () => 105, { virtual: true });
jest.mock('../../../assets/sounds/bgm_result_win.wav', () => 106, { virtual: true });
jest.mock('../../../assets/sounds/bgm_result_lose.wav', () => 107, { virtual: true });

import {
  initSound,
  playSE,
  playBGM,
  stopBGM,
  setSEVolume,
  setBGMVolume,
  setMuted,
  getMuted,
  getSEVolume,
  getBGMVolume,
  cleanupSound,
  SE,
  BGM,
} from '../soundService';

import { Audio } from 'expo-av';

describe('soundService', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    setMuted(false);
    setSEVolume(0.8);
    setBGMVolume(0.5);
    await cleanupSound();
  });

  describe('initSound', () => {
    test('sets audio mode', async () => {
      await initSound();
      expect(Audio.setAudioModeAsync).toHaveBeenCalledWith({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
      });
    });
  });

  describe('volume control', () => {
    test('setSEVolume clamps to [0, 1]', () => {
      setSEVolume(1.5);
      expect(getSEVolume()).toBe(1);

      setSEVolume(-0.5);
      expect(getSEVolume()).toBe(0);

      setSEVolume(0.6);
      expect(getSEVolume()).toBe(0.6);
    });

    test('setBGMVolume clamps to [0, 1]', () => {
      setBGMVolume(2.0);
      expect(getBGMVolume()).toBe(1);

      setBGMVolume(-1);
      expect(getBGMVolume()).toBe(0);
    });

    test('mute toggle works', () => {
      expect(getMuted()).toBe(false);
      setMuted(true);
      expect(getMuted()).toBe(true);
      setMuted(false);
      expect(getMuted()).toBe(false);
    });
  });

  describe('playSE', () => {
    test('plays SE when not muted', async () => {
      await playSE(SE.TAP);
      expect(Audio.Sound.createAsync).toHaveBeenCalled();
    });

    test('does not play SE when muted', async () => {
      setMuted(true);
      await playSE(SE.TAP);
      expect(Audio.Sound.createAsync).not.toHaveBeenCalled();
    });

    test('warns on unknown SE ID', async () => {
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation();
      await playSE('nonexistent_se');
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Unknown SE')
      );
      warnSpy.mockRestore();
    });
  });

  describe('SE/BGM constants', () => {
    test('SE has all expected keys', () => {
      expect(SE.TAP).toBe('se_tap');
      expect(SE.ATTACK).toBe('se_attack');
      expect(SE.VICTORY).toBe('se_victory');
      expect(SE.DEFEAT).toBe('se_defeat');
      expect(SE.EVOLVE).toBe('se_evolve');
      expect(Object.keys(SE).length).toBe(31);
    });

    test('BGM has all expected keys', () => {
      expect(BGM.TITLE).toBe('bgm_title');
      expect(BGM.BATTLE).toBe('bgm_battle');
      expect(BGM.RESULT_WIN).toBe('bgm_result_win');
      expect(Object.keys(BGM).length).toBe(7);
    });
  });
});
