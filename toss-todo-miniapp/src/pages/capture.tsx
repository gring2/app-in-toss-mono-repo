import { createRoute } from '@granite-js/react-native';
import { Button } from '@toss/tds-react-native';
import {
  OpenCameraPermissionError,
  openCamera,
} from '@apps-in-toss/framework';
import React from 'react';
import { SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { usePlantGrowth } from '../hooks/usePlantGrowth';
import { normalizeCapturedImage } from '../plants/image';

type CaptureMode = 'baseline' | 'daily';

type CaptureRouteParams = {
  mode: CaptureMode;
};

function parseCaptureParams(
  params: Readonly<object | undefined>,
): CaptureRouteParams {
  const rawMode = (params as { mode?: unknown } | undefined)?.mode;

  return {
    mode: rawMode === 'baseline' ? 'baseline' : 'daily',
  };
}

export const Route = createRoute<CaptureRouteParams>('/capture', {
  component: Page,
  validateParams: parseCaptureParams,
});

function Page() {
  const navigation = Route.useNavigation();
  const { mode } = Route.useParams();
  const { profile, createBaseline, addDailyPhoto } = usePlantGrowth();
  const [isCapturing, setIsCapturing] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [requiresPermission, setRequiresPermission] = React.useState(false);

  const isBaselineMode = mode === 'baseline' || profile == null;
  const pageTitle = isBaselineMode
    ? '식물의 첫 모습을 찍어주세요'
    : '오늘 사진을 남겨주세요';

  const capturePhoto = async () => {
    if (isCapturing) {
      return;
    }

    setIsCapturing(true);
    setErrorMessage(null);
    setRequiresPermission(false);

    try {
      const response = await openCamera({
        base64: true,
        maxWidth: 1440,
      });
      const normalized = normalizeCapturedImage(response.dataUri);
      const capturedAt = new Date().toISOString();

      if (isBaselineMode) {
        createBaseline({
          name: '나의 식물',
          dataUri: normalized.dataUri,
          mimeType: normalized.mimeType,
          capturedAt,
        });
      } else {
        addDailyPhoto({
          dataUri: normalized.dataUri,
          mimeType: normalized.mimeType,
          capturedAt,
        });
      }

      navigation.navigate('/compare');
    } catch (error) {
      if (error instanceof OpenCameraPermissionError) {
        setRequiresPermission(true);
        setErrorMessage('카메라 권한이 없어서 촬영할 수 없어요.');
      } else {
        setErrorMessage('사진 촬영에 실패했어요. 잠시 후 다시 시도해주세요.');
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
        setErrorMessage('권한이 허용되지 않았어요. 설정에서 권한을 켜주세요.');
      }
    } catch (error) {
      console.warn('[Capture] Failed to open permission dialog:', error);
      setErrorMessage('권한 다이얼로그를 열지 못했어요.');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.title}>{pageTitle}</Text>
        <Text style={styles.subtitle}>
          정면에서 한 장만 찍으면 첫날과 자동 비교가 완성돼요.
        </Text>

        {errorMessage != null ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        ) : null}

        <Button
          size="medium"
          display="block"
          onPress={capturePhoto}
          disabled={isCapturing}
          viewStyle={styles.fullButton}
        >
          {isCapturing ? '촬영 중...' : '사진 찍기'}
        </Button>

        {requiresPermission ? (
          <Button
            type="dark"
            style="weak"
            size="medium"
            display="block"
            onPress={reopenPermissionDialog}
            viewStyle={styles.fullButton}
          >
            권한 다시 요청하기
          </Button>
        ) : null}

        <Button
          type="dark"
          style="weak"
          size="medium"
          display="block"
          onPress={() => navigation.goBack()}
          viewStyle={styles.fullButton}
        >
          돌아가기
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
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
  },
  subtitle: {
    fontSize: 15,
    color: '#4B5563',
  },
  errorBox: {
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#FECACA',
    backgroundColor: '#FEF2F2',
  },
  errorText: {
    fontSize: 14,
    color: '#B91C1C',
  },
  fullButton: {
    width: '100%',
  },
});
