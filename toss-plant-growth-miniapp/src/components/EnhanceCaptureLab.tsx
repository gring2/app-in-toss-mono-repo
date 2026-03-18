import { OpenCameraPermissionError, openCamera } from '@apps-in-toss/framework';
import { Button, List, ListRow, Text, colors } from '@toss/tds-react-native';
import React from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { emitMiniappEvent } from '../analytics/events';
import {
  MACRO_ENHANCEMENT_VERSION,
  enhanceMacroPhoto,
} from '../camera/enhancement';
import { getCameraPresetById } from '../camera/presets';
import { prepareImageForProcessing } from '../camera/processingImage';
import type { CaptureQualityScore } from '../camera/quality';
import { scoreCaptureQuality } from '../camera/quality';
import type { PlantDetectionResult } from '../detection/plantDetector';
import { detectPlantFromDataUri } from '../detection/plantDetector';
import { usePlantGrowth } from '../hooks/usePlantGrowth';
import { normalizeCapturedImage, toDisplayImageUri } from '../plants/image';
import type { CameraPermissionState } from './captureExperienceCopy';
import {
  formatQualityReasons,
  getCameraPermissionCopy,
  getRecommendationLabel,
} from './captureExperienceCopy';

type CapturedImage = {
  dataUri: string;
  mimeType: string;
};

type CaptureAnalysis = {
  quality: CaptureQualityScore;
  detection: PlantDetectionResult;
  sourceMimeType: string;
  normalized: boolean;
};

function buildEnhancementFailureMessage({
  sourceMimeType,
  normalized,
  failureStage,
}: {
  sourceMimeType: string;
  normalized: boolean;
  failureStage:
    | 'input_base64'
    | 'decode'
    | 'transform'
    | 'encode_runtime'
    | 'encode'
    | null;
}) {
  if (failureStage === 'encode_runtime') {
    return '필터 엔진을 이 런타임에서 초기화하지 못해 원본 미리보기로 보여드려요.';
  }

  if (failureStage === 'encode') {
    return '필터 이미지를 만드는 중 문제가 생겨 원본 미리보기로 보여드려요.';
  }

  if (failureStage === 'decode') {
    return normalized
      ? `${sourceMimeType} 사진을 JPEG로 바꾼 뒤 다시 읽지 못해 원본 미리보기로 보여드려요.`
      : '촬영한 JPEG를 다시 읽지 못해 원본 미리보기로 보여드려요.';
  }

  if (failureStage === 'input_base64') {
    return '촬영 결과를 읽지 못해 원본 미리보기로 보여드려요.';
  }

  return '필터 처리에 실패해 원본 미리보기로 보여드려요.';
}

function buildUnsupportedFormatMessage(mimeType: string) {
  if (mimeType === 'image/heic' || mimeType === 'image/heif') {
    return 'HEIC/HEIF 사진은 빠른 필터 미리보기 보장 대상이 아니라 이번에는 원본 미리보기로 먼저 보여드려요. iPhone 카메라를 높은 호환성(JPEG)으로 바꾸면 다음 촬영부터 더 안정적으로 빨라져요.';
  }

  if (mimeType === 'image/webp') {
    return 'WebP 촬영 결과라 현재 빠른 필터 미리보기를 지원하지 못해 원본 미리보기로 먼저 보여드려요.';
  }

  if (mimeType === 'image/png' || mimeType === 'image/avif') {
    return `현재 촬영 결과(${mimeType})는 빠른 필터 미리보기 보장 대상이 아니라 원본 미리보기로 먼저 보여드려요.`;
  }

  return `현재 촬영 결과(${mimeType})는 필터 엔진에서 아직 지원하지 않아 원본 미리보기로 먼저 보여드려요.`;
}

function buildFilterPreviewLoadingMessage(mimeType: string) {
  if (mimeType === 'image/jpeg' || mimeType === 'image/jpg') {
    return 'JPEG(높은 호환성) 사진이라 필터 미리보기를 준비 중이에요. 보통 5초 안에 끝나요...';
  }

  return '원본 미리보기를 먼저 준비하고 있어요...';
}

