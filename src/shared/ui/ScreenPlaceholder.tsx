import React, { type ReactNode } from 'react';
import { Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { makeStyles } from '../../theme';

/** Simple titled screen for tabs whose design isn't implemented yet. */
export function ScreenPlaceholder({ title, text, children }: { title: string; text?: string; children?: ReactNode }) {
  const styles = useStyles();
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.screen, { paddingTop: insets.top + 24 }]}>
      <Text style={styles.title} accessibilityRole="header">
        {title}
      </Text>
      {!!text && <Text style={styles.text}>{text}</Text>}
      {children}
    </View>
  );
}

const useStyles = makeStyles(t => ({
  screen: {
    flex: 1,
    paddingHorizontal: t.spacing.xl,
    gap: t.spacing.sm,
    backgroundColor: t.colors.background,
  },
  title: { ...t.typography.headlineSmall, color: t.colors.text },
  text: { ...t.typography.bodyMedium, color: t.colors.textSecondary },
}));
