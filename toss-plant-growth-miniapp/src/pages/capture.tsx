import {
  OpenCameraPermissionError,
  getOperationalEnvironment,
  loadFullScreenAd,
  openCamera,
  showFullScreenAd,
} from '@apps-in-toss/framework';
import { createRoute } from '@granite-js/react-native';
import { Button } from '@toss/tds-react-native';
import React from 'react';
import { Alert, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { captureCopy } from '../content/copy';
import {
  type PlantDetectionResult,
  detectPlantFromDataUri,
} from '../detection/plantDetector';
import { usePlantGrowth } from '../hooks/usePlantGrowth';
import { normalizeCapturedImage } from '../plants/image';
import { getDateKeyFromISO } from '../plants/store';
import { palette, radius, spacing, typography } from '../ui/theme';

type CaptureMode = 'baseline' | 'daily';

type CaptureRouteParams = {
  mode: CaptureMode;
  plantId?: string;
};

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

const CAPTURE_REWARD_AD_GROUP_ID = 'ait.dev.43daa14da3ae487b';
const IS_DEV_BUILD = typeof __DEV__ !== 'undefined' && __DEV__;

function confirmNonPlantSoftBlock(result: PlantDetectionResult) {
  const body =
    result.decision === 'reject'
      ? captureCopy.nonPlantBodyReject
      : captureCopy.nonPlantBodySuspect;

  return new Promise<boolean>((resolve) => {
    let isResolved = false;

    const finalize = (value: boolean) => {
      if (isResolved) {
        return;
      }

      isResolved = true;
      resolve(value);
    };

    Alert.alert(
      captureCopy.nonPlantTitle,
      body,
      [
        {
          text: captureCopy.ctaRetake,
          style: 'cancel',
          onPress: () => finalize(false),
        },
        {
          text: captureCopy.ctaSaveAnyway,
          onPress: () => finalize(true),
        },
      ],
      {
        cancelable: true,
        onDismiss: () => finalize(false),
      },
    );
  });
}

function Page() {
  const navigation = Route.useNavigation();
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
  const [isSandboxEnvironment, setIsSandboxEnvironment] = React.useState(false);
  const [statusMessage, setStatusMessage] = React.useState('');
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [requiresPermission, setRequiresPermission] = React.useState(false);
  const adUnregisterRef = React.useRef<(() => void) | null>(null);
  const rewardGrantedRef = React.useRef(false);

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

  const preloadCaptureAd = React.useCallback(() => {
    adUnregisterRef.current?.();
    adUnregisterRef.current = null;
    setIsAdLoaded(false);

    const supportsAd =
      CAPTURE_REWARD_AD_GROUP_ID.length > 0 &&
      loadFullScreenAd.isSupported() &&
      showFullScreenAd.isSupported();

    setIsAdSupported(supportsAd);

    if (!supportsAd) {
      setStatusMessage('');
      return;
    }

    adUnregisterRef.current = loadFullScreenAd({
      options: {
        adGroupId: CAPTURE_REWARD_AD_GROUP_ID,
      },
      onEvent: (event) => {
        if (event.type === 'loaded') {
          setIsAdLoaded(true);
        }
      },
      onError: (error) => {
        console.warn('[Capture] Failed to load reward ad:', error);
        setIsAdLoaded(false);
      },
    });
  }, []);

  React.useEffect(() => {
    try {
      setIsSandboxEnvironment(getOperationalEnvironment() === 'sandbox');
    } catch {
      setIsSandboxEnvironment(false);
    }
  }, []);

  React.useEffect(() => {
    preloadCaptureAd();

    return () => {
      adUnregisterRef.current?.();
      adUnregisterRef.current = null;
    };
  }, [preloadCaptureAd]);

  const commitCaptureAction = ({
    capturedAt,
    dataUri,
    mimeType,
  }: {
    capturedAt: string;
    dataUri: string;
    mimeType: string;
  }) => {
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
        return false;
      }
    } else {
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
        return false;
      }
    }

    unlockTodayReport(getDateKeyFromISO(capturedAt));
    return true;
  };

  const capturePhoto = async () => {
    if (isCapturing || isAdProcessing) {
      return;
    }

    if (isBaselineMode && !canAddPlant) {
      setErrorMessage(captureCopy.slotFull);
      return;
    }

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
          return;
        }

        setStatusMessage(captureCopy.nonPlantOverrideSaved);
      } else {
        setStatusMessage('');
      }

      if (!isAdSupported) {
        if (IS_DEV_BUILD || isSandboxEnvironment) {
          const committed = commitCaptureAction({
            capturedAt,
            dataUri: normalized.dataUri,
            mimeType: normalized.mimeType,
          });

          if (committed) {
            setStatusMessage(captureCopy.adBypassSaved);
            navigation.navigate('/compare');
          }
          return;
        }

        setErrorMessage(captureCopy.adUnsupportedRollback);
        return;
      }

      if (!isAdLoaded) {
        setErrorMessage(captureCopy.adNeedReady);
        preloadCaptureAd();
        return;
      }

      setIsAdProcessing(true);
      rewardGrantedRef.current = false;

      showFullScreenAd({
        options: {
          adGroupId: CAPTURE_REWARD_AD_GROUP_ID,
        },
        onEvent: (event) => {
          switch (event.type) {
            case 'requested':
              setStatusMessage(captureCopy.adRequested);
              break;
            case 'show':
              setStatusMessage(captureCopy.adShowing);
              break;
            case 'userEarnedReward': {
              rewardGrantedRef.current = true;
              const committed = commitCaptureAction({
                capturedAt,
                dataUri: normalized.dataUri,
                mimeType: normalized.mimeType,
              });

              if (committed) {
                navigation.navigate('/compare');
              }

              setIsAdProcessing(false);
              preloadCaptureAd();
              break;
            }
            case 'dismissed':
              if (!rewardGrantedRef.current) {
                setErrorMessage(captureCopy.adDismissedRollback);
              }
              setIsAdProcessing(false);
              preloadCaptureAd();
              break;
            case 'failedToShow':
              setErrorMessage(captureCopy.adFailedToShow);
              setIsAdProcessing(false);
              preloadCaptureAd();
              break;
            default:
              break;
          }
        },
        onError: (error) => {
          console.warn('[Capture] Failed to show reward ad:', error);
          setErrorMessage(captureCopy.adRuntimeError);
          setIsAdProcessing(false);
          preloadCaptureAd();
        },
      });
    } catch (error) {
      if (error instanceof OpenCameraPermissionError) {
        setRequiresPermission(true);
        setErrorMessage(captureCopy.permissionDenied);
      } else {
        setErrorMessage(captureCopy.captureFailed);
      }
    } finally {
      setIsCapturing(false);
    }
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
      <View style={styles.container}>
        <Text style={styles.title}>{pageTitle}</Text>
        <Text style={styles.subtitle}>{pageSubtitle}</Text>
        <View style={styles.targetBanner}>
          <Text style={styles.targetBannerTitle}>{targetBannerTitle}</Text>
          <Text style={styles.targetBannerBody}>{targetBannerBody}</Text>
        </View>

        {errorMessage != null ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        ) : null}

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
          <View style={styles.statusBox}>
            <Text style={styles.statusText}>{statusMessage}</Text>
          </View>
        ) : null}

        <Button
          type="dark"
          style="weak"
          size="medium"
          display="block"
          onPress={() => navigation.goBack()}
          disabled={isAdProcessing}
          viewStyle={styles.fullButton}
        >
          {captureCopy.ctaBack}
        </Button>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: palette.cream,
  },
  container: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
    gap: spacing.sm,
  },
  title: {
    fontSize: typography.title,
    fontWeight: '700',
    color: palette.textPrimary,
  },
  subtitle: {
    fontSize: typography.body,
    color: palette.textSecondary,
  },
  targetBanner: {
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: palette.leaf,
    backgroundColor: palette.leafSoft,
    paddingHorizontal: spacing.sm,
    paddingVertical: 10,
    gap: spacing.xxs,
  },
  targetBannerTitle: {
    fontSize: typography.body,
    fontWeight: '700',
    color: palette.leafStrong,
  },
  targetBannerBody: {
    fontSize: typography.caption,
    color: palette.textSecondary,
  },
  errorBox: {
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: palette.warnBorder,
    backgroundColor: palette.warnSoft,
  },
  errorText: {
    fontSize: typography.body,
    color: palette.dangerText,
  },
  statusBox: {
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.card,
  },
  statusText: {
    fontSize: typography.caption,
    color: palette.textSecondary,
  },
  fullButton: {
    width: '100%',
  },
});
