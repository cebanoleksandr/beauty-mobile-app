import React from 'react';
import { useTranslation } from '../../i18n';
import { ScreenPlaceholder } from '../../shared/ui';
import { useFavoriteIds } from './favoritesStore';

export function FavoritesScreen() {
  const ids = useFavoriteIds();
  const { t } = useTranslation();
  return (
    <ScreenPlaceholder
      title={t('favorites.title')}
      text={ids.size ? t('favorites.count', { count: ids.size }) : t('favorites.empty')}
    />
  );
}
