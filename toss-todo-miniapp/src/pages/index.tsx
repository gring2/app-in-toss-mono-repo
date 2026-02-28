import { createRoute } from '@granite-js/react-native';
import { Button } from '@toss/tds-react-native';
import React from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
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
  const { comparePair, isReady, profile, photos, canCaptureToday, lastCapturedAt } =
    usePlantGrowth();

  const isOnboarding = profile == null || comparePair == null;
  const captureLabel = canCaptureToday ? '오늘 사진 남기기' : '오늘 사진 다시 남기기';

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
        <Text style={styles.title}>Plant Growth Diary</Text>
        <Text style={styles.subtitle}>
          첫날과 오늘을 나란히 보며 식물의 변화를 즐겨요.
        </Text>

        {!isReady ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>기록을 불러오는 중이에요</Text>
            <Text style={styles.emptyDescription}>
              로컬 저장소에서 식물 기록을 복구하고 있어요.
            </Text>
          </View>
        ) : isOnboarding ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>식물의 첫 모습을 남겨요</Text>
            <Text style={styles.emptyDescription}>
              첫 사진이 기준이 되고, 이후 사진과 자동 비교돼요.
            </Text>
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
            <View style={styles.metaCard}>
              <Text style={styles.metaTitle}>첫날 vs 오늘 자동비교</Text>
              <Text style={styles.metaText}>
                첫 기록: {formatDateLabel(comparePair.baseline.capturedAt)}
              </Text>
              <Text style={styles.metaText}>
                최신 기록: {formatDateLabel(lastCapturedAt)}
              </Text>
              <Text style={styles.metaText}>총 사진 수: {photos.length}장</Text>
            </View>
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
    backgroundColor: '#F7F8FA',
  },
  screen: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    gap: 16,
  },
  title: {
    fontSize: 30,
    fontWeight: '700',
    color: '#111827',
  },
  subtitle: {
    fontSize: 15,
    color: '#374151',
  },
  emptyState: {
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    paddingVertical: 24,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 8,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  emptyDescription: {
    fontSize: 14,
    color: '#6B7280',
  },
  section: {
    gap: 12,
  },
  metaCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 6,
  },
  metaTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },
  metaText: {
    fontSize: 14,
    color: '#4B5563',
  },
  primaryButton: {
    width: '100%',
  },
  secondaryButton: {
    width: '100%',
  },
});
