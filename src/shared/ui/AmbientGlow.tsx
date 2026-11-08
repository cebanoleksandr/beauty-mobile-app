import React from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

interface AmbientGlowProps {
  /** Diameter of the visible glow. */
  size: number;
  /** Center color, e.g. `rgba(232, 180, 160, 0.05)`. */
  color: string;
  /** Absolute placement (top/left/right/bottom). */
  style?: StyleProp<ViewStyle>;
}

/**
 * Soft blurred light orb from the designs (a large `blur()` circle).
 * RN's `filter: blur` is Android-only, so the falloff is drawn with a
 * radial gradient instead — same look on both platforms.
 */
export function AmbientGlow({ size, color, style }: AmbientGlowProps) {
  return (
    <View
      pointerEvents="none"
      style={[
        styles.glow,
        {
          width: size,
          height: size,
          backgroundImage: `radial-gradient(circle closest-side, ${color} 0%, ${color} 35%, transparent 100%)`,
        },
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  glow: { position: 'absolute' },
});
