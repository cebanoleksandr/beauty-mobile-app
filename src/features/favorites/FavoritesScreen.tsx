import React from 'react';
import { ScreenPlaceholder } from '../../shared/ui';
import { useFavoriteIds } from './favoritesStore';

export function FavoritesScreen() {
  const ids = useFavoriteIds();
  return (
    <ScreenPlaceholder
      title="Favorites"
      text={
        ids.size
          ? `You have ${ids.size} saved master${ids.size === 1 ? '' : 's'}. Tip: turn on "Favorites only" in the map filters.`
          : 'Tap the bookmark on a master card to save them here.'
      }
    />
  );
}
