import { createRoute } from '@granite-js/react-native';
import { colors } from '@toss/tds-react-native';
import React from 'react';
import { SafeAreaView, ScrollView, StyleSheet } from 'react-native';
import { EnhanceCaptureLab } from '../components/EnhanceCaptureLab';

export const Route = createRoute('/', {
  component: Page,
});

function Page() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.screen}>
        <EnhanceCaptureLab screenName="home" />
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
});
