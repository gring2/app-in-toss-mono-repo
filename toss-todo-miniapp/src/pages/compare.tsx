import { createRoute } from '@granite-js/react-native';
import { Button } from '@toss/tds-react-native';
import {
  loadFullScreenAd,
  saveBase64Data,
  showFullScreenAd,
} from '@apps-in-toss/framework';
import React from 'react';
import { SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { CompareSlider } from '../components/CompareSlider';
import { usePlantGrowth } from '../hooks/usePlantGrowth';
import type { PlantPhoto } from '../plants/store';

const REWARDED_AD_GROUP_ID = 'ait.dev.43daa14da3ae487b';

export const Route = createRoute('/compare', {
  component: Page,
});

function Page() {
  const navigation = Route.useNavigation();
  const { comparePair } = usePlantGrowth();
  const [isAdSupported, setIsAdSupported] = React.useState(false);
  const [isAdLoaded, setIsAdLoaded] = React.useState(false);
  const [statusMessage, setStatusMessage] = React.useState('');
  const [isProcessing, setIsProcessing] = React.useState(false);
  const rewardGrantedRef = React.useRef(false);
  const adUnregisterRef = React.useRef<(() => void) | null>(null);

  const preloadRewardAd = React.useCallback(() => {
    adUnregisterRef.current?.();
    adUnregisterRef.current = null;
    setIsAdLoaded(false);

    const supportsAd =
      REWARDED_AD_GROUP_ID.length > 0 &&
      loadFullScreenAd.isSupported() &&
      showFullScreenAd.isSupported();

    setIsAdSupported(supportsAd);

    if (!supportsAd) {
      setStatusMessage('현재 환경에서는 보상 광고를 사용할 수 없어요.');
      return;
    }

    setStatusMessage('고화질 저장 광고를 불러오는 중이에요.');

    adUnregisterRef.current = loadFullScreenAd({
      options: {
        adGroupId: REWARDED_AD_GROUP_ID,
      },
      onEvent: (event) => {
        if (event.type === 'loaded') {
          setIsAdLoaded(true);
          setStatusMessage('광고 준비 완료. 고화질 저장을 눌러주세요.');
        }
      },
      onError: (error) => {
        console.warn('[Compare] Failed to load rewarded ad:', error);
        setIsAdLoaded(false);
        setStatusMessage('광고 로드에 실패했어요. 잠시 뒤 다시 시도해주세요.');
      },
    });
  }, []);

  React.useEffect(() => {
    if (comparePair == null) {
      return;
    }

    preloadRewardAd();

    return () => {
      adUnregisterRef.current?.();
      adUnregisterRef.current = null;
    };
  }, [comparePair, preloadRewardAd]);

  const saveHdPhoto = React.useCallback(async (photo: PlantPhoto) => {
    setStatusMessage('고화질 이미지를 저장하고 있어요.');

    try {
      const date = new Date(photo.capturedAt);
      const datePart = Number.isNaN(date.getTime())
        ? Date.now()
        : date.getTime();

      await saveBase64Data({
        data: photo.dataUri,
        fileName: `plant-growth-${datePart}.jpg`,
        mimeType: photo.mimeType,
      });

      setStatusMessage('고화질 저장이 완료됐어요.');
    } catch (error) {
      console.warn('[Compare] Failed to save image:', error);
      setStatusMessage('이미지 저장에 실패했어요. 다시 시도해주세요.');
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const handleHdSave = () => {
    if (comparePair == null || isProcessing) {
      return;
    }

    if (!isAdSupported) {
      setStatusMessage('현재 환경에서는 보상 광고를 사용할 수 없어요.');
      return;
    }

    if (!isAdLoaded) {
      setStatusMessage('광고를 아직 불러오지 못했어요. 잠시 후 다시 시도해주세요.');
      return;
    }

    const latestPhoto = comparePair.latest;
    rewardGrantedRef.current = false;
    setIsProcessing(true);

    showFullScreenAd({
      options: {
        adGroupId: REWARDED_AD_GROUP_ID,
      },
      onEvent: (event) => {
        switch (event.type) {
          case 'requested':
            setStatusMessage('광고를 여는 중이에요.');
            break;
          case 'show':
            setStatusMessage('광고 시청 후 고화질 저장이 열려요.');
            break;
          case 'userEarnedReward':
            rewardGrantedRef.current = true;
            void saveHdPhoto(latestPhoto);
            break;
          case 'dismissed':
            if (!rewardGrantedRef.current) {
              setStatusMessage('광고를 끝까지 시청해야 고화질 저장이 열려요.');
              setIsProcessing(false);
            }
            preloadRewardAd();
            break;
          case 'failedToShow':
            setStatusMessage('광고 재생에 실패했어요. 다시 시도해주세요.');
            setIsProcessing(false);
            preloadRewardAd();
            break;
          default:
            break;
        }
      },
      onError: (error) => {
        console.warn('[Compare] Failed to show rewarded ad:', error);
        setStatusMessage('광고 재생 중 오류가 발생했어요.');
        setIsProcessing(false);
        preloadRewardAd();
      },
    });
  };

  if (comparePair == null) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <Text style={styles.title}>비교할 사진이 없어요</Text>
          <Text style={styles.subtitle}>
            첫 사진을 찍으면 첫날 vs 오늘 비교를 바로 볼 수 있어요.
          </Text>
          <Button
            size="medium"
            display="block"
            onPress={() => navigation.navigate('/capture', { mode: 'baseline' })}
            viewStyle={styles.fullButton}
          >
            첫 사진 찍기
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.title}>첫날 vs 오늘</Text>
        <Text style={styles.subtitle}>
          슬라이더를 움직이며 성장을 확인해보세요.
        </Text>

        <CompareSlider
          beforeDataUri={comparePair.baseline.dataUri}
          beforeMimeType={comparePair.baseline.mimeType}
          afterDataUri={comparePair.latest.dataUri}
          afterMimeType={comparePair.latest.mimeType}
          height={320}
        />

        <View style={styles.statusBox}>
          <Text style={styles.statusText}>{statusMessage}</Text>
        </View>

        <Button
          size="medium"
          display="block"
          onPress={handleHdSave}
          disabled={!isAdSupported || !isAdLoaded || isProcessing}
          viewStyle={styles.fullButton}
        >
          {isProcessing
            ? '처리 중...'
            : isAdLoaded
              ? '고화질로 저장'
              : '광고 로딩 중...'}
        </Button>

        <Button
          type="dark"
          style="weak"
          size="medium"
          display="block"
          onPress={() => navigation.navigate('/')}
          viewStyle={styles.fullButton}
        >
          홈으로 돌아가기
        </Button>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F7F8FA',
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 24,
    gap: 12,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#111827',
  },
  subtitle: {
    fontSize: 15,
    color: '#4B5563',
  },
  statusBox: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  statusText: {
    fontSize: 14,
    color: '#374151',
  },
  fullButton: {
    width: '100%',
  },
});
