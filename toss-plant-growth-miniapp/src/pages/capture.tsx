import {
  OpenCameraPermissionError,
  loadFullScreenAd,
  openCamera,
  showFullScreenAd,
} from '@apps-in-toss/framework';
import { createRoute } from '@granite-js/react-native';
import {
  Button,
  List,
  ListRow,
  Text,
  colors,
  useDialog,
} from '@toss/tds-react-native';
import React from 'react';
import { SafeAreaView, ScrollView, StyleSheet } from 'react-native';
import {
  markRewardedAdShownForSlot,
  shouldShowRewardedAdForSlot,
} from '../ads/pacing';
import {
  getCaptureRewardedAdAvailability,
  showRewardedAdWithExplicitResult,
} from '../ads/service';
import { emitMiniappEvent } from '../analytics/events';
import { adGroupIds, adRuntime } from '../config/ads';
import { captureCopy } from '../content/copy';
import {
  type PlantDetectionResult,
  detectPlantFromDataUri,
} from '../detection/plantDetector';
import { usePlantGrowth } from '../hooks/usePlantGrowth';
import { normalizeCapturedImage } from '../plants/image';
import { getDateKeyFromISO } from '../plants/store';

type CaptureMode = 'baseline' | 'daily';

type CaptureRouteParams = {
  mode: CaptureMode;
  plantId?: string;
};

type CaptureCommitResult =
  | {
      ok: true;
      didOverwriteSameDay: boolean;
      slotKey: string;
      dateKey: string;
    }
  | { ok: false };

function parseCaptureParams(
  params: Readonly<object | undefined>,
): CaptureRouteParams {
  const candidate = params as { mode?: unknown; plantId?: unknown } | undefined;

  return {
    mode: candidate?.mode === 'baseline' ? 'baseline' : 'daily',
    plantId: typeof candidate?.plantId === 'string' ? candidate.plantId : '',
  };
}

export const Route = createRoute<CaptureRouteParams>('/capture', {
  component: Page,
  validateParams: parseCaptureParams,
});

const CAPTURE_REWARD_AD_GROUP_ID = adGroupIds.captureReward;
const IS_AD_REQUIRED = adRuntime.isRewardedAdRequired;
const IS_DEV_BUILD = typeof __DEV__ !== 'undefined' && __DEV__;
const CAPTURE_REWARDED_AD_REQUEST_TIMEOUT_MS = 15_000;

function nonPlantDescription(result: PlantDetectionResult) {
  return result.decision === 'reject'
    ? captureCopy.nonPlantBodyReject
    : captureCopy.nonPlantBodySuspect;
}