function buildGuidanceSummary({
  detectionDecision,
  qualityReasons,
  recommendation,
}: {
  detectionDecision: 'pass' | 'suspect' | 'reject';
  qualityReasons: string[];
  recommendation: 'good' | 'retake_recommended' | 'retake_strongly_recommended';
}) {
  if (detectionDecision === 'reject') {
    return '식물이 너무 작거나 배경이 많아요. 잎이나 줄기를 화면 중앙에 더 크게 담아 다시 찍어보세요.';
  }

  const tips: string[] = [];

  if (qualityReasons.includes('plant_too_small')) {
    tips.push('식물을 더 가까이 담기');
  }

  if (qualityReasons.includes('blurry')) {
    tips.push('손떨림 줄이기');
  }

  if (qualityReasons.includes('low_light')) {
    tips.push('밝은 곳으로 이동하기');
  }

  if (qualityReasons.includes('overexposed')) {
    tips.push('직사광 피하기');
  }

  if (recommendation === 'good') {
    return '좋아요. 지금 사진은 식물 상태를 기록하기에 충분히 또렷해요.';
  }

  if (tips.length === 0) {
    return '조금 더 가까이 식물 중심으로 다시 찍으면 미리보기가 더 좋아져요.';
  }

  return `다시 촬영을 추천해요: ${tips.join(' · ')}`;
}

function getDetectionSummary(detection: PlantDetectionResult) {
  if (detection.decision === 'pass') {
    return `식물 인식 ${Math.round(detection.confidence * 100)}점 · 식물 사진으로 안정적으로 인식했어요.`;
  }

  if (detection.decision === 'suspect') {
    return `식물 인식 ${Math.round(detection.confidence * 100)}점 · 잎이나 줄기를 더 크게 담으면 더 정확해져요.`;
  }

  return `식물 인식 ${Math.round(detection.confidence * 100)}점 · 배경보다 식물 본체를 더 크게 담아주세요.`;
}

