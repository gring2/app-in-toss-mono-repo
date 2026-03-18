import { createRoute } from '@granite-js/react-native';
import { Button, Text, colors } from '@toss/tds-react-native';
import React from 'react';
import { SafeAreaView, StyleSheet, View } from 'react-native';

export const Route = createRoute('/about', {
  component: Page,
});

function Page() {
  const navigation = Route.useNavigation();

  const handleGoBack = () => {
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text typography="t3" fontWeight="bold">
          About Granite
        </Text>
        <Text typography="t6" color={colors.grey700} style={styles.description}>
          Granite is a powerful and flexible React Native Framework.
        </Text>
        <Button
          size="medium"
          display="block"
          onPress={handleGoBack}
          viewStyle={styles.fullButton}
        >
          Go Back
        </Button>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.grey50,
  },
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    gap: 12,
  },
  description: {
    marginBottom: 12,
  },
  fullButton: {
    width: '100%',
  },
});
