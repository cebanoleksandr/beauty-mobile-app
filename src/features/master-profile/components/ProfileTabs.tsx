/** Segmented tabs under the master header. Figma node 7:893. */
import React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { makeStyles } from '../../../theme';

export interface ProfileTab<T extends string> {
  key: T;
  label: string;
}

interface ProfileTabsProps<T extends string> {
  tabs: readonly ProfileTab<T>[];
  active: T;
  onChange: (key: T) => void;
}

export function ProfileTabs<T extends string>({ tabs, active, onChange }: ProfileTabsProps<T>) {
  const styles = useStyles();
  return (
    <View style={styles.bar}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {tabs.map(tab => {
          const selected = tab.key === active;
          return (
            <Pressable
              key={tab.key}
              onPress={() => onChange(tab.key)}
              accessibilityRole="tab"
              accessibilityState={{ selected }}
              style={styles.tab}
            >
              <Text style={[styles.label, selected && styles.labelActive]}>{tab.label}</Text>
              {selected && <View style={styles.underline} />}
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const useStyles = makeStyles(t => ({
  bar: {
    backgroundColor: t.colors.chrome,
    borderBottomWidth: t.borderWidth.thin,
    borderBottomColor: 'rgba(81, 68, 63, 0.2)',
  },
  row: {
    paddingHorizontal: t.spacing.xl,
    gap: t.spacing.xxl,
  },
  tab: {
    height: 44,
    justifyContent: 'center',
  },
  label: {
    fontFamily: t.fontFamily.semibold,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.48,
    color: t.colors.textSecondary,
  },
  labelActive: {
    color: t.colors.primary,
  },
  underline: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 8,
    height: 2,
    borderRadius: t.radii.full,
    backgroundColor: t.colors.primary,
    boxShadow: '0px 0px 8px 0px rgba(232, 180, 160, 0.8)',
  },
}));
