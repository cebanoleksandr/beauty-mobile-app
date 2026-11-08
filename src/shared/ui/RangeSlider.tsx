/**
 * Two-thumb range slider (min/max), e.g. a price range. Same contract as the
 * web app's RangeSlider; built on PanResponder, no native dependency.
 * Each thumb is `adjustable` for screen readers (swipe up/down = ±step).
 */
import React, { useRef, useState } from 'react';
import { PanResponder, View, type LayoutChangeEvent } from 'react-native';
import { makeStyles } from '../../theme';

interface RangeSliderProps {
  min: number;
  max: number;
  step?: number;
  value: readonly [number, number];
  onChange: (value: [number, number]) => void;
  /** Accessible names for the low and high thumbs. */
  labels: readonly [string, string];
}

const THUMB = 24;

export function RangeSlider({ min, max, step = 1, value, onChange, labels }: RangeSliderProps) {
  const styles = useStyles();
  const [width, setWidth] = useState(0);
  const [lo, hi] = value;

  // PanResponders are created once; read the latest props through a ref.
  const latest = useRef({ lo, hi, width, min, max, step, onChange });
  latest.current = { lo, hi, width, min, max, step, onChange };

  const usable = Math.max(width - THUMB, 1);
  const toX = (v: number) => ((v - min) / (max - min)) * usable;

  const makeResponder = (thumb: 0 | 1) => {
    let startX = 0;
    return PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      // Keep the gesture when the sheet's ScrollView wants it.
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: () => {
        const s = latest.current;
        const w = Math.max(s.width - THUMB, 1);
        startX = (((thumb === 0 ? s.lo : s.hi) - s.min) / (s.max - s.min)) * w;
      },
      onPanResponderMove: (_, g) => {
        const s = latest.current;
        const w = Math.max(s.width - THUMB, 1);
        const ratio = Math.min(1, Math.max(0, (startX + g.dx) / w));
        const raw = s.min + ratio * (s.max - s.min);
        const snapped = Math.round(raw / s.step) * s.step;
        if (thumb === 0) {
          const next = Math.min(Math.max(snapped, s.min), s.hi - s.step);
          if (next !== s.lo) s.onChange([next, s.hi]);
        } else {
          const next = Math.max(Math.min(snapped, s.max), s.lo + s.step);
          if (next !== s.hi) s.onChange([s.lo, next]);
        }
      },
    });
  };

  const loResponder = useRef(makeResponder(0)).current;
  const hiResponder = useRef(makeResponder(1)).current;

  const adjust = (thumb: 0 | 1, direction: 1 | -1) => {
    if (thumb === 0) onChange([Math.min(Math.max(lo + direction * step, min), hi - step), hi]);
    else onChange([lo, Math.max(Math.min(hi + direction * step, max), lo + step)]);
  };

  const thumbA11y = (thumb: 0 | 1) => ({
    accessible: true,
    accessibilityRole: 'adjustable' as const,
    accessibilityLabel: labels[thumb],
    accessibilityValue: { min, max, now: thumb === 0 ? lo : hi },
    accessibilityActions: [{ name: 'increment' as const }, { name: 'decrement' as const }],
    onAccessibilityAction: (e: { nativeEvent: { actionName: string } }) =>
      adjust(thumb, e.nativeEvent.actionName === 'increment' ? 1 : -1),
  });

  return (
    <View style={styles.root} onLayout={(e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width)}>
      <View style={styles.track} />
      {width > 0 && (
        <>
          <View style={[styles.range, { left: toX(lo) + THUMB / 2, width: toX(hi) - toX(lo) }]} />
          <View {...loResponder.panHandlers} {...thumbA11y(0)} hitSlop={12} style={[styles.thumb, { left: toX(lo) }]} />
          <View {...hiResponder.panHandlers} {...thumbA11y(1)} hitSlop={12} style={[styles.thumb, { left: toX(hi) }]} />
        </>
      )}
    </View>
  );
}

const useStyles = makeStyles(t => ({
  root: {
    height: THUMB,
    justifyContent: 'center',
  },
  track: {
    marginHorizontal: THUMB / 2,
    height: t.sizes.progress,
    borderRadius: t.radii.full,
    backgroundColor: t.colors.track,
  },
  range: {
    position: 'absolute',
    height: t.sizes.progress,
    borderRadius: t.radii.full,
    backgroundColor: t.colors.primary,
  },
  thumb: {
    position: 'absolute',
    width: THUMB,
    height: THUMB,
    borderRadius: t.radii.full,
    borderWidth: t.borderWidth.thick,
    borderColor: t.colors.primary,
    backgroundColor: t.colors.background,
    boxShadow: '0px 2px 6px 0px rgba(0, 0, 0, 0.35)',
  },
}));
