/**
 * Layout of a tab screen, as in My Bookings: brand header, then a scrolling
 * column with pull-to-refresh. `overlay` renders above the scroll (FABs).
 */
import React, { type ReactNode } from 'react';
import { RefreshControl, ScrollView, View } from 'react-native';
import { makeStyles, useTheme } from '../../theme';
import { DiscoverHeader } from '../discover/components/DiscoverHeader';

interface TabScreenProps {
  children: ReactNode;
  refreshing?: boolean;
  onRefresh?: () => void;
  overlay?: ReactNode;
}

export function TabScreen({ children, refreshing = false, onRefresh, overlay }: TabScreenProps) {
  const styles = useStyles();
  const { colors } = useTheme();
  return (
    <View style={styles.screen}>
      <DiscoverHeader />
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          onRefresh ? (
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          ) : undefined
        }
      >
        {children}
      </ScrollView>
      {overlay}
    </View>
  );
}

const useStyles = makeStyles(t => ({
  screen: {
    flex: 1,
    backgroundColor: t.colors.background,
  },
  content: {
    paddingTop: t.spacing.xxl,
    paddingHorizontal: t.spacing.xl,
    paddingBottom: 96,
    gap: t.spacing.xl,
  },
}));
