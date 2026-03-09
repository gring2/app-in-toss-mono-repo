import { Slider, Text, colors } from '@toss/tds-react-native';
import React from 'react';
import { Image, type LayoutChangeEvent, StyleSheet, View } from 'react-native';
import { toDisplayImageUri } from '../plants/image';

type CompareSliderProps = {
  beforeDataUri: string;
  beforeMimeType: string;
  afterDataUri: string;
  afterMimeType: string;
  height?: number;
  beforeLabel?: string;
  afterLabel?: string;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export function CompareSlider({
  beforeDataUri,
  beforeMimeType,
  afterDataUri,
  afterMimeType,
  height = 280,
  beforeLabel = '저번 촬영',
  afterLabel = '오늘',
}: CompareSliderProps) {
  const [containerWidth, setContainerWidth] = React.useState(0);
  const [splitPercent, setSplitPercent] = React.useState(50);

  const beforeUri = React.useMemo(
    () => toDisplayImageUri(beforeDataUri, beforeMimeType),
    [beforeDataUri, beforeMimeType],
  );
  const afterUri = React.useMemo(
    () => toDisplayImageUri(afterDataUri, afterMimeType),
    [afterDataUri, afterMimeType],
  );

  const handleLayout = (event: LayoutChangeEvent) => {
    setContainerWidth(event.nativeEvent.layout.width);
  };

  const splitRatio = splitPercent / 100;
  const splitWidth = containerWidth * splitRatio;
  const dividerX = Math.max(splitWidth - 1, 0);

  return (
    <View style={styles.wrapper}>
      <View style={[styles.container, { height }]} onLayout={handleLayout}>
        <Image
          source={{ uri: afterUri }}
          style={styles.image}
          resizeMode="cover"
        />

        <View style={[styles.beforeLayer, { width: splitWidth }]}>
          <Image
            source={{ uri: beforeUri }}
            style={styles.image}
            resizeMode="cover"
          />
        </View>

        <View style={[styles.divider, { left: dividerX }]} />

        <View style={styles.labels}>
          <Text typography="t7" fontWeight="medium" style={styles.labelText}>
            {beforeLabel}
          </Text>
          <Text typography="t7" fontWeight="medium" style={styles.labelText}>
            {afterLabel}
          </Text>
        </View>
      </View>

      <View style={styles.sliderContainer}>
        <Slider
          min={5}
          max={95}
          step={1}
          value={splitPercent}
          onChange={(value) => setSplitPercent(clamp(value, 5, 95))}
          color={colors.blue500}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
  },
  container: {
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: colors.grey100,
  },
  image: {
    ...StyleSheet.absoluteFillObject,
    width: undefined,
    height: undefined,
  },
  beforeLayer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  divider: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 2,
    backgroundColor: colors.white,
  },
  labels: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  labelText: {
    color: colors.white,
    backgroundColor: colors.greyOpacity700,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  sliderContainer: {
    marginTop: 10,
    paddingHorizontal: 6,
  },
});
