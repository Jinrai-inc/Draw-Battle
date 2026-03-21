/**
 * Ad Service - AppLovin MAX Mediation
 *
 * Mediated networks:
 * - AppLovin (main demand, AI-optimized)
 * - Google AdMob (fill rate fallback)
 * - Mintegral (high eCPM for Japan/Asia)
 * - Unity Ads or Vungle (game ad demand)
 *
 * Phase 7 implementation. SDK keys must be configured before use.
 */

// TODO: Install react-native-applovin-max when ready for Phase 7
// import AppLovinMAX from 'react-native-applovin-max';

// Placeholder SDK key - replace with actual key from AppLovin dashboard
const SDK_KEY = 'YOUR_SDK_KEY';

// Ad Unit IDs - replace with actual IDs from AppLovin MAX dashboard
const REWARDED_AD_UNIT_ID = 'YOUR_REWARDED_AD_UNIT_ID';
const INTER_AD_UNIT_ID = 'YOUR_INTER_AD_UNIT_ID';
const BANNER_AD_UNIT_ID = 'YOUR_BANNER_AD_UNIT_ID';

let isInitialized = false;

/**
 * Initialize AppLovin MAX SDK.
 * Call once at app startup.
 */
export const initAds = async (): Promise<void> => {
  if (isInitialized) return;

  try {
    // AppLovinMAX.initialize(SDK_KEY);
    // AppLovinMAX.addEventListener('OnSdkInitializedEvent', () => {
    //   isInitialized = true;
    //   // Pre-load ads after initialization
    //   loadRewardedAd();
    //   loadInterstitial();
    // });
    console.log('[AdService] AppLovin MAX initialization skipped (SDK not installed)');
  } catch (error) {
    console.error('[AdService] Init failed:', error);
  }
};

/**
 * Rewarded Ad - "watch to earn" format
 * Used for: EXP 2x, free equipment gacha (3x daily)
 */
export const loadRewardedAd = (): void => {
  // AppLovinMAX.loadRewardedAd(REWARDED_AD_UNIT_ID);
};

export const isRewardedAdReady = (): boolean => {
  // return AppLovinMAX.isRewardedAdReady(REWARDED_AD_UNIT_ID);
  return false;
};

export const showRewardedAd = (onReward: () => void): void => {
  // if (AppLovinMAX.isRewardedAdReady(REWARDED_AD_UNIT_ID)) {
  //   AppLovinMAX.showRewardedAd(REWARDED_AD_UNIT_ID);
  // }
  // AppLovinMAX.addEventListener('OnRewardedAdReceivedRewardEvent', () => {
  //   onReward();
  // });
  console.log('[AdService] Rewarded ad not available (SDK not installed)');
};

/**
 * Interstitial Ad - full screen between screens
 * Used for: Every 5 battles, shown when returning to home
 * NEVER shown during battle
 */
export const loadInterstitial = (): void => {
  // AppLovinMAX.loadInterstitial(INTER_AD_UNIT_ID);
};

export const isInterstitialReady = (): boolean => {
  // return AppLovinMAX.isInterstitialReady(INTER_AD_UNIT_ID);
  return false;
};

export const showInterstitial = (): void => {
  // if (AppLovinMAX.isInterstitialReady(INTER_AD_UNIT_ID)) {
  //   AppLovinMAX.showInterstitial(INTER_AD_UNIT_ID);
  // }
  console.log('[AdService] Interstitial not available (SDK not installed)');
};

/**
 * Banner Ad - persistent at bottom of screen
 * Used for: Battle result screen
 */
export const showBanner = (): void => {
  // AppLovinMAX.createBanner(BANNER_AD_UNIT_ID, AppLovinMAX.AdViewPosition.BOTTOM_CENTER);
  // AppLovinMAX.showBanner(BANNER_AD_UNIT_ID);
  console.log('[AdService] Banner not available (SDK not installed)');
};

export const hideBanner = (): void => {
  // AppLovinMAX.hideBanner(BANNER_AD_UNIT_ID);
};

/**
 * Cleanup - remove listeners
 */
export const cleanupAds = (): void => {
  // AppLovinMAX.removeAllEventListeners();
  // AppLovinMAX.destroyBanner(BANNER_AD_UNIT_ID);
};