function Page() {
  const navigation = Route.useNavigation();
  const dialog = useDialog();
  const { mode, plantId } = Route.useParams();
  const {
    activePlant,
    addDailyPhoto,
    createBaseline,
    plants,
    canAddPlant,
    unlockTodayReport,
  } = usePlantGrowth();
  const [isCapturing, setIsCapturing] = React.useState(false);
  const [isAdProcessing, setIsAdProcessing] = React.useState(false);
  const [isAdSupported, setIsAdSupported] = React.useState(false);
  const [isAdLoaded, setIsAdLoaded] = React.useState(false);
  const [isPostCaptureStep, setIsPostCaptureStep] = React.useState(false);
  const [statusMessage, setStatusMessage] = React.useState('');
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [requiresPermission, setRequiresPermission] = React.useState(false);
  const adUnregisterRef = React.useRef<(() => void) | null>(null);
  const adPacingContextRef = React.useRef<{
    slotKey: string;
    dateKey: string;
  } | null>(null);

  const isBaselineMode = mode === 'baseline';
  const targetPlantId = (plantId ?? '').trim();

  const targetPlant = React.useMemo(() => {
    if (isBaselineMode) {
      return null;
    }

    if (targetPlantId.length > 0) {
      return plants.find((candidate) => candidate.id === targetPlantId) ?? null;
    }

    return activePlant ?? null;
  }, [activePlant, isBaselineMode, plants, targetPlantId]);

  const pageTitle = isBaselineMode
    ? captureCopy.baselineTitle
    : captureCopy.dailyTitle;
  const pageSubtitle = isBaselineMode
    ? captureCopy.baselineSubtitle
    : captureCopy.dailySubtitle(
        targetPlant?.name ?? activePlant?.name ?? '식물',
      );
  const targetBannerTitle = isBaselineMode
    ? captureCopy.targetBannerNewTitle
    : targetPlant != null
      ? captureCopy.targetBannerDailyTitle(targetPlant.name)
      : captureCopy.targetBannerMissingTitle;
  const targetBannerBody = isBaselineMode
    ? captureCopy.targetBannerNewBody
    : targetPlant != null
      ? captureCopy.targetBannerDailyBody
      : captureCopy.targetBannerMissingBody;
  const adAvailability = getCaptureRewardedAdAvailability({
    isAdRequired: IS_AD_REQUIRED,
    isAdSupported,
    isAdLoaded,
  });
  const canOfferRewardedAd = adAvailability === 'ad-ready';

  const emitCaptureEvent = React.useCallback(
    (
      name:
        | 'capture_post_step_entered'
        | 'capture_ad_ready_state'
        | 'capture_ad_watch_clicked'
        | 'capture_ad_show_requested'
        | 'capture_ad_show_success'
        | 'capture_ad_show_failed'
        | 'capture_ad_skip_clicked'
        | 'capture_ad_to_compare_navigated',
      params: Record<string, string | number | boolean | null | undefined> = {},
    ) => {
      emitMiniappEvent(name, {
        screen: 'capture',
        mode,
        ...params,
      });
    },
    [mode],
  );

  const preloadCaptureAd = React.useCallback(() => {
    adUnregisterRef.current?.();
    adUnregisterRef.current = null;
    setIsAdLoaded(false);

    if (!IS_AD_REQUIRED) {
      setIsAdSupported(false);
      setStatusMessage('');
      return;
    }

    const supportsAd =
      CAPTURE_REWARD_AD_GROUP_ID.length > 0 &&
      loadFullScreenAd.isSupported() &&
      showFullScreenAd.isSupported();

    setIsAdSupported(supportsAd);

    if (!supportsAd) {
      setStatusMessage('');
      return;
    }

    let unregisterLoad: (() => void) | null = null;

    const releaseLoadSubscription = () => {
      unregisterLoad?.();
      unregisterLoad = null;

      if (adUnregisterRef.current === releaseLoadSubscription) {
        adUnregisterRef.current = null;
      }
    };

    unregisterLoad = loadFullScreenAd({
      options: {
        adGroupId: CAPTURE_REWARD_AD_GROUP_ID,
      },
      onEvent: (event) => {
        if (event.type !== 'loaded') {
          return;
        }

        setIsAdLoaded(true);
        releaseLoadSubscription();
      },
      onError: (error) => {
        console.warn('[Capture] Failed to load reward ad:', error);
        setIsAdLoaded(false);
        releaseLoadSubscription();
      },
    });

    adUnregisterRef.current = releaseLoadSubscription;
  }, []);

  React.useEffect(() => {
    preloadCaptureAd();

    return () => {
      adUnregisterRef.current?.();
      adUnregisterRef.current = null;
    };
  }, [preloadCaptureAd]);

  const confirmNonPlantSoftBlock = React.useCallback(
    async (result: PlantDetectionResult) => {
      const isConfirmed = await dialog.openConfirm({
        title: captureCopy.nonPlantTitle,
        description: nonPlantDescription(result),
        leftButton: captureCopy.ctaRetake,
        rightButton: captureCopy.ctaSaveAnyway,
        closeOnDimmerClick: true,
      });

      return isConfirmed;
    },
    [dialog],
  );

  const commitCaptureAction = ({
    capturedAt,
    dataUri,
    mimeType,
  }: {
    capturedAt: string;
    dataUri: string;
    mimeType: string;
  }): CaptureCommitResult => {
    if (isBaselineMode) {
      const nextPlantNumber = plants.length + 1;
      const result = createBaseline({
        name: `식물 ${nextPlantNumber}`,
        dataUri,
        mimeType,
        capturedAt,
      });

      if (!result.ok) {
        setErrorMessage(captureCopy.slotFull);
        return { ok: false };
      }

      const dateKey = getDateKeyFromISO(capturedAt);
      unlockTodayReport(dateKey);

      return {
        ok: true,
        didOverwriteSameDay: false,
        slotKey: result.slotKey,
        dateKey,
      };
    }

    const dailyTargetPlantId =
      targetPlant != null
        ? targetPlant.id
        : targetPlantId.length > 0
          ? undefined
          : activePlant?.id;

    const nextState = addDailyPhoto({
      plantId: dailyTargetPlantId,
      dataUri,
      mimeType,
      capturedAt,
    });

    if (nextState == null) {
      setErrorMessage(captureCopy.plantNotFound);
      return { ok: false };
    }

    const dateKey = getDateKeyFromISO(capturedAt);
    unlockTodayReport(dateKey);

    return {
      ok: true,
      didOverwriteSameDay: nextState.didOverwriteSameDay,
      slotKey: nextState.slotKey,
      dateKey,
    };
  };

  const runCaptureFlow = async (): Promise<CaptureCommitResult> => {
    setIsCapturing(true);
    setErrorMessage(null);
    setStatusMessage('');
    setRequiresPermission(false);

    try {
      const response = await openCamera({
        base64: true,
        maxWidth: 720,
      });
      const normalized = normalizeCapturedImage(response.dataUri);
      const capturedAt = new Date().toISOString();

      setStatusMessage(captureCopy.detectingPlant);

      const detectionResult = await detectPlantFromDataUri({
        dataUri: normalized.dataUri,
        mimeType: normalized.mimeType,
      });

      if (IS_DEV_BUILD) {
        console.log('[Capture] detection result', detectionResult);
      }

      if (detectionResult.decision !== 'pass') {
        setStatusMessage('');

        const shouldSave = await confirmNonPlantSoftBlock(detectionResult);

        if (!shouldSave) {
          setErrorMessage(captureCopy.nonPlantCancelled);
          return { ok: false };
        }

        setStatusMessage(captureCopy.nonPlantOverrideSaved);
      } else {
        setStatusMessage('');
      }

      return commitCaptureAction({
        capturedAt,
        dataUri: normalized.dataUri,
        mimeType: normalized.mimeType,
      });
    } catch (error) {
      if (error instanceof OpenCameraPermissionError) {
        setRequiresPermission(true);
        setErrorMessage(captureCopy.permissionDenied);
      } else {
        setErrorMessage(captureCopy.captureFailed);
      }

      return { ok: false };
    } finally {
      setIsCapturing(false);
    }
  };

  const goToCompare = React.useCallback(
    (reason: string) => {
      emitCaptureEvent('capture_ad_to_compare_navigated', {
        reason,
      });
      setIsPostCaptureStep(false);
      setIsAdProcessing(false);
      setStatusMessage('');
      adPacingContextRef.current = null;
      navigation.navigate('/compare');
    },
    [emitCaptureEvent, navigation],
  );

  const handleWatchAdThenCompare = React.useCallback(async () => {
    if (isAdProcessing) {
      return;
    }

    emitCaptureEvent('capture_ad_watch_clicked', {
      ad_ready_state: canOfferRewardedAd ? 'ready' : 'not_ready',
    });

    if (!canOfferRewardedAd) {
      preloadCaptureAd();
      setErrorMessage(captureCopy.adNotReady);
      emitCaptureEvent('capture_ad_show_failed', {
        reason: 'ad_not_ready',
      });
      return;
    }

    setIsAdProcessing(true);
    setErrorMessage(null);
    let didMarkAdShown = false;

    const result = await showRewardedAdWithExplicitResult({
      adGroupId: CAPTURE_REWARD_AD_GROUP_ID,
      timeoutMs: CAPTURE_REWARDED_AD_REQUEST_TIMEOUT_MS,
      onTransition: (transition) => {
        switch (transition) {
          case 'ad-show-requested':
            setStatusMessage(captureCopy.adRequested);
            emitCaptureEvent('capture_ad_show_requested');
            break;
          case 'ad-showing':
            setStatusMessage(captureCopy.adShowing);
            emitCaptureEvent('capture_ad_show_success');

            if (!didMarkAdShown) {
              const context = adPacingContextRef.current;

              if (context != null) {
                didMarkAdShown = true;
                void markRewardedAdShownForSlot(
                  context.slotKey,
                  context.dateKey,
                );
              }
            }
            break;
          case 'ad-dismissed':
          case 'ad-failed-to-show':
            setStatusMessage('');
            break;
          default:
            break;
        }
      },
      onError: (error) => {
        console.warn('[Capture] Failed to show reward ad:', error);
      },
    });

    if (result === 'dismissed') {
      preloadCaptureAd();
      goToCompare('ad_dismissed');
      return;
    }

    setIsAdProcessing(false);
    setStatusMessage('');
    setErrorMessage(captureCopy.adFailedToShow);
    emitCaptureEvent('capture_ad_show_failed', {
      reason: 'failed_to_show',
    });
    preloadCaptureAd();
  }, [
    canOfferRewardedAd,
    emitCaptureEvent,
    goToCompare,
    isAdProcessing,
    preloadCaptureAd,
  ]);

  const handleSkipAdAndCompare = React.useCallback(() => {
    emitCaptureEvent('capture_ad_skip_clicked');
    goToCompare('ad_skip');
  }, [emitCaptureEvent, goToCompare]);

  const capturePhoto = async () => {
    if (isCapturing || isAdProcessing || isPostCaptureStep) {
      return;
    }

    if (isBaselineMode && !canAddPlant) {
      setErrorMessage(captureCopy.slotFull);
      return;
    }

    const commitResult = await runCaptureFlow();

    if (!commitResult.ok) {
      return;
    }

    if (!IS_AD_REQUIRED || commitResult.didOverwriteSameDay) {
      goToCompare(!IS_AD_REQUIRED ? 'ad_not_required' : 'same_day_overwrite');
      return;
    }

    const shouldShowAd = await shouldShowRewardedAdForSlot(
      commitResult.slotKey,
      commitResult.dateKey,
    );

    if (!shouldShowAd) {
      goToCompare('ad_pacing_bypass');
      return;
    }

    emitCaptureEvent('capture_post_step_entered', {
      slot_key: commitResult.slotKey,
      date_key: commitResult.dateKey,
    });
    emitCaptureEvent('capture_ad_ready_state', {
      ad_ready_state: canOfferRewardedAd ? 'ready' : 'not_ready',
    });
    adPacingContextRef.current = {
      slotKey: commitResult.slotKey,
      dateKey: commitResult.dateKey,
    };
    setStatusMessage('');
    setIsPostCaptureStep(true);
  };

  const reopenPermissionDialog = async () => {
    try {
      const status = await openCamera.openPermissionDialog();

      if (status === 'allowed') {
        setRequiresPermission(false);
        setErrorMessage(null);
      } else {
        setErrorMessage(captureCopy.permissionStillDenied);
      }
    } catch (error) {
      console.warn('[Capture] Failed to open permission dialog:', error);
      setErrorMessage(captureCopy.permissionDialogFailed);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.screen}
        contentContainerStyle={styles.container}
      >
        <Text typography="t3" fontWeight="bold">
          {pageTitle}
        </Text>
        <Text typography="t6" color={colors.grey600}>
          {pageSubtitle}
        </Text>

        <List style={styles.panel} rowSeparator="none">
          <ListRow
            contents={
              <ListRow.Texts
                type="2RowTypeA"
                top={targetBannerTitle}
                bottom={targetBannerBody}
              />
            }
          />
        </List>

        {errorMessage != null ? (
          <List style={[styles.panel, styles.errorPanel]} rowSeparator="none">
            <ListRow
              contents={
                <ListRow.Texts
                  type="2RowTypeA"
                  top="안내"
                  bottom={errorMessage}
                />
              }
            />
          </List>
        ) : null}

        {isPostCaptureStep ? (
          <>
            <List style={styles.panel} rowSeparator="none">
              <ListRow
                contents={
                  <ListRow.Texts
                    type="2RowTypeA"
                    top={captureCopy.postCaptureTitle}
                    bottom={
                      canOfferRewardedAd
                        ? captureCopy.postCaptureBody
                        : captureCopy.postCaptureBodyNoAd
                    }
                  />
                }
              />
            </List>
            {canOfferRewardedAd ? (
              <>
                <Button
                  size="medium"
                  display="block"
                  onPress={handleWatchAdThenCompare}
                  disabled={isAdProcessing}
                  viewStyle={styles.fullButton}
                >
                  {isAdProcessing
                    ? captureCopy.ctaAdProcessing
                    : captureCopy.ctaWatchAdThenCompare}
                </Button>
                <Button
                  type="dark"
                  style="weak"
                  size="medium"
                  display="block"
                  onPress={handleSkipAdAndCompare}
                  disabled={isAdProcessing}
                  viewStyle={styles.fullButton}
                >
                  {captureCopy.ctaSkipAdAndCompare}
                </Button>
              </>
            ) : (
              <Button
                size="medium"
                display="block"
                onPress={handleSkipAdAndCompare}
                disabled={isAdProcessing}
                viewStyle={styles.fullButton}
              >
                {captureCopy.ctaSkipAdAndCompare}
              </Button>
            )}
          </>
        ) : (
          <>
            <Button
              size="medium"
              display="block"
              onPress={capturePhoto}
              disabled={isCapturing || isAdProcessing}
              viewStyle={styles.fullButton}
            >
              {isCapturing
                ? captureCopy.ctaCapturing
                : isAdProcessing
                  ? captureCopy.ctaAdProcessing
                  : captureCopy.ctaCapture}
            </Button>

            {isAdSupported && !isAdLoaded && !isCapturing && !isAdProcessing ? (
              <Button
                type="dark"
                style="weak"
                size="medium"
                display="block"
                onPress={preloadCaptureAd}
                viewStyle={styles.fullButton}
              >
                {captureCopy.ctaReloadAd}
              </Button>
            ) : null}
          </>
        )}

        {requiresPermission ? (
          <Button
            type="dark"
            style="weak"
            size="medium"
            display="block"
            onPress={reopenPermissionDialog}
            viewStyle={styles.fullButton}
          >
            {captureCopy.ctaPermission}
          </Button>
        ) : null}

        {statusMessage.length > 0 ? (
          <List style={styles.panel} rowSeparator="none">
            <ListRow
              contents={<ListRow.Texts type="1RowTypeA" top={statusMessage} />}
            />
          </List>
        ) : null}

        <Button
          type="dark"
          style="weak"
          size="medium"
          display="block"
          onPress={() => navigation.goBack()}
          disabled={isAdProcessing || isPostCaptureStep}
          viewStyle={styles.fullButton}
        >
          {captureCopy.ctaBack}
        </Button>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  screen: {
    flex: 1,
  },
  container: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    gap: 12,
  },
  panel: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.grey200,
    backgroundColor: colors.background,
    overflow: 'hidden',
  },
  errorPanel: {
    borderColor: colors.red200,
    backgroundColor: colors.red50,
  },
  fullButton: {
    width: '100%',
  },
});
