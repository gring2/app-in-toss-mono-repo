import { createRoute } from '@granite-js/react-native';
import { Button, Text, colors } from '@toss/tds-react-native';
import React from 'react';
import { SafeAreaView, StyleSheet, View } from 'react-native';

export const Route = createRoute('/timeline', {
  component: Page,
});

function Page() {
  const navigation = Route.useNavigation();

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text typography="t3" fontWeight="bold">
          성장 앨범 기능은 잠시 중단했어요
        </Text>
        <Text typography="t6" color={colors.grey600}>
          현재는 촬영 → 디테일 강화 → 결과 확인 흐름만 테스트합니다.
        </Text>
        <Button
          size="medium"
          display="block"
          onPress={() => navigation.navigate('/')}
          viewStyle={styles.fullButton}
        >
          강화 카메라로 이동
        </Button>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 20,
    gap: 12,
  },
  fullButton: {
    width: '100%',
  },
});
