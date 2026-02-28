import { createRoute } from '@granite-js/react-native';
import { Button } from '@toss/tds-react-native';
import React from 'react';
import {
  Image,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { CompareSlider } from '../components/CompareSlider';
import { compareCopy } from '../content/copy';
import { usePlantGrowth } from '../hooks/usePlantGrowth';
import { toDisplayImageUri } from '../plants/image';
import { buildSceneConfirmationKey, getDateKeyFromISO } from '../plants/store';
import {
  buildDailyReportPayload,
  selectComparisonTargetPhoto,
} from '../reports/dailyReport';
import { computeQuickSceneCheck } from '../reports/scoring';
import { palette, radius, spacing, typography } from '../ui/theme';

export const Route = createRoute('/compare', {
  component: Page,
});

function formatDelta(value: number | null) {
  if (value == null) {
    return '없음';
  }

  return `${value > 0 ? '+' : ''}${value}`;
}

function Page() {
  const navigation = Route.useNavigation();
  const {
    activePlant,
    activePlantPhotos,
    canCaptureToday,
    confirmSceneForReport,
    isSceneConfirmationDone,
    reportState,
    todayDateKey,
    todayReportUnlocked,
  } = usePlantGrowth();
  const [statusMessage, setStatusMessage] = React.useState('');

  const latestPhoto = activePlantPhotos[0] ?? null;
  const comparisonTarget = React.useMemo(() => {
    if (latestPhoto == null) {
      return null;
    }

    return selectComparisonTargetPhoto(activePlantPhotos, latestPhoto);
  }, [activePlantPhotos, latestPhoto]);
  const comparisonPhoto = comparisonTarget?.photo ?? null;
  const comparisonLabel = comparisonTarget?.label ?? '지난 촬영';

  const currentSceneKey =
    latestPhoto == null
      ? ''
      : buildSceneConfirmationKey(latestPhoto.id, latestPhoto.capturedAt);
  const isCurrentSceneConfirmed =
    latestPhoto != null &&
    isSceneConfirmationDone(latestPhoto.id, latestPhoto.capturedAt);

  const latestCaptureLabel = React.useMemo(() => {
    if (latestPhoto == null) {
      return '이번 촬영';
    }

    return getDateKeyFromISO(latestPhoto.capturedAt) === todayDateKey
      ? '오늘'
      : '이번 촬영';
  }, [latestPhoto, todayDateKey]);

  const quickSceneCheck = React.useMemo(() => {
    if (latestPhoto == null || comparisonPhoto == null) {
      return null;
    }

    return computeQuickSceneCheck(comparisonPhoto.dataUri, latestPhoto.dataUri);
  }, [comparisonPhoto, latestPhoto]);

  const requiresSceneConfirmation =
    todayReportUnlocked &&
    !isCurrentSceneConfirmed &&
    (quickSceneCheck?.isClearlyDifferent ?? false);

  const reportPayload = React.useMemo(() => {
    if (!todayReportUnlocked) {
      return null;
    }

    if (requiresSceneConfirmation) {
      return null;
    }

    return buildDailyReportPayload({
      photos: activePlantPhotos,
      sceneConfirmed: isCurrentSceneConfirmed,
    });
  }, [
    activePlantPhotos,
    isCurrentSceneConfirmed,
    requiresSceneConfirmation,
    todayReportUnlocked,
  ]);

  const handleConfirmSamePlant = () => {
    if (currentSceneKey.length === 0) {
      return;
    }

    confirmSceneForReport(currentSceneKey);
    setStatusMessage(compareCopy.sceneConfirmed);
  };

  const handleRecapturePhoto = () => {
    navigation.navigate('/capture', {
      mode: 'daily',
      plantId: activePlant?.id ?? '',
    });
  };

  const handleGoCapture = () => {
    if (activePlant == null || activePlantPhotos.length === 0) {
      navigation.navigate('/capture', { mode: 'baseline' });
      return;
    }

    navigation.navigate('/capture', {
      mode: 'daily',
      plantId: activePlant.id,
    });
  };

  if (activePlant == null || activePlantPhotos.length === 0) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <Text style={styles.title}>{compareCopy.unavailableTitle}</Text>
          <Text style={styles.subtitle}>{compareCopy.unavailableBody}</Text>
          <Button
            size="medium"
            display="block"
            onPress={() =>
              navigation.navigate('/capture', { mode: 'baseline' })
            }
            viewStyle={styles.fullButton}
          >
            첫 식물 만나기
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  if (latestPhoto == null) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <Text style={styles.title}>{compareCopy.preparingTitle}</Text>
          <Button
            type="dark"
            style="weak"
            size="medium"
            display="block"
            onPress={() => navigation.navigate('/')}
            viewStyle={styles.fullButton}
          >
            {compareCopy.ctaBackHome}
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.screen}
        contentContainerStyle={styles.container}
      >
        <Text style={styles.title}>
          {compareCopy.pageTitle(activePlant.name)}
        </Text>

        {!todayReportUnlocked ? (
          <View style={styles.lockedCard}>
            <Text style={styles.lockedTitle}>{compareCopy.lockedTitle}</Text>
            <Text style={styles.lockedDescription}>
              {compareCopy.lockedBody}
            </Text>
            <Image
              source={{
                uri: toDisplayImageUri(
                  latestPhoto.dataUri,
                  latestPhoto.mimeType,
                ),
              }}
              style={styles.previewImage}
              resizeMode="cover"
            />
            <Button
              size="medium"
              display="block"
              onPress={handleGoCapture}
              viewStyle={styles.fullButton}
            >
              {compareCopy.ctaGoCapture}
            </Button>
          </View>
        ) : (
          <View style={styles.section}>
            {requiresSceneConfirmation && comparisonPhoto != null ? (
              <View style={styles.lockedCard}>
                <Text style={styles.lockedTitle}>
                  {compareCopy.sceneMismatchTitle}
                </Text>
                <Text style={styles.lockedDescription}>
                  {compareCopy.sceneMismatchBody}
                </Text>
                <CompareSlider
                  beforeDataUri={comparisonPhoto.dataUri}
                  beforeMimeType={comparisonPhoto.mimeType}
                  afterDataUri={latestPhoto.dataUri}
                  afterMimeType={latestPhoto.mimeType}
                  beforeLabel={comparisonLabel}
                  afterLabel={latestCaptureLabel}
                  height={280}
                />
                <Text style={styles.cardBody}>
                  {compareCopy.quickSceneLabel(
                    quickSceneCheck?.obviousSceneScore ?? 0,
                  )}
                </Text>
                <Button
                  size="medium"
                  display="block"
                  onPress={handleConfirmSamePlant}
                  viewStyle={styles.fullButton}
                >
                  {compareCopy.ctaConfirmSamePlant}
                </Button>
                <Button
                  type="dark"
                  style="weak"
                  size="medium"
                  display="block"
                  onPress={handleRecapturePhoto}
                  viewStyle={styles.fullButton}
                >
                  {compareCopy.ctaRecapture}
                </Button>
              </View>
            ) : reportPayload == null ? (
              <View style={styles.reportCard}>
                <Text style={styles.cardTitle}>
                  {compareCopy.reportLoadingTitle}
                </Text>
                <Text style={styles.cardBody}>
                  {compareCopy.reportLoadingBody}
                </Text>
              </View>
            ) : (
              <>
                <View style={styles.mascotCard}>
                  <Text style={styles.cardTitle}>
                    {compareCopy.mascotTitle}
                  </Text>
                  <View style={styles.mascotRow}>
                    <Text style={styles.mascotEmoji}>
                      {compareCopy.mascotEmoji(
                        reportPayload.changeScore,
                        reportPayload.isBaselineOnly,
                      )}
                    </Text>
                    <View style={styles.mascotBubble}>
                      <Text style={styles.mascotBubbleText}>
                        {compareCopy.mascotLine(
                          reportPayload.changeScore,
                          reportPayload.isBaselineOnly,
                        )}
                      </Text>
                    </View>
                  </View>

                  {reportPayload.isBaselineOnly || comparisonPhoto == null ? (
                    <Image
                      source={{
                        uri: toDisplayImageUri(
                          latestPhoto.dataUri,
                          latestPhoto.mimeType,
                        ),
                      }}
                      style={styles.previewImage}
                      resizeMode="cover"
                    />
                  ) : (
                    <CompareSlider
                      beforeDataUri={comparisonPhoto.dataUri}
                      beforeMimeType={comparisonPhoto.mimeType}
                      afterDataUri={latestPhoto.dataUri}
                      afterMimeType={latestPhoto.mimeType}
                      beforeLabel={
                        reportPayload.comparisonLabel ?? comparisonLabel
                      }
                      afterLabel={latestCaptureLabel}
                      height={240}
                    />
                  )}

                  <Text style={styles.cardBody}>
                    {reportPayload.summaryText}
                  </Text>
                </View>

                <View style={styles.reportCard}>
                  <Text style={styles.cardTitle}>
                    {compareCopy.growthBoardTitle}
                  </Text>
                  <Text style={styles.scoreValue}>
                    {reportPayload.changeScore}점
                  </Text>
                  <Text style={styles.cardBody}>
                    {reportPayload.comparisonLabel ?? comparisonLabel} 대비:{' '}
                    {formatDelta(reportPayload.deltaFromPrevious)}
                  </Text>
                  <Text style={styles.cardBody}>
                    {compareCopy.scoreInsight(reportPayload.changeScore)}
                  </Text>
                  <Text style={styles.cardBody}>
                    연속 기록: {reportState.streakCount}일
                  </Text>
                  <Text style={styles.cardBody}>
                    7일 배지:{' '}
                    {reportState.badges.includes('weekly-7')
                      ? '획득 완료'
                      : '진행 중'}
                  </Text>
                </View>

                <View style={styles.reportCard}>
                  <Text style={styles.cardTitle}>
                    {compareCopy.tomorrowMissionTitle}
                  </Text>
                  <Text style={styles.cardBody}>
                    {canCaptureToday
                      ? compareCopy.tomorrowMissionBody
                      : compareCopy.tomorrowMissionDoneBody}
                  </Text>
                </View>
              </>
            )}
          </View>
        )}

        {statusMessage.length > 0 ? (
          <View style={styles.statusBox}>
            <Text style={styles.statusText}>{statusMessage}</Text>
          </View>
        ) : null}

        <Pressable
          style={styles.albumLinkButton}
          onPress={() => navigation.navigate('/timeline')}
        >
          <Text style={styles.albumLinkText}>{compareCopy.ctaGrowthAlbum}</Text>
        </Pressable>

        <Button
          type="dark"
          style="weak"
          size="medium"
          display="block"
          onPress={() => navigation.navigate('/')}
          viewStyle={styles.fullButton}
        >
          {compareCopy.ctaBackHome}
        </Button>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: palette.cream,
  },
  screen: {
    flex: 1,
  },
  container: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
    gap: spacing.sm,
  },
  section: {
    gap: spacing.xs,
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
  lockedCard: {
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: palette.rewardBorder,
    backgroundColor: palette.reward,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    gap: spacing.xs,
  },
  lockedTitle: {
    fontSize: typography.heading,
    fontWeight: '700',
    color: palette.textPrimary,
  },
  lockedDescription: {
    fontSize: typography.body,
    color: palette.textSecondary,
  },
  mascotCard: {
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.card,
    paddingHorizontal: spacing.sm,
    paddingVertical: 10,
    gap: spacing.xs,
  },
  mascotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  mascotEmoji: {
    fontSize: 28,
  },
  mascotBubble: {
    flex: 1,
    borderRadius: radius.sm,
    backgroundColor: palette.sunSoft,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderWidth: 1,
    borderColor: palette.rewardBorder,
  },
  mascotBubbleText: {
    fontSize: typography.body,
    color: palette.textPrimary,
  },
  previewImage: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: radius.md,
    backgroundColor: palette.border,
  },
  reportCard: {
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.card,
    paddingHorizontal: spacing.sm,
    paddingVertical: 10,
    gap: spacing.xxs,
  },
  cardTitle: {
    fontSize: typography.body,
    fontWeight: '700',
    color: palette.textPrimary,
  },
  cardBody: {
    fontSize: typography.body,
    color: palette.textSecondary,
  },
  scoreValue: {
    fontSize: 28,
    fontWeight: '700',
    color: palette.leafStrong,
  },
  statusBox: {
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.card,
    paddingHorizontal: spacing.sm,
    paddingVertical: 10,
  },
  statusText: {
    fontSize: typography.body,
    color: palette.textSecondary,
  },
  albumLinkButton: {
    alignSelf: 'center',
    paddingVertical: spacing.xs,
  },
  albumLinkText: {
    fontSize: typography.body,
    color: palette.leafStrong,
    textDecorationLine: 'underline',
    fontWeight: '600',
  },
  fullButton: {
    width: '100%',
  },
});
