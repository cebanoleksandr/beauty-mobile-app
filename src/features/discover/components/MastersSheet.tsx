/**
 * Bottom sheet with search results. Figma node 7:484: handle, "Masters …
 * (N found)", "List view" toggle, horizontal card carousel. In list mode the
 * sheet grows into a two-column grid.
 */
import React, { forwardRef, useCallback, useImperativeHandle, useRef } from 'react';
import { ActivityIndicator, FlatList, Pressable, Text, View, useWindowDimensions } from 'react-native';
import ListViewIcon from '../../../assets/icons/list-view.svg';
import MapViewIcon from '../../../assets/icons/tab-map-active.svg';
import type { MasterCardDto } from '../../../api';
import { makeStyles, useTheme } from '../../../theme';
import { MASTER_CARD_WIDTH, MasterCard } from './MasterCard';

const CARD_GAP = 12;
const SIDE_PADDING = 16;

export interface MastersSheetRef {
  scrollToMaster: (masterId: number) => void;
}

interface MastersSheetProps {
  masters: MasterCardDto[];
  loading: boolean;
  error: boolean;
  selectedId: number | null;
  favoriteIds: ReadonlySet<number>;
  listMode: boolean;
  onToggleListMode: () => void;
  onSelect: (master: MasterCardDto) => void;
  onToggleFavorite: (master: MasterCardDto) => void;
  onBook: (master: MasterCardDto) => void;
  onRetry: () => void;
}

export const MastersSheet = forwardRef<MastersSheetRef, MastersSheetProps>(function MastersSheetView(
  {
    masters,
    loading,
    error,
    selectedId,
    favoriteIds,
    listMode,
    onToggleListMode,
    onSelect,
    onToggleFavorite,
    onBook,
    onRetry,
  },
  ref,
) {
  const styles = useStyles();
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const carouselRef = useRef<FlatList<MasterCardDto>>(null);
  const gridCardWidth = (width - SIDE_PADDING * 2 - CARD_GAP) / 2;

  useImperativeHandle(ref, () => ({
    scrollToMaster: masterId => {
      const index = masters.findIndex(m => m.id === masterId);
      if (index >= 0 && !listMode) {
        carouselRef.current?.scrollToIndex({ index, animated: true, viewOffset: SIDE_PADDING });
      }
    },
  }));

  const renderCard = useCallback(
    ({ item }: { item: MasterCardDto }) => (
      <MasterCard
        master={item}
        selected={item.id === selectedId}
        favorite={favoriteIds.has(item.id)}
        onPress={onSelect}
        onToggleFavorite={onToggleFavorite}
        onBook={onBook}
        style={listMode ? { width: gridCardWidth } : undefined}
      />
    ),
    [selectedId, favoriteIds, onSelect, onToggleFavorite, onBook, listMode, gridCardWidth],
  );

  const empty = (
    <View style={styles.empty}>
      {loading ? (
        <ActivityIndicator color={colors.primary} />
      ) : error ? (
        <>
          <Text style={styles.emptyText}>Couldn't load masters.</Text>
          <Pressable onPress={onRetry} accessibilityRole="button">
            <Text style={styles.retry}>Try again</Text>
          </Pressable>
        </>
      ) : (
        <Text style={styles.emptyText}>No masters here yet. Try moving the map or changing filters.</Text>
      )}
    </View>
  );

  return (
    <View style={[styles.sheet, listMode && styles.sheetExpanded]}>
      <View style={styles.handle} />
      <View style={styles.titleRow}>
        <View style={styles.titleWrap}>
          <Text style={styles.title} numberOfLines={1}>
            Masters nearby
          </Text>
          {!loading && <Text style={styles.count}>({masters.length} found)</Text>}
          {loading && masters.length > 0 && <ActivityIndicator size="small" color={colors.textSecondary} />}
        </View>
        <Pressable onPress={onToggleListMode} accessibilityRole="button" hitSlop={8} style={styles.viewToggle}>
          {listMode ? <MapViewIcon /> : <ListViewIcon />}
          <Text style={styles.viewToggleLabel}>{listMode ? 'Map view' : 'List view'}</Text>
        </Pressable>
      </View>

      {listMode ? (
        <FlatList
          key="grid"
          data={masters}
          keyExtractor={m => String(m.id)}
          renderItem={renderCard}
          numColumns={2}
          columnWrapperStyle={styles.gridRow}
          contentContainerStyle={styles.gridContent}
          ListEmptyComponent={empty}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <FlatList
          key="carousel"
          ref={carouselRef}
          data={masters}
          keyExtractor={m => String(m.id)}
          renderItem={renderCard}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.carouselContent}
          ItemSeparatorComponent={CarouselGap}
          getItemLayout={(_, index) => ({
            length: MASTER_CARD_WIDTH + CARD_GAP,
            offset: (MASTER_CARD_WIDTH + CARD_GAP) * index,
            index,
          })}
          snapToInterval={MASTER_CARD_WIDTH + CARD_GAP}
          decelerationRate="fast"
          ListEmptyComponent={empty}
        />
      )}
    </View>
  );
});

function CarouselGap() {
  return <View style={{ width: CARD_GAP }} />;
}

const useStyles = makeStyles(t => ({
  sheet: {
    paddingTop: 9,
    paddingBottom: t.spacing.md,
    borderTopLeftRadius: t.radii.xxl,
    borderTopRightRadius: t.radii.xxl,
    borderTopWidth: t.borderWidth.thin,
    borderColor: t.colors.glassBorderStrong,
    backgroundColor: 'rgba(27, 27, 30, 0.95)',
    boxShadow: '0px -12px 36px 0px rgba(0, 0, 0, 0.65)',
  },
  sheetExpanded: {
    flex: 1,
    paddingBottom: 0,
  },
  handle: {
    alignSelf: 'center',
    width: 48,
    height: 4,
    borderRadius: t.radii.full,
    backgroundColor: 'rgba(53, 52, 56, 0.8)',
  },
  titleRow: {
    marginTop: 10,
    marginBottom: 10,
    paddingHorizontal: t.spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  titleWrap: {
    flexShrink: 1,
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: t.spacing.sm,
  },
  title: {
    flexShrink: 1,
    fontFamily: t.fontFamily.semibold,
    fontSize: 18,
    lineHeight: 24,
    letterSpacing: -0.45,
    color: t.colors.text,
  },
  count: {
    ...t.typography.bodySmall,
    color: t.colors.textSecondary,
  },
  viewToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: t.spacing.xs,
  },
  viewToggleLabel: {
    fontFamily: t.fontFamily.semibold,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.48,
    color: t.colors.primary,
  },
  carouselContent: {
    paddingHorizontal: SIDE_PADDING,
    paddingVertical: t.spacing.xs,
    flexGrow: 1,
  },
  gridContent: {
    paddingHorizontal: SIDE_PADDING,
    paddingBottom: t.spacing.xl,
    gap: CARD_GAP,
    flexGrow: 1,
  },
  gridRow: {
    gap: CARD_GAP,
  },
  empty: {
    flex: 1,
    minHeight: 120,
    alignItems: 'center',
    justifyContent: 'center',
    gap: t.spacing.sm,
    paddingHorizontal: t.spacing.xl,
  },
  emptyText: {
    ...t.typography.bodyMedium,
    textAlign: 'center',
    color: t.colors.textSecondary,
  },
  retry: {
    ...t.typography.labelLarge,
    color: t.colors.primary,
  },
}));
