import { Text, colors } from '@toss/tds-react-native';
import React from 'react';
import { SafeAreaView, View } from 'react-native';

export default function NotFoundPage() {
  return (
    <SafeAreaView
      style={{
        flex: 1,
        backgroundColor: colors.grey50,
      }}
    >
      <View
        style={{
          flex: 1,
          paddingHorizontal: 24,
          gap: 8,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text typography="t3" fontWeight="bold">
          404
        </Text>
        <Text typography="t6" color={colors.grey700}>
          페이지를 찾을 수 없어요.
        </Text>
      </View>
    </SafeAreaView>
  );
}
