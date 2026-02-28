import { createRoute } from '@granite-js/react-native';
import { Button } from '@toss/tds-react-native';
import React from 'react';
import { Image, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { timelineCopy } from '../content/copy';
import { usePlantGrowth } from '../hooks/usePlantGrowth';
import { toDisplayImageUri } from '../plants/image';
import { palette, radius, spacing, typography } from '../ui/theme';

export const Route = createRoute('/timeline', {
  component: Page,
});

function formatDateLabel(isoDate: string) {
  const date = new Date(isoDate);

  if (Number.isNaN(date.getTime())) {
    return '날짜를 불러오지 못했어요';
  }

  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function Page() {
  const navigation = Route.useNavigation();
  const { activePlant, activePlantPhotos } = usePlantGrowth();
  const [currentIndex, setCurrentIndex] = React.useState(0);

  const orderedPhotos = React.useMemo(
    () => [...activePlantPhotos].reverse(),
    [activePlantPhotos],
  );
  const lastIndex = Math.max(orderedPhotos.length - 1, 0);
  const currentIndexSafe = Math.min(currentIndex, lastIndex);
  const currentPhoto = orderedPhotos[currentIndexSafe];
  const hasSeenEnd = currentIndexSafe >= lastIndex && orderedPhotos.length > 0;

  const moveToPrev = () => {
    setCurrentIndex((prev) => {
      const safePrev = Math.min(prev, lastIndex);
      return Math.max(safePrev - 1, 0);
    });
  };

  const moveToNext = () => {
    setCurrentIndex((prev) => {
      const safePrev = Math.min(prev, lastIndex);
      return Math.min(safePrev + 1, lastIndex);
    });
  };

  if (activePlant == null || orderedPhotos.length === 0) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <Text style={styles.title}>{timelineCopy.unavailableTitle}</Text>
          <Text style={styles.subtitle}>{timelineCopy.unavailableBody}</Text>
          <Button
            size="medium"
            display="block"
            onPress={() => navigation.navigate('/')}
            viewStyle={styles.fullButton}
          >
            {timelineCopy.ctaBackHome}
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  if (currentPhoto == null) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <Text style={styles.title}>{timelineCopy.preparingTitle}</Text>
          <Button
            size="medium"
            display="block"
            onPress={() => navigation.navigate('/')}
            viewStyle={styles.fullButton}
          >
            {timelineCopy.ctaBackHome}
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.title}>
          {timelineCopy.pageTitle(activePlant.name)}
        </Text>
        <Text style={styles.subtitle}>
          {timelineCopy.pageSubtitle(
            currentIndexSafe + 1,
            orderedPhotos.length,
            formatDateLabel(currentPhoto.capturedAt),
          )}
        </Text>

        <Image
          source={{
            uri: toDisplayImageUri(currentPhoto.dataUri, currentPhoto.mimeType),
          }}
          style={styles.timelineImage}
          resizeMode="cover"
        />

        <View style={styles.navigationRow}>
          <Button
            type="dark"
            style="weak"
            size="medium"
            display="block"
            onPress={moveToPrev}
            disabled={currentIndexSafe === 0}
            viewStyle={styles.halfButton}
          >
            {timelineCopy.ctaPrev}
          </Button>
          <Button
            size="medium"
            display="block"
            onPress={moveToNext}
            disabled={currentIndexSafe === lastIndex}
            viewStyle={styles.halfButton}
          >
            {timelineCopy.ctaNext}
          </Button>
        </View>

        {hasSeenEnd ? (
          <View style={styles.endCard}>
            <Text style={styles.endTitle}>{timelineCopy.endTitle}</Text>
            <Text style={styles.endDescription}>{timelineCopy.endBody}</Text>
          </View>
        ) : null}

        <Button
          type="dark"
          style="weak"
          size="medium"
          display="block"
          onPress={() => navigation.navigate('/')}
          viewStyle={styles.fullButton}
        >
          {timelineCopy.ctaBackHome}
        </Button>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: palette.cream,
  },
  container: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
    gap: spacing.sm,
  },
  title: {
    fontSize: typography.title,
    fontWeight: '700',
    color: palette.textPrimary,
  },
  subtitle: {
    fontSize: typography.body,
    color: palette.textSecondary,
  },
  timelineImage: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: radius.lg,
    backgroundColor: palette.border,
  },
  navigationRow: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  halfButton: {
    flex: 1,
  },
  fullButton: {
    width: '100%',
  },
  endCard: {
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: palette.rewardBorder,
    backgroundColor: palette.reward,
    paddingHorizontal: spacing.sm,
    paddingVertical: 10,
    gap: spacing.xxs,
  },
  endTitle: {
    fontSize: typography.body,
    fontWeight: '700',
    color: palette.textPrimary,
  },
  endDescription: {
    fontSize: typography.caption,
    color: palette.textSecondary,
  },
});
