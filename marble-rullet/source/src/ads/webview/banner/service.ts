import { getOperationalEnvironment, getTossAppVersion, TossAds } from '@apps-in-toss/web-framework';
import { bannerAdRuntime, resolveBannerAdGroupConfig } from '../../../config/ads';
import type { AppScreen, BannerAdController, BannerAdElements, BannerAdTrack } from './types';

type BannerAdSlotHandle = {
  destroy: () => void;
};

type BannerAdState = {
  enabled: boolean;
  isInitialized: boolean;
  initRequested: boolean;
  initFailed: boolean;
  mountFrame: number;
  slot: BannerAdSlotHandle | null;
};

function hasNativeConstantHandler(method: string) {
  if (typeof window === 'undefined') {
    return false;
  }

  const constantHandlerMap = (
    window as Window & {
      __CONSTANT_HANDLER_MAP?: Record<string, unknown>;
    }
  ).__CONSTANT_HANDLER_MAP;

  return Boolean(constantHandlerMap && method in constantHandlerMap);
}

function canUseTossAdsBridge() {
  if (typeof window === 'undefined') {
    return false;
  }

  const nativeWindow = window as Window & {
    ReactNativeWebView?: { postMessage?: (message: string) => void };
  };

  if (typeof nativeWindow.ReactNativeWebView?.postMessage !== 'function') {
    return false;
  }

  return bannerAdRuntime.requiredConstantHandlers.every((method) => hasNativeConstantHandler(method));
}

function parseVersion(version: string) {
  return version
    .split('.')
    .slice(0, 3)
    .map((part) => Number.parseInt(part, 10) || 0);
}

function isVersionAtLeast(currentVersion: string, minVersion: string) {
  const current = parseVersion(currentVersion);
  const minimum = parseVersion(minVersion);
  const length = Math.max(current.length, minimum.length, 3);

  for (let index = 0; index < length; index += 1) {
    const currentPart = current[index] ?? 0;
    const minimumPart = minimum[index] ?? 0;

    if (currentPart > minimumPart) return true;
    if (currentPart < minimumPart) return false;
  }

  return true;
}

function isBannerAdSupported() {
  if (!canUseTossAdsBridge()) {
    return false;
  }

  if (getOperationalEnvironment() !== 'toss') {
    return false;
  }

  if (!TossAds.initialize.isSupported() || !TossAds.attachBanner.isSupported()) {
    return false;
  }

  return isVersionAtLeast(getTossAppVersion(), bannerAdRuntime.minTossAppVersion);
}

function setBannerVisibility(section: HTMLElement, visible: boolean) {
  section.classList.toggle('is-hidden', !visible);
  section.setAttribute('aria-hidden', visible ? 'false' : 'true');
}

export function createWebviewBannerAdController({
  elements,
  track,
}: {
  elements: BannerAdElements;
  track: BannerAdTrack;
}): BannerAdController {
  const state: BannerAdState = {
    enabled: false,
    isInitialized: false,
    initRequested: false,
    initFailed: false,
    mountFrame: 0,
    slot: null,
  };

  const cancelMount = () => {
    if (state.mountFrame) {
      window.cancelAnimationFrame(state.mountFrame);
      state.mountFrame = 0;
    }
  };

  const destroySlot = () => {
    cancelMount();
    state.slot?.destroy();
    state.slot = null;
    elements.slot.innerHTML = '';
    setBannerVisibility(elements.section, false);
  };

  const mountBanner = () => {
    destroySlot();

    if (!state.enabled || state.initFailed || !state.isInitialized) {
      return;
    }

    try {
      const bannerAdConfig = resolveBannerAdGroupConfig();
      console.info('[banner-ad] attach', {
        env: bannerAdConfig.adEnv,
        adGroupId: bannerAdConfig.adGroupId,
        resolution: bannerAdConfig.source,
      });

      state.slot = TossAds.attachBanner(bannerAdConfig.adGroupId, elements.slot, {
        theme: 'auto',
        tone: 'grey',
        variant: 'card',
        callbacks: {
          onAdRendered: (payload) => {
            setBannerVisibility(elements.section, true);
            track('banner_ad_rendered', {
              ad_group_id: payload.adGroupId,
              slot_id: payload.slotId,
              creative_id: payload.adMetadata.creativeId,
            });
          },
          onAdViewable: (payload) => {
            track('banner_ad_viewable', {
              ad_group_id: payload.adGroupId,
              slot_id: payload.slotId,
              request_id: payload.adMetadata.requestId,
            });
          },
          onAdImpression: (payload) => {
            track('banner_ad_impression', {
              ad_group_id: payload.adGroupId,
              slot_id: payload.slotId,
              request_id: payload.adMetadata.requestId,
            });
          },
          onAdClicked: (payload) => {
            track('banner_ad_clicked', {
              ad_group_id: payload.adGroupId,
              slot_id: payload.slotId,
              request_id: payload.adMetadata.requestId,
            });
          },
          onNoFill: (payload) => {
            destroySlot();
            track('banner_ad_no_fill', {
              ad_group_id: payload.adGroupId,
              slot_id: payload.slotId,
            });
          },
          onAdFailedToRender: (payload) => {
            destroySlot();
            track('banner_ad_render_failed', {
              ad_group_id: payload.adGroupId,
              slot_id: payload.slotId,
              error_code: payload.error.code,
            });
          },
        },
      });
    } catch (error) {
      destroySlot();
      console.error('배너 광고를 붙이지 못했어요.', error);
    }
  };

  const scheduleComposeMount = () => {
    cancelMount();

    state.mountFrame = window.requestAnimationFrame(() => {
      state.mountFrame = 0;

      if (!elements.body.classList.contains('mode-compose')) {
        return;
      }

      mountBanner();
    });
  };

  return {
    initialize() {
      if (state.initRequested) {
        return;
      }

      state.initRequested = true;
      state.enabled = isBannerAdSupported();

      if (!state.enabled) {
        return;
      }

      try {
        const bannerAdConfig = resolveBannerAdGroupConfig();
        console.info('[banner-ad] initialize', {
          env: bannerAdConfig.adEnv,
          adGroupId: bannerAdConfig.adGroupId,
          resolution: bannerAdConfig.source,
        });

        TossAds.initialize({
          callbacks: {
            onInitialized: () => {
              state.isInitialized = true;
              console.info('[banner-ad] sdk initialized');

              if (elements.body.classList.contains('mode-compose')) {
                scheduleComposeMount();
              }
            },
            onInitializationFailed: (error) => {
              state.initFailed = true;
              console.error('배너 광고 SDK 초기화에 실패했어요.', error);
            },
          },
        });
      } catch (error) {
        state.initFailed = true;
        console.error('배너 광고 SDK 초기화를 시작하지 못했어요.', error);
      }
    },
    onScreenChange(screen: AppScreen) {
      if (screen === 'compose') {
        scheduleComposeMount();
        return;
      }

      destroySlot();
    },
    destroy() {
      destroySlot();
    },
  };
}
