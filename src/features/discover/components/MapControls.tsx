/** Right-hand map buttons. Figma node 7:427 (my location, zoom in/out, layers). */
import React, { type ReactNode } from 'react';
import { Pressable, View, type StyleProp, type ViewStyle } from 'react-native';
import LayersIcon from '../../../assets/icons/layers.svg';
import MyLocationIcon from '../../../assets/icons/my-location.svg';
import ZoomInIcon from '../../../assets/icons/zoom-in.svg';
import ZoomOutIcon from '../../../assets/icons/zoom-out.svg';
import { makeStyles } from '../../../theme';

interface MapControlsProps {
  onLocate: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onToggleLayers: () => void;
  style?: StyleProp<ViewStyle>;
}

export function MapControls({ onLocate, onZoomIn, onZoomOut, onToggleLayers, style }: MapControlsProps) {
  const styles = useStyles();
  return (
    <View style={[styles.column, style]}>
      <ControlButton label="My location" onPress={onLocate} style={styles.single}>
        <MyLocationIcon />
      </ControlButton>
      <View style={styles.group}>
        <ControlButton label="Zoom in" onPress={onZoomIn} style={[styles.zoom, styles.zoomTop]}>
          <ZoomInIcon />
        </ControlButton>
        <ControlButton label="Zoom out" onPress={onZoomOut} style={styles.zoom}>
          <ZoomOutIcon />
        </ControlButton>
      </View>
      <ControlButton label="Map style" onPress={onToggleLayers} style={styles.single}>
        <LayersIcon />
      </ControlButton>
    </View>
  );
}

function ControlButton({
  label,
  onPress,
  style,
  children,
}: {
  label: string;
  onPress: () => void;
  style: StyleProp<ViewStyle>;
  children: ReactNode;
}) {
  const styles = useStyles();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [styles.button, style, pressed && styles.pressed]}
    >
      {children}
    </Pressable>
  );
}

const SHADOW = '0px 20px 25px -5px rgba(0, 0, 0, 0.1), 0px 8px 10px -6px rgba(0, 0, 0, 0.1)';

const useStyles = makeStyles(t => ({
  column: {
    gap: t.spacing.sm,
  },
  button: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  single: {
    width: t.sizes.touch,
    height: t.sizes.touch,
    borderRadius: t.radii.xl,
    borderWidth: t.borderWidth.thin,
    borderColor: t.colors.glassBorderStrong,
    backgroundColor: t.colors.glass,
    boxShadow: SHADOW,
  },
  group: {
    width: t.sizes.touch,
    borderRadius: t.radii.xl,
    borderWidth: t.borderWidth.thin,
    borderColor: t.colors.glassBorderStrong,
    backgroundColor: t.colors.glass,
    boxShadow: SHADOW,
    overflow: 'hidden',
  },
  zoom: {
    height: 40,
  },
  zoomTop: {
    borderBottomWidth: t.borderWidth.thin,
    borderBottomColor: t.colors.glassBorder,
  },
  pressed: { opacity: t.opacity.pressed },
}));
