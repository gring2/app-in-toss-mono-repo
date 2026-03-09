import { createRoute } from '@granite-js/react-native';
import { Button, List, ListRow, Text, colors } from '@toss/tds-react-native';
import React from 'react';
import { Image, SafeAreaView, StyleSheet, View } from 'react-native';
import { timelineCopy } from '../content/copy';
import { usePlantGrowth } from '../hooks/usePlantGrowth';
import { toDisplayImageUri } from '../plants/image';

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
          <Text typography="t3" fontWeight="bold">
            {timelineCopy.unavailableTitle}
          </Text>
          <Text typography="t6" color={colors.grey600}>
            {timelineCopy.unavailableBody}
          </Text>
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
          <Text typography="t3" fontWeight="bold">
            {timelineCopy.preparingTitle}
          </Text>
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
        <Text typography="t3" fontWeight="bold">
          {timelineCopy.pageTitle(activePlant.name)}
        </Text>

        <List style={styles.panel} rowSeparator="none">
          <ListRow
            contents={
              <ListRow.Texts
                type="1RowTypeA"
                top={timelineCopy.pageSubtitle(
                  currentIndexSafe + 1,
                  orderedPhotos.length,
                  formatDateLabel(currentPhoto.capturedAt),
                )}
              />
            }
          />
        </List>

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
          <List style={styles.panel} rowSeparator="none">
            <ListRow
              contents={
                <ListRow.Texts
                  type="2RowTypeA"
                  top={timelineCopy.endTitle}
                  bottom={timelineCopy.endBody}
                />
              }
            />
          </List>
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
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 20,
    gap: 12,
  },
  panel: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.grey200,
    backgroundColor: colors.background,
    overflow: 'hidden',
  },
  timelineImage: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 16,
    backgroundColor: colors.grey100,
  },
  navigationRow: {
    flexDirection: 'row',
    gap: 8,
  },
  halfButton: {
    flex: 1,
  },
  fullButton: {
    width: '100%',
  },
});