export function EnhanceCaptureLab({
  screenName = 'capture',
}: {
  screenName?: 'home' | 'capture';
}) {
  const singleCameraPreset = React.useMemo(
    () => getCameraPresetById('detail'),
    [],
  );
  const { isReady, activePlant, addDailyPhoto, createBaseline } =
    usePlantGrowth();
  const [permissionStatus, setPermissionStatus] =
    React.useState<CameraPermissionState>('checking');
  const [isPermissionActionRunning, setIsPermissionActionRunning] =
    React.useState(false);
  const [isRunning, setIsRunning] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [statusMessage, setStatusMessage] = React.useState('');
  const [saveMessage, setSaveMessage] = React.useState<string | null>(null);
  const [guidanceSummary, setGuidanceSummary] = React.useState<string | null>(
    null,
  );
  const [captureAnalysis, setCaptureAnalysis] =
    React.useState<CaptureAnalysis | null>(null);
  const [originalImage, setOriginalImage] =
    React.useState<CapturedImage | null>(null);
  const [enhancedImage, setEnhancedImage] =
    React.useState<CapturedImage | null>(null);
  const [isEnhancementApplied, setIsEnhancementApplied] = React.useState(false);
  const [viewMode, setViewMode] = React.useState<'enhanced' | 'original'>(
    'enhanced',
  );
  const [processingDurationMs, setProcessingDurationMs] = React.useState<
    number | null
  >(null);

  const permissionCopy = getCameraPermissionCopy(permissionStatus);
  const isBusy = isRunning || isPermissionActionRunning || isSaving;
  const visibleImage =
    viewMode === 'original' && originalImage != null
      ? originalImage
      : isEnhancementApplied
        ? (enhancedImage ?? originalImage)
        : originalImage;

  const refreshPermissionStatus = React.useCallback(
    async (showStatus = true) => {
      if (showStatus) {
        setStatusMessage('카메라 권한을 확인하는 중이에요...');
      }

      try {
        const nextStatus = await openCamera.getPermission();
        setPermissionStatus(nextStatus);

        if (showStatus) {
          setStatusMessage(
            nextStatus === 'allowed'
              ? '식물 카메라 준비가 끝났어요.'
              : '촬영 전에 카메라 권한만 확인하면 돼요.',
          );
        }
      } catch {
        setPermissionStatus('notDetermined');

        if (showStatus) {
          setStatusMessage('카메라 권한 상태를 다시 확인해주세요.');
        }
      }
    },
    [],
  );

  React.useEffect(() => {
    void refreshPermissionStatus();
  }, [refreshPermissionStatus]);

  const requestCameraPermission = React.useCallback(async () => {
    if (isPermissionActionRunning) {
      return false;
    }

    setIsPermissionActionRunning(true);
    setErrorMessage(null);
    setStatusMessage('카메라 권한을 요청하는 중이에요...');

    try {
      const nextStatus = await openCamera.openPermissionDialog();
      setPermissionStatus(nextStatus);
      setStatusMessage(
        nextStatus === 'allowed'
          ? '권한이 허용됐어요. 이제 촬영할 수 있어요.'
          : '권한이 아직 허용되지 않았어요. 허용 후 다시 시도해주세요.',
      );
      return nextStatus === 'allowed';
    } catch {
      setErrorMessage('카메라 권한 요청에 실패했어요. 다시 시도해주세요.');
      setStatusMessage('');
      return false;
    } finally {
      setIsPermissionActionRunning(false);
    }
  }, [isPermissionActionRunning]);

  const saveCurrentPhoto = React.useCallback(async () => {
    if (originalImage == null || isSaving) {
      return;
    }

    const savedImage =
      isEnhancementApplied && enhancedImage != null
        ? enhancedImage
        : originalImage;

    setIsSaving(true);
    setErrorMessage(null);
    setSaveMessage(null);
    setStatusMessage('오늘 식물 기록을 저장하는 중이에요...');
    emitMiniappEvent('capture_save_started', {
      active_plant_exists: activePlant != null,
      enhancement_applied: isEnhancementApplied,
    });

    try {
      if (activePlant == null) {
        const created = createBaseline({
          dataUri: savedImage.dataUri,
          mimeType: savedImage.mimeType,
          sourceDataUri: originalImage.dataUri,
          sourceMimeType: originalImage.mimeType,
          enhancementVersion: isEnhancementApplied
            ? MACRO_ENHANCEMENT_VERSION
            : undefined,
          enhancementStatus: isEnhancementApplied ? 'enhanced' : 'raw_fallback',
        });

        if (!created?.ok) {
          throw new Error('baseline_create_failed');
        }

        setSaveMessage(
          '첫 식물 기록을 저장했어요. 다음부터는 같은 흐름으로 바로 기록할 수 있어요.',
        );
        setStatusMessage('저장이 완료됐어요.');
        emitMiniappEvent('capture_save_completed', {
          created_baseline: true,
          slot_key: created.slotKey,
        });
        return;
      }

      const saved = addDailyPhoto({
        dataUri: savedImage.dataUri,
        mimeType: savedImage.mimeType,
        sourceDataUri: originalImage.dataUri,
        sourceMimeType: originalImage.mimeType,
        enhancementVersion: isEnhancementApplied
          ? MACRO_ENHANCEMENT_VERSION
          : undefined,
        enhancementStatus: isEnhancementApplied ? 'enhanced' : 'raw_fallback',
      });

      if (saved == null) {
        throw new Error('save_failed');
      }

      setSaveMessage(
        saved.didOverwriteSameDay
          ? '오늘 기록을 새 사진으로 덮어써 저장했어요.'
          : '오늘 식물 기록을 저장했어요.',
      );
      setStatusMessage('저장이 완료됐어요.');
      emitMiniappEvent('capture_save_completed', {
        created_baseline: false,
        slot_key: saved.slotKey,
        did_overwrite_same_day: saved.didOverwriteSameDay,
      });
    } catch (error) {
      setErrorMessage('저장에 실패했어요. 잠시 후 다시 시도해주세요.');
      setStatusMessage('');
      emitMiniappEvent('capture_save_failed', {
        reason: error instanceof Error ? error.message : 'unknown',
      });
    } finally {
      setIsSaving(false);
    }
  }, [
    activePlant,
    addDailyPhoto,
    createBaseline,
    enhancedImage,
    isEnhancementApplied,
    isSaving,
    originalImage,
  ]);

  const captureAndEnhance = React.useCallback(async () => {
    if (isRunning || isPermissionActionRunning || isSaving) {
      return;
    }

    if (permissionStatus !== 'allowed') {
      await requestCameraPermission();
      return;
    }

    setIsRunning(true);
    setErrorMessage(null);
    setSaveMessage(null);
    setStatusMessage('사진을 촬영하는 중이에요...');
    setGuidanceSummary(null);
    setCaptureAnalysis(null);
    setProcessingDurationMs(null);
    setIsEnhancementApplied(false);
    emitMiniappEvent('capture_camera_open_requested', {
      screen: screenName,
      route_target: activePlant == null ? 'baseline_create' : 'daily_photo',
    });

    try {
      const captured = await openCamera({
        base64: true,
        maxWidth: 1280,
      });
      emitMiniappEvent('capture_camera_open_success', {
        screen: screenName,
      });

      const processingStartedAt = Date.now();
      const normalized = normalizeCapturedImage(captured.dataUri);
      const preparedImage = await prepareImageForProcessing({
        dataUri: normalized.dataUri,
        mimeType: normalized.mimeType,
      });
      setOriginalImage(preparedImage.previewImage);
      setEnhancedImage(preparedImage.previewImage);
      setViewMode('enhanced');

      if (preparedImage.processingImage == null) {
        const fallbackDurationMs = Date.now() - processingStartedAt;
        setGuidanceSummary(
          buildUnsupportedFormatMessage(preparedImage.sourceMimeType),
        );
        setIsEnhancementApplied(false);
        setProcessingDurationMs(fallbackDurationMs);
        setStatusMessage(
          '원본 미리보기를 먼저 보여드려요. 저장하거나 다시 찍을 수 있어요.',
        );
        emitMiniappEvent('capture_filter_preview_fallback', {
          processing_ms: fallbackDurationMs,
          source_mime_type: preparedImage.sourceMimeType,
          normalization_reason: preparedImage.normalizationReason,
          preview_mode: 'original_fallback',
          sla_target: 'jpeg_high_compatibility_only',
        });
        return;
      }

      setStatusMessage(
        buildFilterPreviewLoadingMessage(
          preparedImage.processingImage.mimeType,
        ),
      );

      const detection = await detectPlantFromDataUri({
        dataUri: preparedImage.processingImage.dataUri,
        mimeType: preparedImage.processingImage.mimeType,
      });

      const quality = scoreCaptureQuality({
        dataUri: preparedImage.processingImage.dataUri,
        mimeType: preparedImage.processingImage.mimeType,
      });
      setCaptureAnalysis({
        quality,
        detection,
        sourceMimeType: preparedImage.sourceMimeType,
        normalized: preparedImage.normalized,
      });
      emitMiniappEvent('capture_quality_scored', {
        score: quality.score,
        sharpness: quality.sharpness,
        plant_subject: quality.plantSubject,
        recommendation: quality.recommendation,
        detection_decision: detection.decision,
      });

      if (quality.recommendation !== 'good' || detection.decision !== 'pass') {
        emitMiniappEvent('capture_quality_retake_prompted', {
          recommendation: quality.recommendation,
          detection_decision: detection.decision,
          reasons: quality.reasons.join(','),
        });
      }

      setGuidanceSummary(
        buildGuidanceSummary({
          detectionDecision: detection.decision,
          qualityReasons: quality.reasons,
          recommendation: quality.recommendation,
        }),
      );

      const enhanced = enhanceMacroPhoto({
        dataUri: preparedImage.processingImage.dataUri,
        mimeType: preparedImage.processingImage.mimeType,
        quality,
        profile: 'light',
      });

      if (enhanced.applied) {
        setEnhancedImage({
          dataUri: enhanced.dataUri,
          mimeType: enhanced.mimeType,
        });
        setIsEnhancementApplied(true);
        emitMiniappEvent('capture_enhancement_applied', {
          enhancement_version: enhanced.enhancementVersion,
          profile: 'light',
        });
      } else {
        setEnhancedImage(preparedImage.previewImage);
        setIsEnhancementApplied(false);
        setStatusMessage(
          buildEnhancementFailureMessage({
            sourceMimeType: preparedImage.sourceMimeType,
            normalized: preparedImage.normalized,
            failureStage: enhanced.debug.failureStage,
          }),
        );
      }

      const totalProcessingMs = Date.now() - processingStartedAt;
      setProcessingDurationMs(totalProcessingMs);
      setStatusMessage(
        totalProcessingMs <= 5000
          ? '필터 미리보기가 준비됐어요. 저장하거나 다시 찍어보세요.'
          : '미리보기를 준비했어요. 조금 오래 걸렸다면 다시 찍을 때 더 밝고 가까운 구도를 추천해요.',
      );
      emitMiniappEvent('capture_filter_preview_ready', {
        processing_ms: totalProcessingMs,
        enhancement_applied: enhanced.applied,
        source_mime_type: preparedImage.sourceMimeType,
        normalization_reason: preparedImage.normalizationReason,
        processing_profile: 'light',
        preview_mode: enhanced.applied ? 'filtered' : 'original_fallback',
        sla_target: 'jpeg_high_compatibility_only',
      });
    } catch (error) {
      if (error instanceof OpenCameraPermissionError) {
        setPermissionStatus('denied');
        setErrorMessage(
          '카메라 권한이 없어요. 권한을 허용한 뒤 다시 시도해주세요.',
        );
        emitMiniappEvent('capture_camera_open_failed', {
          reason: 'permission_denied',
          screen: screenName,
        });
      } else {
        setErrorMessage(
          '촬영 또는 미리보기 준비에 실패했어요. 다시 시도해주세요.',
        );
        emitMiniappEvent('capture_camera_open_failed', {
          reason: error instanceof Error ? error.message : 'unknown',
          screen: screenName,
        });
      }
      setStatusMessage('');
    } finally {
      setIsRunning(false);
    }
  }, [
    activePlant,
    isPermissionActionRunning,
    isRunning,
    isSaving,
    permissionStatus,
    requestCameraPermission,
    screenName,
  ]);

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.heroCard,
          { backgroundColor: `${singleCameraPreset.accentColor}14` },
        ]}
      >
        <Text typography="t3" fontWeight="bold">
          식물 카메라
        </Text>
        <Text typography="t6" color={colors.grey700}>
          한 번 촬영하면 식물 필터 미리보기를 빠르게 보여드려요. 마음에 들면
          저장하고, 아니면 바로 다시 찍을 수 있어요.
        </Text>
        <Text typography="t7" color={colors.grey600}>
          iPhone에서 높은 호환성(JPEG)으로 촬영하면 5초 안쪽의 빠른 필터
          미리보기가 더 안정적이에요. HEIC/HEIF는 원본 미리보기로 먼저
          보여드려요.
        </Text>
      </View>

      {!isReady ? (
        <List style={styles.panel} rowSeparator="none">
          <ListRow
            contents={
              <ListRow.Texts
                type="2RowTypeA"
                top="기록을 불러오는 중이에요"
                bottom="식물 상태와 오늘 기록 대상을 확인하고 있어요."
              />
            }
          />
        </List>
      ) : null}

      <View style={styles.cameraShell}>
        <View style={styles.cameraShellHeader}>
          <Text typography="t6" fontWeight="bold">
            식물을 크게 담아보세요
          </Text>
          <View
            style={[
              styles.filterBadge,
              { backgroundColor: `${singleCameraPreset.accentColor}1A` },
            ]}
          >
            <Text
              typography="t7"
              fontWeight="medium"
              style={{ color: singleCameraPreset.accentColor }}
            >
              {singleCameraPreset.filterLabel}
            </Text>
          </View>
        </View>

        <View style={styles.cameraCanvas}>
          <View
            style={[
              styles.frameCorner,
              styles.frameCornerTopLeft,
              { borderColor: singleCameraPreset.accentColor },
            ]}
          />
          <View
            style={[
              styles.frameCorner,
              styles.frameCornerTopRight,
              { borderColor: singleCameraPreset.accentColor },
            ]}
          />
          <View
            style={[
              styles.frameCorner,
              styles.frameCornerBottomLeft,
              { borderColor: singleCameraPreset.accentColor },
            ]}
          />
          <View
            style={[
              styles.frameCorner,
              styles.frameCornerBottomRight,
              { borderColor: singleCameraPreset.accentColor },
            ]}
          />
          <View
            style={[
              styles.focusRing,
              { borderColor: `${singleCameraPreset.accentColor}80` },
            ]}
          />
          <View style={styles.shellCopyBlock}>
            <Text typography="t6" fontWeight="bold" color="#FFFFFF">
              잎과 줄기를 화면 가운데 크게
            </Text>
            <Text typography="t7" color="#F3F4F6">
              배경보다 식물이 더 크게 보이면 필터 미리보기가 안정적으로 나와요.
            </Text>
            <Text typography="t7" color="#E5E7EB">
              촬영 후 빠르게 필터 미리보기를 만들고 저장 여부만 결정하면 돼요.
            </Text>
          </View>
        </View>
      </View>

      <List style={styles.panel} rowSeparator="none">
        <ListRow
          contents={
            <ListRow.Texts
              type="2RowTypeA"
              top={permissionCopy.title}
              bottom={permissionCopy.body}
            />
          }
        />
        <ListRow
          contents={
            <ListRow.Texts
              type="2RowTypeA"
              top={
                activePlant != null
                  ? `현재 기록 대상 · ${activePlant.name}`
                  : '기록 대상이 아직 없어요'
              }
              bottom={
                activePlant != null
                  ? '지금 저장하면 오늘 사진으로 기록을 업데이트해요.'
                  : '첫 저장 시 기본 이름으로 식물 기록을 자동 생성해요.'
              }
            />
          }
        />
      </List>

      <View style={styles.actionRow}>
        <Button
          size="medium"
          display="block"
          onPress={() => {
            void captureAndEnhance();
          }}
          disabled={!isReady || permissionStatus === 'checking' || isBusy}
          viewStyle={styles.actionButton}
        >
          {isBusy
            ? '처리 중...'
            : permissionStatus === 'allowed'
              ? '식물 사진 촬영하기'
              : permissionCopy.actionLabel}
        </Button>
        <Button
          type="dark"
          style="weak"
          size="medium"
          display="block"
          onPress={() => {
            void refreshPermissionStatus();
          }}
          disabled={isBusy}
          viewStyle={styles.actionButton}
        >
          권한 다시 확인
        </Button>
      </View>

      {statusMessage.length > 0 ? (
        <List style={styles.panel} rowSeparator="none">
          <ListRow
            contents={<ListRow.Texts type="1RowTypeA" top={statusMessage} />}
          />
        </List>
      ) : null}

      {originalImage == null && !isBusy ? (
        <List style={styles.panel} rowSeparator="none">
          <ListRow
            contents={
              <ListRow.Texts
                type="3RowTypeA"
                top="아직 미리보기가 없어요"
                middle="식물을 한 장 촬영하면 필터 미리보기를 바로 보여드려요."
                bottom="미리보기를 본 뒤 저장할지 다시 찍을지 바로 결정할 수 있어요."
              />
            }
          />
        </List>
      ) : null}

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

      {captureAnalysis != null ? (
        <List style={styles.panel} rowSeparator="none">
          <ListRow
            contents={
              <ListRow.Texts
                type="2RowTypeA"
                top="촬영 품질 요약"
                bottom={`품질 ${captureAnalysis.quality.score}점 · 선명도 ${captureAnalysis.quality.sharpness} · 피사체 ${captureAnalysis.quality.plantSubject}`}
              />
            }
          />
          <ListRow
            contents={
              <ListRow.Texts
                type="2RowTypeA"
                top="촬영 추천"
                bottom={`${getRecommendationLabel(captureAnalysis.quality.recommendation)} · ${formatQualityReasons(captureAnalysis.quality.reasons)}`}
              />
            }
          />
          <ListRow
            contents={
              <ListRow.Texts
                type="2RowTypeA"
                top="식물 인식"
                bottom={getDetectionSummary(captureAnalysis.detection)}
              />
            }
          />
          <ListRow
            contents={
              <ListRow.Texts
                type="2RowTypeA"
                top="분석 포맷"
                bottom={
                  captureAnalysis.normalized
                    ? `${captureAnalysis.sourceMimeType} → JPEG 변환 후 분석했어요.`
                    : `${captureAnalysis.sourceMimeType} 원본으로 바로 분석했어요.`
                }
              />
            }
          />
        </List>
      ) : null}

      {guidanceSummary != null ? (
        <List style={styles.panel} rowSeparator="none">
          <ListRow
            contents={
              <ListRow.Texts
                type="2RowTypeA"
                top="촬영 가이드"
                bottom={guidanceSummary}
              />
            }
          />
        </List>
      ) : null}

      {originalImage != null ? (
        <>
          <List style={styles.panel} rowSeparator="none">
            <ListRow
              contents={
                <ListRow.Texts
                  type="2RowTypeA"
                  top={
                    isEnhancementApplied
                      ? '✨ 식물 필터 미리보기 준비 완료'
                      : '🌿 원본 미리보기 준비 완료'
                  }
                  bottom={
                    isEnhancementApplied
                      ? `${MACRO_ENHANCEMENT_VERSION} · ${singleCameraPreset.filterLabel}`
                      : '필터를 적용하지 못해 원본으로 보여드려요.'
                  }
                />
              }
            />
            {processingDurationMs != null ? (
              <ListRow
                contents={
                  <ListRow.Texts
                    type="2RowTypeA"
                    top="미리보기 처리 시간"
                    bottom={`${(processingDurationMs / 1000).toFixed(1)}초`}
                  />
                }
              />
            ) : null}
          </List>

          {isEnhancementApplied && enhancedImage != null ? (
            <View style={styles.toggleRow}>
              <Button
                size="medium"
                display="block"
                onPress={() => setViewMode('enhanced')}
                disabled={viewMode === 'enhanced'}
                viewStyle={styles.toggleButton}
              >
                필터 보기
              </Button>
              <Button
                type="dark"
                style="weak"
                size="medium"
                display="block"
                onPress={() => setViewMode('original')}
                disabled={viewMode === 'original'}
                viewStyle={styles.toggleButton}
              >
                원본 보기
              </Button>
            </View>
          ) : null}

          <Image
            source={{
              uri: toDisplayImageUri(
                visibleImage?.dataUri ?? originalImage.dataUri,
                visibleImage?.mimeType ?? originalImage.mimeType,
              ),
            }}
            style={styles.previewImage}
            resizeMode="contain"
          />

          <View style={styles.actionRow}>
            <Button
              type="dark"
              style="weak"
              size="medium"
              display="block"
              onPress={() => {
                emitMiniappEvent('capture_quality_retake_chosen', {
                  from_result: true,
                  enhancement_applied: isEnhancementApplied,
                });
                void captureAndEnhance();
              }}
              disabled={isBusy}
              viewStyle={styles.actionButton}
            >
              다시 찍기
            </Button>
            <Button
              size="medium"
              display="block"
              onPress={() => {
                void saveCurrentPhoto();
              }}
              disabled={isBusy}
              viewStyle={styles.actionButton}
            >
              {isSaving ? '저장 중...' : '오늘 기록 저장하기'}
            </Button>
          </View>
        </>
      ) : null}

      {saveMessage != null ? (
        <List style={styles.panel} rowSeparator="none">
          <ListRow
            contents={
              <ListRow.Texts
                type="2RowTypeA"
                top="저장 완료"
                bottom={saveMessage}
              />
            }
          />
        </List>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    gap: 12,
  },
  heroCard: {
    borderRadius: 20,
    padding: 16,
    gap: 8,
  },
  cameraShell: {
    borderRadius: 24,
    padding: 14,
    backgroundColor: '#101828',
    gap: 12,
  },
  cameraShellHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  filterBadge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  cameraCanvas: {
    position: 'relative',
    aspectRatio: 1,
    borderRadius: 20,
    backgroundColor: '#1F2937',
    overflow: 'hidden',
    justifyContent: 'flex-end',
    padding: 16,
  },
  frameCorner: {
    position: 'absolute',
    width: 28,
    height: 28,
    borderColor: '#FFFFFF',
  },
  frameCornerTopLeft: {
    top: 16,
    left: 16,
    borderTopWidth: 3,
    borderLeftWidth: 3,
  },
  frameCornerTopRight: {
    top: 16,
    right: 16,
    borderTopWidth: 3,
    borderRightWidth: 3,
  },
  frameCornerBottomLeft: {
    bottom: 16,
    left: 16,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
  },
  frameCornerBottomRight: {
    right: 16,
    bottom: 16,
    borderBottomWidth: 3,
    borderRightWidth: 3,
  },
  focusRing: {
    position: 'absolute',
    top: '26%',
    left: '24%',
    right: '24%',
    bottom: '26%',
    borderRadius: 24,
    borderWidth: 1.5,
  },
  shellCopyBlock: {
    gap: 6,
    padding: 14,
    borderRadius: 18,
    backgroundColor: 'rgba(15, 23, 42, 0.74)',
  },
  panel: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.grey200,
    backgroundColor: colors.background,
    overflow: 'hidden',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
  },
  errorPanel: {
    borderColor: colors.red200,
    backgroundColor: colors.red50,
  },
  toggleRow: {
    flexDirection: 'row',
    gap: 8,
  },
  toggleButton: {
    flex: 1,
  },
  previewImage: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 16,
    backgroundColor: colors.grey100,
  },
});
