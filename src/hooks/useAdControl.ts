import { useRef, useCallback } from 'react';
import { loadInterstitial, showInterstitial, loadRewardedAd, showRewardedAd } from '../services/adService';

/** Show interstitial every N battles */
const INTERSTITIAL_INTERVAL = 5;

/** Max free gacha per day from rewarded ads */
const MAX_DAILY_REWARDED = 3;

/**
 * Hook to manage ad display timing.
 * Enforces rules:
 * - NEVER show ads during battle
 * - Interstitial: every 5 battles, between screens
 * - Rewarded: opt-in only ("watch to earn")
 */
export function useAdControl() {
  const battleCount = useRef(0);
  const dailyRewardedCount = useRef(0);
  const lastRewardedDate = useRef<string>('');

  /** Call after each battle ends (before navigating to result) */
  const onBattleEnd = useCallback(() => {
    battleCount.current += 1;

    if (battleCount.current % INTERSTITIAL_INTERVAL === 0) {
      showInterstitial();
    }

    // Pre-load next interstitial
    loadInterstitial();
  }, []);

  /** Show rewarded ad for EXP 2x boost */
  const showExpBoostAd = useCallback((onReward: () => void) => {
    showRewardedAd(() => {
      onReward();
      loadRewardedAd(); // Pre-load next
    });
  }, []);

  /** Show rewarded ad for free equipment gacha (3x daily limit) */
  const showFreeGachaAd = useCallback((onReward: () => void): boolean => {
    const today = new Date().toISOString().split('T')[0];

    // Reset daily counter on new day
    if (lastRewardedDate.current !== today) {
      dailyRewardedCount.current = 0;
      lastRewardedDate.current = today;
    }

    if (dailyRewardedCount.current >= MAX_DAILY_REWARDED) {
      return false; // Daily limit reached
    }

    showRewardedAd(() => {
      dailyRewardedCount.current += 1;
      onReward();
      loadRewardedAd();
    });

    return true;
  }, []);

  const getRemainingFreeGacha = useCallback((): number => {
    const today = new Date().toISOString().split('T')[0];
    if (lastRewardedDate.current !== today) {
      return MAX_DAILY_REWARDED;
    }
    return Math.max(0, MAX_DAILY_REWARDED - dailyRewardedCount.current);
  }, []);

  return {
    onBattleEnd,
    showExpBoostAd,
    showFreeGachaAd,
    getRemainingFreeGacha,
  };
}
