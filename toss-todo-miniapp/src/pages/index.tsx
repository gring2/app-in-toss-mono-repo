import { createRoute } from '@granite-js/react-native';
import { Button, List, ListRow, Text, colors } from '@toss/tds-react-native';
import React from 'react';
import { SafeAreaView, ScrollView, StyleSheet, View } from 'react-native';
import { CompareSlider } from '../components/CompareSlider';
import { usePlantGrowth } from '../hooks/usePlantGrowth';

export const Route = createRoute('/', {
  component: Page,
});

function formatDateLabel(isoDate: string | null) {
  if (isoDate == null) {
    return '아직 기록이 없어요';
  }

  const date = new Date(isoDate);

  if (Number.isNaN(date.getTime())) {
    return '날짜를 불러오지 못했어요';
  }

  return date.toLocaleDateString('ko-KR', {
    month: 'long',
    day: 'numeric',
  });
}

function Page() {
  const navigation = Route.useNavigation();
  const {
    comparePair,
    isReady,
    profile,
    photos,
    canCaptureToday,
    lastCapturedAt,
  } = usePlantGrowth();

  const isOnboarding = profile == null || comparePair == null;
  const captureLabel = canCaptureToday
    ? '오늘 사진 남기기'
    : '오늘 사진 다시 남기기';

  const openBaselineCapture = () => {
    navigation.navigate('/capture', {
      mode: 'baseline',
    });
  };

  const openDailyCapture = () => {
    navigation.navigate('/capture', {
      mode: 'daily',
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.screen}
        contentContainerStyle={styles.contentContainer}
      >
        <Text typography="t2" fontWeight="bold">
          Plant Growth Diary
        </Text>
        <Text typography="t6" color={colors.grey700}>
          첫날과 오늘을 나란히 보며 식물의 변화를 즐겨요.
        </Text>

        {!isReady ? (
          <List style={styles.panel} rowSeparator="none">
            <ListRow
              contents={
                <ListRow.Texts
                  type="2RowTypeA"
                  top="기록을 불러오는 중이에요"
                  bottom="로컬 저장소에서 식물 기록을 복구하고 있어요."
                />
              }
            />
          </List>
        ) : isOnboarding ? (
          <View style={styles.section}>
            <List style={styles.panel} rowSeparator="none">
              <ListRow
                contents={
                  <ListRow.Texts
                    type="2RowTypeA"
                    top="식물의 첫 모습을 남겨요"
                    bottom="첫 사진이 기준이 되고, 이후 사진과 자동 비교돼요."
                  />
                }
              />
            </List>
            <Button
              size="medium"
              display="block"
              onPress={openBaselineCapture}
              viewStyle={styles.primaryButton}
            >
              첫 사진 찍기
            </Button>
          </View>
        ) : (
          <View style={styles.section}>
            <CompareSlider
              beforeDataUri={comparePair.baseline.dataUri}
              beforeMimeType={comparePair.baseline.mimeType}
              afterDataUri={comparePair.latest.dataUri}
              afterMimeType={comparePair.latest.mimeType}
            />
            <List style={styles.panel} rowSeparator="full">
              <ListRow
                contents={
                  <ListRow.Texts type="1RowTypeA" top="첫날 vs 오늘 자동비교" />
                }
              />
              <ListRow
                contents={
                  <ListRow.Texts
                    type="1RowTypeA"
                    top={`첫 기록: ${formatDateLabel(comparePair.baseline.capturedAt)}`}
                  />
                }
              />
              <ListRow
                contents={
                  <ListRow.Texts
                    type="1RowTypeA"
                    top={`최신 기록: ${formatDateLabel(lastCapturedAt)}`}
                  />
                }
              />
              <ListRow
                contents={
                  <ListRow.Texts
                    type="1RowTypeA"
                    top={`총 사진 수: ${photos.length}장`}
                  />
                }
              />
            </List>
            <Button
              size="medium"
              display="block"
              onPress={openDailyCapture}
              viewStyle={styles.primaryButton}
            >
              {captureLabel}
            </Button>
            <Button
              type="dark"
              style="weak"
              size="medium"
              display="block"
              onPress={() => navigation.navigate('/compare')}
              viewStyle={styles.secondaryButton}
            >
              비교 크게 보기
            </Button>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.grey50,
  },
  screen: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    gap: 16,
  },
  section: {
    gap: 12,
  },
  panel: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  primaryButton: {
    width: '100%',
  },
  secondaryButton: {
    width: '100%',
  },
});
