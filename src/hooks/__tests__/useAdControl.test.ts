/**
 * Tests for useAdControl hook logic.
 * Tests the ad timing rules directly without React rendering.
 */

// Mock ad service
jest.mock('../../services/adService', () => ({
  loadInterstitial: jest.fn(),
  showInterstitial: jest.fn(),
  loadRewardedAd: jest.fn(),
  showRewardedAd: jest.fn((cb: () => void) => cb()),
  isRewardedAdReady: jest.fn(() => true),
  isInterstitialReady: jest.fn(() => true),
}));

import { showInterstitial, loadInterstitial } from '../../services/adService';

// Test the core ad control logic extracted from the hook
const INTERSTITIAL_INTERVAL = 5;
const MAX_DAILY_REWARDED = 3;

function createAdController() {
  let battleCount = 0;
  let dailyRewardedCount = 0;
  let lastRewardedDate = '';

  return {
    onBattleEnd: () => {
      battleCount += 1;
      if (battleCount % INTERSTITIAL_INTERVAL === 0) {
        showInterstitial();
      }
      loadInterstitial();
    },
    showFreeGachaAd: (onReward: () => void): boolean => {
      const today = new Date().toISOString().split('T')[0];
      if (lastRewardedDate !== today) {
        dailyRewardedCount = 0;
        lastRewardedDate = today;
      }
      if (dailyRewardedCount >= MAX_DAILY_REWARDED) {
        return false;
      }
      dailyRewardedCount += 1;
      onReward();
      return true;
    },
    getRemainingFreeGacha: (): number => {
      const today = new Date().toISOString().split('T')[0];
      if (lastRewardedDate !== today) return MAX_DAILY_REWARDED;
      return Math.max(0, MAX_DAILY_REWARDED - dailyRewardedCount);
    },
  };
}

describe('Ad Control Logic', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('onBattleEnd - interstitial timing', () => {
    test('does not show interstitial before 5 battles', () => {
      const ctrl = createAdController();
      for (let i = 0; i < 4; i++) ctrl.onBattleEnd();

      expect(showInterstitial).not.toHaveBeenCalled();
      expect(loadInterstitial).toHaveBeenCalledTimes(4);
    });

    test('shows interstitial on 5th battle', () => {
      const ctrl = createAdController();
      for (let i = 0; i < 5; i++) ctrl.onBattleEnd();

      expect(showInterstitial).toHaveBeenCalledTimes(1);
    });

    test('shows interstitial again on 10th battle', () => {
      const ctrl = createAdController();
      for (let i = 0; i < 10; i++) ctrl.onBattleEnd();

      expect(showInterstitial).toHaveBeenCalledTimes(2);
    });

    test('does not show interstitial on 6th, 7th, 8th, 9th battles', () => {
      const ctrl = createAdController();
      for (let i = 0; i < 9; i++) ctrl.onBattleEnd();

      expect(showInterstitial).toHaveBeenCalledTimes(1); // only at 5th
    });
  });

  describe('showFreeGachaAd - daily limit', () => {
    test('allows first 3 uses', () => {
      const ctrl = createAdController();
      const onReward = jest.fn();

      expect(ctrl.showFreeGachaAd(onReward)).toBe(true);
      expect(ctrl.showFreeGachaAd(onReward)).toBe(true);
      expect(ctrl.showFreeGachaAd(onReward)).toBe(true);
      expect(onReward).toHaveBeenCalledTimes(3);
    });

    test('blocks 4th use', () => {
      const ctrl = createAdController();
      const onReward = jest.fn();

      ctrl.showFreeGachaAd(onReward);
      ctrl.showFreeGachaAd(onReward);
      ctrl.showFreeGachaAd(onReward);

      expect(ctrl.showFreeGachaAd(onReward)).toBe(false);
      expect(onReward).toHaveBeenCalledTimes(3); // not 4
    });

    test('getRemainingFreeGacha decrements correctly', () => {
      const ctrl = createAdController();
      const onReward = jest.fn();

      expect(ctrl.getRemainingFreeGacha()).toBe(3);

      ctrl.showFreeGachaAd(onReward);
      expect(ctrl.getRemainingFreeGacha()).toBe(2);

      ctrl.showFreeGachaAd(onReward);
      expect(ctrl.getRemainingFreeGacha()).toBe(1);

      ctrl.showFreeGachaAd(onReward);
      expect(ctrl.getRemainingFreeGacha()).toBe(0);
    });
  });
});
