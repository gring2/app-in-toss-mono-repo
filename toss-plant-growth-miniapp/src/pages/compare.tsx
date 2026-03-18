import { createRoute } from '@granite-js/react-native';
import { Button, Text, colors } from '@toss/tds-react-native';
import React from 'react';
import { SafeAreaView, StyleSheet, View } from 'react-native';

export const Route = createRoute('/compare', {
  component: Page,
});

function Page() {
  const navigation = Route.useNavigation();

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text typography="t3" fontWeight="bold">
          비교 리포트는 잠시 쉬는 중이에요
        </Text>
        <Text typography="t6" color={colors.grey600}>
          지금은 촬영 후 디테일 강화 결과 확인에만 집중한 버전입니다.
        </Text>
        <Button
          size="medium"
          display="block"
          onPress={() => navigation.navigate('/')}
          viewStyle={styles.fullButton}
        >
          강화 카메라로 돌아가기
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
