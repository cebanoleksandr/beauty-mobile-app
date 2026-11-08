/**
 * Portfolio photos (`MasterDetailDto.portfolio`). Bento layout from Figma
 * node 7:690 — one tall card + two stacked — repeated per group of three.
 * The design's per-look captions/categories aren't in the backend, so the
 * cards show only the photo. Tapping opens a full-screen pager.
 */
import React, { useState } from 'react';
import { FlatList, Image, Modal, Pressable, View, useWindowDimensions } from 'react-native';
import { X } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ExpandIcon from '../../../assets/icons/master/expand.svg';
import { makeStyles, useTheme } from '../../../theme';

const GAP = 12;
const TALL = 402;
const SHORT = (TALL - GAP) / 2;

export function PortfolioGallery({ photos }: { photos: readonly string[] }) {
  const styles = useStyles();
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);

  const groups: string[][] = [];
  for (let i = 0; i < photos.length; i += 3) groups.push(photos.slice(i, i + 3));

  const tile = (uri: string, index: number, height: number, showExpand = false) => (
    <Pressable
      key={uri + index}
      onPress={() => setViewerIndex(index)}
      accessibilityRole="imagebutton"
      accessibilityLabel={`Portfolio photo ${index + 1}`}
      style={[styles.tile, { height }]}
    >
      <Image source={{ uri }} style={styles.image} resizeMode="cover" />
      <View style={styles.fade} />
      {showExpand && (
        <View style={styles.expand}>
          <ExpandIcon />
        </View>
      )}
    </Pressable>
  );

  return (
    <View style={styles.grid}>
      {groups.map((group, g) => {
        const base = g * 3;
        if (group.length === 1) return <View key={g}>{tile(group[0], base, 240, true)}</View>;
        if (group.length === 2) {
          return (
            <View key={g} style={styles.row}>
              <View style={styles.col}>{tile(group[0], base, 220, true)}</View>
              <View style={styles.col}>{tile(group[1], base + 1, 220)}</View>
            </View>
          );
        }
        return (
          <View key={g} style={styles.row}>
            <View style={styles.col}>{tile(group[0], base, TALL, true)}</View>
            <View style={[styles.col, styles.stack]}>
              {tile(group[1], base + 1, SHORT)}
              {tile(group[2], base + 2, SHORT)}
            </View>
          </View>
        );
      })}

      <PhotoViewer photos={photos} index={viewerIndex} onClose={() => setViewerIndex(null)} />
    </View>
  );
}

function PhotoViewer({
  photos,
  index,
  onClose,
}: {
  photos: readonly string[];
  index: number | null;
  onClose: () => void;
}) {
  const styles = useStyles();
  const { colors } = useTheme();
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={index !== null} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <View style={styles.viewer}>
        {index !== null && (
          <FlatList
            data={photos}
            horizontal
            pagingEnabled
            initialScrollIndex={index}
            getItemLayout={(_, i) => ({ length: width, offset: width * i, index: i })}
            keyExtractor={(uri, i) => uri + i}
            showsHorizontalScrollIndicator={false}
            renderItem={({ item }) => (
              <Image source={{ uri: item }} style={{ width, height }} resizeMode="contain" />
            )}
          />
        )}
        <Pressable
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Close"
          style={[styles.viewerClose, { top: insets.top + 16 }]}
        >
          <X size={20} color={colors.text} />
        </Pressable>
      </View>
    </Modal>
  );
}

const useStyles = makeStyles(t => ({
  grid: { gap: GAP },
  row: { flexDirection: 'row', gap: GAP },
  col: { flex: 1 },
  stack: { gap: GAP },
  tile: {
    borderRadius: t.radii.xl,
    borderWidth: t.borderWidth.thin,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    backgroundColor: t.colors.cardInner,
    overflow: 'hidden',
  },
  image: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  fade: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.7,
    backgroundImage: 'linear-gradient(to top, rgba(14, 14, 17, 0.9) 0%, rgba(14, 14, 17, 0) 50%)',
  },
  expand: {
    position: 'absolute',
    right: 10,
    bottom: 10,
    width: 28,
    height: 28,
    borderRadius: t.radii.full,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
  },
  viewerClose: {
    position: 'absolute',
    right: t.spacing.xl,
    width: 40,
    height: 40,
    borderRadius: t.radii.full,
    borderWidth: t.borderWidth.thin,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    backgroundColor: 'rgba(14, 14, 17, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
}));
