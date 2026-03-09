import { createRoute } from '@granite-js/react-native';
import { Button, List, ListRow, Text, colors } from '@toss/tds-react-native';
import React from 'react';
import {
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
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
          <Text typography="t3" fontWeight="bold">
            {compareCopy.unavailableTitle}
          </Text>
          <Text typography="t6" color={colors.grey600}>
            {compareCopy.unavailableBody}
          </Text>
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
          <Text typography="t3" fontWeight="bold">
            {compareCopy.preparingTitle}
          </Text>
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
        <Text typography="t3" fontWeight="bold">
          {compareCopy.pageTitle(activePlant.name)}
        </Text>

        {!todayReportUnlocked ? (
          <>
            <List style={styles.panel} rowSeparator="none">
              <ListRow
                contents={
                  <ListRow.Texts
                    type="2RowTypeA"
                    top={compareCopy.lockedTitle}
                    bottom={compareCopy.lockedBody}
                  />
                }
              />
            </List>
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
          </>
        ) : (
          <View style={styles.section}>
            {requiresSceneConfirmation && comparisonPhoto != null ? (
              <>
                <List style={styles.panel} rowSeparator="none">
                  <ListRow
                    contents={
                      <ListRow.Texts
                        type="2RowTypeA"
                        top={compareCopy.sceneMismatchTitle}
                        bottom={compareCopy.sceneMismatchBody}
                      />
                    }
                  />
                </List>
                <CompareSlider
                  beforeDataUri={comparisonPhoto.dataUri}
                  beforeMimeType={comparisonPhoto.mimeType}
                  afterDataUri={latestPhoto.dataUri}
                  afterMimeType={latestPhoto.mimeType}
                  beforeLabel={comparisonLabel}
                  afterLabel={latestCaptureLabel}
                  height={280}
                />
                <List style={styles.panel} rowSeparator="none">
                  <ListRow
                    contents={
                      <ListRow.Texts
                        type="1RowTypeA"
                        top={compareCopy.quickSceneLabel(
                          quickSceneCheck?.obviousSceneScore ?? 0,
                        )}
                      />
                    }
                  />
                </List>
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
              </>
            ) : reportPayload == null ? (
              <List style={styles.panel} rowSeparator="none">
                <ListRow
                  contents={
                    <ListRow.Texts
                      type="2RowTypeA"
                      top={compareCopy.reportLoadingTitle}
                      bottom={compareCopy.reportLoadingBody}
                    />
                  }
                />
              </List>
            ) : (
              <>
                <List style={styles.panel} rowSeparator="none">
                  <ListRow
                    contents={
                      <ListRow.Texts
                        type="2RowTypeA"
                        top={compareCopy.mascotTitle}
                        bottom={`${compareCopy.mascotEmoji(
                          reportPayload.changeScore,
                          reportPayload.isBaselineOnly,
                        )} ${compareCopy.mascotLine(
                          reportPayload.changeScore,
                          reportPayload.isBaselineOnly,
                        )}`}
                      />
                    }
                  />
                </List>

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

                <List style={styles.panel} rowSeparator="none">
                  <ListRow
                    contents={
                      <ListRow.Texts
                        type="1RowTypeA"
                        top={reportPayload.summaryText}
                      />
                    }
                  />
                </List>

                <List style={styles.panel} rowSeparator="indented">
                  <ListRow
                    contents={
                      <ListRow.Texts
                        type="2RowTypeA"
                        top="변화 점수"
                        bottom={`${reportPayload.changeScore}점`}
                      />
                    }
                  />
                  <ListRow
                    contents={
                      <ListRow.Texts
                        type="2RowTypeA"
                        top={`${reportPayload.comparisonLabel ?? comparisonLabel} 대비`}
                        bottom={formatDelta(reportPayload.deltaFromPrevious)}
                      />
                    }
                  />
                  <ListRow
                    contents={
                      <ListRow.Texts
                        type="2RowTypeA"
                        top="한 줄 해석"
                        bottom={compareCopy.scoreInsight(
                          reportPayload.changeScore,
                        )}
                      />
                    }
                  />
                  <ListRow
                    contents={
                      <ListRow.Texts
                        type="2RowTypeA"
                        top="연속 기록"
                        bottom={`${reportState.streakCount}일`}
                      />
                    }
                  />
                  <ListRow
                    contents={
                      <ListRow.Texts
                        type="2RowTypeA"
                        top="7일 배지"
                        bottom={
                          reportState.badges.includes('weekly-7')
                            ? '획득 완료'
                            : '진행 중'
                        }
                      />
                    }
                  />
                </List>

                <List style={styles.panel} rowSeparator="none">
                  <ListRow
                    contents={
                      <ListRow.Texts
                        type="2RowTypeA"
                        top={compareCopy.tomorrowMissionTitle}
                        bottom={
                          canCaptureToday
                            ? compareCopy.tomorrowMissionBody
                            : compareCopy.tomorrowMissionDoneBody
                        }
                      />
                    }
                  />
                </List>
              </>
            )}
          </View>
        )}

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
          onPress={() => navigation.navigate('/timeline')}
          viewStyle={styles.fullButton}
        >
          {compareCopy.ctaGrowthAlbum}
        </Button>

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
  section: {
    gap: 12,
  },
  panel: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.grey200,
    backgroundColor: colors.background,
    overflow: 'hidden',
  },
  previewImage: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 16,
    backgroundColor: colors.grey100,
  },
  fullButton: {
    width: '100%',
  },
});
