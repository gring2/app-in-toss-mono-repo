import React from 'react';
import {
  Image,
  type LayoutChangeEvent,
  PanResponder,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { toDisplayImageUri } from '../plants/image';
import { palette, radius, typography } from '../ui/theme';

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
  const [splitRatio, setSplitRatio] = React.useState(0.5);

  const beforeUri = React.useMemo(
    () => toDisplayImageUri(beforeDataUri, beforeMimeType),
    [beforeDataUri, beforeMimeType],
  );
  const afterUri = React.useMemo(
    () => toDisplayImageUri(afterDataUri, afterMimeType),
    [afterDataUri, afterMimeType],
  );

  const updateSplitByX = React.useCallback(
    (x: number) => {
      if (containerWidth <= 0) {
        return;
      }

      setSplitRatio(clamp(x / containerWidth, 0.05, 0.95));
    },
    [containerWidth],
  );

  const panResponder = React.useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: (event) => {
          updateSplitByX(event.nativeEvent.locationX);
        },
        onPanResponderMove: (event) => {
          updateSplitByX(event.nativeEvent.locationX);
        },
      }),
    [updateSplitByX],
  );

  const handleLayout = (event: LayoutChangeEvent) => {
    setContainerWidth(event.nativeEvent.layout.width);
  };

  const splitWidth = containerWidth * splitRatio;
  const dividerX = splitWidth - 1;

  return (
    <View
      style={[styles.container, { height }]}
      onLayout={handleLayout}
      {...panResponder.panHandlers}
    >
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
      <View style={[styles.knob, { left: splitWidth - 18 }]}>
        <Text style={styles.knobText}>{'< >'}</Text>
      </View>

      <View style={styles.labels}>
        <Text style={styles.labelText}>{beforeLabel}</Text>
        <Text style={styles.labelText}>{afterLabel}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    borderRadius: radius.lg,
    overflow: 'hidden',
    backgroundColor: palette.border,
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
    backgroundColor: palette.white,
  },
  knob: {
    position: 'absolute',
    top: '50%',
    marginTop: -18,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: palette.leafStrong,
    justifyContent: 'center',
    alignItems: 'center',
  },
  knobText: {
    color: palette.white,
    fontSize: 12,
    fontWeight: '700',
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
    color: palette.white,
    backgroundColor: 'rgba(44, 58, 44, 0.72)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.sm,
    fontSize: typography.caption,
    fontWeight: '600',
  },
});
